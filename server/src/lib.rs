pub mod auth;
pub mod handlers;
pub mod models;
pub mod upload;

use axum::{
    middleware,
    routing::{get, post},
    Router,
};
use sqlx::SqlitePool;
use tower_http::services::{ServeDir, ServeFile};

pub fn create_router(pool: SqlitePool) -> Router {
    let auth_routes = Router::new()
        .route(
            "/api/items",
            get(handlers::get_items).post(handlers::create_item),
        )
        .route(
            "/api/items/{id}",
            get(handlers::get_item)
                .patch(handlers::update_item)
                .delete(handlers::delete_item),
        )
        .route("/api/categories", get(handlers::get_categories))
        .route("/api/upload", post(upload::upload_image))
        .layer(middleware::from_fn(auth::auth_middleware));

    let public_routes = Router::new()
        .route("/api/login", post(auth::login))
        .nest_service("/uploads", ServeDir::new("uploads"))
        .fallback_service(
            ServeDir::new("../client/dist").fallback(ServeFile::new("../client/dist/index.html")),
        );

    Router::new()
        .merge(auth_routes)
        .merge(public_routes)
        .layer(tower_http::cors::CorsLayer::permissive())
        .with_state(pool)
}

