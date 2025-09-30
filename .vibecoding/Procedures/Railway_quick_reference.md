# Railway Deployment Quick Reference Card

## 🚀 Essential Commands

### Setup & Authentication
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Check authentication
railway whoami
```

### Project Management
```bash
# Create new project
railway init

# Link existing project
railway link [PROJECT_ID]

# View project status
railway status

# Open dashboard
railway open
```

### Deployment
```bash
# Deploy from local directory
railway up

# Deploy detached (no logs)
railway up --detach

# Deploy to specific service
railway up --service=backend
```

### Environment Variables
```bash
# List all variables
railway variables

# Set variable
railway variables set KEY value

# Get specific variable
railway variables get KEY

# Delete variable
railway variables delete KEY
```

### Environments
```bash
# Switch environment
railway environment production

# Create environment
railway environment new staging

# List environments
railway environment
```

### Logging & Monitoring
```bash
# View logs
railway logs

# View build logs
railway logs --build

# View deployment logs
railway logs --deployment

# Follow logs in real-time
railway logs --follow
```

### Database Operations
```bash
# Add database service
railway add

# Connect to database shell
railway connect postgres
railway connect mysql
railway connect mongodb
railway connect redis
```

### Local Development
```bash
# Run with Railway environment
railway run npm start
railway run python app.py

# Open shell with Railway vars
railway shell
```

---

## 📋 Pre-Deployment Checklist

**Before every deployment:**
- [ ] Code committed to Git
- [ ] No hardcoded secrets
- [ ] .env.example created
- [ ] .gitignore configured
- [ ] Tests passing locally
- [ ] Railway CLI authenticated

---

## 🔧 Common Configuration

### package.json (Node.js)
```json
{
  "scripts": {
    "start": "node server.js",
    "build": "npm run compile"
  }
}
```

### Environment Variable Reference
```bash
# Reference another service's variable
DATABASE_URL=${{Postgres.DATABASE_URL}}
API_URL=${{backend.API_URL}}

# Reference shared variable
DOMAIN=${{shared.DOMAIN}}

# Railway-provided variables
PORT=${{PORT}}  # Auto-provided
```

### railway.json (Optional)
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## 🚨 Troubleshooting Quick Fixes

### Build Failed
```bash
# Check build logs
railway logs --build

# Common fix: Install missing dependency
npm install [package] --save
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push
```

### Deployment Failed
```bash
# Check deployment logs
railway logs --deployment

# Verify start command
cat package.json | grep "start"

# Ensure PORT is used
grep "process.env.PORT" server.js
```

### Can't Connect to Database
```bash
# Check database variables
railway variables | grep DATABASE

# Verify database service running
railway status

# Test connection locally
railway run npm start
```

### Environment Variable Not Loading
```bash
# Verify variable is set
railway variables

# Redeploy after setting variable
railway up

# Check if code loads dotenv (for local dev)
grep "dotenv" package.json
```

---

## 🎯 Deployment Workflow

### Method 1: GitHub Auto-Deploy
```bash
1. git add .
2. git commit -m "Your message"
3. git push origin main
4. # Railway auto-deploys
5. railway logs  # Monitor
```

### Method 2: CLI Deploy
```bash
1. railway link [PROJECT_ID]
2. railway up
3. railway open  # View dashboard
```

---

## 💡 Best Practices

**Security:**
- ✅ Use environment variables for secrets
- ✅ Never commit .env files
- ✅ Use sealed variables for sensitive data
- ✅ Rotate API keys regularly

**Performance:**
- ✅ Enable auto-sleep for dev environments
- ✅ Set usage limits
- ✅ Use connection pooling for databases
- ✅ Implement healthcheck endpoints

**Monitoring:**
- ✅ Check logs regularly: `railway logs`
- ✅ Monitor metrics in dashboard
- ✅ Set up deployment notifications
- ✅ Review usage and costs

---

## 📞 Getting Help

- **Documentation:** https://docs.railway.com
- **Discord Community:** https://discord.gg/railway
- **CLI Help:** `railway help`
- **Status Page:** https://status.railway.com

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| Dashboard | https://railway.com/dashboard |
| Templates | https://railway.com/templates |
| Documentation | https://docs.railway.com |
| CLI Reference | https://docs.railway.com/reference/cli-api |
| Pricing | https://railway.com/pricing |

---

## ⚡ Quick Deploy (New Project)

```bash
# 1. Login
railway login

# 2. Create project
railway init

# 3. Set environment variables
railway variables set NODE_ENV production
railway variables set API_KEY your_key

# 4. Add database (if needed)
railway add

# 5. Deploy
railway up

# 6. Generate domain
railway domain

# 7. Open in browser
railway open
```

---

## 🔄 Update Existing Deployment

```bash
# Make changes to code

# Commit and push (for GitHub auto-deploy)
git add .
git commit -m "Update feature"
git push origin main

# Or deploy via CLI
railway up

# Monitor deployment
railway logs --follow
```

---

## 📊 Monitoring Commands

```bash
# Real-time logs
railway logs --follow

# Last 100 lines
railway logs | tail -n 100

# Search logs for errors
railway logs | grep -i error

# Check service health
railway status

# View metrics
railway open  # Go to Metrics tab
```

---

*Keep this reference handy for quick Railway deployments!*