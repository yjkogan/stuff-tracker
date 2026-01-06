pub mod handlers;
pub mod models;

pub mod ranking;

use axum::{
    routing::{get, post, patch},
    Router,
};
use sqlx::SqlitePool;

pub fn create_router(pool: SqlitePool) -> Router {
    Router::new()
         .route("/", get(root))
        .route("/api/items", get(handlers::get_items).post(handlers::create_item))
        .route("/api/items/{id}", get(handlers::get_item).patch(handlers::update_item))
        .route("/api/categories", get(handlers::get_categories))
        .route("/api/rank/pair", get(handlers::get_ranking_pair))
        .route("/api/rank/vote", post(handlers::submit_vote))
        .layer(tower_http::cors::CorsLayer::permissive())
        .with_state(pool)
}

async fn root() -> &'static str {
    "Hello, World!"
}
