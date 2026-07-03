"""Path B status + remaining future work.

✅ DONE — Path B (Controlled Prompt Chain) is now IMPLEMENTED:
    - Chain nodes:   backend/app/graph/path_b.py  (pb_gate -> pb_explain -> pb_checklist)
    - Router:        backend/app/graph/nodes.py::classify_request sets classification["path"],
                     and backend/app/graph/workflow.py::_route_path dispatches Path A vs Path B.
    The router picks Path B for standard rollover questions that are NOT tied to a
    specific customer (no MCP tools; approved-guidance RAG only).

✅ DONE — Skill-Based Skills registry + validation chain is now IMPLEMENTED:
    - Registry:      backend/app/skills/registry.py  (Skill/SkillResult, register(), run_skill())
    - Skills:        backend/app/skills/builtin.py
        * content    — pb_topic_select, pb_explain, pb_checklist  (Path B is now RAG + skills)
        * validation — pii_redaction, advice_boundary_check, citation_grounding_check,
                       escalation_detection, final_format  (reporters over guardrails/checks.py)
    - Audit trail:   every skill appends to state['skills_used'] and mirrors into trace.steps;
                     surfaced on the API as ChatResponse.skills_used[] and trace.skills_used.
    The validation skills REPORT the deterministic guardrail outcome — run_guardrails
    remains the authoritative decision-maker, so escalation stays code-owned.
"""
from __future__ import annotations

# This module is now a documentation marker: Path B lives in graph/path_b.py and the
# skill-based validation chain lives in app/skills/. No runtime logic here.
