"""Path A — Augmented LLM (RAG + Agent Skills, no customer data).

This is the low-friction path the router picks for *general* rollover questions
that are NOT tied to a specific customer. It is a simple augmented LLM: the model
reasons over the associate query, the approved RAG knowledge base, and a set of
Agent Skills. It calls **no MCP / customer-data tools**, has **no human-in-the-loop
steps**, and auto-runs straight to a reviewable draft ("Submit for Review").

Chain (fixed order, gate first, fail-fast):
    pa_gate      (deterministic validation gate + [skill] clarification_detector
                  + sub-topic selection)
      -> pa_explain   ([skill] rollover_response_style: RAG-grounded, clearly
                       formatted rollover explanation, cited)
      -> pa_checklist ([skill] standard next-steps + required forms, then
                       [skill] customer_language_policy to shape the customer draft
                       in approved, customer-safe language; assembles synthesis)
      -> [reuses graph.nodes.guardrails_check -> format_final_response]

The content logic lives in ``app.skills.builtin`` and is invoked through the
registry, so every step is audited in ``skills_used[]``. These node functions are
thin shims. Each skill has a deterministic fallback so Path A works fully offline.
"""
from __future__ import annotations

from app.graph.nodes import _trace
from app.skills import run_skill


# --- node 1: validation gate ------------------------------------------------
def pa_gate(state: "dict") -> dict:
    chunks = state.get("rag_chunks", [])
    if not chunks:
        # Fail-fast: no approved guidance to ground an answer — stop before any
        # LLM call (this is the validation gate; a routing decision, not a skill).
        state["needs_clarification"] = True
        state["clarification_message"] = (
            "I don't have approved guidance available to answer this right now. "
            "Please ensure the RAG documents are ingested (POST /ingest) or rephrase "
            "the question."
        )
        _trace(state, "pa_gate", "ok", "no RAG chunks -> fail-fast clarification")
        return state

    # Agent Skill: does the general question carry enough to answer well?
    detect = run_skill(state, "clarification_detector")
    if detect.flagged:
        state["needs_clarification"] = True
        state.setdefault(
            "clarification_message",
            "Could you add a little more detail about the rollover topic you'd like "
            "explained (e.g. direct vs. indirect, required forms, or opening an IRA)?",
        )
        _trace(state, "pa_gate", "ok", "clarification_detector -> needs more info")
        return state

    run_skill(state, "pa_topic_select")
    state["needs_clarification"] = False
    _trace(state, "pa_gate", "ok",
           f"grounded ({len(chunks)} chunks); topic={state.get('pa_topic')}")
    return state


# --- node 2: explanation (skill) --------------------------------------------
def pa_explain(state: "dict") -> dict:
    run_skill(state, "rollover_response_style")
    return state


# --- node 3: checklist + approved language (skills, consume the explanation) -
def pa_checklist(state: "dict") -> dict:
    run_skill(state, "pa_checklist")
    run_skill(state, "customer_language_policy")
    return state
