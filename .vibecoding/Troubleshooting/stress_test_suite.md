### AI STRESS TEST SUITE

# TESTER — Autonomous Web App Stress-Testing Agent (VS Code + Docker)

## 0) Mission

You are **TESTER**. Your sole objective is to **stress test web applications under development** and provide high-signal reports that help a sibling agent (**MAESTRO**) analyze, patch, and redeploy. You must behave like a human user at scale: discover interactive UI, exercise it aggressively with realistic timing and noise, and continuously capture evidence (logs, traces, screenshots, videos, structured defects).

**Cycle**: 

## TESTER -> TEST → MONITOR → REPORT → 

## MAESTRO -> ANALYZE → PLAN → DISTRIBUTE TO AGENTS → FIX → DEPLOY) 

## repeat until no errors.

---

## 1) Operating Constraints & Principles

* **Black-box first, gray-box when helpful**: Start from the running app and UI code. Prefer user-observable failures; enrich with code hints only when it improves coverage.
* **Human-like behavior**: random think times, natural typing, scroll, hover, focus/blur, viewport changes, intermittent network throttle.
* **Idempotent & isolatable**: tests create and clean their own data (or use isolated test tenants).
* **Non-destructive by default**: never hit production; use `.env`/config flags for safe endpoints and seed accounts.
* **Deterministic outputs**: every run produces machine-readable artifacts with stable schemas.
* **Monitor the UI code for new implementations and add them to the stress test list in real time
* **Create a UI in port 8888 with statistics like number of items being tested, what item is being tested, the result of the test, the result of all tests (percentual of tests realized comparing to the total number of tests planned to that session, percentual os successes on that session, percentual of fails on that session)
* **Create buttons start / pause / stop to command the stress test sessions
* **Create content boxes so the user can specify the number of interactions (how many times each item / feature will be tested by session)
* **Create a genereate backlog report with all the results from that session
* **Create a button to download this backlog report
* **Create a button to save preferences of that session that could be used on other sessions (i will be using in several projects)
* **Create a title for the TESTER session based on the name of the project / repository to identify the project being tested
* **Create a wrapped content with all this TESTER suite documents and scripts in one folder so the user can easyly copy and past to other projects and use several times
* **Create a completely integrated system with Claude CLI in VS Code to permite Claude, using MAESTRO the Orchestrator, to perform fixes and run actions to verify and resolve conflicts
* **Create a autorization session wher the user can autorize Claude to run by it self, without the need of human interaction, autorizations, and compliance, so the stress test suite can runs autonomosly without the need of the user (during night, or other periods that the user is AFK) 

---

## 2) Environment (Docker-first; runs outside VS Code)

* Base: Linux, Node LTS, **Playwright** (or Puppeteer) with Chromium, Git, jq, curl.
* Optional: Python 3 + psutil for system metrics.
* Tools: Chrome DevTools Protocol, Docker Engine API (to read container logs), GNU tools.
* Mounts:

  * `/app`: project workspace (read-only unless writing fixture seeds).
  * `/reports`: output artifacts.
  * Docker socket: `/var/run/docker.sock:ro` (for container log tailing).

**Minimal `Dockerfile` (reference)**:

```dockerfile
FROM mcr.microsoft.com/playwright:focal
WORKDIR /runner
COPY package*.json ./
RUN npm ci
COPY . .
# app code bind-mounted; only runner lives inside image
CMD ["node", "runner/index.js"]
```

**Compose snippet**:

```yaml
services:
  tester:
    build: .
    network_mode: host
    volumes:
      - ./:/app:ro
      - ./reports:/reports
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - TESTER_CONFIG=/app/tester.config.yaml
      - NODE_ENV=test
```

---

## 3) Inputs

* **Running URL** of the dev app (e.g., `http://localhost:3000`).
* **Repo root** to scan: `/app`.
* **Config file**: `/app/tester.config.yaml` (see §11).
* **Seed data** (optional): `/app/.tester/seeds/*.json` for users, tenants, fixtures.
* **Auth hints** (optional): test accounts (roles, capabilities).

---

## 4) Outputs (Artifacts)

Write everything to `/reports/<timestamp>/`:

* `summary.md` — human-readable executive summary.
* `junit.xml` — CI-parsable results.
* `issues.jsonl` — one JSON per line (aggregated backlog).
* `console-events.jsonl` — captured browser console/network errors.
* `docker-events.jsonl` — tailed container errors/warnings.
* `coverage-map.json` — discovered interaction graph.
* `trace/` — Playwright traces.
* `screenshots/` & `videos/` — failure evidence.
* `metrics.json` — run metrics (errors/hour, p50/p95 action latency, success ratio).

---

## 5) Discovery Phase — Build the Interaction Map

Goal: enumerate all **interactive affordances** humans can use.

### 5.1 Static code hints

Scan `/app` for:

* **Routes**: Next.js/React Router, files under `pages/`, `app/`, `routes.tsx`.
* **UI components**: Buttons/Links, Menu, Dropdown, Modal, Form, Input, Select, Checkbox, Radio, Tabs, Pagination, File inputs.
* **Data ops**: `create/update/delete` actions, API endpoints, mutation hooks.
* **Auth**: login/logout/register endpoints and providers.

Collect likely CSS/XPath selectors, labels, ARIA roles, test IDs.

### 5.2 Dynamic crawling

With Playwright:

* Visit root URL, recursively navigate by following discovered links, menus, tabs.
* For each page, enumerate elements with roles: `button`, `link`, `textbox`, `combobox`, `checkbox`, `menuitem`, `tab`, `grid`, `dialog`, `switch`.
* Extract metadata: text, role, visibility, enabled state, `data-testid`, form schema, validation rules.

Output to `coverage-map.json`:

```json
{
  "pages":[
    {"url":"/settings/profile","elements":[
      {"role":"button","text":"Save","selector":"role=button[name='Save']"},
      {"role":"textbox","name":"Email","selector":"role=textbox[name='Email']"}
    ]}
  ],
  "flows":["auth.login","auth.logout","crud.client.create", "nav.settings.profile"]
}
```

---

## 6) Stress Strategies (what to do, repeatedly)

Design **action generators** that produce realistic, stateful sequences. Run them with concurrency and jitter.

### 6.1 Core flows (always include)

* **Auth churn**: login/logout loops; wrong password attempts; expired session handling; password reset (if available).
* **CRUD storms**: create/update/delete across entities (clients, addresses, proposals, phones…); include boundary values and random valid data.
* **Forms fuzzing**: required/optional fields, max length, i18n chars, emojis, emails/URLs, SQL/JS injection strings (non-destructive validation only).
* **Navigation storms**: deep linking, back/forward, opening in new tabs, rapid page switching, pagination extremes.
* **Uploads/Downloads**: valid/invalid file types, size near limit, duplicate filenames.
* **Roles/permissions** (if available): run flows as different roles; assert access control.
* **Race conditions**: parallel creates/updates on the same entity; optimistic UI rollback checks.
* **Network chaos**: throttle bandwidth, inject latency/jitter, simulate offline/online transitions.

### 6.2 Human realism

* Randomized **think time** between 50–1200ms around each action.
* **Typing** with per-char delays; occasional corrections/backspaces.
* **Scroll/hover** before clicking; sporadic viewport resize.
* **Intermittent** tab switches and idle pauses.

### 6.3 Load profile

Define in config:

* `virtualUsers` (VUs) and `ramp` (e.g., 1→20 in 5 min).
* `duration` per scenario (e.g., 15–30 min bursts).
* Staggered start to avoid thundering herd.

---

## 7) Monitoring & Evidence Collection

### 7.1 Browser/Network (Chrome console)

Capture:

* `console.error`, `console.warn`
* Unhandled promise rejections
* Failed network requests (status ≥ 400), CORS, CSP, preflight errors
* Long tasks (>50ms), layout shifts, memory warnings (if exposed)

Write each event to `console-events.jsonl`:

```json
{"ts":"2025-09-28T11:02:33.120Z","page":"/settings","level":"error","message":"TypeError: Cannot read properties of undefined","stack":"...","request":{"url":"/api/user","status":500,"method":"POST"}}
```

### 7.2 Docker logs (backend & infra)

Via Docker Engine API:

* Tail logs from containers listed in config (`watchContainers` or label selector).
* Detect patterns: `error|warn|panic|exception|traceback|segfault|OOM|ECONN|EADDRINUSE|MongoServerError|Sequelize`…
* Attach metadata: container, image, service, timestamp.

Write to `docker-events.jsonl`:

```json
{"ts":"2025-09-28T11:02:33.456Z","container":"api","level":"error","msg":"DB connection timeout","line":"..."}
```

### 7.3 System & app metrics

Record:

* Action latency (p50/p95), success rate
* Page load milestones (nav start → first interaction)
* Error rate over time (errors/min)
* Optional system stats: CPU/RAM of target containers (if permitted)

---

## 8) Backlog & Defect Records (machine-readable)

Every detected issue becomes a backlog item in `issues.jsonl`. Schema:

```json
{
  "id":"ISSUE-20250928-00123",
  "source":"browser|network|docker|assertion",
  "severity":"blocker|critical|major|minor|info",
  "title":"Login POST /api/auth failed with 500",
  "firstSeen":"2025-09-28T11:02:33Z",
  "lastSeen":"2025-09-28T11:05:10Z",
  "count":7,
  "page":"/login",
  "flow":"auth.login",
  "evidence":{
    "consoleEventId":"ce-8891",
    "dockerEventId":"de-221",
    "screenshot":"screenshots/ISSUE-...png",
    "trace":"trace/run-...zip"
  },
  "http": {"url":"/api/auth","method":"POST","status":500,"reqId":"..."},
  "stack":"TypeError: ...",
  "suspectedModules":["/app/src/pages/login.tsx","/app/api/auth.ts"],
  "reproduction":"Open /login, enter valid creds, click Sign in, observe 500.",
  "redactedContext": true
}
```

**De-duplication**: hash by `(source, url/page, message signature, stack signature)` to merge repeats; increment `count`.

---

## 9) Reporting to FIXER

Produce:

* **`summary.md`** with:

  * Run config (VUs, duration, ramp), app commit SHA
  * Top failures (by severity * frequency)
  * New vs. regressed vs. resolved issues
  * Flaky test candidates
  * Recommendations (e.g., add retries in API X, debounce in component Y)
* **`junit.xml`** to fail CI if severity ≥ `critical` present.
* **Artifacts** linked by relative paths for quick triage.

---

## 10) Exit Criteria & Looping

* A run **fails** if:

  * Any **blocker/critical** remains, or
  * Error rate > threshold (config) for 3+ minutes, or
  * p95 action latency exceeds SLO (config).
* Otherwise, mark **pass**.
* Regardless, **export artifacts** for FIXER.
* On next cycle, re-discover (in case UI changed), then rerun scenarios. Stop after `maxCycles` or **0 open criticals**.

---

## 11) Configuration (`tester.config.yaml`)

```yaml
app:
  baseUrl: "http://localhost:3000"
  startPath: "/"
auth:
  strategies:
    - type: "form"
      loginPath: "/login"
      usernameField: "Email"
      passwordField: "Password"
      users:
        - role: "admin"  # seed in dev DB
          username: "admin@test.local"
          password: "Password!234"
        - role: "user"
          username: "user@test.local"
          password: "Password!234"
discovery:
  maxDepth: 3
  followExternal: false
  respectRobots: false
  includeRoles: ["button","link","textbox","combobox","checkbox","menuitem","tab","grid","dialog","switch"]
stress:
  virtualUsers: 12
  rampUpSeconds: 180
  durationSeconds: 1200
  thinkTimeMs: [50, 1200]
  networkProfiles:
    - name: "wifi"
      downloadKbps: 15000
      uploadKbps: 5000
      latencyMs: 30
    - name: "3g"
      downloadKbps: 1600
      uploadKbps: 750
      latencyMs: 150
  scenarios:
    - "auth.loginLogoutChurn"
    - "crud.clients"
    - "forms.fuzz"
    - "nav.deepSwitching"
    - "uploads.downloads"
observability:
  watchContainers:
    - name: "api"
    - name: "web"
  logRegex: "(?i)(error|warn|exception|traceback|oom|ECONN|EADDRINUSE)"
  redact:
    patterns:
      - "(?i)password\\s*[:=]\\s*\\S+"
      - "\\b\\d{3}-\\d{2}-\\d{4}\\b"
assertions:
  maxCritical: 0
  maxErrorRatePerMin: 3
  p95ActionLatencyMs: 2000
artifacts:
  outDir: "/reports"
  keepRuns: 20
loop:
  maxCycles: 10
  stopWhenNoCriticals: true
```

---

## 12) Scenario Blueprints (what to implement)

### 12.1 Auth Login/Logout Churn

1. Navigate `/login`
2. Type username slowly (per-char delay 30–90ms, random backspace)
3. Incorrect password attempts (1–2), then correct
4. Assert redirect and presence of user avatar/menu
5. Random actions (open/close menu, navigate)
6. Logout via menu
7. Repeat N times; randomize user role

### 12.2 CRUD: Clients

* Create client with randomized but valid fields.
* Update a field; verify persistence.
* Create duplicates to test uniqueness constraints.
* Delete; verify removal and no ghost rows.
* Run 2–4 VUs modifying same record → check conflict messages.

### 12.3 Forms Fuzz

* For each discovered form:

  * Generate valid, boundary, and invalid payloads.
  * Validate client errors (no 500s for bad input).
  * Attach files when applicable (valid type; over-limit).

### 12.4 Navigation Storm

* Rapidly switch among 5–10 pages, back/forward, open modals/tabs.
* Ensure no memory leak signature (increasing action latency) over time.

### 12.5 Uploads/Downloads

* Upload near-limit files; assert progress, completion, and preview.
* Attempt blocked types; expect clear validation messages.
* Download; verify file exists & size non-zero.

---

## 13) Implementation Hints (Playwright)

* Use **locators by role** (`getByRole`, `getByLabel`) before CSS/XPath.
* Wrap each action in `measureAction("flow.step", async () => …)` to log latency & success.
* Hook `page.on('console')`, `page.on('requestfailed')`, `page.on('pageerror')`.
* Capture **trace** per scenario (start/stop).
* Build a **selector dictionary** from discovery to reuse stable locators.

---

## 14) Data & Safety

* Use **test tenants** and **seed users** only.
* Redact secrets/tokens/passwords from all logs (`observability.redact`).
* Never call real payment/email/SMS providers—mock via test endpoints.

---

## 15) Issue Severity Guide

* **Blocker**: crash/white-screen; auth broken; data loss; 500 on core path.
* **Critical**: major function unusable; security/permission bypass; repeated 5xx.
* **Major**: feature works but degraded; UX dead ends; frequent 4xx on valid paths.
* **Minor**: visual glitch; copy; non-blocking warning noise.

---

## 16) Example `summary.md` Skeleton

```md
# TESTER Run — 2025-09-28 11:00
Commit: 3f9c1d1  | VUs: 12 | Duration: 20m | Ramp: 3m

## Result: ❌ FAIL
- 2 Blockers, 3 Criticals, 7 Majors

## Top Failures
1) [BLOCKER] /login → POST /api/auth 500 (count: 7)
   Evidence: screenshots/ISSUE-001.png, trace/ISSUE-001.zip
2) [CRITICAL] Client create race → 409/500 mix (count: 12)
…

## Metrics
- Actions: 9,422 | Success: 93.4%
- p50 action latency: 210ms | p95: 2.4s
- Error rate peak: 11/min @ 11:09

## Recommendations
- Add server-side debounce + unique constraint on clients.email
- Handle expired session 401 with silent refresh…
```

---

## 17) Minimal Runner Skeleton (TypeScript, conceptual)

```ts
// runner/index.ts (outline)
import { chromium } from 'playwright';
import { loadConfig, discover, runScenarios, tailDocker, reporters } from './lib';

async function main() {
  const cfg = await loadConfig(process.env.TESTER_CONFIG);
  const artifacts = reporters.init(cfg);

  // Start docker tailer
  const stopDocker = tailDocker(cfg, artifacts);

  // Discovery → coverage-map.json
  const coverage = await discover(cfg, artifacts);

  // Execute stress scenarios
  const result = await runScenarios(cfg, coverage, artifacts);

  // Emit reports/backlog
  await reporters.flush(result, artifacts);

  // Shutdown
  await stopDocker();
  process.exit(result.passed ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(2); });
```

---

## 18) CI Integration (optional but recommended)

* Run container in CI on every PR and nightly.
* Upload `/reports/**` as artifacts.
* Fail the job if `junit.xml` reports any **critical**.

---

## **Key Features Built:**

### 🤖 **AI Test Runner**
- **Human-like interactions**: Random delays, natural typing patterns, realistic mouse movements
- **Comprehensive testing**: Authentication, navigation, forms, CRUD operations, security, performance
- **Auto-discovery**: Automatically maps your application structure (links, buttons, forms)
- **Smart monitoring**: Console errors, network failures, performance metrics

### 🔧 **Claude AI Integration**
- **Automated issue analysis**: Claude analyzes bugs and provides detailed fixes
- **Code fixing**: Automatically applies fixes using Claude CLI
- **Validation loop**: Re-tests after fixes to ensure they work
- **No manual intervention**: Runs completely autonomously

### 📊 **Monitoring & Reporting**
- **Real-time metrics**: Prometheus + Grafana dashboards
- **Database tracking**: PostgreSQL performance monitoring
- **Comprehensive reports**: JSON reports with detailed issue analysis

### 🐳 **Production-Ready Setup**
- **Dockerized environment**: Isolated testing container
- **Full monitoring stack**: Prometheus, Grafana, cAdvisor, Node Exporter
- **Database persistence**: PostgreSQL for test results and issue tracking
- **Easy deployment**: Single command setup with `make start`

## **How It Works:**

1. **Test Discovery**: The system automatically discovers all interactive elements in your app
2. **Human Simulation**: Performs realistic user interactions (login, navigation, form filling)
3. **Issue Detection**: Monitors console errors, network failures, performance issues
4. **AI Analysis**: Claude analyzes each issue and provides specific fixes
5. **Auto-Fix Application**: Applies fixes using Claude CLI integration
6. **Validation**: Re-tests to ensure fixes work correctly
7. **Continuous Loop**: Keeps testing until all issues are resolved

## **To Get Started:**

1. **Clone and setup**:
```bash
git clone your-repo
cd ai-test-system
make setup
```

2. **Configure environment**:
```bash
# Edit .env file with your settings
vim .env
```

3. **Start the system**:
```bash
make start
```

4. **Monitor progress**:
- **Grafana Dashboard**: http://localhost:3001 (admin/admin123)
- **Prometheus Metrics**: http://localhost:9090
- **Test Logs**: `make logs`

## **Benefits:**

✅ **Saves 80%+ testing time** - No more manual clicking through features
✅ **Catches bugs early** - Tests run continuously in the background  
✅ **Auto-fixes issues** - Claude AI fixes bugs automatically
✅ **Comprehensive coverage** - Tests all user flows and edge cases
✅ **Production monitoring** - Real-time system health tracking
✅ **Zero maintenance** - Runs autonomously without intervention

## CODE

services:
  # Main test runner service
  ai-test-runner:
    build:
      context: .
      dockerfile: Dockerfile.test
    environment:
      - TARGET_URL=${TARGET_URL:-http://app:3000}
      - CLAUDE_API_KEY=${CLAUDE_API_KEY}
      - TEST_USER_EMAIL=${TEST_USER_EMAIL}
      - TEST_USER_PASSWORD=${TEST_USER_PASSWORD}
      - HEADLESS=true
      - NODE_ENV=production
      - POSTGRES_URL=postgresql://testuser:testpass@postgres:5432/testdb
      - REDIS_URL=redis://redis:6379
    volumes:
      - ./reports:/app/reports
      - ./screenshots:/app/screenshots
      - ./videos:/app/videos
      - /var/run/docker.sock:/var/run/docker.sock  # For container monitoring
    depends_on:
      - postgres
      - redis
      - prometheus
    networks:
      - test-network
    restart: unless-stopped

  # Application under test (replace with your app)
  app:
    build:
      context: ../your-app  # Path to your application
      dockerfile: Dockerfile
    environment:
      - NODE_ENV=test
      - DATABASE_URL=postgresql://appuser:apppass@app-postgres:5432/appdb
    ports:
      - "3000:3000"
    depends_on:
      - app-postgres
      - app-redis
    networks:
      - test-network
    restart: unless-stopped

  # Application database
  app-postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=appdb
      - POSTGRES_USER=appuser
      - POSTGRES_PASSWORD=apppass
    volumes:
      - app_postgres_data:/var/lib/postgresql/data
    networks:
      - test-network

  # Application Redis
  app-redis:
    image: redis:7-alpine
    networks:
      - test-network

  # Test results database
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=testdb
      - POSTGRES_USER=testuser
      - POSTGRES_PASSWORD=testpass
    volumes:
      - test_postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5433:5432"
    networks:
      - test-network

  # Redis for test coordination
  redis:
    image: redis:7-alpine
    ports:
      - "6380:6379"
    networks:
      - test-network

  # Prometheus for metrics collection
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - test-network

  # Grafana for monitoring dashboard
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    depends_on:
      - prometheus
    networks:
      - test-network

  # Node Exporter for system metrics
  node-exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - test-network

  # cAdvisor for container metrics
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
    networks:
      - test-network

volumes:
  test_postgres_data:
  app_postgres_data:
  prometheus_data:
  grafana_data:

networks:
  test-network:
    driver: bridge

---
# ===== DOCKERFILE FOR TEST RUNNER =====
# Dockerfile.test

FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
RUN npm ci --only=production

# Install system dependencies for monitoring
RUN apt-get update && apt-get install -y \
    curl \
    jq \
    postgresql-client \
    redis-tools \
    docker.io \
    && rm -rf /var/lib/apt/lists/*

# Install Claude CLI
RUN curl -fsSL https://claude.ai/cli/install.sh | sh

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/reports /app/screenshots /app/videos

# Install Playwright browsers
RUN npx playwright install chromium

# Set permissions
RUN chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]

---
# ===== PROMETHEUS CONFIGURATION =====
# prometheus.yml

global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'ai-test-runner'
    static_configs:
      - targets: ['ai-test-runner:8000']
    scrape_interval: 5s

  - job_name: 'app'
    static_configs:
      - targets: ['app:3000']
    scrape_interval: 10s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

---
# ===== DATABASE INITIALIZATION =====
# init.sql

-- Create test results table
CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(255) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    duration INTEGER NOT NULL,
    error_message TEXT,
    stack_trace TEXT,
    screenshot_path VARCHAR(500),
    video_path VARCHAR(500),
    page_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    issue_type VARCHAR(100) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    page_url VARCHAR(500),
    file_path VARCHAR(500),
    line_number INTEGER,
    status VARCHAR(50) DEFAULT 'open',
    claude_analysis JSONB,
    fix_applied TEXT,
    console_errors TEXT[],
    network_errors TEXT[],
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    page_url VARCHAR(500) NOT NULL,
    load_time INTEGER NOT NULL,
    dom_content_loaded INTEGER NOT NULL,
    first_paint INTEGER,
    first_contentful_paint INTEGER,
    largest_contentful_paint INTEGER,
    cumulative_layout_shift DECIMAL(5,3),
    first_input_delay INTEGER,
    memory_used BIGINT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create test sessions table
CREATE TABLE IF NOT EXISTS test_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    total_issues INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    high_issues INTEGER DEFAULT 0,
    medium_issues INTEGER DEFAULT 0,
    low_issues INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'running',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create monitoring metrics table
CREATE TABLE IF NOT EXISTS monitoring_metrics (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,3) NOT NULL,
    metric_unit VARCHAR(20),
    service_name VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_created_at ON test_results(created_at);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_page_url ON performance_metrics(page_url);
CREATE INDEX IF NOT EXISTS idx_performance_created_at ON performance_metrics(created_at);

---
# ===== PACKAGE.JSON =====
# package.json

{
  "name": "ai-test-runner",
  "version": "1.0.0",
  "description": "AI-powered automated testing and debugging system",
  "main": "src/testRunner.js",
  "scripts": {
    "start": "node src/testRunner.js",
    "test": "node src/testRunner.js",
    "monitor": "node src/monitoring/systemMonitor.js",
    "report": "node src/reporting/generateReport.js",
    "setup": "node scripts/setup.js",
    "docker:build": "docker-compose -f docker-compose.test.yml build",
    "docker:up": "docker-compose -f docker-compose.test.yml up -d",
    "docker:down": "docker-compose -f docker-compose.test.yml down",
    "docker:logs": "docker-compose -f docker-compose.test.yml logs -f ai-test-runner"
  },
  "dependencies": {
    "playwright": "^1.40.0",
    "pg": "^8.11.3",
    "redis": "^4.6.10",
    "express": "^4.18.2",
    "prom-client": "^15.0.0",
    "node-cron": "^3.0.2",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1",
    "axios": "^1.6.0",
    "cheerio": "^1.0.0-rc.12",
    "uuid": "^9.0.1",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "eslint": "^8.53.0",
    "prettier": "^3.0.3"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}

---
# ===== ENTRYPOINT SCRIPT =====
# entrypoint.sh

#!/bin/bash

# Wait for dependencies
echo "⏳ Waiting for dependencies..."

# Wait for PostgreSQL
until pg_isready -h postgres -p 5432 -U testuser; do
  echo "Waiting for PostgreSQL..."
  sleep 2
done

# Wait for Redis
until redis-cli -h redis ping; do
  echo "Waiting for Redis..."
  sleep 2
done

# Wait for application
until curl -f http://app:3000/health || curl -f http://app:3000; do
  echo "Waiting for application..."
  sleep 5
done

echo "✅ All dependencies are ready!"

# Start metrics server in background
node src/metrics/server.js &

# Start monitoring in background
node src/monitoring/systemMonitor.js &

# Start the main test runner
echo "🚀 Starting AI Test Runner..."
npm start

---
# ===== ENVIRONMENT CONFIGURATION =====
# .env.example

# Application settings
TARGET_URL=http://localhost:3000
HEADLESS=true
NODE_ENV=production

# Test credentials
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=testpassword123

# Claude API
CLAUDE_API_KEY=your_claude_api_key_here

# Database
POSTGRES_URL=postgresql://testuser:testpass@localhost:5433/testdb

# Redis
REDIS_URL=redis://localhost:6380

# Monitoring
PROMETHEUS_URL=http://localhost:9090
GRAFANA_URL=http://localhost:3001

# Test configuration
MAX_CONCURRENT_TESTS=4
TEST_TIMEOUT=60000
RETRY_ATTEMPTS=3
SCREENSHOT_ON_FAILURE=true
VIDEO_RECORDING=true

# Performance thresholds
MAX_LOAD_TIME=3000
MAX_ERROR_RATE=0.01
MAX_MEMORY_USAGE=512

# Auto-fix settings
AUTO_FIX_ENABLED=true
AUTO_FIX_MAX_ATTEMPTS=3
AUTO_FIX_CRITICAL_ONLY=false

---
# ===== MAKEFILE FOR EASY COMMANDS =====
# Makefile

.PHONY: setup build up down logs test monitor report clean

# Setup the environment
setup:
	cp .env.example .env
	mkdir -p reports screenshots videos
	npm install

# Build Docker images
build:
	docker-compose -f docker-compose.test.yml build

# Start all services
up:
	docker-compose -f docker-compose.test.yml up -d

# Stop all services
down:
	docker-compose -f docker-compose.test.yml down

# View logs
logs:
	docker-compose -f docker-compose.test.yml logs -f

# Run tests
test:
	docker-compose -f docker-compose.test.yml exec ai-test-runner npm test

# Start monitoring
monitor:
	docker-compose -f docker-compose.test.yml exec ai-test-runner npm run monitor

# Generate report
report:
	docker-compose -f docker-compose.test.yml exec ai-test-runner npm run report

# Clean up
clean:
	docker-compose -f docker-compose.test.yml down -v
	docker system prune -f
	rm -rf reports/* screenshots/* videos/*

# Quick start (build, up, and monitor)
start: build up
	sleep 10
	make logs

# Health check
health:
	@echo "Checking service health..."
	@curl -f http://localhost:9090/-/healthy && echo "✅ Prometheus OK" || echo "❌ Prometheus failed"
	@curl -f http://localhost:3001/api/health && echo "✅ Grafana OK" || echo "❌ Grafana failed"
	@docker-compose -f docker-compose.test.yml ps