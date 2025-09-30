# Claude Code Railway Deployment Checklists & Procedures

---

## TODO LIST: Claude Code GitHub Repository Preparation

### Phase 1: Initial Repository Analysis
- [ ] **Task 1.1**: Change to project directory
  ```bash
  cd /path/to/project
  ```

- [ ] **Task 1.2**: Verify Git repository exists
  ```bash
  git status
  ```

- [ ] **Task 1.3**: Check current branch
  ```bash
  git branch --show-current
  ```

- [ ] **Task 1.4**: Identify project type (Node.js, Python, Ruby, etc.)
  ```bash
  ls package.json requirements.txt Gemfile Cargo.toml pom.xml
  ```

- [ ] **Task 1.5**: Check for existing Railway configuration
  ```bash
  ls railway.json railway.toml Procfile
  ```

- [ ] **Task 1.6**: Verify GitHub remote is configured
  ```bash
  git remote -v
  ```

### Phase 2: Security Audit
- [ ] **Task 2.1**: Search for hardcoded secrets in code
  ```bash
  git grep -i "api_key\|apikey\|api-key" -- ':!node_modules' ':!vendor' ':!.git'
  git grep -i "secret\|password\|token" -- ':!node_modules' ':!vendor' ':!.git'
  git grep -i "DATABASE_URL\|MONGO_URI\|REDIS_URL" -- ':!node_modules' ':!vendor' ':!.git'
  ```

- [ ] **Task 2.2**: Check for committed .env files
  ```bash
  git ls-files | grep -E "^\.env$|^\.env\."
  ```

- [ ] **Task 2.3**: Identify all environment variables used in code
  ```bash
  # Node.js
  git grep "process\.env\." -- ':!node_modules'
  
  # Python
  git grep "os\.getenv\|os\.environ" -- ':!venv' ':!__pycache__'
  
  # Ruby
  git grep "ENV\[" -- ':!vendor'
  ```

- [ ] **Task 2.4**: List identified environment variables
  ```bash
  # Create a temporary file with all found env vars
  # Parse and deduplicate the list
  ```

### Phase 3: File Generation
- [ ] **Task 3.1**: Create .env.example if missing
  ```bash
  cat > .env.example << 'EOF'
  # Application Configuration
  NODE_ENV=production
  PORT=3000
  
  # Database Configuration
  DATABASE_URL=postgresql://user:password@host:port/database
  
  # API Keys and Secrets
  API_KEY=your_api_key_here
  JWT_SECRET=your_jwt_secret_here
  
  # External Services
  # Add your service-specific variables here
  EOF
  ```

- [ ] **Task 3.2**: Create .railwayignore if missing
  ```bash
  cat > .railwayignore << 'EOF'
  # Dependencies
  node_modules/
  vendor/
  venv/
  __pycache__/
  
  # Environment files
  .env
  .env.*
  !.env.example
  
  # Build artifacts
  dist/
  build/
  target/
  
  # Logs
  *.log
  logs/
  
  # OS files
  .DS_Store
  Thumbs.db
  
  # IDE
  .vscode/
  .idea/
  *.swp
  *.swo
  
  # Git
  .git/
  .gitignore
  
  # Testing
  coverage/
  .nyc_output/
  
  # Temporary files
  tmp/
  temp/
  EOF
  ```

- [ ] **Task 3.3**: Update .gitignore if needed
  ```bash
  # Check if .gitignore exists
  if [ ! -f .gitignore ]; then
    # Create comprehensive .gitignore
    cat > .gitignore << 'EOF'
  # Environment variables
  .env
  .env.*
  !.env.example
  
  # Dependencies
  node_modules/
  vendor/
  venv/
  __pycache__/
  
  # Build outputs
  dist/
  build/
  target/
  
  # Logs
  *.log
  logs/
  
  # OS files
  .DS_Store
  Thumbs.db
  
  # IDE
  .vscode/
  .idea/
  *.swp
  
  # Testing
  coverage/
  EOF
  fi
  ```

- [ ] **Task 3.4**: Create railway.json (optional, if custom config needed)
  ```bash
  cat > railway.json << 'EOF'
  {
    "$schema": "https://railway.app/railway.schema.json",
    "build": {
      "builder": "NIXPACKS",
      "buildCommand": "npm run build"
    },
    "deploy": {
      "startCommand": "npm start",
      "healthcheckPath": "/",
      "healthcheckTimeout": 100,
      "restartPolicyType": "ON_FAILURE",
      "restartPolicyMaxRetries": 10
    }
  }
  EOF
  ```

### Phase 4: Code Remediation
- [ ] **Task 4.1**: Replace hardcoded secrets with environment variables
  ```bash
  # This requires code analysis and refactoring
  # Claude Code should identify and suggest changes
  # Example: Replace 'const apiKey = "abc123"' with 'const apiKey = process.env.API_KEY'
  ```

- [ ] **Task 4.2**: Add environment variable loading in main file
  ```javascript
  // For Node.js - add at top of main file
  require('dotenv').config();
  ```
  
  ```python
  # For Python - add at top of main file
  from dotenv import load_dotenv
  import os
  
  load_dotenv()
  ```

- [ ] **Task 4.3**: Ensure PORT is configurable
  ```javascript
  // Node.js
  const PORT = process.env.PORT || 3000;
  ```
  
  ```python
  # Python
  PORT = int(os.getenv('PORT', 3000))
  ```

### Phase 5: Dependency Management
- [ ] **Task 5.1**: Verify all dependencies are listed
  ```bash
  # Node.js
  npm install
  
  # Python
  pip freeze > requirements.txt
  
  # Ruby
  bundle install
  ```

- [ ] **Task 5.2**: Install dotenv package if not present
  ```bash
  # Node.js
  npm install dotenv --save
  
  # Python
  pip install python-dotenv
  ```

- [ ] **Task 5.3**: Check for lock files and ensure they're committed
  ```bash
  ls package-lock.json yarn.lock Pipfile.lock Gemfile.lock
  ```

### Phase 6: Documentation
- [ ] **Task 6.1**: Create or update README.md with deployment section
  ```markdown
  ## Deployment to Railway
  
  This application is configured for deployment to Railway.
  
  ### Prerequisites
  - Railway CLI installed
  - GitHub account connected to Railway
  
  ### Environment Variables Required
  See `.env.example` for all required environment variables.
  
  ### Deployment Steps
  1. Install Railway CLI: `npm i -g @railway/cli`
  2. Login: `railway login`
  3. Initialize project: `railway init`
  4. Deploy: `railway up`
  
  For more details, see DEPLOYMENT.md
  ```

- [ ] **Task 6.2**: Create DEPLOYMENT.md with detailed instructions
  ```bash
  # Create comprehensive deployment guide
  # Include Railway-specific configuration
  # Document all environment variables
  # Provide troubleshooting tips
  ```

### Phase 7: Git Commit & Push
- [ ] **Task 7.1**: Stage all changes
  ```bash
  git add .env.example .railwayignore .gitignore railway.json README.md DEPLOYMENT.md
  git add -u  # Add modified files
  ```

- [ ] **Task 7.2**: Check git status
  ```bash
  git status
  ```

- [ ] **Task 7.3**: Commit changes
  ```bash
  git commit -m "Prepare repository for Railway deployment

  - Add .env.example with required environment variables
  - Create .railwayignore for Railway deployments
  - Update .gitignore to exclude sensitive files
  - Add railway.json configuration
  - Replace hardcoded secrets with environment variables
  - Update documentation with deployment instructions"
  ```

- [ ] **Task 7.4**: Push to GitHub
  ```bash
  git push origin main
  ```

- [ ] **Task 7.5**: Verify push was successful
  ```bash
  git status
  gh repo view --web
  ```

---

## PRE-DEPLOYMENT CHECKLIST: Claude Code Must Confirm Before Deploying

### Section A: Repository Status
- [ ] **A.1**: Current directory is correct project directory
  - Command: `pwd`
  - Verify: Path matches expected project location

- [ ] **A.2**: Git repository is clean (no uncommitted changes)
  - Command: `git status`
  - Verify: "nothing to commit, working tree clean"

- [ ] **A.3**: Latest code is pushed to GitHub
  - Command: `git status`
  - Verify: "Your branch is up to date with 'origin/main'"

- [ ] **A.4**: Correct branch is active (typically 'main' or 'master')
  - Command: `git branch --show-current`
  - Verify: Branch name matches deployment target

### Section B: Security Verification
- [ ] **B.1**: No .env files are committed to Git
  - Command: `git ls-files | grep -E "^\.env$|^\.env\."`
  - Verify: No output (no .env files tracked)

- [ ] **B.2**: No hardcoded secrets in tracked files
  - Command: `git grep -i "api_key.*=.*['\"][a-zA-Z0-9]" -- ':!node_modules'`
  - Verify: No matches found or all are using environment variables

- [ ] **B.3**: .env.example exists and is committed
  - Command: `git ls-files | grep .env.example`
  - Verify: File is tracked by Git

- [ ] **B.4**: .gitignore properly excludes sensitive files
  - Command: `cat .gitignore | grep -E "^\.env$"`
  - Verify: .env is in .gitignore

### Section C: Configuration Files
- [ ] **C.1**: Package/dependency file exists and is valid
  - Command: 
    - Node.js: `npm install --dry-run`
    - Python: `pip check`
    - Ruby: `bundle check`
  - Verify: No errors reported

- [ ] **C.2**: Lock file exists and is committed
  - Command: 
    - Node.js: `git ls-files | grep package-lock.json`
    - Python: `git ls-files | grep Pipfile.lock`
    - Ruby: `git ls-files | grep Gemfile.lock`
  - Verify: Lock file is tracked

- [ ] **C.3**: Start command is defined
  - Check: package.json "scripts.start" or Procfile or railway.json
  - Verify: Valid start command exists

- [ ] **C.4**: Build command is defined (if needed)
  - Check: package.json "scripts.build" or railway.json
  - Verify: Build command exists if project requires building

### Section D: Railway CLI Prerequisites
- [ ] **D.1**: Railway CLI is installed
  - Command: `railway --version`
  - Verify: Version number displayed (e.g., "railway version 3.x.x")

- [ ] **D.2**: Railway CLI is authenticated
  - Command: `railway whoami`
  - Verify: User information displayed

- [ ] **D.3**: Railway project is linked or will be created
  - Command: `railway status` or prepare for `railway init`
  - Verify: Either shows project info or ready to create new

### Section E: GitHub Prerequisites
- [ ] **E.1**: GitHub CLI is installed (for GitHub deployment method)
  - Command: `gh --version`
  - Verify: Version displayed

- [ ] **E.2**: GitHub CLI is authenticated
  - Command: `gh auth status`
  - Verify: "Logged in to github.com"

- [ ] **E.3**: GitHub remote is configured
  - Command: `git remote get-url origin`
  - Verify: Valid GitHub repository URL

- [ ] **E.4**: GitHub repository is accessible
  - Command: `gh repo view`
  - Verify: Repository information displayed

### Section F: Application Configuration
- [ ] **F.1**: PORT environment variable is properly configured
  - Check: Code uses `process.env.PORT` or equivalent
  - Verify: Code inspection confirms dynamic port binding

- [ ] **F.2**: All required environment variables are identified
  - Command: Review .env.example
  - Verify: All necessary variables documented

- [ ] **F.3**: Database configuration uses environment variables
  - Check: No hardcoded database URLs
  - Verify: Uses DATABASE_URL or similar env var

- [ ] **F.4**: Application has healthcheck endpoint (optional but recommended)
  - Check: Route exists for `/health` or `/`
  - Verify: Simple endpoint that returns 200 OK

### Section G: Testing
- [ ] **G.1**: Local build succeeds
  - Command: 
    - Node.js: `npm run build` (if applicable)
    - Python: `python -m py_compile main.py`
  - Verify: No build errors

- [ ] **G.2**: Application starts locally
  - Command: 
    - Node.js: `npm start`
    - Python: `python main.py`
  - Verify: Application starts without errors

- [ ] **G.3**: Application responds to requests locally
  - Command: `curl http://localhost:3000` or equivalent
  - Verify: Successful response received

### Section H: Documentation
- [ ] **H.1**: README.md includes deployment information
  - Check: README.md exists and has deployment section
  - Verify: Basic deployment steps documented

- [ ] **H.2**: All environment variables are documented
  - Check: .env.example has comments or README explains each variable
  - Verify: Each variable's purpose is clear

### Section I: Railway-Specific Checks
- [ ] **I.1**: No Railway-incompatible features used
  - Check: No reliance on writable filesystem (except /tmp)
  - Verify: No hardcoded localhost references

- [ ] **I.2**: Static assets are properly configured
  - Check: Static file serving uses correct paths
  - Verify: Public directory is properly referenced

- [ ] **I.3**: Database connection pooling configured (if using database)
  - Check: Connection pool settings in code
  - Verify: Proper connection limits set

### Section J: Final Verification
- [ ] **J.1**: Deployment plan is clear
  - Verify: Know whether deploying via GitHub or CLI
  - Verify: Know target environment (production/staging)

- [ ] **J.2**: Rollback strategy is understood
  - Verify: Can use `railway down` or redeploy previous commit
  - Verify: Have recent backup if database changes included

- [ ] **J.3**: Monitoring plan is ready
  - Verify: Will monitor logs after deployment
  - Verify: Know how to access Railway dashboard

- [ ] **J.4**: User is informed and ready
  - Verify: User knows deployment is starting
  - Verify: User is available to provide input if needed

---

## STEP-BY-STEP PROCEDURAL TASKS FOR CLAUDE CODE DURING DEPLOYMENT

### PROCEDURE 1: Pre-Deployment Validation

#### Task 1.1: Environment Check
```bash
# Step 1: Verify working directory
pwd
# Expected output: /path/to/your/project

# Step 2: Check git status
git status
# Expected output: Clean working tree

# Step 3: Verify Railway CLI
railway --version
# Expected output: railway version X.X.X

# Step 4: Verify GitHub CLI (if using GitHub deploy)
gh --version
# Expected output: gh version X.X.X

# Step 5: Check authentication
railway whoami
gh auth status
```

**Claude Code Actions:**
- Execute each command
- Parse output for success/failure
- Report status to user
- Stop if any prerequisite fails

#### Task 1.2: Security Scan
```bash
# Step 1: Check for committed .env files
git ls-files | grep -E "^\.env$|^\.env\."
# Expected output: (empty - no .env files tracked)

# Step 2: Scan for hardcoded secrets
git grep -n -i "api[_-]key\s*=\s*['\"][a-zA-Z0-9]" -- ':!node_modules' ':!vendor'
# Expected output: Only environment variable references

# Step 3: Verify .gitignore
cat .gitignore | grep "^\.env$"
# Expected output: .env
```

**Claude Code Actions:**
- Run security scan
- Flag any security issues
- Halt deployment if critical issues found
- Provide remediation steps

#### Task 1.3: Configuration Verification
```bash
# Step 1: Verify package file exists
ls package.json requirements.txt Gemfile
# Expected output: One of these files exists

# Step 2: Check for lock file
ls package-lock.json yarn.lock Pipfile.lock Gemfile.lock
# Expected output: Corresponding lock file exists

# Step 3: Verify start command
# Node.js
cat package.json | grep '"start"'
# Python
cat Procfile railway.json
# Expected output: Valid start command defined
```

**Claude Code Actions:**
- Verify all configuration files present
- Validate syntax of configuration files
- Confirm start command exists
- Report any missing configurations

---

### PROCEDURE 2: Railway Project Setup

#### Task 2.1: Authentication
```bash
# Step 1: Check if already authenticated
railway whoami
# If not authenticated, execute:

# Step 2: Login to Railway
railway login
# This opens browser for authentication

# Step 3: Verify authentication succeeded
railway whoami
# Expected output: User email or username
```

**Claude Code Actions:**
- Check authentication status
- If not authenticated, guide user through login
- Wait for user to complete browser authentication
- Verify authentication successful
- Report user information

#### Task 2.2: Project Initialization or Linking
```bash
# Step 1: Check if project already linked
railway status

# If not linked, two options:

# Option A: Create new project
railway init
# This prompts for project name

# Option B: Link to existing project
railway link [PROJECT_ID]

# Step 2: Verify project is linked
railway status
# Expected output: Project and environment info

# Step 3: Select environment
railway environment production
# Or: railway environment staging
```

**Claude Code Actions:**
- Check if project already linked
- If not, ask user: "Create new project or link existing?"
- Execute appropriate command
- Prompt user for project name if creating new
- Verify project linked successfully
- Confirm environment selection with user

#### Task 2.3: Open Railway Dashboard
```bash
# Step 1: Open project in browser
railway open
# This opens Railway dashboard for visual confirmation
```

**Claude Code Actions:**
- Open dashboard for user
- Inform user: "I've opened your Railway dashboard. You'll see your project canvas where we'll deploy your service."
- Wait for user confirmation before proceeding

---

### PROCEDURE 3: Database Provisioning (If Needed)

#### Task 3.1: Determine if Database Needed
```bash
# Step 1: Search for database references in code
git grep -i "DATABASE_URL\|MONGO_URI\|REDIS_URL" -- ':!node_modules'

# Step 2: Check dependencies
# Node.js
cat package.json | grep -E "pg|mysql|mongodb|redis|prisma|sequelize|typeorm"

# Python
cat requirements.txt | grep -E "psycopg2|pymongo|redis|sqlalchemy"
```

**Claude Code Actions:**
- Analyze code for database usage
- Report findings to user
- Ask: "I see your application uses [database type]. Should I provision a database?"
- Wait for user confirmation

#### Task 3.2: Provision Database
```bash
# Step 1: Add database service
railway add
# This presents a menu of database options

# Step 2: Select database type
# User or Claude Code selects: PostgreSQL, MySQL, MongoDB, or Redis

# Step 3: Verify database provisioned
railway status
# Expected output: Shows database service

# Step 4: Check database variables created
railway variables | grep -i "DATABASE_URL\|POSTGRES\|MYSQL\|MONGO\|REDIS"
# Expected output: Automatic database variables
```

**Claude Code Actions:**
- Execute `railway add`
- Present database options to user
- Guide selection based on project requirements
- Verify database service created
- Confirm database connection variables available
- Report: "✅ [Database Type] provisioned successfully. Connection URL automatically configured."

---

### PROCEDURE 4: Environment Variables Configuration

#### Task 4.1: Identify Required Variables
```bash
# Step 1: Parse .env.example
cat .env.example

# Step 2: List current Railway variables
railway variables

# Step 3: Identify missing variables
# Compare .env.example with railway variables output
```

**Claude Code Actions:**
- Read .env.example file
- Parse variable names
- Get current Railway variables
- Determine which variables need to be set
- Present list to user: "These variables need to be configured: [list]"

#### Task 4.2: Set Environment Variables
```bash
# For each required variable:

# Step 1: Prompt user for value (for sensitive data)
echo "Please provide value for API_KEY:"
read -s API_KEY_VALUE

# Step 2: Set variable in Railway
railway variables set API_KEY "$API_KEY_VALUE"

# Step 3: Verify variable was set
railway variables | grep API_KEY
# Expected output: Shows API_KEY (value hidden if sensitive)

# For non-sensitive variables:
railway variables set NODE_ENV production
railway variables set LOG_LEVEL info
```

**Claude Code Actions:**
- For each required variable:
  - Determine if sensitive (contains: key, secret, password, token)
  - If sensitive: Prompt user securely, don't echo value
  - If not sensitive: Prompt user normally or use default
  - Execute `railway variables set`
  - Verify variable was set
  - Report: "✅ [VARIABLE_NAME] configured"
- After all variables set, report: "All environment variables configured successfully"

#### Task 4.3: Handle Database References
```bash
# Step 1: Get database service name
railway status | grep -E "postgres|mysql|mongo|redis"

# Step 2: Set database URL reference
# Instead of hardcoded value, use Railway's reference syntax
railway variables set DATABASE_URL '${{Postgres.DATABASE_URL}}'

# Step 3: Verify reference variable
railway variables | grep DATABASE_URL
```

**Claude Code Actions:**
- Identify database service name from `railway status`
- Set database URL using reference variable syntax
- Explain to user: "I'm using Railway's reference variables for database connection. This ensures secure, automatic configuration."
- Verify reference variable set correctly

#### Task 4.4: Configure Shared Variables (if applicable)
```bash
# If multiple services need same variable:

# Step 1: Check if project has multiple services
railway status

# Step 2: Set shared variable via dashboard or CLI
# Note: Shared variables typically set via dashboard
# Inform user to set in Project Settings → Shared Variables
```

**Claude Code Actions:**
- Detect if project has multiple services
- If yes, recommend shared variables for common configs
- Guide user: "For variables used by multiple services, I recommend setting them as shared variables in the Railway dashboard under Project Settings → Shared Variables"

---

### PROCEDURE 5: Deployment Execution

#### Task 5.1: Pre-Deployment Summary
```bash
# Step 1: Get project status
railway status

# Step 2: List all configured variables
railway variables

# Step 3: Verify GitHub connection (if deploying from GitHub)
git remote get-url origin
```

**Claude Code Actions:**
- Gather all deployment information
- Present summary to user:
  ```
  🚀 Ready to Deploy!
  
  Project: [project-name]
  Environment: [production/staging]
  Deploy Method: [GitHub/CLI]
  Services: [list of services]
  
  Environment Variables Configured:
  ✅ NODE_ENV
  ✅ DATABASE_URL
  ✅ API_KEY
  [etc.]
  
  This will:
  1. Build your application
  2. Run any build commands
  3. Start your service
  4. Generate a public domain
  
  Estimated time: 2-5 minutes
  
  Ready to proceed? (yes/no)
  ```
- Wait for user confirmation

#### Task 5.2: Execute Deployment via CLI
```bash
# Step 1: Deploy using Railway CLI
railway up
# This uploads code, builds, and deploys

# Real-time output shows:
# - Compressing files
# - Uploading
# - Build progress
# - Deployment status
```

**Claude Code Actions:**
- Execute `railway up`
- Monitor stdout for progress
- Parse output for:
  - Upload progress
  - Build start
  - Build success/failure
  - Deployment start
  - Deployment success/failure
- Report progress to user in real-time
- If errors occur, capture error messages

#### Task 5.3: Execute Deployment via GitHub (Alternative Method)
```bash
# Step 1: Verify latest code is pushed
git status

# Step 2: If deploying via GitHub, ensure Railway is connected
railway status | grep "GitHub"

# Step 3: Push code to trigger auto-deploy
git push origin main

# Step 4: Monitor deployment in Railway
railway open
```

**Claude Code Actions:**
- If using GitHub deployment method:
  - Verify code is pushed to GitHub
  - Confirm Railway-GitHub connection
  - Inform user: "Code pushed. Railway will automatically detect and deploy."
  - Open dashboard for monitoring
  - Proceed to log monitoring

---

### PROCEDURE 6: Build Phase Monitoring

#### Task 6.1: Monitor Build Logs
```bash
# Step 1: Stream build logs
railway logs --build

# Watch for:
# - Dependency installation
# - Build commands execution
# - Build artifacts creation
# - Build completion
```

**Claude Code Actions:**
- Execute `railway logs --build`
- Stream output to user
- Parse logs for:
  - ✅ "Installing dependencies" → Report: "📦 Installing dependencies..."
  - ✅ "Running build command" → Report: "🔨 Building application..."
  - ✅ "Build completed" → Report: "✅ Build successful!"
  - ❌ "Error:" → Capture error, analyze, report
- If build fails:
  - Extract error message
  - Analyze error type
  - Suggest solution
  - Ask user if should retry after fix

#### Task 6.2: Build Error Handling
```bash
# If build fails, analyze error:

# Common errors and solutions:

# Error: "Cannot find module 'X'"
# Solution: Add dependency to package.json
npm install X --save
git add package.json package-lock.json
git commit -m "Add missing dependency"
railway up

# Error: "Python version mismatch"
# Solution: Specify Python version
echo "3.9" > runtime.txt
git add runtime.txt
git commit -m "Specify Python version"
railway up

# Error: "Build command failed"
# Solution: Check build command
cat package.json | grep '"build"'
# Fix build script if needed
```

**Claude Code Actions:**
- If build error detected:
  - Extract full error message
  - Identify error category:
    - Missing dependency
    - Version mismatch
    - Build command failure
    - Memory/timeout issue
  - Provide specific solution
  - Offer to implement fix automatically
  - Wait for user approval
  - Implement fix
  - Retry deployment

---

### PROCEDURE 7: Deploy Phase Monitoring

#### Task 7.1: Monitor Deployment Logs
```bash
# Step 1: Stream deployment logs
railway logs --deployment

# Watch for:
# - Application startup
# - Port binding
# - Health checks
# - Service ready
```

**Claude Code Actions:**
- Execute `railway logs --deployment`
- Stream output to user
- Parse logs for:
  - ✅ "Starting application" → Report: "🚢 Starting your application..."
  - ✅ "Listening on port" → Report: "✅ Application listening on port [X]"
  - ✅ "Health check passed" → Report: "✅ Health check successful"
  - ✅ "Deployment successful" → Report: "🎉 Deployment completed!"
  - ❌ "Error:" → Capture error, analyze, report
- Monitor for at least 2 minutes to ensure stability

#### Task 7.2: Deployment Error Handling
```bash
# If deployment fails, analyze error:

# Common errors:

# Error: "Port binding failure"
# Check: Is application using process.env.PORT?
git grep "process.env.PORT"

# Error: "Application crashed"
# Check: Are all environment variables set?
railway variables

# Error: "Health check timeout"
# Check: Is application responding on correct path?
# Solution: Configure healthcheck or ensure app responds quickly
```

**Claude Code Actions:**
- If deployment error detected:
  - Extract error message
  - Identify error category:
    - Port binding issue
    - Missing environment variable
    - Application crash
    - Health check failure
    - Resource limits
  - Analyze code for root cause
  - Provide specific solution
  - Implement fix if possible
  - Retry deployment

---

### PROCEDURE 8: Domain Generation and Verification

#### Task 8.1: Generate Public Domain
```bash
# Step 1: Check if domain already exists
railway status | grep -i "domain"

# Step 2: Generate domain if not exists
railway domain

# Step 3: Verify domain created
railway status
# Expected output: Shows public URL
```

**Claude Code Actions:**
- Check if domain already exists
- If not, execute `railway domain`
- Capture generated domain URL
- Report to user: "🌐 Your application is now accessible at: [URL]"
- Store URL for next step

#### Task 8.2: Verify Application Response
```bash
# Step 1: Get the domain URL
DOMAIN_URL=$(railway status | grep -o 'https://[^"]*')

# Step 2: Test application with curl
curl -I "$DOMAIN_URL"
# Expected: HTTP 200 OK

# Step 3: Test actual response
curl "$DOMAIN_URL"
# Expected: Valid response content

# Step 4: Check response time
time curl -s -o /dev/null "$DOMAIN_URL"
```

**Claude Code Actions:**
- Extract domain URL from `railway status`
- Wait 10 seconds for propagation
- Make HTTP request to domain
- Parse response:
  - Check status code (expect 200)
  - Verify content is valid
  - Measure response time
- Report to user:
  ```
  ✅ Application Verification Complete!
  
  Domain: [URL]
  Status: 200 OK
  Response Time: [X]ms
  
  Your application is live and responding correctly!
  ```
- If verification fails:
  - Report issue
  - Check deployment logs
  - Suggest troubleshooting steps

---

### PROCEDURE 9: Post-Deployment Verification

#### Task 9.1: Comprehensive Health Check
```bash
# Step 1: Check service status
railway status

# Step 2: Get recent logs
railway logs | tail -n 50

# Step 3: Check for any errors
railway logs | grep -i "error\|failed\|exception" | tail -n 10

# Step 4: Verify all services running
railway status | grep "Status"
```

**Claude Code Actions:**
- Execute comprehensive checks
- Analyze service status
- Review recent logs for issues
- Report health status:
  ```
  📊 Post-Deployment Health Check
  
  ✅ Service Status: Running
  ✅ No errors in recent logs
  ✅ All services operational
  ✅ Response time: [X]ms
  ✅ Memory usage: [X]MB / [Y]MB
  
  Your deployment is healthy!
  ```

#### Task 9.2: Environment Validation
```bash
# Step 1: Verify environment variables loaded
railway logs | grep -i "environment\|config\|env"

# Step 2: Test database connection (if applicable)
railway logs | grep -i "database\|connected\|connection"

# Step 3: Check for missing variables
railway logs | grep -i "undefined\|not found\|missing"
```

**Claude Code Actions:**
- Review logs for environment variable loading
- Verify database connection successful (if applicable)
- Check for any missing configuration
- Report any issues found
- Suggest fixes if problems detected

---

### PROCEDURE 10: User Documentation and Handoff

#### Task 10.1: Generate Deployment Report
```bash
# Compile deployment information
DEPLOYMENT_INFO=$(cat << EOF
# Deployment Report
Date: $(date)
Project: $(railway status | grep "Project" | cut -d: -f2)
Environment: $(railway status | grep "Environment" | cut -d: -f2)
Domain: $(railway status | grep "Domain" | cut -d: -f2)

## Services Deployed
$(railway status | grep "Service")

## Environment Variables
$(railway variables | wc -l) variables configured

## Build Details
Build Time: [extracted from logs]
Deploy Time: [extracted from logs]

## URLs
- Dashboard: $(railway open --json | grep url)
- Application: [domain URL]

## Next Steps
1. Monitor logs: railway logs
2. Check metrics: railway open (go to Metrics tab)
3. Set up custom domain (optional)
4. Configure alerts (optional)
EOF
)

echo "$DEPLOYMENT_INFO" > deployment-report.md
```

**Claude Code Actions:**
- Compile all deployment information
- Generate markdown report
- Save to deployment-report.md
- Display summary to user
- Commit report to repository (optional)

#### Task 10.2: Provide Best Practices Recommendations
**Claude Code Actions:**
- Analyze deployment configuration
- Generate personalized recommendations:
  ```
  💡 Best Practices Recommendations:
  
  1. Monitoring & Alerts
     - Set up usage alerts to monitor costs
     - Enable Slack/Discord notifications for deploy events
     
  2. Security
     ✅ Secrets are using environment variables
     ✅ .env files are not committed
     ⚠️  Consider sealing sensitive variables
     
  3. Performance
     - Current memory usage: [X]MB
     - Consider enabling auto-sleep for dev environment
     - Response time is good ([X]ms)
     
  4. Scaling
     - Vertical auto-scaling is active
     - For high traffic, consider horizontal replicas
     
  5. Backup & Recovery
     - Database backups: [enabled/not configured]
     - Consider regular database snapshots
     
  Would you like help with any of these?
  ```

#### Task 10.3: Explain Management Commands
**Claude Code Actions:**
- Provide user with essential commands:
  ```
  📚 Essential Railway Commands:
  
  Monitoring:
  - View logs: railway logs
  - Build logs: railway logs --build
  - Deploy logs: railway logs --deployment
  - Project status: railway status
  
  Management:
  - Open dashboard: railway open
  - Redeploy: railway up
  - Remove deployment: railway down
  - Change environment: railway environment [name]
  
  Variables:
  - List variables: railway variables
  - Set variable: railway variables set KEY value
  - Get variable: railway variables get KEY
  
  Services:
  - Add service: railway add
  - Connect to DB: railway connect [db-name]
  - Open shell: railway shell
  
  For full documentation: railway help
  ```

---

### PROCEDURE 11: Continuous Monitoring (Post-Deployment)

#### Task 11.1: Monitor for 10 Minutes
```bash
# Monitor logs in background for 10 minutes
timeout 600 railway logs --follow > deployment-logs.txt 2>&1 &
LOG_PID=$!

# Check every 30 seconds
for i in {1..20}; do
  sleep 30
  
  # Check for errors
  if grep -i "error\|failed\|exception" deployment-logs.txt | tail -n 5 | grep -v "grep"; then
    echo "⚠️  Detected potential issue in logs"
    railway logs | tail -n 20
  fi
  
  # Report status
  echo "✅ Monitoring... ($((i*30)) seconds elapsed)"
done

# Stop monitoring
kill $LOG_PID 2>/dev/null
```

**Claude Code Actions:**
- Start background log monitoring
- Check logs every 30 seconds
- Alert user immediately if errors detected
- Report status updates
- After 10 minutes, report:
  ```
  ✅ 10-Minute Stability Check Complete
  
  Status: Stable
  Errors: None detected
  Uptime: 100%
  
  Your application is running smoothly!
  
  I'll stop active monitoring now, but you can check 
  logs anytime with: railway logs
  ```

#### Task 11.2: Set Up Monitoring Recommendations
**Claude Code Actions:**
- Recommend monitoring setup:
  ```
  📊 Monitoring Setup Recommendations:
  
  1. Railway Dashboard Metrics
     - CPU usage tracking
     - Memory usage tracking
     - Network traffic
     - Deployment history
     
  2. External Monitoring (Optional)
     - Consider: Sentry for error tracking
     - Consider: Datadog for APM
     - Consider: LogDNA for log aggregation
     
  3. Alerts
     - Set usage limit alerts in Railway
     - Configure deploy notifications
     
  Would you like help setting any of these up?
  ```

---

### PROCEDURE 12: Troubleshooting Protocol

#### Task 12.1: Error Detection and Classification
```bash
# When error detected, classify it:

# Get error context
railway logs --deployment | tail -n 100 > error-context.log

# Classify error type
if grep -q "ECONNREFUSED\|connection refused" error-context.log; then
  ERROR_TYPE="database_connection"
elif grep -q "EADDRINUSE\|address already in use\|port.*in use" error-context.log; then
  ERROR_TYPE="port_binding"
elif grep -q "Cannot find module\|Module not found" error-context.log; then
  ERROR_TYPE="missing_dependency"
elif grep -q "undefined\|is not defined" error-context.log; then
  ERROR_TYPE="missing_variable"
elif grep -q "timeout\|timed out" error-context.log; then
  ERROR_TYPE="timeout"
elif grep -q "memory\|heap\|out of memory" error-context.log; then
  ERROR_TYPE="memory"
else
  ERROR_TYPE="unknown"
fi
```

**Claude Code Actions:**
- Capture full error context
- Classify error into category
- Apply category-specific troubleshooting

#### Task 12.2: Apply Solution Based on Error Type
**Claude Code Actions:**

**For Database Connection Errors:**
```
Issue: Cannot connect to database

Diagnosis:
- Checking DATABASE_URL variable... [checking]
- Verifying database service status... [checking]
- Testing connection parameters... [checking]

Solution:
The database URL is missing or incorrect. Let me fix this:
1. Verifying database service is running
2. Setting correct DATABASE_URL reference
3. Redeploying application

[Executing fixes...]
```

**For Port Binding Errors:**
```
Issue: Port binding failure

Diagnosis:
Your application is not using the PORT environment variable 
provided by Railway.

Solution:
I need to update your code to use process.env.PORT:

Current code:
const PORT = 3000;

Updated code:
const PORT = process.env.PORT || 3000;

Shall I make this change?
```

**For Missing Dependency Errors:**
```
Issue: Missing dependency '[package-name]'

Solution:
Adding missing dependency to package.json...

[Running: npm install [package-name] --save]
[Committing changes]
[Pushing to GitHub]
[Triggering redeploy]

The dependency is now installed. Monitoring new deployment...
```

**For Missing Variable Errors:**
```
Issue: Environment variable '[VAR_NAME]' is undefined

Solution:
This variable needs to be set in Railway.

Please provide a value for [VAR_NAME]:
[Waiting for user input]

[Setting variable]
[Redeploying]

Variable configured. Monitoring deployment...
```

#### Task 12.3: Escalation Protocol
**Claude Code Actions:**
- If error cannot be resolved automatically:
  ```
  I've encountered an issue that requires manual intervention:
  
  Error: [error description]
  
  Attempted Solutions:
  1. [solution 1] - Result: [outcome]
  2. [solution 2] - Result: [outcome]
  
  Recommended Next Steps:
  1. Check Railway documentation: [relevant link]
  2. Review application logs in detail
  3. Contact Railway support if issue persists
  
  I've saved all error logs to: error-report.txt
  
  Would you like me to:
  a) Try alternative solutions
  b) Open Railway support documentation
  c) Generate detailed error report for support
  ```

---

### PROCEDURE 13: Cleanup and Finalization

#### Task 13.1: Final Status Report
**Claude Code Actions:**
- Generate comprehensive final report:
  ```
  ╔════════════════════════════════════════════╗
  ║   DEPLOYMENT COMPLETE - FINAL REPORT       ║
  ╚════════════════════════════════════════════╝
  
  ✅ Deployment Status: SUCCESS
  
  📦 Project Details:
  - Name: [project-name]
  - Environment: [environment]
  - Region: [region]
  
  🌐 Access Information:
  - Application URL: [domain]
  - Dashboard: [dashboard-url]
  
  ⏱️  Performance Metrics:
  - Build Time: [X]m [Y]s
  - Deploy Time: [X]m [Y]s
  - Total Time: [X]m [Y]s
  - Response Time: [X]ms
  
  🔧 Configuration:
  - Environment Variables: [X] configured
  - Services: [X] deployed
  - Database: [status]
  
  📊 Current Status:
  - Health: Healthy
  - Uptime: 100%
  - Errors: None
  
  📝 Files Generated:
  - deployment-report.md
  - deployment-logs.txt
  
  🎉 Your application is live and ready to use!
  ```

#### Task 13.2: Knowledge Transfer
**Claude Code Actions:**
- Provide ongoing management guide:
  ```
  📚 Your Deployment Playbook:
  
  Daily Tasks:
  - Check logs: railway logs
  - Monitor metrics: railway open → Metrics tab
  
  When Making Updates:
  1. Make code changes locally
  2. Test locally: railway run npm start
  3. Commit and push: git push origin main
  4. Railway auto-deploys (watch: railway logs)
  
  Common Operations:
  - Add environment variable: railway variables set KEY value
  - Restart service: railway down && railway up
  - Change environment: railway environment [name]
  - Connect to database: railway connect [db-name]
  
  Troubleshooting:
  - App not responding: Check railway logs
  - Build failed: Check railway logs --build
  - Need to rollback: Redeploy previous commit
  
  Getting Help:
  - Documentation: https://docs.railway.com
  - Community: https://discord.gg/railway
  - Support: https://railway.com/support
  
  I've enjoyed deploying with you! Feel free to ask if you 
  need help with anything else. 😊
  ```

#### Task 13.3: Save Session Information
```bash
# Save all relevant information
cat > railway-deployment-session.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "project": "$(railway status | grep Project | cut -d: -f2 | xargs)",
  "environment": "$(railway status | grep Environment | cut -d: -f2 | xargs)",
  "domain": "$(railway status | grep Domain | cut -d: -f2 | xargs)",
  "deployment_duration": "[calculated]",
  "status": "success",
  "services": [
    "$(railway status | grep Service | cut -d: -f2 | xargs)"
  ]
}
EOF

# Commit session info
git add railway-deployment-session.json deployment-report.md
git commit -m "Add Railway deployment documentation"
git push origin main
```

**Claude Code Actions:**
- Save session information as JSON
- Commit deployment documentation
- Push to repository
- Confirm all artifacts saved
- Report: "All deployment documentation has been saved and committed to your repository."

---

## EMERGENCY PROCEDURES

### Emergency Protocol 1: Complete Deployment Failure
**When to Use:** Deployment fails repeatedly after multiple attempts

**Actions:**
1. Stop all deployment attempts
2. Preserve error logs: `railway logs > emergency-logs.txt`
3. Capture system state: `railway status > emergency-status.txt`
4. Document all attempted solutions
5. Inform user calmly:
   ```
   I need to pause deployment attempts to prevent further issues.
   
   I've saved all logs and system state for analysis.
   
   Let's take a systematic approach to resolve this:
   1. Review error logs together
   2. Identify root cause
   3. Plan corrected deployment strategy
   
   Your code and data are safe. We'll resolve this.
   ```

### Emergency Protocol 2: Production Service Down
**When to Use:** Production service becomes unavailable after deployment

**Actions:**
1. Immediately attempt rollback:
   ```bash
   railway down
   ```
2. Redeploy previous working version:
   ```bash
   git log --oneline -n 10  # Find last working commit
   git checkout [previous-commit]
   railway up
   ```
3. Monitor recovery:
   ```bash
   railway logs --follow
   ```
4. Inform user:
   ```
   ⚠️  ALERT: Production service was down
   
   Actions Taken:
   ✅ Rolled back to previous version
   ✅ Service is recovering
   ✅ Monitoring for stability
   
   Current Status: [checking...]
   
   I'll keep monitoring until service is fully restored.
   ```

### Emergency Protocol 3: Security Breach Detected
**When to Use:** Exposed credentials or security vulnerabilities found

**Actions:**
1. Immediately halt deployment
2. Document exposed information
3. Generate security report
4. Inform user with urgency:
   ```
   🚨 SECURITY ALERT
   
   I've detected exposed credentials in your code:
   - [List of exposed secrets]
   
   IMMEDIATE ACTIONS REQUIRED:
   1. Do NOT deploy this code
   2. Rotate all exposed credentials
   3. Remove secrets from Git history
   
   I can guide you through securing your application.
   This is critical - please let me help you fix this.
   ```

---

## QUALITY ASSURANCE VERIFICATION

After completing all procedures, verify:

✅ **Deployment Success:**
- [ ] Application is accessible via public URL
- [ ] All services are running
- [ ] No errors in logs
- [ ] Health checks passing

✅ **Security:**
- [ ] No secrets in Git history
- [ ] All secrets using environment variables
- [ ] SSL/HTTPS enabled (automatic)
- [ ] Database connections secure

✅ **Configuration:**
- [ ] All environment variables set
- [ ] Database connections working
- [ ] External services connected
- [ ] Correct start command

✅ **Documentation:**
- [ ] deployment-report.md created
- [ ] README.md updated
- [ ] All commands documented
- [ ] Troubleshooting guide available

✅ **User Readiness:**
- [ ] User understands how to monitor
- [ ] User knows how to update application
- [ ] User has access to all necessary URLs
- [ ] User confident in managing deployment

---

*End of Claude Code Railway Deployment Procedures*
*Version: 1.0*
*Last Updated: 2025*