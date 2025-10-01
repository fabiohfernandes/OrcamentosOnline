# Railway CORS Fix - Manual CLI Commands

Run these commands in your terminal to fix CORS issues:

## Step 1: Navigate to API Directory

```bash
cd services/api
```

## Step 2: Link to Railway Backend Service

```bash
railway link
```

When prompted:
1. Select: **`orcamentos-api`** (or your backend service name)
2. Select environment: **`production`**

## Step 3: Set CORS_ORIGIN Environment Variable

```bash
railway variables --set "CORS_ORIGIN=https://www.webpropostas.com.br,https://webpropostas.com.br"
```

## Step 4: Set FRONTEND_URL Environment Variable

```bash
railway variables --set "FRONTEND_URL=https://www.webpropostas.com.br"
```

## Step 5: Deploy Backend

```bash
railway up
```

This will:
- Build the backend service
- Deploy to Railway
- Apply the new CORS configuration

## Step 6: Verify Deployment

Check deployment status:
```bash
railway status
```

View logs:
```bash
railway logs
```

## Step 7: Test CORS Configuration

Once deployed, test the CORS endpoint:

```bash
curl https://orcamentosonline-production-2693.up.railway.app/api/v1/debug/cors
```

Expected response should include:
```json
{
  "corsOptions": {
    "origin": [
      "https://www.webpropostas.com.br",
      "https://webpropostas.com.br",
      ...
    ]
  }
}
```

## Alternative: Set Variables Without Triggering Deploy

If you want to set multiple variables first, then deploy once:

```bash
# Set variables without auto-deploy
railway variables --set "CORS_ORIGIN=https://www.webpropostas.com.br,https://webpropostas.com.br" --skip-deploys
railway variables --set "FRONTEND_URL=https://www.webpropostas.com.br" --skip-deploys

# Then deploy manually
railway up
```

## For Frontend Service (If Needed)

If you also need to update the frontend:

```bash
# Navigate to frontend
cd ../frontend

# Link to frontend service
railway link
# Select: frontend-production or your frontend service

# Set API URL
railway variables --set "NEXT_PUBLIC_API_URL=https://orcamentosonline-production-2693.up.railway.app/api/v1"

# Deploy
railway up
```

## Troubleshooting

### If `railway link` doesn't work:

Try listing all projects:
```bash
railway list
```

Then link by project name:
```bash
# From services/api directory
railway link
# Manually select from the list
```

### If variables aren't being set:

Make sure you're in the correct service:
```bash
railway status  # Should show the backend service
```

### If deployment fails:

Check logs:
```bash
railway logs --follow
```

## Quick One-Liner (All Steps)

If you're already in the API directory and linked:

```bash
railway variables --set "CORS_ORIGIN=https://www.webpropostas.com.br,https://webpropostas.com.br" --set "FRONTEND_URL=https://www.webpropostas.com.br" && railway up
```

---

**After deployment completes (~2-3 minutes), test your frontend at:**
https://www.webpropostas.com.br/auth/register

The CORS errors should be gone! ✅
