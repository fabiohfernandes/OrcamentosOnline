#!/bin/bash

# COMPREHENSIVE AUTOMATED TESTING SYSTEM
# OrçamentosOnline - Real User Simulation with Continuous Testing Until 100%
# This script builds and runs the automated testing container that acts as a real user

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if containers are running
check_container_health() {
    local container_name=$1
    local max_attempts=30
    local attempt=1

    print_info "Checking health of $container_name..."

    while [ $attempt -le $max_attempts ]; do
        if docker ps --filter "name=$container_name" --filter "status=running" | grep -q "$container_name"; then
            local health=$(docker inspect --format='{{.State.Health.Status}}' "$container_name" 2>/dev/null || echo "no-health-check")

            if [ "$health" = "healthy" ] || [ "$health" = "no-health-check" ]; then
                print_success "$container_name is running and healthy"
                return 0
            fi
        fi

        print_info "Waiting for $container_name... (attempt $attempt/$max_attempts)"
        sleep 10
        attempt=$((attempt + 1))
    done

    print_error "$container_name failed to become healthy"
    return 1
}

# Function to wait for services to be ready
wait_for_services() {
    print_header "WAITING FOR CORE SERVICES TO BE READY"

    # Wait for database
    check_container_health "orcamentos-postgres"

    # Wait for API
    check_container_health "orcamentos-api"

    # Wait for frontend
    check_container_health "orcamentos-frontend"

    # Additional wait for API to be fully ready
    print_info "Testing API connectivity..."
    local max_attempts=20
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "http://localhost:3000/api/v1/health" > /dev/null 2>&1; then
            print_success "API is responding"
            break
        fi

        print_info "Waiting for API to respond... (attempt $attempt/$max_attempts)"
        sleep 5
        attempt=$((attempt + 1))
    done

    if [ $attempt -gt $max_attempts ]; then
        print_error "API failed to respond after $max_attempts attempts"
        return 1
    fi

    # Test frontend connectivity
    print_info "Testing frontend connectivity..."
    if curl -s -f "http://localhost:3001" > /dev/null 2>&1; then
        print_success "Frontend is responding"
    else
        print_warning "Frontend may not be fully ready, but continuing..."
    fi

    print_success "All core services are ready!"
}

# Function to build automated testing container
build_testing_container() {
    print_header "BUILDING AUTOMATED TESTING CONTAINER"

    print_info "Building the automated testing container with Playwright and all agents..."

    # Build the container
    if docker-compose build automated-testing; then
        print_success "Automated testing container built successfully"
    else
        print_error "Failed to build automated testing container"
        return 1
    fi
}

# Function to run automated testing
run_automated_testing() {
    print_header "STARTING COMPREHENSIVE AUTOMATED TESTING"

    print_info "This will:"
    echo "  ✅ Act as a real user using all features massively"
    echo "  ✅ Simulate stress tests multiple times"
    echo "  ✅ Monitor Chrome console for errors"
    echo "  ✅ Monitor Docker logs for issues"
    echo "  ✅ Save detailed logs and analysis"
    echo "  ✅ Delete test data automatically"
    echo "  ✅ Run continuously until 100% success rate"
    echo "  ✅ Generate comprehensive reports"

    print_info "Starting automated testing container..."

    # Stop any existing testing container
    docker-compose --profile testing down automated-testing 2>/dev/null || true

    # Run the testing container
    print_info "Launching automated testing system..."

    # Start with logging
    docker-compose --profile testing up automated-testing 2>&1 | tee "automated_testing_$(date +%Y%m%d_%H%M%S).log"

    local exit_code=${PIPESTATUS[0]}

    if [ $exit_code -eq 0 ]; then
        print_success "🎉 AUTOMATED TESTING COMPLETED SUCCESSFULLY!"
        print_success "🎯 TARGET ACHIEVED: 100% SUCCESS RATE!"

        # Show final results
        if [ -f "automated-testing/reports/final_report.md" ]; then
            print_header "FINAL TESTING REPORT"
            cat "automated-testing/reports/final_report.md"
        fi

    else
        print_error "❌ Automated testing failed or was interrupted"
        print_info "Check the logs for details"

        # Show any available reports
        if [ -f "automated-testing/reports/final_report.md" ]; then
            print_header "PARTIAL TESTING REPORT"
            cat "automated-testing/reports/final_report.md"
        fi

        return $exit_code
    fi
}

# Function to show testing results
show_results() {
    print_header "TESTING RESULTS AND REPORTS"

    # Check for reports directory
    if [ -d "automated-testing/reports" ]; then
        print_info "Available reports:"
        ls -la "automated-testing/reports/"

        # Show executive summary if available
        if [ -f "automated-testing/reports/executive_summary.json" ]; then
            print_info "Executive Summary:"
            cat "automated-testing/reports/executive_summary.json" | jq '.' 2>/dev/null || cat "automated-testing/reports/executive_summary.json"
        fi

        # Show final report if available
        if [ -f "automated-testing/reports/final_report.md" ]; then
            print_info "Full report available at: automated-testing/reports/final_report.md"
        fi
    else
        print_warning "No reports directory found"
    fi

    # Check for logs
    if [ -d "automated-testing/logs" ]; then
        print_info "Available logs:"
        ls -la "automated-testing/logs/"
    fi
}

# Function to cleanup
cleanup() {
    print_header "CLEANING UP"

    print_info "Stopping automated testing container..."
    docker-compose --profile testing down automated-testing 2>/dev/null || true

    print_success "Cleanup completed"
}

# Main execution
main() {
    print_header "ORCAMENTOS ONLINE - COMPREHENSIVE AUTOMATED TESTING SYSTEM"
    print_info "This system will test EVERYTHING until 100% success rate is achieved"
    print_info "Starting at: $(date)"

    # Trap to ensure cleanup on exit
    trap cleanup EXIT

    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi

    # Check if docker-compose is available
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_error "docker-compose is not installed or not in PATH"
        exit 1
    fi

    # Build testing container
    if ! build_testing_container; then
        print_error "Failed to build testing container"
        exit 1
    fi

    # Wait for core services
    if ! wait_for_services; then
        print_error "Core services are not ready"
        exit 1
    fi

    # Run automated testing
    if run_automated_testing; then
        print_success "🎉 COMPREHENSIVE TESTING COMPLETED SUCCESSFULLY!"
    else
        print_error "❌ Testing failed or incomplete"
        exit 1
    fi

    # Show results
    show_results

    print_header "TESTING SESSION COMPLETED"
    print_info "Completed at: $(date)"
}

# Check for help flag
if [[ "$1" == "--help" || "$1" == "-h" ]]; then
    echo "COMPREHENSIVE AUTOMATED TESTING SYSTEM"
    echo ""
    echo "This script builds and runs the automated testing container that:"
    echo "  - Acts as a real user using all features massively"
    echo "  - Simulates stress tests multiple times"
    echo "  - Monitors Chrome console and Docker logs for errors"
    echo "  - Saves detailed logs and analysis"
    echo "  - Deletes test data automatically"
    echo "  - Runs continuously until 100% success rate"
    echo "  - Generates comprehensive reports"
    echo ""
    echo "Usage: $0 [--help]"
    echo ""
    echo "The system will run until it achieves 100% success rate or"
    echo "reaches the maximum number of iterations (1000)."
    exit 0
fi

# Run main function
main "$@"