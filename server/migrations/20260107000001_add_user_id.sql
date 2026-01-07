-- Add user_id to categories
ALTER TABLE categories ADD COLUMN user_id INTEGER REFERENCES users(id);
-- Try to backfill with the first user
UPDATE categories SET user_id = (SELECT id FROM users LIMIT 1);

-- Add user_id to items
ALTER TABLE items ADD COLUMN user_id INTEGER REFERENCES users(id);
-- Try to backfill with the first user
UPDATE items SET user_id = (SELECT id FROM users LIMIT 1);
