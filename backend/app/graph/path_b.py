"""Path B — Controlled Prompt Chain (P02) for standard rollover explanations.

This is the deterministic, template-driven path the router picks for *general*
rollover questions that are NOT tied to a specific customer. It needs approved
guidance (RAG) but **no live customer data** — so it calls no MCP tools.

Chain (fixed order, gate between steps, fail-fast):
    pb_gate      (deterministic validation gate + sub-topic selection)
      -> pb_explain   (LLM step 1: plain-language explanation, grounded + cited)
      -> pb_checklist (LLM step 2: standard next-steps + required forms; consumes
                       the explanation, assembles the synthesis dict)
      -> [reuses graph.nodes.guardrails_check -> format_final_response]

Each LLM step has a deterministic fallback (built from the retrieved chunks) so
Path B works fully offline, exactly like Path A's synthesizer.
"""
from __future__ import annotations

import json

from app.graph.nodes import _trace
from app.llm import client as llm_client

# --- deterministic sub-topic classifier (engineer-controlled selection) ------
_TOPIC_KEYWORDS = [
    ("direct_vs_indirect", ("direct", "indirect", "withholding", "60-day", "60 day")),
    ("required_forms", ("form", "forms", "paperwork", "document", "documents")),
    ("ira_opening", ("open", "opening", "new ira")),
]


def _classify_topic(message: str) -> str:
    low = message.lower()
    for topic, kws in _TOPIC_KEYWORDS:
        if any(kw in low for kw in kws):
            return topic
    return "general_steps"


def _citations(chunks: list[dict]) -> list[str]:
    return [c["chunk_id"] for c in chunks]


# --- node 1: validation gate ------------------------------------------------
def pb_gate(state: "dict") -> dict:
    chunks = state.get("rag_chunks", [])
    if not chunks:
        # Fail-fast: no approved guidance to ground an answer — stop before any
        # LLM call (this is the P02 validation gate).
        state["needs_clarification"] = True
        state["clarification_message"] = (
            "I don't have approved guidance available to answer this right now. "
            "Please ensure the RAG documents are ingested (POST /ingest) or rephrase "
            "the question."
        )
        _trace(state, "pb_gate", "ok", "no RAG chunks -> fail-fast clarification")
        return state
    topic = _classify_topic(state.get("message", ""))
    state["pb_topic"] = topic
    state["needs_clarification"] = False
    _trace(state, "pb_gate", "ok", f"grounded ({len(chunks)} chunks); topic={topic}")
    return state


# --- node 2: explanation (LLM step 1) ---------------------------------------
_EXPLAIN_SYSTEM = (
    "You are an internal servicing copilot for Fidelity associates. Produce a clear, "
    "neutral, plain-language explanation of a STANDARD 401(k)-to-IRA rollover topic "
    "that the associate can use. Ground every statement ONLY in the provided approved "
    "guidance and cite chunk ids like [ROLLOVER-SOP-01]. This is general guidance, NOT "
    "tied to any specific customer — do not invent customer details. No personalized "
    "investment advice, no tax/legal advice (defer tax questions to a qualified tax "
    "professional), and never describe moving money or executing trades."
)


def _fallback_explanation(topic: str, chunks: list[dict]) -> str:
    cited = ", ".join(_citations(chunks))
    lead = {
        "direct_vs_indirect": (
            "A 401(k)-to-IRA rollover can be done as a direct or an indirect rollover. "
            "In a direct rollover the funds move from the former employer's plan straight "
            "to the Fidelity IRA without being paid to the customer, which avoids mandatory "
            "withholding and the 60-day re-deposit requirement. An indirect rollover pays "
            "the funds to the customer first, who then has 60 days to deposit them into the "
            "IRA; it carries more timing and operational risk and is routed for closer review."
        ),
        "required_forms": (
            "A standard 401(k)-to-IRA rollover typically requires the source plan's "
            "rollover/distribution paperwork, a Fidelity IRA application if no suitable IRA "
            "exists yet, and a Fidelity rollover request form. Identity verification must be "
            "complete before servicing proceeds."
        ),
        "ira_opening": (
            "A rollover needs a destination Fidelity IRA to exist first. If the customer "
            "does not already hold a suitable Fidelity IRA, the associate guides them through "
            "opening one before initiating the rollover. Opening the IRA is an account-servicing "
            "action, not an investment recommendation."
        ),
        "general_steps": (
            "At a high level, a 401(k)-to-IRA rollover involves confirming whether the customer "
            "already has a Fidelity IRA (opening one first if not), confirming the source plan "
            "details and rollover eligibility, checking for any account restrictions, completing "
            "the required forms, and then submitting the rollover request. A direct rollover is "
            "the standard operational path."
        ),
    }.get(topic, "")
    return f"{lead} (Grounded in approved guidance: [{cited}].)"


def pb_explain(state: "dict") -> dict:
    chunks = state.get("rag_chunks", [])
    topic = state.get("pb_topic", "general_steps")
    guidance = "\n".join(f"[{c['chunk_id']}] ({c['doc_name']}) {c['content']}" for c in chunks)
    user = (
        f"Topic: {topic}\n\n"
        f"APPROVED GUIDANCE (cite these):\n{guidance}\n\n"
        f"ASSOCIATE QUESTION:\n{state.get('message', '')}\n\n"
        "Write the explanation now (2-5 sentences, plain language, with citations)."
    )
    text, mode = llm_client.prompt_chain_step(
        _EXPLAIN_SYSTEM, user, _fallback_explanation(topic, chunks)
    )
    state["pb_explanation"] = text
    state["chain_mode"] = mode
    _trace(state, "pb_explain", "ok", f"step 1 explanation (mode={mode})")
    return state


# --- node 3: checklist (LLM step 2, consumes the explanation) ---------------
_CHECKLIST_SYSTEM = (
    "You are an internal servicing copilot for Fidelity associates. Given an explanation "
    "of a standard 401(k)-to-IRA rollover, produce a STANDARD associate checklist. Ground "
    "it in the explanation/approved guidance; keep it general (not customer-specific). "
    "Respond with ONLY a JSON object: "
    '{"next_steps": string[], "required_forms": string[]}.'
)

_FALLBACK_NEXT_STEPS = [
    "Confirm whether the customer already holds a suitable Fidelity IRA; if not, open one first.",
    "Request the source-plan rollover/distribution paperwork from the former employer's plan provider.",
    "Complete the Fidelity rollover request form once the destination IRA exists.",
    "Prefer a direct rollover (funds move plan-to-IRA without being paid to the customer); route any indirect rollover for additional review.",
    "Refer any tax-specific questions to a qualified tax professional.",
]
_FALLBACK_FORMS = [
    "Fidelity IRA application (if a suitable IRA is not already open)",
    "Source-plan rollover/distribution paperwork",
    "Fidelity rollover request form",
]


def _build_customer_draft() -> str:
    return (
        "Here is a general overview of how a 401(k)-to-IRA rollover works: if you don't "
        "already have a Fidelity IRA, the first step is to open one. We then help you request "
        "the rollover paperwork from your former employer's plan and complete a Fidelity "
        "rollover request form. A direct rollover moves the funds without them being paid to "
        "you first. For any questions about how this affects your taxes, we recommend speaking "
        "with a qualified tax professional."
    )


def pb_checklist(state: "dict") -> dict:
    chunks = state.get("rag_chunks", [])
    explanation = state.get("pb_explanation", "")
    fallback_json = json.dumps(
        {"next_steps": _FALLBACK_NEXT_STEPS, "required_forms": _FALLBACK_FORMS}
    )
    user = (
        f"EXPLANATION (from the prior step):\n{explanation}\n\n"
        "Produce the standard checklist JSON now."
    )
    text, mode = llm_client.prompt_chain_step(_CHECKLIST_SYSTEM, user, fallback_json)
    try:
        parsed = llm_client.loads_lenient(text)
        next_steps = parsed.get("next_steps") or _FALLBACK_NEXT_STEPS
        required_forms = parsed.get("required_forms") or _FALLBACK_FORMS
    except json.JSONDecodeError:
        next_steps, required_forms = _FALLBACK_NEXT_STEPS, _FALLBACK_FORMS
        mode = "fallback"

    state["pb_checklist"] = {"next_steps": next_steps, "required_forms": required_forms}
    if mode == "fallback":
        state["chain_mode"] = "fallback"

    # Assemble the synthesis dict in the SAME shape Path A produces, so the shared
    # guardrails_check + format_final_response nodes handle the tail unchanged.
    state["synthesis"] = {
        "answer": explanation,
        "case_summary": "Standard 401(k)-to-IRA rollover explanation (general guidance; no specific customer).",
        "findings": [],
        "next_steps": next_steps,
        "required_forms": required_forms,
        "customer_draft": _build_customer_draft(),
        "compliance_notes": [],
        "citations": _citations(chunks),
    }
    state["model_mode"] = state.get("chain_mode", "fallback")
    _trace(state, "pb_checklist", "ok",
           f"step 2 checklist ({len(next_steps)} steps, mode={state['model_mode']})")
    return state
