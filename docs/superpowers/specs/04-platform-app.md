# 04 — Platform App (apps/platform)

> Vite + TanStack Router/Query/Table/Virtual SPA. Deployed as static files to Cloudflare Pages at `app.prepforall.com`.

**Related specs:** [02-design-system](02-design-system.md), [07-authentication](07-authentication.md), [08-judge-system](08-judge-system.md), [09-test-assignment](09-test-assignment.md), [10-analytics-engine](10-analytics-engine.md)

---

## Route Structure

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

## Libraries

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

## Component Ownership

**Presentational components** → `packages/platform-ui/` (`@prepforall/platform-ui`):

```
packages/platform-ui/src/
├── atomic/                  # VerdictBadge, DifficultyTag, LanguageIcon
├── molecular/               # StatCards, TimerDisplay, ProblemListItem, TestNavBar
└── organisms/               # CodeEditor (Monaco wrapper), SubmissionPanel,
                             # LeaderboardTable, ActivityHeatmap, AnalyticsCharts,
                             # BatchStudentTable, TestResultsTable
```

**Page orchestration** (data fetching, state, WebSocket, composition) → `apps/platform/features/`:

```
apps/platform/features/
├── ProblemWorkspace/        # Orchestrates CodeEditor + SubmissionPanel + WebSocket verdicts
├── TestSession/             # Orchestrates TimerDisplay + TestNavBar + auto-submit logic
├── Dashboard/               # Role-based data fetching + StatCards composition
├── BatchManager/            # Batch CRUD + API calls + student management
├── TestCreator/             # Test builder with problem picker modal + API
└── AnalyticsDashboard/      # Data fetching + AnalyticsCharts composition
```

Shared primitives (Button, Modal, Card, Tabs, etc.) come from `@prepforall/react`.

## Dashboards (role-based)

**Student dashboard:** stat cards (problems solved, tests pending, contests upcoming), recent activity feed, skill radar chart, upcoming deadlines.

**Trainer dashboard:** stat cards (students, active batches, tests created), batch performance table, pending reviews.

**Org Admin dashboard:** stat cards (trainers, students, batches), trainer activity table, org-wide stats.

**Super Admin:** all orgs overview, global stats, user management links.

## Problem Workspace (split-pane)

- **Left pane:** Problem description (tabs: Description, Solutions, Submissions)
- **Right pane top:** Monaco editor with language selector (C++, Java, Python, JS, Go, PostgreSQL)
- **Right pane bottom:** Output panel (tabs: Testcase, Result, Console)
- **Resizable split** — drag handle between panes
- **Run** — executes against sample test cases only (instant feedback)
- **Submit** — executes against all hidden test cases (verdict via WebSocket)
- **Code persistence** — per-problem, per-language in localStorage via Zustand

### SQL workspace differences

- Table schema shown visually in description (rendered as HTML table)
- Output panel renders query results as a table
- Result comparison is set-based
- Language selector fixed to PostgreSQL

## State Management

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

*Last updated: April 5, 2026*
