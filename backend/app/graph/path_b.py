"""Path B — Controlled Prompt Chain (P02), now genuinely RAG + skills.

This is the deterministic path the router picks for *general* rollover questions
that are NOT tied to a specific customer. It needs approved guidance (RAG) but
**no live customer data** — so it calls no MCP tools.

Chain (fixed order, gate between steps, fail-fast):
    pb_gate      (deterministic validation gate + [skill] sub-topic selection)
      -> pb_explain   ([skill] plain-language explanation, grounded + cited)
      -> pb_checklist ([skill] standard next-steps + required forms; assembles synthesis)
      -> [reuses graph.nodes.guardrails_check -> format_final_response]

The content logic now lives in ``app.skills.builtin`` and is invoked through the
registry, so every step is audited in ``skills_used[]``. These node functions are
thin shims. Each skill has a deterministic fallback so Path B works fully offline.
"""
from __future__ import annotations

from app.graph.nodes import _trace
from app.skills import run_skill


# --- node 1: validation gate ------------------------------------------------
def pb_gate(state: "dict") -> dict:
    chunks = state.get("rag_chunks", [])
    if not chunks:
        # Fail-fast: no approved guidance to ground an answer — stop before any
        # LLM call (this is the P02 validation gate; a routing decision, not a skill).
        state["needs_clarification"] = True
        state["clarification_message"] = (
            "I don't have approved guidance available to answer this right now. "
            "Please ensure the RAG documents are ingested (POST /ingest) or rephrase "
            "the question."
        )
        _trace(state, "pb_gate", "ok", "no RAG chunks -> fail-fast clarification")
        return state
    run_skill(state, "pb_topic_select")
    state["needs_clarification"] = False
    _trace(state, "pb_gate", "ok",
           f"grounded ({len(chunks)} chunks); topic={state.get('pb_topic')}")
    return state


# --- node 2: explanation (skill) --------------------------------------------
def pb_explain(state: "dict") -> dict:
    run_skill(state, "pb_explain")
    return state


# --- node 3: checklist (skill, consumes the explanation) --------------------
def pb_checklist(state: "dict") -> dict:
    run_skill(state, "pb_checklist")
    return state
