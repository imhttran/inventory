# Auto Parts Inventory

Automotive part inventory: **Next.js → Rust API → PostgreSQL (source of truth) + Elasticsearch (search)**. The browser only ever talks to Next.js; the Rust API is proxied server-side and never exposed directly.

```
Browser
   ↓ HTTPS / JSON
Next.js        frontend/  → :3000   React UI, server-side /api/* proxy
   ↓
Rust API       backend/   → :8080   axum + tokio + sqlx + JWT + scrypt
   ↓                ↓
PostgreSQL      Elasticsearch        migrations apply on boot; the outbox
 source of       search engine        worker (backend) streams product
   truth         (fuzzy search)       writes into the index every 2s
```

## Quick Start

**Full stack in Docker** (no Rust/Node needed):

```bash
make app        # builds + starts all five services → http://localhost:3000
make down       # stop (data volumes are kept)
```

**Native development** (needs Rust via rustup, Node 20+):

```bash
make infra      # starts PostgreSQL + Elasticsearch containers
./manage.sh     # → [7] First-Time Setup, then → [1] Start All
```

Dev admin: **admin@mail.com** / **Password1234!** — first login from a new
browser asks for a 2FA code; in development it's always `1234`, and the browser
is trusted afterwards.

Dev mail: in the Docker stack every email the app sends (verification, 2FA,
password reset) lands in **Mailpit** — inbox UI at http://localhost:8025,
SMTP on :1025 (wired via `SMTP_HOST=mailpit` in `docker-compose.yml`; the
mailer's opportunistic STARTTLS falls back to plain SMTP, so no TLS setup).
The inbox is in-memory — restarting the Mailpit container clears it. Native
dev without `SMTP_HOST` set logs emails to the backend console instead.

## Docker helpers (Makefile)

| Target                    | What it does                                                     |
| ------------------------- | ---------------------------------------------------------------- |
| `make infra`              | Start PostgreSQL + Elasticsearch (what native dev needs)         |
| `make seed`               | One-shot dev seed against the db container                       |
| `make app`                | Build + run the full containerized stack                         |
| `make stop` / `make down` | Stop containers (keep) / remove them (volumes kept)              |
| `make logs S=backend`     | Tail logs (`frontend`, `db`, `elasticsearch`, `mailpit`, or all) |
| `make ps` / `make health` | Container status / backend health probe                          |
| `make nuke`               | Delete containers **and all data** (typed confirmation)          |

`./manage.sh` covers the same ground through a menu (plus setup, tests, role
granting, DB reset/re-seed).

## What it does

- **Auth** — signup with email verification, scrypt password hashing, JWT
  sessions with sliding renewal, per-device 2FA, password reset
- **Catalog** — brands, hierarchical categories, products (UUID, SKU, MPN as a
  typed `product_identifiers` row), case-insensitive uniqueness
- **Sourcing** — per-product supplier list: cost, MOQ, lead time, preferred
  vendor
- **Inventory** — per-bin stock (on hand / reserved / damaged) across
  warehouses, every change recorded in `inventory_transactions` with
  before/after quantities; transfers write opposite-signed ledger pairs
- **Search** — `outbox_events` → Rust worker → Elasticsearch; queries fall
  back to Postgres ILIKE when the engine is down (`source` field says which
  served)
- **Email** — DB-backed `email_queue` with a bounded-retry worker (3s poll);
  delivers via SMTP when `SMTP_HOST` is set (Mailpit in the Docker stack,
  inbox at http://localhost:8025), otherwise logs instead of sending

## API

34 routes under `/api/*` and `/api/v1/*` (several serve multiple methods) —
see `backend/src/api/mod.rs` (`new_router()`):

- **Health** (1): `GET /api/health` — API + PostgreSQL status
- **Auth** (8): signup, verify, resend-verification, forgot/reset-password,
  login, 2FA verify/resend
- **Self-service** (4): me, profile get/save, change-password
- **Users, staff/admin** (7): list, create, delete, verification, role, resend
  verification, admin reset
- **Catalog `/api/v1`** (9): brands, categories, products CRUD with filters +
  pagination
- **Sourcing** (2): product↔supplier links (GET/PUT, wholesale replace)
- **Suppliers** (5): CRUD
- **Inventory** (6): warehouses + locations, stock list, receive/adjust/
  transfer, per-product movement ledger
- **Search** (2): `GET /api/v1/search`, admin reindex

## Structure

```
backend/src/
  api/        router, response helpers, auth extractor, health probe
  auth/       login/JWT, roles, user + profile management
  brands/     catalog lookup tables
  categories/ hierarchical catalog categories
  products/   catalog CRUD + MPN identifiers
  suppliers/  vendors + per-product sourcing
  inventory/  warehouses, bins, stock + transaction ledger
  search/     outbox worker, Elasticsearch client, Postgres fallback
  database/   pool + migrations
  events/     DB-backed email queue + mailer
frontend/src/
  app/        products, inventory, suppliers, search, dashboard, auth pages
  components/ shared UI
  lib/        api helpers, roles
```

## Tests

```bash
cd backend && TEST_DATABASE_URL=postgres://postgres:postgres@localhost:5432/inventory_test?sslmode=disable cargo test
```

19 integration tests drive the real router against PostgreSQL (they skip
without `TEST_DATABASE_URL`). `./manage.sh` → [6] runs backend tests plus the
frontend build.

## Roles

`client` < `staff` < `admin`. Reads need any signed-in user; catalog and
inventory writes need `staff`; deletes and reindex need `admin`. Grant via CLI:

```bash
cd backend && cargo run -- set-role you@email.com admin
# or: ./manage.sh → [8]
# or, full-Docker: docker compose exec -T backend backend set-role you@email.com admin
```

## Docs

- **[docs/DATABASE.md](docs/DATABASE.md)** — installing Postgres, schema, reset
- **[docs/FEATURE.md](docs/FEATURE.md)** — the auth template this project grew from
- **[docs/RUST_MIGRATION.md](docs/RUST_MIGRATION.md)** — how the backend moved from Go to Rust
- **`.env.example`** — every config variable
