"""Embedding provider with a deterministic offline fallback.

Primary: a local sentence-transformers model (no API key, runs offline once the
model is downloaded). Fallback: a deterministic hashed bag-of-words embedding of
the SAME dimension, so ingest and query always work even with zero ML deps
installed. Both expose the same ``embed(texts) -> list[list[float]]`` interface,
and both produce L2-normalized vectors so pgvector cosine distance is meaningful.
"""
from __future__ import annotations

import hashlib
import math
import re

from app.config import settings

_WORD_RE = re.compile(r"[a-z0-9]+")
_model = None
_mode = None  # "sentence-transformers" | "hash"


def _load_model():
    global _model, _mode
    if _mode is not None:
        return
    try:
        from sentence_transformers import SentenceTransformer  # type: ignore

        _model = SentenceTransformer(settings.embed_model)
        _mode = "sentence-transformers"
    except Exception:
        _model = None
        _mode = "hash"


def embedding_mode() -> str:
    _load_model()
    return _mode  # type: ignore[return-value]


def _normalize(vec: list[float]) -> list[float]:
    norm = math.sqrt(sum(v * v for v in vec))
    if norm == 0:
        return vec
    return [v / norm for v in vec]


def _hash_embed_one(text: str) -> list[float]:
    """Deterministic hashed bag-of-words embedding.

    Each token is hashed into a bucket in [0, dim); a second hash sets the sign.
    Lower retrieval quality than a real model, but fully deterministic, offline,
    and dependency-free — fine for a 6-document demo corpus.
    """
    dim = settings.embed_dim
    vec = [0.0] * dim
    for tok in _WORD_RE.findall(text.lower()):
        h = int(hashlib.md5(tok.encode()).hexdigest(), 16)
        bucket = h % dim
        sign = 1.0 if (h >> 8) & 1 else -1.0
        vec[bucket] += sign
    return _normalize(vec)


def embed(texts: list[str]) -> list[list[float]]:
    _load_model()
    if _mode == "sentence-transformers" and _model is not None:
        vectors = _model.encode(texts, normalize_embeddings=True)
        return [list(map(float, v)) for v in vectors]
    return [_hash_embed_one(t) for t in texts]


def embed_one(text: str) -> list[float]:
    return embed([text])[0]
