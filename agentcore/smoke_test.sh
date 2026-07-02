#!/usr/bin/env bash
# Smoke test for the retirement copilot on AgentCore.
# Usage (local):       BASE_URL=http://localhost:8080 bash smoke_test.sh
# Usage (AgentCore):   AGENT_RUNTIME_ARN=<arn> bash smoke_test.sh
set -uo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
AGENT_RUNTIME_ARN="${AGENT_RUNTIME_ARN:-}"
PASS=0; FAIL=0

_check() {
  local label="$1" result="$2" expect="$3"
  if echo "$result" | grep -q "$expect"; then
    echo "  PASS  $label"; PASS=$((PASS + 1))
  else
    echo "  FAIL  $label"
    echo "        expected: $expect"
    echo "        got: $(echo "$result" | head -c 400)"
    FAIL=$((FAIL + 1))
  fi
}

_invoke() {
  local payload="$1"
  if [ -n "$AGENT_RUNTIME_ARN" ]; then
    aws bedrock-agentcore invoke-agent-runtime \
      --agent-runtime-arn "$AGENT_RUNTIME_ARN" \
      --runtime-session-id "$(python3 -c 'import uuid;print(uuid.uuid4().hex*2)')" \
      --cli-binary-format raw-in-base64-out \
      --payload "$payload" \
      --content-type application/json --accept application/json /tmp/rc_out.json >/dev/null 2>&1 && cat /tmp/rc_out.json
  else
    curl -sf -X POST "$BASE_URL/invoke" -H "Content-Type: application/json" -d "$payload"
  fi
}

echo "=== Retirement Copilot smoke test ==="
[ -n "$AGENT_RUNTIME_ARN" ] && echo "    mode: AgentCore" || echo "    mode: local ($BASE_URL)"

if [ -z "$AGENT_RUNTIME_ARN" ]; then
  echo ""
  echo "1) Ping"
  r=$(curl -sf "$BASE_URL/ping")
  _check "status Healthy" "$r" '"Healthy"'

  echo ""
  echo "2) Health"
  r=$(curl -sf "$BASE_URL/health")
  _check "agent name"    "$r" '"agent":"retirement-copilot"'
  _check "rag backend"   "$r" '"rag_backend":"memory"'
  _check "corpus chunks" "$r" '"corpus_chunks"'
  _check "mcp tools up"  "$r" 'tools)'
fi

echo ""
echo "3) Path A (Augmented LLM) — clean customer CUST-1001, full chain + MCP tools"
r=$(_invoke '{"prompt":"Help me handle a 401k rollover for customer CUST-1001","customer_id":"CUST-1001"}')
_check "path A"            "$r" '"path":"A_augmented_llm"'
_check "tools_called"      "$r" '"get_customer_profile"'
_check "rag_sources cited" "$r" 'ROLLOVER-SOP'
_check "no escalation"     "$r" '"escalation_required":false'
_check "next_steps present" "$r" '"next_steps"'

echo ""
echo "4) Path A (Augmented LLM) — CUST-2002 triggers escalation"
r=$(_invoke '{"prompt":"Process a 401k to IRA rollover for customer CUST-2002","customer_id":"CUST-2002"}')
_check "path A"          "$r" '"path":"A_augmented_llm"'
_check "escalation true" "$r" '"escalation_required":true'
_check "escalation reasons" "$r" '"escalation_reasons"'

echo ""
echo "5) Path B (Controlled Prompt Chain) — general question, no customer, no MCP tools"
r=$(_invoke '{"prompt":"Explain the difference between a direct and indirect 401k to IRA rollover"}')
_check "path B"          "$r" '"path":"B_prompt_chain"'
_check "no tools called" "$r" '"tools_called":\[\]'
_check "cited guidance"  "$r" 'ROLLOVER-SOP'

echo ""
echo "6) Clarification — no customer identifier on a customer-specific ask"
r=$(_invoke '{"prompt":"Can you pull up this account and tell me their balance?"}')
_check "clarification needed" "$r" '"clarification_needed":true'

echo ""
echo "=== Results: ${PASS} passed, ${FAIL} failed ==="
[ "$FAIL" -eq 0 ] || exit 1
