// Database bootstrap: the connection pool and the ordered migration runner.

use sqlx::PgPool;

use crate::fatal;

// One consolidated schema migration; recorded in schema_migrations.
pub const MIGRATIONS: &[(i32, &str, &str)] = &[(
    1,
    "001_init.sql",
    include_str!("../../migrations/001_init.sql"),
)];

pub async fn connect(dsn: &str, context: &str) -> PgPool {
    PgPool::connect(dsn)
        .await
        .unwrap_or_else(|err| fatal(context, err))
}

// Applied at boot and recorded in schema_migrations. raw_sql uses the simple
// query protocol, so the multi-statement files run directly — no comment
// stripping needed (that was a pgx extended-protocol workaround).
pub async fn migrate(db: &PgPool) {
    sqlx::raw_sql(
        "CREATE TABLE IF NOT EXISTS schema_migrations (
            version    INTEGER PRIMARY KEY,
            applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )",
    )
    .execute(db)
    .await
    .unwrap_or_else(|err| fatal("migrate", err));

    for (version, name, sql) in MIGRATIONS {
        let applied: bool = sqlx::query_scalar(
            "SELECT EXISTS (SELECT 1 FROM schema_migrations WHERE version = $1)",
        )
        .bind(version)
        .fetch_one(db)
        .await
        .unwrap_or_else(|err| fatal("migrate", err));
        if applied {
            continue;
        }
        sqlx::raw_sql(sql)
            .execute(db)
            .await
            .unwrap_or_else(|err| fatal("migrate", err));
        sqlx::query("INSERT INTO schema_migrations (version) VALUES ($1)")
            .bind(version)
            .execute(db)
            .await
            .unwrap_or_else(|err| fatal("migrate", err));
        println!("[migrate] applied {name}");
    }
}
