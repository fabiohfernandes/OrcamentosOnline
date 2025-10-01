# Custom Domain Quick Setup Checklist

**Project:** WebPropostas
**Estimated Time:** 30-45 minutes (including DNS propagation)

---

## ☑️ Pre-Setup Information

**Decide on your domain structure:**

Option 1 (Recommended):
- [ ] Frontend: `proposals.infigital.net`
- [ ] Backend: `api.proposals.infigital.net`

Option 2:
- [ ] Frontend: `app.infigital.net`
- [ ] Backend: `api.infigital.net`

**Write down your choices:**
```
Frontend domain: _______________________
Backend domain:  _______________________
```

---

## Part 1: Railway Configuration (5 minutes)

### Frontend Service
- [ ] Go to Railway Dashboard
- [ ] Select Frontend service (angelic-perception-production)
- [ ] Click Settings → Domains
- [ ] Click "+ Custom Domain"
- [ ] Enter: `proposals.infigital.net` (or your chosen domain)
- [ ] **Copy the CNAME value Railway provides**
- [ ] Write it here: `_______________________`

### Backend Service
- [ ] Select Backend service (orcamentosonline-production-2693)
- [ ] Click Settings → Domains
- [ ] Click "+ Custom Domain"
- [ ] Enter: `api.proposals.infigital.net` (or your chosen domain)
- [ ] **Copy the CNAME value Railway provides**
- [ ] Write it here: `_______________________`

---

## Part 2: AWS Route 53 Configuration (5 minutes)

### Access Route 53
- [ ] Log in to AWS Console
- [ ] Navigate to Route 53
- [ ] Select hosted zone: `infigital.net`

### Create Frontend CNAME
- [ ] Click "Create record"
- [ ] Record name: `proposals` (or `app`)
- [ ] Record type: `CNAME`
- [ ] Value: `angelic-perception-production.up.railway.app`
- [ ] TTL: `300`
- [ ] Click "Create records"

### Create Backend CNAME
- [ ] Click "Create record"
- [ ] Record name: `api.proposals` (or `api`)
- [ ] Record type: `CNAME`
- [ ] Value: `orcamentosonline-production-2693.up.railway.app`
- [ ] TTL: `300`
- [ ] Click "Create records"

---

## Part 3: Update Environment Variables (10 minutes)

### Backend Service - Railway Variables

- [ ] Go to Railway → Backend service → Variables
- [ ] Update these variables:

```bash
CORS_ORIGIN=https://proposals.infigital.net,https://angelic-perception-production.up.railway.app,http://localhost:3001

FRONTEND_URL=https://proposals.infigital.net
```

**Replace `proposals.infigital.net` with your chosen frontend domain**

- [ ] Click "Save" (Railway will automatically redeploy)

### Frontend Service - Railway Variables

- [ ] Go to Railway → Frontend service → Variables
- [ ] Update these variables:

```bash
NEXT_PUBLIC_API_URL=https://api.proposals.infigital.net
```

**Replace `api.proposals.infigital.net` with your chosen backend domain**

- [ ] Click "Save" (Railway will automatically redeploy)

---

## Part 4: Wait for Propagation (15-30 minutes)

### DNS Propagation
- [ ] Wait 5-15 minutes
- [ ] Check DNS: https://www.whatsmydns.net/
- [ ] Search for your frontend domain: `proposals.infigital.net`
- [ ] Should show Railway's CNAME value
- [ ] Check backend domain: `api.proposals.infigital.net`
- [ ] Should show Railway's CNAME value

### Railway SSL Provisioning
- [ ] Go to Railway → Frontend service → Settings → Domains
- [ ] Wait for green checkmark ✅ next to custom domain
- [ ] Should show: "Domain is active with SSL certificate"
- [ ] Check Backend service same way

---

## Part 5: Verification (5-10 minutes)

### Test Frontend
- [ ] Open browser
- [ ] Visit: `https://proposals.infigital.net`
- [ ] Should see WebPropostas login page
- [ ] No SSL warnings
- [ ] No mixed content errors

### Test Backend API
- [ ] Run in terminal:
```bash
curl https://api.proposals.infigital.net/health
```
- [ ] Should return JSON with `"status": "healthy"`

### Test Full Authentication Flow
- [ ] Visit frontend at custom domain
- [ ] Open browser DevTools → Console
- [ ] Try to register new user
- [ ] Check Network tab - API calls go to `api.proposals.infigital.net`
- [ ] No CORS errors
- [ ] Registration succeeds
- [ ] Login works
- [ ] Dashboard loads

### Browser Console Check
- [ ] Press F12 to open DevTools
- [ ] Go to Console tab
- [ ] No errors related to:
  - [ ] CORS
  - [ ] Mixed content (http/https)
  - [ ] SSL certificates
  - [ ] API calls

---

## Final Checklist

- [ ] ✅ Frontend accessible at custom domain with HTTPS
- [ ] ✅ Backend API responds at custom domain with HTTPS
- [ ] ✅ SSL certificates active (green lock icon in browser)
- [ ] ✅ Authentication flow works end-to-end
- [ ] ✅ Dashboard loads successfully
- [ ] ✅ No errors in browser console
- [ ] ✅ Railway shows both custom domains as "Active"

---

## Quick Commands Reference

### Check DNS Resolution
```bash
# Check frontend DNS
nslookup proposals.infigital.net

# Check backend DNS
nslookup api.proposals.infigital.net

# Using Google DNS
nslookup proposals.infigital.net 8.8.8.8
```

### Test Backend Health
```bash
# Health check
curl https://api.proposals.infigital.net/health

# With headers
curl -v https://api.proposals.infigital.net/health
```

### Flush Local DNS Cache
```bash
# Windows
ipconfig /flushdns

# macOS
sudo dscacheutil -flushcache

# Linux
sudo systemd-resolve --flush-caches
```

---

## Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| DNS not resolving | Wait 10-15 more minutes, check Route 53 records |
| SSL certificate pending | Wait for Railway to provision (5-10 minutes) |
| CORS errors | Verify backend `CORS_ORIGIN` includes custom domain |
| API calls fail | Check `NEXT_PUBLIC_API_URL` in frontend variables |
| Mixed content | Ensure all URLs use `https://` |
| 502 Bad Gateway | Check Railway service is running and healthy |

---

## Support

- **Railway Dashboard:** https://railway.com/project/8813d495-aad1-4b19-8cca-2c7f2861bd54
- **AWS Route 53:** https://console.aws.amazon.com/route53/
- **DNS Checker:** https://www.whatsmydns.net/
- **SSL Checker:** https://www.ssllabs.com/ssltest/

---

**Total Time:** 30-45 minutes
**Difficulty:** Intermediate
**Prerequisites:** AWS account with Route 53 access, Railway project deployed
