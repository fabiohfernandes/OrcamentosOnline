/**
 * TESTER AGENT - Universal Testing Dashboard
 * Comprehensive web interface for automated testing across any project
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs-extra');
const path = require('path');
const moment = require('moment');
const chalk = require('chalk');
const Docker = require('dockerode');
const { glob } = require('glob');
const axios = require('axios');
const chokidar = require('chokidar');
const { spawn } = require('child_process');
const ClaudeTesterIntegration = require('./claude-integration');

class TesterDashboard {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.docker = new Docker();
    this.port = process.env.TESTER_PORT || 8888;

    // Testing state
    this.testingState = {
      isRunning: false,
      isPaused: false,
      currentProject: '',
      totalProgress: 0,
      currentIteration: 0,
      maxIterations: 1000,
      successRate: 0,
      testResults: [],
      discoveredFeatures: [],
      monitoredPorts: this.getDefaultPorts(),
      testIterations: 10,
      lastUpdate: null,
      errors: [],
      backlog: [],
      autoOptions: {
        autoRetry: false,
        autoFix: false,
        autoRefreshScope: false,
        autoRestartContainers: false
      },
      claudeIntegration: {
        enabled: false,
        autoMode: false,
        autoFix: false,
        autoTest: false,
        autoAnalyze: false,
        autoCommit: false,
        maxIterations: 50
      }
    };

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
    this.startDiscoveryWatcher();

    // Initialize Claude integration
    this.claudeIntegration = new ClaudeTesterIntegration(this);
  }

  getDefaultPorts() {
    return {
      postgres: { port: 5432, name: 'PostgreSQL Database', enabled: true, status: 'unknown' },
      redis: { port: 6379, name: 'Redis Cache', enabled: true, status: 'unknown' },
      frontend: { port: 3001, name: 'Frontend Application', enabled: true, status: 'unknown' },
      backend: { port: 3000, name: 'Backend API', enabled: true, status: 'unknown' },
      nginx: { port: 80, name: 'Nginx Reverse Proxy', enabled: false, status: 'unknown' },
      grafana: { port: 3030, name: 'Grafana Monitoring', enabled: false, status: 'unknown' },
      prometheus: { port: 9090, name: 'Prometheus Metrics', enabled: false, status: 'unknown' },
      adminer: { port: 8080, name: 'Database Admin', enabled: false, status: 'unknown' },
      elasticsearch: { port: 9200, name: 'Elasticsearch', enabled: false, status: 'unknown' },
      mongodb: { port: 27017, name: 'MongoDB', enabled: false, status: 'unknown' },
      rabbitmq: { port: 5672, name: 'RabbitMQ', enabled: false, status: 'unknown' },
      mailhog: { port: 8025, name: 'Email Testing', enabled: false, status: 'unknown' }
    };
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: true }));
    this.app.use(express.static(path.join(__dirname, 'public')));
  }

  setupRoutes() {
    // Main dashboard
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // API Routes
    this.app.get('/api/status', (req, res) => {
      res.json(this.testingState);
    });

    this.app.post('/api/project/set', (req, res) => {
      const { projectName } = req.body;
      this.testingState.currentProject = projectName;
      this.discoverProject();
      this.broadcast('projectUpdated', this.testingState);
      res.json({ success: true, project: projectName });
    });

    this.app.post('/api/ports/update', (req, res) => {
      const { ports } = req.body;
      this.testingState.monitoredPorts = { ...this.testingState.monitoredPorts, ...ports };
      this.checkPortStatus();
      res.json({ success: true, ports: this.testingState.monitoredPorts });
    });

    this.app.post('/api/iterations/set', (req, res) => {
      const { iterations } = req.body;
      this.testingState.testIterations = Math.max(1, Math.min(100, parseInt(iterations)));
      res.json({ success: true, iterations: this.testingState.testIterations });
    });

    this.app.post('/api/test/start', async (req, res) => {
      try {
        await this.startTesting();
        res.json({ success: true, message: 'Testing started' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    this.app.post('/api/test/pause', (req, res) => {
      this.pauseTesting();
      res.json({ success: true, message: 'Testing paused' });
    });

    this.app.post('/api/test/stop', (req, res) => {
      this.stopTesting();
      res.json({ success: true, message: 'Testing stopped' });
    });

    this.app.post('/api/backlog/save', (req, res) => {
      this.saveBacklog();
      res.json({ success: true, message: 'Backlog saved' });
    });

    this.app.post('/api/discovery/refresh', (req, res) => {
      this.discoverProject();
      res.json({ success: true, features: this.testingState.discoveredFeatures });
    });

    this.app.post('/api/options/update', (req, res) => {
      const { options } = req.body;
      this.testingState.autoOptions = { ...this.testingState.autoOptions, ...options };
      res.json({ success: true, options: this.testingState.autoOptions });
    });

    this.app.get('/api/logs/download', (req, res) => {
      const logFile = this.generateLogFile();
      res.download(logFile);
    });

    // Claude Integration API routes
    this.app.post('/api/claude/enable', (req, res) => {
      const { options } = req.body;
      this.testingState.claudeIntegration = { ...this.testingState.claudeIntegration, ...options };
      this.claudeIntegration.enableAutoMode(options);
      this.broadcast('claudeStatusUpdate', this.testingState.claudeIntegration);
      res.json({ success: true, message: 'Claude integration enabled' });
    });

    this.app.post('/api/claude/disable', (req, res) => {
      this.testingState.claudeIntegration.enabled = false;
      this.claudeIntegration.disableAutoMode();
      this.broadcast('claudeStatusUpdate', this.testingState.claudeIntegration);
      res.json({ success: true, message: 'Claude integration disabled' });
    });

    this.app.get('/api/claude/status', (req, res) => {
      res.json(this.claudeIntegration.getStatus());
    });

    this.app.post('/api/claude/force-cycle', async (req, res) => {
      try {
        await this.claudeIntegration.analyzeResults();
        await this.claudeIntegration.applyFixes();
        await this.claudeIntegration.triggerRetesting();
        res.json({ success: true, message: 'Force cycle triggered' });
      } catch (error) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(chalk.green('🔌 Dashboard client connected'));

      // Send current state to new client
      socket.emit('stateUpdate', this.testingState);

      socket.on('disconnect', () => {
        console.log(chalk.yellow('🔌 Dashboard client disconnected'));
      });

      socket.on('requestUpdate', () => {
        socket.emit('stateUpdate', this.testingState);
      });
    });
  }

  broadcast(event, data) {
    this.io.emit(event, data);
  }

  async startTesting() {
    if (this.testingState.isRunning) {
      throw new Error('Testing is already running');
    }

    this.testingState.isRunning = true;
    this.testingState.isPaused = false;
    this.testingState.currentIteration = 0;
    this.testingState.totalProgress = 0;
    this.testingState.testResults = [];
    this.testingState.errors = [];
    this.testingState.lastUpdate = moment().toISOString();

    this.broadcast('testingStarted', this.testingState);

    try {
      // Check if automated testing container exists
      const projectRoot = this.findProjectRoot();
      const automatedTestingPath = path.join(projectRoot, 'automated-testing');

      if (await fs.pathExists(automatedTestingPath)) {
        await this.runAutomatedTesting(projectRoot);
      } else {
        await this.runBasicTesting();
      }
    } catch (error) {
      this.testingState.errors.push({
        timestamp: moment().toISOString(),
        error: error.message,
        type: 'system'
      });
      this.stopTesting();
    }
  }

  async runAutomatedTesting(projectRoot) {
    console.log(chalk.blue('🚀 Starting automated testing container...'));

    const testProcess = spawn('docker-compose', ['--profile', 'testing', 'up', 'automated-testing'], {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    testProcess.stdout.on('data', (data) => {
      const output = data.toString();
      this.parseTestingOutput(output);
    });

    testProcess.stderr.on('data', (data) => {
      const error = data.toString();
      this.testingState.errors.push({
        timestamp: moment().toISOString(),
        error: error,
        type: 'docker'
      });
      this.broadcast('errorUpdate', this.testingState.errors);
    });

    testProcess.on('close', (code) => {
      this.testingState.isRunning = false;
      this.testingState.totalProgress = code === 0 ? 100 : this.testingState.totalProgress;
      this.broadcast('testingCompleted', {
        success: code === 0,
        finalProgress: this.testingState.totalProgress
      });
    });

    this.testProcess = testProcess;
  }

  async runBasicTesting() {
    console.log(chalk.blue('🚀 Starting basic stress testing...'));

    for (let iteration = 1; iteration <= this.testingState.maxIterations; iteration++) {
      if (!this.testingState.isRunning || this.testingState.isPaused) break;

      this.testingState.currentIteration = iteration;

      // Test each enabled port
      const results = await this.testEnabledPorts();

      // Calculate success rate
      const totalTests = results.length;
      const successfulTests = results.filter(r => r.success).length;
      this.testingState.successRate = Math.round((successfulTests / totalTests) * 100);

      // Update progress
      this.testingState.totalProgress = this.testingState.successRate;
      this.testingState.testResults = results;
      this.testingState.lastUpdate = moment().toISOString();

      this.broadcast('progressUpdate', {
        iteration: this.testingState.currentIteration,
        progress: this.testingState.totalProgress,
        successRate: this.testingState.successRate,
        results: this.testingState.testResults
      });

      // If we reach 100%, we're done
      if (this.testingState.successRate >= 100) {
        break;
      }

      // Wait between iterations
      await this.sleep(5000);
    }

    this.stopTesting();
  }

  async testEnabledPorts() {
    const results = [];

    for (const [key, port] of Object.entries(this.testingState.monitoredPorts)) {
      if (!port.enabled) continue;

      const result = {
        service: key,
        name: port.name,
        port: port.port,
        success: false,
        responseTime: 0,
        error: null,
        timestamp: moment().toISOString()
      };

      try {
        const startTime = Date.now();

        // Test port connectivity
        await this.testPortConnectivity(port.port);

        result.responseTime = Date.now() - startTime;
        result.success = true;

        // Additional API testing for known services
        if (key === 'backend') {
          await this.testBackendAPI(port.port);
        } else if (key === 'frontend') {
          await this.testFrontendPages(port.port);
        }

      } catch (error) {
        result.error = error.message;
        result.success = false;
      }

      results.push(result);
    }

    return results;
  }

  async testPortConnectivity(port) {
    try {
      const response = await axios.get(`http://localhost:${port}`, {
        timeout: 5000,
        validateStatus: () => true // Accept any status code
      });
      return response.status < 500;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Connection refused - service not running');
      }
      throw error;
    }
  }

  async testBackendAPI(port) {
    const endpoints = ['/api/v1/health', '/api/health', '/health'];

    for (const endpoint of endpoints) {
      try {
        await axios.get(`http://localhost:${port}${endpoint}`, { timeout: 3000 });
        return true;
      } catch (error) {
        continue;
      }
    }

    throw new Error('No valid API endpoints found');
  }

  async testFrontendPages(port) {
    const pages = ['/', '/login', '/dashboard'];

    for (const page of pages) {
      try {
        const response = await axios.get(`http://localhost:${port}${page}`, {
          timeout: 3000,
          validateStatus: (status) => status < 400
        });
        if (response.status >= 200 && response.status < 400) {
          return true;
        }
      } catch (error) {
        continue;
      }
    }

    throw new Error('Frontend pages not accessible');
  }

  parseTestingOutput(output) {
    // Parse automated testing output for progress updates
    const lines = output.split('\n');

    for (const line of lines) {
      if (line.includes('Iteration') && line.includes('Success rate:')) {
        const match = line.match(/Success rate: (\d+)%/);
        if (match) {
          this.testingState.successRate = parseInt(match[1]);
          this.testingState.totalProgress = this.testingState.successRate;
        }
      }

      if (line.includes('✅') || line.includes('❌')) {
        const testResult = {
          timestamp: moment().toISOString(),
          result: line.trim(),
          success: line.includes('✅')
        };

        this.testingState.testResults.push(testResult);
        if (this.testingState.testResults.length > 50) {
          this.testingState.testResults = this.testingState.testResults.slice(-50);
        }
      }
    }

    this.testingState.lastUpdate = moment().toISOString();
    this.broadcast('progressUpdate', {
      progress: this.testingState.totalProgress,
      successRate: this.testingState.successRate,
      results: this.testingState.testResults.slice(-10)
    });
  }

  pauseTesting() {
    this.testingState.isPaused = !this.testingState.isPaused;
    this.broadcast('testingPaused', { isPaused: this.testingState.isPaused });
  }

  stopTesting() {
    this.testingState.isRunning = false;
    this.testingState.isPaused = false;

    if (this.testProcess) {
      this.testProcess.kill('SIGTERM');
      this.testProcess = null;
    }

    this.broadcast('testingStopped', this.testingState);
  }

  async checkPortStatus() {
    for (const [key, port] of Object.entries(this.testingState.monitoredPorts)) {
      try {
        await this.testPortConnectivity(port.port);
        this.testingState.monitoredPorts[key].status = 'healthy';
      } catch (error) {
        this.testingState.monitoredPorts[key].status = 'unhealthy';
      }
    }

    this.broadcast('portsUpdate', this.testingState.monitoredPorts);
  }

  async discoverProject() {
    try {
      const projectRoot = this.findProjectRoot();
      const features = [];

      // Discover package.json files
      const packageFiles = await this.findFiles(projectRoot, '**/package.json');
      for (const file of packageFiles) {
        const pkg = await fs.readJSON(file);
        features.push({
          type: 'service',
          name: pkg.name || 'Unknown Service',
          path: path.dirname(file),
          scripts: Object.keys(pkg.scripts || {})
        });
      }

      // Discover Docker Compose services
      const composeFiles = await this.findFiles(projectRoot, '**/docker-compose*.yml');
      for (const file of composeFiles) {
        const content = await fs.readFile(file, 'utf8');
        const services = this.parseDockerComposeServices(content);
        features.push(...services);
      }

      // Discover API endpoints
      const apiEndpoints = await this.discoverAPIEndpoints(projectRoot);
      features.push(...apiEndpoints);

      this.testingState.discoveredFeatures = features;
      this.broadcast('featuresDiscovered', features);

    } catch (error) {
      console.error('Project discovery failed:', error);
    }
  }

  findProjectRoot() {
    let currentDir = process.cwd();

    // Look for common project indicators
    while (currentDir !== path.dirname(currentDir)) {
      const indicators = ['package.json', 'docker-compose.yml', '.git'];

      for (const indicator of indicators) {
        if (fs.existsSync(path.join(currentDir, indicator))) {
          return currentDir;
        }
      }

      currentDir = path.dirname(currentDir);
    }

    return process.cwd();
  }

  async findFiles(dir, pattern) {
    try {
      const files = await glob(pattern, { cwd: dir, absolute: true });
      return files || [];
    } catch (error) {
      console.warn('File search failed:', error.message);
      return [];
    }
  }

  parseDockerComposeServices(content) {
    const services = [];
    const lines = content.split('\n');
    let currentService = null;

    for (const line of lines) {
      const serviceMatch = line.match(/^\s*([a-zA-Z0-9-_]+):\s*$/);
      if (serviceMatch && !line.includes('version:') && !line.includes('volumes:')) {
        currentService = serviceMatch[1];
        continue;
      }

      if (currentService && line.includes('ports:')) {
        // Extract port information
        const portMatch = line.match(/["']?(\d+):(\d+)["']?/);
        if (portMatch) {
          services.push({
            type: 'docker-service',
            name: currentService,
            port: parseInt(portMatch[1]),
            containerPort: parseInt(portMatch[2])
          });
        }
      }
    }

    return services;
  }

  async discoverAPIEndpoints(projectRoot) {
    const endpoints = [];

    try {
      // Look for route files
      const routeFiles = await this.findFiles(projectRoot, '**/routes/**/*.js');
      const apiFiles = await this.findFiles(projectRoot, '**/api/**/*.js');

      const allFiles = [...routeFiles, ...apiFiles];

      for (const file of allFiles) {
        const content = await fs.readFile(file, 'utf8');
        const routes = this.extractRoutes(content);
        endpoints.push(...routes.map(route => ({
          type: 'api-endpoint',
          method: route.method,
          path: route.path,
          file: file
        })));
      }
    } catch (error) {
      console.warn('API discovery failed:', error.message);
    }

    return endpoints;
  }

  extractRoutes(content) {
    const routes = [];
    const routeRegex = /router\.(get|post|put|delete|patch)\s*\(\s*['"`]([^'"`]+)['"`]/g;
    let match;

    while ((match = routeRegex.exec(content)) !== null) {
      routes.push({
        method: match[1].toUpperCase(),
        path: match[2]
      });
    }

    return routes;
  }

  startDiscoveryWatcher() {
    const projectRoot = this.findProjectRoot();

    this.watcher = chokidar.watch([
      path.join(projectRoot, '**/package.json'),
      path.join(projectRoot, '**/docker-compose*.yml')
    ], {
      ignored: /node_modules/,
      persistent: true
    });

    this.watcher.on('change', () => {
      if (this.testingState.autoOptions.autoRefreshScope) {
        console.log(chalk.blue('📱 Auto-refreshing project scope...'));
        this.discoverProject();
      }
    });
  }

  saveBacklog() {
    const backlog = {
      timestamp: moment().toISOString(),
      project: this.testingState.currentProject,
      testResults: this.testingState.testResults,
      errors: this.testingState.errors,
      successRate: this.testingState.successRate,
      iterations: this.testingState.currentIteration,
      discoveredFeatures: this.testingState.discoveredFeatures
    };

    const backlogDir = path.join(__dirname, 'backlogs');
    fs.ensureDirSync(backlogDir);

    const filename = `backlog_${moment().format('YYYYMMDD_HHmmss')}.json`;
    const filepath = path.join(backlogDir, filename);

    fs.writeJSON(filepath, backlog, { spaces: 2 });

    this.testingState.backlog.push({
      filename,
      timestamp: backlog.timestamp,
      successRate: backlog.successRate
    });

    console.log(chalk.green(`💾 Backlog saved: ${filename}`));
  }

  generateLogFile() {
    const logContent = {
      project: this.testingState.currentProject,
      timestamp: moment().toISOString(),
      summary: {
        totalProgress: this.testingState.totalProgress,
        successRate: this.testingState.successRate,
        iterations: this.testingState.currentIteration,
        errors: this.testingState.errors.length
      },
      testResults: this.testingState.testResults,
      errors: this.testingState.errors,
      monitoredPorts: this.testingState.monitoredPorts,
      discoveredFeatures: this.testingState.discoveredFeatures
    };

    const logsDir = path.join(__dirname, 'logs');
    fs.ensureDirSync(logsDir);

    const filename = `tester_log_${moment().format('YYYYMMDD_HHmmss')}.json`;
    const filepath = path.join(logsDir, filename);

    fs.writeJSON(filepath, logContent, { spaces: 2 });
    return filepath;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  start() {
    this.server.listen(this.port, () => {
      console.log(chalk.blue.bold('\n🎯 TESTER AGENT DASHBOARD STARTED'));
      console.log(chalk.cyan(`📊 Dashboard: http://localhost:${this.port}`));
      console.log(chalk.green(`🔧 API: http://localhost:${this.port}/api`));
      console.log(chalk.yellow('🚀 Ready to test any project!\n'));
    });

    // Start port monitoring
    setInterval(() => {
      this.checkPortStatus();
    }, 30000);

    // Auto-discover project on startup
    setTimeout(() => {
      this.discoverProject();
    }, 2000);
  }
}

// Start the dashboard
const dashboard = new TesterDashboard();
dashboard.start();

module.exports = TesterDashboard;