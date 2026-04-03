# PrepForAll — Complete System Plan

> Competitive programming platform (LeetCode + Codeforces inspired)
> Tech: Next.js 15 · TanStack Query · Go · PostgreSQL · Redis · Docker · AWS · Cloudflare

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Monorepo Structure](#2-monorepo-structure)
3. [System Architecture](#3-system-architecture)
4. [Service Breakdown](#4-service-breakdown)
5. [Code Execution (Judge) System](#5-code-execution-judge-system)
6. [Real-Time WebSocket Architecture](#6-real-time-websocket-architecture)
7. [Database Schema](#7-database-schema)
8. [Caching Strategy (Redis)](#8-caching-strategy-redis)
9. [API Gateway & Nginx](#9-api-gateway--nginx)
10. [Observability Stack](#10-observability-stack)
11. [CI/CD Pipelines](#11-cicd-pipelines)
12. [Infrastructure (AWS + Cloudflare)](#12-infrastructure-aws--cloudflare)
13. [Security Model](#13-security-model)
14. [Development Phases](#14-development-phases)

---

## 1. Project Overview

PrepForAll is a competitive programming platform that provides:

- A rich code editor (Monaco) with multi-language support
- A secure, sandboxed code runner (judge) for evaluating submissions
- Real-time verdict delivery via WebSocket
- Contests with live leaderboards
- Global rating and ranking system
- User profiles with solve statistics

**Core Principles:**
- Security first — code execution is fully isolated from the API
- Scalability — every component scales independently
- Observability — every system is instrumented from day one
- Decoupled — services communicate through Redis Streams, not direct calls

---

## 2. Monorepo Structure

```
coding-prepforall/
├── apps/
│   └── web/                        # Next.js 15 frontend (App Router)
│       ├── app/
│       │   ├── (auth)/             # Login, Register pages
│       │   └── (main)/             # Protected: Problems, Contests, Leaderboard, Profile
│       ├── components/
│       │   ├── editor/             # Monaco editor + language selector
│       │   ├── problem/            # Problem statement, list, workspace, output panel
│       │   ├── contest/            # Contest cards, timer, live leaderboard
│       │   └── layout/             # Navbar, sidebar
│       ├── lib/
│       │   ├── api/                # Axios API clients (problems, submissions, auth)
│       │   └── hooks/              # TanStack Query hooks + WebSocket hook
│       ├── providers/              # QueryProvider, AuthProvider, ThemeProvider
│       ├── store/                  # Zustand stores (editor state, submission state)
│       └── types/                  # TypeScript interfaces
│
├── services/
│   ├── api/                        # Go API server (Modular Monolith)
│   │   ├── cmd/api/main.go         # Entry point
│   │   ├── internal/
│   │   │   ├── auth/               # JWT auth (register, login, refresh, logout)
│   │   │   ├── users/              # Profiles, stats
│   │   │   ├── problems/           # Problem CRUD + test case serving
│   │   │   ├── submissions/        # Submit code + Result Consumer (Redis→DB writer)
│   │   │   ├── contests/           # Contest management
│   │   │   ├── leaderboard/        # Redis Sorted Set rankings
│   │   │   └── realtime/           # WebSocket Hub + Redis Pub/Sub Broker
│   │   └── pkg/
│   │       ├── database/           # PostgreSQL pool (pgx/v5)
│   │       ├── cache/              # Redis client (go-redis)
│   │       ├── queue/              # Redis Stream job structs + helpers
│   │       ├── storage/            # AWS S3 client (test case files)
│   │       ├── middleware/         # Auth, logger, metrics, rate limiter
│   │       ├── metrics/            # Prometheus metrics registry
│   │       ├── logger/             # Structured JSON logging (zap)
│   │       └── errors/             # Centralized error types + JSON writer
│   │
│   └── judge/                      # Go judge worker (separate binary, separate EC2 pool)
│       ├── cmd/judge/main.go        # Entry point
│       └── internal/
│           ├── worker/             # Redis Stream consumer (one job at a time)
│           └── runner/
│               ├── runner.go       # Orchestrates compile + run per test case
│               ├── sandbox.go      # Builds Docker args with gVisor + resource limits
│               ├── languages.go    # Language → Docker image + compile/run commands
│               └── verdict.go      # Output comparison + verdict determination
│
├── infrastructure/
│   ├── nginx/api.conf              # Nginx reverse proxy config (rate limiting, WS upgrade)
│   ├── terraform/                  # AWS infra as code (VPC, EC2 ASG, RDS, ElastiCache, S3)
│   └── observability/
│       ├── prometheus/             # Prometheus scrape config
│       ├── grafana/dashboards/     # Pre-built Grafana dashboards
│       ├── loki/                   # Log aggregation config
│       └── promtail/               # Log shipper config
│
├── .github/workflows/
│   ├── api.yml                     # Go API: lint → test → build → ECR → rolling deploy
│   ├── judge.yml                   # Judge worker: lint → test → build → ECR → deploy
│   └── frontend.yml                # Next.js: lint → typecheck → build → Amplify deploy
│
├── docker-compose.yml              # Local dev: all services + observability stack
├── docs/SYSTEM_PLAN.md             # This file
└── Makefile                        # Dev commands
```

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     USERS (Browser)                           │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTPS / WSS
┌────────────────────────▼─────────────────────────────────────┐
│            CLOUDFLARE (CDN · DDoS · WAF · Edge Cache)         │
└──────┬─────────────────────────────────┬─────────────────────┘
       │ Static assets                   │ API / WS
┌──────▼──────┐                ┌─────────▼─────────────────────┐
│  Next.js    │                │  AWS ALB                       │
│  (Amplify)  │                │  - SSL termination             │
└─────────────┘                │  - Path routing (/api, /ws)    │
                               │  - Health checks               │
                               │  - WS sticky sessions          │
                               └─────────┬──────────────────────┘
                                         │
                          ┌──────────────┴──────────────┐
                          │        EC2 Auto Scaling       │
                          │        (API Instances)        │
                          │                               │
                          │  Nginx  →  Go API :8080       │
                          │  ├── /api/*  routes           │
                          │  ├── /ws     WebSocket        │
                          │  └── /metrics Prometheus      │
                          └──────────────────────────────┘
                                         │
              ┌──────────────────────────┼─────────────────────────────┐
              │                          │                             │
  ┌───────────▼─────────┐   ┌────────────▼──────────┐   ┌────────────▼──────┐
  │  PostgreSQL (RDS)    │   │  Redis Cluster         │   │  AWS S3            │
  │  - Primary (writes)  │   │  (ElastiCache)         │   │  (test case files) │
  │  - Read replica      │   │  ├── Pub/Sub (WS fan)  │   │  (user avatars)    │
  │    (analytics)       │   │  ├── Streams (queues)  │   └────────────────────┘
  └─────────────────────┘    │  ├── Key-Value (cache) │
                              │  └── Sorted Sets       │
                              │      (leaderboards)    │
                              └────────────┬──────────┘
                                           │
                              ┌────────────▼──────────────────────┐
                              │  EC2 Auto Scaling (Judge Workers)  │
                              │  (Private subnet — no public IP)   │
                              │                                    │
                              │  Judge Process                     │
                              │   └── docker run --runtime=runsc   │
                              │       (gVisor sandbox per test)    │
                              └────────────────────────────────────┘
                                           │
                              ┌────────────▼──────────────────────┐
                              │  Observability                     │
                              │  Prometheus → Grafana              │
                              │  Promtail → Loki → Grafana         │
                              └────────────────────────────────────┘
```

---

## 4. Service Breakdown

### 4.1 API Server (Go — Modular Monolith)

| Module | Responsibility |
|---|---|
| `auth` | Register, login, JWT issue, token blacklisting in Redis |
| `users` | Public profiles, solve statistics aggregation |
| `problems` | Problem CRUD, tag filtering, test case serving (S3 + Redis cache) |
| `submissions` | Receive code, create DB record, enqueue to Redis Stream |
| `submissions/result_consumer` | Read judge results from Redis Stream, write to DB, publish to Pub/Sub |
| `contests` | Contest CRUD, problem assignment, participant registration |
| `leaderboard` | Global ranking (Redis Sorted Set), contest ranking (live) |
| `realtime` | WebSocket hub (local connections) + Redis Pub/Sub broker (cross-instance) |

### 4.2 Judge Worker (Go — Separate Binary)

| Component | Responsibility |
|---|---|
| `worker` | Reads from Redis Stream `submissions:queue` (one job per worker) |
| `runner` | Coordinates compilation and per-test-case execution |
| `sandbox` | Builds `docker run` args with full security isolation |
| `languages` | Maps language → Docker image + compile/run commands |
| `verdict` | Output normalization + comparison + verdict determination |

**Critical Design:** The judge worker has **zero database access**. It only reads from Redis Stream (input) and writes to Redis Stream (output). The API result consumer handles all DB writes.

---

## 5. Code Execution (Judge) System

### 5.1 Full Submission Flow

```
1. User clicks Submit
   │
   ▼
2. POST /api/v1/submissions
   API validates request
   Writes submission to DB (verdict = PENDING)
   Enqueues job to Redis Stream: submissions:queue
   Returns { id, verdict: "PENDING" }
   │
   ▼
3. Frontend opens WebSocket: /ws?submission_id={id}
   Hub registers connection locally on that API instance
   │
   ▼
4. Judge Worker (separate EC2) reads job from Redis Stream (XReadGroup)
   Only ONE worker processes each job (consumer group guarantees this)
   │
   ▼
5. Judge Worker fetches test cases from S3
   (hot problems cached in Redis by API)
   │
   ▼
6. For each test case:
   docker run --runtime=runsc   ← gVisor kernel isolation
              --network=none    ← zero network
              --read-only       ← immutable filesystem
              --memory=256m     ← hard memory cap
              --cpus=0.5        ← CPU cap
              --pids-limit=50   ← no fork bombs
              --cap-drop=ALL    ← drop all capabilities
              timeout {limit}s  ← hard time kill
              {language image}
   Capture stdout, measure time, compare with expected
   │
   ▼
7. Verdict determined: AC / WA / TLE / MLE / RE / CE
   Published to Redis Stream: results:stream
   (XAck the submission job)
   │
   ▼
8. API Result Consumer (background goroutine on API) reads results:stream
   Exactly ONE API instance processes each result (XReadGroup)
   Writes verdict to PostgreSQL
   Publishes verdict to Redis Pub/Sub: "sub:{submissionId}"
   │
   ▼
9. Redis Pub/Sub fans out to ALL API instances
   Only the instance holding that WebSocket delivers the message
   Client receives verdict in real-time
```

### 5.2 Sandbox Security Layers

| Layer | Mechanism | Protection Against |
|---|---|---|
| 1 | `--runtime=runsc` (gVisor) | Kernel exploits via syscall interception |
| 2 | `--network=none` | Network exfiltration, external calls |
| 3 | `--read-only` + `--tmpfs /sandbox` | Filesystem tampering |
| 4 | `--memory=256m --memory-swap=256m` | Memory bombs |
| 5 | `--cpus=0.5` | CPU starvation |
| 6 | `--pids-limit=50` | Fork bombs |
| 7 | `--cap-drop=ALL` | Privilege escalation |
| 8 | `--security-opt=no-new-privileges` | setuid/setgid abuse |
| 9 | `timeout {n}s` | Infinite loops (hard kill) |
| 10 | Non-root user in image | Root inside container |

### 5.3 Supported Languages

| Language | Compile | Run | Sandbox Image |
|---|---|---|---|
| C++ | `g++ -O2` | `./solution` | `prepforall/sandbox-cpp` |
| C | `gcc -O2` | `./solution` | `prepforall/sandbox-cpp` |
| Java | `javac` | `java -cp /sandbox Solution` | `prepforall/sandbox-java` |
| Python 3 | — | `python3 solution.py` | `prepforall/sandbox-python` |
| JavaScript | — | `node solution.js` | `prepforall/sandbox-node` |
| Go | `go build` | `./solution` | `prepforall/sandbox-go` |

---

## 6. Real-Time WebSocket Architecture

### Problem with Naive Hub

A single WebSocket hub inside the API works locally but fails at scale:

```
Client A (connected to Instance 1)
Judge publishes result → Instance 2 processes it
Instance 2 has no Client A connection → message lost ✗
```

### Solution: Redis Pub/Sub Fan-Out

```
Judge Worker
    │
    └── XADD results:stream  (verdict payload)
                │
         API Result Consumer (exactly one instance via XReadGroup)
                │
          ┌─────┴─────┐
          │           │
    PostgreSQL    Redis PUBLISH "sub:{id}"
                       │
           ┌───────────┼───────────┐
           ▼           ▼           ▼
      Instance 1  Instance 2  Instance 3
      (subscribed to "sub:*" via PSubscribe)
           │
      Has Client A's WebSocket → delivers ✓
      Others discard (no local connection)
```

### Components

| Component | File | Role |
|---|---|---|
| `Hub` | `internal/realtime/hub.go` | Manages local WS connections per instance |
| `Broker` | `internal/realtime/broker.go` | Redis PSubscribe + DeliverLocal |
| `Handler` | `internal/realtime/handler.go` | HTTP upgrade → WebSocket |
| `ResultConsumer` | `internal/submissions/result_consumer.go` | Writes DB + publishes Pub/Sub |

---

## 7. Database Schema

### Core Tables

```sql
users
  id UUID PK | username UNIQUE | email UNIQUE | password_hash
  role | rating INT DEFAULT 1500 | avatar_url | bio | created_at

problems
  id UUID PK | slug UNIQUE | title | description | difficulty ENUM(easy,medium,hard)
  tags TEXT[] | time_limit_ms INT | memory_limit_mb INT
  acceptance_rate | total_submissions | is_public | author_id FK

test_cases
  id UUID PK | problem_id FK | s3_input_key | s3_output_key
  is_sample BOOL | display_order INT

submissions
  id UUID PK | user_id FK | problem_id FK | contest_id FK (nullable)
  language | code TEXT | verdict ENUM | runtime_ms | memory_kb
  passed_cases | total_cases | error_msg | created_at | judged_at

contests
  id UUID PK | title | description | start_time | end_time
  type ENUM(ICPC,IOI,rated,unrated) | created_by FK

contest_problems
  contest_id FK + problem_id FK (composite PK) | points | display_order

contest_participants
  contest_id FK + user_id FK (composite PK) | score | penalty | rank

rating_history
  id UUID PK | user_id FK | contest_id FK
  old_rating | new_rating | delta (GENERATED) | created_at
```

### Key Indexes

```sql
-- Fast problem lookup
CREATE INDEX idx_problems_slug       ON problems(slug);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_tags       ON problems USING GIN(tags);  -- array search

-- Submission history
CREATE INDEX idx_submissions_user    ON submissions(user_id, created_at DESC);
CREATE INDEX idx_submissions_verdict ON submissions(verdict);

-- Contest rankings
CREATE INDEX idx_participants_score  ON contest_participants(contest_id, score DESC);
CREATE INDEX idx_rating_user         ON rating_history(user_id, created_at DESC);
```

---

## 8. Caching Strategy (Redis)

| Data | Key Pattern | TTL | Strategy |
|---|---|---|---|
| Problem statement | `problem:{slug}` | 1 hour | Cache-aside, invalidate on update |
| Sample test cases | `testcases:{slug}:sample` | 30 min | Cache-aside via S3 fetch |
| Problem list page | `problems:list:{filter_hash}` | 5 min | Auto-expire |
| User session / JWT blacklist | `session:blacklist:{jti}` | 24h | Write-through on logout |
| Global leaderboard page | `leaderboard:global:page:{n}` | 5 min | Auto-expire |
| Contest leaderboard | `contest:{id}:board` (Sorted Set) | Live | Write on every AC submission |
| Submission queue | `submissions:queue` (Stream) | — | Persistent until ACK |
| Judge results | `results:stream` (Stream) | — | Persistent until ACK |
| WebSocket delivery | `sub:{submissionId}` (Pub/Sub) | — | Fire-and-forget |
| Rate limiting | `ratelimit:{ip}:{route}` | Sliding window | Redis sliding window counter |

---

## 9. API Gateway & Nginx

### Traffic Flow

```
Browser
  │
  ├── Static assets → Cloudflare CDN (cached at edge)
  │
  └── API/WS → Cloudflare → AWS ALB → Nginx (per instance) → Go API
```

### AWS ALB Routing Rules

| Path | Target Group | Notes |
|---|---|---|
| `/api/*` | api-tg | Standard HTTP routing |
| `/ws*` | api-ws-tg | **Sticky sessions enabled** (same instance for WS duration) |
| `/health` | api-tg | Health check — unhealthy instances removed from rotation |

### Nginx per Instance

- Terminates local connections from ALB
- Submits endpoint: 5 req/s per IP (stricter rate limit)
- All API: 100 req/s burst 200
- WebSocket: `proxy_read_timeout 3600s` (persistent connection)
- Security headers: `X-Frame-Options`, `HSTS`, `X-Content-Type-Options`
- `/metrics` blocked from public access (allow only internal 10.0.0.0/8)

---

## 10. Observability Stack

### Three Pillars

```
Metrics:  Prometheus ← scrapes /metrics on API + Judge + Redis + Postgres
          → Grafana dashboards + alerts

Logs:     Go API/Judge → structured JSON → Promtail → Loki → Grafana

Traces:   (Phase 2) OpenTelemetry → Tempo → Grafana
```

### Prometheus Metrics Instrumented

| Metric | Type | Labels |
|---|---|---|
| `http_request_duration_seconds` | Histogram | method, route, status |
| `http_requests_total` | Counter | method, route, status |
| `active_websocket_connections` | Gauge | — |
| `submission_queue_depth` | Gauge | — |
| `verdict_total` | Counter | verdict, language |

### Grafana Alerts

| Alert | Condition | Severity |
|---|---|---|
| High judge queue | depth > 100 for 2 min | Page |
| High API error rate | 5xx rate > 1% | Critical |
| High P99 latency | > 2 seconds | Warning |
| Judge worker down | No heartbeat for 60s | Page |
| DB connection pool | > 80% used | Warning |

### Structured Log Format (zap JSON)

```json
{
  "level": "info",
  "ts": "2026-04-03T10:00:00Z",
  "service": "api",
  "method": "POST",
  "path": "/api/v1/submissions",
  "status": 201,
  "latencyMs": 42,
  "userId": "u_abc123",
  "requestId": "req_xyz789"
}
```

---

## 11. CI/CD Pipelines

### API Pipeline (`.github/workflows/api.yml`)

```
Push to main (services/api/**)
  │
  ├── Lint (golangci-lint)
  ├── Test (with real Postgres + Redis services)
  │     └── Coverage gate: >= 70%
  │
  ├── Build Docker image → push to AWS ECR
  │
  └── Rolling deploy via AWS SSM
        └── docker pull + docker-compose up --no-deps
            (new container starts, health check passes,
             old container stops — zero downtime)
```

### Frontend Pipeline (`.github/workflows/frontend.yml`)

```
Push to main (apps/web/**)
  │
  ├── Lint (ESLint)
  ├── Type check (tsc --noEmit)
  ├── Build (next build)
  └── Deploy → AWS Amplify trigger
```

### Judge Pipeline (`.github/workflows/judge.yml`)

```
Push to main (services/judge/**)
  │
  ├── Lint + Unit tests
  ├── Build judge image → push to ECR
  ├── Build sandbox images (cpp, python, java, node) → push to ECR
  └── Rolling deploy to judge EC2 pool via SSM
```

### GitHub Secrets Required

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AMPLIFY_APP_ID
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_WS_URL
```

---

## 12. Infrastructure (AWS + Cloudflare)

### AWS Resources

| Resource | Type | Configuration |
|---|---|---|
| VPC | Custom | Public + private subnets across 2 AZs |
| API EC2 | t3.medium | Auto Scaling 2→10, scale on CPU > 60% |
| Judge EC2 | c6i.xlarge | Auto Scaling 1→20, scale on queue depth |
| RDS | db.t3.medium | PostgreSQL 16, Multi-AZ, automated backups |
| ElastiCache | cache.t3.medium | Redis 7, cluster mode |
| S3 | Standard | Test case files, user avatars |
| ALB | Application | HTTPS, health checks, sticky WS |
| ECR | Registry | Docker images (api, judge, sandbox images) |
| Amplify | SSR | Next.js frontend |
| ACM | Certificate | SSL for api.prepforall.com |
| SSM | Parameter Store | Secrets management, remote deploy commands |
| CloudWatch | Metrics | Custom metric: SubmissionQueueDepth (triggers judge scale) |

### Cloudflare Configuration

| Feature | Configuration |
|---|---|
| CDN | Cache static assets (JS, CSS, images) at edge |
| WAF | Block common attack patterns (SQLi, XSS, scanner bots) |
| DDoS | Auto-mitigation for L3/L4/L7 attacks |
| Rate Limiting | 1000 req/min per IP to origin |
| Page Rules | Cache `/problems` list for 5 min at edge |

### Network Security

- API EC2: Security group allows only ALB inbound on port 8080
- Judge EC2: Security group allows only Redis (6379) — no public IP
- RDS: Private subnet only, accessible from API EC2 security group
- ElastiCache: Private subnet only, accessible from API + Judge SGs

---

## 13. Security Model

### Authentication
- JWT HS256, 24h expiry
- Refresh token stored as `httpOnly` cookie
- Logout blacklists token JTI in Redis with TTL matching expiry

### Code Execution (Critical)
- Judge workers have **no DB credentials** — write via Redis Stream only
- Sandbox containers cannot reach internet (`--network=none`)
- Each submission gets a fresh container (no state carryover)
- Compilation errors are caught and returned safely
- File system is read-only — no persistence between runs

### API
- Rate limiting at Cloudflare edge + Nginx per-IP + API per-user
- Submission endpoint rate limited to 5/s per IP to prevent abuse
- All secrets via AWS SSM Parameter Store (never in code or env files)
- SQL queries use pgx prepared statements (parameterized — no injection risk)
- CORS restricted to prepforall.com origin in production

### Infrastructure
- No judge workers in public subnet
- Principle of least privilege for all IAM roles
- All inter-service traffic inside VPC (no public internet)

---

## 14. Development Phases

| Phase | Focus | Key Deliverables |
|---|---|---|
| **1** | Foundation | Auth system, user model, PostgreSQL schema, basic Go API skeleton |
| **2** | Problems | Problem CRUD, problem list UI, problem statement page, Monaco editor |
| **3** | Judge (C++) | Docker sandbox, gVisor setup, C++ execution, Redis queue pipeline |
| **4** | Real-time | WebSocket hub + Redis Pub/Sub broker, verdict delivery to frontend |
| **5** | Multi-language | Add Python, Java, JS, Go support; language selector UI |
| **6** | Submissions | Submission history, verdict display, OutputPanel, code diff view |
| **7** | Contests | Contest CRUD, contest problems, live leaderboard (Redis Sorted Set) |
| **8** | Ratings | Rating algorithm, rating history, global leaderboard, user profiles |
| **9** | Observability | Prometheus metrics, Grafana dashboards, Loki logging, alerts |
| **10** | Production | CI/CD pipelines, Terraform infra, Cloudflare WAF, load testing |

---

## Key Technology Decisions

| Decision | Choice | Reason |
|---|---|---|
| Backend language | Go | Performance, concurrency, small binary size, perfect for I/O-heavy services |
| HTTP router | chi | Lightweight, idiomatic, composable middleware |
| DB driver | pgx/v5 | Fastest PostgreSQL driver for Go, native binary protocol |
| Modular monolith | vs microservices | Avoid distributed system complexity early; extract later if needed |
| Judge isolation | gVisor (runsc) | Kernel-level isolation without full VM overhead |
| Real-time | WebSocket + Redis Pub/Sub | Fan-out across instances without sticky sessions for deliver |
| Result decoupling | Redis Streams | Worker→API→DB keeps judge workers stateless and credential-free |
| Frontend state | TanStack Query + Zustand | Server state (Query) vs UI state (Zustand) — clean separation |
| CSS | Tailwind + shadcn/ui | Fast iteration, consistent design system, dark mode built-in |
| Infra-as-code | Terraform | Reproducible, version-controlled infrastructure |
| Log aggregation | Loki | Cheaper than ELK, native Grafana integration |

---

*Last updated: April 2026 — PrepForAll Engineering*
