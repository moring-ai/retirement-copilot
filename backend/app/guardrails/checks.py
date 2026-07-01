"""Lightweight deterministic guardrails (code-only).

This stands in for the future "skill-based validation prompt chain". It is
intentionally pure-code so model output cannot talk it out of a decision:

  - no personalized investment advice
  - no unsupported tax/legal advice
  - no trade execution / money movement
  - redact unnecessary PII from the customer-facing draft
  - escalation when restrictions / disputes / unclear tax treatment / missing data

Each check returns ``(flagged: bool, note: str)``. ``run_guardrails`` aggregates
them and produces redactions, compliance notes, and escalation results.
"""
from __future__ import annotations

import re

# --- Patterns ---------------------------------------------------------------
_INVESTMENT_ADVICE_RE = re.compile(
    r"\b(you should (buy|invest|allocate|put)|i recommend (buying|investing)|"
    r"allocate\s+\d+\s?%|best fund|guaranteed return|you'll earn)\b",
    re.IGNORECASE,
)
_TAX_ADVICE_RE = re.compile(
    r"\b(this will be tax[- ]free|you (won't|will not) owe (any )?tax|"
    r"no tax(es)? (will be|are) (due|owed)|tax[- ]free rollover)\b",
    re.IGNORECASE,
)
_TRADE_EXEC_RE = re.compile(
    r"\b(i (will|'ll|have) (execute|placed?|move|transfer|initiat)|"
    r"executing the trade|moving your (money|funds)|funds have been moved|"
    r"i transferred)\b",
    re.IGNORECASE,
)

# PII patterns (applied to the customer-facing draft only).
_SSN_RE = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
_SSN_LAST4_CTX_RE = re.compile(r"\b(?:ssn|social)[^\d]{0,12}(\d{4})\b", re.IGNORECASE)
_EMAIL_RE = re.compile(r"\b[\w.+-]+@[\w-]+\.[\w.-]+\b")
_PHONE_RE = re.compile(r"\+?\d[\d\-\(\) ]{7,}\d")
_ACCT_RE = re.compile(r"\b(?:FID-[A-Z]{3}-\d+|FID-IRA-\d+)\b")


# --- Individual checks ------------------------------------------------------
def check_no_personalized_investment_advice(text: str) -> tuple[bool, str]:
    if _INVESTMENT_ADVICE_RE.search(text):
        return True, "Removed/flagged personalized investment-advice language."
    return False, "No personalized investment advice detected."


def check_no_tax_legal_advice(text: str) -> tuple[bool, str]:
    if _TAX_ADVICE_RE.search(text):
        return True, "Removed/flagged unsupported tax-advice language; defer to a tax professional."
    return False, "No unsupported tax/legal advice detected."


def check_no_trade_execution_or_money_movement(text: str) -> tuple[bool, str]:
    if _TRADE_EXEC_RE.search(text):
        return True, "Removed/flagged trade-execution or money-movement language."
    return False, "No trade-execution or money-movement language detected."


def redact_pii(text: str) -> tuple[str, bool]:
    """Redact PII from a customer-facing draft. Returns (redacted_text, changed)."""
    original = text
    text = _SSN_RE.sub("[REDACTED-SSN]", text)
    text = _SSN_LAST4_CTX_RE.sub("SSN [REDACTED]", text)
    text = _EMAIL_RE.sub("[REDACTED-EMAIL]", text)
    text = _ACCT_RE.sub("[REDACTED-ACCT]", text)
    text = _PHONE_RE.sub("[REDACTED-PHONE]", text)
    return text, (text != original)


# --- Escalation -------------------------------------------------------------
def determine_escalation(tool_results: dict) -> list[str]:
    """Compute escalation reasons from MCP tool data.

    Designed so CUST-1001 (clean) returns [] and CUST-2002 (risky) escalates.
    Missing application/rollover forms are NOT escalation triggers — they are
    the associate's normal next step.
    """
    reasons: list[str] = []

    restrictions = tool_results.get("check_account_restrictions", {})
    if restrictions.get("has_restrictions"):
        for r in restrictions.get("account_restrictions", []):
            reasons.append(f"Account restriction: {r}.")

    plan = tool_results.get("get_source_plan_details", {})
    if plan:
        if plan.get("outstanding_plan_loan") is True:
            reasons.append("Outstanding loan against the source 401(k) plan.")
        rollover_allowed = plan.get("rollover_allowed")
        if rollover_allowed is not True:
            reasons.append(
                f"Source-plan rollover eligibility is '{rollover_allowed}' (not confirmed allowed)."
            )
        if plan.get("plan_details_complete") is False:
            reasons.append("Source-plan details are incomplete or unavailable.")

    docs = tool_results.get("get_document_or_case_status", {})
    if docs:
        idv = docs.get("identity_verification")
        if idv and idv != "complete":
            reasons.append(f"Identity verification is '{idv}'.")

    profile = tool_results.get("get_customer_profile", {})
    if profile and profile.get("found") is False:
        reasons.append("Customer record could not be located (missing system data).")
    for flag in profile.get("risk_flags", []) or []:
        reason = f"Risk flag on account: {flag}."
        if reason not in reasons:
            reasons.append(reason)

    # de-dupe while preserving order
    seen = set()
    deduped = []
    for r in reasons:
        if r not in seen:
            seen.add(r)
            deduped.append(r)
    return deduped


# --- Aggregate --------------------------------------------------------------
def run_guardrails(synthesis: dict, rag_chunks: list[dict], tool_results: dict) -> dict:
    """Apply all guardrails. Returns merged compliance notes, redacted draft,
    escalation result, and citation list."""
    compliance_notes: list[str] = []
    flags: list[str] = []

    # Scan the full associate-facing text for advice/trade language.
    scan_text = " ".join(
        str(synthesis.get(f, ""))
        for f in ("answer", "case_summary", "customer_draft")
    ) + " " + " ".join(synthesis.get("next_steps", []))

    for check in (
        check_no_personalized_investment_advice,
        check_no_tax_legal_advice,
        check_no_trade_execution_or_money_movement,
    ):
        flagged, note = check(scan_text)
        compliance_notes.append(note)
        if flagged:
            flags.append(note)

    # Redact PII from the customer-facing draft only.
    draft = synthesis.get("customer_draft", "")
    redacted_draft, changed = redact_pii(draft)
    if changed:
        compliance_notes.append("PII redacted from the customer-facing draft.")
    else:
        compliance_notes.append("No PII requiring redaction found in the customer draft.")

    # Citations / grounding.
    rag_sources = [
        {"chunk_id": c["chunk_id"], "doc": c["doc_name"], "score": c.get("score")}
        for c in rag_chunks
    ]
    if rag_sources:
        compliance_notes.append(f"Response grounded in {len(rag_sources)} approved document chunk(s).")
    else:
        compliance_notes.append("WARNING: no approved source documents were retrieved for grounding.")

    # Escalation.
    escalation_reasons = determine_escalation(tool_results)

    return {
        "compliance_notes": compliance_notes,
        "flags": flags,
        "redacted_customer_draft": redacted_draft,
        "rag_sources": rag_sources,
        "escalation_required": bool(escalation_reasons),
        "escalation_reasons": escalation_reasons,
    }
