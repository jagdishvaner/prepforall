FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    g++ gcc \
    && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 1000 sandbox
USER sandbox
WORKDIR /sandbox

# No entrypoint — runner injects the command
