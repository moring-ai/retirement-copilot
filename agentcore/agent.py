"""AgentCore entrypoint for the Fidelity Retirement Servicing Copilot.

Wraps the existing LangGraph copilot (router + Path A augmented-LLM + Path B
controlled prompt chain) in the Bedrock AgentCore HTTP contract:

    GET  /ping           liveness (AgentCore health probe)
    POST /invocations    run the copilot; payload {"prompt": ..., "customer_id"?: ...}

The full app is self-contained in this one container:
  * the FastMCP tool server runs as a localhost subprocess (127.0.0.1:8100),
  * RAG uses the in-process memory vector store (RAG_BACKEND=memory) ingested at
    startup — no Postgres attached,
  * synthesis calls the AICP AI gateway (OpenAI-compatible) via OPENAI_BASE_URL +
    OPENAI_API_KEY; with no key it runs the deterministic offline fallback.

Env (injected by deploy-agentcore.sh):
  OPENAI_BASE_URL, OPENAI_API_KEY, AGENT_MODEL, AGENT_NAME, AGENT_TEAMS,
  RAG_BACKEND=memory, MCP_SERVER_URL=http://127.0.0.1:8100/mcp, MCP_HOST/MCP_PORT
"""
from __future__ import annotations

import os
import sys
import time
import traceback
import urllib.request
from contextlib import asynccontextmanager
from subprocess import Popen

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# App code is copied to /app/app and /app/mcp_server; ensure both import cleanly.
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import settings  # noqa: E402
from app.graph.workflow import get_graph  # noqa: E402
from app.mcp_client import client as mcp_client  # noqa: E402
from app.rag import embeddings, ingest, vector_store  # noqa: E402

AGENT_NAME = settings.agent_name
MCP_HOST = os.getenv("MCP_HOST", "127.0.0.1")
MCP_PORT = int(os.getenv("MCP_PORT", "8100"))

_mcp_proc: Popen | None = None


def _start_mcp_server() -> None:
    """Launch the FastMCP tool server as a localhost subprocess and wait for it."""
    global _mcp_proc
    env = dict(os.environ, MCP_HOST=MCP_HOST, MCP_PORT=str(MCP_PORT))
    _mcp_proc = Popen([sys.executable, "-m", "mcp_server.server"], env=env)
    # FastMCP's streamable-HTTP returns 4xx/406 (not 200) to a bare GET, but any
    # HTTP response means the port is up and accepting connections.
    url = f"http://{MCP_HOST}:{MCP_PORT}/mcp"
    for _ in range(60):
        if _mcp_proc.poll() is not None:
            raise RuntimeError("MCP server subprocess exited during startup")
        try:
            urllib.request.urlopen(url, timeout=1)
            return
        except urllib.error.HTTPError:
            return  # server responded (with a 4xx) — it's up
        except Exception:
            time.sleep(0.5)
    raise RuntimeError(f"MCP server did not become ready at {url}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    _start_mcp_server()
    # Ingest the approved RAG corpus into the in-process store.
    result = ingest.ingest()
    print(f"[agentcore] RAG ingested: {result['chunks']} chunks "
          f"({result['embedding_mode']}); MCP up on {MCP_HOST}:{MCP_PORT}; "
          f"model_mode={settings.model_mode}", flush=True)
    # Warm the graph.
    get_graph()
    try:
        yield
    finally:
        if _mcp_proc and _mcp_proc.poll() is None:
            _mcp_proc.terminate()


app = FastAPI(title=f"agent-{AGENT_NAME}", lifespan=lifespan)


async def _run(prompt: str, customer_id: str = "") -> dict:
    graph = get_graph()
    state = {
        "message": prompt,
        "customer_id": customer_id or "",
        "session_id": "",
        "trace": [],
        "errors": [],
    }
    result = await graph.ainvoke(state)
    return result["final"]


# ---------------------------------------------------------------------------
# AgentCore HTTP contract
# ---------------------------------------------------------------------------
@app.get("/ping")
def ping():
    return {"status": "Healthy"}


@app.post("/invocations")
async def invocations(request: Request):
    try:
        payload = await request.json()
    except Exception:  # noqa: BLE001
        payload = {}
    prompt = payload.get("prompt") or payload.get("message") or payload.get("input") or ""
    customer_id = payload.get("customer_id") or ""
    if not prompt:
        return JSONResponse(status_code=400, content={"error": "payload needs a 'prompt'"})
    try:
        return await _run(prompt, customer_id)
    except Exception as e:  # noqa: BLE001
        print(f"[agentcore ERROR] {type(e).__name__}: {e}", flush=True)
        print(traceback.format_exc(), flush=True)
        return JSONResponse(
            status_code=502,
            content={"agent": AGENT_NAME, "error": f"{type(e).__name__}: {e}"},
        )


# ---------------------------------------------------------------------------
# Local test / health endpoints
# ---------------------------------------------------------------------------
class InvokeRequest(BaseModel):
    prompt: str
    customer_id: str | None = None


@app.get("/health")
async def health():
    tools, mcp_status = await mcp_client.list_tools()
    return {
        "status": "ok",
        "agent": AGENT_NAME,
        "app": "retirement-copilot",
        "runtime": "agentcore",
        "model_mode": settings.model_mode,
        "default_model": settings.agent_model,
        "gateway": settings.openai_base_url or "api.openai.com",
        "rag_backend": settings.rag_backend,
        "corpus_chunks": vector_store.count(),
        "embedding_mode": embeddings.embedding_mode(),
        "mcp": f"ok ({len(tools)} tools)" if tools else mcp_status,
    }


@app.post("/invoke")
async def invoke(req: InvokeRequest):
    try:
        return await _run(req.prompt, req.customer_id or "")
    except Exception as e:  # noqa: BLE001
        return JSONResponse(
            status_code=502,
            content={"agent": AGENT_NAME, "error": f"{type(e).__name__}: {e}"},
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
