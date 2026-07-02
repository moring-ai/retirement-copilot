"""Synthesis layer: turn RAG + MCP context into an associate-ready plan.

Two interchangeable backends, same output schema:
  - LIVE: OpenAI (when OPENAI_API_KEY is set).
  - FALLBACK: a deterministic template synthesizer (no key, fully offline).

Output dict schema (consumed by the graph + guardrails):
  {answer, case_summary, findings[], next_steps[], required_forms[],
   customer_draft, compliance_notes[], citations[]}
"""
from __future__ import annotations

import json
import re

from app.config import settings
from app.guardrails.checks import determine_escalation

_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```$", re.IGNORECASE)


def loads_lenient(text: str) -> dict:
    """Parse a JSON object from a model response.

    Tolerates markdown ```json fences and leading/trailing prose by extracting
    the outermost {...}. Raises json.JSONDecodeError if nothing parses — callers
    fall back to deterministic synthesis. This replaces reliance on the OpenAI
    ``response_format={"type":"json_object"}`` flag, which the AICP gateway
    (LiteLLM -> Anthropic) does not honor (it returns an empty object).
    """
    s = _FENCE_RE.sub("", text.strip())
    try:
        return json.loads(s)
    except json.JSONDecodeError:
        start, end = s.find("{"), s.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(s[start:end + 1])
        raise

SYSTEM_PROMPT = (
    "You are an internal servicing copilot for Fidelity associates handling "
    "retirement 401(k)-to-IRA rollover cases. You are NOT talking to the customer; "
    "you produce an associate-ready response the associate reviews before acting.\n\n"
    "Rules:\n"
    "- Ground every claim in the provided approved guidance chunks and cite their "
    "chunk ids (e.g. [ROLLOVER-SOP-02]).\n"
    "- No personalized investment advice; no specific funds or allocations.\n"
    "- No tax or legal advice; defer tax questions to a qualified tax professional.\n"
    "- Never execute trades or move money; describe steps the associate can take.\n"
    "- Do not guarantee rollover eligibility unless the source-plan details confirm it.\n"
    "- Frame the answer as assistance for the associate, not promises to the customer.\n"
    "- If escalation reasons are provided, lead with escalation and do NOT give clean "
    "proceed-as-normal next steps.\n\n"
    "Respond with ONLY a JSON object with these exact keys: "
    '{"answer": string, "case_summary": string, '
    '"findings": [{"label": string, "value": string, "source": string}], '
    '"next_steps": string[], "required_forms": string[], '
    '"customer_draft": string, "compliance_notes": string[], "citations": string[]}'
)


def _context_block(rag_chunks: list[dict], tool_results: dict, escalation_reasons: list[str]) -> str:
    rag = "\n".join(
        f"[{c['chunk_id']}] ({c['doc_name']}) {c['content']}" for c in rag_chunks
    ) or "No approved guidance retrieved."
    tools = json.dumps(tool_results, indent=2)
    esc = "\n".join(f"- {r}" for r in escalation_reasons) or "None."
    return (
        f"APPROVED GUIDANCE (RAG, cite these):\n{rag}\n\n"
        f"CUSTOMER / SYSTEM DATA (MCP tools):\n{tools}\n\n"
        f"ESCALATION REASONS (computed by guardrails):\n{esc}"
    )


# ---------------------------------------------------------------------------
# Deterministic fallback
# ---------------------------------------------------------------------------
def _deterministic_synthesize(
    message: str, rag_chunks: list[dict], tool_results: dict, escalation_reasons: list[str]
) -> dict:
    profile = tool_results.get("get_customer_profile", {})
    ira = tool_results.get("check_existing_ira", {})
    plan = tool_results.get("get_source_plan_details", {})
    docs = tool_results.get("get_document_or_case_status", {})

    name = profile.get("name", "the customer")
    age = profile.get("age")
    vet = profile.get("veteran_status", "")
    state = profile.get("state", "")
    has_ira = ira.get("has_existing_fidelity_ira")
    source_plan = plan.get("source_plan", {})
    provider = source_plan.get("plan_provider", "the source plan provider")

    citations = [c["chunk_id"] for c in rag_chunks]

    case_summary = (
        f"{name}"
        + (f" (age {age}" if age else "")
        + (f", {vet}" if vet else "")
        + (f", {state}" if state else "")
        + (")" if age else "")
        + " is requesting a 401(k)-to-IRA rollover from an old employer plan"
        + (f" held at {provider}." if provider else ".")
    )

    findings = [
        {"label": "Existing Fidelity IRA", "value": ("Yes" if has_ira else "None on file"),
         "source": "check_existing_ira"},
        {"label": "Source plan provider", "value": str(provider), "source": "get_source_plan_details"},
        {"label": "Rollover eligibility", "value": str(plan.get("rollover_allowed")),
         "source": "get_source_plan_details"},
        {"label": "Outstanding plan loan", "value": str(plan.get("outstanding_plan_loan")),
         "source": "get_source_plan_details"},
        {"label": "Account restrictions",
         "value": (", ".join(tool_results.get("check_account_restrictions", {})
                              .get("account_restrictions", [])) or "None"),
         "source": "check_account_restrictions"},
        {"label": "Identity verification", "value": str(docs.get("identity_verification")),
         "source": "get_document_or_case_status"},
        {"label": "Missing documents",
         "value": (", ".join(docs.get("missing_documents", [])) or "None"),
         "source": "get_document_or_case_status"},
    ]

    # Required forms / checklist.
    required_forms = []
    missing = docs.get("missing_documents", [])
    if not has_ira:
        required_forms.append("Fidelity IRA application (IRA must be opened first)")
    if "ira_application" in missing and has_ira:
        required_forms.append("Fidelity IRA application")
    required_forms.append("Source-plan rollover/distribution paperwork (from "
                          f"{provider})")
    required_forms.append("Fidelity rollover request form")

    if escalation_reasons:
        next_steps = [
            "Pause standard rollover processing — this case requires escalation.",
            "Escalate to a retirement servicing specialist with the reasons below.",
            "Confirm/obtain the missing or unverified items before any rollover is initiated.",
            "Do not confirm rollover eligibility until source-plan details are verified.",
        ]
        answer = (
            f"Based on the retrieved rollover guidance and the customer's account data, this "
            f"case should be escalated rather than processed as a standard rollover. "
            f"The associate should not give the customer definitive next steps that assume the "
            f"rollover can proceed. Escalation is driven by: "
            + "; ".join(escalation_reasons)
            + f" (see [{', '.join(citations)}])."
        )
        customer_draft = (
            f"Hello {name}, thank you for reaching out about rolling over your former "
            f"employer's 401(k). We want to make sure we handle this correctly, so a "
            f"specialist on our team will review a few details on your account before we "
            f"proceed. We'll follow up with the next steps shortly. For any questions about "
            f"how this may affect your taxes, we recommend speaking with a qualified tax "
            f"professional."
        )
    else:
        next_steps = []
        if not has_ira:
            next_steps.append(
                "Confirm the customer does not already hold a suitable Fidelity IRA, then "
                "guide them through opening a Fidelity IRA (required before the rollover)."
            )
        next_steps.append(
            "Request the source-plan rollover/distribution paperwork from "
            f"{provider}."
        )
        next_steps.append(
            "Complete the Fidelity rollover request form once the destination IRA exists."
        )
        next_steps.append(
            "Prefer a direct rollover (funds move plan-to-IRA without being paid to the "
            "customer); route any indirect rollover for additional review."
        )
        next_steps.append(
            "For any tax-specific questions, refer the customer to a qualified tax professional."
        )
        answer = (
            f"Based on the retrieved rollover guidance and the customer's account data, the "
            f"associate can first confirm that {name} does not currently have a Fidelity IRA. "
            f"The next step is to guide the customer through opening an IRA before initiating "
            f"the rollover request from the old {provider} 401(k). The source plan shows "
            f"rollover eligibility as allowed and no restrictions or outstanding plan loan, so "
            f"the case can proceed with standard next steps once the IRA application and "
            f"rollover request form are completed (see [{', '.join(citations)}])."
        )
        customer_draft = (
            f"Hello {name}, we'd be glad to help you roll over your former employer's 401(k) "
            f"into a Fidelity IRA. Based on our records, the first step would be to open a "
            f"Fidelity IRA, since one isn't currently on file. After that, we'll help you "
            f"complete the rollover request paperwork. A direct rollover moves the funds "
            f"without them being paid to you first, and we can walk you through the available "
            f"options. For any questions about how this affects your taxes, we recommend "
            f"speaking with a qualified tax professional."
        )

    return {
        "answer": answer,
        "case_summary": case_summary,
        "findings": findings,
        "next_steps": next_steps,
        "required_forms": required_forms,
        "customer_draft": customer_draft,
        "compliance_notes": [],  # authoritative notes are added by the guardrails layer
        "citations": citations,
    }


# ---------------------------------------------------------------------------
# OpenAI (live)
# ---------------------------------------------------------------------------
def _make_client():
    """Construct an OpenAI client (honors an optional OpenAI-compatible base URL)."""
    from openai import OpenAI

    kwargs = {"api_key": settings.openai_api_key}
    if settings.openai_base_url:
        kwargs["base_url"] = settings.openai_base_url
    return OpenAI(**kwargs)


def _trace_meta(step: str) -> dict:
    """Extra request fields so calls are attributable in the AICP AI gateway.

    Only meaningful when pointed at the LiteLLM gateway (which reads
    ``metadata``); harmless when talking straight to OpenAI.
    """
    agent = settings.agent_name
    teams = [t.strip() for t in settings.agent_teams.split(",") if t.strip()]
    tags = [f"agent:{agent}", "app:retirement-copilot", "runtime:agentcore"] + [
        f"team:{t}" for t in teams
    ]
    return {
        "user": f"agent:{agent}",
        "extra_body": {
            "metadata": {
                "trace_user_id": f"agent:{agent}",
                "trace_name": f"agent-{agent}",
                "generation_name": f"agent-{agent}-{step}",
                "tags": tags,
                "agent": agent,
            }
        },
    }


def _openai_synthesize(
    message: str, rag_chunks: list[dict], tool_results: dict, escalation_reasons: list[str]
) -> dict:
    client = _make_client()

    user_content = (
        f"{_context_block(rag_chunks, tool_results, escalation_reasons)}\n\n"
        f"ASSOCIATE REQUEST:\n{message}\n\n"
        "Produce the JSON response now."
    )
    resp = client.chat.completions.create(
        model=settings.agent_model,
        max_tokens=1500,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        **_trace_meta("synthesize"),
    )
    text = (resp.choices[0].message.content or "").strip()
    try:
        data = loads_lenient(text)
    except json.JSONDecodeError:
        # Fall back gracefully rather than failing the request.
        data = _deterministic_synthesize(message, rag_chunks, tool_results, escalation_reasons)
        data["compliance_notes"] = ["LLM returned non-JSON; used deterministic fallback synthesis."]
    return data


def synthesize(
    message: str,
    classification: dict,
    rag_chunks: list[dict],
    tool_results: dict,
) -> tuple[dict, str]:
    """Return (synthesis_dict, mode) where mode is 'live' or 'fallback'."""
    escalation_reasons = determine_escalation(tool_results)
    if settings.openai_api_key:
        try:
            return _openai_synthesize(message, rag_chunks, tool_results, escalation_reasons), "live"
        except Exception as exc:  # noqa: BLE001
            data = _deterministic_synthesize(message, rag_chunks, tool_results, escalation_reasons)
            data["compliance_notes"] = [f"LLM call failed ({type(exc).__name__}); used fallback."]
            return data, "fallback"
    return _deterministic_synthesize(message, rag_chunks, tool_results, escalation_reasons), "fallback"


# ---------------------------------------------------------------------------
# Prompt-chain primitive (Path B)
# ---------------------------------------------------------------------------
def prompt_chain_step(system: str, user: str, fallback_text: str) -> tuple[str, str]:
    """One plain-text LLM step for the Controlled Prompt Chain (Path B).

    Returns (text, mode). Uses OpenAI when keyed; otherwise (and on any error)
    returns the caller-provided deterministic ``fallback_text`` so the chain works
    fully offline. This mirrors the dual-backend approach used by ``synthesize``.
    """
    if not settings.openai_api_key:
        return fallback_text, "fallback"
    try:
        client = _make_client()
        resp = client.chat.completions.create(
            model=settings.agent_model,
            max_tokens=900,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            **_trace_meta("prompt-chain"),
        )
        text = (resp.choices[0].message.content or "").strip()
        return (text or fallback_text), ("live" if text else "fallback")
    except Exception:  # noqa: BLE001
        return fallback_text, "fallback"
