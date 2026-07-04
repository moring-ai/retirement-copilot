# Retirement Copilot — AgentCore deployment

Packages the Fidelity Retirement Servicing Copilot (the full `backend/` LangGraph
app + `mcp_server/` tools) into a **single self-contained Bedrock AgentCore
runtime** that shows up in the AICP portal (traffic flows through its AI gateway).

## What runs in the container

| Concern | Local / docker-compose | AgentCore (this package) |
|---|---|---|
| API surface | FastAPI `/chat` | AgentCore `/ping` + `/invocations` (`agent.py`) |
| RAG store | Postgres + pgvector | in-process memory store (`RAG_BACKEND=memory`), ingested at startup |
| MCP tools | separate FastMCP process | same server, launched as a **localhost subprocess** (127.0.0.1:8100) |
| Synthesis LLM | OpenAI directly | **AICP AI gateway** (OpenAI-compatible) via `OPENAI_BASE_URL` + virtual key |
| Embeddings | sentence-transformers if present | deterministic hashed fallback (no ML deps in the image) |

The copilot's dual-backend design means it works even with **no LLM key** (the
deterministic template synthesizer runs and the smoke test still passes); with a
gateway virtual key wired in, Path A's Agent-Skill steps and Path B's synthesis
run live and are traced in the portal (tagged `agent:retirement-copilot`).

## Contract

**Input:** `{"prompt": "...", "customer_id": "CUST-1001"}` (`customer_id` optional —
it's also parsed out of the prompt).

**Output:** the copilot `ChatResponse` — `path`, `answer`, `case_summary`,
`findings`, `next_steps`, `required_forms`, `customer_draft`, `compliance_notes`,
`escalation_required`, `escalation_reasons`, `rag_sources`, `tools_called`, `trace`.

The front-door router picks the path:
- **Path A — Augmented LLM**: rollover, no specific customer → RAG + Agent Skills, no MCP; auto-runs to a reviewable draft.
- **Path B — Controlled Prompt Chain**: rollover + a specific customer → live MCP tool calls + grounded synthesis + guardrail checkpoints (human review on escalation).
- Customer-specific ask with no identifier → clarification.

## Deploy

Infra values (host, ECR, region) come from `agent-patterns/outputs.env` via
`lib-agentcore.sh` — same as the pattern deployments. AWS creds must be valid
(`aws sso login --profile moring`).

```bash
cd agentcore
AGENT=retirement-copilot \
KEY_SECRET=agent-platform/poc/keys/platform-admins--vignesh \
TEAMS=platform-admins \
bash deploy-agentcore.sh
```

The script cross-builds a `linux/arm64` image on the platform host, pushes to
ECR, creates the AgentCore runtime (env carries the gateway URL + virtual key +
`RAG_BACKEND=memory`), waits for `READY`, and prints the ARN + invoke command.

Override the gateway model with `MODEL=claude-sonnet` (default) — it maps to
`AGENT_MODEL` in the container.

## Test

```bash
# Local (build + run the image, then smoke test):
docker build -f Dockerfile -t rc-agentcore ..     # context = repo root
docker run --rm -p 8080:8080 -e OPENAI_BASE_URL=... -e OPENAI_API_KEY=... rc-agentcore
BASE_URL=http://localhost:8080 bash smoke_test.sh

# Against the deployed runtime:
AGENT_RUNTIME_ARN=<arn> bash smoke_test.sh
```

The smoke test covers all three router outcomes (clean Path B on CUST-1001,
escalating Path B on CUST-2002, Path A general explanation) plus the clarification
short-circuit.
