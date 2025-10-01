#!/bin/bash
# Railway Deployment Script - WebPropostas
# This script helps deploy all services to Railway

set -e  # Exit on error

echo "🚀 WebPropostas - Railway Deployment Script"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Secrets (Generated)
JWT_SECRET="eb7c3a8192652e9b3119d75761415e03ec1f2ac5de96da2cdd5a9ad156ac0217"
JWT_REFRESH_SECRET="9e9026e33844dc2d2f91737b060167245fec02d470e9d0498668df48e8e9974b"
SESSION_SECRET="f77b0d4afa69345a98e21de2e2be48ef2e8e3bcf028bda7032ff5edbc291e93b"

echo "✅ Generated JWT Secrets"
echo "   JWT_SECRET: ${JWT_SECRET:0:32}..."
echo "   JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET:0:32}..."
echo "   SESSION_SECRET: ${SESSION_SECRET:0:32}..."
echo ""

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not found. Please install it first:${NC}"
    echo "   npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI installed: $(railway --version)"
echo ""

# Check authentication
if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Railway${NC}"
    echo "   Please run: railway login"
    exit 1
fi

RAILWAY_USER=$(railway whoami)
echo "✅ Logged in as: $RAILWAY_USER"
echo ""

# Project info
PROJECT_ID="8813d495-aad1-4b19-8cca-2c7f2861bd54"
PROJECT_URL="https://railway.com/project/$PROJECT_ID"

echo "📋 Railway Project Information"
echo "   Project: orcamentos-online"
echo "   URL: $PROJECT_URL"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANT: Railway CLI requires manual dashboard setup for databases${NC}"
echo ""
echo "Please complete these steps in the Railway dashboard:"
echo ""
echo "1️⃣  Open: $PROJECT_URL"
echo ""
echo "2️⃣  Add PostgreSQL:"
echo "    - Click '+ New' button"
echo "    - Select 'Database' → 'Add PostgreSQL'"
echo "    - Wait for deployment (~1 minute)"
echo ""
echo "3️⃣  Add Redis:"
echo "    - Click '+ New' button"
echo "    - Select 'Database' → 'Add Redis'"
echo "    - Wait for deployment (~1 minute)"
echo ""
echo "4️⃣  Get connection strings:"
echo "    - Click PostgreSQL service → Variables tab"
echo "    - Copy DATABASE_URL value"
echo "    - Click Redis service → Variables tab"
echo "    - Copy REDIS_URL value"
echo ""

read -p "Press ENTER when databases are created and you have the connection strings..."

echo ""
echo "📝 Please paste the DATABASE_URL:"
read DATABASE_URL

echo ""
echo "📝 Please paste the REDIS_URL:"
read REDIS_URL

echo ""
echo "✅ Connection strings received"
echo ""

# Create environment files
echo "📝 Creating environment variable files..."

# Backend environment variables
cat > deploy/backend-env.txt <<EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=$DATABASE_URL
REDIS_URL=$REDIS_URL
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SESSION_SECRET=$SESSION_SECRET
CORS_ORIGIN=*
FRONTEND_URL=https://orcamentos-online-production.up.railway.app
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/uploads
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=12
EOF

echo "✅ Backend environment variables saved to deploy/backend-env.txt"

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Next steps to deploy services:"
echo ""
echo "5️⃣  Deploy Backend API:"
echo "    - Click '+ New' → 'GitHub Repo' → Select 'OrcamentosOnline'"
echo "    - Name it: 'backend-api'"
echo "    - Go to Settings → Source → Set Root Directory: services/api"
echo "    - Go to Variables → Raw Editor → Paste contents from: deploy/backend-env.txt"
echo "    - Go to Settings → Networking → Enable 'Public Networking'"
echo "    - Click Deploy"
echo ""
echo "6️⃣  Deploy Frontend:"
echo "    - Click '+ New' → 'GitHub Repo' → Select 'OrcamentosOnline'"
echo "    - Name it: 'frontend'"
echo "    - Go to Settings → Source → Set Root Directory: services/frontend"
echo "    - Go to Variables → Add:"
echo "      NODE_ENV=production"
echo "      PORT=3001"
echo "      NEXT_PUBLIC_API_URL=<backend-api-url-from-step-5>"
echo "    - Go to Settings → Networking → Enable 'Public Networking'"
echo "    - Click Deploy"
echo ""
echo "Environment variables file: deploy/backend-env.txt"
echo "JWT Secrets are ready to use!"
echo ""