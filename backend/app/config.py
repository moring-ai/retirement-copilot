"""Central configuration (env-driven) for the copilot backend."""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# Project root = retirement-copilot-demo/  (this file is backend/app/config.py)
_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(_ROOT / ".env"),),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "postgresql://copilot:copilot@localhost:5433/retirement_copilot"
    mcp_server_url: str = "http://localhost:8100/mcp"

    # RAG store backend: "postgres" (pgvector, the default local/docker path) or
    # "memory" (in-process cosine store — used on AgentCore where no DB is attached).
    rag_backend: str = "postgres"

    openai_api_key: str = ""
    openai_base_url: str = ""  # optional override (e.g. an OpenAI-compatible gateway)
    agent_model: str = "gpt-4o-mini"

    # Trace/telemetry identity — surfaced to the AICP AI gateway so runs are
    # attributable in the portal. No effect on local runs.
    agent_name: str = "retirement-copilot"
    agent_teams: str = ""

    embed_model: str = "all-MiniLM-L6-v2"
    embed_dim: int = 384
    rag_top_k: int = 4

    rag_docs_dir: str = str(_ROOT / "data" / "rag_docs")

    @property
    def model_mode(self) -> str:
        return "live" if self.openai_api_key else "fallback"

    @property
    def rag_docs_path(self) -> Path:
        p = Path(self.rag_docs_dir)
        return p if p.is_absolute() else (_ROOT / p).resolve()


settings = Settings()
