# Railway Deployment - Step-by-Step Instructions

## 🎯 Quick Deployment Guide

**Project URL**: https://railway.com/project/8813d495-aad1-4b19-8cca-2c7f2861bd54

**Generated Secrets (Ready to Use)**:
- JWT_SECRET: `eb7c3a8192652e9b3119d75761415e03ec1f2ac5de96da2cdd5a9ad156ac0217`
- JWT_REFRESH_SECRET: `9e9026e33844dc2d2f91737b060167245fec02d470e9d0498668df48e8e9974b`
- SESSION_SECRET: `f77b0d4afa69345a98e21de2e2be48ef2e8e3bcf028bda7032ff5edbc291e93b`

---

## Step 1: Add PostgreSQL Database (2 minutes)

1. Open: https://railway.com/project/8813d495-aad1-4b19-8cca-2c7f2861bd54
2. Click **"+ New"** button
3. Select **"Database"**
4. Select **"Add PostgreSQL"**
5. Wait for deployment (~30 seconds)
6. Click on the **PostgreSQL** service
7. Go to **"Variables"** tab
8. **COPY** the `DATABASE_URL` value (looks like: `postgresql://postgres:...@...railway.app:5432/railway`)

---

## Step 2: Add Redis Cache (2 minutes)

1. Click **"+ New"** button again
2. Select **"Database"**
3. Select **"Add Redis"**
4. Wait for deployment (~30 seconds)
5. Click on the **Redis** service
6. Go to **"Variables"** tab
7. **COPY** the `REDIS_URL` value (looks like: `redis://default:...@...railway.app:6379`)

---

## Step 3: Deploy Backend API (5 minutes)

1. Click **"+ New"** button
2. Select **"GitHub Repo"**
3. Select **"fabiohfernandes/OrcamentosOnline"**
4. **⚠️ IMMEDIATELY** go to **Settings** tab (top right)
5. Click **"Source"** in left sidebar
6. Set **Root Directory**: `services/api`
7. Click **"Variables"** in left sidebar
8. Click **"RAW Editor"** button
9. **PASTE** the following (replace DATABASE_URL and REDIS_URL with your values):

```
NODE_ENV=production
PORT=3000
DATABASE_URL=<paste-your-postgresql-database-url-here>
REDIS_URL=<paste-your-redis-url-here>
JWT_SECRET=eb7c3a8192652e9b3119d75761415e03ec1f2ac5de96da2cdd5a9ad156ac0217
JWT_REFRESH_SECRET=9e9026e33844dc2d2f91737b060167245fec02d470e9d0498668df48e8e9974b
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
SESSION_SECRET=f77b0d4afa69345a98e21de2e2be48ef2e8e3bcf028bda7032ff5edbc291e93b
CORS_ORIGIN=*
FRONTEND_URL=https://orcamentos-online-production.up.railway.app
MAX_FILE_SIZE=10485760
UPLOAD_PATH=/uploads
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
BCRYPT_ROUNDS=12
```

10. Click **"Networking"** in left sidebar
11. Toggle **"Public Networking"** to ON
12. Wait for Railway to generate a domain
13. **COPY** the generated domain (e.g., `backend-api-production.up.railway.app`)
14. Go to **"Deployments"** tab - build should start automatically
15. Wait for deployment to complete (~3-5 minutes)

---

## Step 4: Deploy Frontend (5 minutes)

1. Click **"+ New"** button
2. Select **"GitHub Repo"**
3. Select **"fabiohfernandes/OrcamentosOnline"**
4. **⚠️ IMMEDIATELY** go to **Settings** tab (top right)
5. Click **"Source"** in left sidebar
6. Set **Root Directory**: `services/frontend`
7. Click **"Variables"** in left sidebar
8. Click **"RAW Editor"** button
9. **PASTE** the following (replace NEXT_PUBLIC_API_URL with backend domain from Step 3):

```
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://<backend-domain-from-step-3>/api/v1
```

Example:
```
NODE_ENV=production
PORT=3001
NEXT_PUBLIC_API_URL=https://backend-api-production.up.railway.app/api/v1
```

10. Click **"Networking"** in left sidebar
11. Toggle **"Public Networking"** to ON
12. Wait for Railway to generate a domain
13. **COPY** the generated domain (e.g., `frontend-production.up.railway.app`)
14. Go to **"Deployments"** tab - build should start automatically
15. Wait for deployment to complete (~3-5 minutes)

---

## Step 5: Update Backend CORS (1 minute)

1. Go back to **Backend API** service
2. Click **"Variables"** tab
3. Find **CORS_ORIGIN** variable
4. Change value from `*` to your frontend domain: `https://<frontend-domain>`
5. Click **Save**
6. Service will automatically redeploy

---

## Step 6: Verify Deployment (2 minutes)

### Backend Health Check
1. Open: `https://<backend-domain>/api/v1/health`
2. Should return: `{"status":"ok","timestamp":"..."}`

### Frontend Check
1. Open: `https://<frontend-domain>`
2. Should load the WebPropostas login page

### Database Check
1. Try registering a new user
2. Try logging in
3. Try creating a proposal

---

## 🎉 Deployment Complete!

Your WebPropostas platform is now live on Railway!

**Services**:
- 🗄️ PostgreSQL: Running
- 🔴 Redis: Running
- 🔙 Backend API: https://<your-backend-domain>
- 🎨 Frontend: https://<your-frontend-domain>

**Total Deployment Time**: ~15-20 minutes

---

## 🔧 Troubleshooting

### Build Fails
- Check that Root Directory is set correctly
- Verify all environment variables are set
- Check deployment logs for specific errors

### Backend 502/503 Error
- Check that PORT=3000 is set
- Verify health endpoint exists at /api/v1/health
- Check logs for database connection errors

### Frontend Won't Connect to Backend
- Verify NEXT_PUBLIC_API_URL is correct
- Check CORS_ORIGIN in backend matches frontend domain
- Verify backend is running and accessible

### Database Connection Error
- Verify DATABASE_URL is correctly copied
- Check PostgreSQL service is running
- Look for connection errors in logs

---

## 📝 Post-Deployment

1. **Save your domains** somewhere safe
2. **Update DEVELOPMENT.md** with deployment URLs
3. **Test all features**:
   - User registration
   - User login
   - Proposal creation
   - Client management
   - Reports

4. **Monitor logs**:
   ```bash
   railway logs --service=backend-api
   railway logs --service=frontend
   ```

5. **Set up custom domains** (optional):
   - proposals.infigital.net → Frontend
   - api.proposals.infigital.net → Backend

---

## 💰 Cost Monitoring

- Check usage in Railway dashboard
- Expected cost: $20-30/month for 4 services
- Monitor compute and bandwidth usage

---

**Need Help?**
- Railway Docs: https://docs.railway.app
- Project Dashboard: https://railway.com/project/8813d495-aad1-4b19-8cca-2c7f2861bd54
- Deployment Plan: RAILWAY-DEPLOYMENT-PLAN.md