# ─── Stage 1: Builder ────────────────────────────────────────────────────────
FROM golang:1.23-bookworm AS builder

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o /judge ./cmd/judge

# ─── Stage 2: Runtime (DinD + gVisor) ───────────────────────────────────────
FROM docker:27-dind

# Install gVisor runtime (runsc)
RUN set -eux; \
    ARCH="$(uname -m)"; \
    wget -qO /usr/local/bin/runsc "https://storage.googleapis.com/gvisor/releases/release/latest/${ARCH}/runsc"; \
    chmod +x /usr/local/bin/runsc; \
    # Configure Docker to use gVisor as a runtime option
    mkdir -p /etc/docker; \
    echo '{"runtimes":{"runsc":{"path":"/usr/local/bin/runsc"}},"default-runtime":"runsc"}' > /etc/docker/daemon.json

# Install ca-certificates for HTTPS
RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /judge .

# Judge needs Docker daemon access — runs as root for DinD
# Security isolation is provided by gVisor (runsc) for sandbox containers

EXPOSE 9091

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD pgrep judge || exit 1

ENTRYPOINT ["./judge"]
