// Step 2 — categories: catalog lookup tables under /api/v1/categories. Reads
// need any signed-in user; writes are staff-only. Categories are hierarchical
// (parent_id); name uniqueness is scoped to the parent, with a partial index
// enforcing it at the root level.

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

#[derive(Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct CategoryBody {
    name: String,
    parent_id: Option<Uuid>,
}

#[derive(sqlx::FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: Uuid,
    pub parent_id: Option<Uuid>,
    pub name: String,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

pub async fn list_categories(State(state): State<AppState>, _user: AuthUser) -> Response {
    let rows: Result<Vec<Category>, _> = sqlx::query_as(
        "SELECT id, parent_id, name, active, created_at, updated_at
         FROM categories ORDER BY name ASC",
    )
    .fetch_all(&state.db)
    .await;
    match rows {
        Ok(categories) => respond(StatusCode::OK, json!({ "categories": categories })),
        Err(err) => respond_500("List Categories Error", err, false),
    }
}

pub async fn create_category(
    State(state): State<AppState>,
    user: AuthUser,
    body: Bytes,
) -> Response {
    if let Err(rejection) = ensure_role(&user, "staff") {
        return rejection;
    }
    let body: CategoryBody = decode(&body);
    let name = body.name.trim();
    if name.is_empty() {
        return respond(StatusCode::BAD_REQUEST, msg("Category name is required"));
    }
    if let Some(parent_id) = body.parent_id {
        let exists: bool =
            match sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM categories WHERE id = $1)")
                .bind(parent_id)
                .fetch_one(&state.db)
                .await
            {
                Ok(exists) => exists,
                Err(err) => return respond_500("Create Category Error", err, false),
            };
        if !exists {
            return respond(StatusCode::BAD_REQUEST, msg("Parent category not found"));
        }
    }
    let row: Result<Category, _> = sqlx::query_as(
        "INSERT INTO categories (name, normalized_name, parent_id)
         VALUES ($1, lower($1), $2)
         RETURNING id, parent_id, name, active, created_at, updated_at",
    )
    .bind(name)
    .bind(body.parent_id)
    .fetch_one(&state.db)
    .await;
    match row {
        Ok(category) => respond(
            StatusCode::CREATED,
            json!({
                "success": true,
                "message": "Category created",
                "category": category,
            }),
        ),
        Err(err) => {
            if is_unique_violation(&err) {
                return respond(StatusCode::BAD_REQUEST, fail("Category already exists"));
            }
            respond_500("Create Category Error", err, true)
        }
    }
}
