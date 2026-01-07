use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use serde_json::json;
use server::{create_router, models::ApiItem}; // Assuming lib.rs exposes create_router and models
use sqlx::SqlitePool;
use tower::ServiceExt; // for `oneshot`

#[sqlx::test]
async fn test_auth_and_isolation(pool: SqlitePool) {
    // 1. Setup App
    let app = create_router(pool.clone());

    // 2. Create Users
    // We can interact with DB directly for setup to avoid spinning up full registration flow (which we don't have)
    let _user1_id = create_user(&pool, "user1", "pass1").await;
    let _user2_id = create_user(&pool, "user2", "pass2").await;

    // 3. Login User 1
    let token1 = login(&app, "user1", "pass1").await;
    
    // 4. Create Item as User 1
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/items")
                .method("POST")
                .header("Content-Type", "application/json")
                .header("Authorization", format!("Bearer {}", token1))
                .body(Body::from(
                    json!({
                        "category": "Test Cat",
                        "name": "User1 Item",
                        "notes": "Secret"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let item: ApiItem = serde_json::from_slice(&body).unwrap();
    let item_id = item.id;

    // 5. Verify User 1 can see it
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/items")
                .header("Authorization", format!("Bearer {}", token1))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    
    assert_eq!(response.status(), StatusCode::OK);
    // Parse verify list contains item

    // 6. Login User 2
    let token2 = login(&app, "user2", "pass2").await;

    // 7. Verify User 2 CANNOT see User 1's item in list
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/items")
                .header("Authorization", format!("Bearer {}", token2))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let items: Vec<ApiItem> = serde_json::from_slice(&body).unwrap();
    assert!(items.is_empty(), "User 2 should see 0 items");

    // 8. Verify User 2 CANNOT get User 1's item by ID
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/api/items/{}", item_id))
                .header("Authorization", format!("Bearer {}", token2))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND); // OR 403, but our logic returns 404 for "not found in my list"
}

// Helpers

async fn create_user(pool: &SqlitePool, username: &str, password: &str) -> i64 {
    // Hash password manually or use a helper if available, or just mock it if we inserted directly
    // Ideally we use the same hashing logic. 
    // For test simplicity, let's just use the app's hash logic if accessible, OR insert a known hash.
    // We already have `argon2` crate.
    
    use argon2::{
        password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
        Argon2
    };

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(password.as_bytes(), &salt).unwrap().to_string();

    let rec = sqlx::query!(
        "INSERT INTO users (username, password_hash) VALUES (?, ?) RETURNING id",
        username,
        password_hash
    )
    .fetch_one(pool)
    .await
    .unwrap();
    
    rec.id
}

async fn login(app: &axum::Router, username: &str, password: &str) -> String {
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/login")
                .method("POST")
                .header("Content-Type", "application/json")
                .body(Body::from(
                    json!({
                        "username": username,
                        "password": password
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX).await.unwrap();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    json["token"].as_str().unwrap().to_string()
}
