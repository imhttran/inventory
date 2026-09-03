// Warehouses and their bin locations — the addressable storage units behind
// stock levels. Reads need any signed-in user; writes are staff-only.
// Locations are nested under their warehouse (/api/v1/warehouses/{id}/...).

use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::Response;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::types::Uuid;

use crate::api::{
    decode, ensure_role, fail, is_unique_violation, msg, respond, respond_500, AuthUser,
};
use crate::state::AppState;

#[derive(sqlx::FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Warehouse {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Deserialize, Default)]
#[serde(default)]
struct WarehouseBody {
    code: String,
    name: String,
}

pub async fn list_warehouses(State(state): State<AppState>, _user: AuthUser) -> Response {
    let rows: Result<Vec<Warehouse>, _> = sqlx::query_as(
        "SELECT id, code, name, active, created_at, updated_at
         FROM warehouses ORDER BY code ASC",
    )
    .fetch_all(&state.db)
    .await;
    match rows {
        Ok(warehouses) => respond(StatusCode::OK, json!({ "warehouses": warehouses })),
        Err(err) => respond_500("List Warehouses Error", err, false),
    }
}

pub async fn create_warehouse(
    State(state): State<AppState>,
    user: AuthUser,
    body: Bytes,
) -> Response {
    if let Err(rejection) = ensure_role(&user, "staff") {
        return rejection;
    }
    let body: WarehouseBody = decode(&body);
    let code = body.code.trim();
    let name = body.name.trim();
    if code.is_empty() {
        return respond(StatusCode::BAD_REQUEST, msg("Warehouse code is required"));
    }
    if name.is_empty() {
        return respond(StatusCode::BAD_REQUEST, msg("Warehouse name is required"));
    }
    let row: Result<Warehouse, _> = sqlx::query_as(
        "INSERT INTO warehouses (code, name) VALUES ($1, $2)
         RETURNING id, code, name, active, created_at, updated_at",
    )
    .bind(code)
    .bind(name)
    .fetch_one(&state.db)
    .await;
    match row {
        Ok(warehouse) => respond(
            StatusCode::CREATED,
            json!({
                "success": true,
                "message": "Warehouse created",
                "warehouse": warehouse,
            }),
        ),
        Err(err) => {
            if is_unique_violation(&err) {
                return respond(
                    StatusCode::BAD_REQUEST,
                    fail("Warehouse code already exists"),
                );
            }
            respond_500("Create Warehouse Error", err, true)
        }
    }
}

#[derive(sqlx::FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WarehouseLocation {
    pub id: Uuid,
    pub warehouse_id: Uuid,
    pub code: String,
    pub description: Option<String>,
    pub active: bool,
    pub created_at: DateTime<Utc>,
}

#[derive(Deserialize, Default)]
#[serde(default)]
struct LocationBody {
    code: String,
    description: Option<String>,
}

// Nested resource: a bad parent id is a 404, matching REST semantics (the
// collection doesn't exist under a missing warehouse).
async fn warehouse_exists(state: &AppState, id: Uuid) -> Result<bool, Response> {
    sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM warehouses WHERE id = $1)")
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|err| respond_500("Warehouse Lookup Error", err, false))
}

pub async fn list_locations(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(warehouse_id): Path<String>,
) -> Response {
    let Ok(warehouse_id) = Uuid::parse_str(&warehouse_id) else {
        return respond(StatusCode::BAD_REQUEST, msg("Invalid warehouse id"));
    };
    match warehouse_exists(&state, warehouse_id).await {
        Ok(true) => {}
        Ok(false) => return respond(StatusCode::NOT_FOUND, msg("Warehouse not found")),
        Err(response) => return response,
    }
    let rows: Result<Vec<WarehouseLocation>, _> = sqlx::query_as(
        "SELECT id, warehouse_id, code, description, active, created_at
         FROM warehouse_locations WHERE warehouse_id = $1 ORDER BY code ASC",
    )
    .bind(warehouse_id)
    .fetch_all(&state.db)
    .await;
    match rows {
        Ok(locations) => respond(StatusCode::OK, json!({ "locations": locations })),
        Err(err) => respond_500("List Locations Error", err, false),
    }
}

pub async fn create_location(
    State(state): State<AppState>,
    user: AuthUser,
    Path(warehouse_id): Path<String>,
    body: Bytes,
) -> Response {
    if let Err(rejection) = ensure_role(&user, "staff") {
        return rejection;
    }
    let Ok(warehouse_id) = Uuid::parse_str(&warehouse_id) else {
        return respond(StatusCode::BAD_REQUEST, msg("Invalid warehouse id"));
    };
    match warehouse_exists(&state, warehouse_id).await {
        Ok(true) => {}
        Ok(false) => return respond(StatusCode::NOT_FOUND, msg("Warehouse not found")),
        Err(response) => return response,
    }
    let body: LocationBody = decode(&body);
    let code = body.code.trim();
    if code.is_empty() {
        return respond(StatusCode::BAD_REQUEST, msg("Location code is required"));
    }
    let description = body
        .description
        .as_deref()
        .map(str::trim)
        .filter(|d| !d.is_empty());
    let row: Result<WarehouseLocation, _> = sqlx::query_as(
        "INSERT INTO warehouse_locations (warehouse_id, code, description)
         VALUES ($1, $2, $3)
         RETURNING id, warehouse_id, code, description, active, created_at",
    )
    .bind(warehouse_id)
    .bind(code)
    .bind(description)
    .fetch_one(&state.db)
    .await;
    match row {
        Ok(location) => respond(
            StatusCode::CREATED,
            json!({
                "success": true,
                "message": "Location created",
                "location": location,
            }),
        ),
        Err(err) => {
            if is_unique_violation(&err) {
                return respond(
                    StatusCode::BAD_REQUEST,
                    fail("Location code already exists in this warehouse"),
                );
            }
            respond_500("Create Location Error", err, true)
        }
    }
}
