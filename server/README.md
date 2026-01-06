# Personal Tracking App - Backend

This directory contains the Rust backend for the Personal Tracking App, built with Axum, SQLx, and SQLite.

## Prerequisites

- **Rust & Cargo**: Ensure you have the latest stable Rust toolchain installed.
  - Install via rustup: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`

## Getting Started

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```

2.  **Environment Setup:**
    - A `.env` file is automatically loaded.
    - Default `DATABASE_URL` is `sqlite:data.db`.
    - Default `RUST_LOG` is `debug`.

3.  **Run the Server:**
    ```bash
    cargo run
    ```
    - This command will:
        - Compile the project.
        - Create the database file (`data.db`) if it doesn't exist.
        - Run automatic migrations to set up the schema.
        - Start the server on `http://127.0.0.1:3000`.

## API Endpoints

The server exposes the following REST endpoints:

- **Items**
    - `GET /api/items`: List all items (sort by newest). Supports filtering: `/api/items?category=Name`.
    - `GET /api/items/{id}`: Get a single item by ID.
    - `POST /api/items`: Create a new item.
        - Body: `{"category": "Name", "name": "Item Name", "rating": "good", "notes": "...", "image_url": "..."}`
        - Note: If the category does not exist, it will be created automatically.
    - `PATCH /api/items/{id}`: Update an item.
        - Body: Partial JSON of the Create object.

- **Categories**
    - `GET /api/categories`: List all unique category names.

## Development

- **Build**: `cargo build`
- **Check**: `cargo check` (faster compilation for syntax checking)
- **Format**: `cargo fmt`

## Testing

The project includes integration tests that verify API endpoints using an in-memory SQLite database.

- **Run all tests**:
  ```bash
  cargo test
  ```
  This will:
  1. Compile the application and tests.
  2. Spin up an in-memory server instance for each test.
  3. Run happy path and error case scenarios.

## Database

The project uses a local SQLite database (`data.db`).
- **Schema**: Defined in `migrations/` and applied automatically on startup.
- **Tables**: `items`, `categories`.
