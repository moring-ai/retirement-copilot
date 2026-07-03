# FastAPI copilot backend (POST /chat, /health…) on :8080. Build context = repo root.
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# App code + the data the backend reads at runtime. Layout mirrors the repo so
# config.py's project-root resolution (parents[2]) and the RAG/mock paths work.
COPY backend/ backend/
COPY data/ data/
COPY scripts/ scripts/
COPY mcp_server/data/ mcp_server/data/
COPY backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

ENV PYTHONUNBUFFERED=1

EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
