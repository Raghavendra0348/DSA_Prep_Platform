#!/usr/bin/env bash

# Handle clean exit when pressing Ctrl+C
cleanup() {
    echo ""
    echo "Stopping servers..."
    kill $(jobs -p) 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo "🚀 Starting Backend and Frontend servers..."

# Start backend in background
npm run dev --prefix backend &

# Start frontend in background
npm run dev --prefix frontend &

# Wait for both processes
wait
