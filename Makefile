.PHONY: dev dev-api dev-web dev-judge build test lint migrate clean

# ── Local Dev ────────────────────────────────────────────────────────────────
dev:
	docker-compose up --build

dev-api:
	cd services/api && go run ./cmd/api

dev-web:
	cd apps/web && npm run dev

dev-judge:
	cd services/judge && go run ./cmd/judge

# ── Infra only (Postgres + Redis) ───────────────────────────────────────────
infra:
	docker-compose up -d postgres redis

# ── Build ────────────────────────────────────────────────────────────────────
build-api:
	cd services/api && go build -o bin/api ./cmd/api

build-judge:
	cd services/judge && go build -o bin/judge ./cmd/judge

build-web:
	cd apps/web && npm run build

# ── Test ─────────────────────────────────────────────────────────────────────
test-api:
	cd services/api && go test ./... -race -count=1

test-judge:
	cd services/judge && go test ./... -race -count=1

test: test-api test-judge

# ── Lint ─────────────────────────────────────────────────────────────────────
lint-api:
	cd services/api && golangci-lint run ./...

lint-judge:
	cd services/judge && golangci-lint run ./...

lint-web:
	cd apps/web && npm run lint

lint: lint-api lint-judge lint-web

# ── Database Migrations ───────────────────────────────────────────────────────
migrate-up:
	migrate -path services/api/migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path services/api/migrations -database "$(DATABASE_URL)" down 1

migrate-create:
	migrate create -ext sql -dir services/api/migrations -seq $(name)

# ── Docker Sandbox Images ────────────────────────────────────────────────────
build-sandbox-images:
	cd services/judge/docker/sandbox && \
	docker build -f Dockerfile.cpp    -t prepforall/sandbox-cpp:latest    . && \
	docker build -f Dockerfile.python -t prepforall/sandbox-python:latest . && \
	docker build -f Dockerfile.java   -t prepforall/sandbox-java:latest   . && \
	docker build -f Dockerfile.node   -t prepforall/sandbox-node:latest   .

# ── Clean ────────────────────────────────────────────────────────────────────
clean:
	docker-compose down -v
	rm -f services/api/bin/api services/judge/bin/judge
