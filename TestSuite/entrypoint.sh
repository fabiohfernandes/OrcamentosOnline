#!/bin/bash

# TESTER Entrypoint Script
echo "🤖 Starting TESTER - Autonomous Stress Testing System"

# Wait for dependencies
echo "⏳ Waiting for dependencies..."

# Wait for PostgreSQL
until pg_isready -h postgres -p 5432 -U testeruser; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

# Wait for Redis
until redis-cli -h redis ping > /dev/null 2>&1; do
  echo "Waiting for Redis..."
  sleep 2
done

echo "✅ All dependencies are ready!"

# Initialize project detection
if [ -z "$PROJECT_NAME" ]; then
  if [ -d "/workspace/.git" ]; then
    PROJECT_NAME=$(basename $(git -C /workspace remote get-url origin 2>/dev/null || echo "unknown-project"))
    export PROJECT_NAME
  fi
fi

echo "🎯 Testing project: $PROJECT_NAME"
echo "🌐 Target URL: $TARGET_URL"
echo "📊 Dashboard will be available at: http://localhost:8888"

# Start background services
echo "🚀 Starting TESTER services..."

# Start metrics server in background
node src/monitoring/metricsServer.js &

# Start main TESTER application
npm start