# FastMCP tool server (streamable-HTTP on :8100). Build context = repo root.
FROM python:3.12-slim

WORKDIR /app

COPY mcp_server/requirements.txt mcp_server/requirements.txt
RUN pip install --no-cache-dir -r mcp_server/requirements.txt

COPY mcp_server/ mcp_server/

# Bind to all interfaces so the backend container can reach it over the network.
ENV MCP_HOST=0.0.0.0 \
    MCP_PORT=8100 \
    PYTHONUNBUFFERED=1

EXPOSE 8100
CMD ["python", "mcp_server/server.py"]
