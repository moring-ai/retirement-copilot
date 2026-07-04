"""Built-in skills — the single home for Path A content logic + validation reporters.

Content skills power **Path A — Augmented LLM (RAG + Agent Skills, no MCP)**: the
RAG-grounded explanation/checklist prompt-chain plus the named Agent Skills
(``clarification_detector``, ``rollover_response_style``, ``customer_language_policy``).
Validation skills are thin reporters over the already-computed deterministic
guardrails result (they do NOT re-decide anything — ``run_guardrails`` stays the
single source of truth), recorded for the audit trail so the chain reads
end-to-end (used by both paths in the shared tail).

Some Agent Skills carry their policy as a markdown file under
``skills/agent_skills/`` (e.g. ``customer_language_policy.md``) — approved content
that used to live in the RAG corpus but is a *skill*, not retrievable knowledge.

Importing this module registers every skill as a side effect.
"""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

from app.llm import client as llm_client
from app.skills.registry import SkillResult, register

# Agent Skill policy files (markdown) live next to this module.
_AGENT_SKILLS_DIR = Path(__file__).resolve().parent / "agent_skills"


@lru_cache(maxsize=None)
def _load_agent_skill(name: str) -> str:
    """Load an Agent Skill's markdown policy (e.g. ``customer_language_policy``)."""
    path = _AGENT_SKILLS_DIR / f"{name}.md"
    try:
        return path.read_text()
    except OSError:
        return ""

# ---------------------------------------------------------------------------
# Content skills (Path A — Augmented LLM: RAG + Agent Skills)
# ---------------------------------------------------------------------------

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


@register("clarification_detector", "1.0.0", "content",
          "Agent Skill: detects when a general rollover question lacks enough detail to answer.")
def _skill_clarification_detector(state: dict, ctx: dict) -> SkillResult:
    """Deterministic sufficiency check for the general (Path A) question. Flags
    only genuinely sparse prompts so the happy path auto-runs without friction."""
    message = state.get("message", "").strip()
    words = [w for w in message.split() if w.strip()]
    # A bare keyword or two ("rollover", "401k rollover") is too thin to explain well.
    too_sparse = len(words) <= 2
    if too_sparse:
        state["clarification_message"] = (
            "Could you add a little more detail about the rollover topic you'd like "
            "explained (e.g. direct vs. indirect, required forms, or opening an IRA)?"
        )
        return SkillResult(note="question too sparse -> request more detail", flagged=True)
    return SkillResult(note="question has enough detail to answer", flagged=False)


@register("pa_topic_select", "1.0.0", "content",
          "Deterministic rollover sub-topic selection for the augmented-LLM chain.")
def _skill_topic_select(state: dict, ctx: dict) -> SkillResult:
    topic = _classify_topic(state.get("message", ""))
    state["pa_topic"] = topic
    return SkillResult(outputs={"topic": topic}, note=f"topic={topic}")


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


@register("rollover_response_style", "1.0.0", "content",
          "Agent Skill: RAG-grounded, clearly formatted plain-language rollover explanation.")
def _skill_explain(state: dict, ctx: dict) -> SkillResult:
    chunks = state.get("rag_chunks", [])
    topic = state.get("pa_topic", "general_steps")
    guidance = "\n".join(
        f"[{c['chunk_id']}] ({c['doc_name']}) {c['content']}" for c in chunks
    )
    user = (
        f"Topic: {topic}\n\n"
        f"APPROVED GUIDANCE (cite these):\n{guidance}\n\n"
        f"ASSOCIATE QUESTION:\n{state.get('message', '')}\n\n"
        "Write the explanation now (2-5 sentences, plain language, with citations)."
    )
    text, mode = llm_client.prompt_chain_step(
        _EXPLAIN_SYSTEM, user, _fallback_explanation(topic, chunks)
    )
    state["pa_explanation"] = text
    state["chain_mode"] = mode
    return SkillResult(outputs={"explanation": text}, note=f"explanation (mode={mode})")


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


@register("pa_checklist", "1.0.0", "content",
          "RAG-grounded standard next-steps + required-forms checklist.")
def _skill_checklist(state: dict, ctx: dict) -> SkillResult:
    chunks = state.get("rag_chunks", [])
    explanation = state.get("pa_explanation", "")
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

    state["pa_checklist"] = {"next_steps": next_steps, "required_forms": required_forms}
    if mode == "fallback":
        state["chain_mode"] = "fallback"

    # Assemble the synthesis dict in the SAME shape the Path B synthesize node
    # produces, so the shared guardrails_check + format_final_response tail is
    # unchanged. The customer_language_policy skill (next) shapes the draft.
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
    return SkillResult(
        outputs={"next_steps": next_steps, "required_forms": required_forms},
        note=f"checklist ({len(next_steps)} steps, mode={state['model_mode']})",
    )


# Deterministic "phrasings to avoid" from the approved-language Agent Skill — kept
# in sync with skills/agent_skills/customer_language_policy.md. The customer draft
# Path A produces is already approved language, so this normally passes clean; the
# check exists so the skill is a real gate, not a rubber stamp.
_AVOID_PHRASES = (
    "you should invest",
    "i recommend buying",
    "we recommend buying",
    "tax-free",
    "guarantee",
    "guaranteed",
    "has been moved",
    "will be moved automatically",
    "funds have been moved",
)


@register("customer_language_policy", "1.0.0", "content",
          "Agent Skill: enforce approved, customer-safe tone/language on the customer draft.")
def _skill_customer_language(state: dict, ctx: dict) -> SkillResult:
    """Loads the approved-language Agent Skill (markdown) and checks the customer
    draft against its 'phrasings to avoid'. This is the skill that replaced the
    old ``approved_customer_language`` RAG document — approved language is a
    *policy the copilot applies*, not knowledge it retrieves."""
    policy = _load_agent_skill("customer_language_policy")
    draft = state.get("synthesis", {}).get("customer_draft", "")
    low = draft.lower()
    hits = [p for p in _AVOID_PHRASES if p in low]
    loaded = bool(policy)
    if hits:
        # Flag for the audit trail; guardrails remain the authoritative redactor.
        note = f"draft contains disallowed phrasing: {', '.join(hits)}"
        return SkillResult(note=note, flagged=True)
    note = (
        "customer draft conforms to approved language policy"
        if loaded
        else "approved-language policy file missing; draft not policy-checked"
    )
    return SkillResult(note=note, flagged=not loaded)


# ---------------------------------------------------------------------------
# Validation skills (shared tail — reporters over the deterministic guardrails)
# ---------------------------------------------------------------------------


@register("pii_redaction", "1.0.0", "validation",
          "Redacts PII from the customer-facing draft (reports the guardrail outcome).")
def _skill_pii(state: dict, ctx: dict) -> SkillResult:
    g = state.get("guardrails", {})
    draft = state.get("synthesis", {}).get("customer_draft", "")
    redacted = g.get("redacted_customer_draft", draft)
    changed = redacted != draft
    note = "PII redacted from the customer draft." if changed else "No PII requiring redaction."
    return SkillResult(note=note, flagged=changed)


@register("advice_boundary_check", "1.0.0", "validation",
          "No personalized investment / tax / trade-execution language.")
def _skill_advice(state: dict, ctx: dict) -> SkillResult:
    flags = state.get("guardrails", {}).get("flags", [])
    note = "; ".join(flags) if flags else "No advice/tax/trade boundary hits."
    return SkillResult(note=note, flagged=bool(flags))


@register("citation_grounding_check", "1.0.0", "validation",
          "Response is grounded in >=1 approved RAG source.")
def _skill_citation(state: dict, ctx: dict) -> SkillResult:
    sources = state.get("guardrails", {}).get("rag_sources", [])
    note = (
        f"Grounded in {len(sources)} approved chunk(s)."
        if sources
        else "No approved sources retrieved for grounding."
    )
    return SkillResult(note=note, flagged=not sources)


@register("escalation_detection", "1.0.0", "validation",
          "Deterministic escalation decision from customer/system data.")
def _skill_escalation(state: dict, ctx: dict) -> SkillResult:
    reasons = state.get("guardrails", {}).get("escalation_reasons", [])
    note = (
        f"{len(reasons)} escalation reason(s) — routing to a specialist."
        if reasons
        else "No escalation triggers — clean to proceed."
    )
    return SkillResult(note=note, flagged=bool(reasons))


@register("final_format", "1.0.0", "validation",
          "Assembled the associate-ready response payload.")
def _skill_final_format(state: dict, ctx: dict) -> SkillResult:
    path = state.get("classification", {}).get("path", "A_augmented_llm")
    kind = "clarification" if state.get("needs_clarification") else "full response"
    return SkillResult(note=f"path={path}; {kind}")
