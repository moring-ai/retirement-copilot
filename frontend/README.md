# Retirement Case Workspace — Frontend

A polished, demo-ready front-end concept for the internal associate copilot. It is
**not a chatbot** — it's a guided **case workspace** where an associate handles a
401(k)-to-IRA rollover while an AI agent works underneath (eligibility checks,
document/form lookup, compliance review, response drafting) with its work exposed
as reviewable *evidence*.

- **Stack:** Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui-style primitives (Radix).
- **No backend required.** All data is mocked in `src/data/`, but the field names,
  MCP tool names, RAG document/chunk ids, and the response contract deliberately
  mirror the real backend (`../backend`, `../mcp_server`, `../data/rag_docs`) so the
  demo reads as authentic and could later be wired to `POST /chat`.

## Run

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build (zero TS errors)
```

## The interaction model (in place of a chat box)

The **Eligibility Check** step is the default view. Four gated action buttons drive
the demo — each simulates the agent working (staggered timeline, tool calls, sources,
confidence/risk) and flips the corresponding step status in the left sidebar:

1. **Run Eligibility Check** → findings, eligibility result, rollover path, confidence.
2. **Find Required Forms** → forms checklist + missing-info flags.
3. **Check Compliance** → guardrail notes / escalation decision.
4. **Generate Draft Response** → an editable, policy-grounded draft
   ("AI-generated draft — associate review required").

Two scenarios are included: `CUST-1001` Robert Miller (clean path) and `CUST-2002`
Patricia Donovan (escalation path) — see `src/data/customers.ts`.

## Layout

- **Header** — product name, case status, Save / Export / Submit.
- **Left** — 7-step case navigation with per-step status.
- **Center** — the guided workspace for the active step (structured cards, not messages).
- **Right** — Agent Evidence Panel (activity timeline, sources used, confidence/risk, tool calls).
- **Bottom** — Associate Review Queue (human-in-the-loop checklist).

The right evidence panel collapses into a header drawer below `xl`; the left nav
collapses into a drawer below `lg`.

## Source map

```
src/
  types.ts                 shared types (mirror the backend contract)
  data/                    customers, rag-source catalog, per-action scenario scripts
  state/                   useReducer store + context
  hooks/                   useSimulatedAgentRun (staggered agent simulation)
  components/
    ui/                    shadcn-style primitives
    layout/ sidebar/ steps/ eligibility/ evidence/ review-queue/ draft/
```
