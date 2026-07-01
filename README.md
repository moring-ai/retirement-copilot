# Fidelity Retirement Servicing Copilot — Local Demo

An **internal associate copilot** for retirement servicing. A Fidelity associate
asks a question on behalf of a customer (e.g. "Robert Miller wants to roll over an
old 401(k) into a Fidelity IRA"); the copilot retrieves **approved guidance**,
pulls **per-customer system data**, reasons over both, and returns an
**associate-ready, compliant, grounded** response the associate reviews before
acting. The copilot never talks to the customer autonomously and never moves money.

A deterministic **front-door router** picks between two paths, and both converge on
the same guardrails + response contract:
- **Path A — Augmented LLM** (rollover question *about a specific customer*): live MCP
  tool lookups + RAG + reasoning.
- **Path B — Controlled Prompt Chain** (a *general* rollover explanation/checklist with
  no specific customer): a fixed prompt chain over approved guidance, **no MCP tools**.

The remaining future item — a skill-based validation chain replacing the lightweight
guardrails — is scaffolded as a TODO (`backend/app/future/prompt_chain.py`).

```
UI  →  FastAPI backend  →  LangGraph copilot graph  →  RAG (pgvector)
                                                     →  MCP tools (mock customer data)
                                                     →  guardrails  →  associate-ready JSON
```

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for the design and the RAG-vs-MCP
explanation, and **[DEMO_SCRIPT.md](DEMO_SCRIPT.md)** for a presentation walkthrough.

---

## What's in the box

| Layer | What it is | Where |
|---|---|---|
| **RAG** | Approved *static guidance* (SOPs, forms, tax boundaries, escalation policy), retrieved by similarity and **cited**. | `data/rag_docs/*.md` → pgvector |
| **MCP tools** | *Per-customer system data* (profile, accounts, plan, restrictions, docs, dry-run case write). | `mcp_server/` |
| **LangGraph** | Orchestration: 8 nodes, fixed path; the model only fills in content. | `backend/app/graph/` |
| **Guardrails** | Deterministic safety checks (PII, advice/tax/trade boundaries, escalation). | `backend/app/guardrails/checks.py` |
| **FastAPI** | The UI-facing API. | `backend/app/main.py` |

---

## Prerequisites
- Docker + Docker Compose
- Python 3.11+ (tested on 3.13)

The demo runs **with zero API keys**: without `OPENAI_API_KEY` it uses a
deterministic template synthesizer, and without `sentence-transformers` it uses a
deterministic hashed embedding. Both are real end-to-end (real pgvector search,
real MCP tool calls). Add a key / the model for higher-quality output.

---

## Run it locally (exact commands)

All commands are run from the project root: `retirement-copilot-demo/`.

### 1. Start the database (Postgres + pgvector)
```bash
docker compose up -d
```
Postgres listens on host port **5433** (to avoid clashing with a local Postgres on
5432). The `vector` extension is created automatically on first start.

### 2. Install dependencies
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt -r mcp_server/requirements.txt

# Optional, for higher-quality semantic retrieval (otherwise a deterministic
# hashed embedding is used automatically):
# pip install "sentence-transformers>=3,<4"
```

### 3. Configure env + seed mock data
```bash
cp .env.example .env          # optionally set OPENAI_API_KEY for live LLM
python scripts/seed_mock_data.py
```

### 4. Ingest the approved RAG docs into pgvector
```bash
python scripts/ingest_docs.py
# -> documents: 6, chunks: 32, embedding_mode: hash (or sentence-transformers)
```

### 5. Start the MCP tool server (terminal A)
```bash
python mcp_server/server.py
# -> streamable-HTTP at http://localhost:8100/mcp
```

### 6. Start the FastAPI backend (terminal B)
```bash
cd backend && uvicorn app.main:app --host 127.0.0.1 --port 8080
# (or from root:)  uvicorn app.main:app --app-dir backend --port 8080
```

### 7. Test
```bash
curl -s http://localhost:8080/health
bash scripts/smoke_test.sh          # runs all scenarios, expects 9 passed
```

---

## API contract (for the UI team)

### `POST /chat`
Request:
```json
{
  "message": "Customer Robert Miller wants to roll over an old 401(k) into a Fidelity IRA...",
  "customer_id": "CUST-1001",
  "session_id": "demo-session-1"
}
```
Response (stable shape):
```json
{
  "answer": "associate-ready narrative response",
  "case_summary": "short case summary",
  "findings": [ { "label": "Existing Fidelity IRA", "value": "None on file", "source": "check_existing_ira" } ],
  "next_steps": ["..."],
  "required_forms": ["..."],
  "customer_draft": "PII-redacted draft the associate can review/send",
  "compliance_notes": ["..."],
  "escalation_required": false,
  "escalation_reasons": [],
  "clarification_needed": false,
  "rag_sources": [ { "chunk_id": "ROLLOVER-SOP-01", "doc": "rollover_sop.md", "score": 0.32 } ],
  "tools_called": [ { "tool": "get_customer_profile", "status": "ok" } ],
  "trace": { "classification": {}, "parsed": {}, "steps": [], "tool_results": {}, "model_mode": "fallback", "errors": [] }
}
```
`trace` is a debug object for the UI (full step log + raw tool results + model mode);
treat the top-level fields as the contract and `trace` as informational.

### Other endpoints
| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | `{status, db, mcp, model_mode, default_model, corpus_chunks, embedding_mode}` |
| GET | `/customers` | List mock customers (demo convenience; non-agent path) |
| GET | `/customers/{customer_id}` | Full mock record |
| POST | `/ingest` | Re-ingest `data/rag_docs/` into pgvector |

---

## Example: successful customer scenario (CUST-1001 — clean path)

```bash
curl -s -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d '{
  "message": "Customer Robert Miller is a 65-year-old army veteran. He wants to roll over an old 401(k) into a Fidelity IRA. Check what is needed, whether he already has an IRA, whether there are restrictions, what forms are needed, and draft a compliant response.",
  "customer_id": "CUST-1001",
  "session_id": "demo-session-1"
}'
```
Expected (abridged):
```json
{
  "answer": "Based on the retrieved rollover guidance and the customer's account data, the associate can first confirm that Robert Miller does not currently have a Fidelity IRA. The next step is to guide the customer through opening an IRA before initiating the rollover request from the old Example Benefits Plan Services 401(k)...",
  "case_summary": "Robert Miller (age 65, Army veteran, Georgia) is requesting a 401(k)-to-IRA rollover from an old employer plan held at Example Benefits Plan Services.",
  "next_steps": [
    "Confirm the customer does not already hold a suitable Fidelity IRA, then guide them through opening a Fidelity IRA (required before the rollover).",
    "Request the source-plan rollover/distribution paperwork from Example Benefits Plan Services.",
    "Complete the Fidelity rollover request form once the destination IRA exists.",
    "Prefer a direct rollover ...; route any indirect rollover for additional review.",
    "For any tax-specific questions, refer the customer to a qualified tax professional."
  ],
  "required_forms": [
    "Fidelity IRA application (IRA must be opened first)",
    "Source-plan rollover/distribution paperwork (from Example Benefits Plan Services)",
    "Fidelity rollover request form"
  ],
  "escalation_required": false,
  "escalation_reasons": [],
  "rag_sources": [ {"chunk_id": "IRA-OPEN-02", "doc": "ira_opening_guidance.md", "score": 0.37}, ... ],
  "tools_called": [ {"tool":"get_customer_profile","status":"ok"}, ... 6 tools ... ]
}
```

## Example: escalation scenario (CUST-2002)

```bash
curl -s -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d '{
  "message": "Customer wants to roll over an old 401(k) into a Fidelity IRA. Check restrictions, forms, and draft a compliant response.",
  "customer_id": "CUST-2002",
  "session_id": "demo-session-2"
}'
```
Expected (abridged):
```json
{
  "answer": "Based on the retrieved rollover guidance and the customer's account data, this case should be escalated rather than processed as a standard rollover...",
  "escalation_required": true,
  "escalation_reasons": [
    "Account restriction: beneficiary dispute.",
    "Account restriction: address mismatch.",
    "Outstanding loan against the source 401(k) plan.",
    "Source-plan rollover eligibility is 'unknown' (not confirmed allowed).",
    "Source-plan details are incomplete or unavailable.",
    "Identity verification is 'incomplete'.",
    "Risk flag on account: beneficiary_dispute.",
    "Risk flag on account: address_mismatch."
  ],
  "next_steps": [
    "Pause standard rollover processing — this case requires escalation.",
    "Escalate to a retirement servicing specialist with the reasons below.",
    "Confirm/obtain the missing or unverified items before any rollover is initiated.",
    "Do not confirm rollover eligibility until source-plan details are verified."
  ]
}
```

## Example: standard explanation (Path B — no specific customer)

A general rollover question with **no `customer_id`** is routed to the prompt chain.
Note `path: "B_prompt_chain"` and `tools_called: []` (Path B never touches customer systems).

```bash
curl -s -X POST http://localhost:8080/chat -H "Content-Type: application/json" \
  -d '{"message":"Explain how a 401(k) to IRA rollover works and what forms are needed."}'
```
Expected (abridged):
```json
{
  "path": "B_prompt_chain",
  "answer": "A standard 401(k)-to-IRA rollover typically requires the source plan's rollover/distribution paperwork, a Fidelity IRA application if no suitable IRA exists yet, and a Fidelity rollover request form... (Grounded in approved guidance: [ROLLOVER-SOP-01, FORMS-06, ...].)",
  "next_steps": ["Confirm whether the customer already holds a suitable Fidelity IRA; if not, open one first.", "..."],
  "required_forms": ["Fidelity IRA application (if a suitable IRA is not already open)", "..."],
  "escalation_required": false,
  "rag_sources": [ {"chunk_id": "ROLLOVER-SOP-01", "doc": "rollover_sop.md"}, ... ],
  "tools_called": [],
  "trace": { "steps": [ "...", "pb_gate", "pb_explain", "pb_checklist", "..." ] }
}
```

## Example: missing-customer clarification
```bash
curl -s -X POST http://localhost:8080/chat -H "Content-Type: application/json" \
  -d '{"message":"Roll over a 401(k) into an IRA.","customer_id":"CUST-9999"}'
# -> { "clarification_needed": true, "answer": "I couldn't locate a customer record for 'CUST-9999'. Please confirm..." }
```

---

## Mock customers
| ID | Name | Profile | Outcome |
|---|---|---|---|
| `CUST-1001` | Robert Miller | 65, Army veteran, GA, no IRA, rollover allowed, no restrictions, identity verified | **Clean** — standard next steps |
| `CUST-2002` | Patricia Donovan | Has IRA, rollover eligibility unknown, outstanding plan loan, beneficiary dispute + address mismatch, identity incomplete | **Escalates** |

Edit `scripts/seed_mock_data.py` and re-run it to change/extend the data.

## Teardown
```bash
docker compose down        # add -v to also delete the pgvector volume
```

## Notes / non-goals
- **Mock data only** — no real Fidelity systems or data.
- **Auth is intentionally minimal** (local demo). The MCP tool layer is where
  least-privilege authorization would live in production.
- The single "write" tool (`create_or_update_service_case`) is a **dry-run** that
  returns a simulated case id and performs no real action.
