#!/bin/bash
# Start the frontend development server

cd "$(dirname "$0")/frontend"

# Check if node_modules exists, if not, install
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    # Use temporary cache and ensure arm64 architecture
    arch -arm64 npm install --cache /tmp/npm-cache --prefer-offline --no-audit --legacy-peer-deps
fi

# Start the dev server (ensure we use native arm64 architecture)
echo "Starting frontend on http://localhost:5173"
echo "Press Ctrl+C to stop"
arch -arm64 npm run dev

