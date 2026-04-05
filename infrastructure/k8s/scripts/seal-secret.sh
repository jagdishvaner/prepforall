#!/usr/bin/env bash
# Usage: ./seal-secret.sh <secret-name> <namespace> <key=value>...
# Requires: kubeseal CLI + sealed-secrets controller running in cluster
#
# Example:
#   ./seal-secret.sh api-secrets prepforall \
#     DATABASE_URL="postgres://..." \
#     REDIS_ADDR="redis:6379" \
#     JWT_SECRET="your-production-secret"

set -euo pipefail

SECRET_NAME="${1:?Usage: seal-secret.sh <name> <namespace> <key=value>...}"
NAMESPACE="${2:?Usage: seal-secret.sh <name> <namespace> <key=value>...}"
shift 2

LITERAL_ARGS=()
for kv in "$@"; do
  LITERAL_ARGS+=("--from-literal=${kv}")
done

echo "--- Creating and sealing secret: ${SECRET_NAME} in namespace: ${NAMESPACE}"

kubectl create secret generic "${SECRET_NAME}" \
  --namespace="${NAMESPACE}" \
  --dry-run=client \
  -o yaml \
  "${LITERAL_ARGS[@]}" \
  | kubeseal \
    --controller-name=sealed-secrets \
    --controller-namespace=kube-system \
    --format yaml \
  > "$(dirname "$0")/../overlays/prod/sealed-${SECRET_NAME}.yaml"

echo "--- Sealed secret written to overlays/prod/sealed-${SECRET_NAME}.yaml"
echo "--- Commit this file to git. It is safe — only the cluster can decrypt it."
