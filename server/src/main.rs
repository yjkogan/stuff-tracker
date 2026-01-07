use server::create_router;
use sqlx::sqlite::SqlitePoolOptions;

use std::path::Path;
use tokio::fs;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Load .env if it exists
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt::init();

    let db_url = std::env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:data.db".to_string());

    // Ensure database file exists
    if db_url.starts_with("sqlite:") {
        let path_str = db_url.trim_start_matches("sqlite:");
        if !Path::new(path_str).exists() {
            println!("Creating database file: {}", path_str);
            fs::File::create(path_str).await?;
        }
    }

    // Connect to database
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .expect("Failed to connect to database");

    // Run migrations
    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to run migrations");

    println!("Migrations applied successfully.");

    // Build router
    let app = create_router(pool);

    // Run server
    let port = std::env::var("PORT").unwrap_or_else(|_| "3000".to_string());
    let host = std::env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string());
    let addr = format!("{}:{}", host, port);
    
    println!("listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();

    Ok(())
}
