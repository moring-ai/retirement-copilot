"""Query-time retrieval over the pgvector store."""
from __future__ import annotations

from app.config import settings
from app.rag import embeddings, vector_store


def retrieve(query: str, k: int | None = None) -> list[dict]:
    """Embed the query and return the top-k cited chunks.

    Returns: [{chunk_id, doc_name, content, score}], highest similarity first.
    """
    k = k or settings.rag_top_k
    if not query.strip():
        return []
    q_vec = embeddings.embed_one(query)
    return vector_store.search(q_vec, k)
