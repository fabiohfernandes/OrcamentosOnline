/**
 * TESTER Agent Dashboard - Client-side JavaScript
 */

class TesterDashboard {
    constructor() {
        this.socket = io();
        this.isConnected = false;
        this.currentState = null;

        this.initializeEventListeners();
        this.setupSocketHandlers();
        this.updateLastUpdate();
    }

    initializeEventListeners() {
        // Auto-options change handlers
        document.getElementById('autoRetry').addEventListener('change', this.updateAutoOptions.bind(this));
        document.getElementById('autoFix').addEventListener('change', this.updateAutoOptions.bind(this));
        document.getElementById('autoRefreshScope').addEventListener('change', this.updateAutoOptions.bind(this));
        document.getElementById('autoRestartContainers').addEventListener('change', this.updateAutoOptions.bind(this));

        // Update last update time every minute
        setInterval(() => this.updateLastUpdate(), 60000);
    }

    setupSocketHandlers() {
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.updateConnectionStatus();
            this.showToast('Connected to TESTER Agent', 'success');
        });

        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.updateConnectionStatus();
            this.showToast('Disconnected from TESTER Agent', 'error');
        });

        this.socket.on('stateUpdate', (state) => {
            this.currentState = state;
            this.updateDashboard(state);
        });

        this.socket.on('progressUpdate', (data) => {
            this.updateProgress(data);
        });

        this.socket.on('testingStarted', (state) => {
            this.updateTestingState(state, true);
            this.showToast('Testing started successfully', 'success');
        });

        this.socket.on('testingStopped', (state) => {
            this.updateTestingState(state, false);
            this.showToast('Testing stopped', 'warning');
        });

        this.socket.on('testingPaused', (data) => {
            this.updatePauseState(data.isPaused);
        });

        this.socket.on('testingCompleted', (data) => {
            this.showToast(
                data.success ? 'Testing completed successfully!' : 'Testing completed with issues',
                data.success ? 'success' : 'warning'
            );
        });

        this.socket.on('projectUpdated', (state) => {
            this.currentState = state;
            this.updateProjectDisplay();
            this.showToast('Project updated', 'success');
        });

        this.socket.on('portsUpdate', (ports) => {
            this.updatePortsDisplay(ports);
        });

        this.socket.on('featuresDiscovered', (features) => {
            this.updateFeaturesDisplay(features);
            this.showToast(`Discovered ${features.length} features`, 'success');
        });

        this.socket.on('errorUpdate', (errors) => {
            this.updateErrorsDisplay(errors);
        });

        this.socket.on('claudeStatusUpdate', (status) => {
            this.updateClaudeStatus(status);
        });
    }

    updateConnectionStatus() {
        const statusElement = document.getElementById('connectionStatus');
        if (this.isConnected) {
            statusElement.className = 'connection-status';
            statusElement.innerHTML = '<i class="fas fa-circle"></i><span>Connected</span>';
        } else {
            statusElement.className = 'connection-status disconnected';
            statusElement.innerHTML = '<i class="fas fa-circle"></i><span>Disconnected</span>';
        }
    }

    updateLastUpdate() {
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (this.currentState && this.currentState.lastUpdate) {
            const time = new Date(this.currentState.lastUpdate);
            lastUpdateElement.textContent = `Last Update: ${time.toLocaleTimeString()}`;
        } else {
            lastUpdateElement.textContent = 'Last Update: Never';
        }
    }

    updateDashboard(state) {
        this.updateProjectDisplay();
        this.updatePortsDisplay(state.monitoredPorts);
        this.updateTestingControls(state);
        this.updateProgress({
            progress: state.totalProgress,
            successRate: state.successRate,
            iteration: state.currentIteration
        });
        this.updateFeaturesDisplay(state.discoveredFeatures);
        this.updateErrorsDisplay(state.errors);
        this.updateSummary(state);
        this.updateIterationsDisplay(state.testIterations);
        this.updateAutoOptionsDisplay(state.autoOptions);
        this.updateLastUpdate();
    }

    updateProjectDisplay() {
        if (this.currentState && this.currentState.currentProject) {
            document.getElementById('projectName').value = this.currentState.currentProject;
        }
    }

    updatePortsDisplay(ports) {
        const portsGrid = document.getElementById('portsGrid');
        portsGrid.innerHTML = '';

        Object.entries(ports).forEach(([key, port]) => {
            const portItem = document.createElement('div');
            portItem.className = 'port-item';
            portItem.innerHTML = `
                <input type="checkbox" class="port-checkbox" id="port-${key}"
                       ${port.enabled ? 'checked' : ''}
                       onchange="togglePort('${key}', this.checked)">
                <div class="port-info">
                    <div class="port-name">${port.name}</div>
                    <div class="port-number">Port ${port.port}</div>
                </div>
                <div class="port-status ${port.status}"></div>
            `;
            portsGrid.appendChild(portItem);
        });
    }

    updateTestingControls(state) {
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const stopBtn = document.getElementById('stopBtn');

        if (state.isRunning) {
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            stopBtn.disabled = false;

            if (state.isPaused) {
                pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
                pauseBtn.className = 'btn btn-success btn-large';
            } else {
                pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
                pauseBtn.className = 'btn btn-warning btn-large';
            }
        } else {
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            stopBtn.disabled = true;
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            pauseBtn.className = 'btn btn-warning btn-large';
        }
    }

    updateTestingState(state, isRunning) {
        this.currentState = state;
        this.updateTestingControls(state);

        if (isRunning) {
            this.showLoading(true);
        } else {
            this.showLoading(false);
        }
    }

    updatePauseState(isPaused) {
        const pauseBtn = document.getElementById('pauseBtn');
        if (isPaused) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Resume';
            pauseBtn.className = 'btn btn-success btn-large';
        } else {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pause';
            pauseBtn.className = 'btn btn-warning btn-large';
        }
    }

    updateProgress(data) {
        const progressCircle = document.getElementById('progressCircle');
        const progressPercentage = document.getElementById('progressPercentage');
        const successRate = document.getElementById('successRate');
        const currentIteration = document.getElementById('currentIteration');

        // Update percentage display
        const progress = data.progress || 0;
        progressPercentage.textContent = `${progress}%`;
        successRate.textContent = `${data.successRate || 0}%`;
        currentIteration.textContent = data.iteration || 0;

        // Update progress circle color based on success rate
        const colorClass = this.getProgressColorClass(progress);
        progressCircle.className = `progress-circle ${colorClass}`;
        progressCircle.style.setProperty('--progress', `${progress * 3.6}deg`);

        // Update results if provided
        if (data.results) {
            this.updateResultsDisplay(data.results);
        }
    }

    getProgressColorClass(progress) {
        if (progress < 20) return 'progress-red';
        if (progress < 40) return 'progress-orange';
        if (progress < 60) return 'progress-yellow';
        if (progress < 80) return 'progress-green';
        return 'progress-blue';
    }

    updateResultsDisplay(results) {
        const resultsContainer = document.getElementById('resultsContainer');

        if (!results || results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No test results yet</div>';
            return;
        }

        resultsContainer.innerHTML = '';
        results.slice(-10).forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';

            const time = new Date(result.timestamp).toLocaleTimeString();
            const icon = result.success ? 'fas fa-check' : 'fas fa-times';
            const iconClass = result.success ? 'success' : 'failure';

            resultItem.innerHTML = `
                <div class="result-icon ${iconClass}">
                    <i class="${icon}"></i>
                </div>
                <div class="result-text">${result.result || result.name || 'Test'}</div>
                <div class="result-time">${time}</div>
            `;

            resultsContainer.appendChild(resultItem);
        });

        // Auto-scroll to bottom
        resultsContainer.scrollTop = resultsContainer.scrollHeight;
    }

    updateFeaturesDisplay(features) {
        const featuresContainer = document.getElementById('featuresContainer');

        if (!features || features.length === 0) {
            featuresContainer.innerHTML = '<div class="no-features">No features discovered</div>';
            return;
        }

        featuresContainer.innerHTML = '';
        features.forEach(feature => {
            const featureItem = document.createElement('div');
            featureItem.className = 'feature-item';
            featureItem.innerHTML = `
                <div class="feature-type">${feature.type}</div>
                <div class="feature-name">${feature.name}</div>
            `;
            featuresContainer.appendChild(featureItem);
        });
    }

    updateErrorsDisplay(errors) {
        const errorsContainer = document.getElementById('errorsContainer');

        if (!errors || errors.length === 0) {
            errorsContainer.innerHTML = '<div class="no-errors">No errors</div>';
            return;
        }

        errorsContainer.innerHTML = '';
        errors.slice(-5).forEach(error => {
            const errorItem = document.createElement('div');
            errorItem.className = 'error-item';

            const time = new Date(error.timestamp).toLocaleTimeString();
            errorItem.innerHTML = `
                <div class="error-time">${time}</div>
                <div class="error-message">${error.error}</div>
            `;

            errorsContainer.appendChild(errorItem);
        });
    }

    updateSummary(state) {
        document.getElementById('servicesCount').textContent =
            Object.values(state.monitoredPorts || {}).filter(p => p.enabled).length;

        document.getElementById('featuresCount').textContent =
            (state.discoveredFeatures || []).length;

        document.getElementById('totalRuns').textContent = state.currentIteration || 0;

        // Calculate average response time
        const results = state.testResults || [];
        const responseTimes = results
            .filter(r => r.responseTime)
            .map(r => r.responseTime);

        const avgTime = responseTimes.length > 0
            ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
            : 0;

        document.getElementById('avgResponseTime').textContent = `${avgTime}ms`;

        // Update summary description
        const description = this.generateSummaryDescription(state);
        document.getElementById('summaryDescription').textContent = description;
    }

    generateSummaryDescription(state) {
        if (!state.isRunning && state.totalProgress === 0) {
            return 'TESTER Agent is ready to comprehensively test your project. Configure the services to monitor, set the number of test iterations, and start testing to achieve 100% success rate.';
        }

        if (state.isRunning) {
            return `TESTER Agent is actively testing your project. Current progress: ${state.totalProgress}%. Testing will continue until 100% success rate is achieved.`;
        }

        if (state.totalProgress >= 100) {
            return '🎉 Congratulations! TESTER Agent has achieved 100% success rate. Your project is fully functional and ready for production.';
        }

        return `Latest test run achieved ${state.totalProgress}% success rate. ${state.errors?.length || 0} issues detected and ${state.testResults?.filter(r => r.success).length || 0} tests passed.`;
    }

    updateIterationsDisplay(iterations) {
        const slider = document.getElementById('testIterations');
        const value = document.getElementById('iterationsValue');

        slider.value = iterations || 10;
        value.textContent = `${iterations || 10} times`;
    }

    updateAutoOptionsDisplay(options) {
        if (!options) return;

        document.getElementById('autoRetry').checked = options.autoRetry || false;
        document.getElementById('autoFix').checked = options.autoFix || false;
        document.getElementById('autoRefreshScope').checked = options.autoRefreshScope || false;
        document.getElementById('autoRestartContainers').checked = options.autoRestartContainers || false;
    }

    updateClaudeStatus(status) {
        const indicator = document.getElementById('claudeStatusIndicator');
        const panel = document.querySelector('.claude-integration-panel');
        const enableBtn = document.getElementById('enableClaudeBtn');
        const disableBtn = document.getElementById('disableClaudeBtn');

        if (status.enabled) {
            indicator.className = 'status-indicator connected';
            indicator.innerHTML = '<i class="fas fa-circle"></i><span>🤖 Active & Working</span>';
            panel.classList.add('auto-enabled');
            enableBtn.disabled = true;
            disableBtn.disabled = false;

            if (status.autoMode) {
                panel.classList.add('claude-working');
            }
        } else {
            indicator.className = 'status-indicator disconnected';
            indicator.innerHTML = '<i class="fas fa-circle"></i><span>Disconnected</span>';
            panel.classList.remove('auto-enabled', 'claude-working');
            enableBtn.disabled = false;
            disableBtn.disabled = true;
        }

        // Update checkboxes
        document.getElementById('claudeAutoMode').checked = status.autoMode || false;
        document.getElementById('claudeAutoFix').checked = status.autoFix || false;
        document.getElementById('claudeAutoTest').checked = status.autoTest || false;
        document.getElementById('claudeAutoAnalyze').checked = status.autoAnalyze || false;
        document.getElementById('claudeAutoCommit').checked = status.autoCommit || false;

        // Update max iterations
        document.getElementById('claudeMaxIterations').value = status.maxIterations || 50;
        document.getElementById('claudeIterationsValue').textContent = `${status.maxIterations || 50} iterations`;
    }

    updateClaudeStats(stats) {
        if (stats) {
            document.getElementById('claudePhase').textContent = stats.testCycle?.phase || 'idle';
            document.getElementById('claudeIteration').textContent = stats.testCycle?.currentIteration || 0;
            document.getElementById('claudeIssues').textContent = stats.testCycle?.issues?.length || 0;
            document.getElementById('claudeFixes').textContent = stats.testCycle?.fixes?.length || 0;

            // Update phase color
            const phaseElement = document.getElementById('claudePhase');
            phaseElement.className = `claude-phase-${stats.testCycle?.phase || 'idle'}`;
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        toastContainer.appendChild(toast);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // API Methods
    async makeRequest(url, options = {}) {
        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            this.showToast(`API Error: ${error.message}`, 'error');
            throw error;
        }
    }
}

// Global instance
const dashboard = new TesterDashboard();

// Global functions called by HTML
function setProject() {
    const projectName = document.getElementById('projectName').value.trim();
    if (!projectName) {
        dashboard.showToast('Please enter a project name', 'warning');
        return;
    }

    dashboard.makeRequest('/api/project/set', {
        method: 'POST',
        body: JSON.stringify({ projectName })
    });
}

function togglePort(portKey, enabled) {
    const ports = { [portKey]: { enabled } };
    dashboard.makeRequest('/api/ports/update', {
        method: 'POST',
        body: JSON.stringify({ ports })
    });
}

function updatePorts() {
    const ports = {};
    document.querySelectorAll('.port-checkbox').forEach(checkbox => {
        const portKey = checkbox.id.replace('port-', '');
        ports[portKey] = { enabled: checkbox.checked };
    });

    dashboard.makeRequest('/api/ports/update', {
        method: 'POST',
        body: JSON.stringify({ ports })
    });
}

function updateIterationsDisplay(value) {
    document.getElementById('iterationsValue').textContent = `${value} times`;

    dashboard.makeRequest('/api/iterations/set', {
        method: 'POST',
        body: JSON.stringify({ iterations: parseInt(value) })
    });
}

function startTesting() {
    dashboard.showLoading(true);
    dashboard.makeRequest('/api/test/start', {
        method: 'POST'
    }).finally(() => {
        dashboard.showLoading(false);
    });
}

function pauseTesting() {
    dashboard.makeRequest('/api/test/pause', {
        method: 'POST'
    });
}

function stopTesting() {
    dashboard.makeRequest('/api/test/stop', {
        method: 'POST'
    });
}

function refreshDiscovery() {
    dashboard.showLoading(true);
    dashboard.makeRequest('/api/discovery/refresh', {
        method: 'POST'
    }).finally(() => {
        dashboard.showLoading(false);
    });
}

function saveBacklog() {
    dashboard.makeRequest('/api/backlog/save', {
        method: 'POST'
    });
}

function downloadLogs() {
    window.open('/api/logs/download', '_blank');
}

function updateAutoOptions() {
    const options = {
        autoRetry: document.getElementById('autoRetry').checked,
        autoFix: document.getElementById('autoFix').checked,
        autoRefreshScope: document.getElementById('autoRefreshScope').checked,
        autoRestartContainers: document.getElementById('autoRestartContainers').checked
    };

    dashboard.makeRequest('/api/options/update', {
        method: 'POST',
        body: JSON.stringify({ options })
    });
}

// Claude Integration Functions
function enableClaudeIntegration() {
    const options = {
        enabled: true,
        autoMode: document.getElementById('claudeAutoMode').checked,
        autoFix: document.getElementById('claudeAutoFix').checked,
        autoTest: document.getElementById('claudeAutoTest').checked,
        autoAnalyze: document.getElementById('claudeAutoAnalyze').checked,
        autoCommit: document.getElementById('claudeAutoCommit').checked,
        maxIterations: parseInt(document.getElementById('claudeMaxIterations').value)
    };

    dashboard.makeRequest('/api/claude/enable', {
        method: 'POST',
        body: JSON.stringify({ options })
    }).then(() => {
        dashboard.showToast('🤖 Claude Integration Enabled - Auto-mode Active!', 'success');
    }).catch(error => {
        dashboard.showToast('Failed to enable Claude integration', 'error');
    });
}

function disableClaudeIntegration() {
    dashboard.makeRequest('/api/claude/disable', {
        method: 'POST'
    }).then(() => {
        dashboard.showToast('🤖 Claude Integration Disabled', 'warning');
    }).catch(error => {
        dashboard.showToast('Failed to disable Claude integration', 'error');
    });
}

function forceClaude() {
    dashboard.showLoading(true);
    dashboard.makeRequest('/api/claude/force-cycle', {
        method: 'POST'
    }).then(() => {
        dashboard.showToast('🔄 Claude force cycle triggered', 'info');
    }).catch(error => {
        dashboard.showToast('Failed to trigger Claude cycle', 'error');
    }).finally(() => {
        dashboard.showLoading(false);
    });
}

function updateClaudeIterationsDisplay(value) {
    document.getElementById('claudeIterationsValue').textContent = `${value} iterations`;
}

// Initialize dashboard when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🤖 TESTER Agent Dashboard initialized');
});