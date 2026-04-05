# 13 — CI/CD Pipelines

> GitHub Actions. Referencing DTSL backstage-templates and reusable workflow patterns.

**Related specs:** [01-monorepo-and-tooling](01-monorepo-and-tooling.md), [12-deployment-architecture](12-deployment-architecture.md)
**References:** DTSL backstage-templates (monorepo CI/CD), DTSL workflows (cf-pages-deployment, go-cd)

---

## Patterns (from DTSL reference)

| Pattern | Approach |
|---|---|
| Monorepo CI | Turbo-based `lint test:ci build`, reusable workflows |
| Frontend CD | `dorny/paths-filter` detects changed app → deploys only that app to Cloudflare Pages via `wrangler-action` |
| Go CD | Docker build + push to registry → image tag update in K8s manifests (Kustomize) |
| Concurrency | `cancel-in-progress: true` per branch |
| Releases | Changesets for `packages/ui` versioning |
| Environments | PR → preview, main → staging, release tag → production |
| Manual deploy | `workflow_dispatch` with confirmation input |

## Frontend (GitHub Actions → Cloudflare Pages)

```
Push to main (apps/marketing/** or apps/platform/**)
  ├── paths-filter → detect which app changed
  ├── Lint (ESLint via Turbo)
  ├── Type check (tsc --noEmit)
  ├── Build (Turbo filtered to changed app)
  └── Deploy to Cloudflare Pages (wrangler-action)

PR opened:
  ├── Same CI checks
  └── Preview deploy to Cloudflare Pages (branch preview URL)
```

## API (GitHub Actions → OVH K8s)

```
Push to main (services/api/**)
  ├── Lint (golangci-lint)
  ├── Test (with Postgres + Redis service containers, coverage >= 70%)
  ├── Build Docker image (multi-stage: Go builder → Debian slim)
  ├── Push to OVH Container Registry
  └── Update image tag in K8s manifests (Kustomize) → staging deploy

Release tag (v*):
  └── Same build → production image tag update
```

## Judge (GitHub Actions → OVH K8s)

```
Push to main (services/judge/**)
  ├── Lint + Test
  ├── Build judge image + sandbox images (cpp, python, java, node, postgres)
  ├── Push to OVH Container Registry
  └── Update image tag in K8s manifests → staging deploy
```

## Design System (Changesets)

```
Push to main (packages/ui/**)
  ├── CI: lint, test, build
  └── Changesets: create release PR or publish packages
```

---

*Last updated: April 5, 2026*
