.PHONY: dev dev-legacy dev-api dev-judge dev-marketing dev-platform \
        build test lint migrate clean \
        k8s-dev k8s-prod k8s-diff-dev k8s-diff-prod \
        build-sandbox-images docker-api docker-judge

# ── Local Dev (monorepo) ────────────────────────────────────────────────────
dev:
	docker compose up --build postgres redis api judge

dev-legacy:
	docker compose --profile legacy up --build

dev-monorepo:
	docker compose --profile monorepo up --build

dev-api:
	cd services/api && go run ./cmd/api

dev-judge:
	cd services/judge && go run ./cmd/judge

dev-marketing:
	yarn turbo dev --filter=@prepforall/marketing

dev-platform:
	yarn turbo dev --filter=@prepforall/platform

# ── Infra only (Postgres + Redis) ───────────────────────────────────────────
infra:
	docker compose up -d postgres redis

# ── Build ────────────────────────────────────────────────────────────────────
build-api:
	cd services/api && go build -o bin/api ./cmd/api

build-judge:
	cd services/judge && go build -o bin/judge ./cmd/judge

build-frontend:
	yarn turbo build

build: build-api build-judge build-frontend

# ── Test ─────────────────────────────────────────────────────────────────────
test-api:
	cd services/api && go test ./... -race -count=1

test-judge:
	cd services/judge && go test ./... -race -count=1

test-frontend:
	yarn turbo test:ci

test: test-api test-judge test-frontend

# ── Lint ─────────────────────────────────────────────────────────────────────
lint-api:
	cd services/api && golangci-lint run ./...

lint-judge:
	cd services/judge && golangci-lint run ./...

lint-frontend:
	yarn turbo lint

lint: lint-api lint-judge lint-frontend

# ── Database Migrations ───────────────────────────────────────────────────────
migrate-up:
	migrate -path services/api/migrations -database "$(DATABASE_URL)" up

migrate-down:
	migrate -path services/api/migrations -database "$(DATABASE_URL)" down 1

migrate-create:
	migrate create -ext sql -dir services/api/migrations -seq $(name)

# ── Docker Images ────────────────────────────────────────────────────────────
docker-api:
	docker build -f infrastructure/docker/Dockerfile.api -t prepforall-api:latest ./services/api

docker-judge:
	docker build -f services/judge/docker/Dockerfile -t prepforall-judge:latest ./services/judge

build-sandbox-images:
	cd services/judge/docker/sandbox && \
	docker build -f Dockerfile.cpp    -t prepforall/sandbox-cpp:latest    . && \
	docker build -f Dockerfile.python -t prepforall/sandbox-python:latest . && \
	docker build -f Dockerfile.java   -t prepforall/sandbox-java:latest   . && \
	docker build -f Dockerfile.node   -t prepforall/sandbox-node:latest   .

# ── Kubernetes (Kustomize) ──────────────────────────────────────────────────
k8s-dev:
	kubectl apply -k infrastructure/k8s/overlays/dev/

k8s-prod:
	kubectl apply -k infrastructure/k8s/overlays/prod/

k8s-diff-dev:
	kubectl diff -k infrastructure/k8s/overlays/dev/ || true

k8s-diff-prod:
	kubectl diff -k infrastructure/k8s/overlays/prod/ || true

k8s-validate:
	kubectl kustomize infrastructure/k8s/overlays/dev/ > /dev/null && echo "dev overlay: valid"
	kubectl kustomize infrastructure/k8s/overlays/prod/ > /dev/null && echo "prod overlay: valid"

# ── Sealed Secrets ──────────────────────────────────────────────────────────
seal-secret:
	@echo "Usage: ./infrastructure/k8s/scripts/seal-secret.sh <name> <namespace> <key=value>..."

# ── Cluster Setup ───────────────────────────────────────────────────────────
cluster-setup:
	./infrastructure/k8s/scripts/setup-cluster.sh

# ── Clean ────────────────────────────────────────────────────────────────────
clean:
	docker compose down -v
	rm -f services/api/bin/api services/judge/bin/judge
