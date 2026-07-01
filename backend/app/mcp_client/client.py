"""Async MCP client over streamable-HTTP.

Mirrors the connection shape used across the agent-patterns repo:
``async with streamablehttp_client(url) as (r, w, _): ClientSession(r, w)``.
No OAuth — this is a local demo and auth is deliberately not over-engineered.
"""
from __future__ import annotations

import json

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

from app.config import settings

MCP_TIMEOUT = 20.0


def _parse_content(result) -> dict:
    """Collapse MCP tool content into a dict. FastMCP returns JSON text content."""
    texts = [c.text for c in result.content if hasattr(c, "text") and c.text]
    if not texts:
        return {}
    blob = "\n".join(texts)
    try:
        return json.loads(blob)
    except json.JSONDecodeError:
        return {"raw": blob}


async def call_tool(tool_name: str, args: dict) -> tuple[dict, str]:
    """Call a single MCP tool. Returns (data, status) where status is 'ok'|'error'."""
    try:
        async with streamablehttp_client(settings.mcp_server_url, timeout=MCP_TIMEOUT) as (r, w, _):
            async with ClientSession(r, w) as session:
                await session.initialize()
                result = await session.call_tool(tool_name, args)
        return _parse_content(result), "ok"
    except Exception as exc:  # noqa: BLE001
        return {"error": f"{type(exc).__name__}: {exc}"}, "error"


async def list_tools() -> tuple[list[str], str]:
    try:
        async with streamablehttp_client(settings.mcp_server_url, timeout=MCP_TIMEOUT) as (r, w, _):
            async with ClientSession(r, w) as session:
                await session.initialize()
                result = await session.list_tools()
        return [t.name for t in result.tools], "ok"
    except Exception as exc:  # noqa: BLE001
        return [], f"error: {type(exc).__name__}: {exc}"
