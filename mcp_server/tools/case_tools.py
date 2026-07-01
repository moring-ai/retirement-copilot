"""Service-case MCP tool. DRY-RUN ONLY — never performs a real write.

For the demo this returns a simulated case id and echoes the notes. No state is
persisted and no downstream system is touched.
"""
from ._data import find_customer, not_found


def create_or_update_service_case(identifier: str, notes: str = "") -> dict:
    """Simulate creating/updating a service case. Mock/dry-run; no real action."""
    rec = find_customer(identifier)
    if not rec:
        return not_found(identifier)
    # Deterministic mock case id derived from the customer id (no randomness).
    mock_case_id = f"CASE-{rec['customer_id'].split('-')[-1]}-DEMO"
    return {
        "found": True,
        "simulated": True,
        "customer_id": rec["customer_id"],
        "case_id": mock_case_id,
        "notes": notes,
        "message": (
            "SIMULATED write only. No real service case was created or updated. "
            "This tool is a dry-run for the demo."
        ),
    }
