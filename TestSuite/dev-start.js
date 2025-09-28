/**
 * TESTER Development Startup
 * Quick start for development without Docker dependencies
 */

const express = require('express');
const path = require('path');
const chalk = require('chalk');

const app = express();
const port = 8888;

// Serve static files
app.use(express.static(path.join(__dirname, 'src', 'ui', 'public')));
app.use(express.json());

// Mock API endpoints for development
app.get('/api/status', (req, res) => {
    res.json({
        projectName: 'OrçamentosOnline (Dev Mode)',
        targetUrl: 'http://localhost:3001',
        isRunning: false,
        currentSession: null,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        subsystems: {
            database: false,
            discovery: true,
            stressRunner: { status: 'idle' },
            monitoring: { status: 'idle' },
            claude: { connected: false }
        }
    });
});

app.post('/api/session/start', (req, res) => {
    console.log(chalk.blue('Mock: Starting test session'), req.body);
    res.json({
        success: true,
        session: {
            sessionId: `dev_session_${Date.now()}`,
            status: 'running'
        }
    });
});

app.post('/api/session/pause', (req, res) => {
    console.log(chalk.yellow('Mock: Pausing test session'));
    res.json({ success: true });
});

app.post('/api/session/stop', (req, res) => {
    console.log(chalk.red('Mock: Stopping test session'));
    res.json({ success: true });
});

app.get('/api/discovery', (req, res) => {
    console.log(chalk.blue('Mock: Running discovery'));
    res.json({
        pages: [
            { url: 'http://localhost:3001', title: 'Home Page' },
            { url: 'http://localhost:3001/clients', title: 'Clients Page' }
        ],
        elements: [
            { selector: 'button', text: 'Login', type: 'button' },
            { selector: 'input[type="email"]', text: '', type: 'email' }
        ],
        forms: [
            { selector: 'form', action: '/login', method: 'post' }
        ],
        flows: [
            { type: 'authentication', name: 'Login Flow' }
        ],
        apis: []
    });
});

// Socket.IO mock (simplified)
const { Server } = require('socket.io');
const http = require('http');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', (socket) => {
    console.log(chalk.green('🔌 Client connected to development server'));

    socket.emit('projectInfo', {
        name: 'OrçamentosOnline (Development Mode)',
        targetUrl: 'http://localhost:3001',
        timestamp: new Date().toISOString()
    });

    socket.on('requestStatus', () => {
        socket.emit('statusUpdate', {
            projectName: 'OrçamentosOnline (Dev)',
            isRunning: false,
            subsystems: {
                database: false,
                discovery: true,
                stressRunner: { status: 'idle' },
                monitoring: { status: 'idle' },
                claude: { connected: false }
            }
        });
    });

    socket.on('disconnect', () => {
        console.log(chalk.yellow('🔌 Client disconnected'));
    });
});

server.listen(port, () => {
    console.log(chalk.green.bold(`
🤖 TESTER Development Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Dashboard: http://localhost:${port}
🎯 Mode: Development (Mock APIs)
🔧 Status: Ready for testing

Note: This is a development server with mock APIs.
For full functionality, wait for Docker build to complete.
    `));
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log(chalk.yellow('\n⏹️ Shutting down development server...'));
    server.close(() => {
        console.log(chalk.green('✅ Development server shut down'));
        process.exit(0);
    });
});