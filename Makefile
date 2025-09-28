# AI Testing and Monitoring Stack - Makefile
# From docker_monitoring_setup.txt specification

.PHONY: setup build up down logs test monitor report clean

# Setup the environment
setup:
	cp .env.testing .env
	mkdir -p reports screenshots videos
	cd tester-dashboard && npm install

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
setup: ## Initial project setup with dependencies and environment
	@echo "🔧 Setting up OrçamentosOnline development environment..."
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "📄 Creating environment file from template..."; \
		cp .env.example $(ENV_FILE); \
		echo "⚠️  Please update $(ENV_FILE) with your configuration!"; \
	fi
	@echo "🐳 Pulling Docker images..."
	$(DOCKER_COMPOSE_DEV) pull
	@echo "📦 Building services..."
	$(DOCKER_COMPOSE_DEV) build
	@echo "🗄️  Setting up database..."
	@$(MAKE) db-setup
	@echo "✅ Setup complete! Run 'make start' to begin development."

check-env: ## Verify environment configuration
	@echo "🔍 Checking environment configuration..."
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "❌ Environment file $(ENV_FILE) not found!"; \
		echo "   Run 'make setup' or copy .env.example to $(ENV_FILE)"; \
		exit 1; \
	fi
	@echo "✅ Environment file found"

# ============================================================================
# DOCKER COMPOSE OPERATIONS
# ============================================================================
build: check-env ## Build all Docker images
	@echo "🏗️  Building Docker images..."
	$(DOCKER_COMPOSE_DEV) build --no-cache

rebuild: ## Rebuild images without cache
	@echo "🔄 Rebuilding Docker images from scratch..."
	$(DOCKER_COMPOSE_DEV) build --no-cache --pull

start: check-env ## Start development environment
	@echo "🚀 Starting OrçamentosOnline development environment..."
	$(DOCKER_COMPOSE_DEV) up -d
	@echo "⏳ Waiting for services to be ready..."
	@sleep 10
	@$(MAKE) status
	@echo ""
	@echo "🎉 Development environment is ready!"
	@echo "   Frontend: http://localhost:3001"
	@echo "   API:      http://localhost:3000/api/v1"
	@echo "   Adminer:  http://localhost:8080"
	@echo "   Redis:    http://localhost:8081"

stop: ## Stop all services
	@echo "🛑 Stopping all services..."
	$(DOCKER_COMPOSE_DEV) down

restart: ## Restart all services
	@echo "🔄 Restarting services..."
	$(DOCKER_COMPOSE_DEV) restart

status: ## Show status of all services
	@echo "📊 Service Status:"
	@$(DOCKER_COMPOSE_DEV) ps

# ============================================================================
# DATABASE OPERATIONS
# ============================================================================
db-setup: ## Initialize database with schema and seed data
	@echo "🗄️  Setting up database..."
	$(DOCKER_COMPOSE_DEV) up -d postgres
	@echo "⏳ Waiting for PostgreSQL to be ready..."
	@sleep 15
	@echo "📊 Running database migrations..."
	$(DOCKER_COMPOSE_DEV) exec api npm run migrate
	@echo "🌱 Seeding development data..."
	$(DOCKER_COMPOSE_DEV) exec api npm run seed

db-migrate: ## Run database migrations
	@echo "📊 Running database migrations..."
	$(DOCKER_COMPOSE_DEV) exec api npm run migrate

db-seed: ## Seed database with development data
	@echo "🌱 Seeding database with development data..."
	$(DOCKER_COMPOSE_DEV) exec api npm run seed

db-reset: ## Reset database (drop and recreate)
	@echo "⚠️  Resetting database..."
	@read -p "Are you sure you want to reset the database? [y/N] " -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		$(DOCKER_COMPOSE_DEV) exec postgres psql -U orcamentos_user -d postgres -c "DROP DATABASE IF EXISTS orcamentos_dev;"; \
		$(DOCKER_COMPOSE_DEV) exec postgres psql -U orcamentos_user -d postgres -c "CREATE DATABASE orcamentos_dev;"; \
		$(MAKE) db-migrate; \
		$(MAKE) db-seed; \
		echo "✅ Database reset complete"; \
	else \
		echo "❌ Database reset cancelled"; \
	fi

db-backup: ## Create database backup
	@echo "💾 Creating database backup..."
	@mkdir -p ./backups
	$(DOCKER_COMPOSE_DEV) exec postgres pg_dump -U orcamentos_user orcamentos_dev > ./backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup created in ./backups/"

db-shell: ## Open database shell
	@echo "🐘 Opening PostgreSQL shell..."
	$(DOCKER_COMPOSE_DEV) exec postgres psql -U orcamentos_user -d orcamentos_dev

# ============================================================================
# DEVELOPMENT TOOLS
# ============================================================================
logs: ## Show logs from all services
	$(DOCKER_COMPOSE_DEV) logs -f

logs-api: ## Show API service logs
	$(DOCKER_COMPOSE_DEV) logs -f api

logs-frontend: ## Show frontend service logs
	$(DOCKER_COMPOSE_DEV) logs -f frontend

logs-nginx: ## Show Nginx logs
	$(DOCKER_COMPOSE_DEV) logs -f nginx

shell-api: ## Open shell in API container
	$(DOCKER_COMPOSE_DEV) exec api /bin/bash

shell-frontend: ## Open shell in frontend container
	$(DOCKER_COMPOSE_DEV) exec frontend /bin/bash

shell-postgres: ## Open shell in PostgreSQL container
	$(DOCKER_COMPOSE_DEV) exec postgres /bin/bash

shell-redis: ## Open shell in Redis container
	$(DOCKER_COMPOSE_DEV) exec redis /bin/sh

# ============================================================================
# TESTING
# ============================================================================
test: ## Run all tests
	@echo "🧪 Running all tests..."
	$(DOCKER_COMPOSE_DEV) exec api npm test
	$(DOCKER_COMPOSE_DEV) exec frontend npm test

test-api: ## Run API tests only
	@echo "🧪 Running API tests..."
	$(DOCKER_COMPOSE_DEV) exec api npm test

test-frontend: ## Run frontend tests only
	@echo "🧪 Running frontend tests..."
	$(DOCKER_COMPOSE_DEV) exec frontend npm test

test-e2e: ## Run end-to-end tests
	@echo "🧪 Running end-to-end tests..."
	$(DOCKER_COMPOSE_DEV) exec frontend npm run test:e2e

test-coverage: ## Generate test coverage report
	@echo "📊 Generating test coverage report..."
	$(DOCKER_COMPOSE_DEV) exec api npm run test:coverage
	$(DOCKER_COMPOSE_DEV) exec frontend npm run test:coverage

# ============================================================================
# CODE QUALITY
# ============================================================================
lint: ## Run linting on all code
	@echo "🔍 Running code linting..."
	$(DOCKER_COMPOSE_DEV) exec api npm run lint
	$(DOCKER_COMPOSE_DEV) exec frontend npm run lint

lint-fix: ## Fix linting issues automatically
	@echo "🔧 Fixing linting issues..."
	$(DOCKER_COMPOSE_DEV) exec api npm run lint:fix
	$(DOCKER_COMPOSE_DEV) exec frontend npm run lint:fix

format: ## Format code with Prettier
	@echo "💅 Formatting code..."
	$(DOCKER_COMPOSE_DEV) exec api npm run format
	$(DOCKER_COMPOSE_DEV) exec frontend npm run format

type-check: ## Run TypeScript type checking
	@echo "🔍 Running type checks..."
	$(DOCKER_COMPOSE_DEV) exec api npm run type-check
	$(DOCKER_COMPOSE_DEV) exec frontend npm run type-check

# ============================================================================
# SECURITY
# ============================================================================
security: ## Run security audits
	@echo "🔒 Running security audits..."
	$(DOCKER_COMPOSE_DEV) exec api npm audit
	$(DOCKER_COMPOSE_DEV) exec frontend npm audit

security-fix: ## Fix security vulnerabilities
	@echo "🔧 Fixing security vulnerabilities..."
	$(DOCKER_COMPOSE_DEV) exec api npm audit fix
	$(DOCKER_COMPOSE_DEV) exec frontend npm audit fix

# ============================================================================
# CLEANUP
# ============================================================================
clean: ## Clean up containers, volumes, and images
	@echo "🧹 Cleaning up Docker resources..."
	$(DOCKER_COMPOSE_DEV) down -v --remove-orphans
	docker system prune -f
	docker volume prune -f

clean-all: ## Clean up everything including images
	@echo "🧹 Cleaning up all Docker resources..."
	$(DOCKER_COMPOSE_DEV) down -v --remove-orphans --rmi all
	docker system prune -af
	docker volume prune -f

# ============================================================================
# PRODUCTION OPERATIONS
# ============================================================================
prod-build: check-env ## Build production images
	@echo "🏭 Building production images..."
	$(DOCKER_COMPOSE_PROD) build --no-cache

prod-start: check-env ## Start production environment
	@echo "🚀 Starting production environment..."
	$(DOCKER_COMPOSE_PROD) up -d

prod-stop: ## Stop production environment
	@echo "🛑 Stopping production environment..."
	$(DOCKER_COMPOSE_PROD) down

prod-logs: ## Show production logs
	$(DOCKER_COMPOSE_PROD) logs -f

# ============================================================================
# MONITORING
# ============================================================================
monitoring-start: ## Start monitoring stack (Prometheus, Grafana)
	@echo "📊 Starting monitoring stack..."
	$(DOCKER_COMPOSE_DEV) --profile monitoring up -d

monitoring-stop: ## Stop monitoring stack
	@echo "📊 Stopping monitoring stack..."
	$(DOCKER_COMPOSE_DEV) --profile monitoring down

# ============================================================================
# UTILITIES
# ============================================================================
update: ## Update dependencies
	@echo "⬆️ Updating dependencies..."
	$(DOCKER_COMPOSE_DEV) exec api npm update
	$(DOCKER_COMPOSE_DEV) exec frontend npm update

health: ## Check health of all services
	@echo "🏥 Checking service health..."
	@curl -s http://localhost:3000/api/v1/health | jq . || echo "API not responding"
	@curl -s http://localhost:3001 > /dev/null && echo "Frontend: ✅ Healthy" || echo "Frontend: ❌ Not responding"
	@$(DOCKER_COMPOSE_DEV) exec postgres pg_isready -U orcamentos_user && echo "PostgreSQL: ✅ Healthy" || echo "PostgreSQL: ❌ Not responding"
	@$(DOCKER_COMPOSE_DEV) exec redis redis-cli ping && echo "Redis: ✅ Healthy" || echo "Redis: ❌ Not responding"

ps: ## Show running containers
	@docker ps --filter "name=$(PROJECT_NAME)"

images: ## List project images
	@docker images --filter "reference=*$(PROJECT_NAME)*"

# ============================================================================
# DOCUMENTATION
# ============================================================================
docs: ## Generate API documentation
	@echo "📚 Generating API documentation..."
	$(DOCKER_COMPOSE_DEV) exec api npm run docs:generate

docs-serve: ## Serve documentation locally
	@echo "📚 Serving documentation at http://localhost:3000/api/docs"
	@open http://localhost:3000/api/docs 2>/dev/null || echo "Open http://localhost:3000/api/docs in your browser"