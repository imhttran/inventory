# Features

## Platform

- **Server-side proxy** — the browser only talks to Next.js; `/api/*` is
  forwarded to the Rust API (never exposed directly, no CORS)
- **Health probe** — `GET /api/health` reports API + PostgreSQL status; the
  dashboard shows it as a status strip
- **Docker stack** — `make app` runs the whole system (PostgreSQL,
  Elasticsearch, Rust API, Next.js); `make infra` starts just the databases
  for native development
- **Theming** — UT Austin navy/orange, light and dark variants that follow the
  system setting

## Auth & users

- **Auth** — JWT login with 10-minute sliding sessions (renewed past half-life
  on every successful request; idle sessions hard-expire), scrypt password
  hashing, email verification, password reset, resend-verification,
  self-service change-password, email-code 2FA on new devices (trusted devices
  skip it)
- **RBAC** — `client` < `staff` < `admin` roles with role-gated routes
  (reads: any signed-in user; catalog/inventory writes: staff; deletes and
  reindex: admin); promotion is CLI-only so there's no self-service escalation
- **Onboarding gates** — forced password change and required profile block
  API access until completed
- **Admin user management** — create, delete, verify/unverify, change role,
  and trigger password resets from the dashboard
- **Email queue** — Postgres-backed queue with a bounded-retry worker; logs to
  stdout when no SMTP is configured, so dev needs no mail server
- **Enumeration-safe endpoints** — generic responses on signup/forgot-password
  so the API can't be used to probe registered emails

## Catalog

- **Brands** — unique case-insensitively via `normalized_name`
- **Categories** — hierarchical (parent/child, e.g. Brakes → Brake Pads);
  name uniqueness is scoped to the parent, with a partial index covering the
  root level
- **Products** — UUID identity, distributor SKU, MPN stored as a typed
  `product_identifiers` row (the enum covers SKU/MPN/UPC/EAN/GTIN for later);
  soft-delete via `active`
- **Cross references** — OEM/aftermarket/equivalent/replacement/supersedes
  links between a product and other brands' part numbers

## Suppliers

- **Vendor records** — contact + address fields, unique name and code
- **Sourcing** — per-product supplier list: supplier part number, cost
  (`NUMERIC(12,2)`, rides as a string over the wire), minimum order quantity,
  lead time, at most one preferred vendor; replaced wholesale in one
  transaction, so a failed save never leaves a product half-linked

## Inventory

- **Warehouses & bins** — warehouse → location (`A-03-04`-style codes),
  unique per warehouse
- **Stock** — one row per (product, bin): on hand / reserved / damaged, with
  non-negative and `reserved <= on_hand` CHECK constraints
- **Audit ledger** — every quantity change writes an
  `inventory_transactions` row (type, signed quantity, before/after) in the
  same transaction as the change, so stock and ledger can never drift;
  transfers write TRANSFER_OUT + TRANSFER_IN as one unit
- **Receiving / adjusting / transferring** — RECEIPT, SALE, RETURN,
  ADJUSTMENT (signed), DAMAGE (moves on-hand to damaged), LOST; overdrafts
  return clean 400s

## Search

- **Outbox pipeline** — product writes append `outbox_events` rows in the same
  transaction as the write; a backend worker drains them into Elasticsearch
  every 2s (retries, dead-letters after 10 attempts)
- **Elasticsearch index** — denormalized product docs (SKU, MPN, name,
  brand, category), created and boot-reindexed automatically
- **Query API** — multi_match with fuzziness over name/SKU/MPN/brand/category,
  active products only; the response's `source` field says whether
  Elasticsearch or the Postgres ILIKE fallback served it
- **Graceful degradation** — Elasticsearch down or unconfigured never breaks
  the API; search silently falls back to Postgres, and an admin endpoint
  rebuilds the index from the source of truth
