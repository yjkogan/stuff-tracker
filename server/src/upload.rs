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
             // Just force .jpg extension since we are converting everything to jpeg effectively
             let new_filename = format!("{}.jpg", Uuid::new_v4());
             let filepath = format!("uploads/{}", new_filename);

             let data = field.bytes().await.map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;

             // Strip metadata by decoding and re-encoding
             let img = image::load_from_memory(&data).map_err(|e| (StatusCode::BAD_REQUEST, format!("Invalid image format: {}", e)))?;
             
             // Save as JPEG with default quality
             img.save(&filepath).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, format!("Failed to save image: {}", e)))?;

             return Ok(Json(UploadResponse {
                 url: format!("/uploads/{}", new_filename),
             }));
        }
    }
    
    Err((StatusCode::BAD_REQUEST, "No image field found".to_string()))
}

pub async fn delete_image(url: &str) -> std::io::Result<()> {
    // URL format: /uploads/UUID.ext
    let filename = match url.strip_prefix("/uploads/") {
        Some(f) => f,
        None => return Ok(()), // Not a local upload path, ignore
    };

    // Basic sanity check on filename to prevent obvious directory traversal
    if filename.contains("..") || filename.contains('/') || filename.contains('\\') {
        return Err(std::io::Error::new(std::io::ErrorKind::InvalidInput, "Invalid filename"));
    }

    let filepath = Path::new("uploads").join(filename);

    // Verify existence to avoid errors on already deleted files
    if filepath.exists() {
        fs::remove_file(filepath).await?;
    }

    Ok(())
}
