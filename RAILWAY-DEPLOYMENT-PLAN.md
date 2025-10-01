# Railway Deployment Implementation Plan - WebPropostas

## Executive Summary

This document provides a comprehensive, zero-error deployment plan for deploying the **WebPropostas** platform to Railway. The platform is an AI-driven commercial proposal platform for the Brazilian market, featuring a Next.js 14 frontend, Node.js/Express backend, PostgreSQL database, and Redis cache with full LGPD compliance.

**Deployment Timeline:** 2-3 hours for initial setup, 30-45 minutes for subsequent deployments

**Success Criteria:** Zero deployment errors, 100% feature availability, full database migration, LGPD compliance maintained

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Pre-Deployment Checklist](#2-pre-deployment-checklist)
3. [Environment Variables Configuration](#3-environment-variables-configuration)
4. [Service-by-Service Deployment Strategy](#4-service-by-service-deployment-strategy)
5. [Step-by-Step Deployment Procedure](#5-step-by-step-deployment-procedure)
6. [Post-Deployment Verification](#6-post-deployment-verification)
7. [Error Prevention Strategy](#7-error-prevention-strategy)
8. [Rollback Plan](#8-rollback-plan)
9. [Monitoring and Maintenance](#9-monitoring-and-maintenance)
10. [Cost Estimation](#10-cost-estimation)
11. [Timeline and Milestones](#11-timeline-and-milestones)

---

## 1. Architecture Overview

### 1.1 Current Local Stack

```
┌─────────────────────────────────────────────────────────┐
│                    WebPropostas                     │
│                 Docker Compose Stack                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend (Next.js 14)    Backend (Node.js/Express)    │
│  ├─ React 18              ├─ Express 4.18              │
│  ├─ TypeScript            ├─ PostgreSQL Client         │
│  ├─ Zustand State         ├─ Redis Client              │
│  ├─ React Query           ├─ JWT Auth                  │
│  ├─ Tailwind CSS          ├─ Bcryptjs                  │
│  └─ Port: 3001            └─ Port: 3000                │
│                                                         │
│  Database (PostgreSQL)    Cache (Redis)                │
│  ├─ PostgreSQL 15         ├─ Redis 7                   │
│  ├─ Multi-tenant schema   ├─ Session store             │
│  ├─ 7 tables              ├─ Cache layer               │
│  └─ Port: 5432            └─ Port: 6379                │
└─────────────────────────────────────────────────────────┘
```

### 1.2 Railway Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Railway Platform                    │
│                 proposals.infigital.net                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Frontend Service          Backend API Service         │
│  ├─ Domain: proposals.    ├─ Domain: api.proposals.   │
│  │   infigital.net        │   infigital.net            │
│  ├─ Auto-scaling          ├─ Auto-scaling              │
│  ├─ SSL/TLS (auto)        ├─ SSL/TLS (auto)            │
│  └─ CDN enabled           └─ Health checks             │
│                                                         │
│  PostgreSQL Service        Redis Service               │
│  ├─ Railway Postgres      ├─ Railway Redis             │
│  ├─ Auto backups          ├─ Persistence enabled       │
│  ├─ Connection pooling    ├─ Eviction policy           │
│  └─ Private network       └─ Private network           │
└─────────────────────────────────────────────────────────┘
```

### 1.3 Key Architecture Differences

| Component | Local Development | Railway Production |
|-----------|------------------|-------------------|
| **Frontend** | Next.js dev server (3001) | Next.js standalone build |
| **Backend** | Express with nodemon | Express production mode |
| **Database** | Docker PostgreSQL | Railway managed PostgreSQL |
| **Redis** | Docker Redis | Railway managed Redis |
| **HTTPS** | HTTP only | Automatic SSL/TLS |
| **Networking** | Docker bridge | Railway private network |
| **Secrets** | .env file | Railway variables (encrypted) |
| **Logs** | Console output | Railway logging system |

---

## 2. Pre-Deployment Checklist

### 2.1 Critical Requirements (Must Complete)

#### A. Repository Preparation
- [ ] **Git Status Clean** - All changes committed and pushed to GitHub
  ```bash
  git status  # Should show "working tree clean"
  git push origin master
  ```

- [ ] **No Secrets in Code** - Verify no hardcoded credentials
  ```bash
  # Run security scan
  git grep -i "api_key.*=.*['\"][a-zA-Z0-9]" -- ':!node_modules' ':!*.md'
  git grep -i "password.*=.*['\"][a-zA-Z0-9]" -- ':!node_modules' ':!*.md'
  ```

- [ ] **Environment Example Updated** - `.env.example` contains all required variables
  ```bash
  cat .env.example  # Verify all variables documented
  ```

- [ ] **Lock Files Committed** - Both services have package-lock.json committed
  ```bash
  git ls-files | grep package-lock.json  # Should show 2 files
  ```

#### B. Code Validation
- [ ] **Backend Health Endpoint** - Verify `/api/v1/health` exists and works
  ```bash
  curl http://localhost:3000/api/v1/health
  # Expected: {"success": true, "status": "healthy"}
  ```

- [ ] **Frontend Build Success** - Verify Next.js standalone build works
  ```bash
  cd services/frontend
  npm run build
  # Should complete without errors
  ```

- [ ] **Backend Starts Successfully** - Verify API starts without crashes
  ```bash
  cd services/api
  npm start
  # Should show "Server running on port 3000"
  ```

- [ ] **Database Schema Script** - Verify schema.js creates tables correctly
  ```bash
  # Check if schema.js exists
  ls services/api/src/models/schema.js
  ```

#### C. Railway Prerequisites
- [ ] **Railway CLI Installed**
  ```bash
  railway --version
  # If not installed: npm i -g @railway/cli
  ```

- [ ] **Railway CLI Authenticated**
  ```bash
  railway whoami
  # Should show your Railway account email
  ```

- [ ] **GitHub Account Connected** - Railway linked to GitHub account
  - Visit: https://railway.app/account/settings
  - Verify GitHub connection status

### 2.2 Recommended Preparations (Should Complete)

- [ ] **Backup Current Data** - Export any important local data
  ```bash
  # PostgreSQL backup
  docker exec orcamentos-postgres pg_dump -U orcamentos_user orcamentos > backup_$(date +%Y%m%d).sql
  ```

- [ ] **Test Data Prepared** - Have test user credentials ready for verification
  - Test user: test@infigital.net
  - Test password: (prepare securely)

- [ ] **Documentation Review** - Read Railway error library and recovery playbook
  - `.vibecoding/Procedures/Railway_error_library.md`
  - `.vibecoding/Procedures/Railway_recovery_playbook.md`

---

## 3. Environment Variables Configuration

### 3.1 Backend API Service Variables

#### Critical Variables (Must Set)
```bash
# === Authentication & Security ===
NODE_ENV=production
JWT_SECRET=<generate_with_openssl_rand_base64_64>
JWT_REFRESH_SECRET=<generate_with_openssl_rand_base64_64>
SESSION_SECRET=<generate_with_openssl_rand_base64_64>
BCRYPT_ROUNDS=12

# === Database Connection (Railway Reference) ===
DATABASE_URL=${{Postgres.DATABASE_URL}}

# === Redis Connection (Railway Reference) ===
REDIS_URL=${{Redis.REDIS_URL}}

# === CORS Configuration ===
CORS_ORIGIN=https://proposals.infigital.net
FRONTEND_URL=https://proposals.infigital.net

# === Server Configuration ===
PORT=${PORT}  # Railway provides this automatically
```

#### Optional Variables (Configure as Needed)
```bash
# === Rate Limiting ===
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# === File Upload ===
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/tmp/uploads

# === AWS S3 (if using) ===
AWS_ACCESS_KEY_ID=<your_aws_key>
AWS_SECRET_ACCESS_KEY=<your_aws_secret>
AWS_REGION=sa-east-1
AWS_S3_BUCKET=orcamentos-files-prod

# === Email Configuration (if using) ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your_email>
SMTP_PASS=<your_email_password>
FROM_EMAIL=noreply@infigital.net
```

### 3.2 Frontend Service Variables

#### Critical Variables (Must Set)
```bash
# === Environment ===
NODE_ENV=production

# === API Configuration ===
NEXT_PUBLIC_API_URL=https://api.proposals.infigital.net/api/v1
NEXT_PUBLIC_WS_URL=wss://api.proposals.infigital.net

# === Application Info ===
NEXT_PUBLIC_APP_NAME=WebPropostas
NEXT_PUBLIC_APP_VERSION=1.0.0

# === Server Configuration ===
PORT=${PORT}  # Railway provides this automatically
```

### 3.3 Shared/Project-Level Variables

These should be set at the project level and shared across services:

```bash
# === Brazilian Market Settings ===
DEFAULT_LOCALE=pt_BR
TIMEZONE=America/Sao_Paulo

# === Feature Flags ===
FEATURE_WHATSAPP_NOTIFICATIONS=false  # Enable after setup
FEATURE_TELEGRAM_NOTIFICATIONS=false   # Enable after setup
FEATURE_CANVA_IMPORT=false            # Enable after setup
```

### 3.4 Variable Generation Commands

```bash
# Generate strong JWT secrets
openssl rand -base64 64

# Generate session secret
openssl rand -base64 64

# Generate backup encryption key
openssl rand -base64 32
```

---

## 4. Service-by-Service Deployment Strategy

### 4.1 PostgreSQL Database Setup

**Order:** Deploy First (Foundation)

#### Configuration
- **Service Type:** PostgreSQL 15
- **Plan:** Starter (can upgrade later)
- **Regions:** US West (or closest to your users)
- **Connection:** Private network only

#### Initial Setup Steps
```bash
# 1. Add PostgreSQL service via Railway CLI
railway add

# Select: PostgreSQL

# 2. Verify database created
railway status | grep -i postgres

# 3. Get database connection string (automatic)
railway variables | grep DATABASE_URL
```

#### Schema Initialization
The backend service will automatically create tables on first startup via `schema.js`. No manual SQL execution needed.

**Expected Tables:**
1. `users` - User accounts and authentication
2. `clients` - Client information
3. `proposals` - Proposal documents
4. `proposal_sections` - Proposal content sections
5. `proposal_activities` - Activity log
6. `lgpd_audit_log` - LGPD compliance logging
7. `sessions` - JWT session management

### 4.2 Redis Cache Setup

**Order:** Deploy Second (Dependency for Backend)

#### Configuration
- **Service Type:** Redis 7
- **Plan:** Starter
- **Persistence:** Enabled
- **Eviction Policy:** allkeys-lru

#### Setup Steps
```bash
# 1. Add Redis service
railway add

# Select: Redis

# 2. Verify Redis created
railway status | grep -i redis

# 3. Connection string available automatically
railway variables | grep REDIS_URL
```

#### Redis Configuration
Railway's Redis comes pre-configured with:
- Persistence: RDB + AOF
- Max Memory: 256MB (starter plan)
- Eviction: allkeys-lru (suitable for caching)

### 4.3 Backend API Service

**Order:** Deploy Third (Core Service)

#### Railway Configuration
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd services/api && npm ci --only=production"
  },
  "deploy": {
    "startCommand": "cd services/api && npm start",
    "healthcheckPath": "/api/v1/health",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

#### Root Directory Setting
**CRITICAL:** Set root directory to `/services/api` in Railway dashboard:
- Go to: Service Settings → General → Root Directory
- Set to: `services/api`
- This prevents build timeouts and ensures correct dependency installation

#### Networking Setup
- **Public Domain:** Generate for API access (api.proposals.infigital.net)
- **Internal Port:** 3000 (from service code)
- **Target Port:** Leave as default or set to 3000

#### Environment Variables (via CLI)
```bash
# Switch to backend service context
railway link [project-id] --service backend

# Set critical variables
railway variables set NODE_ENV production
railway variables set JWT_SECRET "$(openssl rand -base64 64)"
railway variables set JWT_REFRESH_SECRET "$(openssl rand -base64 64)"
railway variables set SESSION_SECRET "$(openssl rand -base64 64)"
railway variables set BCRYPT_ROUNDS 12

# Set database reference
railway variables set DATABASE_URL '${{Postgres.DATABASE_URL}}'

# Set Redis reference
railway variables set REDIS_URL '${{Redis.REDIS_URL}}'

# Set CORS (update after frontend deployed)
railway variables set CORS_ORIGIN 'https://proposals.infigital.net'
railway variables set FRONTEND_URL 'https://proposals.infigital.net'

# File upload settings
railway variables set MAX_FILE_SIZE 10485760
railway variables set UPLOAD_PATH '/tmp/uploads'

# Rate limiting
railway variables set RATE_LIMIT_WINDOW 15
railway variables set RATE_LIMIT_MAX 100
```

#### Deployment Command
```bash
# From project root
railway up --service backend
```

#### Expected Build Output
```
Building...
├─ Installing dependencies...
├─ Running npm ci --only=production...
├─ Dependencies installed: 33 packages
├─ Build completed in 2m 15s
└─ Deployment successful

Starting...
├─ Connecting to PostgreSQL...
├─ Initializing database schema...
├─ ✅ Users table created/verified
├─ ✅ Clients table created/verified
├─ ✅ Proposals table created/verified
├─ ✅ Proposal sections table created/verified
├─ ✅ Proposal activities table created/verified
├─ ✅ LGPD audit log table created/verified
├─ ✅ Sessions table created/verified
├─ Database schema initialized successfully
├─ Connecting to Redis...
├─ Redis connection established
└─ Server running on port 3000
```

### 4.4 Frontend Service

**Order:** Deploy Last (Requires Backend URL)

#### Railway Configuration
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd services/frontend && npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "cd services/frontend && npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

#### Root Directory Setting
**CRITICAL:** Set root directory to `/services/frontend` in Railway dashboard:
- Go to: Service Settings → General → Root Directory
- Set to: `services/frontend`

#### Environment Variables (via CLI)
```bash
# Switch to frontend service context
railway link [project-id] --service frontend

# Set environment
railway variables set NODE_ENV production

# Set API URLs (use actual backend domain from step 4.3)
railway variables set NEXT_PUBLIC_API_URL 'https://[backend-domain]/api/v1'
railway variables set NEXT_PUBLIC_WS_URL 'wss://[backend-domain]'

# Application info
railway variables set NEXT_PUBLIC_APP_NAME 'WebPropostas'
railway variables set NEXT_PUBLIC_APP_VERSION '1.0.0'
```

#### Deployment Command
```bash
# From project root
railway up --service frontend
```

#### Expected Build Output
```
Building...
├─ Installing dependencies...
├─ Running npm ci...
├─ Dependencies installed: 54 packages
├─ Running build command...
├─ Creating optimized production build...
├─ Compiled successfully
├─ Creating standalone bundle...
├─ Build completed in 4m 32s
└─ Deployment successful

Starting...
├─ Starting Next.js production server...
├─ Server listening on port 3000
└─ Ready on http://0.0.0.0:3000
```

---

## 5. Step-by-Step Deployment Procedure

### Phase 1: Railway Project Setup (15 minutes)

#### Step 1.1: Create Railway Project
```bash
# Login to Railway
railway login

# Create new project
railway init

# When prompted:
# - Project name: orcamentos-online-production
# - Template: Empty Project
```

#### Step 1.2: Link GitHub Repository
```bash
# Link GitHub repository
railway link

# Or via Dashboard:
# 1. Open Railway dashboard
# 2. Select project
# 3. Settings → GitHub → Connect Repository
# 4. Select: WebPropostas repository
# 5. Branch: master
```

#### Step 1.3: Create Production Environment
```bash
# Create production environment
railway environment new production

# Switch to production
railway environment production

# Verify
railway status
# Should show: Environment: production
```

---

### Phase 2: Database Services Deployment (10 minutes)

#### Step 2.1: Add PostgreSQL Database
```bash
# Add PostgreSQL service
railway add

# Interactive prompt:
# > PostgreSQL
# Wait for provisioning... (2-3 minutes)

# Verify creation
railway status | grep -i postgres
# Should show: ✓ PostgreSQL Running

# Note the auto-generated DATABASE_URL
railway variables | grep DATABASE_URL
```

#### Step 2.2: Add Redis Cache
```bash
# Add Redis service
railway add

# Interactive prompt:
# > Redis
# Wait for provisioning... (2-3 minutes)

# Verify creation
railway status | grep -i redis
# Should show: ✓ Redis Running

# Note the auto-generated REDIS_URL
railway variables | grep REDIS_URL
```

---

### Phase 3: Backend API Deployment (30 minutes)

#### Step 3.1: Create Backend Service
```bash
# Add new service from GitHub
# Via Dashboard:
# 1. Dashboard → Add Service → GitHub Repo
# 2. Select: WebPropostas
# 3. Service name: backend-api
# 4. Wait for initial detection
```

#### Step 3.2: Configure Backend Service
```bash
# Link to backend service
railway link [project-id] --service backend-api

# Set root directory
# Dashboard → Service Settings → General
# Root Directory: services/api

# Set build and start commands
# Dashboard → Service Settings → Deploy
# Build Command: npm ci --only=production
# Start Command: npm start
```

#### Step 3.3: Configure Environment Variables

Create a script to set all variables at once:

```bash
# Create: deploy/set-backend-env.sh
#!/bin/bash
set -e

echo "Setting backend environment variables..."

# Core settings
railway variables set NODE_ENV production
railway variables set PORT 3000

# Generate and set secrets
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)

railway variables set JWT_SECRET "$JWT_SECRET"
railway variables set JWT_REFRESH_SECRET "$JWT_REFRESH_SECRET"
railway variables set SESSION_SECRET "$SESSION_SECRET"
railway variables set BCRYPT_ROUNDS 12

# JWT expiration
railway variables set JWT_EXPIRES_IN '15m'
railway variables set JWT_REFRESH_EXPIRES_IN '7d'

# Database references
railway variables set DATABASE_URL '${{Postgres.DATABASE_URL}}'
railway variables set REDIS_URL '${{Redis.REDIS_URL}}'

# CORS (temporary, will update after frontend deployed)
railway variables set CORS_ORIGIN 'http://localhost:3001'
railway variables set FRONTEND_URL 'http://localhost:3001'

# File upload
railway variables set MAX_FILE_SIZE 10485760
railway variables set UPLOAD_PATH '/tmp/uploads'

# Rate limiting
railway variables set RATE_LIMIT_WINDOW 15
railway variables set RATE_LIMIT_MAX 100

# Brazilian settings
railway variables set DEFAULT_LOCALE 'pt_BR'
railway variables set TIMEZONE 'America/Sao_Paulo'

echo "✅ Backend environment variables configured"
echo ""
echo "Generated secrets (SAVE THESE SECURELY):"
echo "JWT_SECRET: $JWT_SECRET"
echo "JWT_REFRESH_SECRET: $JWT_REFRESH_SECRET"
echo "SESSION_SECRET: $SESSION_SECRET"
```

```bash
# Run the script
chmod +x deploy/set-backend-env.sh
./deploy/set-backend-env.sh

# Verify all variables set
railway variables | wc -l
# Should show: 20+ variables
```

#### Step 3.4: Deploy Backend
```bash
# Trigger deployment
railway up --service backend-api

# Monitor deployment logs
railway logs --service backend-api --follow

# Watch for:
# ✅ Build completed
# ✅ Database schema initialized
# ✅ Server running on port 3000
```

#### Step 3.5: Generate Backend Domain
```bash
# Generate public domain
railway domain --service backend-api

# Get the domain
BACKEND_DOMAIN=$(railway status --service backend-api | grep -oP 'https://\K[^/]+')

echo "Backend deployed at: https://$BACKEND_DOMAIN"
echo "Save this domain for frontend configuration"
```

#### Step 3.6: Verify Backend Health
```bash
# Wait 30 seconds for full startup
sleep 30

# Test health endpoint
curl -I https://$BACKEND_DOMAIN/api/v1/health

# Expected: HTTP/2 200
```

---

### Phase 4: Frontend Deployment (30 minutes)

#### Step 4.1: Create Frontend Service
```bash
# Via Dashboard:
# 1. Dashboard → Add Service → GitHub Repo
# 2. Select: WebPropostas
# 3. Service name: frontend
# 4. Wait for initial detection
```

#### Step 4.2: Configure Frontend Service
```bash
# Link to frontend service
railway link [project-id] --service frontend

# Set root directory
# Dashboard → Service Settings → General
# Root Directory: services/frontend

# Set build and start commands
# Dashboard → Service Settings → Deploy
# Build Command: npm ci && npm run build
# Start Command: npm start
```

#### Step 4.3: Configure Environment Variables

```bash
# Create: deploy/set-frontend-env.sh
#!/bin/bash
set -e

echo "Setting frontend environment variables..."

# Core settings
railway variables set NODE_ENV production

# API URLs (use actual backend domain)
BACKEND_DOMAIN="<your-backend-domain-from-step-3-5>"
railway variables set NEXT_PUBLIC_API_URL "https://$BACKEND_DOMAIN/api/v1"
railway variables set NEXT_PUBLIC_WS_URL "wss://$BACKEND_DOMAIN"

# Application info
railway variables set NEXT_PUBLIC_APP_NAME 'WebPropostas'
railway variables set NEXT_PUBLIC_APP_VERSION '1.0.0'

# File upload config (must match backend)
railway variables set NEXT_PUBLIC_MAX_FILE_SIZE 10485760

echo "✅ Frontend environment variables configured"
```

```bash
# Run the script (update BACKEND_DOMAIN first!)
chmod +x deploy/set-frontend-env.sh
./deploy/set-frontend-env.sh

# Verify
railway variables | grep NEXT_PUBLIC
```

#### Step 4.4: Deploy Frontend
```bash
# Trigger deployment
railway up --service frontend

# Monitor deployment logs
railway logs --service frontend --follow

# Watch for:
# ✅ Dependencies installed
# ✅ Build completed
# ✅ Standalone server started
```

#### Step 4.5: Generate Frontend Domain
```bash
# Generate public domain
railway domain --service frontend

# Get the domain
FRONTEND_DOMAIN=$(railway status --service frontend | grep -oP 'https://\K[^/]+')

echo "Frontend deployed at: https://$FRONTEND_DOMAIN"
```

#### Step 4.6: Update CORS Configuration
Now that we have the frontend domain, update backend CORS:

```bash
# Switch to backend service
railway link [project-id] --service backend-api

# Update CORS origin
railway variables set CORS_ORIGIN "https://$FRONTEND_DOMAIN"
railway variables set FRONTEND_URL "https://$FRONTEND_DOMAIN"

# Trigger redeploy
railway up --service backend-api
```

---

### Phase 5: Custom Domain Setup (15 minutes - Optional)

#### Step 5.1: Configure DNS
```bash
# In your DNS provider (e.g., Cloudflare, Route53):
# Add CNAME records:

# Frontend
proposals.infigital.net → CNAME → [railway-frontend-domain]

# Backend API
api.proposals.infigital.net → CNAME → [railway-backend-domain]
```

#### Step 5.2: Add Custom Domains in Railway
```bash
# Via Dashboard:
# Frontend Service → Settings → Domains
# Add Domain: proposals.infigital.net

# Backend Service → Settings → Domains
# Add Domain: api.proposals.infigital.net

# Railway will automatically provision SSL certificates
```

#### Step 5.3: Update Environment Variables for Custom Domains
```bash
# Switch to frontend service
railway link [project-id] --service frontend

# Update API URLs
railway variables set NEXT_PUBLIC_API_URL 'https://api.proposals.infigital.net/api/v1'
railway variables set NEXT_PUBLIC_WS_URL 'wss://api.proposals.infigital.net'

# Redeploy frontend
railway up --service frontend

# Switch to backend service
railway link [project-id] --service backend-api

# Update CORS
railway variables set CORS_ORIGIN 'https://proposals.infigital.net'
railway variables set FRONTEND_URL 'https://proposals.infigital.net'

# Redeploy backend
railway up --service backend-api
```

---

## 6. Post-Deployment Verification

### 6.1 Backend API Verification

#### Test 1: Health Check
```bash
# Test health endpoint
curl -X GET https://api.proposals.infigital.net/api/v1/health \
  -H "Content-Type: application/json"

# Expected Response:
{
  "success": true,
  "status": "healthy",
  "database": true,
  "redis": true,
  "timestamp": "2025-09-30T12:00:00.000Z"
}
```

#### Test 2: User Registration
```bash
# Create test user
curl -X POST https://api.proposals.infigital.net/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@infigital.net",
    "phone": "(48) 99999-9999",
    "password": "SecurePass123!"
  }'

# Expected Response:
{
  "success": true,
  "message": "Usuário registrado com sucesso",
  "user": {
    "id": "...",
    "name": "Test User",
    "email": "test@infigital.net"
  },
  "token": "..."
}
```

#### Test 3: User Login
```bash
# Login with test user
curl -X POST https://api.proposals.infigital.net/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@infigital.net",
    "password": "SecurePass123!"
  }'

# Expected Response:
{
  "success": true,
  "message": "Login realizado com sucesso",
  "token": "...",
  "refreshToken": "...",
  "user": {...}
}
```

#### Test 4: Database Connection
Check Railway logs for database initialization:
```bash
railway logs --service backend-api | grep -i "database\|table"

# Expected output:
✅ Users table created/verified
✅ Clients table created/verified
✅ Proposals table created/verified
✅ Proposal sections table created/verified
✅ Proposal activities table created/verified
✅ LGPD audit log table created/verified
✅ Sessions table created/verified
Database schema initialized successfully
```

#### Test 5: Redis Connection
Check Railway logs for Redis connection:
```bash
railway logs --service backend-api | grep -i "redis"

# Expected output:
Redis connection established
Redis client ready
```

### 6.2 Frontend Verification

#### Test 1: Homepage Access
```bash
# Test frontend homepage
curl -I https://proposals.infigital.net

# Expected: HTTP/2 200
```

#### Test 2: Browser Manual Testing

Open browser and visit: `https://proposals.infigital.net`

**Verification Checklist:**
- [ ] Homepage loads without errors
- [ ] No console errors in browser dev tools
- [ ] Login page accessible
- [ ] Registration page accessible
- [ ] Static assets load correctly (images, CSS)
- [ ] No CORS errors in console

#### Test 3: User Registration Flow
1. Navigate to registration page
2. Fill form with test data:
   - Nome: Test User
   - Email: test2@infigital.net
   - Telefone: (48) 99999-9998
   - Senha: SecurePass123!
3. Submit form
4. Verify success message
5. Verify redirect to dashboard

#### Test 4: User Login Flow
1. Navigate to login page
2. Enter credentials:
   - Email: test2@infigital.net
   - Senha: SecurePass123!
3. Submit form
4. Verify successful login
5. Verify dashboard loads

#### Test 5: Dashboard Functionality
- [ ] Dashboard displays user name
- [ ] Statistics cards load
- [ ] Can navigate to Clientes
- [ ] Can navigate to Propostas
- [ ] Can navigate to Relatórios
- [ ] Logout works correctly

### 6.3 Database Verification

#### Via Railway Console
```bash
# Connect to PostgreSQL
railway connect Postgres

# Once connected, verify tables:
\dt

# Expected output:
                  List of relations
 Schema |         Name          | Type  |      Owner
--------+-----------------------+-------+-----------------
 public | clients               | table | orcamentos_user
 public | lgpd_audit_log        | table | orcamentos_user
 public | proposal_activities   | table | orcamentos_user
 public | proposal_sections     | table | orcamentos_user
 public | proposals             | table | orcamentos_user
 public | sessions              | table | orcamentos_user
 public | users                 | table | orcamentos_user
(7 rows)

# Count users
SELECT COUNT(*) FROM users;

# Should show: 1 or 2 (test users)

# Verify user data
SELECT id, name, email, created_at FROM users LIMIT 5;

# Exit
\q
```

### 6.4 CORS Verification

```bash
# Test CORS headers
curl -I https://api.proposals.infigital.net/api/v1/health \
  -H "Origin: https://proposals.infigital.net"

# Expected headers:
Access-Control-Allow-Origin: https://proposals.infigital.net
Access-Control-Allow-Credentials: true
```

### 6.5 SSL/TLS Verification

```bash
# Test SSL certificate
openssl s_client -connect api.proposals.infigital.net:443 -servername api.proposals.infigital.net < /dev/null

# Verify:
# - Certificate chain is valid
# - No certificate errors
# - TLS 1.2 or 1.3 used
```

### 6.6 Performance Verification

```bash
# Test response times
time curl https://api.proposals.infigital.net/api/v1/health

# Expected: < 500ms

time curl https://proposals.infigital.net

# Expected: < 2000ms (includes Next.js server-side rendering)
```

---

## 7. Error Prevention Strategy

### 7.1 Common Railway Pitfalls and Solutions

#### Issue 1: Build Timeout (Root Directory Not Set)
**Symptom:** Build times out after 15 minutes

**Prevention:**
```bash
# Set root directory for each service
# Dashboard → Service Settings → General → Root Directory
# Backend: services/api
# Frontend: services/frontend
```

**Why It Happens:** Without root directory, Railway tries to build from project root, installing all dependencies including those not needed for the service.

#### Issue 2: Application Failed to Respond (502/503)
**Symptom:** Service shows "Running" but returns 502/503

**Prevention Checklist:**
- [ ] Service listens on `0.0.0.0`, not `localhost` or `127.0.0.1`
- [ ] Service uses `process.env.PORT` from Railway
- [ ] Health check endpoint exists and responds
- [ ] All environment variables are set

**Code Verification:**
```javascript
// ✅ CORRECT (services/api/src/index.js)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// ❌ WRONG
app.listen(3000, 'localhost', () => {...});
```

#### Issue 3: Database Connection Failed
**Symptom:** Backend crashes with "ECONNREFUSED" or "Connection refused"

**Prevention:**
```bash
# Use Railway variable reference, not hardcoded URL
railway variables set DATABASE_URL '${{Postgres.DATABASE_URL}}'

# Verify connection string format
railway variables get DATABASE_URL
# Should show: ${{Postgres.DATABASE_URL}}
```

**Code Verification:**
```javascript
// ✅ CORRECT (services/api/src/models/database.js)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

// ❌ WRONG (hardcoded connection)
const pool = new Pool({
  host: 'postgres',
  port: 5432,
  // ...
});
```

#### Issue 4: CORS Policy Error
**Symptom:** Frontend can't reach backend, CORS errors in console

**Prevention:**
```bash
# Set correct CORS origin (frontend domain)
railway variables set CORS_ORIGIN 'https://proposals.infigital.net'

# Verify CORS middleware in backend
# services/api/src/index.js should have:
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true
}));
```

**Testing:**
```bash
# Test CORS headers
curl -I https://api.proposals.infigital.net/api/v1/health \
  -H "Origin: https://proposals.infigital.net" \
  -H "Access-Control-Request-Method: POST"

# Should see:
# Access-Control-Allow-Origin: https://proposals.infigital.net
```

#### Issue 5: Environment Variables Not Loaded
**Symptom:** Application crashes with "undefined" errors

**Prevention:**
```bash
# Verify all required variables are set
railway variables | grep -E "NODE_ENV|DATABASE_URL|REDIS_URL|JWT_SECRET"

# Variables must be set BEFORE deployment
# Railway does NOT load .env files in production

# Redeploy after setting variables
railway up
```

#### Issue 6: Module Not Found (Build Error)
**Symptom:** Build fails with "Cannot find module 'X'"

**Prevention:**
```bash
# Ensure all dependencies are in package.json, not devDependencies
# Check: services/api/package.json and services/frontend/package.json

# Production dependencies should include:
# - Runtime packages (express, pg, redis, etc.)
# - NOT dev tools (nodemon, jest, eslint)

# If module is needed at runtime, move to dependencies:
npm install <package> --save
```

#### Issue 7: Next.js Standalone Build Failure
**Symptom:** Frontend build completes but crashes on start

**Prevention:**
```bash
# Verify package.json start script uses standalone output
# services/frontend/package.json:
{
  "scripts": {
    "start": "node .next/standalone/server.js"
  }
}

# Verify next.config.js has standalone output
# services/frontend/next.config.js:
module.exports = {
  output: 'standalone'
}
```

#### Issue 8: Sharp Package Missing (Image Optimization)
**Symptom:** Frontend crashes with "sharp" module not found

**Prevention:**
```bash
# Ensure sharp is in dependencies, not devDependencies
# services/frontend/package.json:
{
  "dependencies": {
    "sharp": "^0.33.5"
  }
}

# Verify during build logs:
railway logs --service frontend | grep sharp
# Should show: sharp@0.33.5 installed
```

### 7.2 Pre-Deployment Validation Script

Create a comprehensive validation script to run before every deployment:

```bash
# Create: deploy/pre-deploy-validate.sh
#!/bin/bash
set -e

echo "🔍 Railway Pre-Deployment Validation"
echo "===================================="
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

report_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
}

report_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARNINGS++))
}

report_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((ERRORS++))
}

echo "📦 Section 1: Repository Status"
echo "------------------------------"

# Git status
if git diff-index --quiet HEAD -- 2>/dev/null; then
    report_pass "No uncommitted changes"
else
    report_fail "Uncommitted changes detected. Commit before deploying."
fi

# Remote configured
if git remote get-url origin &>/dev/null; then
    report_pass "Git remote configured"
else
    report_fail "No Git remote configured"
fi

echo ""
echo "🔐 Section 2: Security Check"
echo "----------------------------"

# No .env files committed
if git ls-files | grep -E "^\.env$" > /dev/null; then
    report_fail ".env file committed to Git! Remove immediately!"
else
    report_pass "No .env files committed"
fi

# No hardcoded secrets
if git grep -i "password.*=.*['\"][a-zA-Z0-9]" -- ':!node_modules' ':!*.md' &>/dev/null; then
    report_fail "Possible hardcoded passwords found"
else
    report_pass "No obvious hardcoded secrets"
fi

echo ""
echo "⚙️  Section 3: Backend Configuration"
echo "-----------------------------------"

# Backend package.json exists
if [ -f services/api/package.json ]; then
    report_pass "Backend package.json exists"

    # Start script defined
    if grep -q '"start"' services/api/package.json; then
        report_pass "Backend start script defined"
    else
        report_fail "No start script in backend package.json"
    fi
else
    report_fail "Backend package.json missing"
fi

# Database schema exists
if [ -f services/api/src/models/schema.js ]; then
    report_pass "Database schema file exists"
else
    report_warn "Database schema file missing"
fi

# Health endpoint exists
if grep -q "/health" services/api/src/index.js 2>/dev/null; then
    report_pass "Health endpoint found in backend"
else
    report_warn "Health endpoint not found"
fi

# PORT environment variable usage
if grep -q "process\.env\.PORT" services/api/src/index.js 2>/dev/null; then
    report_pass "Backend uses process.env.PORT"
else
    report_fail "Backend doesn't use process.env.PORT"
fi

# Binding to 0.0.0.0
if grep -q "0\.0\.0\.0" services/api/src/index.js 2>/dev/null; then
    report_pass "Backend binds to 0.0.0.0"
else
    report_warn "Backend binding not verified"
fi

echo ""
echo "🎨 Section 4: Frontend Configuration"
echo "------------------------------------"

# Frontend package.json exists
if [ -f services/frontend/package.json ]; then
    report_pass "Frontend package.json exists"

    # Sharp dependency
    if grep -q '"sharp"' services/frontend/package.json; then
        report_pass "Sharp package in dependencies"
    else
        report_fail "Sharp package missing from dependencies"
    fi

    # Start script uses standalone
    if grep -q "standalone/server.js" services/frontend/package.json; then
        report_pass "Start script uses standalone output"
    else
        report_warn "Start script may not use standalone output"
    fi
else
    report_fail "Frontend package.json missing"
fi

# next.config.js exists
if [ -f services/frontend/next.config.js ]; then
    report_pass "next.config.js exists"

    # Standalone output configured
    if grep -q "output:.*'standalone'" services/frontend/next.config.js; then
        report_pass "Next.js standalone output configured"
    else
        report_warn "Standalone output not explicitly set"
    fi
else
    report_fail "next.config.js missing"
fi

echo ""
echo "🔧 Section 5: Railway Prerequisites"
echo "-----------------------------------"

# Railway CLI installed
if command -v railway &>/dev/null; then
    report_pass "Railway CLI installed"

    # Railway authenticated
    if railway whoami &>/dev/null; then
        report_pass "Railway CLI authenticated"
    else
        report_fail "Railway CLI not authenticated. Run: railway login"
    fi
else
    report_fail "Railway CLI not installed. Run: npm i -g @railway/cli"
fi

echo ""
echo "======================================"
echo "📊 VALIDATION SUMMARY"
echo "======================================"
echo -e "${GREEN}✅ Passed: $(($(($WARNINGS + $ERRORS)) - $WARNINGS - $ERRORS + 20))${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 Perfect! Ready for Railway deployment!${NC}"
        exit 0
    else
        echo -e "${YELLOW}✓ Ready to deploy, but review warnings.${NC}"
        exit 0
    fi
else
    echo -e "${RED}⚠️  Fix $ERRORS critical issue(s) before deploying.${NC}"
    exit 1
fi
```

**Usage:**
```bash
# Make executable
chmod +x deploy/pre-deploy-validate.sh

# Run before every deployment
./deploy/pre-deploy-validate.sh
```

---

## 8. Rollback Plan

### 8.1 Immediate Rollback (< 2 minutes)

If deployment causes production outage:

```bash
# Option 1: Rollback via Railway Dashboard
# 1. Open Railway dashboard
# 2. Navigate to affected service
# 3. Go to Deployments tab
# 4. Find last successful deployment
# 5. Click "Redeploy"
# 6. Monitor logs

# Option 2: Rollback via Git
# 1. Stop current deployment
railway down --service <service-name>

# 2. Checkout previous commit
git log --oneline -n 10  # Find last working commit
git checkout <previous-commit-hash>

# 3. Force deploy
railway up --service <service-name>

# 4. Monitor recovery
railway logs --service <service-name> --follow
```

### 8.2 Rollback Scenarios

#### Scenario 1: Backend API Crash
```bash
# Emergency response:
# 1. Verify backend is down
curl -I https://api.proposals.infigital.net/api/v1/health
# Status: 502 or 503

# 2. Check recent deployments
railway deployments --service backend-api

# 3. Identify last successful deployment
# 4. Redeploy that version via dashboard

# 5. Verify recovery
sleep 30
curl -I https://api.proposals.infigital.net/api/v1/health
# Status: 200 expected
```

#### Scenario 2: Frontend Not Loading
```bash
# Emergency response:
# 1. Verify frontend is down
curl -I https://proposals.infigital.net
# Status: 502 or 503

# 2. Rollback frontend only
railway down --service frontend
git checkout HEAD~1  # Previous commit
railway up --service frontend

# 3. Verify recovery
curl -I https://proposals.infigital.net
# Status: 200 expected
```

#### Scenario 3: Database Migration Failure
```bash
# Emergency response:
# 1. Stop backend to prevent data corruption
railway down --service backend-api

# 2. Connect to database
railway connect Postgres

# 3. Check table status
\dt

# 4. If tables corrupted, restore from backup
# (See section 8.3 for backup procedures)

# 5. Restart backend with fixed schema
railway up --service backend-api
```

### 8.3 Backup and Recovery Procedures

#### Database Backup (Before Major Changes)
```bash
# Create backup before deployment
railway connect Postgres

# Inside PostgreSQL shell:
\! pg_dump -U orcamentos_user orcamentos > backup_$(date +%Y%m%d_%H%M%S).sql

# Or via Railway CLI with docker:
docker exec orcamentos-postgres pg_dump -U orcamentos_user orcamentos > backup.sql

# Store backup securely
# Upload to S3, Google Drive, or secure storage
```

#### Database Restore (If Needed)
```bash
# Connect to Railway database
railway connect Postgres

# Drop existing tables (DANGEROUS - only in emergency)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Restore from backup
\i backup_YYYYMMDD_HHMMSS.sql

# Verify tables restored
\dt
```

### 8.4 Rollback Checklist

After rollback, verify:
- [ ] All services show "Running" status
- [ ] Health endpoints return 200
- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Users can login
- [ ] Database queries work
- [ ] No CORS errors
- [ ] SSL certificates valid

---

## 9. Monitoring and Maintenance

### 9.1 Railway Dashboard Monitoring

**Key Metrics to Monitor:**

#### Service Health
- Status: Running/Stopped/Crashed
- Memory usage: < 80% of allocated
- CPU usage: < 70% sustained
- Restart count: Should be 0

#### Database Monitoring
- Connection count: < 80 of max connections
- Query performance: < 100ms average
- Storage usage: < 80% of allocated
- Backup status: Daily backups enabled

#### Performance Metrics
- Response time: < 500ms for API, < 2000ms for frontend
- Error rate: < 1% of total requests
- Uptime: > 99.9%

### 9.2 Log Monitoring

```bash
# View recent logs
railway logs --service backend-api | tail -n 100

# Monitor in real-time
railway logs --service backend-api --follow

# Filter errors
railway logs --service backend-api | grep -i error

# Check for specific patterns
railway logs --service backend-api | grep -i "database\|redis\|jwt"

# Export logs for analysis
railway logs --service backend-api > logs_$(date +%Y%m%d).txt
```

### 9.3 Automated Monitoring Setup

Create monitoring scripts to run periodically:

```bash
# Create: deploy/monitor-health.sh
#!/bin/bash

BACKEND_URL="https://api.proposals.infigital.net"
FRONTEND_URL="https://proposals.infigital.net"

echo "🔍 Health Check: $(date)"

# Check backend
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $BACKEND_URL/api/v1/health)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend: Healthy (200)"
else
    echo "❌ Backend: Unhealthy ($BACKEND_STATUS)"
    # Send alert (email, Slack, etc.)
fi

# Check frontend
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend: Healthy (200)"
else
    echo "❌ Frontend: Unhealthy ($FRONTEND_STATUS)"
    # Send alert
fi

# Check response time
RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null $BACKEND_URL/api/v1/health)
echo "⏱️  Backend response time: ${RESPONSE_TIME}s"

if (( $(echo "$RESPONSE_TIME > 1.0" | bc -l) )); then
    echo "⚠️  Warning: Response time > 1s"
fi
```

**Setup Cron Job:**
```bash
# Run health check every 5 minutes
*/5 * * * * /path/to/deploy/monitor-health.sh >> /var/log/railway-monitor.log 2>&1
```

### 9.4 Alert Configuration

**Recommended Alerts:**

1. **Service Down Alert**
   - Trigger: Service status = Crashed
   - Action: Immediate notification via email/Slack
   - Priority: Critical

2. **High Error Rate Alert**
   - Trigger: Error rate > 5% over 5 minutes
   - Action: Notification to team
   - Priority: High

3. **High Memory Usage Alert**
   - Trigger: Memory usage > 85% for 10 minutes
   - Action: Investigation notification
   - Priority: Medium

4. **Slow Response Time Alert**
   - Trigger: Average response time > 2s
   - Action: Performance review notification
   - Priority: Medium

### 9.5 Maintenance Schedule

**Daily:**
- Review error logs
- Check service health
- Monitor response times

**Weekly:**
- Review Railway usage metrics
- Check cost optimization opportunities
- Update dependencies if needed

**Monthly:**
- Database performance review
- Security audit
- Backup verification
- SSL certificate check

---

## 10. Cost Estimation

### 10.1 Railway Pricing Structure

**Starter Plan (Recommended for Production Start):**
- $5/month per service
- Includes: 500GB bandwidth, automatic scaling, SSL
- Additional: $10/GB bandwidth overage

**Pro Plan (For Scale):**
- $20/month per service
- Includes: 2TB bandwidth, priority support
- Better for high-traffic applications

### 10.2 Service Cost Breakdown

| Service | Plan | Monthly Cost | Notes |
|---------|------|--------------|-------|
| Frontend | Starter | $5 | Next.js standalone |
| Backend API | Starter | $5 | Node.js/Express |
| PostgreSQL | Starter | $5 | Managed database |
| Redis | Starter | $5 | Managed cache |
| **Total** | | **$20/month** | Base cost |

**Additional Costs:**
- Custom domains: Included (SSL free)
- Bandwidth overage: $10/GB beyond included
- Increased resources: Varies based on usage

### 10.3 Cost Optimization Strategies

#### 1. Optimize Frontend Build
```bash
# Enable Next.js compression
# services/frontend/next.config.js
module.exports = {
  compress: true,  # Reduces bandwidth usage
  images: {
    unoptimized: false  # Optimize images at build
  }
}
```

#### 2. Implement Caching
```javascript
// services/api/src/index.js
// Use Redis for frequently accessed data
const cache = require('./middleware/cache');

app.get('/api/v1/proposals', cache.middleware(300), async (req, res) => {
  // Cached for 5 minutes
});
```

#### 3. Database Query Optimization
```javascript
// Add indexes for frequently queried fields
// services/api/src/models/schema.js
await client.query(`
  CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON proposals(user_id);
  CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
`);
```

#### 4. Set Resource Limits
```bash
# Via Railway Dashboard:
# Service Settings → Resources
# Set appropriate memory limits to prevent overage charges
```

### 10.4 Monthly Cost Projections

**Scenario 1: Low Traffic (< 10k requests/day)**
- Base services: $20
- Bandwidth (2GB/month): Included
- **Total: $20/month**

**Scenario 2: Medium Traffic (100k requests/day)**
- Base services: $20
- Bandwidth (20GB/month): Included
- **Total: $20/month**

**Scenario 3: High Traffic (1M requests/day)**
- Base services: $20
- Bandwidth (200GB/month): Included
- Potential overage: $0-10
- **Total: $20-30/month**

---

## 11. Timeline and Milestones

### 11.1 Initial Deployment Timeline

**Total Estimated Time: 2-3 hours**

| Phase | Duration | Tasks | Completion Criteria |
|-------|----------|-------|-------------------|
| **Phase 1: Setup** | 15 min | Railway login, project creation, GitHub link | Project visible in dashboard |
| **Phase 2: Database** | 10 min | PostgreSQL + Redis provisioning | Both services running |
| **Phase 3: Backend** | 30 min | Service config, env vars, deployment | Health endpoint returns 200 |
| **Phase 4: Frontend** | 30 min | Service config, env vars, deployment | Homepage loads |
| **Phase 5: Custom Domain** | 15 min | DNS config, domain linking | Custom URLs working |
| **Phase 6: Verification** | 30 min | Test all features, create test users | All tests passing |
| **Phase 7: Documentation** | 30 min | Document URLs, credentials, procedures | Team can access |

### 11.2 Deployment Milestones

#### Milestone 1: Services Running ✅
- [ ] PostgreSQL service healthy
- [ ] Redis service healthy
- [ ] Backend API deployed and running
- [ ] Frontend deployed and running

**Expected Completion:** 55 minutes from start

#### Milestone 2: Database Initialized ✅
- [ ] All 7 tables created
- [ ] Schema initialization logs confirmed
- [ ] Test user can be created
- [ ] Database queries working

**Expected Completion:** 65 minutes from start

#### Milestone 3: Frontend-Backend Communication ✅
- [ ] CORS configured correctly
- [ ] API requests successful from frontend
- [ ] WebSocket connection established
- [ ] No console errors

**Expected Completion:** 90 minutes from start

#### Milestone 4: Custom Domains Active ✅
- [ ] DNS records configured
- [ ] SSL certificates issued
- [ ] Custom URLs resolving
- [ ] Environment variables updated

**Expected Completion:** 105 minutes from start

#### Milestone 5: Production Ready ✅
- [ ] All features tested and working
- [ ] Test users can register and login
- [ ] Proposals can be created and managed
- [ ] Client workflow functional
- [ ] Monitoring configured

**Expected Completion:** 135 minutes from start

#### Milestone 6: Team Handoff Complete ✅
- [ ] Deployment documentation written
- [ ] Access credentials documented
- [ ] Rollback procedures documented
- [ ] Team trained on Railway dashboard
- [ ] Support channels established

**Expected Completion:** 165 minutes from start

### 11.3 Post-Deployment Timeline

**Week 1: Monitoring Phase**
- Daily health checks
- Monitor error rates
- Review performance metrics
- Address any issues

**Week 2-4: Optimization Phase**
- Implement caching strategies
- Optimize database queries
- Review and reduce costs
- Set up automated alerts

**Month 2+: Maintenance Phase**
- Regular security updates
- Feature deployments
- Performance tuning
- Scale as needed

---

## 12. Success Criteria Checklist

### Pre-Deployment
- [ ] All Railway procedure documents reviewed
- [ ] Pre-deployment validation script passing
- [ ] Team aware of deployment timeline
- [ ] Backup procedures documented

### During Deployment
- [ ] All services deploy without errors
- [ ] Build times under 5 minutes per service
- [ ] No credential exposure in logs
- [ ] Environment variables set correctly

### Post-Deployment
- [ ] All health endpoints return 200
- [ ] Users can register and login
- [ ] Proposals can be created
- [ ] LGPD audit logging active
- [ ] Brazilian localization working (Portuguese, BRL, dates)
- [ ] SSL certificates valid
- [ ] Custom domains resolving
- [ ] Response times acceptable (< 500ms API, < 2s frontend)

### Operational
- [ ] Monitoring configured and working
- [ ] Team can access Railway dashboard
- [ ] Rollback procedures tested
- [ ] Documentation complete and accessible
- [ ] Support channels established

---

## Appendix A: Environment Variables Reference

### Backend API Service
```bash
# Critical (Must Set)
NODE_ENV=production
PORT=${PORT}
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<64-char-random>
JWT_REFRESH_SECRET=<64-char-random>
SESSION_SECRET=<64-char-random>
CORS_ORIGIN=https://proposals.infigital.net
FRONTEND_URL=https://proposals.infigital.net

# Optional
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/tmp/uploads
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
DEFAULT_LOCALE=pt_BR
TIMEZONE=America/Sao_Paulo
```

### Frontend Service
```bash
# Critical (Must Set)
NODE_ENV=production
PORT=${PORT}
NEXT_PUBLIC_API_URL=https://api.proposals.infigital.net/api/v1
NEXT_PUBLIC_WS_URL=wss://api.proposals.infigital.net
NEXT_PUBLIC_APP_NAME=WebPropostas
NEXT_PUBLIC_APP_VERSION=1.0.0

# Optional
NEXT_PUBLIC_MAX_FILE_SIZE=10485760
```

---

## Appendix B: Quick Command Reference

```bash
# === RAILWAY CLI ESSENTIALS ===
railway login              # Authenticate
railway init               # Create project
railway link               # Link to project
railway status             # Check service status
railway logs               # View logs
railway logs --follow      # Stream logs
railway variables          # List env vars
railway variables set KEY value  # Set variable
railway variables get KEY  # Get variable value
railway up                 # Deploy service
railway down               # Stop service
railway domain             # Generate domain
railway connect Postgres   # Connect to database
railway connect Redis      # Connect to Redis

# === DEPLOYMENT ===
# Deploy specific service
railway up --service backend-api
railway up --service frontend

# Monitor deployment
railway logs --service backend-api --follow

# === TROUBLESHOOTING ===
# Check recent errors
railway logs --service backend-api | grep -i error

# Restart service
railway down --service backend-api
railway up --service backend-api

# Get service info
railway status --service backend-api

# === DATABASE ===
# Connect to PostgreSQL
railway connect Postgres

# Inside PostgreSQL:
\dt                # List tables
\d users           # Describe table
SELECT COUNT(*) FROM users;  # Count records
\q                 # Exit
```

---

## Appendix C: Troubleshooting Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| **502/503 Error** | Check service binds to 0.0.0.0 and uses process.env.PORT |
| **Build Timeout** | Set root directory: services/api or services/frontend |
| **Database Connection Failed** | Use ${{Postgres.DATABASE_URL}}, not hardcoded |
| **CORS Error** | Set CORS_ORIGIN to frontend domain |
| **Module Not Found** | Move package from devDependencies to dependencies |
| **Environment Variable Missing** | railway variables set KEY value, then redeploy |
| **Sharp Not Found** | Add "sharp": "^0.33.5" to frontend dependencies |
| **Deployment Stuck** | Cancel (railway down) and retry |

---

## Appendix D: Support Resources

**Railway Documentation:**
- Docs: https://docs.railway.com
- Status: https://status.railway.com
- Support: https://railway.com/support
- Discord: https://discord.gg/railway

**Project-Specific Resources:**
- Railway Procedures: `.vibecoding/Procedures/Railway_*.md`
- Error Library: `.vibecoding/Procedures/Railway_error_library.md`
- Recovery Playbook: `.vibecoding/Procedures/Railway_recovery_playbook.md`
- Deployment Status: `DEPLOYMENT-STATUS.md`

**Brazilian Market Compliance:**
- LGPD: https://www.gov.br/esporte/pt-br/acesso-a-informacao/lgpd
- CPF/CNPJ Validation: Built into backend
- BRL Currency: Automatically handled by Intl.NumberFormat

---

**Document Version:** 1.0
**Last Updated:** September 30, 2025
**Author:** RAILWAY CONDUCTOR - Railway Deployment Specialist
**Status:** Complete and Ready for Implementation

✓ guardrails-ok