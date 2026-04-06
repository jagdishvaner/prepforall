# 12 — Deployment Architecture (OVH K8s + Cloudflare)

> OVH Managed Kubernetes + Cloudflare Pages + Kustomize manifests.

**Related specs:** [13-ci-cd-pipelines](13-ci-cd-pipelines.md), [14-cost-estimate](14-cost-estimate.md), [08-judge-system](08-judge-system.md)

---

## Topology

```
Users → Cloudflare (CDN/WAF/DDoS/DNS) → Static assets: Cloudflare Pages
                                        → API/WS: OVH K8s Ingress → API pods
```

## DNS Routing

| Domain | Destination |
|---|---|
| `prepforall.com` | Cloudflare Pages (`apps/marketing`) |
| `app.prepforall.com` | Cloudflare Pages (`apps/platform`) |
| `api.prepforall.com` | Cloudflare proxy → OVH K8s Ingress → API pods |

## OVH K8s Cluster

```
Cluster: prepforall-prod
Region: Mumbai (BOM1) or Singapore (SGP1)

Node pools:
┌─────────────────┬───────────┬───────┬──────────────────────────┐
│ Pool            │ Instance  │ Nodes │ Purpose                  │
├─────────────────┼───────────┼───────┼──────────────────────────┤
│ general         │ b3-8      │ 2     │ API, Ingress, Observ.    │
│                 │ 2vCPU/8GB │       │ Auto-scale 2→5           │
├─────────────────┼───────────┼───────┼──────────────────────────┤
│ judge           │ b3-8      │ 1     │ Judge workers (privileged│
│                 │ 2vCPU/8GB │       │ Docker-in-Docker)        │
│                 │           │       │ Auto-scale 1→5           │
└─────────────────┴───────────┴───────┴──────────────────────────┘
```

Two pools for security isolation: judge pods need `privileged: true` for Docker/gVisor. Kept separate from API pods via node taints.

## Kubernetes Manifests (Kustomize)

```
infrastructure/k8s/
├── base/
│   ├── namespace.yaml
│   ├── api/
│   │   ├── deployment.yaml         # 2 replicas, resource limits, health checks
│   │   ├── service.yaml            # ClusterIP :8080
│   │   ├── hpa.yaml                # Auto-scale on CPU > 60%
│   │   └── configmap.yaml
│   ├── judge/
│   │   ├── deployment.yaml         # Privileged, tolerations for judge pool
│   │   ├── hpa.yaml                # Auto-scale on Redis queue depth
│   │   └── configmap.yaml
│   ├── ingress/
│   │   └── ingress.yaml            # Nginx ingress, TLS, /api/*, /ws
│   └── observability/
│       ├── prometheus.yaml
│       ├── grafana.yaml
│       ├── loki.yaml
│       └── promtail.yaml
├── overlays/
│   ├── dev/                        # 1 replica each, dev secrets
│   └── prod/                       # 2+ replicas, prod secrets (sealed)
└── scripts/
    └── setup-cluster.sh
```

## Secrets Management

Sealed Secrets — encrypted in git, only the cluster can decrypt. No plaintext secrets in the repo.

| Secret | Where stored |
|---|---|
| DATABASE_URL, REDIS_ADDR, JWT_SECRET | K8s Secret (sealed) |
| OAuth client IDs/secrets | K8s Secret (sealed) |
| OVH Container Registry creds | GitHub Actions secret |
| Cloudflare API token | GitHub Actions secret |

---

*Last updated: April 5, 2026*
