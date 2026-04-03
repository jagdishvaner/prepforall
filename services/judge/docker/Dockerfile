FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o judge ./cmd/judge

FROM alpine:3.20
RUN apk add --no-cache docker-cli ca-certificates

WORKDIR /app
COPY --from=builder /app/judge .

# Judge worker needs Docker socket access to spin up sandbox containers
# Mount /var/run/docker.sock when running

USER nobody
ENTRYPOINT ["./judge"]
