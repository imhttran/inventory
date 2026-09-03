// Step 5 — search: Elasticsearch indexing with a Postgres fallback.
//
// Pipeline: domain writes append rows to outbox_events in the SAME
// transaction (so an event is never lost when the row commits), this module's
// worker drains them into the index, and GET /api/v1/search queries
// Elasticsearch — falling back to Postgres ILIKE whenever the engine is
// unreachable. The raw REST client works against Elasticsearch and OpenSearch
// alike (the two forks share the wire API for everything used here).
//
// Brand/category renames don't emit outbox events — use the admin reindex
// endpoint after bulk metadata changes.

use std::sync::OnceLock;
use std::time::Duration;

use axum::extract::{Query as AxumQuery, State};
use axum::http::StatusCode;
use axum::response::Response;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use sqlx::types::Uuid;
use sqlx::PgPool;

use crate::api::{ensure_role, msg, respond, respond_500, AuthUser};
use crate::state::AppState;

const MAX_RETRIES: i32 = 10;
const POLL_INTERVAL: Duration = Duration::from_secs(2);

fn http() -> &'static reqwest::Client {
    static HTTP: OnceLock<reqwest::Client> = OnceLock::new();
    HTTP.get_or_init(|| {
        reqwest::Client::builder()
            .timeout(Duration::from_secs(5))
            .build()
            .expect("http client builds")
    })
}

fn es_configured(state: &AppState) -> bool {
    !state.cfg.elasticsearch_url.is_empty()
}

fn base_url(state: &AppState) -> String {
    state
        .cfg
        .elasticsearch_url
        .trim_end_matches('/')
        .to_string()
}

// The indexed document: everything the search UI shows, denormalized.
#[derive(Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct ProductDoc {
    pub id: Uuid,
    pub sku: String,
    pub part_number: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub brand: String,
    pub category: String,
    pub active: bool,
    pub updated_at: DateTime<Utc>,
}

const DOC_SELECT: &str = "SELECT p.id, p.sku, p.name, p.description, p.active, p.updated_at,
       b.name AS brand, c.name AS category,
       (SELECT pi.value FROM product_identifiers pi
        WHERE pi.product_id = p.id AND pi.identifier_type = 'MPN'
        LIMIT 1) AS part_number
FROM products p
LEFT JOIN brands b ON b.id = p.brand_id
LEFT JOIN categories c ON c.id = p.category_id";

async fn load_product_doc(db: &PgPool, id: Uuid) -> Result<Option<ProductDoc>, sqlx::Error> {
    sqlx::query_as(&format!("{DOC_SELECT} WHERE p.id = $1"))
        .bind(id)
        .fetch_optional(db)
        .await
}

// ---- index management ----

async fn ensure_index(state: &AppState) -> Result<bool, String> {
    let url = format!("{}/{}", base_url(state), state.cfg.search_index);
    let response = http()
        .head(&url)
        .send()
        .await
        .map_err(|err| format!("request failed: {err}"))?;
    if response.status().as_u16() == 200 {
        return Ok(false);
    }
    let response = http()
        .put(&url)
        .json(&json!({
            "mappings": {
                "properties": {
                    "sku": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "partNumber": {"type": "text"},
                    "name": {"type": "text"},
                    "description": {"type": "text"},
                    "brand": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "category": {"type": "text", "fields": {"keyword": {"type": "keyword"}}},
                    "active": {"type": "boolean"},
                    "updatedAt": {"type": "date"}
                }
            }
        }))
        .send()
        .await
        .map_err(|err| format!("request failed: {err}"))?;
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("index create failed: {status} {body}"));
    }
    Ok(true)
}

async fn index_product(state: &AppState, doc: &ProductDoc) -> Result<(), String> {
    let url = format!(
        "{}/{}/_doc/{}",
        base_url(state),
        state.cfg.search_index,
        doc.id
    );
    let response = http()
        .put(&url)
        .json(doc)
        .send()
        .await
        .map_err(|err| format!("request failed: {err}"))?;
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("index put failed: {status} {body}"));
    }
    Ok(())
}

async fn remove_product(state: &AppState, id: Option<Uuid>) -> Result<(), String> {
    let Some(id) = id else {
        return Ok(());
    };
    let url = format!("{}/{}/_doc/{}", base_url(state), state.cfg.search_index, id);
    let response = http()
        .delete(&url)
        .send()
        .await
        .map_err(|err| format!("request failed: {err}"))?;
    // 404 = already gone, which is fine.
    if response.status().is_success() || response.status().as_u16() == 404 {
        Ok(())
    } else {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        Err(format!("index delete failed: {status} {body}"))
    }
}

// Bulk (re)index every active product from Postgres — used at boot on a fresh
// index and by the admin reindex endpoint.
pub async fn reindex_all(state: &AppState) -> Result<usize, String> {
    let docs: Vec<ProductDoc> = sqlx::query_as(&format!("{DOC_SELECT} WHERE p.active = true"))
        .fetch_all(&state.db)
        .await
        .map_err(|err| err.to_string())?;
    if docs.is_empty() {
        return Ok(0);
    }
    let mut ndjson = String::new();
    for doc in &docs {
        ndjson.push_str(&format!(
            "{{\"index\": {{\"_id\": \"{}\"}}}}\n{}\n",
            doc.id,
            serde_json::to_string(doc).map_err(|err| err.to_string())?
        ));
    }
    let url = format!("{}/{}/_bulk", base_url(state), state.cfg.search_index);
    let response = http()
        .post(&url)
        .header("Content-Type", "application/x-ndjson")
        .body(ndjson)
        .send()
        .await
        .map_err(|err| format!("request failed: {err}"))?;
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("bulk failed: {status} {body}"));
    }
    let body: Value = response.json().await.map_err(|err| err.to_string())?;
    if body["errors"].as_bool().unwrap_or(true) {
        return Err("bulk reported item errors".to_string());
    }
    Ok(docs.len())
}

// ---- search ----

#[derive(Serialize, sqlx::FromRow)]
#[serde(rename_all = "camelCase")]
pub struct SearchHit {
    pub id: Uuid,
    pub sku: String,
    pub part_number: Option<String>,
    pub name: String,
    pub brand: String,
    pub category: String,
    pub score: f64,
}

// Ok(Some(hits)) = engine answered; Ok(None) = engine not configured (caller
// falls back); Err = engine configured but unreachable/broken (logged, then
// fallback).
async fn search_elasticsearch(
    state: &AppState,
    query: &str,
) -> Result<Option<Vec<SearchHit>>, String> {
    if !es_configured(state) {
        return Ok(None);
    }
    let url = format!("{}/{}/_search", base_url(state), state.cfg.search_index);
    let response = http()
        .post(&url)
        .json(&json!({
            "size": 20,
            "query": {
                "bool": {
                    "must": [{
                        "multi_match": {
                            "query": query,
                            "fields": ["name^3", "sku^2", "partNumber^2", "brand", "category"],
                            "fuzziness": "AUTO"
                        }
                    }],
                    "filter": [{"term": {"active": true}}]
                }
            }
        }))
        .send()
        .await
        .map_err(|err| format!("request failed: {err}"))?;
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("search failed: {status} {body}"));
    }
    let body: Value = response.json().await.map_err(|err| err.to_string())?;
    let hits = body["hits"]["hits"].as_array().cloned().unwrap_or_default();
    let parsed = hits
        .iter()
        .filter_map(|hit| {
            let source = &hit["_source"];
            Some(SearchHit {
                id: Uuid::parse_str(source["id"].as_str()?).ok()?,
                sku: source["sku"].as_str()?.to_string(),
                part_number: source["partNumber"].as_str().map(str::to_string),
                name: source["name"].as_str()?.to_string(),
                brand: source["brand"].as_str().unwrap_or_default().to_string(),
                category: source["category"].as_str().unwrap_or_default().to_string(),
                score: hit["_score"].as_f64().unwrap_or(0.0),
            })
        })
        .collect();
    Ok(Some(parsed))
}

// Postgres fallback: ILIKE over name/sku/MPN/brand — same shape as the
// Elasticsearch hits so the frontend doesn't care which served the query.
async fn search_postgres(state: &AppState, query: &str) -> Result<Vec<SearchHit>, sqlx::Error> {
    let pattern = format!("%{query}%");
    let rows: Vec<SearchHit> = sqlx::query_as(
        "SELECT p.id, p.sku, p.name, b.name AS brand, c.name AS category,
                (SELECT pi.value FROM product_identifiers pi
                 WHERE pi.product_id = p.id AND pi.identifier_type = 'MPN'
                 LIMIT 1) AS part_number,
                0.0::float8 AS score
         FROM products p
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN categories c ON c.id = p.category_id
         WHERE p.active = true
           AND (p.name ILIKE $1 OR p.sku ILIKE $1
                OR EXISTS (SELECT 1 FROM product_identifiers pi
                           WHERE pi.product_id = p.id
                             AND pi.identifier_type = 'MPN'
                             AND pi.normalized_value ILIKE $1)
                OR b.name ILIKE $1 OR c.name ILIKE $1)
         ORDER BY p.name
         LIMIT 20",
    )
    .bind(pattern)
    .fetch_all(&state.db)
    .await?;
    Ok(rows)
}

#[derive(Deserialize, Default)]
#[serde(default)]
pub struct SearchQuery {
    q: Option<String>,
}

// GET /api/v1/search — Elasticsearch first, Postgres ILIKE whenever the engine
// is unreachable or not configured. `source` tells the UI which served.
pub async fn search(
    State(state): State<AppState>,
    _user: AuthUser,
    AxumQuery(query): AxumQuery<SearchQuery>,
) -> Response {
    let query = query.q.unwrap_or_default().trim().to_string();
    if query.is_empty() {
        return respond(StatusCode::OK, json!({ "products": [], "source": "none" }));
    }
    match search_elasticsearch(&state, &query).await {
        Ok(Some(hits)) => {
            return respond(
                StatusCode::OK,
                json!({ "products": hits, "source": "elasticsearch" }),
            )
        }
        Ok(None) => {}
        Err(err) => eprintln!("[search] elasticsearch unavailable, using postgres: {err}"),
    }
    match search_postgres(&state, &query).await {
        Ok(hits) => respond(
            StatusCode::OK,
            json!({ "products": hits, "source": "postgres" }),
        ),
        Err(err) => respond_500("Search Error", err, false),
    }
}

// POST /api/v1/search/reindex — rebuild the index from Postgres (admin).
pub async fn reindex(State(state): State<AppState>, user: AuthUser) -> Response {
    if let Err(rejection) = ensure_role(&user, "admin") {
        return rejection;
    }
    if !es_configured(&state) {
        return respond(
            StatusCode::BAD_REQUEST,
            msg("Elasticsearch is not configured"),
        );
    }
    if let Err(err) = ensure_index(&state).await {
        eprintln!("[search] reindex: {err}");
        return respond(
            StatusCode::SERVICE_UNAVAILABLE,
            msg("Elasticsearch is unreachable"),
        );
    }
    match reindex_all(&state).await {
        Ok(count) => respond(
            StatusCode::OK,
            json!({
                "success": true,
                "message": format!("Indexed {count} products"),
                "indexed": count,
            }),
        ),
        Err(err) => {
            eprintln!("[search] reindex failed: {err}");
            respond(
                StatusCode::SERVICE_UNAVAILABLE,
                msg("Elasticsearch reindex failed"),
            )
        }
    }
}

// ---- outbox worker ----

// Enqueue helper for domain writes — call inside the same transaction as the
// write so the event can never be lost. The worker re-reads state from
// Postgres, so the payload only carries the id.
pub async fn enqueue(
    tx: &mut sqlx::PgConnection,
    event_type: &str,
    aggregate_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO outbox_events (aggregate_type, aggregate_id, event_type, payload)
         VALUES ('product', $1, $2, $3)",
    )
    .bind(aggregate_id)
    .bind(event_type)
    .bind(json!({ "id": aggregate_id }))
    .execute(&mut *tx)
    .await
    .map(|_| ())
}

// One poll cycle: fetch unprocessed events, act on each (no held transaction —
// ES calls can be slow), then mark outcomes. Indexing is idempotent
// (PUT _doc/{id}), so a crash between write and event is healed by re-runs.
async fn process_batch(state: &AppState) -> usize {
    let rows: Vec<(Uuid, String, Value)> = match sqlx::query_as(
        "SELECT id, event_type, payload FROM outbox_events
         WHERE processed_at IS NULL AND retry_count < $1
         ORDER BY created_at
         LIMIT 50",
    )
    .bind(MAX_RETRIES)
    .fetch_all(&state.db)
    .await
    {
        Ok(rows) => rows,
        Err(err) => {
            eprintln!("[search] outbox fetch error: {err}");
            return 0;
        }
    };
    let mut processed = 0;
    for (event_id, event_type, payload) in rows {
        let aggregate_id = payload["id"].as_str().and_then(|s| Uuid::parse_str(s).ok());
        let outcome = match event_type.as_str() {
            "product.created" | "product.updated" => {
                match load_product_doc(&state.db, aggregate_id.unwrap_or_default()).await {
                    Ok(Some(doc)) => index_product(state, &doc).await,
                    // Deleted before the worker caught up — clear any stale doc.
                    Ok(None) => remove_product(state, aggregate_id).await,
                    Err(err) => Err(err.to_string()),
                }
            }
            "product.deleted" => remove_product(state, aggregate_id).await,
            // Unknown event types are marked processed, not retried forever.
            _ => Ok(()),
        };
        let update = match outcome {
            Ok(()) => {
                processed += 1;
                sqlx::query(
                    "UPDATE outbox_events SET processed_at = now(), last_error = NULL
                     WHERE id = $1",
                )
                .bind(event_id)
                .execute(&state.db)
                .await
            }
            Err(err) => {
                // Dead-letter after MAX_RETRIES attempts.
                sqlx::query(
                    "UPDATE outbox_events SET retry_count = retry_count + 1,
                            last_error = $2,
                            processed_at = CASE WHEN retry_count + 1 >= $3 THEN now() ELSE processed_at END
                     WHERE id = $1",
                )
                .bind(event_id)
                .bind(&err)
                .bind(MAX_RETRIES)
                .execute(&state.db)
                .await
            }
        };
        if let Err(err) = update {
            eprintln!("[search] outbox status update error: {err}");
        }
    }
    processed
}

// Background task: set up the index (auto-reindexing a freshly created one),
// then drain the outbox forever. Every failure is logged, never fatal — the
// API keeps serving with the Postgres fallback.
pub async fn run_worker(state: AppState) {
    match ensure_index(&state).await {
        Ok(true) => {
            println!("[search] created index {}", state.cfg.search_index);
            match reindex_all(&state).await {
                Ok(count) => println!("[search] boot reindex: {count} products indexed"),
                Err(err) => eprintln!("[search] boot reindex failed: {err}"),
            }
        }
        Ok(false) => println!("[search] index {} already exists", state.cfg.search_index),
        Err(err) => eprintln!("[search] index setup failed (will keep retrying events): {err}"),
    }
    println!("[search] worker polling outbox every 2s");
    loop {
        let processed = process_batch(&state).await;
        if processed > 0 {
            println!("[search] processed {processed} events");
        }
        tokio::time::sleep(POLL_INTERVAL).await;
    }
}
