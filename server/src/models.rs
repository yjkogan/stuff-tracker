use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use chrono::{DateTime, Utc};
use uuid::Uuid;

#[derive(Debug, FromRow, Clone)]
pub struct DbItem {
    pub id: String,
    pub category: String, // Flattened for API: Name of the category
    pub name: String,
    pub notes: Option<String>,
    pub image_url: Option<String>,
    pub rating: String, // 'good', 'bad', 'meh'
    pub created_at: DateTime<Utc>,
    pub rank_order: f64,
}

#[derive(Debug, Serialize, Clone)]
pub struct ApiItem {
    pub id: String,
    pub category: String,
    pub name: String,
    pub notes: Option<String>,
    pub image_url: Option<String>,
    pub rating: String,
    pub created_at: DateTime<Utc>,
    pub rank_order: f64,
}

impl From<DbItem> for ApiItem {
    fn from(item: DbItem) -> Self {
        Self {
            id: item.id,
            category: item.category,
            name: item.name,
            notes: item.notes,
            image_url: item.image_url,
            rating: item.rating,
            created_at: item.created_at,
            rank_order: item.rank_order,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateItem {
    pub category: String,
    pub name: String,
    pub notes: Option<String>,
    pub image_url: Option<String>,
    pub rating: String,
}

#[derive(Debug, Deserialize)]
pub struct UpdateItem {
    pub category: Option<String>,
    pub name: Option<String>,
    pub notes: Option<String>,
    pub image_url: Option<String>,
    pub rating: Option<String>,
    pub rank_order: Option<f64>,
}

#[derive(Debug, Serialize, FromRow)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
}


