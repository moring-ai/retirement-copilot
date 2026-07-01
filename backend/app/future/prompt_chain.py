"""Path B status + remaining future work.

✅ DONE — Path B (Controlled Prompt Chain) is now IMPLEMENTED:
    - Chain nodes:   backend/app/graph/path_b.py  (pb_gate -> pb_explain -> pb_checklist)
    - Router:        backend/app/graph/nodes.py::classify_request sets classification["path"],
                     and backend/app/graph/workflow.py::_route_path dispatches Path A vs Path B.
    The router picks Path B for standard rollover questions that are NOT tied to a
    specific customer (no MCP tools; approved-guidance RAG only).

🔜 STILL FUTURE — Skill-Based Validation prompt chain:
    Today, guardrails/checks.py is a lightweight, code-only safety layer shared by both
    paths. It will later graduate into a versioned, skill-based validation prompt chain
    (PII redaction, advice/tax boundary, compliance/approved-language review,
    citation/grounding check, escalation detection, final formatting), with each skill
    logged to a `skills_used` audit trail. That is the remaining scaffold item.
"""
from __future__ import annotations

# This module is intentionally a no-op marker now that Path B lives in graph/path_b.py.
# It tracks the one remaining future workflow (skill-based validation chain).
