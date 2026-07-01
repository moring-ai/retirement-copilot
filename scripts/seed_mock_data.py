#!/usr/bin/env python3
"""Seed / regenerate the mock customer data used by the MCP tool server.

The customer records are the single source of truth here; running this script
(re)writes ``mcp_server/data/mock_customers.json``. The MCP server reads that
file. This keeps the demo data in version-controllable code while letting the
MCP tools load plain JSON.

Usage:  python scripts/seed_mock_data.py
"""
import json
from pathlib import Path

OUT_PATH = (
    Path(__file__).resolve().parent.parent / "mcp_server" / "data" / "mock_customers.json"
)

# ---------------------------------------------------------------------------
# Mock customers. CUST-1001 is the clean "happy path"; CUST-2002 is the
# higher-risk case that must escalate.
# ---------------------------------------------------------------------------
CUSTOMERS = {
    "CUST-1001": {
        "customer_id": "CUST-1001",
        "name": "Robert Miller",
        "age": 65,
        "veteran_status": "Army veteran",
        "state": "Georgia",
        "contact_preference": "phone",
        "email": "robert.miller@example.com",
        "phone": "+1-770-555-0142",
        "ssn_last4": "4821",
        "risk_flags": [],
        "has_existing_fidelity_ira": False,
        "retirement_accounts": [
            {
                "account_id": "FID-BRK-55012",
                "type": "Individual Brokerage",
                "provider": "Fidelity",
                "balance_estimate": 18250.00,
            }
        ],
        "source_plan": {
            "description": "Old employer 401(k)",
            "plan_provider": "Example Benefits Plan Services",
            "plan_type": "401(k)",
            "balance_estimate": 142500.00,
            "rollover_allowed": True,
            "outstanding_plan_loan": False,
        },
        "account_restrictions": [],
        "documents": {
            "ira_application": "missing",
            "rollover_request_form": "missing",
            "identity_verification": "complete",
        },
        "case_status": {
            "open_rollover_case": False,
            "notes": "No open rollover case yet.",
        },
    },
    "CUST-2002": {
        "customer_id": "CUST-2002",
        "name": "Patricia Donovan",
        "age": 58,
        "veteran_status": "Not a veteran",
        "state": "Florida",
        "contact_preference": "email",
        "email": "patricia.donovan@example.com",
        "phone": "+1-305-555-0199",
        "ssn_last4": "7733",
        "risk_flags": ["beneficiary_dispute", "address_mismatch"],
        "has_existing_fidelity_ira": True,
        "retirement_accounts": [
            {
                "account_id": "FID-IRA-90233",
                "type": "Traditional IRA",
                "provider": "Fidelity",
                "balance_estimate": 64000.00,
            }
        ],
        "source_plan": {
            "description": "Old employer 401(k)",
            "plan_provider": "Unknown / not confirmed",
            "plan_type": "401(k)",
            "balance_estimate": None,
            "rollover_allowed": "unknown",
            "outstanding_plan_loan": True,
        },
        "account_restrictions": ["beneficiary dispute", "address mismatch"],
        "documents": {
            "ira_application": "missing",
            "rollover_request_form": "missing",
            "identity_verification": "incomplete",
        },
        "case_status": {
            "open_rollover_case": False,
            "notes": "Account flagged: beneficiary dispute and address mismatch on file.",
        },
    },
}


def main() -> None:
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(CUSTOMERS, indent=2) + "\n")
    print(f"Wrote {len(CUSTOMERS)} mock customers -> {OUT_PATH}")
    for cid, c in CUSTOMERS.items():
        print(f"  - {cid}: {c['name']}")


if __name__ == "__main__":
    main()
