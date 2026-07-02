"""pgvector-backed vector store.

This is the real RAG store: a Postgres table with a ``vector`` column and cosine
distance search. (In the sibling 03-skills-mcp-rag pattern this was an in-memory
token-overlap stub behind SWAP markers — here we implement the swapped-in store.)
"""
from __future__ import annotations

from app.config import settings

TABLE = "rag_chunks"


def _use_memory() -> bool:
    return settings.rag_backend.lower() == "memory"


# ---------------------------------------------------------------------------
# In-memory backend (no external DB) — used on AgentCore, where the container
# has no attached Postgres. Vectors are already L2-normalized by the embedder,
# so cosine similarity is a plain dot product. The 6-doc corpus is tiny, so a
# linear scan is more than fast enough.
# ---------------------------------------------------------------------------
_MEM: list[dict] = []  # [{chunk_id, doc_name, content, embedding: list[float]}]


def _mem_search(query_embedding: list[float], k: int) -> list[dict]:
    scored = []
    for row in _MEM:
        emb = row["embedding"]
        sim = sum(a * b for a, b in zip(query_embedding, emb))
        scored.append((sim, row))
    scored.sort(key=lambda t: t[0], reverse=True)
    return [
        {"chunk_id": r["chunk_id"], "doc_name": r["doc_name"], "content": r["content"],
         "score": round(float(sim), 4)}
        for sim, r in scored[:k]
    ]


def _connect():
    import psycopg
    from pgvector.psycopg import register_vector

    conn = psycopg.connect(settings.database_url)
    register_vector(conn)
    return conn


def init_schema() -> None:
    """Create the extension (idempotent) and the chunks table at the configured dim."""
    if _use_memory():
        return  # nothing to create for the in-memory backend
    with _connect() as conn, conn.cursor() as cur:
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        cur.execute(
            f"""
            CREATE TABLE IF NOT EXISTS {TABLE} (
                id          SERIAL PRIMARY KEY,
                chunk_id    TEXT UNIQUE NOT NULL,
                doc_name    TEXT NOT NULL,
                content     TEXT NOT NULL,
                embedding   vector({settings.embed_dim}) NOT NULL
            );
            """
        )
        conn.commit()


def clear() -> None:
    if _use_memory():
        _MEM.clear()
        return
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(f"TRUNCATE {TABLE} RESTART IDENTITY;")
        conn.commit()


def upsert_chunks(rows: list[dict]) -> int:
    """rows: [{chunk_id, doc_name, content, embedding: list[float]}]"""
    if _use_memory():
        by_id = {r["chunk_id"]: r for r in _MEM}
        for r in rows:
            by_id[r["chunk_id"]] = {
                "chunk_id": r["chunk_id"], "doc_name": r["doc_name"],
                "content": r["content"], "embedding": list(r["embedding"]),
            }
        _MEM[:] = list(by_id.values())
        return len(rows)
    with _connect() as conn, conn.cursor() as cur:
        for r in rows:
            cur.execute(
                f"""
                INSERT INTO {TABLE} (chunk_id, doc_name, content, embedding)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (chunk_id) DO UPDATE
                  SET doc_name = EXCLUDED.doc_name,
                      content = EXCLUDED.content,
                      embedding = EXCLUDED.embedding;
                """,
                (r["chunk_id"], r["doc_name"], r["content"], r["embedding"]),
            )
        conn.commit()
    return len(rows)


def search(query_embedding: list[float], k: int) -> list[dict]:
    """Top-k by cosine distance. Returns chunk dicts with a 0..1 similarity score."""
    if _use_memory():
        return _mem_search(query_embedding, k)
    with _connect() as conn, conn.cursor() as cur:
        cur.execute(
            f"""
            SELECT chunk_id, doc_name, content,
                   1 - (embedding <=> %s::vector) AS similarity
            FROM {TABLE}
            ORDER BY embedding <=> %s::vector
            LIMIT %s;
            """,
            (query_embedding, query_embedding, k),
        )
        rows = cur.fetchall()
    return [
        {"chunk_id": cid, "doc_name": doc, "content": content, "score": round(float(sim), 4)}
        for (cid, doc, content, sim) in rows
    ]


def count() -> int:
    if _use_memory():
        return len(_MEM)
    try:
        with _connect() as conn, conn.cursor() as cur:
            cur.execute(f"SELECT COUNT(*) FROM {TABLE};")
            return int(cur.fetchone()[0])
    except Exception:
        return 0
