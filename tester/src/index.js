/**
 * TESTER - Autonomous Stress Testing System
 * Main Entry Point
 */

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const chalk = require('chalk');
const moment = require('moment');

// Import TESTER modules
const Discovery = require('./discovery/discover');
const StressRunner = require('./stress/stressRunner');
const MonitoringSystem = require('./monitoring/monitoringSystem');
const ReportingEngine = require('./reporting/reportingEngine');
const ClaudeIntegration = require('./claude-integration/claudeInterface');
const DatabaseManager = require('./database/databaseManager');
const ActivityLogger = require('./logging/activityLogger');

class TesterMain {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });

        this.port = process.env.TESTER_PORT || 8888;
        this.projectName = process.env.PROJECT_NAME || 'Unknown Project';
        this.targetUrl = process.env.TARGET_URL || 'http://localhost:3000';

        // Initialize subsystems
        this.activityLogger = new ActivityLogger();
        this.db = new DatabaseManager();
        this.discovery = new Discovery(this.db);
        this.stressRunner = new StressRunner(this.db, this.io);
        this.monitoring = new MonitoringSystem(this.db, this.io);
        this.reporting = new ReportingEngine(this.db);
        this.claude = new ClaudeIntegration(this.db, this.io);

        this.currentSession = null;
        this.isRunning = false;

        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
    }

    setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(express.static(path.join(__dirname, 'ui', 'public')));
    }

    setupRoutes() {
        // Dashboard UI
        this.app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'ui', 'public', 'index.html'));
        });

        // Favicon handler to prevent 404 errors
        this.app.get('/favicon.ico', (req, res) => {
            // Simple 1x1 transparent PNG
            const transparentPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAFLy6UJSQAAAABJRU5ErkJggg==', 'base64');
            res.set('Content-Type', 'image/png');
            res.set('Cache-Control', 'public, max-age=86400');
            res.send(transparentPng);
        });

        // API Routes
        this.app.get('/api/status', async (req, res) => {
            try {
                const status = await this.getSystemStatus();
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/session/start', async (req, res) => {
            try {
                const config = req.body;
                const session = await this.startTestSession(config);
                res.json({ success: true, session });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/session/pause', async (req, res) => {
            try {
                await this.pauseTestSession();
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/session/stop', async (req, res) => {
            try {
                await this.stopTestSession();
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/discovery', async (req, res) => {
            try {
                const coverage = await this.discovery.discoverApplication(this.targetUrl);
                res.json(coverage);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/reports/:sessionId', async (req, res) => {
            try {
                const report = await this.reporting.generateReport(req.params.sessionId);
                res.json(report);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/reports/:sessionId/download', async (req, res) => {
            try {
                const reportPath = await this.reporting.generateDownloadableReport(req.params.sessionId);
                res.download(reportPath);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Claude Integration Routes
        this.app.post('/api/claude/analyze', async (req, res) => {
            try {
                const { sessionId } = req.body;
                const analysis = await this.claude.analyzeSession(sessionId);
                res.json(analysis);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/claude/fix', async (req, res) => {
            try {
                const { issueId } = req.body;
                const fix = await this.claude.applyFix(issueId);
                res.json(fix);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/claude/autonomous', async (req, res) => {
            try {
                const { enabled, sessionId } = req.body;
                await this.claude.setAutonomousMode(enabled, sessionId);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Activity Logger Routes for Claude Integration
        this.app.get('/api/activity/summary', async (req, res) => {
            try {
                const summary = await this.activityLogger.getCurrentActivitySummary();
                res.set('Content-Type', 'text/markdown');
                res.send(summary);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.get('/api/activity/log', async (req, res) => {
            try {
                const lines = parseInt(req.query.lines) || 50;
                const log = await this.activityLogger.getActivityLog(lines);
                res.set('Content-Type', 'text/plain');
                res.send(log);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(chalk.green('🔌 Dashboard client connected'));

            socket.emit('projectInfo', {
                name: this.projectName,
                targetUrl: this.targetUrl,
                timestamp: moment().toISOString()
            });

            socket.on('requestStatus', async () => {
                try {
                    const status = await this.getSystemStatus();
                    socket.emit('statusUpdate', status);
                } catch (error) {
                    console.error(chalk.red('❌ Failed to get system status:'), error);
                    socket.emit('statusUpdate', {
                        error: error.message,
                        projectName: this.projectName,
                        targetUrl: this.targetUrl,
                        isRunning: false
                    });
                }
            });

            socket.on('disconnect', () => {
                console.log(chalk.yellow('🔌 Dashboard client disconnected'));
            });
        });
    }

    async getSystemStatus() {
        try {
            const subsystems = {};

            // Safely check each subsystem
            try {
                subsystems.database = await this.db.isHealthy();
            } catch (e) {
                subsystems.database = false;
            }

            try {
                subsystems.discovery = this.discovery && typeof this.discovery.isReady === 'function' ? this.discovery.isReady() : false;
            } catch (e) {
                subsystems.discovery = false;
            }

            try {
                subsystems.stressRunner = this.stressRunner && typeof this.stressRunner.getStatus === 'function' ? this.stressRunner.getStatus() : { status: 'idle' };
            } catch (e) {
                subsystems.stressRunner = { status: 'error' };
            }

            try {
                subsystems.monitoring = this.monitoring && typeof this.monitoring.getStatus === 'function' ? this.monitoring.getStatus() : { status: 'idle' };
            } catch (e) {
                subsystems.monitoring = { status: 'error' };
            }

            try {
                subsystems.claude = this.claude && typeof this.claude.getStatus === 'function' ? this.claude.getStatus() : { connected: false };
            } catch (e) {
                subsystems.claude = { connected: false };
            }

            return {
                projectName: this.projectName,
                targetUrl: this.targetUrl,
                isRunning: this.isRunning,
                currentSession: this.currentSession,
                timestamp: moment().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                subsystems
            };
        } catch (error) {
            console.error(chalk.red('❌ System status check failed:'), error);
            return {
                projectName: this.projectName,
                targetUrl: this.targetUrl,
                isRunning: false,
                currentSession: null,
                timestamp: moment().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                error: error.message,
                subsystems: {
                    database: false,
                    discovery: false,
                    stressRunner: { status: 'error' },
                    monitoring: { status: 'error' },
                    claude: { connected: false }
                }
            };
        }
    }

    async startTestSession(config) {
        if (this.isRunning) {
            throw new Error('Test session already running');
        }

        this.isRunning = true;
        const sessionId = `session_${Date.now()}`;

        this.currentSession = await this.db.createSession({
            sessionId,
            projectName: this.projectName,
            config,
            status: 'running'
        });

        console.log(chalk.blue(`🚀 Starting test session: ${sessionId}`));

        // Log session start
        await this.activityLogger.logSessionStart(sessionId, config);

        // Start discovery phase
        const coverage = await this.discovery.discoverApplication(this.targetUrl, sessionId);
        await this.activityLogger.logDiscovery(this.targetUrl, coverage);

        // Start monitoring
        await this.monitoring.startMonitoring(sessionId);

        // Start stress testing
        await this.stressRunner.startStressTesting(sessionId, coverage, config);

        // If Claude autonomous mode is enabled, start it
        if (config.claudeAutonomous) {
            await this.claude.startAutonomousMode(sessionId);
        }

        this.io.emit('sessionStarted', this.currentSession);
        return this.currentSession;
    }

    async pauseTestSession() {
        if (!this.isRunning) {
            throw new Error('No test session running');
        }

        await this.stressRunner.pause();
        this.io.emit('sessionPaused');
        console.log(chalk.yellow('⏸️ Test session paused'));
    }

    async stopTestSession() {
        if (!this.isRunning) {
            throw new Error('No test session running');
        }

        this.isRunning = false;

        await this.stressRunner.stop();
        await this.monitoring.stopMonitoring();
        await this.claude.stopAutonomousMode();

        let sessionResults = null;
        if (this.currentSession) {
            await this.db.updateSession(this.currentSession.sessionId, {
                status: 'completed',
                endTime: new Date()
            });

            // Get final session results for logging
            sessionResults = await this.getSystemStatus();
            await this.activityLogger.logSessionEnd(this.currentSession.sessionId, sessionResults);
        }

        this.io.emit('sessionStopped');
        console.log(chalk.green('⏹️ Test session stopped'));

        this.currentSession = null;
    }

    async initialize() {
        try {
            console.log(chalk.blue.bold('\n🤖 TESTER - Autonomous Stress Testing System'));
            console.log(chalk.cyan(`📊 Project: ${this.projectName}`));
            console.log(chalk.cyan(`🌐 Target: ${this.targetUrl}`));
            console.log(chalk.cyan(`📡 Dashboard: http://localhost:${this.port}`));

            // Initialize database
            await this.db.initialize();
            console.log(chalk.green('✅ Database initialized'));

            // Initialize subsystems
            await this.discovery.initialize();
            await this.stressRunner.initialize();
            await this.monitoring.initialize();
            await this.reporting.initialize();
            await this.claude.initialize();

            console.log(chalk.green('✅ All subsystems initialized'));

        } catch (error) {
            console.error(chalk.red('❌ Initialization failed:'), error);
            throw error;
        }
    }

    async start() {
        await this.initialize();

        this.server.listen(this.port, () => {
            console.log(chalk.green.bold(`\n🎯 TESTER Dashboard running on http://localhost:${this.port}`));
            console.log(chalk.yellow('🚀 Ready for autonomous stress testing!'));
            console.log(chalk.gray('───────────────────────────────────────────────\n'));
        });
    }
}

// Start TESTER if this is the main module
if (require.main === module) {
    const tester = new TesterMain();

    tester.start().catch(error => {
        console.error(chalk.red('💥 TESTER failed to start:'), error);
        process.exit(1);
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n⏹️ Shutting down TESTER...'));
        if (tester.isRunning) {
            await tester.stopTestSession();
        }
        process.exit(0);
    });
}

module.exports = TesterMain;