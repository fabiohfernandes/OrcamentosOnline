/**
 * TESTER - Professional Autonomous Testing Dashboard
 * Real-time WebSocket Communication and UI Control
 */

class TesterDashboard {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.currentSession = null;
        this.sessionStartTime = null;
        this.metrics = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            virtualUsers: 0,
            completedTests: 0,
            discoveredItems: 0,
            claudeMode: 'Real-time',
            estimatedTime: 'Calculating...'
        };
        this.systemStatus = {
            database: false,
            discovery: false,
            stressRunner: false,
            claudeAi: false
        };

        this.initializeSocket();
        this.bindEventListeners();
        this.startPeriodicUpdates();
        this.loadConfigurationData();
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
        // Log controls
        const downloadLogBtn = document.getElementById('downloadLogBtn');
        if (downloadLogBtn) {
            downloadLogBtn.addEventListener('click', () => this.downloadLog());
        }

        // Issues controls
        const analyzeAllBtn = document.getElementById('analyzeAllBtn');
        if (analyzeAllBtn) {
            analyzeAllBtn.addEventListener('click', () => this.analyzeAllIssues());
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'd':
                        e.preventDefault();
                        this.downloadLog();
                        break;
                    case 'a':
                        e.preventDefault();
                        this.analyzeAllIssues();
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
        document.getElementById('projectName').textContent = data.name || 'Loading...';
        document.getElementById('sessionName').textContent = data.sessionName || 'Loading...';
        document.getElementById('targetUrl').textContent = data.targetUrl || 'Loading...';

        this.addLogEntry({
            type: 'info',
            message: `Project: ${data.name} | Session: ${data.sessionName} | Target: ${data.targetUrl}`,
            timestamp: new Date(data.timestamp)
        });
    }

    updateSystemStatus(status) {
        // Update database status
        const databaseStatus = document.getElementById('databaseStatus');
        const databaseStatusText = document.getElementById('databaseStatusText');
        if (status.subsystems?.database) {
            databaseStatus.className = 'status-icon healthy';
            databaseStatusText.textContent = 'Healthy';
            this.systemStatus.database = true;
        } else {
            databaseStatus.className = 'status-icon unhealthy';
            databaseStatusText.textContent = 'Error';
            this.systemStatus.database = false;
        }

        // Update discovery status with discovered items count
        const discoveryStatus = document.getElementById('discoveryStatus');
        const discoveryStatusText = document.getElementById('discoveryStatusText');
        if (status.subsystems?.discovery) {
            discoveryStatus.className = 'status-icon running';
            const itemCount = status.discoveredItems || this.metrics.discoveredItems || 0;
            discoveryStatusText.textContent = `${itemCount} items`;
            this.systemStatus.discovery = true;
        } else {
            discoveryStatus.className = 'status-icon offline';
            discoveryStatusText.textContent = 'Not Ready';
            this.systemStatus.discovery = false;
        }

        // Update stress runner status
        const stressRunnerStatus = document.getElementById('stressRunnerStatus');
        const stressRunnerStatusText = document.getElementById('stressRunnerStatusText');
        const stressSystemStatus = status.subsystems?.stressRunner;
        if (stressSystemStatus?.status === 'running') {
            stressRunnerStatus.className = 'status-icon running';
            stressRunnerStatusText.textContent = 'Running';
            this.systemStatus.stressRunner = true;
        } else if (stressSystemStatus?.status === 'paused') {
            stressRunnerStatus.className = 'status-icon unhealthy';
            stressRunnerStatusText.textContent = 'Paused';
            this.systemStatus.stressRunner = false;
        } else {
            stressRunnerStatus.className = 'status-icon offline';
            stressRunnerStatusText.textContent = 'Stopped';
            this.systemStatus.stressRunner = false;
        }

        // Update Claude AI status
        const claudeAiStatus = document.getElementById('claudeAiStatus');
        const claudeAiStatusText = document.getElementById('claudeAiStatusText');
        const claudeSystemStatus = status.subsystems?.claude;
        if (claudeSystemStatus?.connected) {
            claudeAiStatus.className = 'status-icon healthy';
            claudeAiStatusText.textContent = 'Online';
            this.systemStatus.claudeAi = true;
        } else {
            claudeAiStatus.className = 'status-icon offline';
            claudeAiStatusText.textContent = 'Offline';
            this.systemStatus.claudeAi = false;
        }
    }

    // Professional dashboard methods - testing is managed by scripts

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
        this.metrics.completedTests = this.metrics.passedTests + this.metrics.failedTests;

        this.updateMetricsDisplay();

        this.addLogEntry({
            type: result.status === 'passed' ? 'success' : 'error',
            message: `Test ${result.testName}: ${result.status} (${result.durationMs}ms)`,
            timestamp: new Date()
        });
    }

    updateMetrics(metrics) {
        this.metrics = { ...this.metrics, ...metrics };

        // Update completed tests count
        this.metrics.completedTests = this.metrics.passedTests + this.metrics.failedTests;

        // Calculate estimated time
        this.calculateEstimatedTime();

        this.updateMetricsDisplay();
    }

    updateMetricsDisplay() {
        // Update session status information
        document.getElementById('totalTests').textContent = this.metrics.totalTests;
        document.getElementById('virtualUsers').textContent = this.metrics.virtualUsers;
        document.getElementById('claudeMode').textContent = this.metrics.claudeMode;
        document.getElementById('estimatedTime').textContent = this.metrics.estimatedTime;

        // Update session time
        this.updateSessionTime();

        // Update progress circles
        const completedPercentage = this.metrics.totalTests > 0
            ? Math.round((this.metrics.completedTests / this.metrics.totalTests) * 100)
            : 0;
        document.getElementById('completedPercentage').textContent = `${completedPercentage}%`;

        const successRate = this.metrics.completedTests > 0
            ? Math.round((this.metrics.passedTests / this.metrics.completedTests) * 100)
            : 100;
        document.getElementById('successPercentage').textContent = `${successRate}%`;

        const failureRate = this.metrics.completedTests > 0
            ? Math.round((this.metrics.failedTests / this.metrics.completedTests) * 100)
            : 0;
        document.getElementById('failurePercentage').textContent = `${failureRate}%`;

        // Update issues summary
        this.updateIssuesSummary();
    }

    resetMetrics() {
        this.metrics = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            virtualUsers: 0,
            completedTests: 0,
            discoveredItems: 0,
            claudeMode: 'Real-time',
            estimatedTime: 'Calculating...'
        };
        this.sessionStartTime = new Date();
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

        // Remove the example/placeholder issue if present
        const example = issuesList.querySelector('.issue-item.example');
        if (example) {
            example.remove();
        }

        const issueElement = document.createElement('div');
        issueElement.className = 'issue-item';

        const priorityClass = this.getPriorityClass(issue.severity || issue.priority || 'medium');
        const statusClass = this.getStatusClass(issue.status || 'monitoring');

        issueElement.innerHTML = `
            <div class="issue-priority ${priorityClass}">
                <i class="fas fa-circle"></i>
            </div>
            <div class="issue-content">
                <div class="issue-title">${issue.title}</div>
                <div class="issue-description">${issue.description || 'No description available'}</div>
            </div>
            <div class="issue-status">
                <span class="status-badge ${statusClass}">${issue.status || 'monitoring'}</span>
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
        const logContent = document.getElementById('logContent');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';

        const timestamp = entry.timestamp ? new Date(entry.timestamp) : new Date();
        const timeString = timestamp.toLocaleTimeString('en-US', { hour12: false });

        logEntry.innerHTML = `
            <span class="log-time">${timeString}</span>
            <span class="log-message">${entry.message}</span>
        `;

        // Remove the placeholder entry if it exists
        const placeholder = logContent.querySelector('.log-entry');
        if (placeholder && placeholder.querySelector('.log-message').textContent.includes('Activity log will appear here')) {
            logContent.removeChild(placeholder);
        }

        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;

        // Limit log entries to prevent memory issues
        const entries = logContent.querySelectorAll('.log-entry');
        if (entries.length > 1000) {
            entries[0].remove();
        }
    }

    clearLog() {
        const logContent = document.getElementById('logContent');
        logContent.innerHTML = `
            <div class="log-entry">
                <span class="log-time">${new Date().toLocaleTimeString('en-US', { hour12: false })}</span>
                <span class="log-message">Log cleared</span>
            </div>
        `;
    }

    downloadLog() {
        const logEntries = document.querySelectorAll('#logContent .log-entry');
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

    // Modal functionality removed in professional dashboard

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

    // New methods for professional dashboard
    updateSessionTime() {
        if (!this.sessionStartTime) {
            document.getElementById('sessionTime').textContent = '00:00:00';
            return;
        }

        const now = new Date();
        const diff = now - this.sessionStartTime;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('sessionTime').textContent = timeString;
    }

    updateIssuesSummary() {
        const issueItems = document.querySelectorAll('#issuesList .issue-item:not(.example)');
        let openCount = 0;
        let fixedCount = 0;
        let analyzedCount = 0;

        issueItems.forEach(item => {
            const statusBadge = item.querySelector('.status-badge');
            if (statusBadge) {
                const status = statusBadge.textContent.toLowerCase();
                if (status === 'fixed') {
                    fixedCount++;
                } else if (status === 'analyzing') {
                    analyzedCount++;
                } else {
                    openCount++;
                }
            }
        });

        document.getElementById('openIssues').textContent = openCount;
        document.getElementById('fixedIssues').textContent = fixedCount;
        document.getElementById('analyzedIssues').textContent = analyzedCount;
    }

    getPriorityClass(priority) {
        const p = priority.toLowerCase();
        if (p.includes('high') || p.includes('critical')) return 'high';
        if (p.includes('low')) return 'low';
        if (p.includes('done') || p.includes('fixed')) return 'done';
        return 'medium';
    }

    getStatusClass(status) {
        const s = status.toLowerCase();
        if (s.includes('fixed') || s.includes('resolved')) return 'fixed';
        if (s.includes('analyzing') || s.includes('processing')) return 'analyzing';
        return 'monitoring';
    }

    loadConfigurationData() {
        // Load session configuration from the configuration file
        fetch('/api/session/config')
            .then(response => response.json())
            .then(config => {
                if (config.projectName) {
                    document.getElementById('projectName').textContent = config.projectName;
                }
                if (config.sessionName) {
                    document.getElementById('sessionName').textContent = config.sessionName;
                }
                if (config.targetUrl) {
                    document.getElementById('targetUrl').textContent = config.targetUrl;
                }
                if (config.virtualUsers) {
                    this.metrics.virtualUsers = config.virtualUsers;
                }
                if (config.claudeRealtime !== undefined) {
                    this.metrics.claudeMode = config.claudeRealtime ? 'Real-time' : 'After completion';
                }
                if (config.startTime) {
                    this.sessionStartTime = new Date(config.startTime);
                }
                this.updateMetricsDisplay();
            })
            .catch(() => {
                // Configuration not available, use defaults
                console.log('Session configuration not available, using defaults');
            });
    }

    calculateEstimatedTime() {
        if (!this.sessionStartTime || this.metrics.completedTests === 0 || this.metrics.totalTests === 0) {
            this.metrics.estimatedTime = 'Calculating...';
            return;
        }

        const now = new Date();
        const elapsed = now - this.sessionStartTime;
        const avgTimePerTest = elapsed / this.metrics.completedTests;
        const remainingTests = this.metrics.totalTests - this.metrics.completedTests;
        const estimatedRemaining = remainingTests * avgTimePerTest;

        if (estimatedRemaining <= 0) {
            this.metrics.estimatedTime = 'Complete';
            return;
        }

        const hours = Math.floor(estimatedRemaining / 3600000);
        const minutes = Math.floor((estimatedRemaining % 3600000) / 60000);
        const seconds = Math.floor((estimatedRemaining % 60000) / 1000);

        if (hours > 0) {
            this.metrics.estimatedTime = `${hours}h ${minutes}m`;
        } else if (minutes > 0) {
            this.metrics.estimatedTime = `${minutes}m ${seconds}s`;
        } else {
            this.metrics.estimatedTime = `${seconds}s`;
        }
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