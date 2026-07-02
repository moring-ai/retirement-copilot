# AgentCore image for the retirement copilot. Build context = repo root:
#   docker buildx build -f agentcore/Dockerfile --platform linux/arm64 .
FROM --platform=linux/arm64 python:3.12-slim

RUN useradd --create-home --uid 10001 agent
WORKDIR /app

COPY agentcore/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App code: the backend package, the MCP tool server, and the approved RAG corpus.
COPY backend/app ./app
COPY mcp_server ./mcp_server
COPY data/rag_docs ./data/rag_docs
COPY agentcore/agent.py .

USER agent
EXPOSE 8080

ENV AGENT_NAME=retirement-copilot \
    AGENT_MODEL=claude-sonnet \
    RAG_BACKEND=memory \
    RAG_DOCS_DIR=/app/data/rag_docs \
    MCP_HOST=127.0.0.1 \
    MCP_PORT=8100 \
    MCP_SERVER_URL=http://127.0.0.1:8100/mcp \
    PORT=8080

HEALTHCHECK --interval=30s --timeout=4s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request,sys; sys.exit(0) if urllib.request.urlopen('http://localhost:8080/ping').status==200 else sys.exit(1)"

CMD ["python", "agent.py"]
