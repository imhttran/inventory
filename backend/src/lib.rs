// Rust port of the Go backend — see docs/RUST_MIGRATION.md.
// Library crate so the integration tests (tests/) exercise the real router.
//
// Module layout (auto-parts structure):
//   api/       router, response helpers, auth extractor, health probe
//   auth/      login/JWT, roles, user + profile management
//   database/  pool + migrations
//   events/    DB-backed email queue + mailer (async side effects)
//
// products/, brands/, categories/, inventory/, suppliers/, search/ arrive
// with their own steps.

pub mod api;
pub mod auth;
pub mod brands;
pub mod categories;
pub mod config;
pub mod database;
pub mod events;
pub mod inventory;
pub mod products;
pub mod search;
pub mod seed;
pub mod state;
pub mod suppliers;
pub mod validators;

// Historical module paths kept working while the on-disk layout follows the
// auto-parts structure — main.rs and the tests still say backend::routes,
// backend::queue, backend::migrate, and handlers still say crate::profile etc.
pub use api as routes;
pub use auth::profile;
pub use auth::roles;
pub use auth::users;
pub use database::migrate;
pub use events as queue;
pub use seed::{seed_dev_inventory, seed_dev_users};

use sqlx::PgPool;

// ---- out-of-band role management (the set-role subcommand) ----

// Debug: the integration test's .expect needs it.
#[derive(Debug)]
pub enum SetRoleError {
    InvalidRole,
    NoSuchUser(String),
    Db(sqlx::Error),
}

// Sets an existing user's role. There's no HTTP endpoint for this on purpose —
// admin/staff are granted out-of-band (usage: set-role <email> <role>).
pub async fn set_role(db: &PgPool, email: &str, role: &str) -> Result<(), SetRoleError> {
    if auth::roles::role_index(role).is_none() {
        return Err(SetRoleError::InvalidRole);
    }
    let exists: bool = sqlx::query_scalar("SELECT EXISTS (SELECT 1 FROM users WHERE email = $1)")
        .bind(email)
        .fetch_one(db)
        .await
        .map_err(SetRoleError::Db)?;
    if !exists {
        return Err(SetRoleError::NoSuchUser(email.to_string()));
    }
    sqlx::query("UPDATE users SET role = $1 WHERE email = $2")
        .bind(role)
        .bind(email)
        .execute(db)
        .await
        .map_err(SetRoleError::Db)?;
    Ok(())
}
// ---- out-of-band role management (the set-role subcommand) ----

pub fn fatal(context: &str, err: impl std::fmt::Display) -> ! {
    eprintln!("{context}: {err}");
    std::process::exit(1);
}
