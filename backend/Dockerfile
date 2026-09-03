# Multi-stage build: compile the release binary with the full toolchain, then
# ship just the binary. Migrations are include_str!'d into the binary, so no
# runtime files are needed.
FROM rust:1-slim AS build
WORKDIR /app
# ring (via rustls/scrypt) needs a C compiler.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*
COPY Cargo.toml Cargo.lock ./
COPY src ./src
COPY migrations ./migrations
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/release/backend /usr/local/bin/backend
EXPOSE 8080
ENTRYPOINT ["backend"]
