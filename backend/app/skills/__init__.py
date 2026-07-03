"""Local skills registry package.

Importing the package registers every built-in skill as a side effect, so
callers can simply ``from app.skills import run_skill``.
"""
from app.skills.registry import REGISTRY, Skill, SkillResult, get, register, run_skill
from app.skills import builtin as _builtin  # noqa: F401  side-effect: registers skills

__all__ = ["REGISTRY", "Skill", "SkillResult", "get", "register", "run_skill"]
