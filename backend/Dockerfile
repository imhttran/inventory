# Multi-stage build: compile the release binary with the full toolchain, then
# ship just the binary. Migrations are include_str!'d into the binary, so no
# runtime files are needed.
FROM rust:1-slim AS build
WORKDIR /app
# ring (via rustls/scrypt) needs a C compiler.
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# Dependency cache layer: compile every crate against stub sources. This layer
# only invalidates when Cargo.toml/Cargo.lock change, so editing src/ skips the
# registry compile (axum + sqlx + tokio take minutes) and rebuilds just our
# crate — the difference between a 5-minute and a ~20-second `make app`.
COPY Cargo.toml Cargo.lock ./
RUN mkdir src \
    && echo "" > src/lib.rs \
    && echo "fn main() {}" > src/main.rs
RUN cargo build --release

# Real build: replace the stubs over the cached dependency artifacts, then
# recompile the crate itself. The touch beats the context-preserved mtimes so
# cargo can't mistake the stub artifacts for up-to-date.
RUN rm -rf src
COPY src ./src
COPY migrations ./migrations
RUN touch src/lib.rs src/main.rs && cargo build --release

FROM debian:bookworm-slim
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/target/release/backend /usr/local/bin/backend
EXPOSE 8080
ENTRYPOINT ["backend"]
