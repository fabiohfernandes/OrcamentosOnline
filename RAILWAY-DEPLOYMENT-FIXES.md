# Railway Deployment Fixes - WebPropostas

## 🔴 Critical Issues Fixed (September 30, 2025)

This document outlines the fixes applied to resolve Railway deployment failures.

---

## Issues Identified from Logs

### 1. ❌ **Missing Database Schema** (CRITICAL)
**Error:** `relation "proposals" does not exist`

**Cause:** The database wasn't being initialized on startup. Tables were never created.

**Fix Applied:**
- ✅ Created [schema.js](d:\WebPropostas\services\api\src\models\schema.js) - Complete database schema initialization
- ✅ Updated [index.js](d:\WebPropostas\services\api\src\index.js#L1217) to run `initializeSchema()` on startup
- ✅ Tables now automatically created on first deployment:
  - `users` - User accounts with authentication
  - `clients` - Client information
  - `proposals` - Proposal management
  - `proposal_sections` - Multi-section proposals
  - `proposal_activities` - Activity tracking
  - `lgpd_audit_log` - LGPD compliance auditing
  - `sessions` - JWT session management

### 2. ❌ **Frontend Next.js Standalone Mode Error**
**Error:** `"next start" does not work with "output: standalone" configuration`

**Cause:** The package.json `start` script used `next start` but [next.config.js](d:\WebPropostas\services\frontend\next.config.js#L46) configured `output: 'standalone'`

**Fix Applied:**
- ✅ Updated [package.json](d:\WebPropostas\services\frontend\package.json#L10) start script:
  ```json
  "start": "node .next/standalone/server.js"
  ```

### 3. ❌ **Missing Sharp Package**
**Error:** `'sharp' is required to be installed in standalone mode for image optimization`

**Cause:** Next.js requires `sharp` for production image optimization in standalone mode.

**Fix Applied:**
- ✅ Added `sharp` to [frontend dependencies](d:\WebPropostas\services\frontend\package.json#L26):
  ```json
  "sharp": "^0.33.0"
  ```

### 4. ⚠️ **Deprecated `images.domains` Configuration**
**Warning:** `The "images.domains" configuration is deprecated`

**Fix Applied:**
- ✅ Updated [next.config.js](d:\WebPropostas\services\frontend\next.config.js#L17) to use `remotePatterns`:
  ```javascript
  remotePatterns: [
    { protocol: 'http', hostname: 'localhost' },
    { protocol: 'http', hostname: '127.0.0.1' }
  ]
  ```

---

## 📋 Database Schema Details

The initialization script creates the following tables:

### Core Tables
1. **users** - User authentication and profiles
   - JWT authentication support
   - Password reset tokens
   - Role-based access control

2. **clients** - Client management
   - Contact information
   - CPF/CNPJ validation
   - Company details

3. **proposals** - Proposal lifecycle management
   - Client authentication (username/password)
   - Public tokens for sharing
   - Status tracking (draft, sent, approved, rejected)
   - Value tracking
   - URLs for presentation and commercial content

### Supporting Tables
4. **proposal_sections** - Multi-section proposal support
5. **proposal_activities** - Activity history and audit trail
6. **lgpd_audit_log** - LGPD compliance logging
7. **sessions** - JWT session management and token blacklist

### Indexes Created
- Email lookups (users, clients)
- User-specific queries (proposals, clients)
- Status filtering
- Date-based queries
- Token lookups

---

## 🚀 Deployment Steps

### Immediate Actions Required

1. **Commit and Push Changes**
   ```bash
   git add .
   git commit -m "fix: Add database schema initialization and fix Next.js standalone mode"
   git push origin master
   ```

2. **Railway Will Auto-Deploy**
   - Railway detects the push and triggers rebuild
   - Backend will initialize database schema automatically
   - Frontend will build with proper standalone configuration

3. **Verify Deployment**
   ```bash
   # Check backend health
   curl https://backend-production-XXXX.up.railway.app/api/v1/health

   # Check database initialization logs
   railway logs --service backend

   # Check frontend deployment
   curl https://frontend-production-XXXX.up.railway.app
   ```

---

## 🔧 Environment Variables

Ensure these are set in Railway:

### Backend Service
```bash
NODE_ENV=production
DATABASE_URL=[Auto-set by PostgreSQL service]
REDIS_URL=[Auto-set by Redis service]
JWT_SECRET=[Your 32+ character secret]
JWT_REFRESH_SECRET=[Your refresh token secret]
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=https://frontend-production-XXXX.up.railway.app
PORT=[Auto-set by Railway]
```

### Frontend Service
```bash
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://backend-production-XXXX.up.railway.app/api/v1
PORT=[Auto-set by Railway]
```

---

## 📊 Expected Log Output

### Backend Startup (Success)
```
✅ Database connection successful
🕒 Database time: 2025-09-30T...
🗄️  PostgreSQL version: PostgreSQL...
🔧 Initializing database schema...
✅ Users table created/verified
✅ Clients table created/verified
✅ Proposals table created/verified
✅ Proposal sections table created/verified
✅ Proposal activities table created/verified
✅ LGPD audit log table created/verified
✅ Sessions table created/verified
✅ Database schema initialized successfully
Database schema ready
🚀 WebPropostas API server started on port 8080
```

### Frontend Startup (Success)
```
▲ Next.js 14.2.33
- Local:        http://localhost:8080
✓ Starting...
✓ Ready in 420ms
```

---

## 🧪 Testing After Deployment

### 1. Test Backend Health
```bash
curl https://backend-production-XXXX.up.railway.app/api/v1/health
```

Expected response:
```json
{
  "success": true,
  "status": "healthy",
  "database": true,
  "redis": {"status": "connected"}
}
```

### 2. Test User Registration
```bash
curl -X POST https://backend-production-XXXX.up.railway.app/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "(48) 99999-9999",
    "password": "TestPassword123"
  }'
```

### 3. Test Database Tables
Login to Railway PostgreSQL and verify:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';
```

Should show: `users`, `clients`, `proposals`, `proposal_sections`, `proposal_activities`, `lgpd_audit_log`, `sessions`

### 4. Test Frontend Access
Visit: `https://frontend-production-XXXX.up.railway.app`

---

## 🐛 Troubleshooting

### Database Schema Not Created
If you see "relation does not exist" errors:

1. Check Railway logs for schema initialization errors
2. Verify DATABASE_URL is correctly set
3. Check PostgreSQL connection from Railway dashboard
4. Manually trigger schema creation (if needed):
   ```bash
   railway run node -e "require('./src/models/schema').initializeSchema()"
   ```

### Frontend Still Failing
If frontend deployment fails:

1. Verify `sharp` is installed: Check build logs for "Installing sharp"
2. Verify standalone output exists: Check for `.next/standalone` directory in build
3. Check start command in Railway settings matches package.json
4. Verify `NEXT_PUBLIC_API_URL` points to correct backend URL

### CORS Errors
If frontend can't connect to backend:

1. Verify `CORS_ORIGIN` in backend includes frontend URL
2. Check browser console for CORS error details
3. Test API directly with curl to isolate issue

---

## 📝 Next Steps

After successful deployment:

1. ✅ **Verify all endpoints work**
   - User registration
   - User login
   - Dashboard access
   - Proposal creation

2. ✅ **Configure custom domains** (optional)
   - Frontend: `app.your-domain.com`
   - Backend: `api.your-domain.com`

3. ✅ **Set up monitoring**
   - Railway built-in metrics
   - Error tracking (Sentry, etc.)

4. ✅ **Database backups**
   - Enable Railway automated backups
   - Export schema for version control

---

## 📚 Related Documentation

- [Main Railway Deployment Guide](./RAILWAY-DEPLOYMENT.md)
- [API Documentation](./services/api/README.md)
- [Frontend Documentation](./services/frontend/README.md)
- [Database Schema](./services/api/src/models/schema.js)

---

## ✅ Verification Checklist

- [ ] Code changes committed and pushed to GitHub
- [ ] Railway auto-deployment triggered
- [ ] Backend logs show successful schema initialization
- [ ] Frontend builds successfully with standalone mode
- [ ] Health endpoint returns healthy status
- [ ] Can register new user
- [ ] Can login with user credentials
- [ ] Dashboard loads without errors
- [ ] Database tables exist (verified via PostgreSQL)
- [ ] No CORS errors in browser console

---

## 🎯 Summary

**Problems:** Missing database tables, Next.js standalone misconfiguration, missing sharp package

**Solutions:**
1. Automatic database schema initialization on startup
2. Updated package.json start script for standalone mode
3. Added sharp dependency for image optimization
4. Updated Next.js image configuration to use remotePatterns

**Status:** ✅ **READY FOR DEPLOYMENT**

All critical issues have been resolved. The next Railway deployment should complete successfully.

---

**Last Updated:** September 30, 2025
**Author:** ORION Agent - Backend Development