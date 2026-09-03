// GET /api/health — liveness/readiness for the stack. The route answering at
// all proves the API is up; a bounded SELECT 1 proves PostgreSQL answers.
// Unauthenticated on purpose: the dashboard status card and any load balancer
// probe call it before a session exists.

use std::time::Duration;

use axum::extract::State;
use axum::http::StatusCode;
use axum::response::Response;
use serde_json::json;

use crate::api::respond;
use crate::state::AppState;

// A hung pool is as unhealthy as a dead one — bound the probe.
const DB_TIMEOUT: Duration = Duration::from_secs(2);

pub async fn health(State(state): State<AppState>) -> Response {
    let db_ok = tokio::time::timeout(
        DB_TIMEOUT,
        sqlx::query_scalar::<_, i32>("SELECT 1").fetch_one(&state.db),
    )
    .await
    .map(|result| result.is_ok())
    .unwrap_or(false);

    if db_ok {
        respond(
            StatusCode::OK,
            json!({
                "status": "ok",
                "service": "rust-api",
                "database": "ok",
            }),
        )
    } else {
        respond(
            StatusCode::SERVICE_UNAVAILABLE,
            json!({
                "status": "degraded",
                "service": "rust-api",
                "database": "error",
            }),
        )
    }
}
