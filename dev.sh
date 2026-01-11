#!/bin/bash

# Kill background processes when the script exits
trap "trap - SIGTERM && kill -- -$$" SIGINT SIGTERM EXIT

API_TARGET=""

# Parse arguments
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --target) API_TARGET="$2"; shift ;;
        *) echo "Unknown parameter passed: $1"; exit 1 ;;
    esac
    shift
done

echo "🚀 Starting Stuff Tracker Development Environment..."

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
if ! command_exists npm; then
    echo "❌ Error: npm is not installed. Please install Node.js."
    exit 1
fi

if [ -z "$API_TARGET" ]; then
    # No target specified, run local backend
    if ! command_exists cargo; then
        echo "❌ Error: cargo is not installed (required for local backend). Please install Rust."
        exit 1
    fi

    echo "📦 Starting Local Backend Server..."
    cd server
    if [ ! -f "data.db" ]; then
        echo "   (data.db not found, it will be automatically created)"
    fi

    # Run backend in background
    cargo run &
    cd ..
else
    # Target specified, use remote backend
    echo "🌍 Connecting to Remote Backend at: $API_TARGET"
    export API_TARGET
fi

# Start Frontend in the foreground
echo "💻 Starting Client..."
cd client

# Check if we need to install dependencies
if [ ! -d "node_modules" ]; then
    echo "   (node_modules not found, running npm install...)"
    npm install
fi

# Run the dev server
# Vite is configured to proxy /api based on API_TARGET env var (defaulting to localhost:3000)
npm run dev
