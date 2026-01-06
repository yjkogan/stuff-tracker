-- Add migration script here
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY NOT NULL,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    notes TEXT,
    image_url TEXT,
    rating TEXT NOT NULL, -- 'good', 'bad', 'meh'
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ranking field (Binary Search Order)
    rank_order REAL NOT NULL DEFAULT 0.0,

    FOREIGN KEY (category_id) REFERENCES categories(id)
);
