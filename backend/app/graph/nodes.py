"""LangGraph node functions: shared nodes + Path B (Controlled Prompt Chain).

Shared: parse, classify (ROUTER), retrieve_rag, guardrails_check, format.
Path B — Controlled Prompt Chain: decide_required_tools -> call_mcp_tools ->
synthesize_rollover_plan. This is the *customer-specific* path — it calls the
fixed batch of read-only MCP tools to ground the draft in live customer data,
then runs the shared guardrail checkpoints (which can escalate to human review).
Path A — Augmented LLM (RAG + Agent Skills, no MCP) lives in ``graph/path_a.py``.

Each node is a small, mostly-deterministic step; the model only fills in content
at the synthesis node. Every node appends a record to ``state['trace']`` so the
UI can show exactly what happened.
"""
from __future__ import annotations

import re

from app.config import settings
from app.guardrails import checks
from app.llm import client as llm_client
from app.mcp_client import client as mcp_client
from app.rag import retriever
from app.skills import run_skill

# Read tools called for a customer-specific rollover case on Path B (the write
# tool is intentionally excluded from the automatic path).
READ_TOOLS = [
    "get_customer_profile",
    "check_existing_ira",
    "list_retirement_accounts",
    "get_source_plan_details",
    "check_account_restrictions",
    "get_document_or_case_status",
]

_CUST_ID_RE = re.compile(r"\bCUST-\d+\b", re.IGNORECASE)
_NAME_RE = re.compile(r"\bcustomer\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})")
_ROLLOVER_KW = ("rollover", "roll over", "roll-over", "401k", "401(k)", "ira")

# Intent signals used by the router to tell a *general/educational* question apart
# from a *customer-servicing directive* — even when a customer_id is attached to
# the case. A general question ("what's the difference…", "how does…") should go
# to Path A (Augmented LLM) and never trigger a customer MCP lookup.
_GENERAL_MARKERS = (
    "what is", "what's", "what are", "what does", "how do", "how does", "how can",
    "how would", "why ", "explain", "difference between", "differences between",
    "generally", "in general", "overview", "tell me about", "walk me through",
    "can you explain", "vs ", "vs.", "versus", "compare", "what happens",
    "general question", "how a ", "how the ",
)
# Directives that clearly ask the copilot to act on THIS customer's account.
_DIRECTIVE_MARKERS = (
    "check eligibility", "check restrictions", "check the restrictions",
    "check what", "check whether", "check if", "draft a", "draft the",
    "draft a compliant", "draft response", "draft a response", "for this customer",
    "this customer", "their account", "his account", "her account",
    "process the rollover", "initiate", "open a case", "eligibility, restrictions",
    "restrictions, and forms", "check eligibility, restrictions",
)


def _detect_intent(msg: str) -> tuple[bool, bool]:
    """Return (is_general, is_directive) from the message text."""
    low = msg.lower()
    is_general = any(m in low for m in _GENERAL_MARKERS)
    is_directive = any(m in low for m in _DIRECTIVE_MARKERS)
    return is_general, is_directive


def _trace(state, step, status, detail):
    state.setdefault("trace", []).append({"step": step, "status": status, "detail": detail})


# --- 1. parse ---------------------------------------------------------------
def parse_user_request(state: "dict") -> dict:
    msg = state.get("message", "")
    cust_id = state.get("customer_id") or ""
    if not cust_id:
        m = _CUST_ID_RE.search(msg)
        if m:
            cust_id = m.group(0).upper()
    name_m = _NAME_RE.search(msg)
    parsed = {
        "customer_id": cust_id,
        "customer_name": name_m.group(1) if name_m else "",
        "rollover_keywords": [kw for kw in _ROLLOVER_KW if kw in msg.lower()],
    }
    state["parsed"] = parsed
    if cust_id:
        state["customer_id"] = cust_id
    _trace(state, "parse_user_request", "ok",
           f"id='{cust_id or '-'}' name='{parsed['customer_name'] or '-'}' "
           f"kw={parsed['rollover_keywords']}")
    return state


# --- 2. classify (ROUTER) ---------------------------------------------------
def classify_request(state: "dict") -> dict:
    # Front-door router (deterministic, INTENT-AWARE): choose the path before any
    # model call.
    #   rollover + general/educational intent -> Path A (Augmented LLM: RAG + Agent
    #        Skills only; no MCP), EVEN when a customer_id is attached to the case.
    #        A general question ("what's the difference…") must not trigger a
    #        customer lookup just because the case has a customer on it.
    #   rollover + customer-specific servicing -> Path B (Controlled Prompt Chain:
    #        RAG + fixed MCP customer tools + guardrail checkpoints; human review on
    #        escalation).
    #   not a rollover request -> "other" (clarification flow)
    parsed = state.get("parsed", {})
    message = state.get("message", "")
    is_rollover = bool(parsed.get("rollover_keywords"))
    has_customer = bool(parsed.get("customer_id") or parsed.get("customer_name"))
    is_general, is_directive = _detect_intent(message)

    # A request is "customer-specific servicing" only when it's tied to a customer
    # AND is not a purely general question. A general question wins even with a
    # customer_id present (unless it also carries an explicit servicing directive).
    is_customer_specific = has_customer and (is_directive or not is_general)

    if not is_rollover:
        path = "other"
    elif is_general and not is_directive:
        # General/educational rollover question -> Augmented LLM, no MCP.
        path = "A_augmented_llm"
    elif is_customer_specific:
        path = "B_prompt_chain"
    else:
        # Rollover, no customer and no directive -> general augmented answer.
        path = "A_augmented_llm"

    classification = {
        "category": "retirement_rollover_servicing" if is_rollover else "other",
        "is_customer_specific": is_customer_specific,
        "is_general_intent": is_general and not is_directive,
        "has_customer": has_customer,
        "confidence": 0.95 if is_rollover else 0.4,
        "path": path,
    }
    state["classification"] = classification
    detail = (
        f"path={path} · rollover={is_rollover} · general_intent={is_general and not is_directive}"
        f" · customer_specific={is_customer_specific} · has_customer={has_customer}"
    )
    _trace(state, "classify_request", "ok", detail)
    return state


# --- 3. retrieve RAG --------------------------------------------------------
def retrieve_rag_documents(state: "dict") -> dict:
    query = state.get("message", "")
    try:
        chunks = retriever.retrieve(query, settings.rag_top_k)
        state["rag_chunks"] = chunks
        _trace(state, "retrieve_rag_documents", "ok",
               f"{len(chunks)} chunks: {[c['chunk_id'] for c in chunks]}")
    except Exception as exc:  # noqa: BLE001
        state["rag_chunks"] = []
        state.setdefault("errors", []).append(f"rag: {exc}")
        _trace(state, "retrieve_rag_documents", "error", str(exc))
    return state


# --- 4. decide tools --------------------------------------------------------
def decide_required_tools(state: "dict") -> dict:
    classification = state.get("classification", {})
    parsed = state.get("parsed", {})
    if not classification.get("is_customer_specific"):
        state["required_tools"] = []
        state["needs_clarification"] = True
        state["clarification_message"] = (
            "This request isn't tied to a specific customer. Please provide a customer "
            "identifier (e.g. CUST-1001) or the customer's full name so I can look up "
            "their account details."
        )
        _trace(state, "decide_required_tools", "ok", "no customer identifier -> clarification")
        return state
    state["required_tools"] = list(READ_TOOLS)
    state["needs_clarification"] = False
    _trace(state, "decide_required_tools", "ok", f"queued {len(READ_TOOLS)} read tools")
    return state


# --- 5. call MCP tools ------------------------------------------------------
async def call_mcp_tools(state: "dict") -> dict:
    identifier = state.get("customer_id") or state.get("parsed", {}).get("customer_name", "")
    tool_results: dict = {}
    tools_called: list[dict] = []
    for tool in state.get("required_tools", []):
        data, status = await mcp_client.call_tool(tool, {"identifier": identifier})
        tool_results[tool] = data
        tools_called.append({"tool": tool, "status": status})
    state["tool_results"] = tool_results
    state["tools_called"] = tools_called

    profile = tool_results.get("get_customer_profile", {})
    customer_found = bool(profile.get("found"))
    state["customer_found"] = customer_found
    if not customer_found:
        state["needs_clarification"] = True
        state["clarification_message"] = (
            f"I couldn't locate a customer record for '{identifier}'. Please confirm the "
            "customer identifier (e.g. CUST-1001) or full name."
        )
        _trace(state, "call_mcp_tools", "ok", f"customer NOT found for '{identifier}'")
    else:
        _trace(state, "call_mcp_tools", "ok",
               f"called {len(tools_called)} tools; customer found: {profile.get('name')}")
    return state


# --- 6. synthesize ----------------------------------------------------------
def synthesize_rollover_plan(state: "dict") -> dict:
    synthesis, mode = llm_client.synthesize(
        message=state.get("message", ""),
        classification=state.get("classification", {}),
        rag_chunks=state.get("rag_chunks", []),
        tool_results=state.get("tool_results", {}),
    )
    state["synthesis"] = synthesis
    state["model_mode"] = mode
    _trace(state, "synthesize_rollover_plan", "ok", f"mode={mode}")
    return state


# --- 7. guardrails ----------------------------------------------------------
def guardrails_check(state: "dict") -> dict:
    result = checks.run_guardrails(
        synthesis=state.get("synthesis", {}),
        rag_chunks=state.get("rag_chunks", []),
        tool_results=state.get("tool_results", {}),
    )
    state["guardrails"] = result
    _trace(state, "guardrails_check", "ok",
           f"escalation={result['escalation_required']} flags={len(result['flags'])}")

    # Skill-based validation chain (audit trail). These skills REPORT the
    # already-computed guardrail outcome — they do not re-decide anything, so the
    # authoritative escalation/redaction decisions remain owned by run_guardrails.
    for skill in (
        "pii_redaction",
        "advice_boundary_check",
        "citation_grounding_check",
        "escalation_detection",
    ):
        run_skill(state, skill)
    return state


# --- 8. format --------------------------------------------------------------
def format_final_response(state: "dict") -> dict:
    path = state.get("classification", {}).get("path", "A_augmented_llm")
    # Terminal audit marker — closes the skills_used trail end-to-end.
    run_skill(state, "final_format")
    skills_used = state.get("skills_used", [])
    trace = {
        "classification": state.get("classification", {}),
        "parsed": state.get("parsed", {}),
        "steps": state.get("trace", []),
        "tool_results": state.get("tool_results", {}),
        "skills_used": skills_used,
        "model_mode": state.get("chain_mode") or state.get("model_mode", settings.model_mode),
        "errors": state.get("errors", []),
    }

    # Clarification short-circuit (lookup failed or no identifier).
    if state.get("needs_clarification"):
        msg = state.get("clarification_message", "Additional information is required.")
        rag_sources = [
            {"chunk_id": c["chunk_id"], "doc": c["doc_name"], "score": c.get("score")}
            for c in state.get("rag_chunks", [])
        ]
        state["final"] = {
            "path": path,
            "answer": msg,
            "case_summary": "Clarification required before the case can proceed.",
            "findings": [],
            "next_steps": ["Obtain a valid customer identifier and resubmit the request."],
            "required_forms": [],
            "customer_draft": "",
            "compliance_notes": ["Customer lookup incomplete; no customer-specific data used."],
            "escalation_required": False,
            "escalation_reasons": [],
            "clarification_needed": True,
            "rag_sources": rag_sources,
            "tools_called": state.get("tools_called", []),
            "skills_used": skills_used,
            "trace": trace,
        }
        _trace(state, "format_final_response", "ok", "clarification response")
        return state

    synthesis = state.get("synthesis", {})
    guardrails = state.get("guardrails", {})

    # Guardrails own the authoritative compliance notes, redacted draft, sources,
    # and escalation decision.
    compliance_notes = guardrails.get("compliance_notes", [])
    if synthesis.get("compliance_notes"):
        compliance_notes = synthesis["compliance_notes"] + compliance_notes

    state["final"] = {
        "path": path,
        "answer": synthesis.get("answer", ""),
        "case_summary": synthesis.get("case_summary", ""),
        "findings": synthesis.get("findings", []),
        "next_steps": synthesis.get("next_steps", []),
        "required_forms": synthesis.get("required_forms", []),
        "customer_draft": guardrails.get("redacted_customer_draft", synthesis.get("customer_draft", "")),
        "compliance_notes": compliance_notes,
        "escalation_required": guardrails.get("escalation_required", False),
        "escalation_reasons": guardrails.get("escalation_reasons", []),
        "clarification_needed": False,
        "rag_sources": guardrails.get("rag_sources", []),
        "tools_called": state.get("tools_called", []),
        "skills_used": skills_used,
        "trace": trace,
    }
    _trace(state, "format_final_response", "ok", "full response")
    return state
