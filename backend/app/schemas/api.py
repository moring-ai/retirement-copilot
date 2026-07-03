"""Pydantic request/response models — the stable contract for the UI team."""
from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., description="Associate's free-text request.")
    customer_id: str | None = Field(None, description="e.g. CUST-1001 (optional if named in message).")
    session_id: str | None = Field(None, description="Opaque UI session id.")


class Finding(BaseModel):
    label: str
    value: str
    source: str  # which MCP tool produced it


class RagSource(BaseModel):
    chunk_id: str
    doc: str
    score: float | None = None


class ToolCalled(BaseModel):
    tool: str
    status: str  # "ok" | "error"


class SkillUsed(BaseModel):
    skill: str
    version: str
    kind: str  # "content" | "validation"
    status: str = "ok"  # "ok" | "error"
    flagged: bool = False
    detail: str = ""


class ChatResponse(BaseModel):
    path: str = "A_augmented_llm"  # "A_augmented_llm" | "B_prompt_chain"
    answer: str
    case_summary: str
    findings: list[Finding] = []
    next_steps: list[str] = []
    required_forms: list[str] = []
    customer_draft: str = ""
    compliance_notes: list[str] = []
    escalation_required: bool = False
    escalation_reasons: list[str] = []
    clarification_needed: bool = False
    rag_sources: list[RagSource] = []
    tools_called: list[ToolCalled] = []
    skills_used: list[SkillUsed] = []
    trace: dict[str, Any] = {}


class IngestResponse(BaseModel):
    documents: int
    doc_names: list[str]
    chunks: int
    embedding_mode: str
    embed_dim: int


class HealthResponse(BaseModel):
    status: str
    db: str
    mcp: str
    model_mode: str
    default_model: str
    corpus_chunks: int
    embedding_mode: str
