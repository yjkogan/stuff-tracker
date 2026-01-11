use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use serde_json::json;
use server::{create_router, models::ApiItem};
use sqlx::SqlitePool;
use tower::ServiceExt;

#[sqlx::test]
async fn test_item_lifecycle(pool: SqlitePool) {
    let app = create_router(pool.clone());
    let _user_id = create_user(&pool, "testuser", "password").await;
    let token = login(&app, "testuser", "password").await;

    // 1. Create Item
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/items")
                .method("POST")
                .header("Content-Type", "application/json")
                .header("Authorization", format!("Bearer {}", token))
                .body(Body::from(
                    json!({
                        "category": "Work",
                        "name": "Laptop",
                        "notes": "Company property"
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let created_item: ApiItem = serde_json::from_slice(&body).unwrap();

    assert_eq!(created_item.name, "Laptop");
    assert_eq!(created_item.category, "Work");
    assert_eq!(created_item.notes.as_deref(), Some("Company property"));
    let item_id = created_item.id;

    // 2. Get Item
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/api/items/{}", item_id))
                .header("Authorization", format!("Bearer {}", token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let fetched_item: ApiItem = serde_json::from_slice(&body).unwrap();
    assert_eq!(fetched_item.id, item_id);

    // 3. Update Item
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/api/items/{}", item_id))
                .method("PATCH")
                .header("Content-Type", "application/json")
                .header("Authorization", format!("Bearer {}", token))
                .body(Body::from(
                    json!({
                        "name": "Gaming Laptop",
                        "rank_order": 100.0
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let updated_item: ApiItem = serde_json::from_slice(&body).unwrap();
    assert_eq!(updated_item.name, "Gaming Laptop");
    assert_eq!(updated_item.rank_order, Some(100.0));
    // Notes should remain unchanged if not provided in update?
    // Wait, PUT usually replaces or PATCH updates?
    // Looking at handlers.rs: update_item uses Option fields in UpdateItem struct, so it's a PATCH-like behavior implemented on PUT (or whatever the route is).
    // Let's verify notes are still there.
    assert_eq!(updated_item.notes.as_deref(), Some("Company property"));

    // 4. List Items
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/items")
                .header("Authorization", format!("Bearer {}", token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let items: Vec<ApiItem> = serde_json::from_slice(&body).unwrap();
    assert!(items.iter().any(|i| i.id == item_id));

    // 5. Delete Item
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/api/items/{}", item_id))
                .method("DELETE")
                .header("Authorization", format!("Bearer {}", token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NO_CONTENT);

    // Verify gone
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/api/items/{}", item_id))
                .header("Authorization", format!("Bearer {}", token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::NOT_FOUND);
}

#[sqlx::test]
async fn test_categories(pool: SqlitePool) {
    let app = create_router(pool.clone());
    let _ = create_user(&pool, "cat_user", "pass").await;
    let token = login(&app, "cat_user", "pass").await;

    // Create two items in different categories
    for (cat, name) in &[("Books", "Dune"), ("Movies", "Star Wars")] {
        let _ = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/api/items")
                    .method("POST")
                    .header("Content-Type", "application/json")
                    .header("Authorization", format!("Bearer {}", token))
                    .body(Body::from(
                        json!({
                            "category": cat,
                            "name": name,
                        })
                        .to_string(),
                    ))
                    .unwrap(),
            )
            .await
            .unwrap();
    }

    // 1. List Categories
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/categories")
                .header("Authorization", format!("Bearer {}", token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let categories: Vec<String> = serde_json::from_slice(&body).unwrap();

    assert!(categories.contains(&"Books".to_string()));
    assert!(categories.contains(&"Movies".to_string()));

    // 2. Filter Items by Category
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/items?category=Books")
                .header("Authorization", format!("Bearer {}", token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let items: Vec<ApiItem> = serde_json::from_slice(&body).unwrap();

    // Should contain Dune, but NOT Star Wars
    assert!(items.iter().any(|i| i.name == "Dune"));
    assert!(!items.iter().any(|i| i.name == "Star Wars"));
}

#[sqlx::test]
async fn test_sad_paths_and_security(pool: SqlitePool) {
    let app = create_router(pool.clone());
    let _ = create_user(&pool, "victim", "pass").await;
    let _ = create_user(&pool, "hacker", "pass").await;

    let victim_token = login(&app, "victim", "pass").await;
    let hacker_token = login(&app, "hacker", "pass").await;

    // Victim creates an item
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri("/api/items")
                .method("POST")
                .header("Content-Type", "application/json")
                .header("Authorization", format!("Bearer {}", victim_token))
                .body(Body::from(
                    json!({
                        "category": "Secure",
                        "name": "Key",
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    let item: ApiItem = serde_json::from_slice(
        &axum::body::to_bytes(response.into_body(), usize::MAX)
            .await
            .unwrap(),
    )
    .unwrap();
    let item_id = item.id;

    // 1. Test Item Not Found (for random UUID)
    let random_id = uuid::Uuid::new_v4().to_string();
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/api/items/{}", random_id))
                .header("Authorization", format!("Bearer {}", victim_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);

    // 2. Hacker tries to UPDATE Victim's item -> Should be NOT_FOUND (masked) or FORBIDDEN
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/api/items/{}", item_id))
                .method("PATCH")
                .header("Content-Type", "application/json")
                .header("Authorization", format!("Bearer {}", hacker_token))
                .body(Body::from(
                    json!({
                        "name": "Hacked",
                    })
                    .to_string(),
                ))
                .unwrap(),
        )
        .await
        .unwrap();
    // Handlers currently filter by user_id = claims.uid, so it won't find the item -> 404
    assert_eq!(response.status(), StatusCode::NOT_FOUND);

    // 3. Hacker tries to DELETE Victim's item
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/api/items/{}", item_id))
                .method("DELETE")
                .header("Authorization", format!("Bearer {}", hacker_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::NOT_FOUND);

    // Verify item still exists for victim
    let response = app
        .clone()
        .oneshot(
            Request::builder()
                .uri(format!("/api/items/{}", item_id))
                .header("Authorization", format!("Bearer {}", victim_token))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::OK);
}

// Helpers (Duplicated for isolation as requested)
async fn create_user(pool: &SqlitePool, username: &str, password: &str) -> i64 {
    use argon2::{
        Argon2,
        password_hash::{PasswordHasher, SaltString, rand_core::OsRng},
    };

    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2
        .hash_password(password.as_bytes(), &salt)
        .unwrap()
        .to_string();

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
    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
    json["token"].as_str().unwrap().to_string()
}
