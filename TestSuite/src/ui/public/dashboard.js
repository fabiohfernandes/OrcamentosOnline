/**
 * TESTER Dashboard JavaScript
 * Real-time WebSocket Communication and UI Control
 */

class TesterDashboard {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentSession = null;
        this.metrics = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            activeUsers: 0,
            progress: 0
        };

        this.initializeSocket();
        this.bindEventListeners();
        this.startPeriodicUpdates();
    }

    initializeSocket() {
        try {
            this.socket = io();

            this.socket.on('connect', () => {
                this.handleConnection();
            });

            this.socket.on('disconnect', () => {
                this.handleDisconnection();
            });

            this.socket.on('projectInfo', (data) => {
                this.updateProjectInfo(data);
            });

            this.socket.on('statusUpdate', (status) => {
                this.updateSystemStatus(status);
            });

            this.socket.on('sessionStarted', (session) => {
                this.handleSessionStarted(session);
            });

            this.socket.on('sessionPaused', () => {
                this.handleSessionPaused();
            });

            this.socket.on('sessionStopped', () => {
                this.handleSessionStopped();
            });

            this.socket.on('testResult', (result) => {
                this.handleTestResult(result);
            });

            this.socket.on('metricsUpdate', (metrics) => {
                this.updateMetrics(metrics);
            });

            this.socket.on('issueDetected', (issue) => {
                this.handleIssueDetected(issue);
            });

            this.socket.on('logEntry', (entry) => {
                this.addLogEntry(entry);
            });

        } catch (error) {
            console.error('Socket initialization failed:', error);
            this.addLogEntry({
                type: 'error',
                message: `Socket connection failed: ${error.message}`,
                timestamp: new Date()
            });
        }
    }

    bindEventListeners() {
        // Control buttons (start/stop removed - managed by scripts)
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseTesting());
        document.getElementById('discoveryBtn').addEventListener('click', () => this.runDiscovery());
        document.getElementById('emergencyStop').addEventListener('click', () => this.emergencyStop());

        // Log controls
        document.getElementById('clearLogBtn').addEventListener('click', () => this.clearLog());
        document.getElementById('downloadLogBtn').addEventListener('click', () => this.downloadLog());

        // Issues controls
        document.getElementById('analyzeAllBtn').addEventListener('click', () => this.analyzeAllIssues());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.startTesting();
                        break;
                    case 'p':
                        e.preventDefault();
                        this.pauseTesting();
                        break;
                    case 'x':
                        e.preventDefault();
                        this.stopTesting();
                        break;
                    case 'd':
                        e.preventDefault();
                        this.runDiscovery();
                        break;
                }
            }
        });
    }

    startPeriodicUpdates() {
        // Request status updates every 5 seconds
        setInterval(() => {
            if (this.isConnected) {
                this.socket.emit('requestStatus');
            }
        }, 5000);

        // Update UI timestamps
        setInterval(() => {
            this.updateTimestamps();
        }, 1000);
    }

    handleConnection() {
        this.isConnected = true;
        this.updateConnectionStatus('connected', 'Connected');
        this.addLogEntry({
            type: 'success',
            message: 'Connected to TESTER server',
            timestamp: new Date()
        });

        // Request initial status
        this.socket.emit('requestStatus');
    }

    handleDisconnection() {
        this.isConnected = false;
        this.updateConnectionStatus('disconnected', 'Disconnected');
        this.addLogEntry({
            type: 'error',
            message: 'Disconnected from TESTER server',
            timestamp: new Date()
        });
    }

    updateConnectionStatus(status, text) {
        const statusElement = document.getElementById('connectionStatus');
        statusElement.className = `connection-status ${status}`;
        statusElement.querySelector('span').textContent = text;
    }

    updateProjectInfo(data) {
        document.getElementById('projectName').textContent = data.name;

        // Update target URL input
        if (data.targetUrl) {
            document.getElementById('targetUrl').value = data.targetUrl;
        }

        this.addLogEntry({
            type: 'info',
            message: `Project: ${data.name} | Target: ${data.targetUrl}`,
            timestamp: new Date(data.timestamp)
        });
    }

    updateSystemStatus(status) {
        // Update database status
        const dbStatus = document.getElementById('dbStatus');
        if (status.subsystems?.database) {
            dbStatus.textContent = 'Healthy';
            dbStatus.className = 'status-value healthy';
        } else {
            dbStatus.textContent = 'Error';
            dbStatus.className = 'status-value error';
        }

        // Update discovery status
        const discoveryStatus = document.getElementById('discoveryStatus');
        if (status.subsystems?.discovery) {
            discoveryStatus.textContent = 'Ready';
            discoveryStatus.className = 'status-value healthy';
        } else {
            discoveryStatus.textContent = 'Not Ready';
            discoveryStatus.className = 'status-value warning';
        }

        // Update stress runner status
        const stressStatus = document.getElementById('stressStatus');
        const stressRunnerStatus = status.subsystems?.stressRunner;
        if (stressRunnerStatus?.status === 'running') {
            stressStatus.textContent = 'Running';
            stressStatus.className = 'status-value healthy';
        } else if (stressRunnerStatus?.status === 'paused') {
            stressStatus.textContent = 'Paused';
            stressStatus.className = 'status-value warning';
        } else {
            stressStatus.textContent = 'Idle';
            stressStatus.className = 'status-value';
        }

        // Update Claude status
        const claudeStatus = document.getElementById('claudeStatus');
        const claudeSystemStatus = status.subsystems?.claude;
        if (claudeSystemStatus?.connected) {
            claudeStatus.textContent = 'Connected';
            claudeStatus.className = 'status-value healthy';
        } else {
            claudeStatus.textContent = 'Offline';
            claudeStatus.className = 'status-value warning';
        }

        // Update button states
        this.updateButtonStates(status.isRunning);
    }

    updateButtonStates(isRunning) {
        const pauseBtn = document.getElementById('pauseBtn');

        if (isRunning) {
            pauseBtn.disabled = false;
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Testing';
        } else {
            pauseBtn.disabled = true;
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause Testing';
        }
    }

    // Start testing is now managed by start-test.sh script

    async pauseTesting() {
        try {
            const response = await fetch('/api/session/pause', { method: 'POST' });
            const result = await response.json();

            if (result.success) {
                this.addLogEntry({
                    type: 'warning',
                    message: 'Testing session paused',
                    timestamp: new Date()
                });
            }
        } catch (error) {
            this.addLogEntry({
                type: 'error',
                message: `Failed to pause testing: ${error.message}`,
                timestamp: new Date()
            });
        }
    }

    // Stop testing is now managed by stop-test.sh script

    async runDiscovery() {
        try {
            this.showModal('discoveryModal');

            const targetUrl = document.getElementById('targetUrl').value;
            const response = await fetch('/api/discovery');
            const coverage = await response.json();

            this.displayDiscoveryResults(coverage);

            this.addLogEntry({
                type: 'info',
                message: `Discovery completed: ${coverage.pages?.length || 0} pages, ${coverage.elements?.length || 0} elements found`,
                timestamp: new Date()
            });

        } catch (error) {
            this.addLogEntry({
                type: 'error',
                message: `Discovery failed: ${error.message}`,
                timestamp: new Date()
            });
        }
    }

    displayDiscoveryResults(coverage) {
        const resultsContainer = document.getElementById('discoveryResults');

        resultsContainer.innerHTML = `
            <div class="discovery-summary">
                <h4>Discovery Summary</h4>
                <div class="discovery-stats">
                    <div class="stat-item">
                        <span class="stat-label">Pages:</span>
                        <span class="stat-value">${coverage.pages?.length || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Interactive Elements:</span>
                        <span class="stat-value">${coverage.elements?.length || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Forms:</span>
                        <span class="stat-value">${coverage.forms?.length || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">API Endpoints:</span>
                        <span class="stat-value">${coverage.apis?.length || 0}</span>
                    </div>
                </div>
            </div>

            <div class="discovery-details">
                <h4>Discovered Flows</h4>
                <div class="flows-list">
                    ${coverage.flows?.map(flow => `
                        <div class="flow-item">
                            <span class="flow-type">${flow.type}</span>
                            <span class="flow-name">${flow.name}</span>
                        </div>
                    `).join('') || '<p>No flows detected</p>'}
                </div>
            </div>
        `;
    }

    emergencyStop() {
        if (confirm('Emergency stop will immediately halt all testing. Continue?')) {
            this.stopTesting();
            this.addLogEntry({
                type: 'warning',
                message: 'EMERGENCY STOP activated',
                timestamp: new Date()
            });
        }
    }

    handleSessionStarted(session) {
        this.currentSession = session;
        this.addLogEntry({
            type: 'success',
            message: `Session ${session.sessionId} started`,
            timestamp: new Date()
        });
    }

    handleSessionPaused() {
        this.addLogEntry({
            type: 'warning',
            message: 'Session paused',
            timestamp: new Date()
        });
    }

    handleSessionStopped() {
        this.currentSession = null;
        this.addLogEntry({
            type: 'info',
            message: 'Session stopped',
            timestamp: new Date()
        });
    }

    handleTestResult(result) {
        if (result.status === 'passed') {
            this.metrics.passedTests++;
        } else {
            this.metrics.failedTests++;
        }
        this.metrics.totalTests++;

        this.updateMetricsDisplay();

        this.addLogEntry({
            type: result.status === 'passed' ? 'success' : 'error',
            message: `Test ${result.testName}: ${result.status} (${result.durationMs}ms)`,
            timestamp: new Date()
        });
    }

    updateMetrics(metrics) {
        this.metrics = { ...this.metrics, ...metrics };
        this.updateMetricsDisplay();
    }

    updateMetricsDisplay() {
        document.getElementById('testsPassed').textContent = this.metrics.passedTests;
        document.getElementById('testsFailed').textContent = this.metrics.failedTests;
        document.getElementById('totalTests').textContent = this.metrics.totalTests;
        document.getElementById('activeUsers').textContent = this.metrics.activeUsers;
        document.getElementById('testProgress').textContent = `${this.metrics.progress}%`;

        // Update progress bar
        const progressFill = document.getElementById('progressFill');
        progressFill.style.width = `${this.metrics.progress}%`;

        // Calculate success rate
        const successRate = this.metrics.totalTests > 0
            ? Math.round((this.metrics.passedTests / this.metrics.totalTests) * 100)
            : 100;
        document.getElementById('successRate').textContent = `${successRate}%`;
    }

    resetMetrics() {
        this.metrics = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            activeUsers: 0,
            progress: 0
        };
        this.updateMetricsDisplay();
    }

    handleIssueDetected(issue) {
        this.addIssueToList(issue);
        this.updateIssueStats();

        this.addLogEntry({
            type: 'warning',
            message: `Issue detected: ${issue.title} (${issue.severity})`,
            timestamp: new Date()
        });
    }

    addIssueToList(issue) {
        const issuesList = document.getElementById('issuesList');

        // Remove "no issues" message if present
        const noIssues = issuesList.querySelector('.no-issues');
        if (noIssues) {
            noIssues.remove();
        }

        const issueElement = document.createElement('div');
        issueElement.className = 'issue-item slide-in';
        issueElement.innerHTML = `
            <div class="issue-header">
                <span class="issue-title">${issue.title}</span>
                <span class="issue-severity ${issue.severity}">${issue.severity.toUpperCase()}</span>
            </div>
            <div class="issue-description">${issue.description || 'No description available'}</div>
            <div class="issue-meta">
                <span>Page: ${issue.pageUrl || 'Unknown'}</span>
                <span>First seen: ${new Date(issue.firstSeen).toLocaleTimeString()}</span>
            </div>
        `;

        issuesList.appendChild(issueElement);
    }

    updateIssueStats() {
        // This would be updated from server data in a real implementation
        const openIssues = document.querySelectorAll('.issue-item').length;
        document.getElementById('openIssues').textContent = openIssues;
    }

    async analyzeAllIssues() {
        try {
            if (!this.currentSession) {
                throw new Error('No active session');
            }

            const response = await fetch('/api/claude/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: this.currentSession.sessionId })
            });

            const analysis = await response.json();

            this.addLogEntry({
                type: 'info',
                message: `Claude analysis completed: ${analysis.issuesAnalyzed || 0} issues processed`,
                timestamp: new Date()
            });

        } catch (error) {
            this.addLogEntry({
                type: 'error',
                message: `Analysis failed: ${error.message}`,
                timestamp: new Date()
            });
        }
    }

    addLogEntry(entry) {
        const logContainer = document.getElementById('logContainer');
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${entry.type} slide-in`;

        const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();
        const timeString = timestamp.toLocaleTimeString();

        logEntry.innerHTML = `
            <span class="log-time">[${timeString}]</span>
            <span class="log-message">${entry.message}</span>
        `;

        logContainer.appendChild(logEntry);
        logContainer.scrollTop = logContainer.scrollHeight;

        // Limit log entries to prevent memory issues
        const entries = logContainer.querySelectorAll('.log-entry');
        if (entries.length > 1000) {
            entries[0].remove();
        }
    }

    clearLog() {
        const logContainer = document.getElementById('logContainer');
        logContainer.innerHTML = `
            <div class="log-entry info">
                <span class="log-time">[${new Date().toLocaleTimeString()}]</span>
                <span class="log-message">Log cleared</span>
            </div>
        `;
    }

    downloadLog() {
        const logEntries = document.querySelectorAll('.log-entry');
        const logData = Array.from(logEntries).map(entry => {
            const time = entry.querySelector('.log-time').textContent;
            const message = entry.querySelector('.log-message').textContent;
            return `${time} ${message}`;
        }).join('\n');

        const blob = new Blob([logData], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tester-log-${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.add('active');
    }

    updateTimestamps() {
        // Update any relative timestamps in the UI
        const timeElements = document.querySelectorAll('[data-timestamp]');
        timeElements.forEach(element => {
            const timestamp = parseInt(element.dataset.timestamp);
            const now = Date.now();
            const diff = now - timestamp;
            element.textContent = this.formatTimeAgo(diff);
        });
    }

    formatTimeAgo(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);

        if (hours > 0) return `${hours}h ago`;
        if (minutes > 0) return `${minutes}m ago`;
        return `${seconds}s ago`;
    }
}

// Global modal control function
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.testerDashboard = new TesterDashboard();
});

// Error handling for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.testerDashboard) {
        window.testerDashboard.addLogEntry({
            type: 'error',
            message: `Unhandled error: ${event.reason.message || event.reason}`,
            timestamp: new Date()
        });
    }
});