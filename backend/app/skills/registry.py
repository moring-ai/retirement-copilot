"""A tiny, local, in-process skills registry.

This graduates the ``future/prompt_chain.py`` scaffold into a real (still
deterministic, still code-owned) skill layer with a ``skills_used`` audit trail.
A skill is a named + versioned Python callable with a uniform signature
``fn(state, ctx) -> SkillResult``. Skills fall into two families:

  - **content** skills — Path B's RAG-grounded prompt-chain steps (so Path B is
    genuinely "RAG + skills").
  - **validation** skills — thin reporters over the deterministic guardrails,
    recorded for the audit trail (PII, advice boundary, citation grounding,
    escalation, final format).

``run_skill`` invokes a skill, appends a structured record to
``state['skills_used']``, and mirrors a line into the existing ``_trace`` so the
presenter's backstage overlay stays coherent. Nothing here changes the graph
topology, the router, or the authoritative guardrail decisions — it is a thin
orchestration + audit layer, fully additive.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable


@dataclass
class SkillResult:
    """What a skill reports back for the audit trail."""

    outputs: dict[str, Any] = field(default_factory=dict)
    note: str = ""
    status: str = "ok"  # "ok" | "error"
    flagged: bool = False


@dataclass(frozen=True)
class Skill:
    name: str
    version: str
    kind: str  # "content" | "validation"
    summary: str
    fn: Callable[[dict, dict], SkillResult]


REGISTRY: dict[str, Skill] = {}


def register(name: str, version: str, kind: str, summary: str):
    """Decorator: register a plain ``fn(state, ctx) -> SkillResult`` as a skill."""

    def deco(fn: Callable[[dict, dict], SkillResult]):
        REGISTRY[name] = Skill(name=name, version=version, kind=kind, summary=summary, fn=fn)
        return fn

    return deco


def get(name: str) -> Skill | None:
    return REGISTRY.get(name)


def _record(state: dict, name: str, version: str, kind: str, result: SkillResult) -> None:
    entry = {
        "skill": name,
        "version": version,
        "kind": kind,
        "status": result.status,
        "flagged": result.flagged,
        "detail": result.note,
    }
    state.setdefault("skills_used", []).append(entry)
    # Mirror into the per-step trace. Imported lazily to avoid a circular import
    # (nodes.py imports this module).
    try:
        from app.graph.nodes import _trace

        _trace(state, f"skill:{name}", result.status, result.note)
    except Exception:  # noqa: BLE001 — tracing is best-effort
        pass


def run_skill(state: dict, name: str, ctx: dict | None = None) -> SkillResult:
    """Resolve, run, and audit a skill. Never raises — errors fail-safe so the
    graph can't 500 because of the audit layer."""
    skill = REGISTRY.get(name)
    if skill is None:
        result = SkillResult(status="error", note=f"unknown skill '{name}'")
        _record(state, name, "?", "?", result)
        return result
    try:
        result = skill.fn(state, ctx or {})
        if result is None:  # defensive: a skill that forgets to return
            result = SkillResult()
    except Exception as exc:  # noqa: BLE001 — fail-safe to existing behavior
        result = SkillResult(status="error", note=f"{type(exc).__name__}: {exc}")
    _record(state, skill.name, skill.version, skill.kind, result)
    return result
