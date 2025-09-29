# Railway Deployment Guide - OrçamentosOnline

## Overview

This guide provides step-by-step instructions for deploying the OrçamentosOnline platform to Railway, a modern cloud platform that simplifies deployment of containerized applications.

## Prerequisites

1. **Railway Account**: Create an account at [railway.app](https://railway.app)
2. **GitHub Repository**: Ensure your repository is accessible by Railway
3. **Railway CLI** (optional): Install for command-line deployment

## Project Architecture

The OrçamentosOnline platform consists of 4 services:

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
3. Set **Root Directory**: `services/api`
4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3000
   DATABASE_URL=[copy from PostgreSQL service]
   REDIS_URL=[copy from Redis service]
   JWT_SECRET=[your-jwt-secret-32-chars]
   ```
5. Deploy and wait for completion

**Step 4: Deploy Frontend Service**
1. Click "+" to add service
2. Select "GitHub Repo" → `fabiohfernandes/OrcamentosOnline`
3. Set **Root Directory**: `services/frontend`
4. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=3001
   NEXT_PUBLIC_API_URL=https://[your-api-service-url]
   ```
5. Deploy and wait for completion

### 3. Deploy via Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy all services
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

1. **Database Connection Errors**
   - Verify `POSTGRES_PASSWORD` is set
   - Check PostgreSQL service is running
   - Review API service logs

2. **Frontend API Connection Issues**
   - Verify `NEXT_PUBLIC_API_URL` points to correct API domain
   - Check CORS configuration in API service

3. **Build Failures**
   - Review build logs in Railway dashboard
   - Verify all dependencies are in package.json
   - Check Dockerfile syntax

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

Expected monthly cost for OrçamentosOnline:
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
2. ✅ Connect GitHub repository
3. ✅ Set environment variables (passwords, secrets)
4. ✅ Deploy via dashboard or CLI
5. ✅ Monitor deployment logs
6. ✅ Test application functionality
7. ✅ Configure custom domains (optional)

**Total Deployment Time**: 10-15 minutes

**Platform Status**: 🚀 Production-ready with all features operational