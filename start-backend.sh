#!/bin/bash
# Start the backend server

cd "$(dirname "$0")/backend"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Start the server (ensure we use native arm64 architecture)
echo "Starting backend server on http://localhost:8000"
echo "Press Ctrl+C to stop"
arch -arm64 uvicorn main:app --reload

