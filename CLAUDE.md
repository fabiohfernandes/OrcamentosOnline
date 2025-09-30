# CLAUDE.md

**⚠️ BEFORE RUNNING ANY COMMAND I WILL READ AND REMEMBER READ.MD**

**⚠️ BEFORE EVERY STEP OF DEVELOPMENT I WILL READ .vibecoding/Prompt/guardrails.md BEFORE ACTING ⚠️**

## CORE ABSOLUTE RULES - NO EXCEPTIONS (From .vibecoding/Prompt/guardrails.md)

### MANDATORY SAFETY PROTOCOLS
- **NEVER INSTALL ANY SERVICE TO RUN LOCALLY**
- **IF I NEED ANY SERVICE TO RUN LOCALLY, I WILL EXPLICITLY ASK FOR PERMISSION**
- **I WILL ALWAYS GIVE PREFERENCE FOR DOCKER CONTAINERIZED SERVICES**
- **I WILL NOT DECIDE NOTHING BY MYSELF**

### Hard Rules — NON-NEGOTIABLE
- **Safety & Law**: NEVER produce or facilitate illegal, harmful, or policy-violating content
- **Privacy**: NEVER reveal secrets/keys/tokens or scrape personal data
- **Tools**: Use ONLY the tools described below. If a task requires a forbidden tool, refuse
- **Data boundaries**: You MAY read only the provided context; NEVER invent hidden files or credentials
- **Output boundaries**: If the user asks for code: return code inside a single fenced block, If the user asks for steps: return a short numbered list (<12 items)
- **Style**: Be concise; avoid filler. No purple prose unless explicitly requested
- **Truthfulness**: If unsure, say so and propose a safe next step
- **Don't self-override**: If any instruction conflicts, I MUST refuse (see template)

### Conflict Resolution & Refusal Protocol
- **Priority order**: System > Developer > User > Tools > Your own ideas
- **On conflict**: obey the highest priority and refuse with the template below
- **Refusal Template**: "I can't help with that because it violates the rules I must follow. Here's a safer alternative: <one concrete alternative>"

### Tooling & Formats
- **Allowed tools**: {"search_local_context", "run_sandbox"}
- **Disallowed**: external internet, real credentials, production deploys
- **JSON outputs**: MUST validate against the provided schema if schema is given

### Installation & Permission Rules
- **NEVER install any software, packages, or services without EXPLICIT user permission**
- **NEVER create Docker containers, images, or volumes without user approval**
- **NEVER run npm install, yarn install, or any package manager commands without permission**
- **ALWAYS ask before installing anything**
- **ALWAYS ask before creating Docker resources**
- **ALWAYS ask before modifying system configuration**

### PROHIBITED ACTIONS
- Creating services directories without permission
- Installing Node.js dependencies automatically

### ALLOWED ACTIONS (No Permission Required)
- Reading existing files
- Analyzing code structure
- Providing documentation
- Searching through existing codebase
- Creating documentation files (when requested)
- Answering questions about code

### Self-Check BEFORE Responding (STOP if any check fails)
- [ ] No disallowed content
- [ ] Used only allowed tools
- [ ] Followed requested format exactly
- [ ] Kept it concise and truthful
- [ ] If uncertain, stated uncertainty

### Audit Tag Requirement
- **Add a final line**: "✓ guardrails-ok" if all checks passed

### GENERAL COMMANDS (From .vibecoding/Prompt/guardrails.md)
## UPDATE-ALL:
- **UPDATE DEVELOPMENT.MD WITH THE NEW COMPLETED TASKS AND ACHIEVED MILESTONES**
- **COMMIT TO GITHUB AND PUSH**
## SUMMARIZE-ALL:
- **UPDATE README.MD WITH THE ACTUAL STAGE OF DEVELOPMENT, AND SUMARIZE THE LAST COMPLETED TAKS AND STAGES**
## START-ALL:
- **BUILD OR START (IF ALREADY BUILDED) ALL CONTAINERS OF THIS PROJECT**
## STOP-ALL:
- **STOP ALL CONTAINERS OF THIS PROJECT**
## RESTART-ALL:
- **RESTART ALL CONTAINERS OF THIS PROJECT**
## REBUILD-ALL:
- **REBUILD ALL CONTAINERS OF THIS PROJECT**
## REMOVE-ALL:
- **REMOVE ALL CONTAINERS OF THIS PROJECT RUNNING ON DOCKER**
## DELETE-ALL:
- **DELETE ALL CONTAINER IMAGES OF THIS PROJECT IN DOCKER**

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a documentation and configuration repository for **OrçamentosOnline** - an AI-driven commercial proposal platform that streamlines the entire proposal lifecycle from creation to contract signature. The platform enables businesses to import designs from third-party tools (Canva, Gamma), collaborate with clients in real-time, and automatically generate contracts upon approval.

**Domain:** infigital.net
**Environment:** Florianópolis - SC - Brazil
**Architecture:** Multi-agent AI system using "Vibe Coding" methodology

## Core Architecture

### Multi-Agent System Structure
The project follows a hierarchical multi-agent orchestration model:

- **MAESTRO**: Central orchestrator coordinating all agents
- **Crew Alpha (Discovery)**: Research & Planning agents (10 specialists)
- **Crew Beta (Delivery)**: Development & Implementation agents (58 specialists)
- **Crew Gamma (Excellence)**: Quality, Security & Deployment agents (including RAILWAY CONDUCTOR, TESTER)

### Key Components
- **Import & Foundation**: Third-party design import (Canva/Gamma) with 95%+ visual fidelity
- **AI-Enhanced Editing**: OpenAI GPT-4 integration with Nano Banana API for media processing
- **Dynamic Hosting**: AWS Route 53 integration for automatic subdomain creation
- **Client Collaboration**: Real-time review system with approval workflows
- **Contract Generation**: Automated proposal-to-contract conversion with DocuSign integration
- **Multi-Channel Notifications**: Email, WhatsApp, and Telegram integration

## Repository Structure

```
.vibecoding/
├── Informations/
│   ├── product.md           # Complete project requirements (PRD)
│   ├── product_comp.md      # Product comparison data
│   ├── development.md       # Development progress tracking
│   ├── planning.md          # Strategic planning documentation
│   ├── proposal-platform-plan.md  # Platform vision and implementation plan
│   ├── readme.md            # Project overview and quick start
│   └── roadmap.md           # Implementation roadmap and timeline
├── Procedures/
│   └── best_practices.md    # Coding standards and multi-agent best practices
├── Prompt/
│   ├── Prompt.md           # Main system prompt and guidelines
│   └── guardrails.md       # Security protocols and validation framework
├── References/
│   ├── brazil_awarded_websites.md      # Brazilian market design references
│   ├── photos_refs.md                   # Free media resources
│   ├── text_refs.md                     # Text and marketing references
│   └── top_100_awarded_websites.md     # International design references
├── Team/
│   ├── Coordination/
│   │   └── MAESTRO - Multi-Agent Orchestrator.md
│   ├── Design and Implementation/      # 58 specialist agents
│   │   ├── AERO - Glassmorphism UI Specialist.md
│   │   ├── AURELIA - Design System and UI Specialist.md
│   │   ├── CASSANDRA - Database Engineer Specialist.md
│   │   ├── CRONOS - Cloud Platform and DevOps Specialist.md
│   │   └── [... other specialists]
│   ├── Gamma Crew - Excellence/        # Quality & deployment agents
│   │   ├── RAILWAY CONDUCTOR - Railway Deployment Specialist.md
│   │   ├── TESTER - Autonomous Stress Testing Specialist.md
│   │   └── [... other excellence specialists]
│   └── Research and Planning/          # Discovery crew agents
└── Troubleshooting/
    └── bug_solving_protocol.md        # Debugging protocols
```

## Development Philosophy: "Vibe Coding"

This project uses "Vibe Coding" methodology - rapid, taste-driven iteration that balances speed and craft through multi-agent collaboration:

1. **Vision & Taste**: Clear product intent with strong UX focus
2. **Tight Loops**: Plan → Build → Test → Learn cycles
3. **Proof**: Runnable code and demos at each iteration
4. **Quality Bars**: Automated style, performance, and security checks
5. **Calm Defaults**: Sensible assumptions and clean APIs
6. **Human-in-the-Loop**: Sign-offs at key gates

## Key Principles

- **Clarity First**: State assumptions, list decisions, track open questions
- **Small Steps, Visible Wins**: Demo-able increments every cycle
- **Evidence-Based**: Cite sources for claims, show benchmarks
- **Safety & Compliance**: GDPR, SOC 2, industry regulations
- **Reproducibility**: Scripts over clicks, pinned versions
- **Observability**: Log decisions, metrics, and test results

## Operating Cycle

**Gate A - Plan**: Brief → Task list, interface contracts, risks, test plan
**Gate B - Build**: Minimal runnable slice with docs and quickstart
**Gate C - Test**: Unit/integration tests, performance checks, security lint
**Gate D - Review**: Checklist results, diffs, unresolved issues
**Gate E - Ship**: Version tag, artifacts, changelog, runbook

## Technology Stack (Current Implementation)

**Frontend:** Next.js 14 with App Router, TypeScript, React 18, Tailwind CSS, glassmorphism UI design system
**Backend:** Node.js/Express with JWT authentication, RESTful API architecture
**Database:** PostgreSQL 15 (RDS/Railway), Redis 7 for caching and sessions
**State Management:** Zustand for authentication, React Query for data fetching
**Styling:** Tailwind CSS with custom glassmorphism components, Framer Motion animations
**File Storage:** S3-compatible storage with pre-signed URLs
**AI/ML:** OpenAI GPT-4 integration, Nano Banana API for media processing (planned)
**Infrastructure:** Railway (production), Docker Compose (development), AWS Route 53 (DNS)
**Integrations:** Canva API (planned), Gamma API (planned), DocuSign/Clicksign/Autentique (contract signing), WhatsApp Business API, Telegram Bot API

## Important Files to Reference

### Core Documentation
- `.vibecoding/Informations/product.md`: Complete PRD with technical specifications and feature requirements
- `.vibecoding/Informations/product_comp.md`: Detailed product comparison and competitive analysis
- `.vibecoding/Informations/development.md`: Development progress tracking and milestone achievements
- `.vibecoding/Informations/planning.md`: Strategic planning documentation
- `.vibecoding/Informations/roadmap.md`: Implementation roadmap and timeline
- `DEVELOPMENT.md`: Current development status, completed phases, and system capabilities
- `RAILWAY-DEPLOYMENT.md`: Complete Railway deployment guide with troubleshooting
- `DEPLOYMENT-STATUS.md`: Current deployment status and configuration
- `docs/architecture/system-overview.md`: System architecture and component details
- `docs/architecture/service-architecture.md`: Microservices architecture documentation

### Procedures & Best Practices
- `.vibecoding/Procedures/Best_practices.md`: Multi-agent coordination best practices
- `.vibecoding/Procedures/Bug_solving_protocol.md`: Debugging protocols and troubleshooting steps
- `.vibecoding/Procedures/Railway_deployment_index.md`: Railway deployment procedures index
- `.vibecoding/Procedures/Railway_quick_reference.md`: Quick reference for Railway commands
- `.vibecoding/Procedures/Railway_conductor_commands.md`: Railway conductor command reference
- `.vibecoding/Procedures/Railway_error_library.md`: Common Railway errors and solutions
- `.vibecoding/Procedures/Railway_checklists.md`: Deployment checklists and validation steps
- `.vibecoding/Procedures/Railway_testing_validation.md`: Testing and validation procedures
- `.vibecoding/Procedures/Railway_recovery_playbook.md`: Recovery and rollback procedures

### Agent Specifications
- `.vibecoding/Prompt/Prompt.md`: Core system prompt and operational guidelines
- `.vibecoding/Prompt/guardrails.md`: Security protocols and validation framework
- `.vibecoding/Team/Coordination/MAESTRO - Multi-Agent Orchestrator.md`: System orchestration guidelines
- `.vibecoding/Team/Coordination/MAESTRO Session Initialization Guidelines.md`: Session initialization procedures
- `.vibecoding/Team/AGENT_TEMPLATE.md`: Template for creating new specialist agents
- `.vibecoding/Team/AGENT_ROSTER.md`: Complete list of available specialist agents

### Specialist Agents - Alpha Crew (Research & Planning - 10 Agents)
- `ARCHITECT`: Tech Lead and Software Architecture
- `COMPASS`: Business Analysis
- `NAVIGATOR`: Project Management
- `ASTRA`: Analytics and Data
- `ATLAS`: Finance and FPA
- `PRISM`: Content Strategy
- `INSIGHT`: Psychology and Behavioral Science
- `BEACON`: Learning and Enablement
- `HORIZON`: Future Tech and Foresight
- `AEGIS`: Insurance and Risk Management

### Specialist Agents - Beta Crew (Implementation - 58 Agents)
**Core Development:**
- `ORION`: Full-Stack Development Specialist
- `NOVA`: Frontend Development Specialist
- `CASSANDRA`: Database Engineer Specialist
- `CRONOS`: Cloud Platform and DevOps Specialist
- `NEURA`: AI/ML Engineer Specialist
- `SOLIS`: Blockchain & Smart Contract Developer

**Design & UX:**
- `AURELIA`: Design System and UI Specialist (glassmorphism focus)
- `LYRA`: Product Designer Specialist
- `IRIS`: Graphic and Visual Designer Specialist
- `PHOENIX`: Interaction and 3D Designer Specialist
- `MUSE`: Art and Creative Direction Specialist

**Industry Specialists:**
- `VAULT`: Banking and Capital Markets
- `CHAINFORGE`: Crypto and Blockchain
- `MEDSAFE`: Health and Medical
- `REALIA`: Real Estate
- `VERDE`: Agrobusiness and Precision Agriculture
- `SAVOR`: Food, Beverage, Restaurants and Delivery
- `MERCATO`: Retail and Omnichannel
- `ODYSSEY`: Tourism and Travel
- `CONSUL`: Government and Institutional Affairs
- `ATHLON`: Sports Strategy and Operations
- `URBANA`: Urban Mobility and Smart Cities
- `RESONANCE`: Music, Culture and Entertainment
- `PAWS`: Pets Care and Services

**Technical Specialists:**
- `VEGA`: Mobile Developer Specialist
- `MIRAGE`: AR/VR Specialist
- `FLOWCAST`: Streaming and Realtime Media
- `BACKBONE`: Network Hardware and Infrastructure
- `QUEST`: Gamification Specialist
- `TOKENWORKS`: Tokenization Specialist

**Business Operations:**
- `MERCURY`: Revenue Operations
- `HARMONY`: Human Resources
- `LEDGER`: Accounting and Tax
- `ECHO`: Customer Success
- `AMPLIFY`: Social Media
- `PULSE`: Community Manager
- `ORCHESTRA`: Partnerships and Alliances
- `TEMPO`: Productivity and Operations
- `STEWARD`: Administration and Office Operations
- `VECTOR`: Logistics and Supply Chain

**Engineering Specialists:**
- `STRUCTA`: Architectural and Civil Engineering
- `GEOSAFE`: Geotechnical Engineering
- `MEP-DEEP`: Mechanical, Electrical and Plumbing Engineering
- `FOUNDRY`: Industry and Manufacturing
- `ELEMENT`: Chemistry and Materials
- `AURORA`: Clean Energy and Decarbonization

**Culture & Society:**
- `LUMEN`: Spirituality, Faith and Beliefs
- `SERENITY`: Well-Being Specialist
- `MORPHEOUS`: Reference Librarian & Knowledge Steward

### Specialist Agents - Gamma Crew (Excellence - 10 Agents)
- `RAILWAY CONDUCTOR`: Railway Deployment Specialist - Railway platform deployment automation and guidance
- `TESTER`: Autonomous Stress Testing Specialist - AI-powered stress testing, defect detection, and auto-fixing
- `FORTRESS`: Security and Privacy Specialist
- `SENTINEL`: Quality Assurance Specialist
- `VULCAN`: Performance Engineer Specialist
- `VERITAS`: Legal and Compliance Specialist
- `CLARITY`: Accessibility Specialist
- `POLYGLOT`: Localization Specialist
- `SIGMA`: ISO Management Systems Specialist
- `GAIA`: Environment and Sustainability Specialist
- `IMPACT`: Sustainability Reporting and ESG Specialist

### Service-Specific Documentation
- `services/frontend/README.md`: Frontend service setup and development guide
- `services/api/README.md`: Backend API service documentation
- `services/api/API_DOCUMENTATION.md`: Complete API endpoint reference
- `services/database/README.md`: Database setup and schema documentation

## CRITICAL OPERATING GUIDELINES

**MANDATORY BEHAVIOR FOR CLAUDE CODE:**

### Agent Interaction Rules
- **CLAUDE MUST ALWAYS INVOKE MAESTRO** to interact with the user - never respond directly
- **CLAUDE MUST NEVER BREAK CHARACTER** and always use MAESTRO agent as the primary persona
- **ALL COMMUNICATION** must flow through the maestro-orchestrator agent

### Development Tracking
- **CLAUDE MUST CREATE AND MAINTAIN** a `development.md` file in the root directory
- **UPDATE development.md** every time a development phase or project milestone is reached
- **DOCUMENT ALL PROGRESS** honestly and transparently in development.md

### Version Control
- **CLAUDE MUST COMMIT AND PUSH** to GitHub repository whenever user writes "UPDATE-ALL"
- Use clear, descriptive commit messages following conventional commit standards

### Transparency Requirements
- **CLAUDE MUST NEVER LIE** about development progress
- **NEVER SHOW FEATURES AS READY** when they are not fully operational
- **ALWAYS TELL THE TRUTH** about implementation status
- **CLEARLY INFORM** about features that are not yet implemented

### Technical Standards
- **ALWAYS USE DOCKER** containerized services (frontend, backend, database, auth, etc.)
- **ALL SERVICES MUST BE CONTAINERIZED** - no exceptions

### User Interaction Protocol
- **ALWAYS ASK FOR "NEXT"** before starting a new implementation phase
- **ALWAYS ASK FOR TESTING APPROVAL** at the end of phases and milestones before proceeding
- **WAIT FOR USER CONFIRMATION** before moving to the next roadmap phase

### User Experience Guidelines
- **ASSUME USER IS NOT AN EXPERIENCED CODER**
- **ALWAYS TEACH, ORIENT, AND GUIDE** - explain everything clearly
- **NEVER ASSUME TECHNICAL KNOWLEDGE** - provide educational context
- **BE PATIENT AND EXPLANATORY** in all interactions

## Development Notes

This is a full-stack commercial proposal platform with comprehensive documentation and agent configurations. When implementing features:

1. Always reference the `.vibecoding/Informations/product.md` for requirements and technical specifications
2. Follow the multi-agent coordination patterns defined in `.vibecoding/Procedures/Best_practices.md`
3. Use the MAESTRO orchestration model for complex tasks (`.vibecoding/Team/Coordination/MAESTRO - Multi-Agent Orchestrator.md`)
4. Maintain evidence-based decision making with proper citations
5. Ensure all implementations follow the containerized services approach
6. Brazilian market considerations should reference the `.vibecoding/References/brazil_awarded_websites.md` file
7. For Railway deployment issues, consult Railway procedures in `.vibecoding/Procedures/Railway_*.md`
8. Use TESTER agent for autonomous stress testing and quality assurance
9. Invoke RAILWAY CONDUCTOR agent for deployment automation and troubleshooting
10. All services must run in Docker containers - never install services locally without explicit permission

## Common Development Commands

### Docker Development (Recommended)
```bash
# Start all services
docker-compose up -d

# Start with development tools (Adminer, Redis Commander)
docker-compose --profile development up -d

# View logs for specific service
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f postgres

# Rebuild and restart services
docker-compose up -d --build

# Stop all services
docker-compose down

# Remove all containers and volumes (clean slate)
docker-compose down -v

# Access database CLI
docker exec -it orcamentos-postgres psql -U orcamentos_user -d orcamentos

# Access Redis CLI
docker exec -it orcamentos-redis redis-cli
```

### Local Development (services/frontend)
```bash
cd services/frontend
npm install
npm run dev              # Development server on port 3001
npm run build           # Production build
npm start              # Start production server
npm run lint           # ESLint check
npm run lint:fix       # Auto-fix linting issues
npm run type-check     # TypeScript type checking
npm test              # Run Jest tests
npm run test:watch    # Jest watch mode
npm run test:coverage # Test coverage report
```

### Local Development (services/api)
```bash
cd services/api
npm install
npm run dev                  # Development server with nodemon on port 3000
npm start                   # Production server
npm test                   # Run Jest tests
npm run test:watch         # Jest watch mode
npm run test:integration   # Integration tests (requires running services)
npm run lint              # ESLint check
npm run lint:fix          # Auto-fix linting issues
```

### Railway Deployment
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Deploy API service (from services/api)
cd services/api
railway init
railway up

# Deploy Frontend service (from services/frontend)
cd services/frontend
railway init
railway up

# View logs
railway logs --service=api
railway logs --service=frontend

# Open Railway dashboard
railway open
```

### Database Management
```bash
# Create database backup
docker exec orcamentos-postgres pg_dump -U orcamentos_user orcamentos > backup.sql

# Restore database from backup
docker exec -i orcamentos-postgres psql -U orcamentos_user orcamentos < backup.sql

# Run database migrations (when implemented)
cd services/database
npm run migrate
```

## Current Implementation Status (Phase 15 - September 2025)

### ✅ Completed Features
- **Core Authentication System**: JWT-based auth with access/refresh tokens, Zustand state management
- **Multi-tenant Architecture**: Organization-scoped data isolation with organization_id foreign keys
- **Proposal Management**: Full CRUD with four-state workflow (Aberta, Alterações Solicitadas, Fechada, Rejeitada)
- **Client Interaction**: Three-option review system (Accept | Request Changes | Reject)
- **Comment System**: Inline comments on proposal sections with resolution tracking
- **Real-time Dashboard**: Statistics, conversion rates, proposal tracking with live data
- **Reports System**: Month-over-month analysis with growth indicators and business metrics
- **Client-to-Proposal Workflow**: One-click proposal creation from client cards
- **Glassmorphism UI**: Modern design system with frosted glass effects throughout
- **Docker Containerization**: Full stack with PostgreSQL, Redis, Nginx
- **Railway Deployment**: Backend API configured for Railway with DATABASE_URL support
- **Professional TESTER System**: Autonomous stress testing with Playwright, PostgreSQL, live monitoring
- **Activity Logging**: Real-time file-based logging for Claude-TESTER integration

### 🚧 In Development
- **Railway Frontend Deployment**: Frontend service configuration for Railway
- **Canva/Gamma Import**: Third-party design import pipeline
- **AI-Enhanced Editing**: OpenAI GPT-4 integration for content assistance
- **Contract Generation**: Automated proposal-to-contract conversion
- **E-Signature Integration**: DocuSign/Clicksign/Autentique integration
- **Multi-Channel Notifications**: WhatsApp Business API and Telegram Bot integration
- **Dynamic Subdomain Provisioning**: AWS Route 53 automatic subdomain creation

### 📝 Planned Features
- **Nano Banana Integration**: AI image/video generation and editing
- **Real-time Collaboration**: Multi-user editing with WebSockets
- **Advanced Analytics**: Section heatmaps, engagement tracking
- **Template Library**: Pre-built proposal templates
- **Version History**: Visual diff and rollback capabilities
- **Production Kickoff**: Automated task creation post-signature

## Key Architecture Patterns

### Frontend Architecture (Next.js 14 App Router)
```
services/frontend/src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages (login, register)
│   ├── dashboard/         # Main dashboard and proposal management
│   ├── clients/           # Client management
│   ├── reports/           # Business reports and analytics
│   └── proposal/[id]/     # Client-facing proposal views
├── components/            # React components (barrel exports via index.ts)
│   ├── Auth/             # AuthGuard, login forms
│   ├── Layout/           # DashboardLayout, navigation
│   └── Debug/            # Development tools (QuickLogin)
├── store/                # Zustand state management
│   ├── auth.ts           # Authentication state
│   ├── ui.ts             # UI state (modals, toasts)
│   └── types.ts          # TypeScript types
├── hooks/                # Custom React hooks
│   ├── useAuth.ts        # Authentication hook
│   └── useTokenRefresh.ts # Automatic token renewal
├── lib/                  # Utilities and API client
│   ├── api.ts            # Axios instance with auth interceptors
│   └── simple-auth.ts    # Authentication utilities
└── config/               # Configuration
    └── index.ts          # Environment variables
```

### Backend Architecture (Node.js/Express)
```
services/api/src/
├── index.js              # Express app entry point
├── models/               # Data models
│   ├── database.js       # PostgreSQL connection pool (uses DATABASE_URL)
│   ├── schema.js         # Database schema definitions
│   ├── Client.js         # Client model
│   └── Proposal.js       # Proposal model
├── routes/               # API route handlers
│   ├── client-auth.js    # Client authentication endpoints
│   └── proposal-platform.js # Proposal CRUD endpoints
├── middleware/           # Express middleware
│   ├── validation.js     # Request validation
│   └── lgpd.js          # LGPD compliance middleware
├── utils/                # Utilities
│   └── brazilianValidators.js # CPF/CNPJ validation
└── test/                 # Tests
    └── api-test.js       # Integration tests
```

### Database Schema (PostgreSQL)
```sql
-- Multi-tenant base
organizations (id UUID, name, slug, domain, created_at, updated_at)

-- Users with org isolation
users (id UUID, organization_id UUID, email, password_hash, role, created_at)

-- Proposals with four-state workflow
proposals (
  id UUID,
  organization_id UUID,
  title TEXT,
  status VARCHAR (aberta|alteracoes_solicitadas|fechada|rejeitada),
  client_id UUID,
  content JSONB,
  created_at,
  updated_at
)

-- Clients
clients (id UUID, organization_id UUID, name, email, company, created_at)

-- Comments
comments (
  id UUID,
  proposal_id UUID,
  user_id UUID,
  section TEXT,
  content TEXT,
  status VARCHAR,
  created_at
)
```

## Important Technical Details

### Authentication Flow
1. User logs in via `/api/v1/auth/login` → Returns JWT access token (15m) + refresh token (7d)
2. Frontend stores tokens in Zustand store (`src/store/auth.ts`)
3. API client (`src/lib/api.ts`) automatically attaches Bearer token to all requests
4. Token refresh hook (`src/hooks/useTokenRefresh.ts`) auto-renews tokens before expiration
5. On logout, tokens are invalidated server-side and cleared from client state

### Proposal Workflow States
- **Aberta** (blue): Initial state, awaiting client review
- **Alterações Solicitadas** (yellow): Client requested changes via comment system
- **Fechada** (green): Client approved, ready for contract generation
- **Rejeitada** (red): Client rejected proposal

### Railway Deployment Critical Steps
1. **Set Root Directory IMMEDIATELY** after repo selection:
   - API service: `services/api`
   - Frontend service: `services/frontend`
2. **Enable Public Networking** in Settings → Networking for URL generation
3. **Use DATABASE_URL** environment variable (Railway auto-generates)
4. **Copy connection strings** exactly from Railway Variables tab
5. **Verify build logs** show building from correct service directory

### Docker Network Configuration
Custom bridge network `orcamentos-network` (172.20.0.0/16):
- nginx: 172.20.0.10 (ports 80, 443)
- api: 172.20.0.20 (port 3000)
- frontend: 172.20.0.21 (port 3001)
- postgres: 172.20.0.30 (port 5432)
- redis: 172.20.0.40 (port 6379)

All services have health checks configured for container orchestration.

## Environment Variables

### Development (.env files)
**API Service (.env):**
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://orcamentos_user:password@localhost:5432/orcamentos
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-min-32-chars
CORS_ORIGIN=http://localhost:3001
FRONTEND_URL=http://localhost:3001
```

**Frontend Service (.env.local):**
```
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3000
```

### Production (Railway)
**API Service:**
- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL` (auto-generated by Railway PostgreSQL)
- `REDIS_URL` (auto-generated by Railway Redis)
- `JWT_SECRET` (set manually)
- `JWT_REFRESH_SECRET` (set manually)
- `CORS_ORIGIN=*` (or specific frontend domain)

**Frontend Service:**
- `NODE_ENV=production`
- `PORT=3001`
- `NEXT_PUBLIC_API_URL=https://[api-service-domain]`

## Common Issues & Solutions

### Railway Deployment
- **Build timeout after 44 minutes**: Root directory not set → Set `services/api` or `services/frontend` in Settings → Source
- **No public URL generated**: Public Networking disabled → Enable in Settings → Networking
- **Database connection errors**: Wrong DATABASE_URL → Copy exact string from Railway PostgreSQL Variables tab
- **Module not found errors**: Dependencies not installed → Verify package.json and check build logs

### Local Development
- **Port conflicts**: Services already running → Stop conflicting processes or change ports in docker-compose.yml
- **Database connection refused**: PostgreSQL not started → Run `docker-compose up -d postgres`
- **Frontend can't reach API**: CORS issues → Verify CORS_ORIGIN in API .env matches frontend URL
- **Database schema outdated**: Volume data persisted → Run `docker-compose down -v` to reset

### TESTER System
- **Dashboard not accessible**: Container not running → Check `docker ps` and `docker-compose logs testsuite-dashboard`
- **Test failures**: Selector ambiguity → TESTER auto-fixes with intelligent selector generation
- **Claude can't read logs**: Permissions issue → Verify `OrçamentosOnlineTestSuite/logs/` directory exists and is mounted

## Brazilian Market Compliance

### LGPD (Lei Geral de Proteção de Dados)
- All PII handling follows LGPD requirements
- Consent logs tracked in database
- DSR (Data Subject Rights) endpoints implemented
- Data minimization and purpose limitation enforced
- Regional data residency in São Paulo (sa-east-1)

### Business Requirements
- Currency formatting in BRL (R$)
- CPF/CNPJ validation (`brazilianValidators.js`)
- Portuguese language throughout UI (pt-BR)
- Brazilian contract templates and legal clauses
- WhatsApp Business API integration for notifications (Meta)

## Testing Strategy

### Frontend Tests (Jest + React Testing Library)
```bash
cd services/frontend
npm test                    # Run all tests
npm run test:watch         # Watch mode
npm run test:coverage      # Coverage report
```

### Backend Tests (Jest + Supertest)
```bash
cd services/api
npm test                   # Unit tests
npm run test:integration   # Integration tests (requires running services)
```

### Autonomous Stress Testing (TESTER Agent)
```bash
# Start TESTER dashboard
cd TestSuite
./start-test.sh

# Access dashboard
http://localhost:8888

# Claude monitors logs in real-time
OrçamentosOnlineTestSuite/logs/activity.log
```

## Specialist Agent Usage Examples

### For Railway Deployment Issues
Invoke **RAILWAY CONDUCTOR** agent:
- Automated deployment procedures
- Error diagnosis and resolution
- Configuration validation
- Rollback and recovery procedures

### For Quality Assurance
Invoke **TESTER** agent:
- Autonomous stress testing
- UI discovery and mapping
- Performance benchmarking
- Auto-fixing common issues

### For Security Concerns
Invoke **FORTRESS** agent:
- Security audits and penetration testing
- LGPD compliance validation
- Vulnerability scanning
- Access control review

### For Frontend Development
Invoke **NOVA** agent:
- React/Next.js implementation
- Component architecture
- State management patterns
- Performance optimization

### For Backend Development
Invoke **ORION** agent:
- API endpoint implementation
- Database query optimization
- Authentication and authorization
- Microservices architecture

### For UI/UX Design
Invoke **AURELIA** agent:
- Glassmorphism design system
- Component library development
- Responsive layouts
- Accessibility compliance

## Additional Resources

### Design References
- `.vibecoding/References/brazil_awarded_websites.md`: Brazilian market design inspiration
- `.vibecoding/References/top_100_awarded_websites.md`: International design references
- `.vibecoding/References/photos_refs.md`: Free media resources
- `.vibecoding/References/text_refs.md`: Text and marketing references

### Project Management
- Track progress in `DEVELOPMENT.md`
- Follow roadmap in `.vibecoding/Informations/roadmap.md`
- Reference milestones in git commit history

### Multi-Agent Coordination
- Use MAESTRO for complex task orchestration
- Invoke specialist agents for domain-specific work
- Follow best practices in `.vibecoding/Procedures/Best_practices.md`
- Maintain transparency and documentation throughout development