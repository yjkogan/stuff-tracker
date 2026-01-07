use serde_json::json;
use server::create_router;
use sqlx::{Pool, Sqlite, sqlite::SqlitePoolOptions};

async fn spawn_app() -> (String, Pool<Sqlite>) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0")
        .await
        .expect("Failed to bind random port");
    let port = listener.local_addr().unwrap().port();
    let addr = format!("http://127.0.0.1:{}", port);

    let pool = SqlitePoolOptions::new()
        .connect("sqlite::memory:")
        .await
        .expect("Failed to connect to in-memory DB");

    sqlx::migrate!("./migrations")
        .run(&pool)
        .await
        .expect("Failed to migrate DB");

    let app = create_router(pool.clone());

    tokio::spawn(async move {
        axum::serve(listener, app).await.unwrap();
    });

    (addr, pool)
}

#[tokio::test]
async fn health_check_works() {
    let (addr, _) = spawn_app().await;
    let client = reqwest::Client::new();

    let response = client
        .get(format!("{}/", addr))
        .send()
        .await
        .expect("Failed to execute request.");

    assert!(response.status().is_success());
    assert_eq!(response.text().await.unwrap(), "Hello, World!");
}

#[tokio::test]
async fn create_and_retrieve_item() {
    let (addr, pool) = spawn_app().await;
    let client = reqwest::Client::new();

    // 1. Create Item
    let item_data = json!({
        "category": "Snacks",
        "name": "Popcorn",
        "notes": "Salty and buttery",
        "image_url": null
    });

    let response = client
        .post(format!("{}/api/items", addr))
        .json(&item_data)
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(response.status().as_u16(), 200);

    let created_item: serde_json::Value = response.json().await.unwrap();
    let item_id = created_item.get("id").unwrap().as_str().unwrap();
    assert_eq!(created_item["name"], "Popcorn");
    assert_eq!(created_item["category"], "Snacks");

    // 2. Get Item by ID
    let response = client
        .get(format!("{}/api/items/{}", addr, item_id))
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(response.status().as_u16(), 200);
    let fetched_item: serde_json::Value = response.json().await.unwrap();
    assert_eq!(fetched_item["id"], item_id);

    // 3. Verify in DB
    let saved = sqlx::query!("SELECT name FROM items WHERE id = ?", item_id)
        .fetch_one(&pool)
        .await
        .expect("Failed to fetch from DB");
    assert_eq!(saved.name, "Popcorn");
}

#[tokio::test]
async fn get_item_returns_404_for_non_existent() {
    let (addr, _) = spawn_app().await;
    let client = reqwest::Client::new();

    let response = client
        .get(format!(
            "{}/api/items/00000000-0000-0000-0000-000000000000",
            addr
        ))
        .send()
        .await
        .expect("Failed to execute request.");

    assert_eq!(response.status().as_u16(), 404);
}

#[tokio::test]
async fn create_item_returns_422_for_invalid_json() {
    let (addr, _) = spawn_app().await;
    let client = reqwest::Client::new();

    // 1. Missing required field "name"
    let bad_data = json!({
        "category": "Snacks",
        // "name": "Missing",
    });

    let response = client
        .post(format!("{}/api/items", addr))
        .json(&bad_data)
        .send()
        .await
        .expect("Failed to execute request.");

    // Axum returns 422 Unprocessable Entity for deserialization errors
    assert_eq!(response.status().as_u16(), 422);
}
