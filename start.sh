#!/bin/bash
# OrçamentosOnline Railway Deployment Script
# CRONOS Agent - Cloud Platform and DevOps Specialist

echo "🚀 Starting OrçamentosOnline Platform..."

# Check if we're deploying frontend or API based on environment
if [[ "$RAILWAY_SERVICE_NAME" == "frontend" ]]; then
    echo "📱 Starting Frontend Service (Next.js)..."
    cd services/frontend
    npm start
elif [[ "$RAILWAY_SERVICE_NAME" == "api" ]]; then
    echo "🔧 Starting API Service (Node.js)..."
    cd services/api
    npm start
else
    echo "❓ Service type not specified. Defaulting to full stack..."
    echo "🔧 Starting API Service..."
    cd services/api && npm start &
    echo "📱 Starting Frontend Service..."
    cd services/frontend && npm start
fi