# Railway Deployment Guide - WebPropostas

## Overview

This guide provides step-by-step instructions for deploying the WebPropostas platform to Railway, a modern cloud platform that simplifies deployment of containerized applications.

## Prerequisites

1. **Railway Account**: Create an account at [railway.app](https://railway.app)
2. **GitHub Repository**: Ensure your repository is accessible by Railway
3. **Railway CLI** (optional): Install for command-line deployment

## Project Architecture

The WebPropostas platform consists of 4 services:

- **Frontend**: Next.js application (Port 3001)
- **API**: Node.js/Express backend (Port 3000)
- **PostgreSQL**: Database service
- **Redis**: Caching and session management

## Deployment Steps

### 1. Environment Variables Setup

Before deployment, you'll need to configure these environment variables in Railway:

#### Required Secrets (Create these first in Railway dashboard)
```
POSTGRES_PASSWORD=your_secure_postgres_password
REDIS_PASSWORD=your_secure_redis_password
JWT_SECRET=your_jwt_secret_key_min_32_chars
```

#### Auto-configured Variables (Railway will set these automatically)
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `RAILWAY_PUBLIC_DOMAIN`: Service public domains

### 2. Deploy Services Individually via Railway Dashboard

**Step 1: Create New Project**
1. Go to Railway dashboard
2. Click "New Project"
3. Select "Empty Project"

**Step 2: Deploy Database Services**

1. **Add PostgreSQL**
   - Click "+" to add service
   - Select "Database" → "PostgreSQL"
   - Note the connection details

2. **Add Redis**
   - Click "+" to add service
   - Select "Database" → "Redis"
   - Note the connection details

**Step 3: Deploy API Service**
1. Click "+" to add service
2. Select "GitHub Repo" → `fabiohfernandes/OrcamentosOnline`
3. **🚨 CRITICAL**: After selecting repo, **IMMEDIATELY** go to **Settings** tab
4. **Settings** → **Source**:
   - Set **Root Directory**: `services/api` (⚠️ THIS IS ESSENTIAL)
   - Verify it shows "services/api" in the field
5. **Settings** → **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=[copy from PostgreSQL Variables tab]
   REDIS_URL=[copy from Redis Variables tab]
   JWT_SECRET=[your-32-char-secret]
   CORS_ORIGIN=*
   ```
6. **Settings** → **Networking** tab:
   - Enable **Public Networking** (toggle ON)
   - Railway will generate a public domain automatically
7. **Settings** → **Deploy** tab, then click **Deploy**
8. **Verify**:
   - Build logs show building from services/api directory
   - After deployment, service shows a public URL (e.g., `xyz-production.up.railway.app`)

**Step 4: Deploy Frontend Service**
1. Click "+" to add service
2. Select "GitHub Repo" → `fabiohfernandes/OrcamentosOnline`
3. **🚨 CRITICAL**: After selecting repo, **IMMEDIATELY** go to **Settings** tab
4. **Settings** → **Source**:
   - Set **Root Directory**: `services/frontend` (⚠️ THIS IS ESSENTIAL)
   - Verify it shows "services/frontend" in the field
5. **Settings** → **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   NEXT_PUBLIC_API_URL=https://[api-service-domain]
   ```
6. **Settings** → **Networking** tab:
   - Enable **Public Networking** (toggle ON)
   - Railway will generate a public domain automatically
7. **Settings** → **Deploy** tab, then click **Deploy**
8. **Verify**:
   - Build logs show building from services/frontend directory
   - After deployment, service shows a public URL (e.g., `abc-production.up.railway.app`)

### 3. Alternative: Template-Based Deployment

If manual deployment continues to fail, use Railway templates:

**Option A - Node.js Template Deployment:**
1. Go to Railway dashboard
2. Click "New Project" → "Template"
3. Search for "Node.js" template
4. Use template, then connect your GitHub repo
5. Set root directory after template creation

**Option B - Direct Service Creation:**
1. **Create API Service:**
   ```bash
   # Using Railway CLI in services/api directory
   cd services/api
   railway init
   railway up
   ```

2. **Create Frontend Service:**
   ```bash
   # Using Railway CLI in services/frontend directory
   cd services/frontend
   railway init
   railway up
   ```

### 4. Manual Railway CLI Deployment

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy API service
cd services/api
railway init --name "orcamentos-api"
railway up

# Deploy Frontend service
cd ../frontend
railway init --name "orcamentos-frontend"
railway up
```

### 4. Post-Deployment Configuration

#### Database Setup
After PostgreSQL is running, the API service will automatically:
- Run database migrations
- Create initial tables
- Set up required indexes

#### Domain Configuration
1. **API Service**: Configure custom domain (optional)
   - Example: `api.your-domain.com`

2. **Frontend Service**: Configure custom domain (optional)
   - Example: `app.your-domain.com`

3. **Update CORS Origins**: Update API service environment variables if using custom domains

## Service Configuration Details

### Frontend Service
- **Build**: Uses `services/frontend/Dockerfile` with production target
- **Port**: 3001
- **Environment**:
  - `NEXT_PUBLIC_API_URL`: Automatically set to API service URL
  - `NODE_ENV=production`

### API Service
- **Build**: Uses `services/api/Dockerfile` with production target
- **Port**: 3000
- **Environment**:
  - `DATABASE_URL`: Auto-connected to PostgreSQL
  - `REDIS_URL`: Auto-connected to Redis
  - `CORS_ORIGIN`: Auto-set to frontend URL

### PostgreSQL Service
- **Image**: `postgres:15-alpine`
- **Database**: `orcamentos_prod`
- **Persistent Volume**: `/var/lib/postgresql/data`

### Redis Service
- **Image**: `redis:7-alpine`
- **Authentication**: Password-protected
- **Persistent Volume**: `/data`

## Health Checks

Railway automatically monitors service health using configured endpoints:

- **Frontend**: `GET /api/health`
- **API**: `GET /api/v1/health`

## Scaling & Performance

Railway automatically handles:
- **Auto-scaling**: Based on traffic demand
- **Load balancing**: Across service instances
- **CDN**: Global content delivery for static assets

## Monitoring & Logs

Access real-time logs and metrics:
1. Go to Railway dashboard
2. Select your project
3. Click on any service to view:
   - Live logs
   - Metrics (CPU, Memory, Network)
   - Deployment history

## Troubleshooting

### Common Issues

1. **Build Timeout (Most Common)**
   - **Problem**: "Build timed out" error after 44+ minutes
   - **Cause**: Railway building entire monorepo instead of specific service
   - **Solution**:
     - ⚠️ **CRITICAL**: Set **Root Directory** BEFORE first deployment
     - Go to **Settings** → **Source** → **Root Directory**
     - API service: `services/api`
     - Frontend service: `services/frontend`
     - **Redeploy** after setting root directory
   - **Verification**: Build logs should show building from service directory, not root

2. **Database Connection Errors**
   - Verify `POSTGRES_PASSWORD` is set
   - Check PostgreSQL service is running
   - Review API service logs
   - Ensure `DATABASE_URL` is copied exactly from PostgreSQL Variables tab

3. **Frontend API Connection Issues**
   - Verify `NEXT_PUBLIC_API_URL` points to correct API domain
   - Check CORS configuration in API service (`CORS_ORIGIN=*` for testing)
   - Ensure API service is deployed and running before frontend

4. **No Public URL Generated (CRITICAL ISSUE)**
   - **Problem**: Service shows only internal port (e.g., `:3000`), no public domain
   - **Multiple Solutions to Try**:

   **Solution A - Enable Public Networking:**
   - Go to service **Settings** → **Networking**
   - Toggle **Public Networking** to ON
   - Wait 1-2 minutes for Railway to generate domain

   **Solution B - Force Port Configuration:**
   - Go to **Settings** → **Variables**
   - Add: `PORT = 3000` (for API) or `PORT = 3001` (for frontend)
   - Redeploy service

   **Solution C - Manual Domain Generation:**
   - Go to **Settings** → **Networking**
   - Click **Generate Domain** button manually
   - Select public domain option

   **Solution D - Service Type Detection:**
   - Delete and recreate service
   - When creating, Railway should auto-detect as "Web Service"
   - Ensure service type shows as "Web" not "Worker"

5. **Build Failures**
   - Review build logs in Railway dashboard
   - Verify all dependencies are in package.json
   - For API: Use build command `npm install --only=production`
   - For Frontend: Use build command `npm run build`

### Log Access
```bash
# Using Railway CLI
railway logs --service=api
railway logs --service=frontend
railway logs --service=postgres
railway logs --service=redis
```

## Production Considerations

### Security
- All services run as non-root users
- Environment variables are encrypted
- Database and Redis are password-protected
- JWT secrets are securely managed

### Performance
- Production-optimized Docker builds
- Static asset optimization (Next.js)
- Database connection pooling
- Redis caching enabled

### Backup & Recovery
- **Database**: Railway provides automated backups
- **Code**: Version controlled via GitHub
- **Environment**: Document all environment variables

## Cost Estimation

Railway pricing is based on:
- **Compute usage**: $0.000463 per GB-hour
- **Network**: $0.10 per GB
- **Free tier**: $5/month credit for personal projects

Expected monthly cost for WebPropostas:
- **Small usage**: ~$10-20/month
- **Medium usage**: ~$20-50/month
- **High usage**: $50+/month

## Support

- **Railway Documentation**: [docs.railway.app](https://docs.railway.app)
- **Discord Community**: [railway.app/discord](https://railway.app/discord)
- **Project Repository**: Issues and discussions

---

## Quick Deploy Summary

1. ✅ Create Railway account
2. ✅ Create empty project
3. ✅ Add PostgreSQL + Redis databases
4. ✅ Deploy API service:
   - Root Directory: `services/api`
   - **Enable Public Networking**
   - Set environment variables
5. ✅ Deploy Frontend service:
   - Root Directory: `services/frontend`
   - **Enable Public Networking**
   - Set `NEXT_PUBLIC_API_URL` to API service domain
6. ✅ Test application functionality

**Total Deployment Time**: 15-20 minutes

**Critical Steps**:
- ⚠️ Set Root Directory immediately after repo selection
- ⚠️ Enable Public Networking for URL generation
- ⚠️ Verify build logs show correct service directory

**Platform Status**: 🚀 Production-ready with all features operational