#!/bin/bash

# OrçamentosOnline TestSuite - Comprehensive Testing Automation
# Professional start-test script with Claude integration

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
TESTSUITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$TESTSUITE_DIR")"
TARGET_URL="${TARGET_URL:-http://localhost:3001}"
DASHBOARD_URL="http://localhost:8888"
LOG_DIR="$PROJECT_DIR/OrçamentosOnlineTestSuite/logs"

echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}   OrçamentosOnline TestSuite - Professional Testing Automation  ${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "${CYAN}▶ $1${NC}"
    echo -e "${BLUE}  └─ $2${NC}"
}

# Function to check if a service is running
check_service() {
    local service_name=$1
    local url=$2
    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo -e "  ${GREEN}✅ $service_name is running${NC}"
            return 0
        fi
        echo -e "  ${YELLOW}⏳ Waiting for $service_name... (attempt $attempt/$max_attempts)${NC}"
        sleep 2
        ((attempt++))
    done

    echo -e "  ${RED}❌ $service_name failed to start after $max_attempts attempts${NC}"
    return 1
}

# Function to open browser
open_browser() {
    local url=$1
    echo -e "  ${BLUE}🌐 Opening browser: $url${NC}"

    # Detect OS and open browser
    if command -v cmd.exe &> /dev/null; then
        # Windows (WSL or Git Bash)
        cmd.exe /c start "$url" 2>/dev/null || true
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$url" 2>/dev/null || true
    elif command -v xdg-open &> /dev/null; then
        # Linux
        xdg-open "$url" 2>/dev/null || true
    else
        echo -e "  ${YELLOW}⚠️  Please manually open: $url${NC}"
    fi
}

# Step 1: Feature Discovery and Testing Scope Update
print_section "Step 1: Feature Discovery & Testing Scope Update" "Reviewing application features to maintain updated testing scope"

cd "$TESTSUITE_DIR"

# Check if main application is running
if ! curl -s "$TARGET_URL" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Main application not detected at $TARGET_URL${NC}"
    echo -e "${BLUE}📋 Recommended: Start your main application first${NC}"
    echo -e "${BLUE}   Example: cd $PROJECT_DIR && docker-compose up -d${NC}"
    echo ""
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}❌ Testing cancelled${NC}"
        exit 1
    fi
fi

# Step 2: Start TestSuite Infrastructure
print_section "Step 2: TestSuite Infrastructure Startup" "Starting Docker containers and services"

echo -e "  ${BLUE}🐳 Starting TestSuite containers...${NC}"
docker-compose down > /dev/null 2>&1 || true
docker-compose up -d --build

# Wait for services to be ready
echo -e "  ${BLUE}⏳ Waiting for services to initialize...${NC}"
sleep 5

# Check critical services - PostgreSQL (using proper database connection)
echo -e "  ${YELLOW}⏳ Checking PostgreSQL...${NC}"
attempt=1
max_attempts=30
while [ $attempt -le $max_attempts ]; do
    if docker-compose exec -T postgres pg_isready -h localhost -U testeruser > /dev/null 2>&1; then
        echo -e "  ${GREEN}✅ PostgreSQL is running${NC}"
        break
    fi
    echo -e "  ${YELLOW}⏳ Waiting for PostgreSQL... (attempt $attempt/$max_attempts)${NC}"
    sleep 2
    ((attempt++))
    if [ $attempt -gt $max_attempts ]; then
        echo -e "${RED}❌ Database failed to start. Check docker-compose logs${NC}"
        exit 1
    fi
done

check_service "TestSuite Dashboard" "$DASHBOARD_URL" || {
    echo -e "${RED}❌ TestSuite dashboard failed to start${NC}"
    exit 1
}

# Step 3: Initialize Activity Logging
print_section "Step 3: Activity Logging Initialization" "Setting up real-time logging for Claude integration"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

echo -e "  ${GREEN}✅ Activity logging initialized${NC}"
echo -e "  ${BLUE}📂 Log directory: $LOG_DIR${NC}"

# Step 4: Claude Monitoring & Auto-Fixing Integration
print_section "Step 4: Claude Integration Setup" "Enabling autonomous monitoring and auto-fixing"

# Create Claude monitoring signal
cat > "$LOG_DIR/claude-monitoring-enabled.signal" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "signalType": "claude-monitoring-enabled",
  "project": "OrçamentosOnline",
  "pid": $$,
  "message": "Claude autonomous monitoring and auto-fixing enabled"
}
EOF

echo -e "  ${GREEN}✅ Claude monitoring signal created${NC}"
echo -e "  ${BLUE}🤖 Claude will automatically:${NC}"
echo -e "  ${BLUE}   • Monitor test results in real-time${NC}"
echo -e "  ${BLUE}   • Analyze failures and identify root causes${NC}"
echo -e "  ${BLUE}   • Apply fixes automatically when possible${NC}"
echo -e "  ${BLUE}   • Generate recommendations for complex issues${NC}"

# Step 5: Start Testing Process
print_section "Step 5: Testing Process Initialization" "Starting comprehensive feature testing"

# Wait for dashboard to be fully ready
sleep 3

# Start a default test session
echo -e "  ${BLUE}🚀 Starting initial test session...${NC}"
curl -X POST "$DASHBOARD_URL/api/session/start" \
    -H "Content-Type: application/json" \
    -d "{
        \"virtualUsers\": 3,
        \"durationMinutes\": 0,
        \"targetUrl\": \"$TARGET_URL\"
    }" \
    -s > /dev/null || {
    echo -e "  ${YELLOW}⚠️  Could not start automatic test session${NC}"
    echo -e "  ${BLUE}📋 You can start testing manually from the dashboard${NC}"
}

echo -e "  ${GREEN}✅ Testing process initialized${NC}"

# Step 6: Launch Dashboard UI
print_section "Step 6: Dashboard UI Launch" "Opening TestSuite dashboard in browser"

open_browser "$DASHBOARD_URL"

# Final Status Summary
echo ""
echo -e "${GREEN}🎉 TestSuite Successfully Started!${NC}"
echo ""
echo -e "${CYAN}📊 Dashboard:${NC} $DASHBOARD_URL"
echo -e "${CYAN}🎯 Target App:${NC} $TARGET_URL"
echo -e "${CYAN}📂 Logs:${NC} $LOG_DIR"
echo -e "${CYAN}🤖 Claude:${NC} Monitoring enabled for auto-fixing"
echo ""
echo -e "${BLUE}📋 What's Running:${NC}"
echo -e "  ${GREEN}✅ TestSuite containers (PostgreSQL, Redis, Prometheus, Grafana)${NC}"
echo -e "  ${GREEN}✅ Real-time activity logging${NC}"
echo -e "  ${GREEN}✅ Claude monitoring and auto-fixing${NC}"
echo -e "  ${GREEN}✅ Dashboard UI (should open in browser)${NC}"
echo ""
echo -e "${YELLOW}💡 Next Steps:${NC}"
echo -e "  • Review the dashboard to monitor test progress"
echo -e "  • Check logs for Claude analysis and recommendations"
echo -e "  • Use ./stop-test.sh to cleanly stop all testing"
echo ""
echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"

# Keep the script running to maintain the session
echo -e "${BLUE}🔄 TestSuite is now running. Press Ctrl+C to stop, or use ./stop-test.sh${NC}"

# Trap Ctrl+C to run stop script
trap 'echo -e "\n${YELLOW}🛑 Stopping TestSuite...${NC}"; ./stop-test.sh; exit 0' INT

# Wait indefinitely or until stopped
while true; do
    sleep 10
    # Check if containers are still running
    if ! docker-compose ps --services --filter "status=running" | grep -q "tester"; then
        echo -e "${RED}❌ TestSuite containers have stopped${NC}"
        break
    fi
done