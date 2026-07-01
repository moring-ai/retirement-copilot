"""Account / plan / document MCP tools (read-only, mock data)."""
from ._data import find_customer, not_found


def list_retirement_accounts(identifier: str) -> dict:
    """Return the customer's existing Fidelity retirement accounts."""
    rec = find_customer(identifier)
    if not rec:
        return not_found(identifier)
    return {
        "found": True,
        "customer_id": rec["customer_id"],
        "retirement_accounts": rec.get("retirement_accounts", []),
    }


def get_source_plan_details(identifier: str) -> dict:
    """Return the old employer 401(k) source-plan details and rollover eligibility."""
    rec = find_customer(identifier)
    if not rec:
        return not_found(identifier)
    plan = rec.get("source_plan", {})
    return {
        "found": True,
        "customer_id": rec["customer_id"],
        "source_plan": plan,
        "rollover_allowed": plan.get("rollover_allowed"),
        "outstanding_plan_loan": plan.get("outstanding_plan_loan"),
        "plan_details_complete": bool(
            plan.get("plan_provider")
            and plan.get("plan_provider") != "Unknown / not confirmed"
            and plan.get("balance_estimate") is not None
        ),
    }


def check_account_restrictions(identifier: str) -> dict:
    """Return any account restrictions / holds on the customer's accounts."""
    rec = find_customer(identifier)
    if not rec:
        return not_found(identifier)
    restrictions = rec.get("account_restrictions", [])
    return {
        "found": True,
        "customer_id": rec["customer_id"],
        "has_restrictions": bool(restrictions),
        "account_restrictions": restrictions,
    }


def get_document_or_case_status(identifier: str) -> dict:
    """Return whether required documents are received/pending/missing, plus case status."""
    rec = find_customer(identifier)
    if not rec:
        return not_found(identifier)
    docs = rec.get("documents", {})
    missing = [k for k, v in docs.items() if v == "missing"]
    incomplete = [k for k, v in docs.items() if v == "incomplete"]
    return {
        "found": True,
        "customer_id": rec["customer_id"],
        "documents": docs,
        "missing_documents": missing,
        "incomplete_documents": incomplete,
        "identity_verification": docs.get("identity_verification"),
        "case_status": rec.get("case_status", {}),
    }
