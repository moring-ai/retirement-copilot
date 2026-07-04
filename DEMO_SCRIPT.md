# Demo Script — Fidelity Retirement Servicing Copilot

A ~7-minute walkthrough you can present live. Have two terminals ready and the
backend + MCP server already running (see README steps 1–6).

---

## 0. Setup (before the audience, 30s)
- `docker compose up -d` — Postgres + pgvector
- MCP server running (`python mcp_server/server.py`)
- Backend running (`uvicorn app.main:app --app-dir backend --port 8080`)
- `curl -s localhost:8080/health | jq` → show `db: ok`, `mcp: ok (7 tools)`,
  `corpus_chunks: 27` (approved customer language is now an Agent Skill, not RAG), `model_mode`.

> **Talking point:** "Everything is local and mock — no real Fidelity systems. The
> copilot helps the *associate*, who stays in the loop. It never talks to the
> customer or moves money."

---

## 1. Frame the problem (45s)
"An associate is on the phone with **Robert Miller, a 65-year-old Army veteran**,
who wants to roll an old 401(k) into a Fidelity IRA. The associate needs a fast,
*compliant, grounded* answer: what's needed, does he already have an IRA, any
restrictions, which forms, and a draft reply — without giving investment or tax
advice."

---

## 2. The clean scenario — CUST-1001 (Path B) (2 min)
> Customer-specific → the router picks **Path B — Controlled Prompt Chain** (RAG + MCP customer tools + guardrail checkpoints).
Run:
```bash
curl -s -X POST localhost:8080/chat -H "Content-Type: application/json" -d '{
  "message": "Customer Robert Miller is a 65-year-old army veteran. He wants to roll over an old 401(k) into a Fidelity IRA. Check what is needed, whether he already has an IRA, restrictions, forms, and draft a compliant response.",
  "customer_id": "CUST-1001", "session_id": "demo-1"
}' | jq
```
Walk through the response top-to-bottom:
- **case_summary / findings** — "These came from **MCP tools**: no existing IRA,
  rollover allowed, no restrictions, identity verified, forms missing."
- **next_steps** — "Open the IRA *first*, then the rollover request. Note it says
  *prefer a direct rollover* — that's grounded in the SOP."
- **required_forms** — the checklist.
- **customer_draft** — "Neutral, no recommendations, defers tax questions to a
  professional — this is the associate-ready draft."
- **rag_sources** — "Every claim is grounded in **approved documents**, cited by id."
- **tools_called / trace** — "Full audit trail: which tools ran, what they returned,
  and which model mode produced the answer."
- **escalation_required: false** — "Clean case, standard guidance."

> **Talking point — RAG vs MCP:** "RAG = what we're *allowed to say* (policy). MCP =
> what's *true for this customer*. The copilot reasons over both."

---

## 3. The escalation scenario — CUST-2002 / Patricia (Path B, human review) (1.5 min)
> Still Path B; guardrail flags surface the **human-in-the-loop review** controls.
Run:
```bash
curl -s -X POST localhost:8080/chat -H "Content-Type: application/json" -d '{
  "message": "Customer wants to roll over an old 401(k) into a Fidelity IRA. Check restrictions and draft a response.",
  "customer_id": "CUST-2002", "session_id": "demo-2"
}' | jq '{escalation_required, escalation_reasons, next_steps, customer_draft}'
```
- **escalation_required: true** with concrete reasons: beneficiary dispute, address
  mismatch, outstanding plan loan, unknown rollover eligibility, incomplete identity.
- **next_steps** flip to "pause and escalate" — *not* clean proceed-as-normal steps.
- **customer_draft** stays neutral and promises a specialist follow-up.

> **Talking point:** "Same workflow, very different outcome — the **guardrails**
> detected risk from the system data and routed to a **human review** instead of a
> confident-but-wrong answer. The associate stays in control; nothing is sent."

---

## 4. The safety rails (1 min)
- "Missing *forms* didn't trigger escalation (that's normal servicing) — but missing
  *identity verification* and *restrictions* did. The rules are deterministic code,
  not the model's discretion."
- Optional: show PII redaction — the draft never leaks SSN / account / email / phone,
  even though the associate sees them in `findings`/`trace`.
- "No investment advice, no tax advice, no money movement — enforced after the model
  runs, in code."

---

## 5. Path A — the router picks the Augmented LLM (1.5 min)
Now ask a *general* question with **no customer**:
```bash
curl -s -X POST localhost:8080/chat -H "Content-Type: application/json" \
  -d '{"message":"Explain how a 401(k) to IRA rollover works and what forms are needed."}' \
  | jq '{path, tools_called, escalation_required, rag_sources: [.rag_sources[].chunk_id], skills: [.skills_used[].skill], steps: [.trace.steps[].step]}'
```
- **path: "A_augmented_llm"** — "Same front door, different route. The router saw no
  specific customer, so it chose the low-friction **Augmented LLM** (RAG + Agent Skills)
  instead of the customer-data Prompt Chain."
- **tools_called: []** — "Path A touches **no customer systems** — it answers purely
  from approved guidance (RAG) + Agent Skills. That's the RAG-vs-MCP split in action."
- **skills_used** — "The Agent Skills: `clarification_detector`, `rollover_response_style`,
  and `customer_language_policy` (approved customer-safe language — now a *skill*, not a
  RAG doc)."
- **steps show `pa_gate → pa_explain → pa_build_checklist`** — "A fixed chain: a
  deterministic gate (fail-fast if there's no grounding, or if the question is too sparse),
  then explain, then build the checklist — each step feeds the next. No MCP, no
  human-in-the-loop: it auto-runs to a reviewable draft."
- Same guardrails and same response contract as Path B (just `path` differs).

> **Talking point:** "General question → Path A (augmented LLM: RAG + Agent Skills,
> predictable, cheaper, no system access). Customer-specific → Path B (controlled prompt
> chain: live data + guardrail checkpoints). One router, one contract, two engines."

---

## 6. Lookup failure / clarification (30s)
```bash
curl -s -X POST localhost:8080/chat -H "Content-Type: application/json" \
  -d '{"message":"Roll over a 401(k) into an IRA.","customer_id":"CUST-9999"}' | jq '{clarification_needed, answer}'
```
"No guessing — if it can't find the customer, it asks the associate for a valid id."

---

## 7. Where this goes next (30s)
- **Skill-based validation chain** replacing the lightweight guardrails, with a
  `skills_used` audit trail (the remaining scaffold item in `future/prompt_chain.py`).
- **Live LLM**: set `OPENAI_API_KEY` and `model_mode` flips to `live` — same
  contract, richer synthesis on both paths.

> **Close:** "Auditable by design, human-in-the-loop, grounded and bounded — and it
> runs entirely locally on mock data."
