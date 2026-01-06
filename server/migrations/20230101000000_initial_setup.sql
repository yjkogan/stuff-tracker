-- Add migration script here
CREATE TABLE categories (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE items (
    id TEXT PRIMARY KEY NOT NULL,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    notes TEXT,
    image_url TEXT,
    rating TEXT NOT NULL, -- 'good', 'bad', 'meh'
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Ranking fields (Glicko-2 style)
    elo_rating REAL NOT NULL DEFAULT 1500.0,
    elo_rd REAL NOT NULL DEFAULT 350.0,
    elo_vol REAL NOT NULL DEFAULT 0.06,
    match_count INTEGER NOT NULL DEFAULT 0,

    FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE comparisons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    winner_id TEXT NOT NULL,
    loser_id TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (winner_id) REFERENCES items(id),
    FOREIGN KEY (loser_id) REFERENCES items(id)
);
