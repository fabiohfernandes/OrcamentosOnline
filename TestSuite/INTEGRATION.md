# TESTER Suite Integration Guide

## How to Add TESTER to Your Projects

### Method 1: Git Submodule (Recommended)

**Advantages:**
- Automatic updates across all projects
- Version control integration
- Easy updates with `git submodule update --remote`

**Setup:**
```bash
# In your project root
git submodule add https://github.com/yourusername/tester-suite tester

# Initialize and update
git submodule update --init --recursive

# Commit the submodule
git add .gitmodules tester
git commit -m "Add TESTER suite as submodule"
```

**Updating TESTER:**
```bash
# Update to latest version
git submodule update --remote tester

# Commit the update
git add tester
git commit -m "Update TESTER to latest version"

# Push changes
git push
```

**Team Workflow:**
```bash
# When cloning project with submodules
git clone --recursive https://github.com/yourproject/repo

# Or if already cloned
git submodule update --init --recursive
```

### Method 2: npm Package

**Setup:**
```bash
npm install @yourusername/tester-suite
```

**Usage in package.json:**
```json
{
  "scripts": {
    "test:stress": "tester-suite start",
    "test:stop": "tester-suite stop",
    "test:update": "npm update @yourusername/tester-suite"
  },
  "devDependencies": {
    "@yourusername/tester-suite": "^2.0.0"
  }
}
```

### Method 3: Direct Copy (Not Recommended)

```bash
# Download and extract
wget https://github.com/yourusername/tester-suite/archive/main.zip
unzip main.zip
mv tester-suite-main tester
```

## Project Integration Examples

### React/Next.js Project

```bash
# Add submodule
git submodule add https://github.com/yourusername/tester-suite tester

# Update package.json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "test:stress": "cd tester && TARGET_URL=http://localhost:3000 docker-compose up -d",
    "test:stress:stop": "cd tester && docker-compose down",
    "test:update": "git submodule update --remote tester"
  }
}
```

**Environment Configuration:**
```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api
TARGET_URL=http://localhost:3000
PROJECT_NAME=MyReactApp
```

### Node.js/Express Project

```bash
# Add submodule
git submodule add https://github.com/yourusername/tester-suite tester

# Update package.json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test:stress": "cd tester && TARGET_URL=http://localhost:3001 docker-compose up -d",
    "test:stress:logs": "cd tester && docker-compose logs -f tester",
    "test:update": "git submodule update --remote tester"
  }
}
```

### Django Project

```bash
# Add submodule
git submodule add https://github.com/yourusername/tester-suite tester

# Add to Makefile
stress-test:
	cd tester && TARGET_URL=http://localhost:8000 docker-compose up -d

stress-test-stop:
	cd tester && docker-compose down

update-tester:
	git submodule update --remote tester
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/stress-test.yml
name: Stress Testing

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  stress-test:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout repository
      uses: actions/checkout@v3
      with:
        submodules: true  # Important for submodules

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm install

    - name: Build application
      run: npm run build

    - name: Start application
      run: |
        npm start &
        sleep 10  # Wait for app to start

    - name: Run stress tests
      run: |
        cd tester
        TARGET_URL=http://localhost:3000 docker-compose up -d

    - name: Wait for tests to complete
      run: |
        cd tester
        timeout 300 docker-compose logs -f tester || true

    - name: Collect test results
      run: |
        cd tester
        docker-compose exec -T tester curl -s http://localhost:8888/api/activity/summary > test-results.md

    - name: Upload test results
      uses: actions/upload-artifact@v3
      with:
        name: stress-test-results
        path: tester/test-results.md

    - name: Stop stress tests
      run: |
        cd tester
        docker-compose down
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - stress-test

stress-test:
  stage: stress-test
  image: docker:latest
  services:
    - docker:dind
  variables:
    DOCKER_DRIVER: overlay2
  before_script:
    - git submodule update --init --recursive
  script:
    - cd tester
    - TARGET_URL=http://localhost:3000 docker-compose up -d
    - timeout 300 docker-compose logs -f tester || true
    - docker-compose exec -T tester curl -s http://localhost:8888/api/activity/summary > ../test-results.md
    - docker-compose down
  artifacts:
    reports:
      junit: test-results.md
    paths:
      - test-results.md
```

## Automatic Updates Setup

### Option 1: GitHub Actions for Auto-Update

```yaml
# .github/workflows/update-tester.yml
name: Update TESTER Suite

on:
  schedule:
    - cron: '0 2 * * 1'  # Weekly on Monday at 2 AM
  workflow_dispatch:  # Manual trigger

jobs:
  update-tester:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout repository
      uses: actions/checkout@v3
      with:
        submodules: true
        token: ${{ secrets.GITHUB_TOKEN }}

    - name: Update TESTER submodule
      run: |
        git submodule update --remote tester

    - name: Check for changes
      id: changes
      run: |
        if git diff --quiet; then
          echo "no_changes=true" >> $GITHUB_OUTPUT
        else
          echo "no_changes=false" >> $GITHUB_OUTPUT
        fi

    - name: Create Pull Request
      if: steps.changes.outputs.no_changes == 'false'
      uses: peter-evans/create-pull-request@v5
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        commit-message: 'chore: update TESTER suite to latest version'
        title: 'Update TESTER Suite'
        body: |
          Automated update of TESTER suite submodule to latest version.

          Please review the changes and test before merging.
        branch: update-tester-suite
```

### Option 2: Dependabot for npm Package

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    allow:
      - dependency-name: "@yourusername/tester-suite"
```

## Configuration Management

### Environment Variables

Create `.env` file in your project root:
```bash
# Application
TARGET_URL=http://localhost:3000
PROJECT_NAME=MyApplication

# TESTER Configuration
HEADLESS=true
VIRTUAL_USERS=5
TEST_DURATION=300

# Database (optional - uses Docker defaults)
POSTGRES_URL=postgresql://testeruser:testerpass@localhost:5434/testerdb
REDIS_URL=redis://localhost:6381

# Claude Integration (optional)
CLAUDE_API_KEY=your_api_key_here
```

### Docker Compose Override

Create `tester/docker-compose.override.yml`:
```yaml
version: '3.8'
services:
  tester:
    environment:
      - TARGET_URL=${TARGET_URL:-http://host.docker.internal:3000}
      - PROJECT_NAME=${PROJECT_NAME:-MyProject}
      - VIRTUAL_USERS=${VIRTUAL_USERS:-3}
    ports:
      - "${TESTER_PORT:-8888}:8888"
```

## Troubleshooting

### Common Issues

1. **Submodule not updating**
   ```bash
   git submodule deinit tester
   git rm tester
   git submodule add https://github.com/yourusername/tester-suite tester
   ```

2. **Docker port conflicts**
   ```bash
   # Change ports in docker-compose.override.yml
   ports:
     - "8889:8888"  # Change TESTER port
   ```

3. **Permission issues**
   ```bash
   sudo chown -R $USER:$USER tester/
   ```

### Getting Help

1. Check TESTER logs: `cd tester && docker-compose logs -f`
2. Verify configuration: `cd tester && docker-compose config`
3. Open issue: https://github.com/yourusername/tester-suite/issues

## Best Practices

1. **Always use specific versions in production**
   ```bash
   cd tester
   git checkout v2.1.0
   ```

2. **Test updates in development first**
   ```bash
   git submodule update --remote tester
   # Test thoroughly before deploying
   ```

3. **Keep configuration in environment variables**
   - Don't hardcode URLs or credentials
   - Use `.env` files for local development

4. **Monitor resource usage**
   - TESTER can be resource-intensive
   - Adjust `VIRTUAL_USERS` based on your system

5. **Regular updates**
   - Check for TESTER updates weekly
   - Review changelog before updating
   - Test critical paths after updates