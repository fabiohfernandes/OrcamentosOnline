# Railway Emergency Recovery Playbook

## 🚨 Quick Response Guide for Production Issues

---

## 📞 EMERGENCY DECISION TREE

### START HERE: Is your production application down?

```
┌─────────────────────────────────────┐
│  Production Application Issue?      │
└──────────────┬──────────────────────┘
               │
               ├─ YES, completely down → GO TO: CRITICAL PATH A
               ├─ YES, slow/degraded → GO TO: CRITICAL PATH B  
               ├─ NO, but errors → GO TO: DIAGNOSTIC PATH C
               └─ Deployment failed → GO TO: DEPLOYMENT PATH D
```

---

## 🔴 CRITICAL PATH A: Production is DOWN

### ⏱️ TIME SENSITIVE - Act within 2 minutes

**Symptoms:**
- 502/503 errors on all requests
- Domain not loading
- "Application failed to respond"
- Users cannot access the site

**IMMEDIATE ACTIONS (in order):**

#### Step 1: Check Railway Status (10 seconds)
```bash
# Visit: https://status.railway.com
# Or check from terminal:
curl -s https://status.railway.com | grep -i "operational\|incident"
```

**If Railway has incident:**
- ✅ Not your fault
- ⏰ Monitor Railway status page
- 💬 Inform users it's a platform issue
- ⏭️  Skip to Step 5

**If Railway is operational:**
- ⏭️  Continue to Step 2

---

#### Step 2: Quick Service Check (20 seconds)
```bash
# Check service status
railway status

# Check if service is running
railway logs | tail -n 5
```

**What you're looking for:**
- Is service listed as "Running"?
- Are there recent error messages?
- Did service recently restart?

**Decision:**
- If service is "Stopped" or "Crashed" → Step 3
- If service is "Running" but not responding → Step 4
- If you see errors → Note them and continue

---

#### Step 3: Immediate Restart (30 seconds)
```bash
# Force restart the service
railway down
sleep 5
railway up --detach

# Monitor logs
railway logs --follow
```

**Watch for:**
- "Server listening on port..."
- "Application started"
- No immediate crashes

**If restart works:**
- ✅ Monitor for 5 minutes
- ⏭️  GO TO: POST-RECOVERY (Section below)

**If restart fails:**
- ⏭️  GO TO: Step 4 (Rollback)

---

#### Step 4: Emergency Rollback (60 seconds)
```bash
# Stop current deployment
railway down

# Find last working commit
git log --oneline -n 10

# Identify last working version (usually previous commit)
# Checkout that commit
git checkout <previous-working-commit-hash>

# Deploy previous version
railway up

# Monitor recovery
railway logs --follow
```

**Alternative rollback via Dashboard:**
1. Open Railway Dashboard
2. Go to Deployments tab
3. Find last successful deployment
4. Click "Redeploy"
5. Monitor logs

**After rollback:**
- ✅ Service should be restored
- ⚠️  You're running old code
- 📝 Document what broke
- ⏭️  GO TO: POST-RECOVERY

**If rollback fails:**
- ⏭️  GO TO: Step 5 (Emergency mode)

---

#### Step 5: Emergency Mode - Fresh Deployment (90 seconds)
```bash
# This is nuclear option - fresh start

# 1. Get to known good state
git checkout main  # or your stable branch
git pull origin main

# 2. Verify environment variables
railway variables

# 3. Clear and redeploy
railway down
sleep 10
railway up

# 4. Generate new domain if needed
railway domain

# 5. Monitor closely
railway logs --follow
```

**If this fails:**
- 🆘 Escalate to Railway Support immediately
- 📱 Contact team/stakeholders
- 📋 Prepare detailed error report
- ⏱️  Estimate downtime
- 💬 Update users/status page

---

### 📞 ESCALATION CHECKLIST

When escalating to Railway Support:

**Information to gather BEFORE contacting:**
```bash
# 1. Service details
railway status > incident-status.txt

# 2. Recent logs
railway logs --deployment > incident-deploy-logs.txt
railway logs > incident-app-logs.txt

# 3. Environment info
railway variables > incident-variables.txt
# (Review and REMOVE sensitive values before sharing)

# 4. Timeline
echo "Incident started: $(date -u)" > incident-timeline.txt
echo "Last working: [time]" >> incident-timeline.txt
echo "Actions taken: [list]" >> incident-timeline.txt
```

**Contact Railway:**
- Support: https://railway.com/support
- Discord: https://discord.gg/railway (fastest)
- Email: [email protected]

**Include:**
- Project ID
- Service ID
- Timeline of issue
- Steps already attempted
- Logs attached

---

## 🟡 CRITICAL PATH B: Slow/Degraded Performance

### ⏱️ Not down, but users affected

**Symptoms:**
- Requests timing out occasionally
- Very slow response times
- Intermittent 502/504 errors
- Users reporting issues

**DIAGNOSTIC ACTIONS:**

#### Action 1: Check Resource Usage (30 seconds)
```bash
# View current metrics
railway status

# Check logs for memory/CPU warnings
railway logs | grep -i "memory\|cpu\|timeout\|slow"
```

**Look for:**
- Memory usage near limit
- OOM (Out of Memory) kills
- CPU spikes
- Database connection errors

---

#### Action 2: Check Database Performance (60 seconds)
```bash
# Test database connection
railway run node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
console.time('query');
pool.query('SELECT 1').then(() => {
  console.timeEnd('query');
  process.exit(0);
}).catch(err => {
  console.error('DB Error:', err.message);
  process.exit(1);
});
"

# Check database service status
railway status | grep -i postgres
```

**If database is slow:**
```sql
-- Check for long-running queries (if you can access DB)
SELECT pid, now() - query_start as duration, query 
FROM pg_stat_activity 
WHERE state = 'active' 
ORDER BY duration DESC;

-- Check database connections
SELECT count(*) FROM pg_stat_activity;
```

---

#### Action 3: Scale Resources (if needed)
```bash
# Railway scales automatically, but you can restart to force reallocation
railway down && railway up

# Or increase resources manually in Railway Dashboard:
# Settings → Resources → Adjust memory/CPU
```

---

#### Action 4: Implement Quick Fixes

**For Memory Issues:**
```javascript
// Add to your code temporarily
setInterval(() => {
  if (global.gc) {
    global.gc();
    console.log('Manual GC triggered');
  }
}, 60000);

// Run with:
// node --expose-gc server.js
```

**For Connection Pool Issues:**
```javascript
// Reduce pool size temporarily
const pool = new Pool({
  max: 10, // Reduce from higher number
  idleTimeoutMillis: 10000,
});
```

**For External API Timeouts:**
```javascript
// Add aggressive timeouts
axios.defaults.timeout = 3000; // 3 seconds
```

**Deploy quick fix:**
```bash
git add .
git commit -m "Emergency: Reduce resource usage"
git push origin main
railway logs --follow
```

---

## 🔵 DIAGNOSTIC PATH C: Errors but Service Running

### ⏱️ Service up, but generating errors

**Symptoms:**
- Application is accessible
- Some features broken
- Errors in logs
- User reports of issues

#### Diagnostic Procedure:

**Step 1: Identify Error Pattern (2 minutes)**
```bash
# Get recent errors
railway logs | grep -i "error" | tail -n 20

# Count error types
railway logs | grep -i "error" | cut -d: -f1 | sort | uniq -c | sort -nr

# Check error frequency
railway logs | grep -i "error" | wc -l
```

**Step 2: Categorize the Error**

Use this decision tree:

```
Error Type?
├─ "Cannot find module" → Missing Dependency → FIX-001
├─ "CORS" → CORS Issue → FIX-002
├─ "ECONNREFUSED" → Database Connection → FIX-003
├─ "undefined" / "null" → Environment Variable → FIX-004
├─ "EADDRINUSE" → Port Conflict → FIX-005
├─ "timeout" → Performance Issue → FIX-006
└─ Other → GO TO: Custom Diagnostic
```

---

### FIX-001: Missing Dependency

**Quick Fix:**
```bash
# Identify missing package from error
# Example error: "Cannot find module 'express'"

# Install locally
npm install express --save

# Verify package.json updated
git diff package.json

# Deploy fix
git add package.json package-lock.json
git commit -m "Fix: Add missing express dependency"
git push origin main

# Monitor deployment
railway logs --follow
```

**Time to fix:** 2-3 minutes

---

### FIX-002: CORS Issue

**Quick Fix:**
```javascript
// Add to your main server file (temporary fix)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Deploy
git add .
git commit -m "Fix: Enable CORS for all origins (temporary)"
git push origin main
```

**Time to fix:** 2 minutes

**Follow-up:** Implement proper CORS configuration later

---

### FIX-003: Database Connection

**Quick Fix:**
```bash
# 1. Verify DATABASE_URL is set
railway variables get DATABASE_URL

# 2. If not set or wrong format
railway variables set DATABASE_URL '${{Postgres.DATABASE_URL}}'

# 3. Restart service
railway down && railway up

# 4. Verify connection
railway run node -e "
const { Pool } = require('pg');
new Pool({connectionString: process.env.DATABASE_URL})
  .query('SELECT 1')
  .then(() => console.log('✅ Connected'))
  .catch(e => console.error('❌ Failed:', e.message));
"
```

**Time to fix:** 3-4 minutes

---

### FIX-004: Environment Variable Missing

**Quick Fix:**
```bash
# 1. Identify missing variable from logs
railway logs | grep -i "undefined\|not defined" | tail -5

# 2. Set the variable
railway variables set VARIABLE_NAME "value"

# 3. Redeploy (Railway auto-redeploys on variable change)
# Or force redeploy:
railway up

# 4. Verify in logs
railway logs | grep "VARIABLE_NAME"
```

**Time to fix:** 1-2 minutes

---

### FIX-005: Port Conflict

**Quick Fix:**
```javascript
// Update your server file
const PORT = process.env.PORT || 3000;

// Change listen call
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server on port ${PORT}`);
});

// Deploy
git add .
git commit -m "Fix: Use PORT environment variable"
git push origin main
```

**Time to fix:** 2 minutes

---

### FIX-006: Performance/Timeout Issue

**Immediate Actions:**
```bash
# 1. Restart service
railway down && railway up

# 2. Check for long-running operations in logs
railway logs | grep -i "timeout\|slow\|performance"

# 3. Add request timeout temporarily
```

```javascript
// In your code (quick fix)
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 seconds
  next();
});
```

**Time to fix:** 2-3 minutes

---

## 🟣 DEPLOYMENT PATH D: Deployment Failed

### ⏱️ Deploy attempt failed

**Symptoms:**
- Deployment shows as "Failed"
- Build errors
- Deploy errors
- Stuck deployment

#### Diagnostic Procedure:

**Step 1: Get Error Details (30 seconds)**
```bash
# View build logs
railway logs --build

# View deployment logs
railway logs --deployment

# Get last 50 lines
railway logs | tail -n 50
```

**Step 2: Identify Failure Stage**
```
Where did it fail?
├─ During build → Build Failure (Path D1)
├─ During deploy → Deploy Failure (Path D2)
└─ Stuck/Hanging → Hung Deployment (Path D3)
```

---

### PATH D1: Build Failure

**Common Causes & Fixes:**

**Cause 1: ESLint/TypeScript Errors**
```bash
# Quick fix: Bypass strict checks
# In Railway service settings or railway.json
{
  "build": {
    "buildCommand": "CI=false npm run build"
  }
}

# Or in package.json
{
  "scripts": {
    "build": "CI=false react-scripts build"
  }
}

# Commit and push
git add .
git commit -m "Fix: Disable CI strict mode for build"
git push origin main
```

**Cause 2: Missing Dependencies**
```bash
# Find missing package from logs
railway logs --build | grep "Cannot find"

# Install it
npm install <package> --save

# Commit
git add package.json package-lock.json
git commit -m "Fix: Add missing dependency"
git push origin main
```

**Cause 3: Memory/Timeout**
```json
// railway.json - increase resources
{
  "build": {
    "builder": "NIXPACKS"
  }
}
```

---

### PATH D2: Deploy Failure

**Common Causes & Fixes:**

**Cause 1: Start Command Failed**
```bash
# Check start command in package.json
cat package.json | grep '"start"'

# Ensure it's correct:
{
  "scripts": {
    "start": "node server.js"  // Or your actual entry point
  }
}

# If using Railway.json, verify:
{
  "deploy": {
    "startCommand": "npm start"
  }
}
```

**Cause 2: Port Not Binding**
```javascript
// Fix in code
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0');

// Commit and deploy
```

**Cause 3: Environment Variables**
```bash
# Verify all required variables are set
railway variables

# Set any missing
railway variables set KEY value

# Redeploy
railway up
```

---

### PATH D3: Hung Deployment

**Immediate Actions:**
```bash
# 1. Cancel deployment
railway down

# 2. Wait 30 seconds
sleep 30

# 3. Try different region
# Go to Railway Dashboard → Project Settings → Change region

# 4. Retry deployment
railway up
```

**If still stuck:**
```bash
# Try force-clean approach
railway down
rm -rf node_modules
npm install
git add package-lock.json
git commit -m "Rebuild dependencies"
git push origin main
```

---

## 📋 POST-RECOVERY CHECKLIST

### After resolving any issue:

- [ ] **Verify Service is Running**
  ```bash
  railway status
  railway logs | tail -n 20
  ```

- [ ] **Test Functionality**
  ```bash
  # Test main endpoint
  curl https://your-app.railway.app
  
  # Test critical features
  # [Your specific tests]
  ```

- [ ] **Monitor for 10 Minutes**
  ```bash
  # Watch for recurring errors
  railway logs --follow
  ```

- [ ] **Document the Incident**
  ```markdown
  ## Incident Report
  - Date/Time: [timestamp]
  - Duration: [X minutes]
  - Issue: [description]
  - Root Cause: [what went wrong]
  - Fix Applied: [what you did]
  - Prevention: [how to avoid in future]
  ```

- [ ] **Update Monitoring**
  - Set up alerts if not already configured
  - Add health checks if missing
  - Implement better logging

- [ ] **Communicate**
  - Inform team/stakeholders
  - Update users if public-facing
  - Document in internal wiki/docs

---

## 🔧 RECOVERY TOOLS & COMMANDS

### Quick Command Reference:

```bash
# === SERVICE CONTROL ===
railway status                    # Check service status
railway down                      # Stop service
railway up                        # Deploy/restart service
railway up --detach              # Deploy without watching

# === LOGS ===
railway logs                      # View all logs
railway logs --build             # Build logs only
railway logs --deployment        # Deploy logs only
railway logs --follow            # Real-time logs
railway logs | tail -n 50        # Last 50 lines
railway logs | grep "error"      # Filter errors

# === VARIABLES ===
railway variables                 # List all variables
railway variables get KEY         # Get specific variable
railway variables set KEY value   # Set variable
railway variables delete KEY      # Remove variable

# === ENVIRONMENT ===
railway environment              # Show current env
railway environment production   # Switch to production

# === QUICK TESTS ===
railway run npm start            # Test locally with Railway env
railway run node test.js         # Run test script

# === DATABASE ===
railway connect postgres         # Connect to PostgreSQL shell

# === PROJECT ===
railway link [PROJECT_ID]        # Link to project
railway open                     # Open dashboard
```

---

## 📊 INCIDENT SEVERITY LEVELS

### Level 1: CRITICAL (Red)
- **Definition:** Complete service outage
- **Response Time:** < 2 minutes
- **Action:** Immediate rollback or restart
- **Examples:** 502/503 errors, service completely down

### Level 2: HIGH (Orange)
- **Definition:** Degraded performance affecting users
- **Response Time:** < 10 minutes
- **Action:** Diagnose and fix or scale
- **Examples:** Slow responses, timeouts, high error rate

### Level 3: MEDIUM (Yellow)
- **Definition:** Errors but service functional
- **Response Time:** < 30 minutes
- **Action:** Fix and deploy update
- **Examples:** CORS errors, missing features, some errors

### Level 4: LOW (Blue)
- **Definition:** Minor issues, no user impact
- **Response Time:** < 24 hours
- **Action:** Schedule fix for next deployment
- **Examples:** Warnings in logs, non-critical feature issues

---

## 🎯 PREVENTION CHECKLIST

To avoid future incidents:

### Pre-Deployment:
- [ ] Run all validation scripts
- [ ] Test build locally
- [ ] Verify environment variables
- [ ] Check database migrations
- [ ] Review recent changes

### Monitoring:
- [ ] Set up health check endpoint
- [ ] Enable error tracking (Sentry, etc.)
- [ ] Configure usage alerts
- [ ] Monitor Railway metrics
- [ ] Set up uptime monitoring

### Documentation:
- [ ] Document architecture
- [ ] Maintain runbook
- [ ] Keep environment variables documented
- [ ] Document rollback procedure
- [ ] Create incident response plan

### Backups:
- [ ] Regular database backups
- [ ] Tag stable releases
- [ ] Keep previous deployment accessible
- [ ] Document known working configurations

---

## 📞 EMERGENCY CONTACTS

**Internal:**
- Team Lead: [Contact]
- DevOps: [Contact]
- On-Call: [Contact]

**External:**
- Railway Support: https://railway.com/support
- Railway Discord: https://discord.gg/railway
- Railway Status: https://status.railway.com

**Services:**
- Database Provider: [If external]
- Monitoring Service: [Contact]
- DNS Provider: [Contact]

---

## 🔐 EMERGENCY ACCESS

**Railway Access:**
- Dashboard: https://railway.com/dashboard
- CLI Auth: `railway login`
- Project ID: [Your Project ID]
- API Token: [Stored securely]

**Git Access:**
- Repository: [GitHub URL]
- Main Branch: `main`
- Emergency Branch: `hotfix/*`

**Database Access:**
- Connection: Via `railway connect`
- Backup Location: [If applicable]
- Admin Panel: [If applicable]

---

*Keep this playbook accessible during incidents. Practice recovery procedures during non-critical times.*

**Last Updated:** 2025
**Next Review:** [Set quarterly review]