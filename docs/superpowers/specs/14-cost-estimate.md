# 14 — Cost Estimate

> OVH Managed K8s + Cloudflare. Starting at ~$75/mo.

**Related specs:** [12-deployment-architecture](12-deployment-architecture.md)

---

## Production (launch)

| Component | Service | Monthly |
|---|---|---|
| K8s control plane | OVH Managed K8s | $0 |
| 2x general nodes (b3-8) | OVH | ~$14 |
| 1x judge node (b3-8) | OVH | ~$7 |
| Managed PostgreSQL | OVH | ~$14 |
| Managed Redis | OVH | ~$10 |
| Object Storage (S3) | OVH | ~$5 |
| Container Registry | OVH | ~$5 |
| Cloudflare Pages | Cloudflare | $0 |
| Cloudflare Pro (WAF) | Cloudflare | $20 |
| **Total** | | **~$75/mo** |

## Scaling Path

| Scale | Users | Estimated Cost |
|---|---|---|
| Launch | 0-500 | ~$75/mo |
| Growing | 500-2K | ~$120/mo (add nodes) |
| Scale | 2K-10K | ~$250/mo (more judge workers, larger DB) |
| Large | 10K+ | ~$500+/mo (evaluate migration to AWS/GCP) |

---

*Last updated: April 5, 2026*
