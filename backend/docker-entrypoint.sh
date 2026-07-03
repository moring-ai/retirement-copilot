#!/usr/bin/env bash
# Ingest the approved RAG docs into pgvector (idempotent), then serve the API.
# Ingest is retried briefly so a slightly-slow Postgres on first boot is tolerated.
set -e

echo "[backend] ingesting RAG docs into pgvector…"
for attempt in 1 2 3 4 5; do
  if python scripts/ingest_docs.py; then
    break
  fi
  echo "[backend] ingest attempt ${attempt} failed; retrying in 3s…"
  sleep 3
done

echo "[backend] starting uvicorn on 0.0.0.0:8080"
exec uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8080
