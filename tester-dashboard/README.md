# 🤖 TESTER Agent - Universal Testing Dashboard

**Comprehensive web interface for automated testing across any project**

The TESTER Agent provides a powerful, visual dashboard for monitoring, controlling, and analyzing comprehensive testing of any software project. It runs on port 8888 and offers real-time insights into your project's health and functionality.

## ✨ Features

### 🎯 **Core Functionality**
- **Project Configuration**: Set project name and customize settings
- **Service Monitoring**: Monitor multiple services with customizable ports
- **Real-time Testing**: Continuous testing until 100% success rate
- **Progress Tracking**: Color-coded progress indicator (red→orange→yellow→green→blue)
- **Control Interface**: Start, pause, stop testing with intuitive controls

### 📊 **Monitoring & Analysis**
- **Port Monitoring**: Pre-configured for common services (PostgreSQL, Redis, Frontend, Backend, etc.)
- **Feature Discovery**: Automatically discover and test project features
- **Real-time Results**: Live test results with success/failure indicators
- **Error Logging**: Comprehensive error tracking and analysis
- **Performance Metrics**: Response times and success rates

### 🔧 **Advanced Options**
- **Auto Retry**: Automatically retry failed tests
- **Auto Fix**: Apply common fixes automatically
- **Auto Refresh Scope**: Refresh feature discovery on changes
- **Auto Restart Containers**: Restart containers when they crash
- **Backlog Management**: Save and manage test results

## 🚀 Quick Start

### Method 1: Start with Docker Compose (Recommended)
```bash
# Start the dashboard
docker-compose --profile dashboard up -d tester-dashboard

# View logs
docker-compose --profile dashboard logs -f tester-dashboard
```

### Method 2: Use the Startup Script
```bash
# One-command startup
./start_tester_dashboard.sh
```

### Method 3: Manual Node.js Start
```bash
cd tester-dashboard
npm install
npm start
```

**Dashboard will be available at: http://localhost:8888**

## 🎨 Dashboard Interface

### Left Panel - Configuration
1. **Project Configuration**
   - Set project name
   - Basic project settings

2. **Service Monitoring**
   - Enable/disable service monitoring
   - Configure custom ports
   - Real-time service health status

3. **Test Configuration**
   - Set test iterations (1-100 times per feature)
   - Configure test parameters

4. **Auto Options**
   - Enable automated behaviors
   - Set retry and fix options

### Center Panel - Control & Progress
1. **Progress Circle**
   - Real-time success rate display
   - Color-coded progress indicator:
     - 🔴 **Red (0-19%)**: System broken
     - 🟠 **Orange (20-39%)**: Major issues
     - 🟡 **Yellow (40-59%)**: Moderate issues
     - 🟢 **Green (60-79%)**: Good state
     - 🔵 **Blue (80-100%)**: Excellent state

2. **Control Buttons**
   - Start Testing
   - Pause/Resume
   - Stop Testing

3. **Action Buttons**
   - Refresh Scope (discover new features)
   - Save Backlog
   - Download Logs

### Right Panel - Results & Analysis
1. **Real-time Results**
   - Live test execution results
   - Success/failure indicators
   - Timestamps

2. **Discovered Features**
   - Auto-discovered project components
   - API endpoints
   - Services and features

3. **Error Log**
   - Real-time error tracking
   - Error categorization
   - Timestamps and details

### Bottom Section - Summary
- **Comprehensive Statistics**
  - Services monitored
  - Features discovered
  - Total test runs
  - Average response time
- **Dynamic Description**: Updates based on current testing status

## 🌐 Default Service Ports

The TESTER Agent comes pre-configured to monitor common services:

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| Frontend | 3001 | Web Application |
| Backend API | 3000 | API Server |
| Nginx | 80 | Reverse Proxy |
| Grafana | 3030 | Monitoring |
| Prometheus | 9090 | Metrics |
| Adminer | 8080 | Database Admin |
| Elasticsearch | 9200 | Search Engine |
| MongoDB | 27017 | Document Database |
| RabbitMQ | 5672 | Message Queue |
| MailHog | 8025 | Email Testing |

You can enable/disable any service and customize ports directly in the dashboard.

## 🔄 How It Works

1. **Project Discovery**: TESTER Agent scans your project to discover:
   - Docker Compose services
   - API endpoints
   - Package.json files
   - Available features

2. **Service Monitoring**: Continuously monitors configured services:
   - Port connectivity
   - Health checks
   - Response times

3. **Comprehensive Testing**: Runs tests across:
   - All discovered features
   - All enabled services
   - User workflows
   - API endpoints

4. **Real-time Updates**: Provides live feedback:
   - Progress updates
   - Test results
   - Error notifications
   - Performance metrics

5. **Continuous Improvement**: Automatically:
   - Retries failed tests (if enabled)
   - Applies common fixes (if enabled)
   - Discovers new features (if enabled)
   - Restarts crashed containers (if enabled)

## 📁 File Structure

```
tester-dashboard/
├── package.json          # Node.js dependencies
├── server.js             # Main server application
├── Dockerfile            # Docker configuration
├── install-kit.js        # Universal installer
├── public/
│   ├── index.html        # Dashboard interface
│   ├── styles.css        # Dashboard styling
│   └── dashboard.js      # Client-side logic
├── logs/                 # Generated log files
├── backlogs/            # Saved test backlogs
└── README.md            # This file
```

## 🛠️ Installation for Other Projects

TESTER Agent can be installed in any project using the install kit:

```bash
# Run the install kit
node tester-dashboard/install-kit.js

# Follow the interactive setup
# Choose installation type:
# 1. Standalone (independent service)
# 2. Docker Compose integration
# 3. Kubernetes deployment
```

The install kit will:
- Copy all necessary files
- Configure project-specific settings
- Set up Docker integration (if selected)
- Generate documentation
- Provide startup instructions

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Get current testing status |
| POST | `/api/project/set` | Set project name |
| POST | `/api/ports/update` | Update monitored ports |
| POST | `/api/test/start` | Start testing |
| POST | `/api/test/pause` | Pause/resume testing |
| POST | `/api/test/stop` | Stop testing |
| POST | `/api/discovery/refresh` | Refresh feature discovery |
| POST | `/api/backlog/save` | Save current backlog |
| GET | `/api/logs/download` | Download log files |

## 🌍 Environment Variables

```bash
# Dashboard Configuration
TESTER_PORT=8888                # Dashboard port
PROJECT_NAME="MyProject"        # Project name
NODE_ENV=production             # Environment

# Auto Options
AUTO_RETRY=false               # Auto retry failed tests
AUTO_FIX=false                 # Auto fix common issues
AUTO_REFRESH_SCOPE=false       # Auto refresh feature discovery
AUTO_RESTART_CONTAINERS=false  # Auto restart containers
```

## 📊 Real-time Features

- **WebSocket Connection**: Real-time communication between dashboard and server
- **Live Updates**: Progress, results, and status update in real-time
- **Connection Status**: Visual indicator of dashboard connectivity
- **Auto-refresh**: Automatic refresh of discovered features and port status
- **Toast Notifications**: Real-time feedback for user actions

## 🎯 Use Cases

### Development
- Monitor application health during development
- Test new features automatically
- Debug issues with comprehensive logging
- Ensure all services are running correctly

### Testing
- Continuous testing until 100% success rate
- Stress testing with configurable iterations
- Real-time test result monitoring
- Automated issue detection and fixing

### DevOps
- Service health monitoring
- Container status tracking
- Automated restart capabilities
- Performance metrics collection

### Quality Assurance
- Comprehensive test coverage
- Real-time error tracking
- Historical test data (backlogs)
- Automated regression testing

## 🤝 Contributing

TESTER Agent is designed to be universally applicable. To contribute:

1. Fork the repository
2. Create your feature branch
3. Test with multiple project types
4. Ensure universal compatibility
5. Submit a pull request

## 📞 Support

If you encounter issues:

1. Check the dashboard error log
2. Review generated log files in `/logs/`
3. Verify service configurations
4. Ensure Docker is running (for Docker-based setups)
5. Check port availability

## 📄 License

MIT License - Feel free to use TESTER Agent in any project!

---

**TESTER Agent - Making comprehensive testing accessible to every project! 🚀**

*Dashboard Port: 8888*
*Universal • Real-time • Comprehensive*