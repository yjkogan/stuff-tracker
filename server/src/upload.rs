use axum::{
    extract::Multipart,
    http::StatusCode,
    Json,
};
use serde::Serialize;
use std::path::Path;
use tokio::fs;
use uuid::Uuid;

#[derive(Serialize)]
pub struct UploadResponse {
    url: String,
}

pub async fn upload_image(
    mut multipart: Multipart,
) -> Result<Json<UploadResponse>, (StatusCode, String)> {
    while let Some(field) = multipart.next_field().await.map_err(|e| (StatusCode::BAD_REQUEST, e.to_string()))? {
        let name = field.name().unwrap_or("").to_string();
        
        if name == "image" {
             let file_name = field.file_name().unwrap_or("image.jpg").to_string();
             let ext = Path::new(&file_name).extension().and_then(|e| e.to_str()).unwrap_or("jpg");
             let new_filename = format!("{}.{}", Uuid::new_v4(), ext);
             let filepath = format!("uploads/{}", new_filename);

             let data = field.bytes().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

             fs::write(&filepath, data).await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

             return Ok(Json(UploadResponse {
                 url: format!("/uploads/{}", new_filename),
             }));
        }
    }
    
    Err((StatusCode::BAD_REQUEST, "No image field found".to_string()))
}
