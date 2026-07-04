"""Path status + remaining future work.

✅ DONE — Front-door router + both paths are IMPLEMENTED:
    - Router:        backend/app/graph/nodes.py::classify_request sets classification["path"],
                     and backend/app/graph/workflow.py::_route_path dispatches Path A vs Path B.

    ✅ Path A — Augmented LLM (RAG + Agent Skills, no MCP):
        - Chain nodes:   backend/app/graph/path_a.py  (pa_gate -> pa_explain -> pa_checklist)
        - Picked for *general* rollover questions NOT tied to a specific customer.
        - Low-friction: no MCP/customer data, no human-in-the-loop; auto-runs to a
          reviewable draft ("Submit for Review").

    ✅ Path B — Controlled Prompt Chain (RAG + MCP customer tools + guardrail checkpoints):
        - Chain nodes:   backend/app/graph/nodes.py  (decide_tools -> call_tools -> synthesize)
        - Picked for *customer-specific* rollover requests (id or name).
        - Calls the fixed batch of read-only MCP tools, validates the customer, drafts
          the response, runs guardrails, and escalates to human review on flags.

✅ DONE — Agent Skills registry + validation chain is IMPLEMENTED:
    - Registry:      backend/app/skills/registry.py  (Skill/SkillResult, register(), run_skill())
    - Skills:        backend/app/skills/builtin.py
        * content    — clarification_detector, pa_topic_select, rollover_response_style,
                       pa_checklist, customer_language_policy  (Path A is RAG + Agent Skills)
        * validation — pii_redaction, advice_boundary_check, citation_grounding_check,
                       escalation_detection, final_format  (reporters over guardrails/checks.py)
    - Markdown skills: backend/app/skills/agent_skills/customer_language_policy.md
                       (approved customer-facing language — now a skill, not a RAG doc).
    - Audit trail:   every skill appends to state['skills_used'] and mirrors into trace.steps;
                     surfaced on the API as ChatResponse.skills_used[] and trace.skills_used.
    The validation skills REPORT the deterministic guardrail outcome — run_guardrails
    remains the authoritative decision-maker, so escalation stays code-owned.
"""
from __future__ import annotations

# This module is now a documentation marker: Path A lives in graph/path_a.py, Path B
# (MCP chain) lives in graph/nodes.py, and the Agent Skills live in app/skills/. No
# runtime logic here.
