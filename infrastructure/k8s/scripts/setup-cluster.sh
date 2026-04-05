#!/usr/bin/env bash
# ─── PrepForAll: OVH Managed K8s Cluster Bootstrap ─────────────────────────
# Run this ONCE after creating the OVH Managed K8s cluster in the OVH console.
#
# Prerequisites:
#   - kubectl configured with OVH cluster kubeconfig
#   - helm v3 installed
#   - kubeseal installed
#
# Usage:
#   ./infrastructure/k8s/scripts/setup-cluster.sh
# ────────────────────────────────────────────────────────────────────────────

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
K8S_DIR="$(dirname "${SCRIPT_DIR}")"

echo "============================================"
echo "PrepForAll K8s Cluster Bootstrap"
echo "============================================"

# ── 1. Verify cluster connection ────────────────────────────────────────────
echo ""
echo "--- Step 1: Verify cluster connection"
kubectl cluster-info
kubectl get nodes -o wide
echo "OK: Cluster is reachable"

# ── 2. Create namespace ─────────────────────────────────────────────────────
echo ""
echo "--- Step 2: Create prepforall namespace"
kubectl apply -f "${K8S_DIR}/base/namespace.yaml"
echo "OK: Namespace created"

# ── 3. Install Nginx Ingress Controller ─────────────────────────────────────
echo ""
echo "--- Step 3: Install Nginx Ingress Controller"
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=2 \
  --set controller.nodeSelector."node-pool"=general \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/ovh-loadbalancer-proxy-protocol"=v2 \
  --wait
echo "OK: Nginx Ingress installed"

# ── 4. Install cert-manager (for Let's Encrypt TLS) ─────────────────────────
echo ""
echo "--- Step 4: Install cert-manager"
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set crds.enabled=true \
  --wait
echo "OK: cert-manager installed"

# ── 5. Create Let's Encrypt ClusterIssuer ────────────────────────────────────
echo ""
echo "--- Step 5: Create Let's Encrypt ClusterIssuer"
kubectl apply -f - <<'ISSUER_EOF'
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: engineering@prepforall.com
    privateKeySecretRef:
      name: letsencrypt-prod-key
    solvers:
      - http01:
          ingress:
            class: nginx
ISSUER_EOF
echo "OK: ClusterIssuer created"

# ── 6. Install Sealed Secrets Controller ─────────────────────────────────────
echo ""
echo "--- Step 6: Install Sealed Secrets Controller"
helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
helm repo update
helm upgrade --install sealed-secrets sealed-secrets/sealed-secrets \
  --namespace kube-system \
  --set fullnameOverride=sealed-secrets \
  --wait
echo "OK: Sealed Secrets controller installed"

# ── 7. Taint judge node pool ────────────────────────────────────────────────
echo ""
echo "--- Step 7: Taint judge node pool"
JUDGE_NODES=$(kubectl get nodes -l node-pool=judge -o name 2>/dev/null || true)
if [ -z "${JUDGE_NODES}" ]; then
  echo "WARN: No nodes with label node-pool=judge found. Taint manually after adding judge pool."
else
  for node in ${JUDGE_NODES}; do
    kubectl taint nodes "${node}" workload-type=judge:NoSchedule --overwrite
    echo "  Tainted: ${node}"
  done
  echo "OK: Judge nodes tainted"
fi

# ── 8. Install metrics-server (for HPA) ─────────────────────────────────────
echo ""
echo "--- Step 8: Install metrics-server"
helm repo add metrics-server https://kubernetes-sigs.github.io/metrics-server/
helm repo update
helm upgrade --install metrics-server metrics-server/metrics-server \
  --namespace kube-system \
  --set args[0]="--kubelet-preferred-address-types=InternalIP" \
  --wait
echo "OK: metrics-server installed"

# ── 9. Verify ───────────────────────────────────────────────────────────────
echo ""
echo "============================================"
echo "Cluster bootstrap complete. Summary:"
echo "============================================"
kubectl get ns
echo ""
kubectl get pods -n ingress-nginx
echo ""
kubectl get pods -n cert-manager
echo ""
kubectl get pods -n kube-system -l app.kubernetes.io/name=sealed-secrets
echo ""
echo "Next steps:"
echo "  1. Create OVH Container Registry and note the URL"
echo "  2. Add GitHub Actions secrets (OVH_REGISTRY_URL, OVH_REGISTRY_USERNAME, OVH_REGISTRY_PASSWORD, OVH_KUBECONFIG_*)"
echo "  3. Run seal-secret.sh to create sealed production secrets"
echo "  4. Apply overlays: kubectl apply -k infrastructure/k8s/overlays/prod/"
