#!/bin/bash

# TESTER Agent Dashboard Startup Script
# Starts the comprehensive testing dashboard on port 8888

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

print_header "TESTER AGENT DASHBOARD STARTUP"

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

print_info "Starting TESTER Agent Dashboard..."

# Method 1: Try Docker Compose with dashboard profile
if [ -f "docker-compose.yml" ] && grep -q "tester-dashboard" docker-compose.yml; then
    print_info "Starting with Docker Compose..."
    docker-compose --profile dashboard up -d tester-dashboard

    if [ $? -eq 0 ]; then
        print_success "TESTER Dashboard started with Docker Compose"
        print_success "Dashboard available at: http://localhost:8888"
        print_info "To view logs: docker-compose --profile dashboard logs -f tester-dashboard"
        exit 0
    fi
fi

# Method 2: Try standalone Docker run
if [ -d "tester-dashboard" ]; then
    print_info "Starting standalone container..."

    cd tester-dashboard

    # Build if needed
    if ! docker images | grep -q "tester-dashboard"; then
        print_info "Building TESTER Dashboard container..."
        docker build -t tester-dashboard .
    fi

    # Stop existing container if running
    docker stop orcamentos-tester-dashboard 2>/dev/null || true
    docker rm orcamentos-tester-dashboard 2>/dev/null || true

    # Run the container
    docker run -d \
        --name orcamentos-tester-dashboard \
        -p 8888:8888 \
        -v "$(pwd):/app" \
        -v /var/run/docker.sock:/var/run/docker.sock:ro \
        -e NODE_ENV=production \
        -e TESTER_PORT=8888 \
        -e PROJECT_NAME=OrçamentosOnline \
        tester-dashboard

    if [ $? -eq 0 ]; then
        print_success "TESTER Dashboard started in standalone mode"
        print_success "Dashboard available at: http://localhost:8888"
        print_info "To view logs: docker logs -f orcamentos-tester-dashboard"
        exit 0
    fi
fi

# Method 3: Try npm start (if Node.js is available)
if [ -d "tester-dashboard" ] && [ -f "tester-dashboard/package.json" ]; then
    print_info "Starting with npm..."

    cd tester-dashboard

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        print_info "Installing dependencies..."
        npm install
    fi

    # Start the server
    print_info "Starting TESTER Dashboard with Node.js..."
    npm start &

    # Give it time to start
    sleep 3

    # Check if it's responding
    if curl -s http://localhost:8888 > /dev/null; then
        print_success "TESTER Dashboard started with npm"
        print_success "Dashboard available at: http://localhost:8888"
        print_info "Dashboard is running in the background"
        exit 0
    fi
fi

# If all methods fail
print_error "Failed to start TESTER Dashboard"
print_info "Please try one of these methods manually:"
echo ""
echo "Method 1 - Docker Compose:"
echo "  docker-compose --profile dashboard up -d tester-dashboard"
echo ""
echo "Method 2 - Standalone Docker:"
echo "  cd tester-dashboard"
echo "  docker build -t tester-dashboard ."
echo "  docker run -d -p 8888:8888 --name tester-dashboard tester-dashboard"
echo ""
echo "Method 3 - Node.js:"
echo "  cd tester-dashboard"
echo "  npm install"
echo "  npm start"
echo ""
print_warning "Dashboard should be available at: http://localhost:8888"

exit 1