"""FastAPI backend — the UI-facing surface of the retirement copilot.

Endpoints:
  POST /chat                 run the LangGraph copilot and return an associate-ready response
  GET  /health               liveness + dependency status
  GET  /customers            list mock customers (demo convenience; non-agent path)
  GET  /customers/{id}       full mock record (demo convenience)
  POST /ingest               (re)ingest the approved RAG docs into pgvector
"""
from __future__ import annotations

import json
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.graph.workflow import get_graph
from app.mcp_client import client as mcp_client
from app.rag import embeddings, ingest, vector_store
from app.schemas.api import ChatRequest, ChatResponse, HealthResponse, IngestResponse

app = FastAPI(title="Fidelity Retirement Servicing Copilot — Demo Backend", version="0.1.0")

# Permissive CORS for local UI development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mock customer file (same source the MCP server reads). Used ONLY by the
# /customers convenience endpoints — the agent path always goes through MCP.
_MOCK_PATH = Path(__file__).resolve().parents[2] / "mcp_server" / "data" / "mock_customers.json"


def _load_mock() -> dict:
    if not _MOCK_PATH.exists():
        return {}
    return json.loads(_MOCK_PATH.read_text())


@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    graph = get_graph()
    state = {
        "message": req.message,
        "customer_id": req.customer_id or "",
        "session_id": req.session_id or "",
        "trace": [],
        "errors": [],
    }
    result = await graph.ainvoke(state)
    return ChatResponse(**result["final"])


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    # DB
    try:
        chunks = vector_store.count()
        db_status = "ok"
    except Exception as exc:  # noqa: BLE001
        chunks, db_status = 0, f"error: {exc}"
    # MCP
    tools, mcp_status = await mcp_client.list_tools()
    mcp_state = "ok" if mcp_status == "ok" else mcp_status
    return HealthResponse(
        status="ok",
        db=db_status,
        mcp=f"{mcp_state} ({len(tools)} tools)" if tools else mcp_state,
        model_mode=settings.model_mode,
        default_model=settings.agent_model,
        corpus_chunks=chunks,
        embedding_mode=embeddings.embedding_mode(),
    )


@app.get("/customers")
def list_customers() -> list[dict]:
    out = []
    for cid, rec in _load_mock().items():
        out.append({
            "customer_id": cid,
            "name": rec.get("name"),
            "age": rec.get("age"),
            "veteran_status": rec.get("veteran_status"),
            "state": rec.get("state"),
            "has_existing_fidelity_ira": rec.get("has_existing_fidelity_ira"),
            "risk_flags": rec.get("risk_flags", []),
        })
    return out


@app.get("/customers/{customer_id}")
def get_customer(customer_id: str) -> dict:
    rec = _load_mock().get(customer_id)
    if not rec:
        raise HTTPException(status_code=404, detail=f"No mock customer '{customer_id}'.")
    return rec


@app.post("/ingest", response_model=IngestResponse)
def ingest_docs() -> IngestResponse:
    result = ingest.ingest()
    return IngestResponse(**result)
