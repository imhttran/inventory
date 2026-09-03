// Step 4 — suppliers: vendor records and per-product sourcing. Reads need any
// signed-in user; writes are staff-only, deletes admin-only.
//
// product_suppliers is the sourcing table: a product can be purchased from
// many suppliers with a part number, cost, MOQ, lead time, and at most one
// preferred vendor. The sourcing list on a product is replaced wholesale via
// PUT (parsed strictly — a broken body must never wipe sourcing).

use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Response;
use chrono::{DateTime, Utc};
use rust_decimal::Decimal;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::types::Uuid;

use crate::api::{
    decode, ensure_role, fail, is_unique_violation, msg, respond, respond_500, AuthUser,
};
use crate::state::AppState;
use crate::validators::validate_email;

#[derive(sqlx::FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Supplier {
    pub id: Uuid,
    pub name: String,
    pub supplier_code: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub address_line1: Option<String>,
    pub address_line2: Option<String>,
    pub city: Option<String>,
    pub state: Option<String>,
    pub postal_code: Option<String>,
    pub country: String,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct SupplierBody {
    name: Option<String>,
    supplier_code: Option<String>,
    phone: Option<String>,
    email: Option<String>,
    address_line1: Option<String>,
    address_line2: Option<String>,
    city: Option<String>,
    state: Option<String>,
    postal_code: Option<String>,
    country: Option<String>,
}

fn optional_trim(value: Option<String>) -> Option<String> {
    value
        .map(|v| v.trim().to_string())
        .filter(|v| !v.is_empty())
}

// Trim + empty-to-None for every optional text column; name stays required.
fn normalize(body: SupplierBody) -> Result<SupplierBody, Response> {
    if body
        .name
        .as_deref()
        .map(str::trim)
        .unwrap_or_default()
        .is_empty()
    {
        return Err(respond(
            StatusCode::BAD_REQUEST,
            msg("Supplier name is required"),
        ));
    }
    if let Some(email) = body.email.as_deref() {
        let email = email.trim();
        if !email.is_empty() && !validate_email(email) {
            return Err(respond(
                StatusCode::BAD_REQUEST,
                msg("Email address is invalid"),
            ));
        }
    }
    Ok(SupplierBody {
        name: Some(body.name.unwrap_or_default().trim().to_string()),
        supplier_code: optional_trim(body.supplier_code),
        phone: optional_trim(body.phone),
        email: optional_trim(body.email),
        address_line1: optional_trim(body.address_line1),
        address_line2: optional_trim(body.address_line2),
        city: optional_trim(body.city),
        state: optional_trim(body.state),
        postal_code: optional_trim(body.postal_code),
        country: optional_trim(body.country),
    })
}

const SUPPLIER_SELECT: &str = "SELECT id, name, supplier_code, phone, email,
       address_line1, address_line2, city, state, postal_code, country,
       active, created_at, updated_at
FROM suppliers";

async fn load_supplier(state: &AppState, id: Uuid) -> Result<Option<Supplier>, sqlx::Error> {
    sqlx::query_as(&format!("{SUPPLIER_SELECT} WHERE id = $1"))
        .bind(id)
        .fetch_optional(&state.db)
        .await
}

// The two unique constraints get distinct, actionable 400 messages.
fn unique_message(err: &sqlx::Error) -> &'static str {
    let constraint = err
        .as_database_error()
        .and_then(|e| e.constraint())
        .unwrap_or("");
    if constraint.contains("suppliers_code") {
        "Supplier code already in use"
    } else {
        "Supplier already exists"
    }
}

pub async fn list_suppliers(State(state): State<AppState>, _user: AuthUser) -> Response {
    let rows: Result<Vec<Supplier>, _> =
        sqlx::query_as(&format!("{SUPPLIER_SELECT} ORDER BY name ASC"))
            .fetch_all(&state.db)
            .await;
    match rows {
        Ok(suppliers) => respond(StatusCode::OK, json!({ "suppliers": suppliers })),
        Err(err) => respond_500("List Suppliers Error", err, false),
    }
}

pub async fn get_supplier(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Response {
    let Ok(id) = Uuid::parse_str(&id) else {
        return respond(StatusCode::BAD_REQUEST, msg("Invalid supplier id"));
    };
    match load_supplier(&state, id).await {
        Ok(Some(supplier)) => respond(StatusCode::OK, json!({ "supplier": supplier })),
        Ok(None) => respond(StatusCode::NOT_FOUND, msg("Supplier not found")),
        Err(err) => respond_500("Get Supplier Error", err, false),
    }
}

pub async fn create_supplier(
    State(state): State<AppState>,
    user: AuthUser,
    body: Bytes,
) -> Response {
    if let Err(rejection) = ensure_role(&user, "staff") {
        return rejection;
    }
    let body: SupplierBody = decode(&body);
    let body = match normalize(body) {
        Ok(body) => body,
        Err(response) => return response,
    };
    let row: Result<Supplier, _> = sqlx::query_as(&format!(
        "INSERT INTO suppliers (name, supplier_code, phone, email,
                                address_line1, address_line2, city, state,
                                postal_code, country)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *"
    ))
    .bind(body.name.unwrap_or_default())
    .bind(body.supplier_code)
    .bind(body.phone)
    .bind(body.email)
    .bind(body.address_line1)
    .bind(body.address_line2)
    .bind(body.city)
    .bind(body.state)
    .bind(body.postal_code)
    .bind(body.country.clone().unwrap_or_else(|| "USA".to_string()))
    .fetch_one(&state.db)
    .await;
    match row {
        Ok(supplier) => respond(
            StatusCode::CREATED,
            json!({
                "success": true,
                "message": "Supplier created",
                "supplier": supplier,
            }),
        ),
        Err(err) => {
            if is_unique_violation(&err) {
                return respond(StatusCode::BAD_REQUEST, fail(unique_message(&err)));
            }
            respond_500("Create Supplier Error", err, true)
        }
    }
}

pub async fn update_supplier(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<String>,
    body: Bytes,
) -> Response {
    if let Err(rejection) = ensure_role(&user, "staff") {
        return rejection;
    }
    let Ok(id) = Uuid::parse_str(&id) else {
        return respond(StatusCode::BAD_REQUEST, msg("Invalid supplier id"));
    };
    let body: SupplierBody = decode(&body);
    let body = match normalize(body) {
        Ok(body) => body,
        Err(response) => return response,
    };
    let updated = sqlx::query_scalar::<_, Uuid>(
        "UPDATE suppliers SET name = $1, supplier_code = $2, phone = $3, email = $4,
                address_line1 = $5, address_line2 = $6, city = $7, state = $8,
                postal_code = $9, country = $10, updated_at = now()
         WHERE id = $11
         RETURNING id",
    )
    .bind(body.name.unwrap_or_default())
    .bind(body.supplier_code)
    .bind(body.phone)
    .bind(body.email)
    .bind(body.address_line1)
    .bind(body.address_line2)
    .bind(body.city)
    .bind(body.state)
    .bind(body.postal_code)
    .bind(body.country.clone().unwrap_or_else(|| "USA".to_string()))
    .bind(id)
    .fetch_optional(&state.db)
    .await;
    match updated {
        Ok(Some(_)) => {}
        Ok(None) => return respond(StatusCode::NOT_FOUND, msg("Supplier not found")),
        Err(err) => {
            if is_unique_violation(&err) {
                return respond(StatusCode::BAD_REQUEST, fail(unique_message(&err)));
            }
            return respond_500("Update Supplier Error", err, true);
        }
    }
    match load_supplier(&state, id).await {
        Ok(Some(supplier)) => respond(
            StatusCode::OK,
            json!({
                "success": true,
                "message": "Supplier updated",
                "supplier": supplier,
            }),
        ),
        Ok(None) => respond(StatusCode::NOT_FOUND, msg("Supplier not found")),
        Err(err) => respond_500("Update Supplier Error", err, false),
    }
}

pub async fn delete_supplier(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<String>,
) -> Response {
    if let Err(rejection) = ensure_role(&user, "admin") {
        return rejection;
    }
    let Ok(id) = Uuid::parse_str(&id) else {
        return respond(StatusCode::BAD_REQUEST, msg("Invalid supplier id"));
    };
    // Sourcing rows cascade (product_suppliers ... ON DELETE CASCADE).
    let tag = sqlx::query("DELETE FROM suppliers WHERE id = $1")
        .bind(id)
        .execute(&state.db)
        .await;
    match tag {
        Err(err) => respond_500("Delete Supplier Error", err, false),
        Ok(result) if result.rows_affected() == 0 => {
            respond(StatusCode::NOT_FOUND, msg("Supplier not found"))
        }
        Ok(_) => respond(
            StatusCode::OK,
            json!({ "success": true, "message": "Supplier deleted" }),
        ),
    }
}

#[derive(sqlx::FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SourcingRow {
    pub id: Uuid,
    pub supplier_id: Uuid,
    pub supplier_name: String,
    pub supplier_code: Option<String>,
    pub supplier_part_number: Option<String>,
    pub cost: Option<Decimal>,
    pub minimum_order_quantity: i32,
    pub lead_time_days: Option<i32>,
    pub preferred: bool,
    pub active: bool,
}

const SOURCING_SELECT: &str = "SELECT ps.id, ps.supplier_id, s.name AS supplier_name,
       s.supplier_code, ps.supplier_part_number, ps.cost,
       ps.minimum_order_quantity, ps.lead_time_days, ps.preferred, ps.active
FROM product_suppliers ps
JOIN suppliers s ON s.id = ps.supplier_id";

async fn load_sourcing(
    tx: &mut sqlx::PgConnection,
    product_id: Uuid,
) -> Result<Vec<SourcingRow>, sqlx::Error> {
    sqlx::query_as(&format!(
        "{SOURCING_SELECT} WHERE ps.product_id = $1
         ORDER BY ps.preferred DESC, s.name ASC"
    ))
    .bind(product_id)
    .fetch_all(tx)
    .await
}

pub async fn list_product_sourcing(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Response {
    let Ok(product_id) = Uuid::parse_str(&id) else {
        return respond(StatusCode::BAD_REQUEST, msg("Invalid product id"));
    };
    let product_exists: bool =
        match sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM products WHERE id = $1)")
            .bind(product_id)
            .fetch_one(&state.db)
            .await
        {
            Ok(exists) => exists,
            Err(err) => return respond_500("Product Sourcing Error", err, false),
        };
    if !product_exists {
        return respond(StatusCode::NOT_FOUND, msg("Product not found"));
    }
    let rows = sqlx::query_as::<_, SourcingRow>(&format!(
        "{SOURCING_SELECT} WHERE ps.product_id = $1
         ORDER BY ps.preferred DESC, s.name ASC"
    ))
    .bind(product_id)
    .fetch_all(&state.db)
    .await;
    match rows {
        Ok(sourcing) => respond(StatusCode::OK, json!({ "sourcing": sourcing })),
        Err(err) => respond_500("Product Sourcing Error", err, false),
    }
}

#[derive(Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct SourcingEntry {
    supplier_id: Option<Uuid>,
    supplier_part_number: Option<String>,
    cost: Option<Decimal>,
    minimum_order_quantity: Option<i32>,
    lead_time_days: Option<i32>,
    preferred: Option<bool>,
}

#[derive(Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct SourcingBody {
    sourcing: Vec<SourcingEntry>,
}

// PUT /api/v1/products/{id}/suppliers — wholesale replacement of the product's
// sourcing list, in one transaction. The body is parsed STRICTLY (not via the
// loose decode helper): a malformed body must 400, never fall back to an empty
// list and silently wipe a product's sourcing.
pub async fn replace_product_sourcing(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<String>,
    body: Bytes,
) -> Response {
    if let Err(rejection) = ensure_role(&user, "staff") {
        return rejection;
    }
    let Ok(product_id) = Uuid::parse_str(&id) else {
        return respond(StatusCode::BAD_REQUEST, msg("Invalid product id"));
    };
    let body: SourcingBody = match serde_json::from_slice(&body) {
        Ok(body) => body,
        Err(_) => return respond(StatusCode::BAD_REQUEST, msg("Invalid request body")),
    };

    // Validate everything before touching the database.
    let mut preferred_count = 0usize;
    let mut seen = std::collections::HashSet::new();
    for entry in &body.sourcing {
        let Some(supplier_id) = entry.supplier_id else {
            return respond(
                StatusCode::BAD_REQUEST,
                msg("supplierId is required for each sourcing entry"),
            );
        };
        if !seen.insert(supplier_id) {
            return respond(
                StatusCode::BAD_REQUEST,
                msg("Duplicate supplier in sourcing list"),
            );
        }
        if let Some(cost) = entry.cost {
            if cost < Decimal::ZERO {
                return respond(StatusCode::BAD_REQUEST, msg("Cost cannot be negative"));
            }
        }
        if let Some(moq) = entry.minimum_order_quantity {
            if moq < 1 {
                return respond(
                    StatusCode::BAD_REQUEST,
                    msg("Minimum order quantity must be at least 1"),
                );
            }
        }
        if let Some(lead) = entry.lead_time_days {
            if lead < 0 {
                return respond(StatusCode::BAD_REQUEST, msg("Lead time cannot be negative"));
            }
        }
        if entry.preferred.unwrap_or(false) {
            preferred_count += 1;
        }
    }
    if preferred_count > 1 {
        return respond(
            StatusCode::BAD_REQUEST,
            msg("Only one supplier can be preferred"),
        );
    }

    let product_exists: bool =
        match sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM products WHERE id = $1)")
            .bind(product_id)
            .fetch_one(&state.db)
            .await
        {
            Ok(exists) => exists,
            Err(err) => return respond_500("Product Sourcing Error", err, false),
        };
    if !product_exists {
        return respond(StatusCode::NOT_FOUND, msg("Product not found"));
    }
    // Unknown supplier ids would 500 on FK — pre-check them all.
    for supplier_id in &seen {
        let exists: bool =
            match sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM suppliers WHERE id = $1)")
                .bind(supplier_id)
                .fetch_one(&state.db)
                .await
            {
                Ok(exists) => exists,
                Err(err) => return respond_500("Product Sourcing Error", err, false),
            };
        if !exists {
            return respond(StatusCode::BAD_REQUEST, msg("Supplier not found"));
        }
    }

    let mut tx = match state.db.begin().await {
        Ok(tx) => tx,
        Err(err) => return respond_500("Product Sourcing Error", err, false),
    };
    if let Err(err) = sqlx::query("DELETE FROM product_suppliers WHERE product_id = $1")
        .bind(product_id)
        .execute(&mut *tx)
        .await
    {
        return respond_500("Product Sourcing Error", err, false);
    }
    for entry in &body.sourcing {
        let part_number = entry
            .supplier_part_number
            .as_deref()
            .map(str::trim)
            .filter(|v| !v.is_empty());
        if let Err(err) = sqlx::query(
            "INSERT INTO product_suppliers
                (product_id, supplier_id, supplier_part_number, cost,
                 minimum_order_quantity, lead_time_days, preferred)
             VALUES ($1, $2, $3, $4, $5, $6, $7)",
        )
        .bind(product_id)
        .bind(entry.supplier_id)
        .bind(part_number)
        .bind(entry.cost)
        .bind(entry.minimum_order_quantity.unwrap_or(1))
        .bind(entry.lead_time_days)
        .bind(entry.preferred.unwrap_or(false))
        .execute(&mut *tx)
        .await
        {
            if is_unique_violation(&err) {
                return respond(
                    StatusCode::BAD_REQUEST,
                    fail("Duplicate supplier in sourcing list"),
                );
            }
            return respond_500("Product Sourcing Error", err, true);
        }
    }
    let sourcing = match load_sourcing(&mut tx, product_id).await {
        Ok(sourcing) => sourcing,
        Err(err) => return respond_500("Product Sourcing Error", err, false),
    };
    if let Err(err) = tx.commit().await {
        return respond_500("Product Sourcing Error", err, false);
    }
    respond(
        StatusCode::OK,
        json!({
            "success": true,
            "message": "Sourcing updated",
            "sourcing": sourcing,
        }),
    )
}
