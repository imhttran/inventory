# Database (PostgreSQL)

Everything this project does with PostgreSQL, in one page.

## Connection

One variable: `DATABASE_URL` (`.env.dev` provides the dev default; a personal
root `.env` overrides it).

```
postgres://postgres:postgres@localhost:5432/inventory?sslmode=disable
```

- `manage.sh` (database startup check, reset, re-seed) reads `.env` first,
  then `.env.dev` — same precedence as the backend's environment loader.
- Inside Docker the backend uses the compose-network hostname instead:
  `postgres://postgres:postgres@db:5432/...` (set in `docker-compose.yml`).
- Changing host/port/db means changing only this URL — no code changes.

## Setting up a local instance

**Option 1 — Docker (recommended): matches `docker-compose.yml`**

```bash
make infra      # or: docker compose up -d db   (elasticsearch: make es)
```

**Option 2 — Homebrew service: survives reboots**

```bash
brew install postgresql@16
brew services start postgresql@16      # stop with: brew services stop postgresql@16
createuser -s postgres; psql -d postgres -c "ALTER USER postgres PASSWORD 'postgres';"
createdb inventory
```

Note: the Homebrew service listens on the Unix socket only, so it coexists
with the Docker container's TCP port. The backend connects to whichever
`DATABASE_URL` says.

Check state anytime: `pg_isready -h localhost` (what `manage.sh` runs before
launching the backend) or `make ps`.

## Schema: how it's managed

Embedded migrations (`backend/migrations/00*.sql`), applied automatically
when the Rust API boots:

- `backend::database::migrate` applies each file once, recorded in a
  `schema_migrations` table — a second boot is a no-op, so no separate migrate
  step and no `migrate down`.
- Schema changes: add a new `00N_*.sql` and one entry to the `MIGRATIONS`
  list in `src/database/mod.rs` before the schema drifts.

Tables:

| Table                      | Purpose                                                                    |
| -------------------------- | -------------------------------------------------------------------------- |
| `users`                    | accounts: email, scrypt password, role, verify/reset tokens                |
| `user_profiles`            | one-time registration details (`ON DELETE CASCADE`)                        |
| `email_queue`              | outbound mail (processed by the worker in `backend/src/events/`)           |
| `brands`                   | vendors' brands; unique `normalized_name`                                  |
| `categories`               | hierarchical catalog categories (parent_id)                                |
| `products`                 | catalog items: SKU, brand, category, active flag                           |
| `product_identifiers`      | MPN/UPC/EAN/GTIN rows (enum type), unique per type + normalized value      |
| `product_cross_references` | OEM/aftermarket/equivalent links to other brands' part numbers             |
| `suppliers`                | vendor records (contact + address, unique name and code)                   |
| `product_suppliers`        | per-product sourcing: cost, MOQ, lead time, preferred flag                 |
| `warehouses`               | physical warehouses (unique code)                                          |
| `warehouse_locations`      | bins within a warehouse (`A-03-04`, unique per warehouse)                  |
| `inventory`                | stock per (product, bin): on hand / reserved / damaged, CHECK-guarded      |
| `inventory_transactions`   | append-only ledger: type, signed quantity, before/after, actor             |
| `outbox_events`            | search-index sync queue: written in the same transaction as product writes |
| `schema_migrations`        | which migration files have been applied                                    |

Enum types: `product_identifier_type`, `cross_reference_type`,
`inventory_transaction_type`. Catalog tables carry a `set_updated_at` trigger.

Dev logins (seeded in `backend/src/seed.rs`, only when `NODE_ENV=development`):
one per role — **admin@mail.com**, **staff@mail.com**, **user@mail.com**, all
`Password1234!` — plus their profiles, so no dev login is blocked by onboarding
gates.

## Day-to-day operations

| Task               | Command                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| Start infra        | `make infra` (or `./manage.sh` → 12 / 13)                                     |
| Seed (Docker)      | `make seed` (one-shot; backend containers self-seed on boot in dev)           |
| Status             | `make ps` or `pg_isready -h localhost`                                        |
| Reset **all** data | `make nuke` (containers + volumes) or `./manage.sh` → 9 (schema only)         |
| Manual reset       | `psql "$DATABASE_URL" -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;'` |
| Look around        | `docker compose exec db psql -U postgres inventory` → `\dt`                   |
| Promote a user     | `docker compose exec -T backend backend set-role <email> <role>`              |
| Promote (native)   | `./manage.sh` → 8 (runs `cargo run -- set-role`)                              |

`manage.sh` option 9 and `make nuke` are destructive; both ask before
destroying data.

## Tests

`backend/tests/api_test.rs` (19 tests) need a reachable Postgres and are
skipped otherwise:

```bash
cd backend
TEST_DATABASE_URL="postgres://postgres:postgres@localhost:5432/inventory_test?sslmode=disable" cargo test
```

Every test creates its own uniquely-addressed fixtures (full-nanosecond
suffixes), so reruns against a dirty database still pass and tests never reset
the shared database. `./manage.sh` → 6 runs them when `TEST_DATABASE_URL` is
set in your environment.

## Production

Any managed PostgreSQL (RDS, Cloud SQL, Neon, a Docker container) works: set
`DATABASE_URL` in the environment (`NODE_ENV=production` loads no `.env.dev`,
refuses to boot without `JWT_SECRET`, and only the backend's server
environment matters — the frontend never touches Postgres). Migrations apply
on first boot against an empty database.

Elasticsearch is the same story: point `ELASTICSEARCH_URL` at a managed or
self-hosted cluster. The outbox worker retries until it's reachable; if it
stays down, search keeps serving from Postgres.
