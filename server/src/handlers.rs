use crate::models::{ApiItem, CreateItem, DbItem, UpdateItem};
use axum::{
    Json,
    extract::{Path, Query, State},
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
    Query(query): Query<ListItemsQuery>,
) -> Result<Json<Vec<ApiItem>>, (StatusCode, String)> {
    let mut sql = "SELECT i.id, i.name, i.notes, i.image_url, i.created_at, 
                          i.rank_order,
                          c.name as category 
                   FROM items i 
                   JOIN categories c ON i.category_id = c.id"
        .to_string();

    let mut args = Vec::new();

    if let Some(cat_name) = query.category {
        sql.push_str(" WHERE c.name = ?");
        args.push(cat_name);
    }

    // Sort by rank_order DESC (Higher is better/top)
    sql.push_str(" ORDER BY i.rank_order DESC");

    let mut query_builder = sqlx::query_as::<_, DbItem>(&sql);
    for arg in args {
        query_builder = query_builder.bind(arg);
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
    Path(id): Path<String>,
) -> Result<Json<ApiItem>, (StatusCode, String)> {
    let item = sqlx::query_as::<_, DbItem>(
        "SELECT i.id, i.name, i.notes, i.image_url, i.created_at,
                i.rank_order,
                c.name as category 
         FROM items i 
         JOIN categories c ON i.category_id = c.id
         WHERE i.id = ?",
    )
    .bind(id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .ok_or((StatusCode::NOT_FOUND, "Item not found".to_string()))?;

    Ok(Json(item.into()))
}

async fn get_or_create_category_id(pool: &SqlitePool, name: &str) -> Result<String, sqlx::Error> {
    // Try to find existing
    let rec = sqlx::query!("SELECT id FROM categories WHERE name = ?", name)
        .fetch_optional(pool)
        .await?;

    if let Some(row) = rec {
        return Ok(row.id);
    }

    // Create new
    let new_id = Uuid::new_v4().to_string();
    sqlx::query!(
        "INSERT INTO categories (id, name) VALUES (?, ?)",
        new_id,
        name
    )
    .execute(pool)
    .await?;

    Ok(new_id)
}

pub async fn create_item(
    State(pool): State<SqlitePool>,
    Json(payload): Json<CreateItem>,
) -> Result<Json<ApiItem>, (StatusCode, String)> {
    let category_id = get_or_create_category_id(&pool, &payload.category)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let item_id = Uuid::new_v4().to_string();

    // Insert with defaults for rank_order
    // Find the current lowest rank in this category to append to bottom
    let min_rank = sqlx::query!(
        "SELECT MIN(rank_order) as min_rank FROM items WHERE category_id = ?",
        category_id
    )
    .fetch_one(&pool)
    .await
    .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
    .min_rank
    .unwrap_or(0.0);

    // Default to bottom: min_rank - 100.0
    // If list is empty (min_rank is 0.0), start at 0.0 (or whatever baseline)
    let initial_rank = if min_rank == 0.0 {
        0.0
    } else {
        min_rank - 100.0
    };

    sqlx::query!(
        "INSERT INTO items (id, category_id, name, notes, image_url, rank_order) VALUES (?, ?, ?, ?, ?, ?)",
        item_id,
        category_id,
        payload.name,
        payload.notes,
        payload.image_url,
        initial_rank
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
    Path(id): Path<String>,
    Json(payload): Json<UpdateItem>,
) -> Result<Json<ApiItem>, (StatusCode, String)> {
    // Check if item exists first
    let _exists = sqlx::query!("SELECT id FROM items WHERE id = ?", id)
        .fetch_optional(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?
        .ok_or((StatusCode::NOT_FOUND, "Item not found".to_string()))?;

    if let Some(cat_name) = &payload.category {
        let category_id = get_or_create_category_id(&pool, cat_name)
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

pub async fn get_categories(
    State(pool): State<SqlitePool>,
) -> Result<Json<Vec<String>>, (StatusCode, String)> {
    let categories = sqlx::query!("SELECT name FROM categories ORDER BY name")
        .fetch_all(&pool)
        .await
        .map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

    let names = categories.into_iter().map(|rec| rec.name).collect();
    Ok(Json(names))
}
