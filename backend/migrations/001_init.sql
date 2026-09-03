-- ============================================================
-- Auto Parts Inventory — complete schema (single migration)
-- ============================================================
-- Applied at boot and recorded in schema_migrations. Consolidates the
-- original auth template (001), the 2FA support tables (002), and the
-- auto-parts catalog schema (003) into one file.
--
-- Adaptations from the drafted auto-parts schema:
--   * users/roles/user_roles/permissions/role_permissions are intentionally
--     omitted — the template's users table (with its role column) and the
--     client<staff<admin ranking already cover auth + authorization.
--   * audit_logs is deferred until there is an audit surface.
--   * inventory_transactions.created_by is INTEGER, referencing the template
--     users table (the draft had an unlinked UUID).
--   * root-level category names get a partial unique index — UNIQUE
--     (parent_id, normalized_name) never fires for NULL parent_id.
--
-- Idempotency: tables/indexes/triggers are safe to re-apply (IF NOT EXISTS /
-- CREATE OR REPLACE) so a partially-failed apply can be retried. CREATE TYPE
-- is not guarded — types exist only once a schema is complete.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- Utility: updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- USERS
-- Basic authentication foundation. RBAC is the `role` column
-- (client < staff < admin) — no separate role tables.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id                  SERIAL PRIMARY KEY,
  email               TEXT NOT NULL UNIQUE,
  password            TEXT NOT NULL,
  role                TEXT NOT NULL DEFAULT 'client',
  email_verified      BOOLEAN NOT NULL DEFAULT false,
  must_change_password BOOLEAN NOT NULL DEFAULT false,
  verification_token  TEXT UNIQUE,
  reset_token         TEXT UNIQUE,
  reset_token_expiry  TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One-time registration details. A missing row (not a boolean flag, unlike
-- must_change_password) is what gates a user into the completion form — the
-- data itself is the "is this done" signal, so there's nothing to keep in sync.
CREATE TABLE IF NOT EXISTS user_profiles (
  id                       SERIAL PRIMARY KEY,
  user_id                  INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name               TEXT NOT NULL,
  last_name                TEXT NOT NULL,
  address                  TEXT NOT NULL,
  address2                 TEXT,
  state                    TEXT NOT NULL,
  zip                      TEXT NOT NULL,
  country                  TEXT NOT NULL DEFAULT 'US',
  phone                    TEXT NOT NULL,
  communication_preference TEXT NOT NULL DEFAULT 'email',
  linkedin                 TEXT,
  github                   TEXT,
  alt_email                TEXT
);

-- 2FA login codes (pending second factor) and trusted devices that skip it.
CREATE TABLE IF NOT EXISTS user_devices (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id  TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS login_codes (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  code       TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT false,
  attempts   INTEGER NOT NULL DEFAULT 0,
  resends    INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- EMAIL QUEUE
-- Postgres-backed queue; the events worker in backend/src/events/
-- sends (or logs) every 3s.
-- ============================================================

CREATE TABLE IF NOT EXISTS email_queue (
  id         SERIAL PRIMARY KEY,
  "to"       TEXT NOT NULL,
  subject    TEXT NOT NULL,
  body       TEXT NOT NULL,
  status     TEXT NOT NULL DEFAULT 'pending',
  attempts   INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at    TIMESTAMPTZ
);


-- ============================================================
-- BRANDS
-- ============================================================

CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,
    normalized_name VARCHAR(150) NOT NULL,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_brands_normalized_name
        UNIQUE (normalized_name)
);

CREATE INDEX IF NOT EXISTS idx_brands_name
    ON brands (name);


CREATE TRIGGER brands_updated_at
BEFORE UPDATE ON brands
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- CATEGORIES
-- Supports hierarchical categories
--
-- Brakes
--   Brake Pads
--   Rotors
--   Calipers
-- Engine
--   Filters
--   Belts
-- ============================================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    parent_id UUID NULL REFERENCES categories(id),

    name VARCHAR(150) NOT NULL,
    normalized_name VARCHAR(150) NOT NULL,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_categories_parent_name
        UNIQUE (parent_id, normalized_name)
);

-- UNIQUE (parent_id, normalized_name) treats NULLs as distinct, so without
-- this index two root categories could share a name.
CREATE UNIQUE INDEX IF NOT EXISTS uq_categories_root_name
    ON categories (normalized_name)
    WHERE parent_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_categories_parent_id
    ON categories (parent_id);

CREATE INDEX IF NOT EXISTS idx_categories_name
    ON categories (name);


CREATE TRIGGER categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- PRODUCTS
--
-- SKU = our internal distributor SKU
-- MPN = manufacturer part number and belongs in
-- product_identifiers.
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sku VARCHAR(100) NOT NULL,

    brand_id UUID NOT NULL
        REFERENCES brands(id),

    category_id UUID NOT NULL
        REFERENCES categories(id),

    name VARCHAR(255) NOT NULL,

    description TEXT,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_products_sku
        UNIQUE (sku)
);

CREATE INDEX IF NOT EXISTS idx_products_brand_id
    ON products (brand_id);

CREATE INDEX IF NOT EXISTS idx_products_category_id
    ON products (category_id);

CREATE INDEX IF NOT EXISTS idx_products_name
    ON products (name);

CREATE INDEX IF NOT EXISTS idx_products_active
    ON products (active);


CREATE TRIGGER products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- PRODUCT IDENTIFIERS
--
-- Allows one product to have multiple identifiers:
--
-- SKU
-- MPN
-- UPC
-- EAN
-- GTIN
-- ============================================================

CREATE TYPE product_identifier_type AS ENUM (
    'SKU',
    'MPN',
    'UPC',
    'EAN',
    'GTIN'
);


CREATE TABLE IF NOT EXISTS product_identifiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    identifier_type product_identifier_type NOT NULL,

    value VARCHAR(150) NOT NULL,

    normalized_value VARCHAR(150) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_product_identifier
        UNIQUE (identifier_type, normalized_value)
);

CREATE INDEX IF NOT EXISTS idx_product_identifiers_product_id
    ON product_identifiers (product_id);

CREATE INDEX IF NOT EXISTS idx_product_identifiers_value
    ON product_identifiers (normalized_value);


-- ============================================================
-- CROSS REFERENCES
--
-- Example:
--
-- Bosch 0986AB1234
--   equivalent to another aftermarket part
--
-- OEM
-- AFTERMARKET
-- EQUIVALENT
-- REPLACEMENT
-- SUPERSEDES
-- ============================================================

CREATE TYPE cross_reference_type AS ENUM (
    'OEM',
    'AFTERMARKET',
    'EQUIVALENT',
    'REPLACEMENT',
    'SUPERSEDES'
);


CREATE TABLE IF NOT EXISTS product_cross_references (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    brand_id UUID
        REFERENCES brands(id),

    part_number VARCHAR(150) NOT NULL,

    normalized_part_number VARCHAR(150) NOT NULL,

    reference_type cross_reference_type NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_product_cross_reference
        UNIQUE (
            product_id,
            brand_id,
            normalized_part_number,
            reference_type
        )
);

CREATE INDEX IF NOT EXISTS idx_cross_references_product_id
    ON product_cross_references (product_id);

CREATE INDEX IF NOT EXISTS idx_cross_references_part_number
    ON product_cross_references (normalized_part_number);


-- ============================================================
-- SUPPLIERS
-- ============================================================

CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(255) NOT NULL,
    supplier_code VARCHAR(100),

    phone VARCHAR(50),
    email VARCHAR(255),

    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_suppliers_name
        UNIQUE (name),

    CONSTRAINT uq_suppliers_code
        UNIQUE (supplier_code)
);


CREATE TRIGGER suppliers_updated_at
BEFORE UPDATE ON suppliers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- PRODUCT SUPPLIERS
--
-- A product can be purchased from multiple suppliers.
-- ============================================================

CREATE TABLE IF NOT EXISTS product_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL
        REFERENCES products(id)
        ON DELETE CASCADE,

    supplier_id UUID NOT NULL
        REFERENCES suppliers(id)
        ON DELETE CASCADE,

    supplier_part_number VARCHAR(150),

    cost NUMERIC(12,2),

    minimum_order_quantity INTEGER NOT NULL DEFAULT 1,

    lead_time_days INTEGER,

    preferred BOOLEAN NOT NULL DEFAULT FALSE,

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_product_supplier
        UNIQUE (product_id, supplier_id)
);

CREATE INDEX IF NOT EXISTS idx_product_suppliers_product
    ON product_suppliers (product_id);

CREATE INDEX IF NOT EXISTS idx_product_suppliers_supplier
    ON product_suppliers (supplier_id);


CREATE TRIGGER product_suppliers_updated_at
BEFORE UPDATE ON product_suppliers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- WAREHOUSES
-- ============================================================

CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,

    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_warehouses_code
        UNIQUE (code)
);


CREATE TRIGGER warehouses_updated_at
BEFORE UPDATE ON warehouses
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- WAREHOUSE LOCATIONS
--
-- Simple hierarchy:
--
-- Warehouse
--   Zone
--     Aisle
--       Rack
--         Bin
--
-- We can keep this simple initially by using a single
-- location code such as A-03-04.
-- ============================================================

CREATE TABLE IF NOT EXISTS warehouse_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    warehouse_id UUID NOT NULL
        REFERENCES warehouses(id)
        ON DELETE CASCADE,

    code VARCHAR(100) NOT NULL,

    description VARCHAR(255),

    active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_warehouse_location
        UNIQUE (warehouse_id, code)
);

CREATE INDEX IF NOT EXISTS idx_warehouse_locations_warehouse
    ON warehouse_locations (warehouse_id);


-- ============================================================
-- INVENTORY
--
-- One product can exist:
--
-- Austin / A-03-04
-- Austin / B-02-01
-- Dallas / A-01-02
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL
        REFERENCES products(id),

    warehouse_location_id UUID NOT NULL
        REFERENCES warehouse_locations(id),

    quantity_on_hand INTEGER NOT NULL DEFAULT 0,

    quantity_reserved INTEGER NOT NULL DEFAULT 0,

    quantity_damaged INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_inventory_product_location
        UNIQUE (product_id, warehouse_location_id),

    CONSTRAINT chk_inventory_on_hand
        CHECK (quantity_on_hand >= 0),

    CONSTRAINT chk_inventory_reserved
        CHECK (quantity_reserved >= 0),

    CONSTRAINT chk_inventory_damaged
        CHECK (quantity_damaged >= 0),

    CONSTRAINT chk_inventory_reserved_not_greater
        CHECK (quantity_reserved <= quantity_on_hand)
);

CREATE INDEX IF NOT EXISTS idx_inventory_product
    ON inventory (product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_location
    ON inventory (warehouse_location_id);


CREATE TRIGGER inventory_updated_at
BEFORE UPDATE ON inventory
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- INVENTORY TRANSACTIONS
--
-- IMPORTANT:
-- Inventory changes should always create a transaction.
--
-- This gives us an audit trail.
-- ============================================================

CREATE TYPE inventory_transaction_type AS ENUM (
    'RECEIPT',
    'SALE',
    'RETURN',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'ADJUSTMENT',
    'DAMAGE',
    'LOST'
);


CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    product_id UUID NOT NULL
        REFERENCES products(id),

    warehouse_location_id UUID NOT NULL
        REFERENCES warehouse_locations(id),

    transaction_type inventory_transaction_type NOT NULL,

    quantity INTEGER NOT NULL,

    quantity_before INTEGER NOT NULL,

    quantity_after INTEGER NOT NULL,

    reference_type VARCHAR(50),

    reference_id UUID,

    notes TEXT,

    created_by INTEGER
        REFERENCES users(id),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_transaction_quantity
        CHECK (quantity <> 0)
);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product
    ON inventory_transactions (product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_location
    ON inventory_transactions (warehouse_location_id);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created_at
    ON inventory_transactions (created_at);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_reference
    ON inventory_transactions (reference_type, reference_id);


-- ============================================================
-- OUTBOX EVENTS
--
-- PostgreSQL -> Rust worker -> Elasticsearch
-- ============================================================

CREATE TABLE IF NOT EXISTS outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,

    event_type VARCHAR(100) NOT NULL,

    payload JSONB NOT NULL,

    processed_at TIMESTAMPTZ,

    retry_count INTEGER NOT NULL DEFAULT 0,

    last_error TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_unprocessed
    ON outbox_events (created_at)
    WHERE processed_at IS NULL;
