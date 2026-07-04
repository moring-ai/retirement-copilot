"""Shared state for the LangGraph copilot workflow."""
from __future__ import annotations

from typing import Any, TypedDict


class CopilotState(TypedDict, total=False):
    # --- inputs ---
    message: str
    customer_id: str
    session_id: str

    # --- derived along the path ---
    parsed: dict[str, Any]            # extracted entities (name, id, intent keywords)
    classification: dict[str, Any]    # {category, is_customer_specific, confidence}
    rag_chunks: list[dict]            # [{chunk_id, doc_name, content, score}]
    required_tools: list[str]
    tool_results: dict[str, dict]     # tool_name -> result dict
    tools_called: list[dict]          # [{tool, status}]
    customer_found: bool
    needs_clarification: bool
    clarification_message: str

    synthesis: dict[str, Any]         # output of llm.synthesize
    model_mode: str                   # "live" | "fallback"
    guardrails: dict[str, Any]        # output of run_guardrails

    # --- Path A (Augmented LLM: RAG + Agent Skills, no MCP) ---
    pa_topic: str                     # sub-topic chosen by the deterministic gate
    pa_explanation: str               # explanation-skill output
    pa_checklist: dict[str, Any]      # checklist-skill output {next_steps, required_forms}
    chain_mode: str                   # "live" | "fallback" for the augmented-LLM skills

    skills_used: list[dict]           # [{skill, version, kind, status, flagged, detail}]

    final: dict[str, Any]             # the API response payload
    trace: list[dict]                 # [{step, status, detail}]
    errors: list[str]
