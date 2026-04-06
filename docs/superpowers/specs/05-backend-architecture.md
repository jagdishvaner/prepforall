# 05 — Backend Architecture (Go API)

> Modular monolith with uber/dig dependency injection. Inspired by DTSL Go boilerplate patterns.

**Related specs:** [06-database-schema](06-database-schema.md), [07-authentication](07-authentication.md), [08-judge-system](08-judge-system.md)

---

## Module Structure

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

## DI Pattern (uber/dig)

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

## Module Pattern

Each module follows the same structure:

```
internal/<module>/
├── handler.go      # HTTP handlers (chi router)
├── service.go      # Business logic
├── repository.go   # Database queries (pgx)
└── model.go        # Domain types
```

## RBAC Middleware

Enforces role-based access at the route level:
- Super Admin → full access
- Org Admin → only their org's data (org_id injected from JWT claims)
- Trainer → only their batches' data
- Student → only their own data + assigned tests

## Key Dependencies

| Package | Purpose |
|---|---|
| `go-chi/chi` | HTTP router |
| `jackc/pgx/v5` | PostgreSQL driver |
| `go-redis/redis` | Redis client |
| `uber-go/dig` | Dependency injection |
| `uber-go/zap` | Structured logging |
| `prometheus/client_golang` | Metrics |
| `open-telemetry/otel` | Distributed tracing |
| `golang-jwt/jwt` | JWT generation/validation |

---

*Last updated: April 5, 2026*
