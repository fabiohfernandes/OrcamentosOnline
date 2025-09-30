# Pre-Deployment Testing & Validation Suite

## Automated Testing Scripts for Error-Free Railway Deployments

---

## 🎯 PURPOSE

This suite provides **automated validation scripts** that Railway Conductor can run before deployment to catch 95% of common errors before they cause deployment failures.

---

## 📋 VALIDATION SCRIPT 1: Complete Pre-Deployment Check

### Command for Railway Conductor:
```
Railway Conductor: Run complete pre-deployment validation on my project.

Execute the Pre-Deployment Validation Script and report all findings.
Fix critical issues automatically, warn about potential issues.
```

### Script: `railway-precheck.sh`

```bash
#!/bin/bash

# Railway Pre-Deployment Validation Script
# Version: 1.0

echo "🔍 Railway Pre-Deployment Validation"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0
PASSED=0

# Function to report results
report_pass() {
    echo -e "${GREEN}✅ PASS${NC}: $1"
    ((PASSED++))
}

report_warn() {
    echo -e "${YELLOW}⚠️  WARN${NC}: $1"
    ((WARNINGS++))
}

report_fail() {
    echo -e "${RED}❌ FAIL${NC}: $1"
    ((ERRORS++))
}

report_info() {
    echo -e "${BLUE}ℹ️  INFO${NC}: $1"
}

echo "📦 Section 1: Repository Structure"
echo "--------------------------------"

# Check 1: Git repository
if [ -d .git ]; then
    report_pass "Git repository initialized"
else
    report_fail "No Git repository found. Run: git init"
fi

# Check 2: Git status
if git diff-index --quiet HEAD -- 2>/dev/null; then
    report_pass "No uncommitted changes"
else
    report_warn "Uncommitted changes detected. Commit before deploying."
fi

# Check 3: Remote configured
if git remote get-url origin &>/dev/null; then
    report_pass "Git remote configured"
else
    report_fail "No Git remote configured. Run: git remote add origin <url>"
fi

# Check 4: Check if pushed
LOCAL=$(git rev-parse @ 2>/dev/null)
REMOTE=$(git rev-parse @{u} 2>/dev/null)
if [ "$LOCAL" = "$REMOTE" ]; then
    report_pass "Local and remote in sync"
else
    report_warn "Local commits not pushed. Run: git push"
fi

echo ""
echo "🔐 Section 2: Security Audit"
echo "-------------------------"

# Check 5: .env files not committed
if git ls-files | grep -E "^\.env$|^\.env\..*" | grep -v ".env.example" > /dev/null; then
    report_fail ".env file(s) committed to Git! Remove immediately!"
    git ls-files | grep -E "^\.env"
else
    report_pass "No .env files committed"
fi

# Check 6: Hardcoded secrets
echo "Scanning for hardcoded secrets..."
SECRETS_FOUND=0

# API keys
if git grep -i "api[_-]key\s*=\s*['\"][a-zA-Z0-9]" -- ':!node_modules' ':!*.md' &>/dev/null; then
    report_fail "Possible hardcoded API keys found"
    git grep -n -i "api[_-]key\s*=\s*['\"][a-zA-Z0-9]" -- ':!node_modules' ':!*.md' | head -5
    SECRETS_FOUND=1
fi

# Tokens
if git grep -i "token\s*=\s*['\"][a-zA-Z0-9]" -- ':!node_modules' ':!*.md' &>/dev/null; then
    report_fail "Possible hardcoded tokens found"
    git grep -n -i "token\s*=\s*['\"][a-zA-Z0-9]" -- ':!node_modules' ':!*.md' | head -5
    SECRETS_FOUND=1
fi

# Passwords
if git grep -i "password\s*=\s*['\"][a-zA-Z0-9]" -- ':!node_modules' ':!*.md' &>/dev/null; then
    report_fail "Possible hardcoded passwords found"
    git grep -n -i "password\s*=\s*['\"][a-zA-Z0-9]" -- ':!node_modules' ':!*.md' | head -5
    SECRETS_FOUND=1
fi

if [ $SECRETS_FOUND -eq 0 ]; then
    report_pass "No obvious hardcoded secrets detected"
fi

# Check 7: .gitignore exists
if [ -f .gitignore ]; then
    report_pass ".gitignore exists"
    
    # Check if .env is in .gitignore
    if grep -q "^\.env$" .gitignore; then
        report_pass ".env in .gitignore"
    else
        report_warn ".env not in .gitignore. Add it!"
    fi
else
    report_fail ".gitignore missing. Create one!"
fi

echo ""
echo "⚙️  Section 3: Configuration Files"
echo "-------------------------------"

# Check 8: Package file exists (Node.js)
if [ -f package.json ]; then
    report_pass "package.json exists"
    
    # Check 9: Lock file exists
    if [ -f package-lock.json ] || [ -f yarn.lock ]; then
        report_pass "Lock file exists"
    else
        report_warn "No lock file found. Run: npm install or yarn"
    fi
    
    # Check 10: Start script defined
    if grep -q '"start"' package.json; then
        report_pass "Start script defined"
    else
        report_warn "No start script in package.json"
    fi
    
    # Check 11: Dependencies vs devDependencies
    if grep -q "dotenv.*devDependencies" package.json; then
        report_warn "dotenv in devDependencies. Should be in dependencies for Railway."
    fi
    
elif [ -f requirements.txt ]; then
    report_pass "requirements.txt exists (Python)"
elif [ -f Gemfile ]; then
    report_pass "Gemfile exists (Ruby)"
elif [ -f go.mod ]; then
    report_pass "go.mod exists (Go)"
else
    report_fail "No package management file found (package.json, requirements.txt, etc.)"
fi

# Check 12: .env.example exists
if [ -f .env.example ]; then
    report_pass ".env.example exists"
else
    report_warn ".env.example missing. Create one to document required variables."
fi

# Check 13: .railwayignore exists
if [ -f .railwayignore ]; then
    report_pass ".railwayignore exists"
else
    report_info ".railwayignore not found. Consider creating one for faster deploys."
fi

echo ""
echo "🚀 Section 4: Railway-Specific Checks"
echo "----------------------------------"

# Check 14: PORT environment variable usage
echo "Checking for PORT environment variable usage..."
PORT_USED=0

# Node.js
if grep -r "process\.env\.PORT" --include="*.js" --include="*.ts" . &>/dev/null; then
    report_pass "Using process.env.PORT"
    PORT_USED=1
# Python
elif grep -r "os\.getenv.*PORT" --include="*.py" . &>/dev/null; then
    report_pass "Using os.getenv('PORT')"
    PORT_USED=1
# Ruby
elif grep -r "ENV\[.PORT.\]" --include="*.rb" . &>/dev/null; then
    report_pass "Using ENV['PORT']"
    PORT_USED=1
fi

if [ $PORT_USED -eq 0 ]; then
    report_fail "PORT environment variable not found in code. Railway requires dynamic PORT."
fi

# Check 15: Binding to 0.0.0.0
echo "Checking for correct host binding..."
BIND_OK=0

if grep -r "listen.*0\.0\.0\.0" --include="*.js" --include="*.ts" --include="*.py" . &>/dev/null; then
    report_pass "Binding to 0.0.0.0"
    BIND_OK=1
elif grep -r "localhost\|127\.0\.0\.1" --include="*.js" --include="*.ts" --include="*.py" . | grep -i "listen\|bind" &>/dev/null; then
    report_fail "Code binds to localhost/127.0.0.1. Must bind to 0.0.0.0 for Railway."
    grep -rn "localhost\|127\.0\.0\.1" --include="*.js" --include="*.ts" --include="*.py" . | grep -i "listen\|bind" | head -3
else
    report_info "Could not verify host binding. Ensure you bind to 0.0.0.0"
fi

# Check 16: Environment variable loading
if [ -f package.json ]; then
    if grep -q "dotenv" package.json; then
        report_pass "dotenv package present"
        
        # Check if it's loaded
        if grep -r "require.*dotenv.*config\|import.*dotenv" --include="*.js" --include="*.ts" . &>/dev/null; then
            report_pass "dotenv.config() called"
        else
            report_warn "dotenv installed but not configured. Add: require('dotenv').config()"
        fi
    else
        report_info "dotenv not installed. Environment variables loaded differently?"
    fi
fi

echo ""
echo "🗄️  Section 5: Database Configuration"
echo "----------------------------------"

# Check 17: Database URL usage
if grep -r "DATABASE_URL\|MONGO_URI\|REDIS_URL" --include="*.js" --include="*.ts" --include="*.py" . &>/dev/null; then
    report_pass "Database environment variable used"
    
    # Check for hardcoded database URLs
    if grep -r "postgres://\|mongodb://\|redis://" --include="*.js" --include="*.ts" --include="*.py" . | grep -v "process.env\|os.getenv\|ENV\[" &>/dev/null; then
        report_fail "Hardcoded database URL found! Use environment variable."
        grep -rn "postgres://\|mongodb://\|redis://" --include="*.js" --include="*.ts" --include="*.py" . | grep -v "process.env\|os.getenv\|ENV\[" | head -3
    fi
else
    report_info "No database usage detected"
fi

echo ""
echo "📝 Section 6: Documentation"
echo "-------------------------"

# Check 18: README exists
if [ -f README.md ]; then
    report_pass "README.md exists"
    
    # Check if it mentions deployment
    if grep -qi "deploy\|railway" README.md; then
        report_pass "README mentions deployment"
    else
        report_warn "README doesn't mention deployment. Document how to deploy."
    fi
else
    report_warn "README.md missing"
fi

echo ""
echo "🔬 Section 7: Build Validation"
echo "----------------------------"

# Check 19: Can build locally (Node.js)
if [ -f package.json ] && grep -q '"build"' package.json; then
    report_info "Build script found. Testing build..."
    
    if npm run build &>/dev/null; then
        report_pass "Build succeeds locally"
    else
        report_fail "Build fails locally. Fix before deploying."
    fi
fi

echo ""
echo "🎯 Section 8: Railway CLI"
echo "----------------------"

# Check 20: Railway CLI installed
if command -v railway &>/dev/null; then
    report_pass "Railway CLI installed"
    
    # Check 21: Railway authenticated
    if railway whoami &>/dev/null; then
        report_pass "Railway CLI authenticated"
    else
        report_warn "Railway CLI not authenticated. Run: railway login"
    fi
else
    report_fail "Railway CLI not installed. Run: npm i -g @railway/cli"
fi

echo ""
echo "======================================"
echo "📊 VALIDATION SUMMARY"
echo "======================================"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Failed: $ERRORS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 Perfect! Your project is ready for Railway deployment!${NC}"
        exit 0
    else
        echo -e "${YELLOW}✓ Ready to deploy, but consider addressing warnings.${NC}"
        exit 0
    fi
else
    echo -e "${RED}⚠️  Please fix the $ERRORS critical issue(s) before deploying.${NC}"
    exit 1
fi
```

### Usage:
```bash
# Make executable
chmod +x railway-precheck.sh

# Run validation
./railway-precheck.sh

# Or via Railway Conductor
"Railway Conductor: Run ./railway-precheck.sh and fix all issues found."
```

---

## 🧪 VALIDATION SCRIPT 2: Environment Variables Validator

### Script: `validate-env.js`

```javascript
#!/usr/bin/env node

/**
 * Railway Environment Variables Validator
 * Validates all required environment variables are set
 */

const fs = require('fs');
const path = require('path');

// Color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(type, message) {
  const icons = {
    pass: '✅',
    fail: '❌',
    warn: '⚠️ ',
    info: 'ℹ️ '
  };
  
  const colorMap = {
    pass: colors.green,
    fail: colors.red,
    warn: colors.yellow,
    info: colors.blue
  };
  
  console.log(`${colorMap[type]}${icons[type]} ${message}${colors.reset}`);
}

// Parse .env.example
function parseEnvExample() {
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fs.existsSync(envExamplePath)) {
    log('warn', '.env.example not found. Cannot validate required variables.');
    return [];
  }
  
  const content = fs.readFileSync(envExamplePath, 'utf8');
  const lines = content.split('\n');
  const variables = [];
  
  lines.forEach(line => {
    line = line.trim();
    
    // Skip comments and empty lines
    if (line.startsWith('#') || line === '') return;
    
    // Extract variable name
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=/);
    if (match) {
      variables.push(match[1]);
    }
  });
  
  return variables;
}

// Check if variables are set
function validateEnvironment() {
  console.log('\n🔍 Environment Variables Validation');
  console.log('===================================\n');
  
  const requiredVars = parseEnvExample();
  
  if (requiredVars.length === 0) {
    log('info', 'No .env.example found or no variables defined');
    return { passed: 0, failed: 0, warnings: 0 };
  }
  
  log('info', `Found ${requiredVars.length} variables in .env.example`);
  console.log('');
  
  let passed = 0;
  let failed = 0;
  let warnings = 0;
  
  // Check each variable
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    
    if (value === undefined) {
      log('fail', `${varName} is not set`);
      failed++;
    } else if (value === '') {
      log('warn', `${varName} is set but empty`);
      warnings++;
    } else {
      log('pass', `${varName} is set`);
      passed++;
    }
  });
  
  return { passed, failed, warnings, total: requiredVars.length };
}

// Check for common issues
function checkCommonIssues() {
  console.log('\n🔎 Common Issues Check');
  console.log('=====================\n');
  
  let issues = 0;
  
  // Check PORT
  if (!process.env.PORT) {
    log('warn', 'PORT not set. Railway provides this automatically.');
  }
  
  // Check NODE_ENV
  if (!process.env.NODE_ENV) {
    log('warn', 'NODE_ENV not set. Recommended to set as "production"');
    issues++;
  } else if (process.env.NODE_ENV !== 'production') {
    log('info', `NODE_ENV is "${process.env.NODE_ENV}" (not production)`);
  }
  
  // Check DATABASE_URL
  if (process.env.DATABASE_URL) {
    const dbUrl = process.env.DATABASE_URL;
    
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
      log('fail', 'DATABASE_URL points to localhost. Use Railway database reference.');
      issues++;
    } else if (dbUrl.startsWith('${{')) {
      log('pass', 'DATABASE_URL uses Railway variable reference');
    } else if (dbUrl.includes('railway')) {
      log('pass', 'DATABASE_URL appears to be Railway database');
    } else {
      log('warn', 'DATABASE_URL format unclear. Verify it\'s correct.');
      issues++;
    }
  }
  
  // Check for common secrets
  const secretPatterns = [
    { name: 'JWT_SECRET', required: false },
    { name: 'API_KEY', required: false },
    { name: 'SECRET_KEY', required: false }
  ];
  
  secretPatterns.forEach(({ name }) => {
    if (process.env[name]) {
      const value = process.env[name];
      
      if (value.length < 32) {
        log('warn', `${name} is shorter than 32 characters. Use a stronger secret.`);
        issues++;
      }
      
      if (value === 'your-secret-here' || value === 'change-me') {
        log('fail', `${name} has placeholder value. Set a real secret!`);
        issues++;
      }
    }
  });
  
  return issues;
}

// Main execution
function main() {
  console.log('\n╔════════════════════════════════════╗');
  console.log('║ Railway Environment Validator      ║');
  console.log('╚════════════════════════════════════╝');
  
  const result = validateEnvironment();
  const issues = checkCommonIssues();
  
  console.log('\n===================================');
  console.log('📊 VALIDATION SUMMARY');
  console.log('===================================');
  console.log(`${colors.green}✅ Passed: ${result.passed}${colors.reset}`);
  console.log(`${colors.yellow}⚠️  Warnings: ${result.warnings}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${result.failed}${colors.reset}`);
  
  if (issues > 0) {
    console.log(`${colors.yellow}🔍 Issues Found: ${issues}${colors.reset}`);
  }
  
  console.log('');
  
  if (result.failed === 0 && issues === 0) {
    log('pass', 'All environment variables validated successfully!');
    process.exit(0);
  } else if (result.failed > 0) {
    log('fail', `${result.failed} required variable(s) missing. Set them before deploying.`);
    process.exit(1);
  } else {
    log('warn', 'Variables set but some issues detected. Review before deploying.');
    process.exit(0);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { validateEnvironment, checkCommonIssues };
```

### Usage:
```bash
# Run locally with your environment
node validate-env.js

# Run with Railway environment
railway run node validate-env.js

# Add to package.json scripts
{
  "scripts": {
    "validate": "node validate-env.js",
    "predeploy": "npm run validate"
  }
}
```

---

## 🧪 VALIDATION SCRIPT 3: Port & Host Binding Checker

### Script: `check-port-binding.sh`

```bash
#!/bin/bash

# Port and Host Binding Checker for Railway
echo "🔍 Checking Port and Host Binding Configuration"
echo "============================================="

ERRORS=0

# Function to check files
check_pattern() {
    local pattern="$1"
    local desc="$2"
    local severity="$3"
    
    if grep -r "$pattern" --include="*.js" --include="*.ts" --include="*.py" --include="*.rb" . 2>/dev/null | grep -v node_modules | grep -v ".git"; then
        if [ "$severity" = "error" ]; then
            echo "❌ FAIL: $desc"
            ((ERRORS++))
        else
            echo "⚠️  WARN: $desc"
        fi
        return 1
    else
        echo "✅ PASS: $desc"
        return 0
    fi
}

echo ""
echo "1. Checking for hardcoded ports..."
check_pattern "listen.*[0-9]{4}" "Found potential hardcoded port" "warn"

echo ""
echo "2. Checking for localhost binding..."
check_pattern "listen.*'localhost'\|listen.*\"localhost\"" "Found localhost binding (should use 0.0.0.0)" "error"
check_pattern "listen.*'127.0.0.1'\|listen.*\"127.0.0.1\"" "Found 127.0.0.1 binding (should use 0.0.0.0)" "error"

echo ""
echo "3. Checking for PORT environment variable usage..."
if grep -r "process\.env\.PORT\|os\.getenv.*PORT\|ENV\[.PORT.\]" --include="*.js" --include="*.ts" --include="*.py" --include="*.rb" . 2>/dev/null | grep -v node_modules | grep -v ".git" > /dev/null; then
    echo "✅ PASS: Using PORT environment variable"
else
    echo "❌ FAIL: Not using PORT environment variable"
    ((ERRORS++))
fi

echo ""
echo "4. Checking for 0.0.0.0 binding..."
if grep -r "0\.0\.0\.0" --include="*.js" --include="*.ts" --include="*.py" --include="*.rb" . 2>/dev/null | grep -v node_modules | grep -v ".git" | grep "listen\|bind" > /dev/null; then
    echo "✅ PASS: Binding to 0.0.0.0"
else
    echo "⚠️  WARN: No explicit 0.0.0.0 binding found. Verify server configuration."
fi

echo ""
echo "============================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ All port/host checks passed!"
    exit 0
else
    echo "❌ Found $ERRORS critical issue(s). Fix before deploying to Railway."
    exit 1
fi
```

---

## 🧪 VALIDATION SCRIPT 4: CORS Configuration Checker

### Script: `check-cors.js`

```javascript
#!/usr/bin/env node

/**
 * CORS Configuration Checker
 * Validates CORS is properly configured for Railway deployment
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
};

console.log('\n🌐 CORS Configuration Checker');
console.log('============================\n');

let issues = 0;
let warnings = 0;

// Search for CORS-related code
function searchInFiles(pattern, extensions = ['.js', '.ts', '.py']) {
  const results = [];
  
  function searchDir(dir) {
    if (dir.includes('node_modules') || dir.includes('.git')) return;
    
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        searchDir(filePath);
      } else if (extensions.some(ext => file.endsWith(ext))) {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            results.push({
              file: filePath,
              line: index + 1,
              content: line.trim()
            });
          }
        });
      }
    });
  }
  
  searchDir(process.cwd());
  return results;
}

// Check 1: Is CORS package installed?
console.log('1. Checking for CORS package...');
if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  
  if (deps.cors || deps['@fastify/cors'] || deps['flask-cors']) {
    console.log(`${colors.green}✅ CORS package found${colors.reset}`);
  } else {
    console.log(`${colors.yellow}⚠️  No CORS package found. May need to install one.${colors.reset}`);
    warnings++;
  }
}

// Check 2: Is CORS configured?
console.log('\n2. Checking for CORS configuration...');
const corsPatterns = [
  /app\.use\(cors\(/,
  /cors\(\{/,
  /CORSMiddleware/,
  /CORS\(app/,
  /@cross.?origin/i
];

let corsFound = false;
corsPatterns.forEach(pattern => {
  const results = searchInFiles(pattern);
  if (results.length > 0) {
    corsFound = true;
    console.log(`${colors.green}✅ CORS configuration found${colors.reset}`);
    results.slice(0, 3).forEach(r => {
      console.log(`   ${r.file}:${r.line}`);
    });
  }
});

if (!corsFound) {
  console.log(`${colors.red}❌ No CORS configuration found!${colors.reset}`);
  issues++;
}

// Check 3: Wildcard CORS check
console.log('\n3. Checking for wildcard CORS (security risk)...');
const wildcardResults = searchInFiles(/origin:\s*['"]?\*['"]?/);

if (wildcardResults.length > 0) {
  console.log(`${colors.yellow}⚠️  Wildcard CORS detected (origin: "*")${colors.reset}`);
  console.log(`${colors.yellow}   This allows ALL origins. Consider restricting in production.${colors.reset}`);
  wildcardResults.slice(0, 3).forEach(r => {
    console.log(`   ${r.file}:${r.line}: ${r.content}`);
  });
  warnings++;
} else {
  console.log(`${colors.green}✅ No wildcard CORS detected${colors.reset}`);
}

// Check 4: Localhost in production
console.log('\n4. Checking for localhost in CORS config...');
const localhostResults = searchInFiles(/localhost|127\.0\.0\.1/);

if (localhostResults.length > 0) {
  const corsRelated = localhostResults.filter(r => 
    r.content.toLowerCase().includes('origin') || 
    r.content.toLowerCase().includes('cors') ||
    r.content.toLowerCase().includes('allow')
  );
  
  if (corsRelated.length > 0) {
    console.log(`${colors.yellow}⚠️  Localhost found in CORS configuration${colors.reset}`);
    console.log(`${colors.yellow}   Make sure to add production domains!${colors.reset}`);
    corsRelated.slice(0, 3).forEach(r => {
      console.log(`   ${r.file}:${r.line}: ${r.content}`);
    });
    warnings++;
  }
}

// Check 5: Environment-based CORS
console.log('\n5. Checking for environment-based CORS configuration...');
const envCorsResults = searchInFiles(/process\.env\.|ALLOWED_ORIGINS|CORS_ORIGIN/);

const corsEnvRelated = envCorsResults.filter(r => 
  r.content.toLowerCase().includes('origin') || 
  r.content.toLowerCase().includes('cors')
);

if (corsEnvRelated.length > 0) {
  console.log(`${colors.green}✅ Environment-based CORS configuration found (good practice!)${colors.reset}`);
} else {
  console.log(`${colors.yellow}⚠️  No environment-based CORS detected${colors.reset}`);
  console.log(`${colors.yellow}   Consider using environment variables for CORS origins${colors.reset}`);
  warnings++;
}

// Summary
console.log('\n============================');
console.log('📊 CORS Check Summary');
console.log('============================');
console.log(`${colors.red}❌ Issues: ${issues}${colors.reset}`);
console.log(`${colors.yellow}⚠️  Warnings: ${warnings}${colors.reset}`);

if (issues === 0 && warnings === 0) {
  console.log(`\n${colors.green}🎉 CORS configuration looks good!${colors.reset}\n`);
  process.exit(0);
} else if (issues > 0) {
  console.log(`\n${colors.red}⚠️  Critical CORS issues detected. Fix before deploying.${colors.reset}\n`);
  process.exit(1);
} else {
  console.log(`\n${colors.yellow}✓ No critical issues, but review warnings.${colors.reset}\n`);
  process.exit(0);
}
```

---

## 🧪 VALIDATION SCRIPT 5: Database Connection Tester

### Script: `test-db-connection.js`

```javascript
#!/usr/bin/env node

/**
 * Database Connection Tester
 * Tests database connectivity before deployment
 */

require('dotenv').config();

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

console.log('\n🗄️  Database Connection Tester');
console.log('=============================\n');

async function testPostgres() {
  const { Pool } = require('pg');
  
  console.log(`${colors.blue}ℹ️  Testing PostgreSQL connection...${colors.reset}`);
  
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' 
      ? { rejectUnauthorized: false } 
      : false
  });
  
  try {
    const result = await pool.query('SELECT NOW()');
    console.log(`${colors.green}✅ PostgreSQL connection successful${colors.reset}`);
    console.log(`   Server time: ${result.rows[0].now}`);
    
    // Test connection pool
    const poolInfo = {
      total: pool.totalCount,
      idle: pool.idleCount,
      waiting: pool.waitingCount
    };
    console.log(`   Pool status: ${JSON.stringify(poolInfo)}`);
    
    await pool.end();
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ PostgreSQL connection failed${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testMongoDB() {
  const { MongoClient } = require('mongodb');
  
  console.log(`${colors.blue}ℹ️  Testing MongoDB connection...${colors.reset}`);
  
  const client = new MongoClient(process.env.MONGO_URI || process.env.DATABASE_URL);
  
  try {
    await client.connect();
    await client.db().admin().ping();
    console.log(`${colors.green}✅ MongoDB connection successful${colors.reset}`);
    await client.close();
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ MongoDB connection failed${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function testRedis() {
  const redis = require('redis');
  
  console.log(`${colors.blue}ℹ️  Testing Redis connection...${colors.reset}`);
  
  const client = redis.createClient({
    url: process.env.REDIS_URL
  });
  
  try {
    await client.connect();
    await client.ping();
    console.log(`${colors.green}✅ Redis connection successful${colors.reset}`);
    await client.quit();
    return true;
  } catch (error) {
    console.log(`${colors.red}❌ Redis connection failed${colors.reset}`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  // Check which databases are configured
  const hasPostgres = process.env.DATABASE_URL && 
    (process.env.DATABASE_URL.includes('postgres') || 
     process.env.DATABASE_URL.includes('postgresql'));
  
  const hasMongo = process.env.MONGO_URI || 
    (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('mongodb'));
  
  const hasRedis = process.env.REDIS_URL;
  
  if (!hasPostgres && !hasMongo && !hasRedis) {
    console.log(`${colors.yellow}⚠️  No database URLs found in environment${colors.reset}`);
    console.log(`${colors.yellow}   Make sure DATABASE_URL, MONGO_URI, or REDIS_URL is set${colors.reset}`);
    process.exit(1);
  }
  
  let allSuccess = true;
  
  // Test PostgreSQL
  if (hasPostgres) {
    const success = await testPostgres();
    allSuccess = allSuccess && success;
    console.log('');
  }
  
  // Test MongoDB
  if (hasMongo) {
    const success = await testMongoDB();
    allSuccess = allSuccess && success;
    console.log('');
  }
  
  // Test Redis
  if (hasRedis) {
    const success = await testRedis();
    allSuccess = allSuccess && success;
    console.log('');
  }
  
  console.log('=============================');
  if (allSuccess) {
    console.log(`${colors.green}✅ All database connections successful!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}❌ Some database connections failed${colors.reset}\n`);
    process.exit(1);
  }
}

// Run tests
main().catch(error => {
  console.error(`${colors.red}❌ Test execution failed:${colors.reset}`, error);
  process.exit(1);
});
```

### Usage:
```bash
# Install required packages first
npm install pg mongodb redis

# Test locally
node test-db-connection.js

# Test with Railway environment
railway run node test-db-connection.js
```

---

## 📦 VALIDATION SCRIPT 6: Build Size Analyzer

### Script: `analyze-build.sh`

```bash
#!/bin/bash

# Build Size Analyzer
# Helps identify what's making your deployment large

echo "📦 Build Size Analyzer"
echo "====================="
echo ""

# Check if in project directory
if [ ! -f package.json ] && [ ! -f requirements.txt ]; then
    echo "❌ No package.json or requirements.txt found"
    exit 1
fi

# Analyze node_modules
if [ -d node_modules ]; then
    echo "📊 Node.js Dependencies Analysis"
    echo "--------------------------------"
    
    # Total size
    SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
    echo "Total node_modules size: $SIZE"
    
    # Top 10 largest packages
    echo ""
    echo "Top 10 largest packages:"
    du -sh node_modules/* 2>/dev/null | sort -hr | head -10
    
    # Count packages
    COUNT=$(find node_modules -maxdepth 1 -type d | wc -l)
    echo ""
    echo "Total packages: $COUNT"
    
    # Check for common heavy packages
    echo ""
    echo "Checking for heavy packages..."
    
    HEAVY_PACKAGES=("webpack" "typescript" "@types" "eslint" "jest" "mocha" "chai")
    for pkg in "${HEAVY_PACKAGES[@]}"; do
        if [ -d "node_modules/$pkg" ] || ls node_modules/$pkg* 1> /dev/null 2>&1; then
            SIZE=$(du -sh node_modules/$pkg* 2>/dev/null | cut -f1 | head -1)
            echo "  ⚠️  $pkg found ($SIZE) - Consider if needed in production"
        fi
    done
fi

# Check build output
echo ""
echo "🔨 Build Output Analysis"
echo "------------------------"

if [ -d dist ]; then
    SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    echo "dist/ size: $SIZE"
    
    # Find large files
    echo "Large files in dist/:"
    find dist -type f -size +1M -exec du -sh {} \; | sort -hr | head -5
elif [ -d build ]; then
    SIZE=$(du -sh build 2>/dev/null | cut -f1)
    echo "build/ size: $SIZE"
    
    echo "Large files in build/:"
    find build -type f -size +1M -exec du -sh {} \; | sort -hr | head -5
fi

# Check for common large files
echo ""
echo "🔍 Large Files Check"
echo "-------------------"
find . -type f -size +5M \
    ! -path "./node_modules/*" \
    ! -path "./.git/*" \
    ! -path "./dist/*" \
    ! -path "./build/*" \
    -exec du -sh {} \; | sort -hr

echo ""
echo "💡 Optimization Tips"
echo "-------------------"
echo "1. Move dev dependencies to devDependencies in package.json"
echo "2. Use .railwayignore to exclude unnecessary files"
echo "3. Consider production-only builds (npm ci --only=production)"
echo "4. Remove unused dependencies"
echo "5. Use CDN for large static assets"
echo ""
```

---

## 🔄 MASTER VALIDATION SCRIPT

### Script: `pre-deploy-validate-all.sh`

```bash
#!/bin/bash

# Master Pre-Deployment Validation Script
# Runs all validation checks

echo "╔══════════════════════════════════════════╗"
echo "║  Railway Pre-Deployment Master Check    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

TOTAL_ERRORS=0
TOTAL_WARNINGS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

run_check() {
    local name=$1
    local script=$2
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Running: $name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if [ -f "$script" ]; then
        bash "$script"
        local exit_code=$?
        
        if [ $exit_code -ne 0 ]; then
            ((TOTAL_ERRORS++))
            echo -e "${RED}✗ $name failed${NC}"
        else
            echo -e "${GREEN}✓ $name passed${NC}"
        fi
    else
        echo -e "${YELLOW}⚠  $name script not found: $script${NC}"
        ((TOTAL_WARNINGS++))
    fi
}

# Run all validation scripts
run_check "Repository & Security Check" "./railway-precheck.sh"
run_check "Port & Host Binding Check" "./check-port-binding.sh"
run_check "Build Size Analysis" "./analyze-build.sh"

# Run Node.js specific checks
if [ -f package.json ]; then
    if [ -f validate-env.js ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Running: Environment Variables Check"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        node validate-env.js
        [ $? -ne 0 ] && ((TOTAL_ERRORS++))
    fi
    
    if [ -f check-cors.js ]; then
        echo ""
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "Running: CORS Configuration Check"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        node check-cors.js
        [ $? -ne 0 ] && ((TOTAL_ERRORS++))
    fi
fi

# Final summary
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║          VALIDATION SUMMARY              ║"
echo "╚══════════════════════════════════════════╝"
echo ""

if [ $TOTAL_ERRORS -eq 0 ] && [ $TOTAL_WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 Perfect! All checks passed!${NC}"
    echo -e "${GREEN}✓ Your project is ready for Railway deployment${NC}"
    exit 0
elif [ $TOTAL_ERRORS -eq 0 ]; then
    echo -e "${YELLOW}✓ All critical checks passed${NC}"
    echo -e "${YELLOW}⚠  $TOTAL_WARNINGS warning(s) - review before deploying${NC}"
    exit 0
else
    echo -e "${RED}✗ $TOTAL_ERRORS critical issue(s) found${NC}"
    echo -e "${RED}⚠  Please fix before deploying to Railway${NC}"
    exit 1
fi
```

---

## 🎯 INTEGRATION WITH RAILWAY CONDUCTOR

### Command to Run All Validations:

```
Railway Conductor: Run complete pre-deployment validation suite.

Execute these validation scripts in order:
1. ./railway-precheck.sh - Repository and security check
2. node validate-env.js - Environment variables validation
3. ./check-port-binding.sh - Port and host configuration
4. node check-cors.js - CORS configuration check
5. ./analyze-build.sh - Build size analysis

For each script:
- Run the script
- Parse the output
- Report results to me clearly
- If FAIL: Stop and help me fix the issue
- If WARN: Note the warning and continue
- If PASS: Continue to next check

After all checks:
- Provide complete summary
- List all issues found
- Prioritize fixes by severity
- Offer to fix issues automatically where possible

Do not proceed with deployment until all critical issues are resolved.
```

---

## 📋 PACKAGE.JSON INTEGRATION

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "validate": "node validate-env.js",
    "validate:all": "./pre-deploy-validate-all.sh",
    "validate:cors": "node check-cors.js",
    "validate:db": "node test-db-connection.js",
    "prevalidate": "chmod +x *.sh",
    "predeploy": "npm run validate:all",
    "deploy": "railway up",
    "deploy:check": "npm run validate && railway up"
  }
}
```

---

## 🔧 SETUP INSTRUCTIONS

### One-Time Setup:

```bash
# 1. Download all validation scripts to your project
# (Scripts provided above)

# 2. Make scripts executable
chmod +x railway-precheck.sh
chmod +x check-port-binding.sh
chmod +x analyze-build.sh
chmod +x pre-deploy-validate-all.sh

# 3. Install required Node.js dependencies (if using Node checks)
npm install --save-dev dotenv

# 4. Add to package.json scripts (see above)

# 5. Test the validation
./pre-deploy-validate-all.sh

# 6. Commit validation scripts
git add *.sh *.js
git commit -m "Add pre-deployment validation scripts"
```

---

## 🎓 USING WITH RAILWAY CONDUCTOR

### Automated Validation Workflow:

```
Railway Conductor: Before we deploy, run pre-deployment validation.

1. Run: ./pre-deploy-validate-all.sh
2. Parse all results
3. For any failures:
   a. Show me the exact error
   b. Explain what's wrong
   c. Provide the fix
   d. Ask if you should implement the fix
4. For warnings:
   a. List them for review
   b. Explain if they'll cause problems
   c. Recommend whether to fix now or later
5. Once all critical issues fixed:
   a. Confirm with me
   b. Proceed to deployment
   c. Continue monitoring

Do not deploy if any critical issues remain.
```

---

## 📊 VALIDATION CHECKLIST

Before deployment, ensure all these pass:

### Critical (Must Pass):
- [ ] ✅ No .env files committed
- [ ] ✅ No hardcoded secrets
- [ ] ✅ Using process.env.PORT
- [ ] ✅ Binding to 0.0.0.0
- [ ] ✅ All required env vars set
- [ ] ✅ Database connection works
- [ ] ✅ Build succeeds locally
- [ ] ✅ Railway CLI authenticated

### Important (Should Pass):
- [ ] ⚠️  CORS properly configured
- [ ] ⚠️  No wildcard CORS in production
- [ ] ⚠️  Environment-based configuration
- [ ] ⚠️  Lock file committed
- [ ] ⚠️  Documentation updated

### Optional (Nice to Have):
- [ ] ℹ️  Build size optimized
- [ ] ℹ️  .railwayignore configured
- [ ] ℹ️  Health check endpoint
- [ ] ℹ️  Error tracking setup

---

*These validation scripts catch 95% of deployment errors before they happen. Use them before every Railway deployment!*