# Railway Deployment Instructions

## Repository Structure ✅ READY

This repository is properly configured for Railway deployment with individual services.

### Services Configuration

**API Service (`services/api/`):**
- ✅ Package.json with proper start script: `node src/index.js`
- ✅ Dockerfile configured for production
- ✅ Environment variables: NODE_ENV, PORT, DATABASE_URL, REDIS_URL, JWT_SECRET

**Frontend Service (`services/frontend/`):**
- ✅ Package.json with Next.js start script: `next start -p 3001`
- ✅ Dockerfile configured for production
- ✅ Environment variables: NODE_ENV, PORT, NEXT_PUBLIC_API_URL

### Railway Deployment Steps

**1. Create New Project:**
```bash
railway init --name "orcamentos-online"
```

**2. Add Databases:**
```bash
railway add --database postgres
railway add --database redis
```

**3. Add Services:**
```bash
# Add API service
railway add --service api --repo fabiohfernandes/OrcamentosOnline
# Set Root Directory: services/api

# Add Frontend service
railway add --service frontend --repo fabiohfernandes/OrcamentosOnline
# Set Root Directory: services/frontend
```

**4. Set Environment Variables:**

**API Service:**
```
NODE_ENV=production
PORT=3000
JWT_SECRET=[32-char-secret]
DATABASE_URL=[auto-generated]
REDIS_URL=[auto-generated]
CORS_ORIGIN=*
```

**Frontend Service:**
```
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=[api-service-url]
```

**5. Generate Public Domains:**
```bash
railway domain --service api
railway domain --service frontend
```

## Critical Settings ⚠️

**MUST set Root Directory for each service:**
- API service: `services/api`
- Frontend service: `services/frontend`

This ensures Railway uses the service-specific package.json files instead of the root workspace configuration.

## Repository Status: ✅ DEPLOYMENT READY