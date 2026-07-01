#!/usr/bin/env python3
"""Ingest the approved RAG docs into pgvector.

Usage (from repo root, with backend deps installed and Postgres running):
    python scripts/ingest_docs.py
"""
import sys
from pathlib import Path

# Make the backend package importable when run from the repo root.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.rag import ingest  # noqa: E402


def main() -> None:
    result = ingest.ingest()
    print("Ingest complete:")
    print(f"  documents     : {result['documents']}")
    print(f"  doc_names     : {result['doc_names']}")
    print(f"  chunks        : {result['chunks']}")
    print(f"  embedding_mode: {result['embedding_mode']}")
    print(f"  embed_dim     : {result['embed_dim']}")


if __name__ == "__main__":
    main()
