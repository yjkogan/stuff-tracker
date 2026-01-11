use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

#[derive(Debug, FromRow, Clone)]
pub struct DbItem {
    pub id: String,
    pub category: String, // Flattened for API: Name of the category
    pub name: String,
    pub notes: Option<String>,
    pub image_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub rank_order: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiItem {
    pub id: String,
    pub category: String,
    pub name: String,
    pub notes: Option<String>,
    pub image_url: Option<String>,
    pub created_at: DateTime<Utc>,
    pub rank_order: Option<f64>,
    pub normalized_score: Option<f64>,
}

impl From<DbItem> for ApiItem {
    fn from(item: DbItem) -> Self {
        // Sigmoid mapping: 0-100 based on rank_order
        // rank_order 0 -> ~50
        // rank_order 300 -> ~73
        // rank_order -300 -> ~26
        // Scale factor 300.0 chosen to give reasonable spread
        let score = item
            .rank_order
            .map(|rank| 100.0 / (1.0 + (-rank / 300.0).exp()));

        Self {
            id: item.id,
            category: item.category,
            name: item.name,
            notes: item.notes,
            image_url: item.image_url,
            created_at: item.created_at,
            rank_order: item.rank_order,
            normalized_score: score,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateItem {
    pub category: String,
    pub name: String,
    pub notes: Option<String>,
    pub image_url: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateItem {
    pub category: Option<String>,
    pub name: Option<String>,
    pub notes: Option<String>,
    pub image_url: Option<String>,
    pub rank_order: Option<f64>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Clone, Debug, FromRow, Serialize, Deserialize)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub password_hash: String,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub uid: i64,
    pub exp: usize,
}
