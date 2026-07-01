"""Retirement Copilot MCP tool server (FastMCP, streamable-HTTP).

Exposes seven mock, customer/system-specific tools. This is the *MCP* side of the
demo: live, per-customer data — as opposed to the RAG corpus, which holds static
approved guidance. All data is mock (see scripts/seed_mock_data.py); the only
"write" tool (create_or_update_service_case) is a dry-run.

Run:  python mcp_server/server.py
Serves streamable-HTTP at http://localhost:8100/mcp
"""
import os
import sys
from pathlib import Path

from mcp.server.fastmcp import FastMCP

# Allow "python mcp_server/server.py" from any cwd by making the package importable.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from mcp_server.tools import account_tools, case_tools, customer_tools  # noqa: E402

HOST = os.getenv("MCP_HOST", "127.0.0.1")
PORT = int(os.getenv("MCP_PORT", "8100"))

mcp = FastMCP("retirement-copilot-tools", host=HOST, port=PORT)


# --- Customer identity ------------------------------------------------------
@mcp.tool()
def get_customer_profile(identifier: str) -> dict:
    """Get a customer profile by customer_id (e.g. CUST-1001) or by full name.

    Returns name, age, veteran status, state, contact preference and risk flags.
    """
    return customer_tools.get_customer_profile(identifier)


@mcp.tool()
def check_existing_ira(identifier: str) -> dict:
    """Check whether the customer already holds a Fidelity IRA."""
    return customer_tools.check_existing_ira(identifier)


# --- Accounts / plan / documents -------------------------------------------
@mcp.tool()
def list_retirement_accounts(identifier: str) -> dict:
    """List the customer's existing Fidelity retirement accounts."""
    return account_tools.list_retirement_accounts(identifier)


@mcp.tool()
def get_source_plan_details(identifier: str) -> dict:
    """Get the old employer 401(k) source-plan details, provider, balance estimate,
    rollover eligibility and any outstanding plan loan."""
    return account_tools.get_source_plan_details(identifier)


@mcp.tool()
def check_account_restrictions(identifier: str) -> dict:
    """Check for account restrictions/holds (fraud hold, KYC, beneficiary dispute,
    address mismatch, blocked account)."""
    return account_tools.check_account_restrictions(identifier)


@mcp.tool()
def get_document_or_case_status(identifier: str) -> dict:
    """Get whether required documents are received/pending/missing and the case status."""
    return account_tools.get_document_or_case_status(identifier)


# --- Case write (DRY-RUN) ---------------------------------------------------
@mcp.tool()
def create_or_update_service_case(identifier: str, notes: str = "") -> dict:
    """SIMULATED only: create/update a service case. Returns a mock case id and
    performs no real action."""
    return case_tools.create_or_update_service_case(identifier, notes)


if __name__ == "__main__":
    print(f"[mcp] retirement-copilot-tools serving streamable-HTTP at http://{HOST}:{PORT}/mcp")
    mcp.run(transport="streamable-http")
