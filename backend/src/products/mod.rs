// Step 2 — products: catalog CRUD under /api/v1/products. Reads need any
// signed-in user; create/update are staff-only, delete admin-only (same split
// as user management).
//
// Per the catalog schema: SKU is the only identifier on the row itself; the
// manufacturer part number lives in product_identifiers as an MPN row. Stock
// quantities arrive with the inventory step.

use axum::body::Bytes;
use axum::extract::{Path, Query, State};
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

// The joined wire shape: catalog fields plus resolved brand/category names and
// the MPN identifier.
#[derive(sqlx::FromRow, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Product {
    pub id: Uuid,
    pub sku: String,
    pub part_number: Option<String>,
    pub name: String,
    pub description: Option<String>,
    pub brand_id: Uuid,
    pub brand: String,
    pub category_id: Uuid,
    pub category: String,
    pub active: bool,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

// Decoded loosely like the auth bodies: decode() falls back to Default on a
// broken body, and route-level validation produces the 400s.
#[derive(Deserialize, Default)]
#[serde(default, rename_all = "camelCase")]
struct ProductBody {
    sku: Option<String>,
    part_number: Option<String>,
    name: Option<String>,
    description: Option<String>,
    brand_id: Option<Uuid>,
    category_id: Option<Uuid>,
}

const PRODUCT_SELECT: &str = "SELECT p.id, p.sku, p.name, p.description,
       p.brand_id, b.name AS brand, p.category_id, c.name AS category, p.active,
       p.created_at, p.updated_at,
       (SELECT pi.value FROM product_identifiers pi
        WHERE pi.product_id = p.id AND pi.identifier_type = 'MPN'
        LIMIT 1) AS part_number
FROM products p
LEFT JOIN brands b ON b.id = p.brand_id
LEFT JOIN categories c ON c.id = p.category_id";

async fn load_product(state: &AppState, id: Uuid) -> Result<Option<Product>, sqlx::Error> {
    sqlx::query_as(&format!("{PRODUCT_SELECT} WHERE p.id = $1"))
        .bind(id)
        .fetch_optional(&state.db)
        .await
}

// Shared by create/update: normalize + validate the body, then verify the
// required FKs exist (400s instead of raw FK-violation 500s).
struct ValidatedProduct {
    sku: String,
    part_number: String,
    name: String,
    description: Option<String>,
    brand_id: Uuid,
    category_id: Uuid,
}

async fn validate(state: &AppState, body: ProductBody) -> Result<ValidatedProduct, Response> {
    let sku = body.sku.unwrap_or_default().trim().to_string();
    let name = body.name.unwrap_or_default().trim().to_string();
    if sku.is_empty() {
        return Err(respond(StatusCode::BAD_REQUEST, msg("SKU is required")));
    }
    if name.is_empty() {
        return Err(respond(StatusCode::BAD_REQUEST, msg("Name is required")));
    }
    let Some(brand_id) = body.brand_id else {
        return Err(respond(StatusCode::BAD_REQUEST, msg("Brand is required")));
    };
    let Some(category_id) = body.category_id else {
        return Err(respond(
            StatusCode::BAD_REQUEST,
            msg("Category is required"),
        ));
    };
    for (table, id, label) in [
        ("brands", brand_id, "Brand"),
        ("categories", category_id, "Category"),
    ] {
        let exists: bool = sqlx::query_scalar(&format!(
            "SELECT EXISTS (SELECT 1 FROM {table} WHERE id = $1)"
        ))
        .bind(id)
        .fetch_one(&state.db)
        .await
        .map_err(|err| respond_500("Product FK Check Error", err, false))?;
        if !exists {
            return Err(respond(
                StatusCode::BAD_REQUEST,
                msg(&format!("{label} not found")),
            ));
        }
    }
    let description = body.description.unwrap_or_default().trim().to_string();
    Ok(ValidatedProduct {
        sku,
        part_number: body.part_number.unwrap_or_default().trim().to_string(),
        name,
        description: if description.is_empty() {
            None
        } else {
            Some(description)
        },
        brand_id,
        category_id,
    })
}

// Upserts (or clears) the product's MPN identifier inside the caller's
// transaction. normalized_value keeps matching case-insensitive across
// UPC/EAN/GTIN later too.
async fn write_mpn(
    tx: &mut sqlx::PgConnection,
    product_id: Uuid,
    part_number: &str,
) -> Result<(), Response> {
    let deleted = sqlx::query(
        "DELETE FROM product_identifiers
         WHERE product_id = $1 AND identifier_type = 'MPN'",
    )
    .bind(product_id)
    .execute(&mut *tx)
    .await;
    if let Err(err) = deleted {
        return Err(respond_500("Product MPN Error", err, false));
    }
    if part_number.is_empty() {
        return Ok(());
    }
    match sqlx::query(
        "INSERT INTO product_identifiers (product_id, identifier_type, value, normalized_value)
         VALUES ($1, 'MPN', $2, $3)",
    )
    .bind(product_id)
    .bind(part_number)
    .bind(part_number.to_lowercase())
    .execute(&mut *tx)
    .await
    {
        Ok(_) => Ok(()),
        Err(err) if is_unique_violation(&err) => Err(respond(
            StatusCode::BAD_REQUEST,
            fail("Part number is already in use by another product"),
        )),
        Err(err) => Err(respond_500("Product MPN Error", err, true)),
    }
}

pub async fn create_product(
    State(state): State<AppState>,
    user: AuthUser,
    body: Bytes,
) -> Response {
    if let Err(rejection) = ensure_role(&user, "staff") {
        return rejection;
    }
    let body: ProductBody = decode(&body);
    let product = match validate(&state, body).await {
        Ok(product) => product,
        Err(response) => return response,
    };
    // One transaction: a failed MPN upsert (duplicate part number) rolls the
    // product row back too — no orphan catalog entries.
    let mut tx = match state.db.begin().await {
        Ok(tx) => tx,
        Err(err) => return respond_500("Create Product Error", err, false),
    };
    let inserted = sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO products (sku, name, description, brand_id, category_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id",
    )
    .bind(&product.sku)
    .bind(&product.name)
    .bind(&product.description)
    .bind(product.brand_id)
    .bind(product.category_id)
    .fetch_one(&mut *tx)
    .await;
    let id = match inserted {
        Ok(id) => id,
        Err(err) => {
            if is_unique_violation(&err) {
                return respond(StatusCode::BAD_REQUEST, fail("SKU already exists"));
            }
            return respond_500("Create Product Error", err, true);
        }
    };
    if let Err(response) = write_mpn(&mut tx, id, &product.part_number).await {
        return response;
    }
    // Outbox event in the same transaction — the search worker picks it up.
    if let Err(err) = crate::search::enqueue(&mut tx, "product.created", id).await {
        return respond_500("Create Product Error", err, true);
    }
    if let Err(err) = tx.commit().await {
        return respond_500("Create Product Error", err, false);
    }
    match load_product(&state, id).await {
        Ok(Some(product)) => respond(
            StatusCode::CREATED,
            json!({
                "success": true,
                "message": "Product created",
                "product": product,
            }),
        ),
        Ok(None) => respond_500("Create Product Error", "inserted row disappeared", true),
        Err(err) => respond_500("Create Product Error", err, false),
    }
}

pub async fn get_product(
    State(state): State<AppState>,
    _user: AuthUser,
    Path(id): Path<String>,
) -> Response {
    let Ok(id) = Uuid::parse_str(&id) else {
        return respond(StatusCode::BAD_REQUEST, msg("Invalid product id"));
    };
    match load_product(&state, id).await {
        Ok(Some(product)) => respond(StatusCode::OK, json!({ "product": product })),
        Ok(None) => respond(StatusCode::NOT_FOUND, msg("Product not found")),
        Err(err) => respond_500("Get Product Error", err, false),
    }
}

#[derive(Deserialize, Default)]
#[serde(default)]
pub struct ListQuery {
    q: Option<String>,
    brand: Option<String>,
    category: Option<String>,
    page: Option<i64>,
    per_page: Option<i64>,
}

// Empty-string defaults make every filter clause a no-op when unset — one
// static SQL shape for all combinations (no string-built WHERE branches).
// Bind order matters: $1 brand, $2 category, $3 text, $4 limit, $5 offset.
pub async fn list_products(
    State(state): State<AppState>,
    _user: AuthUser,
    Query(query): Query<ListQuery>,
) -> Response {
    let q = query.q.unwrap_or_default().trim().to_string();
    let brand = query.brand.unwrap_or_default().trim().to_string();
    let category = query.category.unwrap_or_default().trim().to_string();
    let per_page = query.per_page.unwrap_or(25).clamp(1, 100);
    let page = query.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;

    const FILTER: &str = "WHERE ($1 = '' OR b.name = $1)
       AND ($2 = '' OR c.name = $2)
       AND ($3 = '' OR p.name ILIKE '%' || $3 || '%'
                  OR p.sku ILIKE '%' || $3 || '%'
                  OR EXISTS (SELECT 1 FROM product_identifiers pi
                             WHERE pi.product_id = p.id
                               AND pi.identifier_type = 'MPN'
                               AND pi.normalized_value ILIKE '%' || $3 || '%'))";

    let total: Result<i64, _> = sqlx::query_scalar(&format!(
        "SELECT COUNT(*) FROM products p
         LEFT JOIN brands b ON b.id = p.brand_id
         LEFT JOIN categories c ON c.id = p.category_id
         {FILTER}"
    ))
    .bind(&brand)
    .bind(&category)
    .bind(&q)
    .fetch_one(&state.db)
    .await;
    let total = match total {
        Ok(total) => total,
        Err(err) => return respond_500("List Products Error", err, false),
    };

    let rows: Result<Vec<Product>, _> = sqlx::query_as(&format!(
        "{PRODUCT_SELECT} {FILTER} ORDER BY p.created_at DESC, p.id LIMIT $4 OFFSET $5"
    ))
    .bind(&brand)
    .bind(&category)
    .bind(&q)
    .bind(per_page)
    .bind(offset)
    .fetch_all(&state.db)
    .await;
    match rows {
        Ok(products) => {
            let page_count = (total + per_page - 1) / per_page;
            respond(
                StatusCode::OK,
                json!({
                    "products": products,
                    "total": total,
                    "page": page,
                    "pageCount": page_count,
                }),
            )
        }
        Err(err) => respond_500("List Products Error", err, false),
    }
}

pub async fn update_product(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<String>,
    body: Bytes,
) -> Response {
    if let Err(rejection) = ensure_role(&user, "staff") {
        return rejection;
    }
    let Ok(id) = Uuid::parse_str(&id) else {
        return respond(StatusCode::BAD_REQUEST, msg("Invalid product id"));
    };
    let body: ProductBody = decode(&body);
    let product = match validate(&state, body).await {
        Ok(product) => product,
        Err(response) => return response,
    };
    // Same transaction rule as create: the MPN swap fails or the whole
    // update does.
    let mut tx = match state.db.begin().await {
        Ok(tx) => tx,
        Err(err) => return respond_500("Update Product Error", err, false),
    };
    let updated = sqlx::query_scalar::<_, Uuid>(
        "UPDATE products SET sku = $1, name = $2, description = $3,
                brand_id = $4, category_id = $5, updated_at = now()
         WHERE id = $6
         RETURNING id",
    )
    .bind(&product.sku)
    .bind(&product.name)
    .bind(&product.description)
    .bind(product.brand_id)
    .bind(product.category_id)
    .bind(id)
    .fetch_optional(&mut *tx)
    .await;
    match updated {
        Ok(Some(_)) => {}
        Ok(None) => return respond(StatusCode::NOT_FOUND, msg("Product not found")),
        Err(err) => {
            if is_unique_violation(&err) {
                return respond(StatusCode::BAD_REQUEST, fail("SKU already exists"));
            }
            return respond_500("Update Product Error", err, true);
        }
    }
    if let Err(response) = write_mpn(&mut tx, id, &product.part_number).await {
        return response;
    }
    if let Err(err) = crate::search::enqueue(&mut tx, "product.updated", id).await {
        return respond_500("Update Product Error", err, true);
    }
    match tx.commit().await {
        Ok(_) => (),
        Err(err) => return respond_500("Update Product Error", err, false),
    };
    match load_product(&state, id).await {
        Ok(Some(product)) => respond(
            StatusCode::OK,
            json!({
                "success": true,
                "message": "Product updated",
                "product": product,
            }),
        ),
        Ok(None) => respond(StatusCode::NOT_FOUND, msg("Product not found")),
        Err(err) => respond_500("Update Product Error", err, false),
    }
}

pub async fn delete_product(
    State(state): State<AppState>,
    user: AuthUser,
    Path(id): Path<String>,
) -> Response {
    if let Err(rejection) = ensure_role(&user, "admin") {
        return rejection;
    }
    let Ok(id) = Uuid::parse_str(&id) else {
        return respond(StatusCode::BAD_REQUEST, msg("Invalid product id"));
    };
    // Delete + outbox event in one transaction: a product must not disappear
    // from Postgres while staying searchable.
    let mut tx = match state.db.begin().await {
        Ok(tx) => tx,
        Err(err) => return respond_500("Delete Product Error", err, false),
    };
    let tag = sqlx::query("DELETE FROM products WHERE id = $1")
        .bind(id)
        .execute(&mut *tx)
        .await;
    let deleted = match tag {
        Err(err) => return respond_500("Delete Product Error", err, false),
        Ok(result) => result,
    };
    if deleted.rows_affected() > 0 {
        if let Err(err) = crate::search::enqueue(&mut tx, "product.deleted", id).await {
            return respond_500("Delete Product Error", err, true);
        }
    }
    if let Err(err) = tx.commit().await {
        return respond_500("Delete Product Error", err, false);
    }
    if deleted.rows_affected() == 0 {
        return respond(StatusCode::NOT_FOUND, msg("Product not found"));
    }
    respond(
        StatusCode::OK,
        json!({ "success": true, "message": "Product deleted" }),
    )
}
