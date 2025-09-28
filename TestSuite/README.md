# TESTER Suite - Autonomous Stress Testing Platform

**🤖 AI-Driven Stress Testing with Real-time Claude Integration**

## Overview

TESTER Suite is a comprehensive autonomous stress testing platform designed for web applications. It provides intelligent testing with AI analysis, real-time monitoring, and automatic issue detection and resolution.

## Key Features

### 🧪 **Autonomous Stress Testing**
- Virtual user simulation with human-like interaction patterns
- Playwright-based browser automation for realistic testing
- Configurable load testing with multiple concurrent users
- Evidence collection (screenshots, videos, traces)

### 🔍 **Intelligent Discovery**
- Automatic UI mapping and element detection
- Form and flow analysis
- API endpoint discovery
- Dynamic application structure analysis

### 🤖 **Claude AI Integration**
- Real-time activity logging for AI analysis
- File-based communication system
- Automatic issue detection and recommendations
- Live activity monitoring and reporting

### 📊 **Professional Monitoring**
- Real-time Socket.IO dashboard with glassmorphism UI
- PostgreSQL database for persistent test data
- Redis coordination for distributed testing
- Prometheus metrics and Grafana dashboards

### 🐳 **Containerized Architecture**
- Complete Docker stack with service orchestration
- Easy deployment with docker-compose
- Isolated testing environment
- Scalable and portable

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 16+ (for development)

### Installation

#### Option 1: Standalone Deployment
```bash
git clone https://github.com/yourusername/tester-suite
cd tester-suite
docker-compose up -d
```

#### Option 2: Git Submodule (Recommended for Projects)
```bash
# Add to your project
git submodule add https://github.com/yourusername/tester-suite tester

# Update to latest version
git submodule update --remote tester
```

#### Option 3: npm Package
```bash
# Install as dependency
npm install @yourusername/tester-suite

# Use in your project
const TESTER = require('@yourusername/tester-suite');
```

### Usage

1. **Start TESTER Suite**
   ```bash
   docker-compose up -d
   ```

2. **Access Dashboard**
   - Dashboard: http://localhost:8888
   - Grafana: http://localhost:3002
   - Prometheus: http://localhost:9091

3. **Configure Target Application**
   - Set `TARGET_URL` environment variable
   - Configure test parameters in dashboard

4. **Start Testing**
   - Click "Start Test Session" in dashboard
   - Monitor real-time results
   - Review evidence and metrics

## Architecture

### Components

- **TESTER Main** (`src/index.js`) - Core application server
- **Discovery Engine** (`src/discovery/`) - UI mapping and analysis
- **Stress Runner** (`src/stress/`) - Virtual user testing engine
- **Activity Logger** (`src/logging/`) - Real-time logging for Claude integration
- **Database Manager** (`src/database/`) - PostgreSQL integration
- **Monitoring System** (`src/monitoring/`) - Metrics and performance tracking
- **Reporting Engine** (`src/reporting/`) - Test results and analytics

### Services

- **PostgreSQL** - Test data persistence
- **Redis** - Session coordination and caching
- **Prometheus** - Metrics collection
- **Grafana** - Monitoring dashboards

## Environment Variables

```bash
# Target application URL
TARGET_URL=http://localhost:3000

# Test configuration
PROJECT_NAME=MyProject
HEADLESS=true

# Database
POSTGRES_URL=postgresql://testeruser:testerpass@postgres:5432/testerdb

# Redis
REDIS_URL=redis://redis:6379

# Claude Integration (optional)
CLAUDE_API_KEY=your_api_key
```

## Claude AI Integration

TESTER Suite includes built-in Claude AI integration for intelligent testing:

1. **Real-time Activity Logging**
   - All test activities logged to `/app/logs/`
   - Markdown summaries generated automatically
   - API endpoints for Claude access

2. **Live Activity Monitoring**
   - `GET /api/activity/summary` - Current test summary
   - `GET /api/activity/log` - Detailed activity log
   - File-based integration for persistent access

3. **Autonomous Testing Cycle**
   - Test execution with comprehensive evidence collection
   - AI analysis of failures and performance issues
   - Automated recommendations for fixes

## Evidence Collection

TESTER automatically collects comprehensive evidence:
- **Screenshots** - Error states and UI issues
- **Videos** - Full test session recordings
- **Traces** - Browser network and performance traces
- **Logs** - Detailed execution and error logs
- **Metrics** - Performance and resource utilization

## API Reference

### Test Management
- `GET /api/status` - System status and current session
- `POST /api/session/start` - Start new test session
- `POST /api/session/pause` - Pause current session
- `POST /api/session/stop` - Stop current session

### Discovery
- `GET /api/discovery` - Run application discovery

### Claude Integration
- `GET /api/activity/summary` - Current activity summary
- `GET /api/activity/log?lines=50` - Activity log (last N lines)

### Reports
- `GET /api/reports/:sessionId` - Session report
- `GET /api/reports/:sessionId/download` - Downloadable report

## Development

### Setup
```bash
# Clone repository
git clone https://github.com/yourusername/tester-suite
cd tester-suite

# Install dependencies
npm install

# Development server (without Docker)
npm run dev
```

### Testing
```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Building
```bash
# Build Docker image
docker-compose build

# Build for production
npm run build
```

## Integration Examples

### React/Next.js Project
```bash
# Add as submodule
git submodule add https://github.com/yourusername/tester-suite tester

# Update package.json
{
  "scripts": {
    "test:stress": "cd tester && docker-compose up -d",
    "test:update": "git submodule update --remote tester"
  }
}
```

### CI/CD Integration
```yaml
# .github/workflows/stress-test.yml
name: Stress Testing
on: [push, pull_request]

jobs:
  stress-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: true

      - name: Run Stress Tests
        run: |
          cd tester
          docker-compose up -d
          npm run test:wait-and-validate
```

## Versioning

TESTER Suite follows [Semantic Versioning](https://semver.org/):
- **Major** (X.0.0) - Breaking changes
- **Minor** (1.X.0) - New features, backward compatible
- **Patch** (1.1.X) - Bug fixes, backward compatible

### Update Strategy
```bash
# Update to latest version
git submodule update --remote tester

# Update to specific version
cd tester
git checkout v2.1.0
cd ..
git add tester
git commit -m "Update TESTER to v2.1.0"
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [Wiki](https://github.com/yourusername/tester-suite/wiki)
- **Issues**: [GitHub Issues](https://github.com/yourusername/tester-suite/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/tester-suite/discussions)

---

**Built with ❤️ for autonomous testing and AI-driven quality assurance**