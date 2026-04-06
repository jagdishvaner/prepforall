# PrepForAll — Platform Design Specification

> B2B EdTech platform: LeetCode-grade coding practice + university-focused training management
> Stack: Next.js 15 · Vite + TanStack · Go · PostgreSQL · Redis · OVH K8s · Cloudflare

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Sub-project Decomposition](#2-sub-project-decomposition)
3. [Monorepo Structure (Turborepo)](#3-monorepo-structure-turborepo)
4. [Design System (packages/ui)](#4-design-system-packagesui)
5. [Marketing Site (apps/marketing)](#5-marketing-site-appsmarketing)
6. [Platform App (apps/platform)](#6-platform-app-appsplatform)
7. [Backend Architecture (Go API)](#7-backend-architecture-go-api)
8. [Database Schema](#8-database-schema)
9. [Authentication System](#9-authentication-system)
10. [Code Execution (Judge) System](#10-code-execution-judge-system)
11. [Test Assignment System](#11-test-assignment-system)
12. [Analytics Engine](#12-analytics-engine)
13. [Mock Interview Portal (Deferred)](#13-mock-interview-portal-deferred)
14. [Deployment Architecture (OVH K8s + Cloudflare)](#14-deployment-architecture-ovh-k8s--cloudflare)
15. [CI/CD Pipelines](#15-cicd-pipelines)
16. [Cost Estimate](#16-cost-estimate)
17. [Key Technology Decisions](#17-key-technology-decisions)

---

## 1. Project Overview

PrepForAll is a B2B EdTech platform that combines:

- **Coding practice** — DSA and SQL problems with a sandboxed code runner (judge)
- **Test assignment** — trainers create timed tests, assign to student batches
- **Analytics** — student-wise progress, batch-wise reports, topic breakdown
- **Mock interviews** — 1-on-1 video + collaborative coding (deferred to sub-project 4)

**Business model:** B2B only. University training partners (like Vikash Tech Solution, SpleN Technologies) sign MOUs. Their trainers manage batches of students on the platform. No public self-registration.

**User roles:**

| Role | Who | Access |
|---|---|---|
| Super Admin | PrepForAll team | Full platform access, manage all orgs |
| Org Admin | Partner leadership (VTS, SpleN) | Manage their org's trainers, batches, analytics |
| Trainer | Assigned by org admin | Create tests, assign to batches, view batch analytics, conduct interviews |
| Student | End user | Solve problems, take assigned tests, view own progress |

**Multi-tenancy model:** Organization → Batches → Students. Each org sees only its own data. RBAC enforced at API middleware level.

---

## 2. Sub-project Decomposition

The platform is built in 4 sequential sub-projects. Each has its own implementation plan and can be independently deployed.

| Sub-project | Focus | Dependencies |
|---|---|---|
| **1. Foundation** | Turborepo monorepo + frontend split + design system + OVH K8s deployment pipeline | None |
| **2. Coding Platform** | Complete DSA + SQL judge, problem workspace, contests, leaderboard | Sub-project 1 |
| **3. Training Management** | Test assignment, batch management, analytics, org management | Sub-project 2 |
| **4. Mock Interviews** | 1-on-1 video + collaborative coding (third-party video SDK) | Sub-project 3 |

**Migration approach:** Incremental. Each step is independently testable and deployable.

1. Add Turborepo + shared packages. Existing `apps/web` keeps working.
2. Create `apps/marketing` (Next.js) — extract public/SEO pages.
3. Create `apps/platform` (Vite + TanStack) — migrate authenticated pages.
4. Dockerize everything + K8s manifests + CI/CD for OVH.

---

## 3. Monorepo Structure (Turborepo)

```
prepforall/
├── apps/
│   ├── marketing/                  # Next.js 15 (SSR/SSG) — SEO pages
│   │   ├── app/
│   │   ├── content/                # MDX content (future blog)
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── platform/                   # Vite + TanStack Router/Query/Table
│       ├── src/
│       │   ├── routes/             # TanStack Router file-based routes
│       │   ├── components/         # App-specific components
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

**Turborepo pipeline:** Selective builds with dependency tracking. CSS builds before React builds. Shared packages built before apps.

---

## 4. Design System (packages/ui)

Inspired by the Naos Design System (DTSL). Layered atomic design with separate CSS and React build pipelines.

### Structure

```
packages/ui/
├── tokens/                         # @prepforall/tokens
│   └── src/                        # CSS custom properties: colors, spacing, typography
│
├── css/                            # @prepforall/css
│   ├── src/                        # Per-component CSS modules
│   ├── postcss.config.js           # Shared PostCSS pipeline
│   └── package.json
│
├── icons/                          # @prepforall/icons
│   └── src/                        # SVG → React components (SVGR)
│
└── react/                          # @prepforall/react
    └── src/
        ├── atomic/                 # Button, Input, Badge, Avatar, Checkbox, etc.
        ├── molecular/              # Card, Form, Modal, Tabs, Dropdown, Toast, etc.
        └── organisms/              # DataTable, CodeEditor, Sidebar, Navbar
```

### Key patterns

- **Separate CSS and React builds** — `turbo run build:css` then `turbo run build:react`
- **Design tokens** — centralized colors, spacing, typography as CSS variables
- **Atomic design** — atomic → molecular → organisms
- **SVGR icons** — SVGs compiled to React components
- **Storybook** — component documentation, shared across both apps
- **Tailwind CSS** — used alongside design tokens for rapid development

---

## 5. Marketing Site (apps/marketing)

Content inspired by VTS and HitBullseye. Design style inspired by HubSpot — clean, generous whitespace, not crowded.

### Design System

- Max content width: 1080px, centered
- Section padding: 80px vertical
- Headings: **DM Sans Bold** (clean sans-serif, tech-forward)
- Body text: **Inter Regular**
- Code snippets: **JetBrains Mono**
- One brand accent color + neutral palette
- Alternating white / light gray backgrounds per section
- One primary CTA per section
- Subtle scroll animations (fade-up, counter animations)

### Sitemap

```
prepforall.com/
├── /                       # Home (10 sections, detailed below)
├── /features               # Platform features — section per feature with screenshots
├── /problems               # Public problem archive (SEO — server-rendered list)
├── /problems/[slug]        # Problem preview page (SEO — title, difficulty, description excerpt)
├── /for-universities       # Partnership page + "Request Demo" form
├── /about                  # Team, mission, story
├── /contact                # Contact form
├── /pricing                # 3-tier pricing for institutions
├── /privacy                # Privacy policy
└── /terms                  # Terms of service
```

### Navigation

```
Logo    Problems  Features  For Universities  [Login]  [Request Demo]
```

- **Login** — redirects to `app.prepforall.com` (no auth on marketing site)
- **Request Demo** — links to `/for-universities` contact form
- No "Sign Up" button (B2B invite-only)

### Homepage — Section by Section

**Section 1: Hero** (white bg, two-column)
- Left: Heading "Build your coding skills, ace your placements." + subtext "Your end-to-end coding platform for practice, assessments & placement preparation." + two CTAs: [Request a Demo] (filled) and [Explore Problems →] (text link)
- Right: Product screenshot — problem workspace with a green AC verdict
- Typography: DM Sans Bold 48px heading, Inter 18px subtext

**Section 2: Stats bar** (accent/dark bg, slim single row)
- 4 animated counters on scroll: 200+ Problems | 8+ Partner Colleges | 500+ Students Trained | 95% Placement Confidence
- Numbers count up when section enters viewport

**Section 3: What We Offer** (white bg, 3 cards)
- Heading: "Everything your classroom needs"
- 3 cards with icons: Practice (200+ DSA & SQL problems, real code execution) | Assess (timed tests with proctoring, assign to batches) | Analyze (student & batch-wise analytics, track progress)
- Max 3 cards — clean, not crowded

**Section 4: Product preview** (light gray bg, tabbed screenshots)
- Heading: "A LeetCode-grade editor, inside your classroom"
- Tab selector: [Coding Platform] [Trainer Dashboard] [Analytics]
- One screenshot visible at a time, changes per tab click
- Clean browser mockup frame around screenshot

**Section 5: How It Works** (white bg, 5 numbered steps)
- Heading: "How PrepForAll works"
- Connected visual flow: ① Sign an MOU → ② Trainers get access → ③ Students enroll in batches → ④ Tests assigned to batches → ⑤ Track progress with analytics
- Icon per step, generous spacing

**Section 6: For Universities** (light gray bg, two-column)
- Left: "Built for training partners & universities" + bullet points (batch management, trainer dashboards, exportable reports for NAAC/NIRF, co-branded certificates, dedicated support) + [Learn More →] link to `/for-universities`
- Right: Screenshot of trainer dashboard with batch analytics

**Section 7: University partners** (white bg, logo bar)
- Heading: "Trusted by universities across India"
- Auto-scrolling logo bar: SRM, VIT, SASTRA, Manipal, NIT Trichy, PSG, CIT
- Color logos (not grayscale)

**Section 8: Testimonials** (light gray bg, single-card carousel)
- Heading: "What our partners say"
- One testimonial visible at a time with navigation dots
- Photo + name + role + institution
- Clean card design, not multiple cards side by side

**Section 9: Placement companies** (white bg, logo grid)
- Heading: "Where our students get placed"
- Company logos: Microsoft, Google, Amazon, TCS, Infosys, Wipro, Accenture, Deloitte, Cognizant, Capgemini
- Critical for university pitch credibility

**Section 10: Final CTA** (dark bg)
- "Ready to transform your classroom?"
- [Request a Demo] — single button, accent color

**Footer** (dark bg, continued)
- 4 columns: Brand (logo + tagline) | Product (Features, Problems, For Unis, Pricing) | Company (About, Contact) | Legal (Privacy, Terms)
- Social links: LinkedIn, Instagram, YouTube, Twitter
- © 2026 PrepForAll

### Public Problem Archive

#### List page (`/problems`)

- Server-rendered table: #, Title, Difficulty (color-coded badge), Tags, Acceptance %
- Tabs: [All] [DSA] [SQL]
- Filters: Difficulty dropdown, Tags dropdown, Search text input
- Pagination (20 per page)
- Bottom CTA banner: "Want to solve these problems? Get access through your university. [Request a Demo]"
- No login required to browse — this is the SEO magnet

#### Individual problem page (`/problems/[slug]`)

- Two-column: problem content left (title, difficulty badge, tags, description, example with input/output, constraints), meta right (acceptance %, submission count)
- Shows full problem statement including examples
- CTA: [Login to Start Coding] → redirects to `app.prepforall.com/problems/[slug]`
- Related problems section for internal linking
- Does NOT show editor or allow code submission

#### SEO implementation

- `<title>`: "{Problem Title} - PrepForAll"
- `<meta description>`: "Solve {title} on PrepForAll. {description first 150 chars}..."
- JSON-LD structured data: `@type: LearningResource` with educationalLevel, about (tags), provider
- Open Graph tags for social sharing preview
- Canonical URL: `prepforall.com/problems/{slug}`
- Sitemap generated via `next-sitemap` with all problem slugs

### For Universities Page (`/for-universities`)

- **Hero**: "Partner with PrepForAll" + subtext + [Request a Demo ↓]
- **What We Deliver**: 3 alternating left-right sections with screenshots:
  1. Coding Platform — 200+ DSA & SQL problems, LeetCode-grade editor, 6 languages
  2. Test & Assessment Engine — timed tests, batch assignment, company-specific prep (TCS, Infosys, Cognizant)
  3. Analytics Dashboard — student progress, batch reports, at-risk flags, NAAC/NIRF exports
- **How It Works**: 5 numbered steps (Sign MOU → Trainers onboarded → Students enrolled → Tests assigned → Track & report)
- **What's Included**: checklist (platform access, trainer onboarding, co-branded certs, test templates, exportable reports, priority support)
- **Partner Logos**: university logos
- **Request a Demo form**: Institution Name, Your Name, Email, Phone, Number of Students, Message → Go API → stored in DB + notification email + WhatsApp link

### Features Page (`/features`)

One section per feature with alternating screenshot placement:
1. **Code Editor** — Monaco editor, multi-language, auto-complete, dark/light themes
2. **Sandboxed Execution** — gVisor isolation, 6 languages + SQL, instant verdicts
3. **Contests** — Rated contests, live leaderboards, ICPC/IOI style
4. **Test Engine** — Timed tests, batch assignment, proctoring, company-specific templates
5. **Analytics** — Topic breakdown, heatmaps, at-risk student flags, exportable reports
6. **Mock Interviews** (Coming Soon) — Video + collaborative coding

Final CTA: [Request a Demo]

### About Page (`/about`)

- Hero: "We're building the platform we wish we had in college."
- Our Story: 2-3 paragraphs on why PrepForAll exists
- Our Mission: Bridge academia-industry gap in CS education
- Team: 3-5 core team members with photos, roles, one-line bios
- Values: 3 cards (Quality, Transparency, Student-first)
- Final CTA: [Contact Us]

### Pricing Page (`/pricing`)

- Heading: "Simple, transparent pricing for institutions"
- 3 tiers: Starter (up to 100 students), Growth (up to 500, popular), Enterprise (unlimited)
- Feature comparison grid per tier
- All plans include: trainer onboarding, co-branded certs, exportable reports
- CTA per tier: [Contact for Quote] — no public pricing numbers (B2B negotiation)
- FAQ accordion below pricing cards

### Contact Page (`/contact`)

- Two-column: info left (email, phone, address, social links) + form right (Name, Email, Subject, Message, [Send Message])

### Technical Implementation

| Decision | Choice |
|---|---|
| Rendering | SSG + ISR (problems revalidate hourly, static pages on deploy) |
| Styling | Tailwind CSS + @prepforall/tokens design tokens |
| Typography | DM Sans (headings) + Inter (body) + JetBrains Mono (code) |
| Forms | Next.js Server Actions → Go API |
| Site Analytics | Plausible (self-hosted) or PostHog — privacy-friendly, no cookie banner |
| Problem data | ISR — fetched from Go API at build time, revalidated every hour |
| Sitemap | next-sitemap — auto-generates with all problem slugs |
| Blog | Deferred — add later as MDX in `content/blog/` |

### Performance Targets

- Lighthouse score: >90 on all pages
- LCP: <2.5s
- CLS: <0.1
- FID: <100ms
- First load bundle: <150KB (code-split per page)

---

## 6. Platform App (apps/platform)

Vite + TanStack Router/Query/Table/Virtual SPA. Deployed as static files to Cloudflare Pages at `app.prepforall.com`.

### Route structure

```
src/routes/
├── __root.tsx                      # Root layout (auth guard, sidebar)
├── auth/
│   ├── login.tsx                   # Login modal fallback page
│   └── setup.tsx                   # Invite setup (?token=abc123)
│
├── dashboard/
│   └── index.tsx                   # Role-based dashboard
│
├── problems/
│   ├── index.tsx                   # Problem list (filterable, tabs: All/DSA/SQL/Assigned)
│   └── $slug.tsx                   # Problem workspace (split-pane: statement + editor)
│
├── contests/
│   ├── index.tsx                   # Contest list
│   └── $contestId.tsx              # Contest workspace
│
├── tests/
│   ├── index.tsx                   # Student: my tests | Trainer: manage tests
│   ├── $testId.tsx                 # Take test (student) / view results (trainer)
│   └── create.tsx                  # Trainer: create test
│
├── analytics/
│   ├── index.tsx                   # Overview dashboard
│   ├── student.$userId.tsx         # Individual student report
│   └── batch.$batchId.tsx          # Batch analytics + leaderboard
│
├── batches/
│   ├── index.tsx                   # List batches
│   └── $batchId.tsx                # Batch detail (students, tests, progress)
│
├── org/
│   ├── settings.tsx                # Org settings
│   └── members.tsx                 # Manage trainers
│
├── profile/
│   └── index.tsx                   # User profile, solve stats
│
├── admin/
│   ├── organizations.tsx           # Super Admin: manage all orgs
│   ├── problems.tsx                # Global problem management
│   └── users.tsx                   # User management
│
└── interviews/                     # Sub-project 4 (deferred)
    ├── index.tsx
    └── $sessionId.tsx
```

### Libraries

| Library | Purpose |
|---|---|
| TanStack Router | File-based routing, type-safe params, auth guards via `beforeLoad` |
| TanStack Query | Server state, caching, optimistic updates |
| TanStack Table | Problem lists, leaderboards, analytics tables, sortable/filterable |
| TanStack Virtual | Virtualized scrolling for large lists |
| Zustand | Client state (editor settings, theme, sidebar collapse) |
| Monaco Editor | Code editor for DSA (multi-language) and SQL (PostgreSQL) |
| Recharts | Analytics charts (line, bar, radar, heatmap) |
| @prepforall/react | Design system components |
| @prepforall/icons | SVG icon components |

### Dashboards (role-based)

**Student dashboard:** stat cards (problems solved, tests pending, contests upcoming), recent activity feed, skill radar chart, upcoming deadlines.

**Trainer dashboard:** stat cards (students, active batches, tests created), batch performance table, pending reviews.

**Org Admin dashboard:** stat cards (trainers, students, batches), trainer activity table, org-wide stats.

**Super Admin:** all orgs overview, global stats, user management links.

### Problem workspace (split-pane)

- **Left pane:** Problem description (tabs: Description, Solutions, Submissions)
- **Right pane top:** Monaco editor with language selector (C++, Java, Python, JS, Go, PostgreSQL)
- **Right pane bottom:** Output panel (tabs: Testcase, Result, Console)
- **Resizable split** — drag handle between panes
- **Run** — executes against sample test cases only (instant feedback)
- **Submit** — executes against all hidden test cases (verdict via WebSocket)
- **Code persistence** — per-problem, per-language in localStorage via Zustand

**SQL workspace differences:**
- Table schema shown visually in description (rendered as HTML table)
- Output panel renders query results as a table
- Result comparison is set-based
- Language selector fixed to PostgreSQL

### State management

```
Zustand (editorStore):
├── code: string
├── language: string
├── theme: 'light' | 'dark'
├── fontSize: number
└── savedCodes: Map<problemSlug, Map<language, string>>

TanStack Query:
├── useQuery(['problem', slug])
├── useQuery(['submissions', slug])
├── useMutation(submitCode)
└── useMutation(runCode)
```

---

## 7. Backend Architecture (Go API)

Modular monolith with uber/dig dependency injection. Inspired by DTSL Go boilerplate patterns.

### Module structure

```
services/api/
├── cmd/api/main.go                 # Entry point, DI container init
├── config/config.go
│
├── internal/
│   ├── container/                  # uber/dig DI container
│   │   └── container.go
│   │
│   ├── auth/                       # JWT auth + OAuth (Google, GitHub)
│   │   ├── handler.go
│   │   ├── model.go
│   │   ├── repository.go
│   │   ├── service.go
│   │   ├── oauth_google.go
│   │   └── oauth_github.go
│   │
│   ├── users/                      # Profiles, stats
│   ├── problems/                   # DSA + SQL problem CRUD
│   ├── submissions/                # Submit code, result consumer
│   ├── contests/                   # Contest management
│   ├── leaderboard/                # Redis sorted set rankings
│   ├── realtime/                   # WebSocket hub + Redis Pub/Sub
│   ├── organizations/              # Multi-tenancy: org CRUD
│   ├── batches/                    # Batch management
│   ├── tests/                      # Test assignment system
│   ├── analytics/                  # Reporting engine
│   └── interviews/                 # Mock interviews (deferred)
│
├── pkg/
│   ├── database/postgres.go
│   ├── cache/redis.go
│   ├── errors/errors.go            # Centralized error types with wrapping
│   ├── logger/logger.go            # Structured JSON logging (zap)
│   ├── metrics/metrics.go          # Prometheus metrics
│   ├── middleware/
│   │   ├── auth.go
│   │   ├── cors.go
│   │   ├── logger.go
│   │   ├── metrics.go
│   │   ├── rate_limiter.go
│   │   └── rbac.go                 # Role-based access control
│   ├── queue/job.go
│   ├── storage/s3.go               # OVH S3-compatible
│   └── tracing/otel.go             # OpenTelemetry
│
└── migrations/
```

### DI pattern (uber/dig)

```go
// internal/container/container.go
func NewContainer(cfg *config.Config) *dig.Container {
    c := dig.New()
    c.Provide(func() *config.Config { return cfg })
    c.Provide(database.NewPostgres)
    c.Provide(cache.NewRedis)
    c.Provide(storage.NewS3)
    // repositories
    c.Provide(auth.NewRepository)
    c.Provide(users.NewRepository)
    c.Provide(problems.NewRepository)
    // services
    c.Provide(auth.NewService)
    c.Provide(users.NewService)
    // handlers
    c.Provide(auth.NewHandler)
    c.Provide(users.NewHandler)
    // ...
    return c
}
```

### RBAC middleware

Enforces role-based access at the route level:
- Super Admin → full access
- Org Admin → only their org's data (org_id injected from JWT claims)
- Trainer → only their batches' data
- Student → only their own data + assigned tests

---

## 8. Database Schema

### Existing tables (from SYSTEM_PLAN.md)

```sql
users, problems, test_cases, submissions, contests,
contest_problems, contest_participants, rating_history
```

**Modified existing table:**

```sql
-- Add org_id to users for direct org membership (students)
ALTER TABLE users ADD COLUMN org_id UUID REFERENCES organizations(id);
ALTER TABLE users ADD COLUMN role TEXT CHECK (role IN ('super_admin', 'org_admin', 'trainer', 'student'));
```

### New tables

```sql
-- Multi-tenancy
organizations (
  id UUID PK,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

org_members (
  org_id UUID FK → organizations,
  user_id UUID FK → users,
  role TEXT CHECK (role IN ('org_admin', 'trainer')),
  PRIMARY KEY (org_id, user_id)
)

-- Batch management
batches (
  id UUID PK,
  org_id UUID FK → organizations,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  created_by UUID FK → users,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

batch_students (
  batch_id UUID FK → batches,
  user_id UUID FK → users,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (batch_id, user_id)
)

-- Test assignment
assigned_tests (
  id UUID PK,
  org_id UUID FK → organizations,
  batch_id UUID FK → batches,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT CHECK (type IN ('coding', 'sql', 'mixed')),
  time_limit_mins INT NOT NULL,
  created_by UUID FK → users,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_published BOOLEAN DEFAULT FALSE,
  proctoring_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

test_problems (
  test_id UUID FK → assigned_tests,
  problem_id UUID FK → problems,
  display_order INT,
  points INT DEFAULT 10,
  PRIMARY KEY (test_id, problem_id)
)

test_attempts (
  id UUID PK,
  test_id UUID FK → assigned_tests,
  user_id UUID FK → users,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  score INT,
  total_possible INT,
  status TEXT CHECK (status IN ('in_progress', 'submitted', 'expired')),
  tab_switch_count INT DEFAULT 0,
  UNIQUE (test_id, user_id)
)

-- OAuth
oauth_accounts (
  id UUID PK,
  user_id UUID FK → users,
  provider TEXT CHECK (provider IN ('google', 'github')),
  provider_id TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (provider, provider_id)
)

user_invites (
  id UUID PK,
  email TEXT NOT NULL,
  org_id UUID FK → organizations,
  batch_id UUID FK → batches,
  role TEXT CHECK (role IN ('student', 'trainer', 'org_admin')),
  token TEXT UNIQUE NOT NULL,
  invited_by UUID FK → users,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
)

-- Demo requests (from marketing site)
demo_requests (
  id UUID PK,
  institution_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

### Key indexes

```sql
-- Multi-tenancy
CREATE INDEX idx_org_members_user ON org_members(user_id);
CREATE INDEX idx_batches_org ON batches(org_id);
CREATE INDEX idx_batch_students_user ON batch_students(user_id);

-- Tests
CREATE INDEX idx_assigned_tests_batch ON assigned_tests(batch_id);
CREATE INDEX idx_assigned_tests_org ON assigned_tests(org_id);
CREATE INDEX idx_test_attempts_user ON test_attempts(user_id);
CREATE INDEX idx_test_attempts_test ON test_attempts(test_id);

-- OAuth
CREATE INDEX idx_oauth_user ON oauth_accounts(user_id);
CREATE INDEX idx_invites_email ON user_invites(email);
CREATE INDEX idx_invites_token ON user_invites(token);
```

---

## 9. Authentication System

### Login (modal-based, LeetCode-style)

Login appears as a modal overlay on the current page. User stays in context.

**Options:**
- Email + password
- Continue with Google (OAuth 2.0)
- Continue with GitHub (OAuth 2.0)

No "Create Account" link. B2B invite-only.

### OAuth flow (Google/GitHub)

1. User clicks "Continue with Google" → frontend opens popup to `GET /api/v1/auth/google`
2. API redirects to Google OAuth consent screen
3. User approves → Google redirects to `GET /api/v1/auth/google/callback?code=xxx`
4. API exchanges code for Google profile (email, name, avatar)
5. API looks up user by email → must already exist (invite-only)
6. User exists → issue JWT + set refresh token cookie → popup returns tokens via `postMessage`
7. User doesn't exist → reject with "No account found. Contact your admin."
8. Parent window stores JWT in Zustand, closes popup, refetches data

### Registration (invite-only)

1. Admin creates invite: `POST /api/v1/users/invite { email, role, org_id, batch_id }`
2. Email sent with setup link: `app.prepforall.com/auth/setup?token=abc123`
3. User clicks link → setup page: choose username + password, OR link Google/GitHub
4. Account activated → redirected to dashboard

### Token strategy

| Token | Storage | Lifetime |
|---|---|---|
| Access JWT (HS256) | Zustand (memory) | 15 min |
| Refresh token | httpOnly cookie | 7 days |
| Invite token | DB + email link | 72 hours |

### Password reset

Standard email reset link flow:
1. User clicks "Forgot password?" → enters email
2. API sends reset email with token link (expires 1 hour)
3. User clicks link → set new password
4. Token invalidated after use

### Auth guard (TanStack Router)

`beforeLoad` on `__root.tsx` checks JWT validity. If expired, attempts silent refresh. If refresh fails, shows login modal without redirecting away from current page.

---

## 10. Code Execution (Judge) System

Unchanged from SYSTEM_PLAN.md. Key points:

- **DSA judge:** Docker containers with gVisor (`--runtime=runsc`), per-test-case execution
- **SQL judge:** Temporary PostgreSQL container per submission, query executed against pre-loaded schema, result set comparison
- **Supported languages:** C++, C, Java, Python 3, JavaScript, Go, PostgreSQL
- **Flow:** User submits → API enqueues to Redis Stream → Judge worker processes → Result via Redis Stream → API writes to DB → WebSocket pushes verdict
- **Security:** 10-layer sandbox (gVisor, no network, read-only FS, memory/CPU/PID limits, non-root user)

### SQL judge specifics

- Spin up temporary PostgreSQL container per submission
- Load problem-specific schema + seed data (from S3)
- Execute user's SQL query with timeout (10s)
- Compare result set with expected output (order-insensitive option per problem)
- Tear down container after verdict

---

## 11. Test Assignment System

### Trainer creates a test

- Pick problems from the problem bank (modal picker with search/filter)
- Set time limit, points per problem, schedule window
- Assign to a batch
- Save as draft or publish immediately

### Student takes a test

- Countdown timer always visible, auto-submits on expiry
- Problem navigation bar (solved/attempted/not started indicators)
- Same split-pane workspace as regular problem solving
- Code persists in localStorage (survives browser crash)
- Submit Test locks all problems

### Anti-cheating (basic)

- Tab switch detection (`visibilitychange` event) — count logged, shown to trainer
- Copy-paste tracking in editor — logged
- IP logging per session
- Optional "proctoring mode" flag per test (trainer enables)

### Test lifecycle

```
Draft → Published → Live (during schedule window) → Ended
```

Trainer can view results at any stage after the test starts.

---

## 12. Analytics Engine

### Student progress view

Visible to: trainer, org admin, super admin (for their scope)

- Stat cards: problems solved, tests taken, avg score, streak
- Topic-wise breakdown table (topic, solved, total, accuracy, progress bar)
- Test performance history table (test, score, rank, date)
- Activity heatmap (GitHub-style, daily solve activity)

### Batch analytics view

Visible to: trainer (own batches), org admin (all org batches)

- Stat cards: avg score, avg solve rate, active students (7d), test completion rate
- Student leaderboard (rank, name, solved, avg score, trend)
- Topic-wise aggregate performance
- Test results trend (line chart over weeks)
- At-risk students (< 40% avg OR inactive > 3 days) — flagged automatically

### Org-wide analytics

Visible to: org admin

- Cross-batch comparison
- Trainer activity overview
- Export to CSV/PDF for reporting to college management

### Technical approach

- **Charts:** Recharts (lightweight, React-native)
- **Query strategy:** Compute on read (no materialized views yet). Add materialized views when queries get slow (>10K students).
- **Backend:** `internal/analytics/repository.go` with aggregation queries against submissions, test_attempts, batch_students tables.

---

## 13. Mock Interview Portal (Deferred)

Designed but deferred to Sub-project 4. Key decisions already made:

- **Video/audio:** Third-party SDK (100ms, Daily.co, or Livekit) — not self-hosted WebRTC
- **Collaborative editor:** Monaco Editor with Yjs (CRDT) for real-time collaboration
- **Code execution:** Reuse existing judge system
- **Scheduling:** Trainer creates interview slot, student books it
- **Cost estimate:** ~$0.004/participant/minute (~$48/mo at 100 interviews/month)

---

## 14. Deployment Architecture (OVH K8s + Cloudflare)

### Topology

```
Users → Cloudflare (CDN/WAF/DDoS/DNS) → Static assets: Cloudflare Pages
                                        → API/WS: OVH K8s Ingress → API pods
```

### DNS routing

| Domain | Destination |
|---|---|
| `prepforall.com` | Cloudflare Pages (`apps/marketing`) |
| `app.prepforall.com` | Cloudflare Pages (`apps/platform`) |
| `api.prepforall.com` | Cloudflare proxy → OVH K8s Ingress → API pods |

### OVH K8s cluster

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

### Kubernetes manifests (Kustomize)

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

### Secrets management

Sealed Secrets — encrypted in git, only the cluster can decrypt. No plaintext secrets in the repo.

| Secret | Where stored |
|---|---|
| DATABASE_URL, REDIS_ADDR, JWT_SECRET | K8s Secret (sealed) |
| OAuth client IDs/secrets | K8s Secret (sealed) |
| OVH Container Registry creds | GitHub Actions secret |
| Cloudflare API token | GitHub Actions secret |

---

## 15. CI/CD Pipelines

### Frontend (GitHub Actions → Cloudflare Pages)

```
Push to main (apps/marketing/** or apps/platform/**)
  ├── Lint (ESLint)
  ├── Type check (tsc --noEmit)
  ├── Build
  └── Deploy to Cloudflare Pages (wrangler CLI)
```

### API (GitHub Actions → OVH K8s)

```
Push to main (services/api/**)
  ├── Lint (golangci-lint)
  ├── Test (with Postgres + Redis service containers, coverage >= 70%)
  ├── Build Docker image (multi-stage: Go builder → Debian slim)
  ├── Push to OVH Container Registry
  └── kubectl set image deployment/api (rolling update, zero downtime)
```

### Judge (GitHub Actions → OVH K8s)

```
Push to main (services/judge/**)
  ├── Lint + Test
  ├── Build judge image + sandbox images (cpp, python, java, node, postgres)
  ├── Push to OVH Container Registry
  └── kubectl set image deployment/judge (rolling update)
```

---

## 16. Cost Estimate

### Production (launch)

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

### Scaling path

| Scale | Users | Estimated Cost |
|---|---|---|
| Launch | 0-500 | ~$75/mo |
| Growing | 500-2K | ~$120/mo (add nodes) |
| Scale | 2K-10K | ~$250/mo (more judge workers, larger DB) |
| Large | 10K+ | ~$500+/mo (evaluate migration to AWS/GCP) |

---

## 17. Key Technology Decisions

| Decision | Choice | Reason |
|---|---|---|
| Marketing framework | Next.js 15 (SSG + ISR) | SEO, public problem archive, server rendering |
| Platform framework | Vite + TanStack Router/Query/Table | Stable libraries (not beta), SPA behind auth, no SSR needed |
| Why not TanStack Start | Beta risk, SSR unnecessary for auth'd pages | Migration path from Vite+TanStack Router is trivial if Start stabilizes |
| Backend | Go modular monolith + chi + pgx + uber/dig | Performance, DI for testability, existing codebase |
| Code runner (DSA) | Docker + gVisor sandbox | Battle-tested isolation, existing implementation |
| Code runner (SQL) | Temporary PostgreSQL container per submission | Matches DSA pattern, secure isolation |
| Design system | Naos-inspired layered atomic design | Tokens → CSS → React, shared across both apps |
| Infrastructure | OVH Managed K8s | Free control plane, cheapest managed K8s, single dashboard |
| Frontend hosting | Cloudflare Pages | Free, global CDN, automatic deploys |
| K8s manifests | Kustomize (not Helm) | Simpler for current scale, plain YAML overlays |
| Auth | JWT + OAuth (Google, GitHub) + invite-only | B2B model, no public registration |
| Real-time | WebSocket + Redis Pub/Sub | Fan-out across API instances |
| Analytics charts | Recharts | Lightweight, React-native |
| Mock interview video | Third-party SDK (deferred) | Build vs buy — buy at this stage |
| Secrets | Sealed Secrets | Encrypted in git, cluster-only decryption |
| Portability | All services containerized, K8s-native | Move to any K8s provider by re-applying manifests |

---

*Last updated: April 5, 2026 — PrepForAll Engineering*
