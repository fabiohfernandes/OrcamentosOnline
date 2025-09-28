#!/bin/bash

# ENABLE CLAUDE-TESTER INTEGRATION AND START AUTO-TESTING
# This script fully integrates Claude with TESTER for autonomous testing

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}================================================================${NC}"
    echo -e "${PURPLE} $1${NC}"
    echo -e "${PURPLE}================================================================${NC}"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header "CLAUDE-TESTER AUTONOMOUS INTEGRATION"

print_info "This will enable Claude to:"
echo "  🤖 Automatically analyze test results"
echo "  🔧 Fix issues without asking permission"
echo "  🔄 Re-test after applying fixes"
echo "  📊 Generate comprehensive reports"
echo "  💾 Save all analysis and fix logs"
echo "  🎯 Continue until 100% success rate"
echo ""

# Check if TESTER dashboard is running
if ! curl -s http://localhost:8888/api/status > /dev/null 2>&1; then
    print_error "TESTER dashboard is not running on port 8888"
    print_info "Starting TESTER dashboard first..."
    ./start_tester_dashboard.sh
    sleep 5
fi

print_success "TESTER dashboard is running"

# Set project name
print_info "Setting project name to 'OrçamentosOnline'..."
curl -s -X POST http://localhost:8888/api/project/set \
    -H "Content-Type: application/json" \
    -d '{"projectName":"OrçamentosOnline"}' > /dev/null

# Enable Claude integration with full permissions
print_info "Enabling Claude integration with auto-mode..."
curl -s -X POST http://localhost:8888/api/claude/enable \
    -H "Content-Type: application/json" \
    -d '{
        "options": {
            "enabled": true,
            "autoMode": true,
            "autoFix": true,
            "autoTest": true,
            "autoAnalyze": true,
            "autoCommit": false,
            "maxIterations": 50
        }
    }' > /dev/null

print_success "Claude integration enabled with full autonomy"

# Enable all auto options for TESTER
print_info "Configuring TESTER auto-options..."
curl -s -X POST http://localhost:8888/api/options/update \
    -H "Content-Type: application/json" \
    -d '{
        "options": {
            "autoRetry": true,
            "autoFix": true,
            "autoRefreshScope": true,
            "autoRestartContainers": true
        }
    }' > /dev/null

# Configure service monitoring
print_info "Enabling all service monitoring..."
curl -s -X POST http://localhost:8888/api/ports/update \
    -H "Content-Type: application/json" \
    -d '{
        "ports": {
            "postgres": {"enabled": true},
            "redis": {"enabled": true},
            "frontend": {"enabled": true},
            "backend": {"enabled": true},
            "nginx": {"enabled": false}
        }
    }' > /dev/null

# Set test iterations
print_info "Setting test iterations to 20 per feature..."
curl -s -X POST http://localhost:8888/api/iterations/set \
    -H "Content-Type: application/json" \
    -d '{"iterations": 20}' > /dev/null

print_success "All configurations applied"

print_header "STARTING AUTONOMOUS TESTING CYCLE"

print_info "Claude will now:"
echo "  1. 🔍 Monitor TESTER for results"
echo "  2. 📊 Analyze any failures automatically"
echo "  3. 🔧 Apply fixes without permission"
echo "  4. 🔄 Trigger re-testing"
echo "  5. 📈 Track progress until 100%"
echo "  6. 💾 Save all reports and logs"
echo ""

print_warning "IMPORTANT: Claude has FULL AUTONOMY to:"
echo "  - Restart Docker services"
echo "  - Modify configuration files"
echo "  - Fix CORS issues"
echo "  - Update API endpoints"
echo "  - Apply database fixes"
echo "  - Re-run tests indefinitely"
echo ""

read -p "Continue with autonomous testing? [Y/n]: " confirm
if [[ $confirm =~ ^[Nn]$ ]]; then
    print_info "Autonomous testing cancelled"
    exit 0
fi

# Start the testing
print_info "Starting initial test cycle..."
test_response=$(curl -s -X POST http://localhost:8888/api/test/start \
    -H "Content-Type: application/json")

if echo "$test_response" | grep -q '"success":true'; then
    print_success "🚀 AUTONOMOUS TESTING STARTED!"
else
    print_error "Failed to start testing"
    echo "$test_response"
    exit 1
fi

print_header "AUTONOMOUS CYCLE ACTIVE"

print_success "✅ Claude-TESTER integration is now fully active!"
print_info "🌐 Monitor progress at: http://localhost:8888"
print_info "🤖 Claude will work autonomously until 100% success"
print_info "📊 All reports will be saved to: tester-dashboard/reports/claude/"

echo ""
print_info "The autonomous cycle will:"
echo "  🔄 Test → Analyze → Fix → Re-test"
echo "  📈 Continue until 100% success rate"
echo "  🛠️ Apply fixes automatically"
echo "  📋 Generate detailed reports"
echo "  🎯 Never stop until perfect"
echo ""

print_success "🎉 AUTONOMOUS TESTING IN PROGRESS!"
print_info "Open http://localhost:8888 to watch Claude work!"

# Optional: Monitor the cycle
read -p "Monitor the testing cycle in real-time? [Y/n]: " monitor
if [[ ! $monitor =~ ^[Nn]$ ]]; then
    print_info "Monitoring autonomous testing cycle..."
    print_info "Press Ctrl+C to stop monitoring (testing will continue)"

    while true; do
        status=$(curl -s http://localhost:8888/api/status)
        success_rate=$(echo "$status" | grep -o '"successRate":[0-9]*' | cut -d':' -f2)
        iteration=$(echo "$status" | grep -o '"currentIteration":[0-9]*' | cut -d':' -f2)
        is_running=$(echo "$status" | grep -o '"isRunning":[a-z]*' | cut -d':' -f2)

        if [ "$is_running" = "true" ]; then
            print_info "🤖 Claude Working - Iteration: $iteration, Success Rate: $success_rate%"
        else
            if [ "$success_rate" = "100" ]; then
                print_success "🎉 AUTONOMOUS TESTING COMPLETED - 100% SUCCESS ACHIEVED!"
                break
            else
                print_warning "⏸️ Testing paused - Success Rate: $success_rate%"
            fi
        fi

        sleep 10
    done
fi

print_header "AUTONOMOUS TESTING CYCLE COMPLETE"
print_success "Claude-TESTER integration working autonomously!"
print_info "Dashboard: http://localhost:8888"