# 01 — Monorepo Structure & Tooling

> Turborepo monorepo with shared packages, selective builds, and dependency tracking.

**Related specs:** [02-design-system](02-design-system.md), [13-ci-cd-pipelines](13-ci-cd-pipelines.md)

---

## Directory Structure

```
prepforall/
├── apps/
│   ├── marketing/                  # Next.js 15 (SSR/SSG) — SEO pages
│   │   ├── app/                    # Pages, routes, layouts
│   │   ├── content/                # JSON content files (git-based CMS)
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── platform/                   # Vite + TanStack Router/Query/Table
│       ├── src/
│       │   ├── routes/             # TanStack Router file-based routes
│       │   ├── features/           # Page orchestration (data fetching, state, composition)
│       │   ├── lib/                # API clients, hooks
│       │   ├── stores/             # Zustand stores
│       │   └── types/
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   ├── ui/                         # Design system (Naos-inspired)
│   │   ├── tokens/                 # @prepforall/tokens
│   │   ├── css/                    # @prepforall/css
│   │   ├── icons/                  # @prepforall/icons
│   │   └── react/                  # @prepforall/react
│   │
│   ├── marketing-ui/               # @prepforall/marketing-ui
│   │   └── src/                    # Marketing presentational components
│   │       ├── atomic/             # Marketing-specific atoms (if any)
│   │       ├── molecular/          # StatBar, TestimonialCard, PricingCard, etc.
│   │       └── organisms/          # HeroBlock, StatsSection, PricingBlock, Header, Footer
│   │
│   ├── platform-ui/                # @prepforall/platform-ui
│   │   └── src/                    # Platform presentational components
│   │       ├── atomic/             # Platform-specific atoms (if any)
│   │       ├── molecular/          # StatCards, TimerDisplay, VerdictBadge, etc.
│   │       └── organisms/          # CodeEditor, SubmissionPanel, LeaderboardTable, ActivityHeatmap
│   │
│   ├── shared/                     # @prepforall/shared
│   │   ├── src/types/              # TypeScript interfaces
│   │   └── src/utils/              # Shared utilities
│   │
│   └── config/                     # Shared configs
│       ├── eslint/
│       ├── typescript/
│       ├── postcss/
│       └── tailwind/
│
├── storybook/                      # Design system documentation
│
├── services/
│   ├── api/                        # Go API server
│   └── judge/                      # Go judge worker
│
├── infrastructure/
│   ├── k8s/                        # Kubernetes manifests (Kustomize)
│   │   ├── base/
│   │   └── overlays/
│   │       ├── dev/
│   │       └── prod/
│   ├── docker/
│   ├── nginx/
│   └── observability/
│
├── turbo.json
├── package.json
├── docker-compose.yml
└── Makefile
```

## Component Ownership

| Location | Package name | What belongs here |
|---|---|---|
| `packages/ui/` | `@prepforall/react` | Shared primitives (Button, Input, Modal, Card, Tabs, Accordion, etc.) |
| `packages/marketing-ui/` | `@prepforall/marketing-ui` | Marketing presentational components (HeroBlock, PricingCard, TestimonialCarousel, Header, Footer, etc.) |
| `packages/platform-ui/` | `@prepforall/platform-ui` | Platform presentational components (CodeEditor, SubmissionPanel, StatCards, LeaderboardTable, TimerDisplay, ActivityHeatmap, etc.) |
| `apps/marketing/` | — | Page orchestration only (data fetching, Server Actions, ISR, composing marketing-ui components) |
| `apps/platform/features/` | — | Page orchestration only (API calls, Zustand stores, WebSocket, composing platform-ui components) |

**Dependency chain:**
```
@prepforall/tokens → @prepforall/css → @prepforall/react (shared primitives)
                                              ↓
                              ┌───────────────┴───────────────┐
                              ↓                               ↓
                   @prepforall/marketing-ui        @prepforall/platform-ui
                              ↓                               ↓
                   apps/marketing (pages)          apps/platform (pages + features)
```

**The universal rule:** Presentational components → package. Page-level orchestration (data fetching, state management, API calls, WebSocket) → app.

## Content Management

Git-based JSON files in the repo (same pattern as Cursor.com):

```
apps/marketing/
  content/
    homepage.json        # Hero text, stats, feature cards
    testimonials.json    # Partner quotes
    pricing.json         # Plans and features
    universities.json    # Partner list, benefits
    features.json        # Feature descriptions
    faq.json             # Accordion content
```

Next.js reads at build time. Content changes = update JSON, push, Cloudflare Pages rebuilds (~30s). If non-technical editing is needed later, bolt on Decap CMS (git-backed, free) without changing architecture.

## Turborepo Pipeline

Selective builds with dependency tracking. CSS builds before React builds. Shared packages built before apps.

```json
// turbo.json
{
  "pipeline": {
    "build:css": { "dependsOn": ["^build:css"] },
    "build:react": { "dependsOn": ["build:css", "^build:react"] },
    "build": { "dependsOn": ["^build"] },
    "lint": {},
    "test": {},
    "test:ci": {}
  }
}
```

## Package Manager

Yarn (aligned with DTSL monorepo patterns). Changesets for `packages/ui` versioning.

---

*Last updated: April 5, 2026*
