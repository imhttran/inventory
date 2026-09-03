// Step 3 — inventory: stock levels and the audit trail. Every quantity change
// goes through apply_change, which in one transaction upserts the inventory
// row and appends an inventory_transactions row (quantity/before/after), so
// the ledger and the stock levels can never drift apart.
//
// Semantics (quantity stored SIGNED in the ledger: after = before + quantity):
//   RECEIPT      on_hand +q          (q > 0)
//   RETURN       on_hand +q
//   ADJUSTMENT   on_hand ±q          (signed; the one type allowed negative)
//   SALE         on_hand -q
//   LOST         on_hand -q
//   DAMAGE       on_hand -q, damaged +q
//   TRANSFER_OUT on_hand -q (source)  /  TRANSFER_IN on_hand +q (destination)
//
// The table's CHECK constraints (non-negative, reserved <= on_hand) are the
// backstop; the code checks first so users get clean 400s.

pub mod warehouses;

use axum::body::Bytes;
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::response::Response;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::types::Uuid;

use crate::api::{decode, ensure_role, is_check_violation, msg, respond, respond_500, AuthUser};
use crate::state::AppState;

const INVENTORY_SELECT: &str = "SELECT i.id, i.product_id, i.warehouse_location_id,
       p.sku AS product_sku, p.name AS product_name,
       w.code AS warehouse_code, w.name AS warehouse_name, l.code AS location_code,
       i.quantity_on_hand, i.quantity_reserved, i.quantity_damaged,
       i.created_at, i.updated_at
FROM inventory i
JOIN products p ON p.id = i.product_id
JOIN warehouse_locations l ON l.id = i.warehouse_location_id
JOIN warehouses w ON w.id = l.warehouse_id";

#[derive(sqlx::FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InventoryRow {
    pub id: Uuid,
    pub product_id: Uuid,
    pub warehouse_location_id: Uuid,
    pub product_sku: String,
    pub product_name: String,
    pub warehouse_code: String,
    pub warehouse_name: String,
    pub location_code: String,
    pub quantity_on_hand: i32,
    pub quantity_reserved: i32,
    pub quantity_damaged: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(sqlx::FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TransactionRow {
    pub id: Uuid,
    pub product_id: Uuid,
    pub warehouse_location_id: Uuid,
    pub transaction_type: String,
    pub quantity: i32,
    pub quantity_before: i32,
    pub quantity_after: i32,
    pub notes: Option<String>,
    pub created_by: Option<i32>,
    pub created_at: DateTime<Utc>,
}

// One stock mutation = one ledger row. `on_hand_delta`/`damaged_delta` are the
// signed changes; `quantity` is the signed ledger value. The row is created on
// first touch (zeroed), so receive works against an empty location.
// `pub(crate)` so the dev seed runs its demo movements through the exact same
// invariant as the API.
#[allow(clippy::too_many_arguments)]
pub(crate) async fn apply_change(
    tx: &mut sqlx::PgConnection,
    product_id: Uuid,
    location_id: Uuid,
    on_hand_delta: i32,
    damaged_delta: i32,
    transaction_type: &str,
    notes: &str,
    user_id: i32,
) -> Result<TransactionRow, Response> {
    sqlx::query(
        "INSERT INTO inventory (product_id, warehouse_location_id)
         VALUES ($1, $2)
         ON CONFLICT (product_id, warehouse_location_id) DO NOTHING",
    )
    .bind(product_id)
    .bind(location_id)
    .execute(&mut *tx)
    .await
    .map_err(|err| respond_500("Inventory Update Error", err, false))?;

    let moved = match sqlx::query_as::<_, (i32, i32, i32)>(
        "UPDATE inventory SET
            quantity_on_hand = quantity_on_hand + $3,
            quantity_damaged = quantity_damaged + $4,
            updated_at = now()
         WHERE product_id = $1 AND warehouse_location_id = $2
         RETURNING quantity_on_hand - $3 AS quantity_before,
                   quantity_on_hand AS quantity_after,
                   quantity_reserved",
    )
    .bind(product_id)
    .bind(location_id)
    .bind(on_hand_delta)
    .bind(damaged_delta)
    .fetch_one(&mut *tx)
    .await
    {
        Ok(moved) => moved,
        Err(err) if is_check_violation(&err) => {
            return Err(respond(
                StatusCode::BAD_REQUEST,
                msg("Insufficient stock for this operation"),
            ));
        }
        Err(err) => return Err(respond_500("Inventory Update Error", err, false)),
    };
    let (before, after, reserved) = moved;

    if after < 0 {
        return Err(respond(
            StatusCode::BAD_REQUEST,
            msg(&format!("Insufficient stock: on hand would be {after}")),
        ));
    }
    if after < reserved {
        return Err(respond(
            StatusCode::BAD_REQUEST,
            msg(&format!("On hand would fall below reserved ({reserved})")),
        ));
    }

    sqlx::query_as::<_, TransactionRow>(
        "INSERT INTO inventory_transactions
            (product_id, warehouse_location_id, transaction_type, quantity,
             quantity_before, quantity_after, notes, created_by)
         VALUES ($1, $2, CAST($3 AS inventory_transaction_type), $4,
                 $5, $6, $7, $8)
         RETURNING id, product_id, warehouse_location_id,
                   transaction_type::text AS transaction_type,
                   quantity, quantity_before, quantity_after, notes, created_by, created_at",
    )
    .bind(product_id)
    .bind(location_id)
    .bind(transaction_type)
    .bind(on_hand_delta)
    .bind(before)
    .bind(after)
    .bind(if notes.is_empty() {
        None
    } else {
        Some(notes.to_string())
    })
    .bind(user_id)
    .fetch_one(&mut *tx)
    .await
    .map_err(|err| respond_500("Inventory Ledger Error", err, true))
}

// FK targets validated up front so users get 400s instead of FK-violation 500s.
async fn ensure_references(
    state: &AppState,
    product_id: Uuid,
    location_ids: &[Uuid],
) -> Result<(), Response> {
    let product_exists: bool =
        sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM products WHERE id = $1)")
            .bind(product_id)
            .fetch_one(&state.db)
            .await
            .map_err(|err| respond_500("Inventory Lookup Error", err, false))?;
    if !product_exists {
        return Err(respond(StatusCode::BAD_REQUEST, msg("Product not found")));
    }
    for location_id in location_ids {
        let exists: bool =
            sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM warehouse_locations WHERE id = $1)")
                .bind(location_id)
                .fetch_one(&state.db)
                .await
                .map_err(|err| respond_500("Inventory Lookup Error", err, false))?;
        if !exists {
            return Err(respond(
                StatusCode::BAD_REQUEST,
                msg("Warehouse location not found"),
            ));
        }
    }
    Ok(())
}

#[derive(Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct ChangeBody {
    product_id: Option<Uuid>,
    warehouse_location_id: Option<Uuid>,
    transaction_type: Option<String>,
    quantity: Option<i32>,
    notes: Option<String>,
}

// POST /api/v1/inventory/receive — stock arriving from a supplier.
pub async fn receive(State(state): State<AppState>, user: AuthUser, body: Bytes) -> Response {
    if let Err(rejection) = ensure_role(&user, "staff") {
        return rejection;
    }
    let body: ChangeBody = decode(&body);
    let Some(product_id) = body.product_id else {
        return respond(StatusCode::BAD_REQUEST, msg("Product is required"));
    };
    let Some(location_id) = body.warehouse_location_id else {
        return respond(
            StatusCode::BAD_REQUEST,
            msg("Warehouse location is required"),
        );
    };
    let Some(quantity) = body.quantity else {
        return respond(StatusCode::BAD_REQUEST, msg("Quantity is required"));
    };
    if quantity <= 0 {
        return respond(
            StatusCode::BAD_REQUEST,
            msg("Quantity must be a positive whole number"),
        );
    }
    if let Err(response) = ensure_references(&state, product_id, &[location_id]).await {
        return response;
    }
    let notes = body.notes.unwrap_or_default().trim().to_string();
    let mut tx = match state.db.begin().await {
        Ok(tx) => tx,
        Err(err) => return respond_500("Receive Stock Error", err, false),
    };
    let transaction = match apply_change(
        &mut tx,
        product_id,
        location_id,
        quantity,
        0,
        "RECEIPT",
        &notes,
        user.id,
    )
    .await
    {
        Ok(transaction) => transaction,
        Err(response) => return response,
    };
    if let Err(err) = tx.commit().await {
        return respond_500("Receive Stock Error", err, false);
    }
    let inventory = sqlx::query_as::<_, InventoryRow>(&format!(
        "{INVENTORY_SELECT} WHERE i.product_id = $1 AND i.warehouse_location_id = $2"
    ))
    .bind(product_id)
    .bind(location_id)
    .fetch_one(&state.db)
    .await;
    match inventory {
        Ok(inventory) => respond(
            StatusCode::OK,
            json!({
                "success": true,
                "message": format!("Received {quantity} into stock"),
                "inventory": inventory,
                "transaction": transaction,
            }),
        ),
        Err(err) => respond_500("Receive Stock Error", err, false),
    }
}

const ADJUSTABLE_TYPES: [&str; 5] = ["SALE", "RETURN", "ADJUSTMENT", "DAMAGE", "LOST"];

// POST /api/v1/inventory/adjust — SALE/RETURN/ADJUSTMENT/DAMAGE/LOST. Only
// ADJUSTMENT may carry a negative quantity (a signed correction); every other
// type takes a positive quantity and derives its direction from the type.
pub async fn adjust(State(state): State<AppState>, user: AuthUser, body: Bytes) -> Response {
    if let Err(rejection) = ensure_role(&user, "staff") {
        return rejection;
    }
    let body: ChangeBody = decode(&body);
    let Some(product_id) = body.product_id else {
        return respond(StatusCode::BAD_REQUEST, msg("Product is required"));
    };
    let Some(location_id) = body.warehouse_location_id else {
        return respond(
            StatusCode::BAD_REQUEST,
            msg("Warehouse location is required"),
        );
    };
    let Some(quantity) = body.quantity else {
        return respond(StatusCode::BAD_REQUEST, msg("Quantity is required"));
    };
    let transaction_type = body
        .transaction_type
        .unwrap_or_default()
        .trim()
        .to_uppercase();
    if !ADJUSTABLE_TYPES.contains(&transaction_type.as_str()) {
        return respond(
            StatusCode::BAD_REQUEST,
            msg("transactionType must be one of: SALE, RETURN, ADJUSTMENT, DAMAGE, LOST"),
        );
    }
    if quantity == 0 || (transaction_type != "ADJUSTMENT" && quantity < 0) {
        return respond(
            StatusCode::BAD_REQUEST,
            msg("Quantity must be positive (negative only for ADJUSTMENT)"),
        );
    }
    if let Err(response) = ensure_references(&state, product_id, &[location_id]).await {
        return response;
    }
    let (on_hand_delta, damaged_delta) = match transaction_type.as_str() {
        "SALE" | "LOST" => (-quantity, 0),
        "DAMAGE" => (-quantity, quantity),
        "RETURN" => (quantity, 0),
        _ => (quantity, 0), // ADJUSTMENT — signed
    };
    let notes = body.notes.unwrap_or_default().trim().to_string();
    let mut tx = match state.db.begin().await {
        Ok(tx) => tx,
        Err(err) => return respond_500("Adjust Stock Error", err, false),
    };
    let transaction = match apply_change(
        &mut tx,
        product_id,
        location_id,
        on_hand_delta,
        damaged_delta,
        &transaction_type,
        &notes,
        user.id,
    )
    .await
    {
        Ok(transaction) => transaction,
        Err(response) => return response,
    };
    if let Err(err) = tx.commit().await {
        return respond_500("Adjust Stock Error", err, false);
    }
    let inventory = sqlx::query_as::<_, InventoryRow>(&format!(
        "{INVENTORY_SELECT} WHERE i.product_id = $1 AND i.warehouse_location_id = $2"
    ))
    .bind(product_id)
    .bind(location_id)
    .fetch_one(&state.db)
    .await;
    match inventory {
        Ok(inventory) => respond(
            StatusCode::OK,
            json!({
                "success": true,
                "message": format!("{transaction_type} recorded"),
                "inventory": inventory,
                "transaction": transaction,
            }),
        ),
        Err(err) => respond_500("Adjust Stock Error", err, false),
    }
}

#[derive(Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct TransferBody {
    product_id: Option<Uuid>,
    from_warehouse_location_id: Option<Uuid>,
    to_warehouse_location_id: Option<Uuid>,
    quantity: Option<i32>,
    notes: Option<String>,
}

// POST /api/v1/inventory/transfer — one transaction writes TRANSFER_OUT at the
// source and TRANSFER_IN at the destination, so a crash can't strand stock.
pub async fn transfer(State(state): State<AppState>, user: AuthUser, body: Bytes) -> Response {
    if let Err(rejection) = ensure_role(&user, "staff") {
        return rejection;
    }
    let body: TransferBody = decode(&body);
    let Some(product_id) = body.product_id else {
        return respond(StatusCode::BAD_REQUEST, msg("Product is required"));
    };
    let Some(from_location) = body.from_warehouse_location_id else {
        return respond(
            StatusCode::BAD_REQUEST,
            msg("From warehouse location is required"),
        );
    };
    let Some(to_location) = body.to_warehouse_location_id else {
        return respond(
            StatusCode::BAD_REQUEST,
            msg("To warehouse location is required"),
        );
    };
    if from_location == to_location {
        return respond(
            StatusCode::BAD_REQUEST,
            msg("Source and destination locations must differ"),
        );
    }
    let Some(quantity) = body.quantity else {
        return respond(StatusCode::BAD_REQUEST, msg("Quantity is required"));
    };
    if quantity <= 0 {
        return respond(
            StatusCode::BAD_REQUEST,
            msg("Quantity must be a positive whole number"),
        );
    }
    if let Err(response) =
        ensure_references(&state, product_id, &[from_location, to_location]).await
    {
        return response;
    }
    let notes = body.notes.unwrap_or_default().trim().to_string();
    let mut tx = match state.db.begin().await {
        Ok(tx) => tx,
        Err(err) => return respond_500("Transfer Stock Error", err, false),
    };
    let out = match apply_change(
        &mut tx,
        product_id,
        from_location,
        -quantity,
        0,
        "TRANSFER_OUT",
        &notes,
        user.id,
    )
    .await
    {
        Ok(out) => out,
        Err(response) => return response,
    };
    let transfer_in = match apply_change(
        &mut tx,
        product_id,
        to_location,
        quantity,
        0,
        "TRANSFER_IN",
        &notes,
        user.id,
    )
    .await
    {
        Ok(transfer_in) => transfer_in,
        Err(response) => return response,
    };
    if let Err(err) = tx.commit().await {
        return respond_500("Transfer Stock Error", err, false);
    }
    let from_row = sqlx::query_as::<_, InventoryRow>(&format!(
        "{INVENTORY_SELECT} WHERE i.product_id = $1 AND i.warehouse_location_id = $2"
    ))
    .bind(product_id)
    .bind(from_location)
    .fetch_one(&state.db)
    .await;
    let to_row = sqlx::query_as::<_, InventoryRow>(&format!(
        "{INVENTORY_SELECT} WHERE i.product_id = $1 AND i.warehouse_location_id = $2"
    ))
    .bind(product_id)
    .bind(to_location)
    .fetch_one(&state.db)
    .await;
    match (from_row, to_row) {
        (Ok(from), Ok(to)) => respond(
            StatusCode::OK,
            json!({
                "success": true,
                "message": format!("Transferred {quantity}"),
                "from": from,
                "to": to,
                "out": out,
                "in": transfer_in,
            }),
        ),
        (Err(err), _) | (_, Err(err)) => respond_500("Transfer Stock Error", err, false),
    }
}

#[derive(Deserialize, Default)]
#[serde(default)]
pub struct ListQuery {
    #[serde(rename = "productId")]
    product_id: Option<String>,
    #[serde(rename = "warehouseId")]
    warehouse_id: Option<String>,
    page: Option<i64>,
    per_page: Option<i64>,
}

// GET /api/v1/inventory — stock levels with product/warehouse filters.
pub async fn list_inventory(
    State(state): State<AppState>,
    _user: AuthUser,
    Query(query): Query<ListQuery>,
) -> Response {
    let product_filter = match query.product_id.as_deref() {
        None | Some("") => None,
        Some(raw) => match Uuid::parse_str(raw) {
            Ok(id) => Some(id),
            Err(_) => {
                return respond(StatusCode::BAD_REQUEST, msg("Invalid product id"));
            }
        },
    };
    let warehouse_filter = match query.warehouse_id.as_deref() {
        None | Some("") => None,
        Some(raw) => match Uuid::parse_str(raw) {
            Ok(id) => Some(id),
            Err(_) => {
                return respond(StatusCode::BAD_REQUEST, msg("Invalid warehouse id"));
            }
        },
    };
    let per_page = query.per_page.unwrap_or(25).clamp(1, 100);
    let page = query.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;

    const FILTER: &str = "WHERE ($1::uuid IS NULL OR i.product_id = $1)
       AND ($2::uuid IS NULL OR w.id = $2)";

    let total: Result<i64, _> = sqlx::query_scalar(&format!(
        "SELECT COUNT(*) FROM inventory i
         JOIN warehouse_locations l ON l.id = i.warehouse_location_id
         JOIN warehouses w ON w.id = l.warehouse_id
         {FILTER}"
    ))
    .bind(product_filter)
    .bind(warehouse_filter)
    .fetch_one(&state.db)
    .await;
    let total = match total {
        Ok(total) => total,
        Err(err) => return respond_500("List Inventory Error", err, false),
    };

    let rows: Result<Vec<InventoryRow>, _> = sqlx::query_as(&format!(
        "{INVENTORY_SELECT} {FILTER} ORDER BY i.updated_at DESC, i.id LIMIT $3 OFFSET $4"
    ))
    .bind(product_filter)
    .bind(warehouse_filter)
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await;
    match rows {
        Ok(inventory) => {
            let page_count = (total + per_page - 1) / per_page;
            respond(
                StatusCode::OK,
                json!({
                    "inventory": inventory,
                    "total": total,
                    "page": page,
                    "pageCount": page_count,
                }),
            )
        }
        Err(err) => respond_500("List Inventory Error", err, false),
    }
}

// The audit-trail row with the actor's email resolved (LEFT JOIN users).
#[derive(sqlx::FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
struct LedgerRow {
    id: Uuid,
    product_id: Uuid,
    warehouse_location_id: Uuid,
    transaction_type: String,
    quantity: i32,
    quantity_before: i32,
    quantity_after: i32,
    notes: Option<String>,
    created_by: Option<i32>,
    created_at: DateTime<Utc>,
    created_by_email: Option<String>,
    warehouse_code: Option<String>,
    location_code: Option<String>,
}

// GET /api/v1/inventory/{product_id}/transactions — the audit trail, newest
// first, capped at 100 rows.
pub async fn list_transactions(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(product_id): Path<String>,
) -> Response {
    let Ok(product_id) = Uuid::parse_str(&product_id) else {
        return respond(StatusCode::BAD_REQUEST, msg("Invalid product id"));
    };
    let rows: Result<Vec<LedgerRow>, _> = sqlx::query_as(
        "SELECT t.id, t.product_id, t.warehouse_location_id,
                t.transaction_type::text AS transaction_type,
                t.quantity, t.quantity_before, t.quantity_after, t.notes,
                t.created_by, t.created_at,
                u.email AS created_by_email,
                w.code AS warehouse_code, l.code AS location_code
         FROM inventory_transactions t
         LEFT JOIN warehouse_locations l ON l.id = t.warehouse_location_id
         LEFT JOIN warehouses w ON w.id = l.warehouse_id
         LEFT JOIN users u ON u.id = t.created_by
         WHERE t.product_id = $1
         ORDER BY t.created_at DESC, t.id DESC
         LIMIT 100",
    )
    .bind(product_id)
    .fetch_all(&state.db)
    .await;
    match rows {
        Ok(transactions) => respond(StatusCode::OK, json!({ "transactions": transactions })),
        Err(err) => respond_500("List Transactions Error", err, false),
    }
}
