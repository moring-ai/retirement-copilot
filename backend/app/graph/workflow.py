"""Builds the LangGraph copilot workflow with a front-door router.

    parse -> classify (ROUTER) -> retrieve_rag -> _route_path
                                                       |
        Path A (customer-specific) ------------------- | decide_tools -> call_tools
                                                       |     -> synthesize
        Path B (general explanation) ----------------- | pb_gate -> pb_explain
                                                       |     -> pb_checklist
                                                       v
                                  guardrails_check -> format_final_response (END)

Both paths converge on the shared guardrails + formatter. Path A adds live MCP
customer data; Path B (Controlled Prompt Chain) uses approved guidance only.
"""
from __future__ import annotations

from langgraph.graph import END, StateGraph

from app.graph import nodes, path_b
from app.graph.state import CopilotState

_compiled = None


def _route_path(state: dict) -> str:
    """Front-door router: dispatch on the path chosen in classify_request."""
    path = state.get("classification", {}).get("path", "A_augmented_llm")
    return "path_b" if path == "B_prompt_chain" else "path_a"


def _route_after_gate(state: dict) -> str:
    return "clarify" if state.get("needs_clarification") else "explain"


def _route_after_decide(state: dict) -> str:
    return "clarify" if state.get("needs_clarification") else "call_tools"


def _route_after_tools(state: dict) -> str:
    return "clarify" if state.get("needs_clarification") else "synthesize"


def build_graph():
    g = StateGraph(CopilotState)

    g.add_node("parse", nodes.parse_user_request)
    g.add_node("classify", nodes.classify_request)
    g.add_node("retrieve_rag", nodes.retrieve_rag_documents)
    # Path A
    g.add_node("decide_tools", nodes.decide_required_tools)
    g.add_node("call_tools", nodes.call_mcp_tools)
    g.add_node("synthesize", nodes.synthesize_rollover_plan)
    # Path B (Controlled Prompt Chain)
    g.add_node("pb_gate", path_b.pb_gate)
    g.add_node("pb_explain", path_b.pb_explain)
    g.add_node("pb_build_checklist", path_b.pb_checklist)
    # Shared tail
    g.add_node("guardrails_check", nodes.guardrails_check)
    g.add_node("format", nodes.format_final_response)

    g.set_entry_point("parse")
    g.add_edge("parse", "classify")
    g.add_edge("classify", "retrieve_rag")

    # Router: Path A vs Path B (both already have RAG chunks at this point).
    g.add_conditional_edges(
        "retrieve_rag", _route_path,
        {"path_a": "decide_tools", "path_b": "pb_gate"},
    )

    # Path A
    g.add_conditional_edges(
        "decide_tools", _route_after_decide,
        {"clarify": "format", "call_tools": "call_tools"},
    )
    g.add_conditional_edges(
        "call_tools", _route_after_tools,
        {"clarify": "format", "synthesize": "synthesize"},
    )
    g.add_edge("synthesize", "guardrails_check")

    # Path B
    g.add_conditional_edges(
        "pb_gate", _route_after_gate,
        {"clarify": "format", "explain": "pb_explain"},
    )
    g.add_edge("pb_explain", "pb_build_checklist")
    g.add_edge("pb_build_checklist", "guardrails_check")

    # Shared tail
    g.add_edge("guardrails_check", "format")
    g.add_edge("format", END)

    return g.compile()


def get_graph():
    global _compiled
    if _compiled is None:
        _compiled = build_graph()
    return _compiled
