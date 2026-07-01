#!/usr/bin/env bash
# Smoke test for the Retirement Servicing Copilot backend.
# Usage:  BASE_URL=http://localhost:8080 bash scripts/smoke_test.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
PASS=0; FAIL=0

_check() {
  local label="$1" result="$2" expect="$3"
  if echo "$result" | grep -q "$expect"; then
    echo "  PASS  $label"; PASS=$((PASS + 1))
  else
    echo "  FAIL  $label"
    echo "        expected to contain: $expect"
    echo "        got: $(echo "$result" | head -c 400)"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Retirement Copilot smoke test ($BASE_URL) ==="

echo ""
echo "1) Health"
r=$(curl -sf "$BASE_URL/health")
_check "status ok"     "$r" '"status":"ok"'
_check "corpus chunks" "$r" '"corpus_chunks"'

echo ""
echo "2) Customers list"
r=$(curl -sf "$BASE_URL/customers")
_check "CUST-1001 present" "$r" 'CUST-1001'
_check "CUST-2002 present" "$r" 'CUST-2002'

echo ""
echo "3) Clean scenario — CUST-1001 (Path A, no escalation)"
r=$(curl -sf -X POST "$BASE_URL/chat" -H "Content-Type: application/json" -d '{
  "message": "Customer Robert Miller is a 65-year-old army veteran. He wants to roll over an old 401(k) into a Fidelity IRA. Check what is needed, whether he already has an IRA, restrictions, forms, and draft a compliant response.",
  "customer_id": "CUST-1001",
  "session_id": "demo-session-1"
}')
_check "routed to Path A" "$r" '"path":"A_augmented_llm"'
_check "no escalation"   "$r" '"escalation_required":false'
_check "has rag sources" "$r" '"rag_sources"'
_check "tools called"    "$r" 'get_customer_profile'

echo ""
echo "4) Escalation scenario — CUST-2002"
r=$(curl -sf -X POST "$BASE_URL/chat" -H "Content-Type: application/json" -d '{
  "message": "Customer wants to roll over a 401(k) into a Fidelity IRA. Check restrictions and draft a response.",
  "customer_id": "CUST-2002",
  "session_id": "demo-session-2"
}')
_check "escalation required" "$r" '"escalation_required":true'

echo ""
echo "5) Lookup failure — unknown customer"
r=$(curl -sf -X POST "$BASE_URL/chat" -H "Content-Type: application/json" -d '{
  "message": "Roll over a 401(k) into an IRA.",
  "customer_id": "CUST-9999"
}')
_check "clarification needed" "$r" '"clarification_needed":true'

echo ""
echo "6) Path B — general explanation (no customer, no MCP tools)"
r=$(curl -sf -X POST "$BASE_URL/chat" -H "Content-Type: application/json" -d '{
  "message": "Explain how a 401(k) to IRA rollover works and what forms are needed."
}')
_check "routed to Path B"   "$r" '"path":"B_prompt_chain"'
_check "no tools called"    "$r" '"tools_called":\[\]'
_check "no escalation (B)"  "$r" '"escalation_required":false'
_check "has rag sources (B)" "$r" '"rag_sources"'

echo ""
echo "=== Results: ${PASS} passed, ${FAIL} failed ==="
[ "$FAIL" -eq 0 ] || exit 1
