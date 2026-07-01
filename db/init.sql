-- Runs once on first container start (docker-entrypoint-initdb.d).
-- The rag_chunks table itself is created idempotently by the ingest code
-- (rag/vector_store.py) so the dimension can follow the configured embedder.
CREATE EXTENSION IF NOT EXISTS vector;
