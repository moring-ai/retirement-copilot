"""Ingest the approved RAG documents into pgvector.

Each markdown doc is split into chunks by ``##`` section headings, given a stable
chunk id (e.g. ROLLOVER-SOP-02), embedded, and upserted. Re-ingest is safe: the
table is cleared first.
"""
from __future__ import annotations

import re
from pathlib import Path

from app.config import settings
from app.rag import embeddings, vector_store

# Stable per-document prefixes for chunk ids.
# NOTE: approved_customer_language.md is intentionally NOT here — approved
# customer-facing language is now an Agent Skill (customer_language_policy), not
# retrievable RAG knowledge. See backend/app/skills/agent_skills/.
_DOC_PREFIX = {
    "rollover_sop.md": "ROLLOVER-SOP",
    "ira_opening_guidance.md": "IRA-OPEN",
    "required_forms_guidance.md": "FORMS",
    "tax_advice_boundaries.md": "TAX-BOUNDARY",
    "escalation_policy.md": "ESCALATION",
}


def _chunk_markdown(text: str) -> list[str]:
    """Split on level-2 headings; keep the heading with its body. Falls back to
    the whole document if there are no ## sections."""
    parts = re.split(r"\n(?=## )", text.strip())
    chunks = [p.strip() for p in parts if p.strip()]
    return chunks or [text.strip()]


def build_rows(docs_dir: Path | None = None) -> list[dict]:
    docs_dir = docs_dir or settings.rag_docs_path
    rows: list[dict] = []
    for md_path in sorted(docs_dir.glob("*.md")):
        prefix = _DOC_PREFIX.get(md_path.name, md_path.stem.upper())
        chunks = _chunk_markdown(md_path.read_text())
        vectors = embeddings.embed(chunks)
        for i, (chunk, vec) in enumerate(zip(chunks, vectors), start=1):
            rows.append(
                {
                    "chunk_id": f"{prefix}-{i:02d}",
                    "doc_name": md_path.name,
                    "content": chunk,
                    "embedding": vec,
                }
            )
    return rows


def ingest(docs_dir: Path | None = None) -> dict:
    docs_dir = docs_dir or settings.rag_docs_path
    vector_store.init_schema()
    vector_store.clear()
    rows = build_rows(docs_dir)
    vector_store.upsert_chunks(rows)
    docs = sorted({r["doc_name"] for r in rows})
    return {
        "documents": len(docs),
        "doc_names": docs,
        "chunks": len(rows),
        "embedding_mode": embeddings.embedding_mode(),
        "embed_dim": settings.embed_dim,
    }
