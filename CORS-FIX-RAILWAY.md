# CORS Fix for Railway Deployment

## Problem
Frontend at `https://www.webpropostas.com.br` cannot access backend API due to CORS blocking.

## Error Message
```
Access to fetch at 'https://orcamentosonline-production-2693.up.railway.app/api/v1/auth/register'
from origin 'https://www.webpropostas.com.br' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution

### Step 1: Update Backend API Service (Railway Dashboard)

1. Go to Railway Dashboard → Select **Backend API Service**
2. Go to **Variables** tab
3. Add/Update these environment variables:

```bash
# CORS Configuration - Add all frontend domains
CORS_ORIGIN=https://www.webpropostas.com.br,https://webpropostas.com.br,https://frontend-production-0b59.up.railway.app

# Frontend URL (for callbacks and redirects)
FRONTEND_URL=https://www.webpropostas.com.br
```

**Important Notes:**
- Include both versions (with and without `www`)
- Include the Railway frontend URL as backup
- Separate multiple origins with commas
- No special characters - no Punycode needed

### Step 2: Verify Backend CORS Configuration

The backend code already handles multiple CORS origins:

```javascript
// services/api/src/index.js (lines 104-118)
const corsOptions = {
  origin: [
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'https://frontend-production-0b59.up.railway.app',
    'https://proposals.infigital.net',
    'https://www.webpropostas.com.br',
    'https://webpropostas.com.br',
    process.env.CORS_ORIGIN  // <-- This reads from environment variable
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

The `process.env.CORS_ORIGIN` variable will be split automatically if you provide a comma-separated list.

### Step 3: Update Frontend API URL (if needed)

1. Go to Railway Dashboard → Select **Frontend Service**
2. Go to **Variables** tab
3. Update:

```bash
NEXT_PUBLIC_API_URL=https://orcamentosonline-production-2693.up.railway.app/api/v1
```

**Better:** Get the current backend URL from Railway:
```bash
# In Railway backend service, copy the public URL from Settings → Domains
NEXT_PUBLIC_API_URL=https://[your-backend-url].up.railway.app/api/v1
```

### Step 4: Redeploy Services

After updating environment variables:

1. **Backend API Service**: Click **Deploy** → **Redeploy**
2. **Frontend Service**: Click **Deploy** → **Redeploy**

Wait for both deployments to complete (usually 2-3 minutes each).

### Step 5: Verify CORS Configuration

Test the CORS debug endpoint:

```bash
curl https://orcamentosonline-production-2693.up.railway.app/api/v1/debug/cors
```

Expected response:
```json
{
  "corsOrigin": "https://www.webpropostas.com.br,...",
  "corsOptions": {
    "origin": [
      "http://localhost:3001",
      "http://127.0.0.1:3001",
      "https://frontend-production-0b59.up.railway.app",
      "https://proposals.infigital.net",
      "https://www.webpropostas.com.br",
      "https://webpropostas.com.br",
      ...
    ],
    "credentials": true
  }
}
```

## Quick Fix via Railway CLI

If you prefer CLI:

```bash
# Link to your project
railway link

# Set CORS_ORIGIN for backend API service
railway variables --set CORS_ORIGIN="https://www.webpropostas.com.br,https://webpropostas.com.br"

# Set FRONTEND_URL
railway variables --set FRONTEND_URL="https://www.webpropostas.com.br"

# Redeploy
railway up
```

## Troubleshooting

### Still Getting CORS Errors?

1. **Clear browser cache** (CORS headers can be cached)
2. **Try incognito/private mode**
3. **Check browser console** for the exact origin being sent
4. **Verify environment variables** were saved in Railway
5. **Check deployment logs** for any startup errors

### Check Request Origin

In browser console, check what origin is being sent:

```javascript
console.log(window.location.origin);
```

Make sure this exact value is in the `CORS_ORIGIN` environment variable.

### Alternative: Allow All Origins (TEMPORARY - NOT RECOMMENDED FOR PRODUCTION)

For testing only:

```bash
CORS_ORIGIN=*
```

⚠️ **WARNING:** Never use `*` in production! It's a security risk.

## Domain Configuration Notes

Your custom domain is now:
- **Production:** `webpropostas.com.br`
- **With www:** `www.webpropostas.com.br`

No special characters - no Punycode conversion needed!

## Additional Security (Optional)

Once CORS is working, consider:

1. **Enable rate limiting** (currently disabled in code)
2. **Add CSP headers** (already configured in Helmet)
3. **Enable HTTPS redirect** (should be automatic on Railway)
4. **Set secure cookies** for JWT tokens

## Support

If issues persist after following these steps:

1. Check Railway deployment logs: `railway logs`
2. Test API health: `curl https://[backend-url]/api/v1/health`
3. Review CORS debug endpoint: `/api/v1/debug/cors`
4. Verify DNS propagation: `nslookup webpropostas.com.br`

---

**Last Updated:** 2025-10-01
**Project:** WebPropostas (formerly OrçamentosOnline)
**Custom Domain:** www.webpropostas.com.br
