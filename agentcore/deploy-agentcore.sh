#!/usr/bin/env bash
# Deploy the Fidelity Retirement Servicing Copilot to Bedrock AgentCore Runtime.
#
# Self-contained container: LangGraph copilot (router + Path A augmented-LLM +
# Path B controlled prompt chain), the FastMCP tool server as a localhost
# subprocess, and an in-process RAG store. Synthesis calls the AICP AI gateway.
#
# Usage:
#   AGENT=retirement-copilot \
#   KEY_SECRET=agent-platform/poc/keys/platform-admins--vignesh \
#   TEAMS=platform-admins \
#   bash deploy-agentcore.sh
#
# Invoke after deploy:
#   aws bedrock-agentcore invoke-agent-runtime --agent-runtime-arn <arn> \
#     --runtime-session-id "$(python3 -c 'import uuid;print(uuid.uuid4().hex*2)')" \
#     --cli-binary-format raw-in-base64-out \
#     --payload '{"prompt":"Help me with a 401k rollover for customer CUST-1001"}' \
#     --content-type application/json --accept application/json out.json && cat out.json
set -euo pipefail
cd "$(dirname "$0")"                 # -> retirement-copilot-demo/agentcore
REPO_ROOT="$(cd .. && pwd)"          # -> retirement-copilot-demo

# The AgentCore infra lib + outputs.env live in the agent-patterns repo.
AGENTCORE_LIB="${AGENTCORE_LIB:-$REPO_ROOT/../agent-patterns/lib-agentcore.sh}"
[ -f "$AGENTCORE_LIB" ] || { echo "  ✗ lib not found: $AGENTCORE_LIB (set AGENTCORE_LIB)"; exit 1; }
# shellcheck disable=SC1090
. "$AGENTCORE_LIB"   # loads HOST_INSTANCE_ID, HOST_PUBLIC_IP, ECR_URI, PREFIX, AWS_REGION

AGENT="${AGENT:-retirement-copilot}"
KEY_SECRET="${KEY_SECRET:-agent-platform/poc/keys/platform-admins--vignesh}"
TEAMS="${TEAMS:-platform-admins}"
MODEL="${MODEL:-claude-sonnet}"
ROLE="${PREFIX}-agentcore-exec-role"
TAG="agentcore-${AGENT}"
IMG="${ECR_URI}:${TAG}"
GW="https://gateway.${HOST_PUBLIC_IP//./-}.sslip.io"
RT_NAME="$(printf '%s_agentcore' "${AGENT//-/_}")"

# 1) Cross-build ARM64 image on the host (AgentCore requires linux/arm64) -> push to ECR.
#    Build context = repo root, but only the dirs the image needs. Excluding
#    __pycache__/*.pyc keeps the base64 well under the 97KB inline-SSM limit.
log "Building ARM64 image $IMG on the host (buildx)…"
CTX_TB=$(mktemp)
COPYFILE_DISABLE=1 tar czf "$CTX_TB" -C "$REPO_ROOT" \
  --exclude='__pycache__' --exclude='*.pyc' \
  agentcore/Dockerfile agentcore/requirements.txt agentcore/agent.py \
  backend/app mcp_server data/rag_docs
B64=$(base64 < "$CTX_TB" | tr -d '\n'); rm -f "$CTX_TB"
ssm_run "set -e
mkdir -p /opt/platform/agentcore-build/${AGENT} && echo '${B64}' | base64 -d | tar xzf - -C /opt/platform/agentcore-build/${AGENT}
cd /opt/platform/agentcore-build/${AGENT}
mkdir -p /usr/libexec/docker/cli-plugins
docker buildx version >/dev/null 2>&1 || { curl -sSL https://github.com/docker/buildx/releases/download/v0.17.1/buildx-v0.17.1.linux-amd64 -o /usr/libexec/docker/cli-plugins/docker-buildx && chmod +x /usr/libexec/docker/cli-plugins/docker-buildx; }
docker run --privileged --rm tonistiigi/binfmt --install arm64 >/dev/null 2>&1 || true
docker buildx create --name acbuilder --use --bootstrap >/dev/null 2>&1 || docker buildx use acbuilder
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_URI%%/*} >/dev/null 2>&1
docker buildx build --platform linux/arm64 -f agentcore/Dockerfile -t ${IMG} --push . 2>&1 | tail -3"
ok "image pushed: $IMG"

# 2) Resolve the AgentCore execution role (created by foundation; read-only here)
log "Resolving exec role $ROLE"
ROLE_ARN=$(aws iam get-role --role-name "$ROLE" --query Role.Arn --output text 2>/dev/null) \
  || { err "exec role $ROLE not found — create it first (needs bedrock-agentcore trust + ECR pull)"; exit 1; }
ok "exec role: $ROLE_ARN"; sleep 10

# 3) Resolve LiteLLM virtual key from Secrets Manager
KEY=$(aws secretsmanager get-secret-value \
  --secret-id "$KEY_SECRET" --query SecretString --output text \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('litellm_key') or d.get('key') or '')")
[ -n "$KEY" ] || { err "no virtual key in $KEY_SECRET"; exit 1; }

# 4) Create the AgentCore runtime. The copilot uses the OpenAI SDK, so the gateway
#    is passed as OPENAI_BASE_URL / OPENAI_API_KEY. RAG_BACKEND=memory + the
#    localhost MCP subprocess keep the container self-contained.
ENVJSON=$(python3 -c "
import json, sys
print(json.dumps({
  'OPENAI_BASE_URL': sys.argv[1],
  'OPENAI_API_KEY':  sys.argv[2],
  'AGENT_MODEL':     sys.argv[3],
  'AGENT_NAME':      sys.argv[4],
  'AGENT_TEAMS':     sys.argv[5],
  'RAG_BACKEND':     'memory',
  'MCP_SERVER_URL':  'http://127.0.0.1:8100/mcp',
}))" "$GW" "$KEY" "$MODEL" "$AGENT" "$TEAMS")

# Create if new, otherwise update in place (idempotent redeploys). AgentCore
# pins the image at create/update time, so an update is required to roll a new
# image tag even when the tag is unchanged.
EXISTING_ID=$(aws bedrock-agentcore-control list-agent-runtimes \
  --query "agentRuntimes[?agentRuntimeName=='$RT_NAME'].agentRuntimeId | [0]" \
  --output text 2>/dev/null || echo "None")

if [ "$EXISTING_ID" = "None" ] || [ -z "$EXISTING_ID" ]; then
  log "create-agent-runtime $RT_NAME"
  ARN=$(aws bedrock-agentcore-control create-agent-runtime \
    --agent-runtime-name "$RT_NAME" \
    --agent-runtime-artifact "{\"containerConfiguration\":{\"containerUri\":\"$IMG\"}}" \
    --role-arn "$ROLE_ARN" \
    --network-configuration '{"networkMode":"PUBLIC"}' \
    --protocol-configuration '{"serverProtocol":"HTTP"}' \
    --environment-variables "$ENVJSON" \
    --query agentRuntimeArn --output text) \
    || { err "create-agent-runtime failed (see error above)"; exit 1; }
else
  log "update-agent-runtime $RT_NAME ($EXISTING_ID)"
  ARN=$(aws bedrock-agentcore-control update-agent-runtime \
    --agent-runtime-id "$EXISTING_ID" \
    --agent-runtime-artifact "{\"containerConfiguration\":{\"containerUri\":\"$IMG\"}}" \
    --role-arn "$ROLE_ARN" \
    --network-configuration '{"networkMode":"PUBLIC"}' \
    --protocol-configuration '{"serverProtocol":"HTTP"}' \
    --environment-variables "$ENVJSON" \
    --query agentRuntimeArn --output text) \
    || { err "update-agent-runtime failed (see error above)"; exit 1; }
fi
RID="${ARN##*/}"

# 5) Wait READY
log "waiting for READY ($RID)…"
for _ in $(seq 1 30); do
  S=$(aws bedrock-agentcore-control get-agent-runtime \
    --agent-runtime-id "$RID" --query status --output text 2>/dev/null || echo "?")
  case "$S" in READY) break;; *FAILED*) err "status=$S"; exit 1;; esac; sleep 12
done
ok "AgentCore runtime READY: $ARN"
echo ""
echo "Invoke with:"
echo "  aws bedrock-agentcore invoke-agent-runtime --agent-runtime-arn $ARN \\"
echo "    --runtime-session-id \"\$(python3 -c 'import uuid;print(uuid.uuid4().hex*2)')\" \\"
echo "    --cli-binary-format raw-in-base64-out \\"
echo "    --payload '{\"prompt\":\"Help me with a 401k rollover for customer CUST-1001\"}' \\"
echo "    --content-type application/json --accept application/json out.json && cat out.json"
echo ""
echo "Or run the smoke test:  AGENT_RUNTIME_ARN=$ARN bash smoke_test.sh"
