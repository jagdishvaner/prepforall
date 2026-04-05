# PrepForAll — Platform Overview

> B2B EdTech platform: LeetCode-grade coding practice + university-focused training management
> Stack: Next.js 15 · Vite + TanStack · Go · PostgreSQL · Redis · OVH K8s · Cloudflare

**Related specs:** All specs in this directory. This is the index document.

---

## What is PrepForAll

PrepForAll is a B2B EdTech platform that combines:

- **Coding practice** — DSA and SQL problems with a sandboxed code runner (judge)
- **Test assignment** — trainers create timed tests, assign to student batches
- **Analytics** — student-wise progress, batch-wise reports, topic breakdown
- **Mock interviews** — 1-on-1 video + collaborative coding (deferred to sub-project 4)

**Business model:** B2B only. University training partners (like Vikash Tech Solution, SpleN Technologies) sign MOUs. Their trainers manage batches of students on the platform. No public self-registration.

---

## User Roles

| Role | Who | Access |
|---|---|---|
| Super Admin | PrepForAll team | Full platform access, manage all orgs |
| Org Admin | Partner leadership (VTS, SpleN) | Manage their org's trainers, batches, analytics |
| Trainer | Assigned by org admin | Create tests, assign to batches, view batch analytics, conduct interviews |
| Student | End user | Solve problems, take assigned tests, view own progress |

**Multi-tenancy model:** Organization → Batches → Students. Each org sees only its own data. RBAC enforced at API middleware level.

---

## Sub-project Decomposition

The platform is built in 4 sequential sub-projects. Each has its own implementation plan and can be independently deployed.

| Sub-project | Focus | Dependencies | Specs |
|---|---|---|---|
| **1. Foundation** | Turborepo monorepo + frontend split + design system + OVH K8s deployment pipeline | None | 01, 02, 03, 04, 07, 12, 13 |
| **2. Coding Platform** | Complete DSA + SQL judge, problem workspace, contests, leaderboard | Sub-project 1 | 05, 06, 08 |
| **3. Training Management** | Test assignment, batch management, analytics, org management | Sub-project 2 | 09, 10 |
| **4. Mock Interviews** | 1-on-1 video + collaborative coding (third-party video SDK) | Sub-project 3 | 11 |

**Migration approach:** Incremental. Each step is independently testable and deployable.

1. Add Turborepo + shared packages. Existing `apps/web` keeps working.
2. Create `apps/marketing` (Next.js) — extract public/SEO pages.
3. Create `apps/platform` (Vite + TanStack) — migrate authenticated pages.
4. Dockerize everything + K8s manifests + CI/CD for OVH.

---

## Spec Index

| # | Spec | Description |
|---|---|---|
| 00 | [Overview](00-prepforall-overview.md) | This document — project overview, sub-projects, tech decisions |
| 01 | [Monorepo & Tooling](01-monorepo-and-tooling.md) | Turborepo structure, shared configs |
| 02 | [Design System](02-design-system.md) | packages/ui — tokens, icons, CSS, React primitives |
| 03 | [Marketing Site](03-marketing-site.md) | apps/marketing — pages, SEO, content management |
| 04 | [Platform App](04-platform-app.md) | apps/platform — routes, components, state management |
| 05 | [Backend Architecture](05-backend-architecture.md) | Go API — modules, DI, middleware |
| 06 | [Database Schema](06-database-schema.md) | All tables, migrations, indexes |
| 07 | [Authentication](07-authentication.md) | JWT, OAuth, invite flow, RBAC |
| 08 | [Judge System](08-judge-system.md) | DSA + SQL code execution, sandboxing |
| 09 | [Test Assignment](09-test-assignment.md) | Test creation, proctoring, grading |
| 10 | [Analytics Engine](10-analytics-engine.md) | Dashboards, metrics, reporting |
| 11 | [Mock Interviews](11-mock-interviews.md) | Deferred — video + collaborative editor |
| 12 | [Deployment Architecture](12-deployment-architecture.md) | OVH K8s, Cloudflare Pages, Kustomize |
| 13 | [CI/CD Pipelines](13-ci-cd-pipelines.md) | GitHub Actions, preview deploys, releases |
| 14 | [Cost Estimate](14-cost-estimate.md) | Infrastructure costs breakdown |

---

## Key Technology Decisions

| Decision | Choice | Reason |
|---|---|---|
| Marketing framework | Next.js 15 (SSG + ISR) | SEO, public problem archive, server rendering |
| Platform framework | Vite + TanStack Router/Query/Table | Stable libraries (not beta), SPA behind auth, no SSR needed |
| Why not TanStack Start | Beta risk, SSR unnecessary for auth'd pages | Migration path from Vite+TanStack Router is trivial if Start stabilizes |
| Backend | Go modular monolith + chi + pgx + uber/dig | Performance, DI for testability, existing codebase |
| Code runner (DSA) | Docker + gVisor sandbox | Battle-tested isolation, existing implementation |
| Code runner (SQL) | Temporary PostgreSQL container per submission | Matches DSA pattern, secure isolation |
| Design system | Naos-inspired layered atomic design | Tokens → CSS → React, shared across both apps |
| Marketing components | DTSL marketing-component-library (code reference only) | Atomic Design patterns, CSS-first architecture |
| Content management | Git-based (JSON files in repo) | Zero cost, developer-managed, Cursor.com uses same pattern |
| Component ownership | packages/ui (shared primitives), packages/marketing-ui (marketing presentational), packages/platform-ui (platform presentational), apps/* (page orchestration only) | Presentational → package, orchestration → app |
| Infrastructure | OVH Managed K8s | Free control plane, cheapest managed K8s, single dashboard |
| Frontend hosting | Cloudflare Pages | Free, global CDN, automatic deploys |
| K8s manifests | Kustomize (not Helm) | Simpler for current scale, plain YAML overlays |
| Auth | JWT + OAuth (Google, GitHub) + invite-only | B2B model, no public registration |
| Real-time | WebSocket + Redis Pub/Sub | Fan-out across API instances |
| Analytics charts | Recharts | Lightweight, React-native |
| Mock interview video | Third-party SDK (deferred) | Build vs buy — buy at this stage |
| Secrets | Sealed Secrets | Encrypted in git, cluster-only decryption |
| CI/CD | GitHub Actions, referencing DTSL workflow patterns | Turbo CI, paths-filter, CF Pages deploy, Go Docker CD |
| Portability | All services containerized, K8s-native | Move to any K8s provider by re-applying manifests |

---

*Last updated: April 5, 2026 — PrepForAll Engineering*
