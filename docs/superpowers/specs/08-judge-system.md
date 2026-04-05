# 08 — Code Execution (Judge) System

> Docker + gVisor sandboxed execution for DSA. Temporary PostgreSQL containers for SQL.

**Related specs:** [05-backend-architecture](05-backend-architecture.md), [12-deployment-architecture](12-deployment-architecture.md)

---

## Overview

Unchanged from SYSTEM_PLAN.md. Key points:

- **DSA judge:** Docker containers with gVisor (`--runtime=runsc`), per-test-case execution
- **SQL judge:** Temporary PostgreSQL container per submission, query executed against pre-loaded schema, result set comparison
- **Supported languages:** C++, C, Java, Python 3, JavaScript, Go, PostgreSQL
- **Flow:** User submits → API enqueues to Redis Stream → Judge worker processes → Result via Redis Stream → API writes to DB → WebSocket pushes verdict
- **Security:** 10-layer sandbox (gVisor, no network, read-only FS, memory/CPU/PID limits, non-root user)

## DSA Judge Flow

```
User Submit → API → Redis Stream (submissions)
                         ↓
              Judge Worker picks job
                         ↓
              Create gVisor container (per test case)
                         ↓
              Execute with time/memory limits
                         ↓
              Compare output → Verdict
                         ↓
              Redis Stream (results) → API → DB + WebSocket
```

## SQL Judge Specifics

- Spin up temporary PostgreSQL container per submission
- Load problem-specific schema + seed data (from S3)
- Execute user's SQL query with timeout (10s)
- Compare result set with expected output (order-insensitive option per problem)
- Tear down container after verdict

## Resource Limits (per execution)

| Resource | Limit |
|---|---|
| CPU time | 2s (configurable per problem) |
| Wall time | 5s |
| Memory | 256MB |
| Disk | Read-only FS |
| Network | Disabled |
| PIDs | 64 max |
| User | Non-root (uid 1000) |

## K8s Deployment

Judge workers run on a dedicated node pool (`judge`) with:
- `privileged: true` (required for Docker-in-Docker / gVisor)
- Node taints to prevent non-judge pods from scheduling
- HPA scaling based on Redis queue depth

---

*Last updated: April 5, 2026*
