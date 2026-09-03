// Step 2 — brands: catalog lookup tables under /api/v1/brands. Reads need any
// signed-in user; writes are staff-only (same split as user management).
// Identity is UUID; normalized_name is the case-insensitive uniqueness key.

use axum::body::Bytes;
use axum::extract::State;
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
pub struct Brand {
    pub id: Uuid,
    pub name: String,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Deserialize, Default)]
#[serde(default)]
struct BrandBody {
    name: String,
}

pub async fn list_brands(State(state): State<AppState>, _user: AuthUser) -> Response {
    let rows: Result<Vec<Brand>, _> = sqlx::query_as(
        "SELECT id, name, active, created_at, updated_at FROM brands ORDER BY name ASC",
    )
    .fetch_all(&state.db)
    .await;
    match rows {
        Ok(brands) => respond(StatusCode::OK, json!({ "brands": brands })),
        Err(err) => respond_500("List Brands Error", err, false),
    }
}

pub async fn create_brand(State(state): State<AppState>, user: AuthUser, body: Bytes) -> Response {
    if let Err(rejection) = ensure_role(&user, "staff") {
        return rejection;
    }
    let body: BrandBody = decode(&body);
    let name = body.name.trim();
    if name.is_empty() {
        return respond(StatusCode::BAD_REQUEST, msg("Brand name is required"));
    }
    let row: Result<Brand, _> = sqlx::query_as(
        "INSERT INTO brands (name, normalized_name) VALUES ($1, lower($1))
         RETURNING id, name, active, created_at, updated_at",
    )
    .bind(name)
    .fetch_one(&state.db)
    .await;
    match row {
        Ok(brand) => respond(
            StatusCode::CREATED,
            json!({
                "success": true,
                "message": "Brand created",
                "brand": brand,
            }),
        ),
        Err(err) => {
            if is_unique_violation(&err) {
                return respond(StatusCode::BAD_REQUEST, fail("Brand already exists"));
            }
            respond_500("Create Brand Error", err, true)
        }
    }
}
