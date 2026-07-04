# Agent Skill: customer_language_policy

**Kind:** content · **Applies to:** Path A (Augmented LLM) and any customer-facing draft
**Purpose:** Ensure every customer-facing draft uses approved, customer-safe tone and
language. This is a *policy the copilot applies to its own output* — not retrievable
knowledge — which is why it lives here as an Agent Skill rather than in the RAG corpus.

## Principles
Customer-facing language must be neutral, factual, and free of personalized
investment recommendations. It describes process and options; it does not tell
the customer what to buy, how to allocate, or guarantee outcomes.

## Approved phrasings
- "We can help you roll over your former employer's 401(k) into a Fidelity IRA."
- "Based on our records, the next step would be to open a Fidelity IRA, since
  one is not currently on file."
- "A direct rollover moves the funds without them being paid to you first, which
  many customers find simpler. We can walk you through the available options."
- "To proceed, we'll need to complete the IRA application and the rollover
  request form."
- "For questions about how this affects your taxes, we recommend speaking with a
  qualified tax professional."

## Phrasings to avoid
- Any "you should invest in ..." or "I recommend buying ..." statement.
- Any guarantee of a tax result ("this will be tax-free").
- Any promise that the rollover is approved before plan details are confirmed.
- Any statement that funds have been or will be moved automatically.

## Tone
Helpful, plain-language, and clearly framed as assistance the associate is
offering — never as the system making promises or executing actions on its own.

## How this skill is applied
The `customer_language_policy` skill (see `backend/app/skills/builtin.py`) loads this
file and checks the assembled customer draft against the "Phrasings to avoid" list,
recording the result in the `skills_used[]` audit trail. The authoritative PII
redaction and advice/tax/trade guardrails still run in `guardrails/checks.py`.
