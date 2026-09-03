// Dev-only seed data. Everything here is gated on NODE_ENV=development so
// demo credentials and demo catalog rows can never appear in a qa/prod
// database. Both seeds are idempotent: the admin upserts on conflict, and the
// demo catalog/inventory only applies while the products table is empty — a
// developer who deletes the demo data keeps it deleted.

use sqlx::types::Uuid;
use sqlx::PgPool;

use crate::config::Config;
use crate::search;

const DEV_PASSWORD: &str = "Password1234!";

// One login per role (email, role, profile first/last name) so RBAC can be
// exercised locally without hand-editing the database.
const DEV_USERS: [(&str, &str, &str, &str); 3] = [
    ("admin@mail.com", "admin", "Dev", "Admin"),
    ("staff@mail.com", "staff", "Dev", "Staff"),
    ("user@mail.com", "client", "Dev", "User"),
];

// Dev-only convenience: guarantees known logins exist locally (one per role),
// so there's no manual set-role step for local dev. Gated on NODE_ENV so these
// credentials can never appear in a qa/prod database.
pub async fn seed_dev_users(cfg: &Config, db: &PgPool) {
    if cfg.env != "development" {
        return;
    }
    let hashed = crate::auth::hash_password(DEV_PASSWORD);
    for (email, role, first, last) in DEV_USERS {
        // Conflict (no row) and DB errors both fall through to the lookup, like
        // Go's err != nil branch.
        let inserted: Option<i32> = sqlx::query_scalar(
            "INSERT INTO users (email, password, role, email_verified)
             VALUES ($1, $2, $3, true)
             ON CONFLICT (email) DO NOTHING
             RETURNING id",
        )
        .bind(email)
        .bind(hashed.as_str())
        .bind(role)
        .fetch_optional(db)
        .await
        .ok()
        .flatten();
        let id = match inserted {
            Some(id) => id,
            // Already exists (or the insert failed for another reason) — look it up.
            None => {
                let existing = sqlx::query_scalar::<sqlx::Postgres, i32>(
                    "SELECT id FROM users WHERE email = $1",
                )
                .bind(email)
                .fetch_one(db)
                .await;
                match existing {
                    Ok(id) => id,
                    Err(err) => {
                        eprintln!("[seed] failed for {email}: {err}");
                        continue;
                    }
                }
            }
        };
        // Pre-fill the profile too, so the dev user isn't stopped by the
        // onboarding gate (see the onboarding gates in api/mod.rs).
        if let Err(err) = sqlx::query(
            "INSERT INTO user_profiles (user_id, first_name, last_name, address, state, zip, phone)
             VALUES ($1, $2, $3, 'N/A', 'N/A', '00000', 'N/A')
             ON CONFLICT (user_id) DO NOTHING",
        )
        .bind(id)
        .bind(first)
        .bind(last)
        .execute(db)
        .await
        {
            eprintln!("[seed] failed for {email}: {err}");
            continue;
        }
        eprintln!("[seed] dev user ready: {email} ({role})");
    }
}

// ---- demo catalog + inventory ----

const SEED_CATEGORIES: [&str; 6] = [
    "Brakes",
    "Engine",
    "Filters",
    "Electrical",
    "Suspension",
    "Cooling",
];

const SEED_BRANDS: [&str; 5] = ["Bosch", "Denso", "NGK", "Moog", "Gates"];

const SEED_WAREHOUSE: (&str, &str) = ("AUS", "Austin Main");
const SEED_BINS: [&str; 4] = ["A-01-01", "A-01-02", "B-02-01", "B-03-01"];

struct ProductSeed {
    sku: &'static str,
    mpn: &'static str,
    name: &'static str,
    description: &'static str,
    brand: &'static str,
    category: &'static str,
    cost: &'static str,
    bin: &'static str,
    on_hand: i32,
    lead_days: i32,
}

const SEED_PRODUCTS: [ProductSeed; 10] = [
    ProductSeed {
        sku: "BRK-BOS-905",
        mpn: "BC905",
        name: "Bosch QuietCast Brake Pads",
        description: "Front ceramic pads with shim and hardware kit",
        brand: "Bosch",
        category: "Brakes",
        cost: "38.40",
        bin: "A-01-01",
        on_hand: 24,
        lead_days: 2,
    },
    ProductSeed {
        sku: "FLT-BOS-300",
        mpn: "3300",
        name: "Bosch Premium Oil Filter",
        description: "Spin-on oil filter with FILTECH media",
        brand: "Bosch",
        category: "Filters",
        cost: "6.10",
        bin: "A-01-01",
        on_hand: 48,
        lead_days: 2,
    },
    ProductSeed {
        sku: "SPK-NGK-011",
        mpn: "BKR6EIX-11",
        name: "NGK Iridium IX Spark Plug",
        description: "Iridium center electrode, pre-gapped",
        brand: "NGK",
        category: "Engine",
        cost: "9.80",
        bin: "A-01-02",
        on_hand: 120,
        lead_days: 2,
    },
    ProductSeed {
        sku: "BLT-GAT-848",
        mpn: "K060848",
        name: "Gates Micro-V Serpentine Belt",
        description: "6-rib EPDM belt, matches OEM profile",
        brand: "Gates",
        category: "Engine",
        cost: "19.45",
        bin: "A-01-02",
        on_hand: 28,
        lead_days: 3,
    },
    ProductSeed {
        sku: "ALT-DEN-210",
        mpn: "210-0427",
        name: "Denso Alternator 130A",
        description: "First-time-fit remanufactured alternator",
        brand: "Denso",
        category: "Electrical",
        cost: "182.50",
        bin: "B-02-01",
        on_hand: 6,
        lead_days: 5,
    },
    ProductSeed {
        sku: "WIR-NGK-086",
        mpn: "HE86",
        name: "NGK Spark Plug Wire Set",
        description: "8mm silicone-jacket wire set",
        brand: "NGK",
        category: "Electrical",
        cost: "54.60",
        bin: "A-01-02",
        on_hand: 14,
        lead_days: 3,
    },
    ProductSeed {
        sku: "SUS-MOO-084",
        mpn: "K500084",
        name: "Moog Front Lower Ball Joint",
        description: "Problem Solver ball joint, greaseable",
        brand: "Moog",
        category: "Suspension",
        cost: "42.15",
        bin: "B-03-01",
        on_hand: 16,
        lead_days: 4,
    },
    ProductSeed {
        sku: "SUS-MOO-110",
        mpn: "K750110",
        name: "Moog Sway Bar Link Kit",
        description: "Complete link kit with bushings and hardware",
        brand: "Moog",
        category: "Suspension",
        cost: "28.90",
        bin: "B-03-01",
        on_hand: 22,
        lead_days: 4,
    },
    ProductSeed {
        sku: "WPM-DEN-451",
        mpn: "WPM-451",
        name: "Denso Water Pump",
        description: "Circulation pump with gasket",
        brand: "Denso",
        category: "Cooling",
        cost: "96.20",
        bin: "B-02-01",
        on_hand: 9,
        lead_days: 5,
    },
    ProductSeed {
        sku: "THM-GAT-528",
        mpn: "33528",
        name: "Gates Thermostat with Housing",
        description: "195°F thermostat, gasket included",
        brand: "Gates",
        category: "Cooling",
        cost: "24.30",
        bin: "B-02-01",
        on_hand: 11,
        lead_days: 3,
    },
];

fn fail(label: &str, err: impl std::fmt::Display) {
    eprintln!("[seed] {label} failed: {err}");
}

// Demo data for a fresh dev database: reference catalog, one warehouse with
// bins, suppliers, products (with MPN identifiers, sourcing, and outbox
// events), and stock with a varied movement ledger. Runs in one transaction —
// a failure anywhere aborts the whole seed.
pub async fn seed_dev_inventory(cfg: &Config, db: &PgPool) {
    if cfg.env != "development" {
        return;
    }
    // Seed only an empty catalog: a dev who deletes the demo data keeps it
    // deleted; wiping the catalog brings it back on the next boot.
    let has_products: bool = match sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM products)")
        .fetch_one(db)
        .await
    {
        Ok(exists) => exists,
        Err(err) => {
            fail("products existence check", err);
            return;
        }
    };
    if has_products {
        return;
    }
    // Ledger attribution: the dev admin seeded above (first entry in DEV_USERS).
    let admin_id: i32 =
        match sqlx::query_scalar("SELECT id FROM users WHERE email = 'admin@mail.com'")
            .fetch_one(db)
            .await
        {
            Ok(id) => id,
            Err(err) => {
                fail("dev admin lookup", err);
                return;
            }
        };

    let mut tx = match db.begin().await {
        Ok(tx) => tx,
        Err(err) => {
            fail("transaction start", err);
            return;
        }
    };

    // Reference data: INSERT-once via unique-key conflicts.
    for name in SEED_CATEGORIES {
        if let Err(err) = sqlx::query(
            "INSERT INTO categories (name, normalized_name) VALUES ($1, lower($1))
             ON CONFLICT DO NOTHING",
        )
        .bind(name)
        .execute(&mut *tx)
        .await
        {
            fail("seed category", err);
            return;
        }
    }
    for name in SEED_BRANDS {
        if let Err(err) = sqlx::query(
            "INSERT INTO brands (name, normalized_name) VALUES ($1, lower($1))
             ON CONFLICT DO NOTHING",
        )
        .bind(name)
        .execute(&mut *tx)
        .await
        {
            fail("seed brand", err);
            return;
        }
    }

    // Resolve lookup ids.
    let mut category_ids: Vec<(String, Uuid)> = vec![];
    let rows = match sqlx::query_as::<_, (String, Uuid)>("SELECT name, id FROM categories")
        .fetch_all(&mut *tx)
        .await
    {
        Ok(rows) => rows,
        Err(err) => {
            fail("category lookup", err);
            return;
        }
    };
    for (name, id) in rows {
        category_ids.push((name, id));
    }
    let mut brand_ids: Vec<(String, Uuid)> = vec![];
    let rows = match sqlx::query_as::<_, (String, Uuid)>("SELECT name, id FROM brands")
        .fetch_all(&mut *tx)
        .await
    {
        Ok(rows) => rows,
        Err(err) => {
            fail("brand lookup", err);
            return;
        }
    };
    for (name, id) in rows {
        brand_ids.push((name, id));
    }

    // Warehouse + bins.
    if let Err(err) =
        sqlx::query("INSERT INTO warehouses (code, name) VALUES ($1, $2) ON CONFLICT DO NOTHING")
            .bind(SEED_WAREHOUSE.0)
            .bind(SEED_WAREHOUSE.1)
            .execute(&mut *tx)
            .await
    {
        fail("seed warehouse", err);
        return;
    }
    let warehouse_id: Uuid = match sqlx::query_scalar("SELECT id FROM warehouses WHERE code = $1")
        .bind(SEED_WAREHOUSE.0)
        .fetch_one(&mut *tx)
        .await
    {
        Ok(id) => id,
        Err(err) => {
            fail("warehouse lookup", err);
            return;
        }
    };
    let mut bin_ids: Vec<(String, Uuid)> = vec![];
    for code in SEED_BINS {
        if let Err(err) = sqlx::query(
            "INSERT INTO warehouse_locations (warehouse_id, code) VALUES ($1, $2)
             ON CONFLICT DO NOTHING",
        )
        .bind(warehouse_id)
        .bind(code)
        .execute(&mut *tx)
        .await
        {
            fail("seed location", err);
            return;
        }
    }
    let rows = match sqlx::query_as::<_, (String, Uuid)>(
        "SELECT code, id FROM warehouse_locations WHERE warehouse_id = $1",
    )
    .bind(warehouse_id)
    .fetch_all(&mut *tx)
    .await
    {
        Ok(rows) => rows,
        Err(err) => {
            fail("location lookup", err);
            return;
        }
    };
    for (code, id) in rows {
        bin_ids.push((code, id));
    }

    // Suppliers (preferred vendor first in the list).
    let supplier_ids = {
        let mut ids: Vec<(String, Uuid)> = vec![];
        for (name, code) in [
            ("Worldpac Austin", "WP-AUS"),
            ("NAPA Distribution", "NAPA-01"),
        ] {
            if let Err(err) = sqlx::query(
                "INSERT INTO suppliers (name, supplier_code) VALUES ($1, $2)
                 ON CONFLICT DO NOTHING",
            )
            .bind(name)
            .bind(code)
            .execute(&mut *tx)
            .await
            {
                fail("seed supplier", err);
                return;
            }
        }
        let rows = match sqlx::query_as::<_, (String, Uuid)>("SELECT name, id FROM suppliers")
            .fetch_all(&mut *tx)
            .await
        {
            Ok(rows) => rows,
            Err(err) => {
                fail("supplier lookup", err);
                return;
            }
        };
        for (name, id) in rows {
            ids.push((name, id));
        }
        ids
    };

    // Products: identity + MPN identifier + preferred sourcing + outbox event
    // (the search worker indexes them).
    for seed in &SEED_PRODUCTS {
        let Some(brand_id) = brand_ids
            .iter()
            .find(|(n, _)| *n == seed.brand)
            .map(|(_, id)| id)
        else {
            eprintln!("[seed] unknown brand {}", seed.brand);
            return;
        };
        let Some(category_id) = category_ids
            .iter()
            .find(|(n, _)| *n == seed.category)
            .map(|(_, id)| id)
        else {
            eprintln!("[seed] unknown category {}", seed.category);
            return;
        };
        let product_id: Uuid = match sqlx::query_scalar(
            "INSERT INTO products (sku, name, description, brand_id, category_id, retail_price)
             VALUES ($1, $2, $3, $4, $5, ROUND(CAST($6 AS numeric) * 1.6, 2))
             RETURNING id",
        )
        .bind(seed.sku)
        .bind(seed.name)
        .bind(seed.description)
        .bind(brand_id)
        .bind(category_id)
        // Same cost-plus rule as the 002 backfill: sellable out of the box.
        .bind(seed.cost)
        .fetch_one(&mut *tx)
        .await
        {
            Ok(id) => id,
            Err(err) => {
                fail("seed product", err);
                return;
            }
        };
        if let Err(err) = sqlx::query(
            "INSERT INTO product_identifiers (product_id, identifier_type, value, normalized_value)
             VALUES ($1, 'MPN', $2, $3)",
        )
        .bind(product_id)
        .bind(seed.mpn)
        .bind(seed.mpn.to_lowercase())
        .execute(&mut *tx)
        .await
        {
            fail("seed MPN", err);
            return;
        }
        let Some(supplier_id) = supplier_ids.first().map(|(_, id)| id) else {
            eprintln!("[seed] no supplier id");
            return;
        };
        if let Err(err) = sqlx::query(
            "INSERT INTO product_suppliers
                (product_id, supplier_id, supplier_part_number, cost, minimum_order_quantity, lead_time_days, preferred)
             VALUES ($1, $2, $3, CAST($4 AS numeric), 1, $5, true)",
        )
        .bind(product_id)
        .bind(supplier_id)
        .bind(seed.sku)
        .bind(seed.cost)
        .bind(seed.lead_days)
        .execute(&mut *tx)
        .await
        {
            fail("seed sourcing", err);
            return;
        }
        if let Err(err) = search::enqueue(&mut tx, "product.created", product_id).await {
            fail("seed outbox event", err);
            return;
        }
        // Opening stock: one RECEIPT per product into its bin.
        let Some(bin_id) = bin_ids
            .iter()
            .find(|(code, _)| *code == seed.bin)
            .map(|(_, id)| *id)
        else {
            eprintln!("[seed] unknown bin {}", seed.bin);
            return;
        };
        if let Err(response) = crate::inventory::apply_change(
            &mut tx,
            product_id,
            bin_id,
            seed.on_hand,
            0,
            "RECEIPT",
            "initial stock",
            admin_id,
        )
        .await
        {
            fail("seed receipt", response_text(&response));
            return;
        }
    }

    // A little ledger variety: damage two brake pads, move ten filters to the
    // second bin.
    let pads_id: Uuid = match sqlx::query_scalar("SELECT id FROM products WHERE sku = $1")
        .bind("BRK-BOS-905")
        .fetch_one(&mut *tx)
        .await
    {
        Ok(id) => id,
        Err(err) => {
            fail("product lookup", err);
            return;
        }
    };
    let filters_id: Uuid = match sqlx::query_scalar("SELECT id FROM products WHERE sku = $1")
        .bind("FLT-BOS-300")
        .fetch_one(&mut *tx)
        .await
    {
        Ok(id) => id,
        Err(err) => {
            fail("product lookup", err);
            return;
        }
    };
    let bin_a = bin_ids
        .iter()
        .find(|(c, _)| c == "A-01-01")
        .map(|(_, id)| *id);
    let bin_b = bin_ids
        .iter()
        .find(|(c, _)| c == "B-02-01")
        .map(|(_, id)| *id);
    let (Some(bin_a), Some(bin_b)) = (bin_a, bin_b) else {
        eprintln!("[seed] bins missing");
        return;
    };
    if let Err(response) = crate::inventory::apply_change(
        &mut tx,
        pads_id,
        bin_a,
        -2,
        2,
        "DAMAGE",
        "damaged in transit",
        admin_id,
    )
    .await
    {
        fail("seed damage", response_text(&response));
        return;
    }
    if let Err(response) = crate::inventory::apply_change(
        &mut tx,
        filters_id,
        bin_a,
        -10,
        0,
        "TRANSFER_OUT",
        "rebalance to B-02-01",
        admin_id,
    )
    .await
    {
        fail("seed transfer out", response_text(&response));
        return;
    }
    if let Err(response) = crate::inventory::apply_change(
        &mut tx,
        filters_id,
        bin_b,
        10,
        0,
        "TRANSFER_IN",
        "rebalance from A-01-01",
        admin_id,
    )
    .await
    {
        fail("seed transfer in", response_text(&response));
        return;
    }

    if let Err(err) = tx.commit().await {
        fail("commit", err);
        return;
    }
    eprintln!(
        "[seed] dev inventory ready: {} products, {} bins, stock and ledger history",
        SEED_PRODUCTS.len(),
        SEED_BINS.len()
    );
}

// apply_change's error type is an axum Response (not printable meaningfully);
// the ledger messages are enough context.
fn response_text(_response: &axum::response::Response) -> &'static str {
    "rejected"
}

// Run both dev seeds in order — the inventory seed attributes its movements
// to the admin created by the first.
pub async fn run(cfg: &Config, db: &PgPool) {
    seed_dev_users(cfg, db).await;
    seed_dev_inventory(cfg, db).await;
}
