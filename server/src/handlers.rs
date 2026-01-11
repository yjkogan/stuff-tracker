use crate::models::{ApiItem, Claims, CreateItem, DbItem, UpdateItem};
use crate::upload::delete_image;
use axum::{
    Json,
    extract::{Extension, Path, Query, State},
    http::StatusCode,
};
use serde::Deserialize;
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct ListItemsQuery {
    category: Option<String>,
}

pub async fn get_items(
    State(pool): State<SqlitePool>,
    Extension(claims): Extension<Claims>,
    Query(query): Query<ListItemsQuery>,
) -> Result<Json<Vec<ApiItem>>, (StatusCode, String)> {
    let mut sql = "SELECT i.id, i.name, i.notes, i.image_url, i.created_at, 
                          i.rank_order,
                          c.name as category 
                   FROM items i 
                   JOIN categories c ON i.category_id = c.id
                   WHERE i.user_id = ?"
        .to_string();

    // We will bind 'claims.uid' first.

    if let Some(_cat_name) = &query.category {
        sql.push_str(" AND c.name = ?");
    }

    sql.push_str(" ORDER BY i.rank_order DESC");

    let mut query_builder = sqlx::query_as::<_, DbItem>(&sql);
    query_builder = query_builder.bind(claims.uid);

    if let Some(cat_name) = query.category {
        query_builder = query_builder.bind(cat_name);
    }

    let items = query_builder
        .fetch_all(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let api_items: Vec<ApiItem> = items.into_iter().map(Into::into).collect();

    Ok(Json(api_items))
}

pub async fn get_item(
    State(pool): State<SqlitePool>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<Json<ApiItem>, (StatusCode, String)> {
    let item = sqlx::query_as::<_, DbItem>(
        "SELECT i.id, i.name, i.notes, i.image_url, i.created_at,
                i.rank_order,
                c.name as category 
         FROM items i 
         JOIN categories c ON i.category_id = c.id
         WHERE i.id = ? AND i.user_id = ?",
    )
    .bind(id)
    .bind(claims.uid)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Item not found".to_string()))?;

    Ok(Json(item.into()))
}

async fn get_or_create_category_id(
    pool: &SqlitePool,
    name: &str,
    user_id: i64,
) -> Result<String, sqlx::Error> {
    // Try to find existing for THIS user
    let rec = sqlx::query!(
        "SELECT id FROM categories WHERE name = ? AND user_id = ?",
        name,
        user_id
    )
    .fetch_optional(pool)
    .await?;

    if let Some(row) = rec {
        return Ok(row.id);
    }

    // Create new
    let new_id = Uuid::new_v4().to_string();
    sqlx::query!(
        "INSERT INTO categories (id, name, user_id) VALUES (?, ?, ?)",
        new_id,
        name,
        user_id
    )
    .execute(pool)
    .await?;

    Ok(new_id)
}

pub async fn create_item(
    State(pool): State<SqlitePool>,
    Extension(claims): Extension<Claims>,
    Json(payload): Json<CreateItem>,
) -> Result<Json<ApiItem>, (StatusCode, String)> {
    let category_id = get_or_create_category_id(&pool, &payload.category, claims.uid)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let item_id = Uuid::new_v4().to_string();

    // Insert with None for rank_order (unranked)
    let rank_order: Option<f64> = None;

    sqlx::query!(
        "INSERT INTO items (id, category_id, name, notes, image_url, rank_order, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        item_id,
        category_id,
        payload.name,
        payload.notes,
        payload.image_url,
        rank_order,
        claims.uid
    )
    .execute(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    // Fetch back the full item
    let item = sqlx::query_as::<_, DbItem>(
        "SELECT i.id, i.name, i.notes, i.image_url, i.created_at,
                i.rank_order,
                c.name as category 
         FROM items i 
         JOIN categories c ON i.category_id = c.id
         WHERE i.id = ?",
    )
    .bind(&item_id)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(item.into()))
}

pub async fn update_item(
    State(pool): State<SqlitePool>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
    Json(payload): Json<UpdateItem>,
) -> Result<Json<ApiItem>, (StatusCode, String)> {
    // Check if item exists first AND belongs to user
    let existing_item = sqlx::query!(
        "SELECT id, image_url FROM items WHERE id = ? AND user_id = ?",
        id,
        claims.uid
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Item not found".to_string()))?;

    if let Some(cat_name) = &payload.category {
        let category_id = get_or_create_category_id(&pool, cat_name, claims.uid)
            .await
            .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

        sqlx::query!(
            "UPDATE items SET category_id = ? WHERE id = ?",
            category_id,
            id
        )
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    }

    if let Some(val) = payload.name {
        sqlx::query!("UPDATE items SET name = ? WHERE id = ?", val, id)
            .execute(&pool)
            .await
            .ok();
    }
    if let Some(val) = payload.notes {
        sqlx::query!("UPDATE items SET notes = ? WHERE id = ?", val, id)
            .execute(&pool)
            .await
            .ok();
    }
    if let Some(val) = payload.image_url {
        // If there was an old image and it's different from the new one, delete the old one
        if let Some(old_url) = existing_item.image_url.filter(|u| u != &val) {
            let _ = delete_image(&old_url).await;
        }

        sqlx::query!("UPDATE items SET image_url = ? WHERE id = ?", val, id)
            .execute(&pool)
            .await
            .ok();
    }
    if let Some(val) = payload.rank_order {
        sqlx::query!("UPDATE items SET rank_order = ? WHERE id = ?", val, id)
            .execute(&pool)
            .await
            .ok();
    }

    // Return updated item
    let item = sqlx::query_as::<_, DbItem>(
        "SELECT i.id, i.name, i.notes, i.image_url, i.created_at,
                i.rank_order,
                c.name as category 
         FROM items i 
         JOIN categories c ON i.category_id = c.id
         WHERE i.id = ?",
    )
    .bind(&id)
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(Json(item.into()))
}

pub async fn delete_item(
    State(pool): State<SqlitePool>,
    Extension(claims): Extension<Claims>,
    Path(id): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    // Get item first to find image_url AND check ownership
    let item = sqlx::query!(
        "SELECT image_url FROM items WHERE id = ? AND user_id = ?",
        id,
        claims.uid
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Item not found".to_string()))?;

    // Delete image if exists
    if let Some(url) = item.image_url {
        let _ = delete_image(&url).await;
    }

    // Delete item from DB
    sqlx::query!("DELETE FROM items WHERE id = ?", id)
        .execute(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_categories(
    State(pool): State<SqlitePool>,
    Extension(claims): Extension<Claims>,
) -> Result<Json<Vec<String>>, (StatusCode, String)> {
    let categories = sqlx::query!(
        "SELECT name FROM categories WHERE user_id = ? ORDER BY name",
        claims.uid
    )
    .fetch_all(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let names = categories.into_iter().map(|rec| rec.name).collect();
    Ok(Json(names))
}
