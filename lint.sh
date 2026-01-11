#!/bin/bash
set -e

echo "=== Client: Linting ==="
cd client
npm run lint
cd ..

echo "=== Client: Formatting Check ==="
cd client
npx prettier --check .
cd ..

echo "=== Server: Formatting Check ==="
cd server
cargo fmt -- --check
cd ..

echo "=== Server: Clippy (Linting) ==="
cd server
cargo clippy -- -D warnings
cd ..

echo "=== All checks passed! ==="
