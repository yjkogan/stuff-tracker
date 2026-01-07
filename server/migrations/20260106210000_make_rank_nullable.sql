-- Make rank_order nullable
CREATE TABLE items_new (
    id TEXT PRIMARY KEY NOT NULL,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    notes TEXT,
    image_url TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rank_order REAL,
    FOREIGN KEY (category_id) REFERENCES categories(id)
);

INSERT INTO items_new (id, category_id, name, notes, image_url, created_at, rank_order)
SELECT id, category_id, name, notes, image_url, created_at, rank_order FROM items;

DROP TABLE items;

ALTER TABLE items_new RENAME TO items;
