pub mod handlers;
pub mod models;
pub mod upload;

use axum::{Router, routing::{get, post}};
use sqlx::SqlitePool;
use tower_http::services::ServeDir;

pub fn create_router(pool: SqlitePool) -> Router {
    Router::new()
        .route("/", get(root))
        .route(
            "/api/items",
            get(handlers::get_items).post(handlers::create_item),
        )
        .route(
            "/api/items/{id}",
            get(handlers::get_item).patch(handlers::update_item),
        )
        .route("/api/categories", get(handlers::get_categories))
        .route("/api/upload", post(upload::upload_image))
        .nest_service("/uploads", ServeDir::new("uploads"))
        .layer(tower_http::cors::CorsLayer::permissive())
        .with_state(pool)
}

async fn root() -> &'static str {
    "Hello, World!"
}
