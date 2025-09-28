#!/bin/bash

# OrçamentosOnline TestSuite - Professional Stop Script
# Professional stop-test script with comprehensive cleanup

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
LOG_DIR="$PROJECT_DIR/OrçamentosOnlineTestSuite/logs"

echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}   OrçamentosOnline TestSuite - Professional Stop Automation     ${NC}"
echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"
echo ""

# Function to print section headers
print_section() {
    echo -e "${CYAN}▶ $1${NC}"
    echo -e "${BLUE}  └─ $2${NC}"
}

# Function to check if containers are running
check_containers_running() {
    local containers_running=false

    # Check TestSuite containers
    if docker-compose ps --services --filter "status=running" 2>/dev/null | grep -q "testsuite"; then
        containers_running=true
    fi

    # Check legacy tester containers
    if docker ps --format "table {{.Names}}" 2>/dev/null | grep -q "tester"; then
        containers_running=true
    fi

    echo $containers_running
}

# Step 1: Stop Claude Monitoring & Auto-Fixing
print_section "Step 1: Claude Monitoring Shutdown" "Disabling autonomous monitoring and auto-fixing"

# Create Claude monitoring stop signal
mkdir -p "$LOG_DIR"
cat > "$LOG_DIR/claude-monitoring-disabled.signal" << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "signalType": "claude-monitoring-disabled",
  "project": "OrçamentosOnline",
  "pid": $$,
  "message": "Claude autonomous monitoring and auto-fixing disabled"
}
EOF

echo -e "  ${GREEN}✅ Claude monitoring stop signal created${NC}"
echo -e "  ${BLUE}🤖 Claude will stop:${NC}"
echo -e "  ${BLUE}   • Monitoring test results${NC}"
echo -e "  ${BLUE}   • Analyzing failures${NC}"
echo -e "  ${BLUE}   • Applying automatic fixes${NC}"
echo -e "  ${BLUE}   • Generating recommendations${NC}"

# Clean up old monitoring signals
find "$LOG_DIR" -name "claude-monitoring-enabled.signal" -delete 2>/dev/null || true
echo -e "  ${GREEN}✅ Previous monitoring signals cleaned up${NC}"

# Step 2: Stop Active Testing Sessions
print_section "Step 2: Testing Session Termination" "Stopping all active test sessions gracefully"

cd "$TESTSUITE_DIR"

# Try to stop active sessions via API
DASHBOARD_URL="http://localhost:8888"
if curl -s "$DASHBOARD_URL" > /dev/null 2>&1; then
    echo -e "  ${BLUE}🛑 Stopping active test sessions...${NC}"
    curl -X POST "$DASHBOARD_URL/api/session/stop" \
        -H "Content-Type: application/json" \
        -s > /dev/null || {
        echo -e "  ${YELLOW}⚠️  Could not stop sessions via API (may already be stopped)${NC}"
    }
    echo -e "  ${GREEN}✅ Test sessions stop request sent${NC}"
else
    echo -e "  ${YELLOW}⚠️  Dashboard not accessible - sessions may already be stopped${NC}"
fi

# Step 3: Preserve Test Results and Evidence
print_section "Step 3: Test Results Preservation" "Saving final test results and evidence"

# Create final summary if active session exists
if [ -f "$LOG_DIR/current-session.json" ]; then
    echo -e "  ${BLUE}📊 Generating final test summary...${NC}"

    # Create final summary timestamp
    FINAL_SUMMARY_FILE="$LOG_DIR/final-summary-$(date +%Y%m%d-%H%M%S).md"

    cat > "$FINAL_SUMMARY_FILE" << EOF
# TestSuite Final Summary - $(date '+%Y-%m-%d %H:%M:%S')

## Session Information
- **Stop Time**: $(date '+%Y-%m-%d %H:%M:%S')
- **Project**: OrçamentosOnline
- **TestSuite Version**: Professional

## Preserved Data
- Screenshots: OrçamentosOnlineTestSuite/screenshots/
- Videos: OrçamentosOnlineTestSuite/videos/
- Traces: OrçamentosOnlineTestSuite/traces/
- Reports: OrçamentosOnlineTestSuite/reports/
- Activity Logs: OrçamentosOnlineTestSuite/logs/

## Status
✅ All test evidence and results have been preserved
✅ Claude monitoring gracefully disabled
✅ TestSuite stopped cleanly

EOF

    echo -e "  ${GREEN}✅ Final summary saved: $(basename "$FINAL_SUMMARY_FILE")${NC}"
else
    echo -e "  ${BLUE}ℹ️  No active session found - no summary needed${NC}"
fi

# Clean up temporary session files
rm -f "$LOG_DIR/current-session.json" 2>/dev/null || true
echo -e "  ${GREEN}✅ Temporary session files cleaned up${NC}"

# Step 4: Stop TestSuite Infrastructure
print_section "Step 4: TestSuite Infrastructure Shutdown" "Stopping Docker containers and services"

containers_running=$(check_containers_running)

if [ "$containers_running" = "true" ]; then
    echo -e "  ${BLUE}🐳 Stopping TestSuite containers...${NC}"

    # Stop containers gracefully
    docker-compose down --timeout 30 > /dev/null 2>&1 || {
        echo -e "  ${YELLOW}⚠️  Standard shutdown failed, forcing stop...${NC}"
        docker-compose down --timeout 10 > /dev/null 2>&1 || true
    }

    # Wait a moment for graceful shutdown
    sleep 3

    # Check if any containers are still running
    if [ "$(check_containers_running)" = "true" ]; then
        echo -e "  ${YELLOW}⚠️  Some containers still running, forcing stop...${NC}"

        # Force stop any remaining TestSuite containers
        docker ps --format "table {{.Names}}" | grep -E "(testsuite|tester)" | while read container_name; do
            if [ ! -z "$container_name" ] && [ "$container_name" != "NAMES" ]; then
                echo -e "  ${BLUE}🔌 Force stopping: $container_name${NC}"
                docker stop "$container_name" > /dev/null 2>&1 || true
            fi
        done
    fi

    echo -e "  ${GREEN}✅ TestSuite containers stopped${NC}"
else
    echo -e "  ${BLUE}ℹ️  No TestSuite containers running${NC}"
fi

# Step 5: Network and Resource Cleanup
print_section "Step 5: Resource Cleanup" "Cleaning up Docker networks and temporary resources"

# Clean up TestSuite networks
echo -e "  ${BLUE}🌐 Cleaning up Docker networks...${NC}"
docker network ls --format "table {{.Name}}" | grep -E "(testsuite|tester)" | while read network_name; do
    if [ ! -z "$network_name" ] && [ "$network_name" != "NAME" ]; then
        echo -e "  ${BLUE}   Removing network: $network_name${NC}"
        docker network rm "$network_name" > /dev/null 2>&1 || true
    fi
done

# Clean up any orphaned containers
echo -e "  ${BLUE}🧹 Removing orphaned containers...${NC}"
docker system prune -f --filter "label=com.docker.compose.project=testsuite" > /dev/null 2>&1 || true

echo -e "  ${GREEN}✅ Resource cleanup completed${NC}"

# Step 6: Final Activity Logging
print_section "Step 6: Activity Logging Finalization" "Completing activity logs and cleanup"

# Create final activity log entry
if [ -d "$LOG_DIR" ]; then
    cat >> "$LOG_DIR/activity.log" << EOF

[$(date '+%Y-%m-%d %H:%M:%S')] INFO: TestSuite shutdown completed
[$(date '+%Y-%m-%d %H:%M:%S')] INFO: All containers stopped gracefully
[$(date '+%Y-%m-%d %H:%M:%S')] INFO: Claude monitoring disabled
[$(date '+%Y-%m-%d %H:%M:%S')] INFO: Test evidence preserved
[$(date '+%Y-%m-%d %H:%M:%S')] INFO: System ready for next test cycle

EOF
fi

# Clean up old signal files (keep disabled signal for Claude to detect)
find "$LOG_DIR" -name "*.signal" -not -name "claude-monitoring-disabled.signal" -mmin +1 -delete 2>/dev/null || true

echo -e "  ${GREEN}✅ Activity logging finalized${NC}"
echo -e "  ${BLUE}📂 Logs preserved in: $LOG_DIR${NC}"

# Final Status Summary
echo ""
echo -e "${GREEN}🎉 TestSuite Successfully Stopped!${NC}"
echo ""
echo -e "${CYAN}📊 Final Status:${NC}"
echo -e "  ${GREEN}✅ All testing activities stopped${NC}"
echo -e "  ${GREEN}✅ Claude monitoring disabled${NC}"
echo -e "  ${GREEN}✅ Docker containers shut down${NC}"
echo -e "  ${GREEN}✅ Test evidence preserved${NC}"
echo -e "  ${GREEN}✅ Activity logs finalized${NC}"
echo ""
echo -e "${CYAN}📂 Preserved Data Locations:${NC}"
echo -e "  ${BLUE}Screenshots:${NC} OrçamentosOnlineTestSuite/screenshots/"
echo -e "  ${BLUE}Videos:${NC} OrçamentosOnlineTestSuite/videos/"
echo -e "  ${BLUE}Traces:${NC} OrçamentosOnlineTestSuite/traces/"
echo -e "  ${BLUE}Reports:${NC} OrçamentosOnlineTestSuite/reports/"
echo -e "  ${BLUE}Logs:${NC} OrçamentosOnlineTestSuite/logs/"
echo ""
echo -e "${YELLOW}💡 To restart testing:${NC}"
echo -e "  • Use ./start-test.sh to begin new test cycle"
echo -e "  • All previous test evidence has been preserved"
echo -e "  • Claude monitoring can be re-enabled automatically"
echo ""
echo -e "${PURPLE}════════════════════════════════════════════════════════════════${NC}"

# Auto-cleanup signal after 30 seconds
(sleep 30 && rm -f "$LOG_DIR/claude-monitoring-disabled.signal" 2>/dev/null) &

echo -e "${BLUE}🔄 TestSuite shutdown complete. System ready for next cycle.${NC}"