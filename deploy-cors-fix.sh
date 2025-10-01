#!/bin/bash
# Deploy CORS Fix to Railway
# This script updates CORS configuration and redeploys the backend

echo "🚀 WebPropostas - CORS Fix Deployment Script"
echo "=============================================="
echo ""

# Step 1: Navigate to API directory
echo "📁 Navigating to API directory..."
cd services/api || exit 1

# Step 2: Check Railway CLI
echo "🔍 Checking Railway CLI..."
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install: npm install -g @railway/cli"
    exit 1
fi

# Step 3: Check if logged in
echo "🔐 Checking Railway authentication..."
railway whoami || {
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
}

# Step 4: Show current project
echo ""
echo "📊 Current Railway status:"
railway status

# Step 5: Set CORS_ORIGIN variable
echo ""
echo "🌐 Setting CORS_ORIGIN environment variable..."
railway variables --set "CORS_ORIGIN=https://www.webpropostas.com.br,https://webpropostas.com.br" || {
    echo "⚠️  Failed to set CORS_ORIGIN. You may need to link to the correct service first."
}

# Step 6: Set FRONTEND_URL variable
echo ""
echo "🔗 Setting FRONTEND_URL environment variable..."
railway variables --set "FRONTEND_URL=https://www.webpropostas.com.br" || {
    echo "⚠️  Failed to set FRONTEND_URL."
}

# Step 7: Deploy
echo ""
echo "🚀 Deploying backend service..."
railway up || {
    echo "❌ Deployment failed!"
    exit 1
}

echo ""
echo "✅ Deployment initiated successfully!"
echo ""
echo "⏳ Wait 2-3 minutes for deployment to complete, then test:"
echo "   curl https://[your-backend-url]/api/v1/debug/cors"
echo ""
echo "🌐 Your frontend should now work at: https://www.webpropostas.com.br"
