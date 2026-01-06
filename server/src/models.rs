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
    pub elo_rating: f64,
    pub elo_rd: f64,
    pub elo_vol: f64,
    pub match_count: i32,
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
    pub elo_rating: f64,
    pub elo_rd: f64,
    pub elo_vol: f64,
    pub match_count: i32,
    pub score: f64,
}

impl From<DbItem> for ApiItem {
    fn from(item: DbItem) -> Self {
        let score = crate::ranking::rating_to_score(item.elo_rating);
        Self {
            id: item.id,
            category: item.category,
            name: item.name,
            notes: item.notes,
            image_url: item.image_url,
            rating: item.rating,
            created_at: item.created_at,
            elo_rating: item.elo_rating,
            elo_rd: item.elo_rd,
            elo_vol: item.elo_vol,
            match_count: item.match_count,
            score,
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
}

#[derive(Debug, Serialize, FromRow)]
pub struct Category {
    pub id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ComparisonRequest {
    pub winner_id: String,
    pub loser_id: String,
}

#[derive(Debug, Serialize)]
pub struct ComparisonPair {
    pub item1: ApiItem,
    pub item2: ApiItem,
}
