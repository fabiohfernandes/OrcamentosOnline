# Railway Error Library & Solutions Database

## Complete Reference of Common Railway Errors with Solutions

---

## 📚 How to Use This Library

**For Railway Conductor AI Agent:**
```
Railway Conductor: I'm getting this error: [paste error message]

Search your Error Library and provide:
1. Error identification and category
2. Root cause explanation
3. Step-by-step solution
4. Prevention tips
5. Related errors to watch for
```

**For Manual Reference:**
- Use Ctrl+F to search for your error message
- Each error includes symptoms, causes, and solutions
- Solutions are ordered by likelihood/frequency

---

## 🚨 CRITICAL ERRORS (Production Breaking)

### ERROR 1: Application Failed to Respond

**Error Messages:**
```
Application failed to respond
This error appears to be caused by the application
502 Bad Gateway
503 Service Unavailable
```

**Symptoms:**
- Domain returns 502/503 error
- Service shows as "Running" but not accessible
- Intermittent connectivity issues

**Root Causes:**
1. **Not binding to 0.0.0.0** (Most Common - 60%)
   - Application listening on localhost or 127.0.0.1
   - Must listen on 0.0.0.0 to accept external connections

2. **Not using PORT environment variable** (30%)
   - Hardcoded port like 3000 or 8080
   - Railway assigns dynamic PORT

3. **Application crashes after start** (5%)
   - Silent failures in initialization
   - Uncaught exceptions

4. **Health check timeout** (3%)
   - Application takes too long to start
   - Health check endpoint not responding

5. **Target port mismatch** (2%)
   - Domain target port doesn't match app listening port

**Solutions:**

**Solution A: Fix Host Binding (60% success rate)**
```javascript
// ❌ WRONG - Will not work on Railway
app.listen(3000, 'localhost', () => {
  console.log('Server running');
});

// ✅ CORRECT - Works on Railway
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

```python
# ❌ WRONG
app.run(host='127.0.0.1', port=3000)

# ✅ CORRECT
import os
port = int(os.getenv('PORT', 3000))
app.run(host='0.0.0.0', port=port)
```

**Solution B: Use Dynamic PORT**
```bash
# Check logs for port binding
railway logs | grep -i "listening\|port\|started"

# Verify PORT environment variable exists
railway variables | grep PORT

# If missing, Railway provides it automatically
# Just ensure your code reads process.env.PORT
```

**Solution C: Check Application Logs**
```bash
# Get full deployment logs
railway logs --deployment

# Look for crash messages
railway logs | grep -i "error\|exception\|crash"

# Check if app actually started
railway logs | grep -i "server\|listening\|ready"
```

**Solution D: Adjust Health Check**
```json
// railway.json
{
  "deploy": {
    "healthcheckPath": "/",
    "healthcheckTimeout": 300,
    "restartPolicyType": "ON_FAILURE"
  }
}
```

**Solution E: Verify Target Port**
```
1. Go to Service Settings → Networking
2. Check "Target Port" matches your app's listening port
3. Default is 3000, change if your app uses different port
4. Redeploy after changing
```

**Prevention:**
- Always use `0.0.0.0` as host
- Always use `process.env.PORT` or equivalent
- Add logging when server starts
- Implement `/health` endpoint
- Test locally with: `PORT=8080 npm start`

---

### ERROR 2: Build Failed - Exit Code 1

**Error Messages:**
```
ERROR: executor failed running [...]: exit code: 1
Docker build failed
npm ERR! code ELIFECYCLE
```

**Symptoms:**
- Build process terminates prematurely
- No successful build artifact created
- Deployment never reaches deploy phase

**Root Causes:**
1. **ESLint/TypeScript errors treated as failures** (40%)
   - CI environment treats warnings as errors
   - Strict linting rules

2. **Missing dependencies** (25%)
   - Package not in package.json
   - package-lock.json out of sync

3. **Build command errors** (20%)
   - Invalid build script
   - Missing build tools

4. **Memory/timeout during build** (10%)
   - Large dependencies
   - Complex build process

5. **Node/Python version mismatch** (5%)
   - Incompatible runtime version

**Solutions:**

**Solution A: Disable CI Strict Mode (For React/CRA)**
```bash
# Option 1: In Railway service settings
Build Command: CI=false npm run build

# Option 2: In package.json
{
  "scripts": {
    "build": "CI=false react-scripts build"
  }
}

# Option 3: Create .env.production
CI=false
```

**Solution B: Fix Missing Dependencies**
```bash
# Find the missing package from error log
railway logs --build | grep "Cannot find module"

# Install locally
npm install [package-name] --save

# Verify package.json updated
git diff package.json

# Commit and push
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push
```

**Solution C: Sync Lock File**
```bash
# Delete and regenerate lock file
rm package-lock.json
npm install

# Or for yarn
rm yarn.lock
yarn install

# Commit new lock file
git add package-lock.json
git commit -m "Regenerate lock file"
git push
```

**Solution D: Specify Runtime Version**
```bash
# For Node.js - create .nvmrc
echo "18" > .nvmrc

# Or use engines in package.json
{
  "engines": {
    "node": "18.x",
    "npm": "9.x"
  }
}

# For Python - create runtime.txt
echo "3.11" > runtime.txt
```

**Solution E: Increase Build Resources**
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  }
}
```

**Prevention:**
- Commit package-lock.json/yarn.lock
- Test build locally: `npm run build`
- Use exact version pins for critical deps
- Keep ESLint rules consistent with CI
- Document build requirements in README

---

### ERROR 3: CORS Policy Error

**Error Messages:**
```
Access to XMLHttpRequest has been blocked by CORS policy
No 'Access-Control-Allow-Origin' header
CORS error
```

**Symptoms:**
- Frontend can't reach backend API
- Network tab shows CORS errors
- Requests fail in browser (but work in Postman)

**Root Causes:**
1. **Backend not configured for CORS** (50%)
   - No CORS middleware installed
   - CORS not enabled

2. **Wrong origin in CORS config** (30%)
   - Localhost configured for production
   - Missing production domain

3. **Missing preflight headers** (15%)
   - OPTIONS requests not handled
   - Headers not allowed

4. **Credentials not handled** (5%)
   - withCredentials without proper config

**Solutions:**

**Solution A: Enable CORS - Express.js**
```javascript
// Install cors package
// npm install cors

const cors = require('cors');

// ❌ WRONG - Too permissive for production
app.use(cors());

// ✅ CORRECT - Specific origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://yourfrontend.railway.app',
  'https://yourdomain.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS not allowed'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

**Solution B: Enable CORS - FastAPI/Python**
```python
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "http://localhost:3000",
    "https://yourfrontend.railway.app",
    "https://yourdomain.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Solution C: Enable CORS - Flask**
```python
from flask_cors import CORS

# Basic CORS
CORS(app)

# Or with specific configuration
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "https://yourfrontend.railway.app"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
```

**Solution D: Use Environment Variables**
```javascript
// Backend - read allowed origins from env
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// In Railway: Set variable
// ALLOWED_ORIGINS=https://frontend.railway.app,https://yourdomain.com
```

**Solution E: Test CORS with cURL**
```bash
# Test if CORS headers are present
curl -H "Origin: https://yourfrontend.railway.app" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     -I https://yourbackend.railway.app/api/endpoint

# Should see:
# Access-Control-Allow-Origin: https://yourfrontend.railway.app
# Access-Control-Allow-Methods: POST
# Access-Control-Allow-Headers: Content-Type
```

**Prevention:**
- Configure CORS on day one
- Use environment variables for origins
- Test with actual domains, not just localhost
- Document all allowed origins
- Don't use `*` in production

---

### ERROR 4: Database Connection Failed

**Error Messages:**
```
ECONNREFUSED
Connection refused
Database connection error
Could not connect to database
Prisma migration failed
```

**Symptoms:**
- Application starts but crashes when accessing database
- Migration errors during deployment
- Intermittent database connectivity

**Root Causes:**
1. **DATABASE_URL not set or incorrect** (40%)
   - Variable missing
   - Wrong format
   - Wrong service reference

2. **Database service not running** (25%)
   - Database crashed
   - Out of memory
   - Not provisioned

3. **Connection pool misconfigured** (20%)
   - Too many connections
   - No connection pool

4. **Migration issues** (10%)
   - Failed migrations
   - Schema mismatch

5. **SSL/TLS configuration** (5%)
   - SSL required but not configured

**Solutions:**

**Solution A: Verify DATABASE_URL**
```bash
# Check if variable exists
railway variables | grep DATABASE_URL

# Check format (should reference Railway database)
railway variables get DATABASE_URL

# Should look like:
# ${{Postgres.DATABASE_URL}}
# NOT a hardcoded URL

# If missing, set it:
railway variables set DATABASE_URL '${{Postgres.DATABASE_URL}}'
```

**Solution B: Verify Database Service Running**
```bash
# Check service status
railway status

# Should see database service listed as "Running"
# If not, restart it from dashboard

# Check database logs
railway logs --service=postgres

# Look for crashes or errors
```

**Solution C: Configure Connection Pool**
```javascript
// Node.js with pg
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

```python
# Python with SQLAlchemy
from sqlalchemy import create_engine

engine = create_engine(
    os.getenv('DATABASE_URL'),
    pool_size=20,
    max_overflow=0,
    pool_pre_ping=True,  # Verify connections before use
    connect_args={
        'sslmode': 'require' if os.getenv('NODE_ENV') == 'production' else 'prefer'
    }
)
```

**Solution D: Fix Prisma Connection**
```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// In your code
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})
```

**Solution E: Handle Failed Migrations**
```bash
# Check migration status
railway run npx prisma migrate status

# If migrations failed, resolve them
railway run npx prisma migrate resolve --applied [migration-name]

# Or mark as rolled back
railway run npx prisma migrate resolve --rolled-back [migration-name]

# Then deploy fresh
railway run npx prisma migrate deploy
```

**Solution F: Test Connection Locally**
```bash
# Test with Railway environment
railway run node -e "
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
pool.query('SELECT NOW()', (err, res) => {
  if (err) console.error(err);
  else console.log('Connected!', res.rows[0]);
  pool.end();
});
"
```

**Prevention:**
- Always use Railway variable references
- Configure connection pooling
- Implement connection retry logic
- Use migrations properly
- Test database connectivity in health check

---

## ⚠️ WARNING LEVEL ERRORS (May Cause Issues)

### ERROR 5: Memory Limit Exceeded

**Error Messages:**
```
Process killed (memory limit exceeded)
Out of memory
OOM Kill
Container killed
```

**Symptoms:**
- Application randomly crashes
- Deployment shows as running then stops
- High memory usage in metrics

**Root Causes:**
1. **Memory leaks** (40%)
   - Not closing connections
   - Growing caches
   - Event listeners not removed

2. **Large dependencies loaded into memory** (30%)
   - Entire datasets in RAM
   - Large file uploads

3. **Insufficient memory allocation** (20%)
   - App needs more RAM than allocated

4. **Build process memory spike** (10%)
   - Large webpack builds
   - Dependency installation

**Solutions:**

**Solution A: Check Current Usage**
```bash
# View current memory usage
railway status

# Check logs for OOM messages
railway logs | grep -i "memory\|oom\|killed"

# Review metrics in dashboard
railway open  # Go to Metrics tab
```

**Solution B: Find Memory Leaks**
```javascript
// Add memory logging
setInterval(() => {
  const used = process.memoryUsage();
  console.log('Memory Usage:', {
    rss: `${Math.round(used.rss / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`
  });
}, 60000); // Log every minute

// Look for constantly increasing numbers
```

**Solution C: Implement Proper Connection Cleanup**
```javascript
// Close database connections
process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  await redisClient.quit();
  server.close(() => {
    process.exit(0);
  });
});

// Use connection pooling
// Limit concurrent operations
```

**Solution D: Optimize Memory Usage**
```javascript
// Don't load everything into memory
// ❌ BAD
const allData = await db.findAll();

// ✅ GOOD - Use streaming/pagination
const stream = db.stream();
stream.on('data', (row) => {
  processRow(row);
});

// ✅ GOOD - Pagination
const pageSize = 100;
for (let page = 0; page < totalPages; page++) {
  const data = await db.find({ skip: page * pageSize, limit: pageSize });
  processData(data);
}
```

**Solution E: Increase Memory Limit**
```bash
# Railway automatically scales vertically
# But you can set limits in service settings

# For Node.js, increase heap size
# In package.json or railway.json
{
  "scripts": {
    "start": "node --max-old-space-size=4096 server.js"
  }
}
```

**Prevention:**
- Monitor memory usage regularly
- Implement proper cleanup
- Use streaming for large data
- Limit concurrent operations
- Set up memory alerts

---

### ERROR 6: Environment Variable Not Loaded

**Error Messages:**
```
undefined is not a function
Cannot read property 'X' of undefined
process.env.VARIABLE is undefined
Configuration missing
```

**Symptoms:**
- Application crashes on startup
- Features don't work as expected
- Null/undefined errors in logs

**Root Causes:**
1. **Variable not set in Railway** (50%)
   - Forgot to add variable
   - Typo in variable name

2. **Variable not loaded in code** (25%)
   - No dotenv in production
   - Loading env too late

3. **Staging changes not deployed** (15%)
   - Variables set but not deployed

4. **Wrong environment** (10%)
   - Set in staging, trying to use in production

**Solutions:**

**Solution A: Verify Variables Exist**
```bash
# List all variables
railway variables

# Check specific variable
railway variables get API_KEY

# If missing, add it
railway variables set API_KEY your_key_here

# IMPORTANT: Deploy changes
# Variables don't apply until you deploy
railway up
```

**Solution B: Check Variable Loading**
```javascript
// At the very top of your entry file (server.js, index.js, app.js)
// BEFORE any other imports

// For development only
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Then verify variables loaded
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Missing',
  API_KEY: process.env.API_KEY ? 'Set' : 'Missing',
});

// Exit if critical variables missing
const requiredEnvVars = ['DATABASE_URL', 'API_KEY'];
const missing = requiredEnvVars.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error('Missing required environment variables:', missing);
  process.exit(1);
}
```

**Solution C: Deploy Staged Changes**
```bash
# After setting variables, you must deploy
railway up

# Or trigger redeploy from dashboard
railway open
# Click "Deploy" button in top right
```

**Solution D: Verify Correct Environment**
```bash
# Check current environment
railway environment

# Switch if needed
railway environment production

# Set variables in correct environment
railway variables set KEY value
```

**Solution E: Use Default Values**
```javascript
// Provide fallbacks for non-critical variables
const config = {
  port: process.env.PORT || 3000,
  logLevel: process.env.LOG_LEVEL || 'info',
  apiTimeout: parseInt(process.env.API_TIMEOUT || '5000'),
  // But no fallback for critical vars
  database: process.env.DATABASE_URL, // Will be undefined if not set
};

// Validate critical config
if (!config.database) {
  throw new Error('DATABASE_URL must be set');
}
```

**Prevention:**
- Document all required variables in .env.example
- Validate environment on startup
- Use explicit error messages
- Deploy after setting variables
- Keep variables synced across environments

---

### ERROR 7: Port Already in Use (EADDRINUSE)

**Error Messages:**
```
Error: listen EADDRINUSE: address already in use :::3000
Port 3000 is already in use
EADDRINUSE
```

**Symptoms:**
- Application fails to start
- Error about port being in use
- Works locally but not on Railway

**Root Causes:**
1. **Hardcoded port without reading PORT env** (70%)
   - Not using Railway's dynamic PORT
   - Listening on wrong port

2. **Multiple processes trying same port** (20%)
   - Previous process not killed
   - Development server still running

3. **Port conflict in Railway** (10%)
   - Rare Railway internal issue

**Solutions:**

**Solution A: Use Railway's PORT Variable**
```javascript
// ❌ WRONG
const PORT = 3000;
app.listen(PORT);

// ✅ CORRECT
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
```

```python
# ❌ WRONG
port = 3000

# ✅ CORRECT
import os
port = int(os.getenv('PORT', 3000))
app.run(host='0.0.0.0', port=port)
```

**Solution B: Kill Existing Processes (Local)**
```bash
# Find process using port
lsof -i :3000
# or
netstat -ano | findstr :3000  # Windows

# Kill the process
kill -9 [PID]
# or
taskkill /PID [PID] /F  # Windows
```

**Solution C: Verify PORT in Logs**
```bash
# Check what port app is trying to use
railway logs | grep -i "port\|listening"

# Verify PORT variable exists
railway variables | grep PORT

# Railway provides PORT automatically
```

**Prevention:**
- Always use process.env.PORT
- Never hardcode ports
- Log the port being used
- Test with: PORT=8080 npm start

---

## 🔍 BUILD & DEPLOYMENT ERRORS

### ERROR 8: Docker Build Timeout

**Error Messages:**
```
Build timeout exceeded
Context deadline exceeded
Build took too long
```

**Symptoms:**
- Build process hangs
- Timeout after 15-30 minutes
- Build never completes

**Root Causes:**
1. **Large dependencies** (40%)
   - Huge node_modules
   - Large Python packages

2. **Network issues** (30%)
   - Slow package downloads
   - Registry connection problems

3. **Inefficient Dockerfile** (20%)
   - Not using layer caching
   - Installing unnecessary packages

4. **Resource constraints** (10%)
   - Build needs more CPU/memory

**Solutions:**

**Solution A: Optimize Dockerfile**
```dockerfile
# ❌ SLOW - Reinstalls everything on code change
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
CMD ["npm", "start"]

# ✅ FAST - Uses layer caching
FROM node:18-alpine
WORKDIR /app

# Copy dependency files first
COPY package*.json ./
RUN npm ci --only=production

# Then copy code
COPY . .

CMD ["npm", "start"]
```

**Solution B: Use .dockerignore**
```
# .dockerignore
node_modules
npm-debug.log
.git
.env
.DS_Store
*.md
tests/
docs/
.vscode/
```

**Solution C: Switch to Nixpacks**
```json
// railway.json
{
  "build": {
    "builder": "NIXPACKS"
  }
}

// Nixpacks is often faster than Docker
```

**Solution D: Reduce Dependencies**
```bash
# Analyze bundle size
npm ls --depth=0

# Remove unused dependencies
npm uninstall [unused-package]

# Use production-only install
npm ci --only=production
```

**Prevention:**
- Use alpine-based images
- Optimize Dockerfile layers
- Use .dockerignore
- Clean npm cache
- Consider Nixpacks

---

### ERROR 9: Module Not Found

**Error Messages:**
```
Cannot find module 'X'
Module not found: Can't resolve 'X'
Error: Cannot find module
```

**Symptoms:**
- Build or runtime error about missing module
- Works locally but not on Railway
- Module exists but can't be found

**Root Causes:**
1. **Dev dependency in production code** (40%)
   - Package in devDependencies but needed at runtime

2. **Case sensitivity** (30%)
   - Local file system case-insensitive
   - Railway (Linux) case-sensitive

3. **Missing from package.json** (20%)
   - Globally installed locally
   - Not committed to package.json

4. **Path issues** (10%)
   - Incorrect relative paths
   - Missing path aliases

**Solutions:**

**Solution A: Move to Dependencies**
```json
// If module needed at runtime
{
  "dependencies": {
    "express": "^4.18.0",
    "dotenv": "^16.0.0"  // Move from devDependencies
  },
  "devDependencies": {
    "nodemon": "^2.0.20"  // Only dev tools here
  }
}
```

**Solution B: Fix Case Sensitivity**
```javascript
// ❌ WRONG (might work on Windows/Mac but not Linux)
import MyComponent from './components/myComponent';

// ✅ CORRECT (exact case match)
import MyComponent from './components/MyComponent';

// Check actual filename:
// components/MyComponent.jsx  <- Capital M
```

**Solution C: Install Missing Package**
```bash
# Install and save to package.json
npm install [package-name] --save

# Verify it's in dependencies
cat package.json | grep [package-name]

# Commit both files
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push
```

**Solution D: Fix Import Paths**
```javascript
// Use consistent relative paths
// ❌ Inconsistent
import './Component';
import './Component.jsx';

// ✅ Consistent
import './Component.jsx';

// Or use absolute imports
import 'components/Component';
```

**Prevention:**
- Install all packages with --save
- Match file name cases exactly
- Test build locally
- Use a Linux environment for testing
- Commit package-lock.json

---

## 🌐 NETWORKING & CONNECTIVITY ERRORS

### ERROR 10: SSL Certificate Issues

**Error Messages:**
```
SSL certificate problem
Certificate verification failed
HTTPS error
NET::ERR_CERT_AUTHORITY_INVALID
```

**Symptoms:**
- HTTPS connections fail
- Browser shows certificate warning
- API calls fail with SSL error

**Root Causes:**
1. **Using custom domain without proper SSL** (40%)
2. **Certificate not yet propagated** (30%)
3. **Mixed content (HTTP/HTTPS)** (20%)
4. **Old/cached certificate** (10%)

**Solutions:**

**Solution A: Wait for Certificate Propagation**
```
After adding custom domain:
1. Wait 5-10 minutes for DNS propagation
2. Clear browser cache
3. Try in incognito/private mode
4. Check https://dnschecker.org for DNS status
```

**Solution B: Force HTTPS**
```javascript
// Express.js middleware
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

**Solution C: Fix Mixed Content**
```javascript
// ❌ WRONG - Hardcoded HTTP
const API_URL = 'http://api.example.com';

// ✅ CORRECT - Use HTTPS
const API_URL = 'https://api.example.com';

// ✅ BETTER - Protocol-relative
const API_URL = process.env.API_URL || 'https://api.example.com';
```

**Prevention:**
- Use Railway-generated domains (SSL automatic)
- Wait for DNS propagation
- Always use HTTPS in production
- Test SSL with: https://www.ssllabs.com/ssltest/

---

## 📊 PERFORMANCE ERRORS

### ERROR 11: Slow Response Times / Timeouts

**Error Messages:**
```
Gateway timeout
504 Gateway Timeout
Request timeout
Slow database query
```

**Symptoms:**
- Requests take forever
- Intermittent timeouts
- High latency

**Root Causes:**
1. **Slow database queries** (40%)
2. **No caching** (25%)
3. **Blocking operations** (20%)
4. **Cold starts** (10%)
5. **External API delays** (5%)

**Solutions:**

**Solution A: Optimize Database Queries**
```javascript
// ❌ SLOW - N+1 query problem
const users = await User.findAll();
for (const user of users) {
  user.posts = await Post.findAll({ where: { userId: user.id } });
}

// ✅ FAST - Join query
const users = await User.findAll({
  include: [{ model: Post }]
});

// Add indexes for frequently queried fields
// In migration:
await queryInterface.addIndex('users', ['email']);
await queryInterface.addIndex('posts', ['userId', 'createdAt']);
```

**Solution B: Implement Caching**
```javascript
const redis = require('redis');
const client = redis.createClient({
  url: process.env.REDIS_URL
});

// Cache frequently accessed data
async function getUser(id) {
  const cacheKey = `user:${id}`;
  
  // Try cache first
  const cached = await client.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Query database
  const user = await User.findByPk(id);
  
  // Cache result
  await client.setEx(cacheKey, 3600, JSON.stringify(user));
  
  return user;
}
```

**Solution C: Use Async Operations**
```javascript
// ❌ SLOW - Sequential
const user = await getUser(id);
const posts = await getPosts(id);
const comments = await getComments(id);

// ✅ FAST - Parallel
const [user, posts, comments] = await Promise.all([
  getUser(id),
  getPosts(id),
  getComments(id)
]);
```

**Solution D: Add Timeouts**
```javascript
// Set reasonable timeouts for external APIs
const axios = require('axios');

const api = axios.create({
  timeout: 5000, // 5 seconds
  headers: { 'Content-Type': 'application/json' }
});

// Handle timeouts gracefully
try {
  const response = await api.get('/data');
} catch (error) {
  if (error.code === 'ECONNABORTED') {
    console.error('Request timed out');
    // Return cached data or default
  }
}
```

**Prevention:**
- Monitor query performance
- Use database indexes
- Implement caching
- Use async operations
- Set timeouts on external calls
- Monitor with Railway metrics

---

## 🔐 SECURITY & PERMISSION ERRORS

### ERROR 12: Permission Denied / Access Denied

**Error Messages:**
```
Permission denied
EACCES
Access denied
Forbidden
403 Forbidden
```

**Symptoms:**
- Can't write files
- Can't execute scripts
- Database access denied

**Root Causes:**
1. **Writing to read-only file system** (50%)
2. **Missing database permissions** (30%)
3. **Environment variable permissions** (15%)
4. **File execution permissions** (5%)

**Solutions:**

**Solution A: Use /tmp for Temp Files**
```javascript
// ❌ WRONG - Can't write to app directory
const filePath = './uploads/file.txt';
fs.writeFileSync(filePath, data);

// ✅ CORRECT - Use /tmp
const tmpPath = '/tmp/file.txt';
fs.writeFileSync(tmpPath, data);

// Or use environment variable
const uploadPath = process.env.UPLOAD_PATH || '/tmp';
```

**Solution B: Check Database User Permissions**
```sql
-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO myuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO myuser;
```

**Solution C: Use Volume for Persistent Storage**
```bash
# In Railway dashboard:
# 1. Add Volume to service
# 2. Set mount path: /app/data
# 3. Use that path for persistent files

# In code:
const dataPath = '/app/data'; // Volume mount
fs.writeFileSync(`${dataPath}/file.txt`, data);
```

**Prevention:**
- Never write to app directory
- Use /tmp for temporary files
- Use volumes for persistent data
- Check database permissions
- Test file operations

---

## 🔄 DEPLOYMENT PROCESS ERRORS

### ERROR 13: Deployment Stuck / Hanging

**Error Messages:**
```
Deployment taking too long
Stuck at "Building"
Hung deployment
No progress
```

**Symptoms:**
- Deployment never completes
- Progress bar stuck
- No new logs

**Root Causes:**
1. **Builder region issues** (40%)
2. **Large dependencies** (30%)
3. **Network problems** (20%)
4. **Railway platform issue** (10%)

**Solutions:**

**Solution A: Cancel and Retry**
```bash
# Cancel current deployment
railway down

# Wait 30 seconds

# Redeploy
railway up
```

**Solution B: Try Different Region**
```
1. Go to Railway Dashboard
2. Project Settings → General
3. Change deployment region
4. Try US West, US East, or EU
5. Redeploy
```

**Solution C: Check Railway Status**
```
Visit: https://status.railway.com
Check if there are ongoing incidents
```

**Solution D: Optimize Build**
```dockerfile
# Use build cache
# Clean up in same layer
RUN npm install && npm cache clean --force

# Use smaller base image
FROM node:18-alpine

# Multi-stage build
FROM node:18 AS builder
# ... build steps
FROM node:18-alpine
COPY --from=builder /app/dist ./dist
```

**Prevention:**
- Monitor Railway status
- Optimize build process
- Use appropriate regions
- Have backup deployment method

---

## 📝 ERROR QUICK REFERENCE TABLE

| Error Code | Description | Most Common Cause | Quick Fix |
|------------|-------------|-------------------|-----------|
| 502/503 | Application Failed to Respond | Not binding to 0.0.0.0 | Change host to '0.0.0.0' |
| Exit Code 1 | Build Failed | ESLint errors | Add CI=false |
| CORS | Cross-Origin Error | CORS not configured | Install and configure cors middleware |
| ECONNREFUSED | Database Connection | DATABASE_URL wrong | Use ${{Postgres.DATABASE_URL}} |
| OOM | Out of Memory | Memory leak | Check logs, optimize code |
| Undefined | Missing Env Variable | Variable not set | railway variables set KEY value |
| EADDRINUSE | Port In Use | Not using PORT env | Use process.env.PORT |
| Timeout | Build Timeout | Large dependencies | Optimize Dockerfile |
| Module Not Found | Missing Package | Not in dependencies | npm install --save |
| SSL Error | Certificate Issue | DNS not propagated | Wait 10 minutes |
| 504 | Gateway Timeout | Slow queries | Add indexes, caching |
| EACCES | Permission Denied | Writing to wrong path | Use /tmp or volume |
| Stuck | Deployment Hanging | Builder issue | Cancel and retry |

---

## 🎯 ERROR DIAGNOSIS FLOWCHART

```
Error Detected
      ↓
Is app accessible?
      ├─ NO → Check "Application Failed to Respond" (ERROR 1)
      └─ YES → Continue
                ↓
      Is build successful?
            ├─ NO → Check "Build Failed" (ERROR 2)
            └─ YES → Continue
                      ↓
            Frontend working?
                  ├─ NO → Check browser console
                  │       ├─ CORS error? → ERROR 3
                  │       ├─ 404 errors? → ERROR 9
                  │       └─ SSL error? → ERROR 10
                  └─ YES → Continue
                            ↓
                  Backend working?
                        ├─ NO → Check logs
                        │       ├─ Database error? → ERROR 4
                        │       ├─ Undefined error? → ERROR 6
                        │       └─ Crash? → ERROR 5
                        └─ YES → Performance issue?
                                  └─ YES → ERROR 11
```

---

## 🚀 PREVENTION BEST PRACTICES

### 1. Pre-Deployment Checklist
- [ ] All environment variables documented
- [ ] No hardcoded secrets
- [ ] Tests passing locally
- [ ] Build succeeds locally
- [ ] PORT environment variable used
- [ ] Binding to 0.0.0.0
- [ ] CORS configured
- [ ] Database connection tested
- [ ] Dependencies in package.json
- [ ] Lock file committed

### 2. Code Quality Checks
```bash
# Run before every deployment
npm run lint
npm run test
npm run build
PORT=8080 npm start  # Test with different port
```

### 3. Monitoring Setup
```javascript
// Add to your app
const startupTime = Date.now();

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Date.now() - startupTime,
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV
  });
});
```

### 4. Logging Best Practices
```javascript
// Structured logging
console.log('Server started', {
  port: PORT,
  environment: process.env.NODE_ENV,
  timestamp: new Date().toISOString()
});

// Log errors with context
console.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  attempt: retryCount
});
```

---

## 📞 WHEN TO ESCALATE

Escalate to Railway Support when:
- ✅ You've tried all relevant solutions
- ✅ Error persists across multiple deployments
- ✅ Railway status page shows no issues
- ✅ Similar projects deploy successfully
- ✅ Error seems platform-specific

Include in support request:
1. Error message (exact text)
2. Deployment logs (full)
3. Steps already attempted
4. Project ID
5. Service ID
6. Timeline of issue

Contact: https://railway.com/support

---

*This Error Library is continuously updated based on real-world Railway deployment experiences. Last updated: 2025*