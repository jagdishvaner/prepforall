# PrepForAll

A competitive programming platform — practice algorithmic problems, compete in rated contests, and grow your skills.

Built with **Next.js 15** · **Go** · **PostgreSQL** · **Redis** · **Docker** · **gVisor sandbox**

---

## Project Structure

```
coding-prepforall/
├── apps/web/          # Next.js 15 frontend (App Router + TanStack Query + Zustand)
├── services/api/      # Go API server (modular monolith)
├── services/judge/    # Go judge worker (sandboxed code execution)
├── infrastructure/    # Nginx, Terraform, Observability configs
├── docs/              # SYSTEM_PLAN.md — full architecture document
└── docker-compose.yml # Local dev: all services in one command
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Docker Desktop | Latest | https://docs.docker.com/get-docker/ |
| Go | 1.23+ | https://go.dev/dl/ |
| Node.js | 20+ | https://nodejs.org/ |
| `golang-migrate` | Latest | `go install github.com/golang-migrate/migrate/v4/cmd/migrate@latest` |

> **Windows users:** Docker Desktop must be running before any `docker-compose` command.

---

## Local Development — Quick Start

### 1. Clone and set up environment

```bash
git clone https://github.com/your-org/coding-prepforall.git
cd coding-prepforall

# Frontend env
cp apps/web/.env.example apps/web/.env.local
```

### 2. Start infrastructure (Postgres + Redis)

```bash
docker-compose up -d postgres redis
```

Wait ~5 seconds for both to become healthy:

```bash
docker-compose ps   # postgres and redis should show "healthy"
```

### 3. Run database migrations

```bash
migrate -path services/api/migrations \
        -database "postgres://prepforall:devpassword@localhost:5432/prepforall?sslmode=disable" \
        up
```

### 4. Start the API server

```bash
cd services/api
go mod download
go run ./cmd/api
# API running on http://localhost:8080
```

### 5. Start the frontend

Open a new terminal:

```bash
cd apps/web
npm install
npm run dev
# Frontend running on http://localhost:3000
```

### 6. (Optional) Start the judge worker

Open another terminal:

```bash
cd services/judge
go mod download
go run ./cmd/judge
```

> The judge worker requires Docker to be running so it can spin up sandbox containers.

### 7. (Optional) Full stack with one command

```bash
# Builds and starts all services + observability
docker-compose up --build
```

Services will be available at:

| Service | URL |
|---|---|
| Frontend (Next.js) | http://localhost:3000 |
| API (Go) | http://localhost:8080 |
| Prometheus | http://localhost:9090 |
| Grafana | http://localhost:3001 (admin/admin) |

---

## Makefile Commands

```bash
make dev              # Start everything via docker-compose
make infra            # Start only Postgres + Redis
make dev-api          # Run Go API server locally
make dev-web          # Run Next.js dev server
make dev-judge        # Run judge worker locally
make test             # Run all tests
make lint             # Run linters (Go + ESLint)
make migrate-up       # Apply all migrations
make migrate-down     # Rollback one migration
make build-sandbox-images  # Build Docker sandbox images for judge
```

---

## Environment Variables

### API (`services/api`)

| Variable | Description | Default |
|---|---|---|
| `ENV` | `development` or `production` | `development` |
| `PORT` | HTTP listen port | `8080` |
| `DATABASE_URL` | PostgreSQL connection string | — |
| `REDIS_ADDR` | Redis address (`host:port`) | — |
| `JWT_SECRET` | Secret for signing JWTs (min 32 chars) | — |
| `JWT_EXPIRY` | Token TTL e.g. `24h` | `24h` |
| `AWS_REGION` | AWS region | `ap-south-1` |
| `S3_BUCKET` | S3 bucket for test case files | — |
| `ALLOWED_ORIGINS` | JSON array of CORS origins | — |

### Judge (`services/judge`)

| Variable | Description |
|---|---|
| `REDIS_ADDR` | Redis address (`host:port`) |

### Frontend (`apps/web`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Go API base URL |
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL |

---

## Architecture Overview

See [`docs/SYSTEM_PLAN.md`](docs/SYSTEM_PLAN.md) for the complete architecture document including:
- System architecture diagram
- Code execution (judge) flow with security layers
- WebSocket scaling across multiple API instances
- Database schema
- Caching strategy
- CI/CD pipelines
- AWS infrastructure

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router), TanStack Query, Zustand, Tailwind CSS, Monaco Editor |
| Backend | Go 1.23, chi router, pgx/v5, go-redis, zap |
| Judge | Go + Docker + gVisor (runsc) sandbox |
| Database | PostgreSQL 16 |
| Cache / Queue | Redis 7 (Streams, Pub/Sub, Sorted Sets) |
| CDN / Security | Cloudflare (WAF + DDoS + CDN) |
| Deployment | AWS EC2 (Auto Scaling), RDS, ElastiCache, S3, Amplify |
| Observability | Prometheus + Grafana + Loki + Promtail |
| CI/CD | GitHub Actions → AWS ECR → Rolling deploy via SSM |

---

## Contributing

1. Create a feature branch from `main`
2. Make changes following the existing patterns
3. Run `make lint` and `make test` before pushing
4. Open a PR — CI will run automatically

---

*PrepForAll Engineering — 2026*
