"""Customer-identity MCP tools (read-only, mock data)."""
from ._data import find_customer, not_found


def get_customer_profile(identifier: str) -> dict:
    """Return the customer profile by customer_id (CUST-####) or by name."""
    rec = find_customer(identifier)
    if not rec:
        return not_found(identifier)
    return {
        "found": True,
        "customer_id": rec["customer_id"],
        "name": rec["name"],
        "age": rec["age"],
        "veteran_status": rec["veteran_status"],
        "state": rec["state"],
        "contact_preference": rec["contact_preference"],
        "email": rec["email"],
        "phone": rec["phone"],
        "ssn_last4": rec["ssn_last4"],
        "risk_flags": rec["risk_flags"],
    }


def check_existing_ira(identifier: str) -> dict:
    """Return whether the customer already holds a Fidelity IRA."""
    rec = find_customer(identifier)
    if not rec:
        return not_found(identifier)
    iras = [
        a for a in rec.get("retirement_accounts", [])
        if "IRA" in a.get("type", "")
    ]
    return {
        "found": True,
        "customer_id": rec["customer_id"],
        "has_existing_fidelity_ira": rec["has_existing_fidelity_ira"],
        "existing_iras": iras,
    }
