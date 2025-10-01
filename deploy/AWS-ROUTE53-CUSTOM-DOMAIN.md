# AWS Route 53 Custom Domain Configuration for Railway

**Project:** WebPropostas
**Date:** 2025-09-30
**Status:** Production Deployment with Custom Domain

## Overview

This guide will walk you through configuring your custom domain in AWS Route 53 to point to your Railway services.

## Current Railway Services

- **Frontend:** https://angelic-perception-production.up.railway.app
- **Backend API:** https://orcamentosonline-production-2693.up.railway.app

## Recommended Domain Structure

```
proposals.infigital.net     → Frontend (Next.js application)
api.proposals.infigital.net → Backend API (Express server)
```

OR

```
app.infigital.net           → Frontend (Next.js application)
api.infigital.net           → Backend API (Express server)
```

---

## Part 1: Railway Custom Domain Setup

### Step 1: Add Custom Domain to Frontend Service

1. Go to Railway Dashboard: https://railway.com/project/8813d495-aad1-4b19-8cca-2c7f2861bd54
2. Click on **Frontend Service** (angelic-perception-production)
3. Go to **Settings** → **Domains**
4. Click **+ Custom Domain**
5. Enter your domain: `proposals.infigital.net` (or `app.infigital.net`)
6. Railway will provide you with DNS records to add

**Railway will show something like:**
```
Type: CNAME
Name: proposals (or app)
Value: angelic-perception-production.up.railway.app
TTL: 300
```

### Step 2: Add Custom Domain to Backend Service

1. Click on **Backend API Service** (orcamentosonline-production-2693)
2. Go to **Settings** → **Domains**
3. Click **+ Custom Domain**
4. Enter your domain: `api.proposals.infigital.net` (or `api.infigital.net`)
5. Railway will provide you with DNS records

**Railway will show something like:**
```
Type: CNAME
Name: api.proposals (or api)
Value: orcamentosonline-production-2693.up.railway.app
TTL: 300
```

---

## Part 2: AWS Route 53 DNS Configuration

### Step 1: Access Route 53

1. Log in to AWS Console: https://console.aws.amazon.com/
2. Navigate to **Route 53**
3. Click on **Hosted zones**
4. Select your hosted zone: `infigital.net`

### Step 2: Create CNAME Record for Frontend

1. Click **Create record**
2. Configure the record:
   ```
   Record name: proposals (or app)
   Record type: CNAME
   Value: angelic-perception-production.up.railway.app
   TTL: 300
   Routing policy: Simple routing
   ```
3. Click **Create records**

### Step 3: Create CNAME Record for Backend API

1. Click **Create record** again
2. Configure the record:
   ```
   Record name: api.proposals (or api)
   Record type: CNAME
   Value: orcamentosonline-production-2693.up.railway.app
   TTL: 300
   Routing policy: Simple routing
   ```
3. Click **Create records**

---

## Part 3: Update Application Configuration

### Step 1: Update Backend CORS Configuration

Update the CORS allowed origins in Railway Backend environment variables:

1. Go to Railway Backend service → **Variables**
2. Update `CORS_ORIGIN` to include your custom domains:

```
CORS_ORIGIN=https://proposals.infigital.net,https://angelic-perception-production.up.railway.app,http://localhost:3001
```

OR if using `app.infigital.net`:

```
CORS_ORIGIN=https://app.infigital.net,https://angelic-perception-production.up.railway.app,http://localhost:3001
```

### Step 2: Update Frontend API URL

Update the frontend environment variables:

1. Go to Railway Frontend service → **Variables**
2. Update `NEXT_PUBLIC_API_URL`:

```
NEXT_PUBLIC_API_URL=https://api.proposals.infigital.net
```

OR if using `api.infigital.net`:

```
NEXT_PUBLIC_API_URL=https://api.infigital.net
```

### Step 3: Update Frontend URL in Backend

1. Go to Railway Backend service → **Variables**
2. Update `FRONTEND_URL`:

```
FRONTEND_URL=https://proposals.infigital.net
```

OR:

```
FRONTEND_URL=https://app.infigital.net
```

---

## Part 4: Verification

### Step 1: Wait for DNS Propagation

- DNS changes can take **5-60 minutes** to propagate
- Check DNS propagation: https://www.whatsmydns.net/
- Search for: `proposals.infigital.net` (should show Railway CNAME)

### Step 2: Verify Railway SSL Certificates

Railway automatically provisions SSL certificates via Let's Encrypt. To verify:

1. Go to Railway Dashboard → Frontend service → **Settings** → **Domains**
2. Check that the custom domain shows a green checkmark ✅
3. Railway will show: **"Domain is active with SSL certificate"**

Repeat for Backend service.

### Step 3: Test Frontend Access

Open your browser and visit:
```
https://proposals.infigital.net
```

OR:
```
https://app.infigital.net
```

You should see the WebPropostas login page.

### Step 4: Test Backend API

Test the backend health endpoint:
```bash
curl https://api.proposals.infigital.net/health
```

OR:
```bash
curl https://api.infigital.net/health
```

Should return:
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-09-30T...",
  "uptime": 123456,
  "version": "1.0.0"
}
```

### Step 5: Test Authentication Flow

1. Visit frontend at `https://proposals.infigital.net`
2. Try registering a new user
3. Check browser console for API calls - should go to `https://api.proposals.infigital.net`
4. Verify no CORS errors
5. Confirm login works and dashboard loads

---

## Part 5: Update Local Environment Variables (Optional)

Update your local `.env` files to match production:

### Backend `.env` (services/api/.env)

```bash
# API Configuration
PORT=3000
NODE_ENV=development
API_VERSION=v1

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/orcamentos_online

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-development-secret
JWT_REFRESH_SECRET=your-development-refresh-secret

# Frontend URL
FRONTEND_URL=http://localhost:3001

# CORS
CORS_ORIGIN=http://localhost:3001,http://127.0.0.1:3001

# Production URLs (for reference)
# FRONTEND_URL=https://proposals.infigital.net
# CORS_ORIGIN=https://proposals.infigital.net
```

### Frontend `.env.local` (services/frontend/.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3000

# Production URLs (for reference)
# NEXT_PUBLIC_API_URL=https://api.proposals.infigital.net
# NEXT_PUBLIC_WS_URL=wss://api.proposals.infigital.net
```

---

## Troubleshooting

### Issue 1: DNS Not Resolving

**Symptoms:** `proposals.infigital.net` doesn't resolve or shows wrong IP

**Solution:**
1. Check Route 53 records are correct (CNAME, not A records)
2. Wait 5-15 minutes for DNS propagation
3. Flush local DNS cache:
   ```bash
   # Windows
   ipconfig /flushdns

   # macOS
   sudo dscacheutil -flushcache

   # Linux
   sudo systemd-resolve --flush-caches
   ```
4. Use different DNS server (8.8.8.8) to test:
   ```bash
   nslookup proposals.infigital.net 8.8.8.8
   ```

### Issue 2: CORS Errors

**Symptoms:** Frontend shows `Access-Control-Allow-Origin` errors in console

**Solution:**
1. Verify backend `CORS_ORIGIN` includes your custom domain
2. Check frontend is using correct API URL
3. Redeploy backend after environment variable changes
4. Clear browser cache and hard reload (Ctrl+Shift+R)

### Issue 3: SSL Certificate Pending

**Symptoms:** Railway shows "SSL certificate pending" or "Domain not verified"

**Solution:**
1. Ensure DNS records are correct (CNAME to Railway domain)
2. Wait 5-10 minutes for Railway to detect DNS changes
3. Railway will automatically provision Let's Encrypt certificate
4. Check Railway logs for SSL provisioning errors

### Issue 4: Frontend Loads But API Calls Fail

**Symptoms:** Login page loads but registration/login fails

**Solution:**
1. Open browser DevTools → Network tab
2. Check API calls are going to correct domain (`api.proposals.infigital.net`)
3. Verify backend `FRONTEND_URL` matches frontend domain
4. Check backend logs in Railway for errors
5. Verify all backend environment variables are set correctly

### Issue 5: Mixed Content Errors

**Symptoms:** Browser blocks requests due to "mixed content"

**Solution:**
1. Ensure ALL URLs use `https://` (not `http://`)
2. Check `NEXT_PUBLIC_API_URL` starts with `https://`
3. Verify no hardcoded `http://` URLs in frontend code
4. Railway provides automatic HTTPS - ensure you're using it

---

## Post-Configuration Checklist

- [ ] CNAME records created in Route 53 for frontend
- [ ] CNAME records created in Route 53 for backend API
- [ ] DNS propagation verified (whatsmydns.net)
- [ ] Railway shows custom domains as "Active" with SSL
- [ ] Backend `CORS_ORIGIN` updated with custom domain
- [ ] Frontend `NEXT_PUBLIC_API_URL` updated with custom API domain
- [ ] Backend `FRONTEND_URL` updated with custom frontend domain
- [ ] Frontend loads at custom domain with HTTPS
- [ ] Backend API health check responds at custom domain
- [ ] User registration works with custom domain
- [ ] User login works with custom domain
- [ ] Dashboard loads successfully
- [ ] No CORS errors in browser console
- [ ] All API calls use HTTPS
- [ ] SSL certificates active on both domains

---

## Alternative: Using Root Domain

If you want to use the root domain `infigital.net` instead of subdomains:

### Option A: Frontend at Root + API at Subdomain

```
infigital.net          → Frontend
api.infigital.net      → Backend API
```

**AWS Route 53 Configuration:**
1. Create **A record** (ALIAS) for root domain:
   - Name: (leave blank for root)
   - Type: A - IPv4 address
   - Alias: No
   - Value: Use CloudFront distribution or Route 53 Alias to Railway
2. Create **CNAME** for API:
   - Name: api
   - Type: CNAME
   - Value: orcamentosonline-production-2693.up.railway.app

**Note:** Railway doesn't support root domains directly. You'll need to:
1. Use AWS CloudFront in front of Railway, OR
2. Use Route 53 Alias to Railway's IP (not recommended - IPs change), OR
3. Use `www.infigital.net` as a subdomain instead

### Option B: Use WWW Subdomain

```
www.infigital.net      → Frontend
api.infigital.net      → Backend API
```

This works exactly like the subdomain approach above.

---

## Security Recommendations

### 1. Enable HSTS (HTTP Strict Transport Security)

Railway automatically enables HSTS with the following headers:
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### 2. Update Content Security Policy

If you add CSP headers in `next.config.js`, update to include your custom domains:

```javascript
{
  key: 'Content-Security-Policy',
  value: `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' https://api.proposals.infigital.net;
  `.replace(/\s{2,}/g, ' ').trim()
}
```

### 3. Rate Limiting

Consider adding rate limiting in your backend to prevent abuse:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api/', limiter);
```

### 4. DDoS Protection

Railway provides basic DDoS protection. For additional protection, consider:
- AWS CloudFront in front of Railway
- Cloudflare proxy (free tier available)
- AWS WAF (Web Application Firewall)

---

## Cost Considerations

### Railway Costs with Custom Domains

- **Custom Domains:** FREE (included in all plans)
- **SSL Certificates:** FREE (automatic Let's Encrypt)
- **Bandwidth:** $0.10/GB (after free tier)
- **Base Cost:** $20/month for services

### AWS Route 53 Costs

- **Hosted Zone:** $0.50/month
- **DNS Queries:** $0.40 per million queries (first 1 billion)
- **Estimated Monthly Cost:** ~$0.50-$2.00 (for typical usage)

**Total Estimated Monthly Cost:** $20.50-$22.00

---

## Next Steps After Custom Domain Setup

1. **Update Documentation** - Update all docs with new custom domain URLs
2. **Update Integrations** - Update any third-party integrations (Canva, Gamma, DocuSign)
3. **Configure Email** - Set up transactional email (SendGrid, AWS SES)
4. **Set Up Monitoring** - Configure uptime monitoring (UptimeRobot, Pingdom)
5. **Create Backups** - Set up automated database backups
6. **Performance Optimization** - Configure caching, CDN for assets
7. **Analytics Setup** - Add Google Analytics or similar
8. **SEO Configuration** - Add sitemap, robots.txt, meta tags

---

## Support and Resources

- **Railway Documentation:** https://docs.railway.app/guides/public-networking#custom-domains
- **AWS Route 53 Documentation:** https://docs.aws.amazon.com/route53/
- **DNS Checker:** https://www.whatsmydns.net/
- **SSL Checker:** https://www.ssllabs.com/ssltest/

---

**Document Version:** 1.0
**Last Updated:** 2025-09-30
**Maintained By:** WebPropostas Development Team
