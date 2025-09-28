/**
 * TESTER Monitoring System
 * Real-time performance metrics and system monitoring
 */

const { exec } = require('child_process');
const chalk = require('chalk');
const fs = require('fs').promises;

class MonitoringSystem {
    constructor(database, socketIO) {
        this.db = database;
        this.io = socketIO;
        this.isMonitoring = false;
        this.currentSession = null;
        this.metrics = {
            system: {},
            performance: {},
            docker: {},
            application: {}
        };
        this.monitoringIntervals = [];
        this.dockerContainers = [];
        this.performanceBaseline = null;
    }

    async initialize() {
        try {
            console.log(chalk.blue('📊 Initializing Monitoring System...'));

            // Detect available monitoring sources
            await this.detectMonitoringSources();

            // Establish performance baseline
            await this.establishBaseline();

            console.log(chalk.green('✅ Monitoring System initialized'));

        } catch (error) {
            console.error(chalk.red('❌ Monitoring System initialization failed:'), error);
            throw error;
        }
    }

    async detectMonitoringSources() {
        // Check Docker availability
        try {
            await this.executeCommand('docker --version');
            console.log(chalk.green('✅ Docker monitoring available'));
            await this.detectDockerContainers();
        } catch (error) {
            console.log(chalk.yellow('⚠️ Docker monitoring not available'));
        }

        // Check system monitoring tools
        const tools = ['ps', 'free', 'df', 'netstat'];
        for (const tool of tools) {
            try {
                await this.executeCommand(`which ${tool}`);
                console.log(chalk.green(`✅ ${tool} available`));
            } catch (error) {
                console.log(chalk.yellow(`⚠️ ${tool} not available`));
            }
        }
    }

    async detectDockerContainers() {
        try {
            const output = await this.executeCommand('docker ps --format "{{.Names}}"');
            this.dockerContainers = output.split('\n').filter(name => name.trim());
            console.log(chalk.cyan(`🐳 Monitoring ${this.dockerContainers.length} Docker containers`));
        } catch (error) {
            console.warn(chalk.yellow('Failed to detect Docker containers'), error.message);
        }
    }

    async establishBaseline() {
        try {
            this.performanceBaseline = {
                cpu: await this.getCPUUsage(),
                memory: await this.getMemoryUsage(),
                disk: await this.getDiskUsage(),
                network: await this.getNetworkStats(),
                timestamp: new Date()
            };

            console.log(chalk.cyan('📏 Performance baseline established'));
        } catch (error) {
            console.warn(chalk.yellow('Failed to establish baseline'), error.message);
        }
    }

    getStatus() {
        return {
            monitoring: this.isMonitoring,
            session: this.currentSession,
            containers: this.dockerContainers.length,
            baseline: !!this.performanceBaseline,
            intervals: this.monitoringIntervals.length
        };
    }

    async startMonitoring(sessionId) {
        if (this.isMonitoring) {
            console.log(chalk.yellow('Monitoring already active'));
            return;
        }

        try {
            console.log(chalk.blue(`📈 Starting monitoring for session: ${sessionId}`));

            this.currentSession = sessionId;
            this.isMonitoring = true;

            // Start various monitoring intervals
            this.startSystemMonitoring();
            this.startDockerMonitoring();
            this.startPerformanceMonitoring();
            this.startApplicationMonitoring();

            this.io.emit('monitoringStarted', {
                sessionId,
                timestamp: new Date()
            });

            console.log(chalk.green('✅ Monitoring started successfully'));

        } catch (error) {
            console.error(chalk.red('Failed to start monitoring:'), error);
            this.isMonitoring = false;
            throw error;
        }
    }

    startSystemMonitoring() {
        // Monitor system metrics every 10 seconds
        const interval = setInterval(async () => {
            if (!this.isMonitoring) {
                clearInterval(interval);
                return;
            }

            try {
                const systemMetrics = {
                    cpu: await this.getCPUUsage(),
                    memory: await this.getMemoryUsage(),
                    disk: await this.getDiskUsage(),
                    network: await this.getNetworkStats(),
                    processes: await this.getProcessStats(),
                    timestamp: new Date()
                };

                this.metrics.system = systemMetrics;
                await this.storeSystemMetrics(systemMetrics);

                // Emit real-time updates
                this.io.emit('systemMetrics', systemMetrics);

                // Check for anomalies
                await this.checkSystemAnomalies(systemMetrics);

            } catch (error) {
                console.error(chalk.red('System monitoring error:'), error);
            }
        }, 10000);

        this.monitoringIntervals.push(interval);
    }

    startDockerMonitoring() {
        if (this.dockerContainers.length === 0) return;

        // Monitor Docker containers every 15 seconds
        const interval = setInterval(async () => {
            if (!this.isMonitoring) {
                clearInterval(interval);
                return;
            }

            try {
                const dockerMetrics = await this.getDockerMetrics();
                this.metrics.docker = dockerMetrics;

                await this.storeDockerMetrics(dockerMetrics);
                this.io.emit('dockerMetrics', dockerMetrics);

                // Monitor Docker logs
                await this.monitorDockerLogs();

            } catch (error) {
                console.error(chalk.red('Docker monitoring error:'), error);
            }
        }, 15000);

        this.monitoringIntervals.push(interval);
    }

    startPerformanceMonitoring() {
        // Monitor performance metrics every 5 seconds
        const interval = setInterval(async () => {
            if (!this.isMonitoring) {
                clearInterval(interval);
                return;
            }

            try {
                const performanceMetrics = {
                    responseTime: await this.measureResponseTime(),
                    throughput: await this.measureThroughput(),
                    errorRate: await this.calculateErrorRate(),
                    availability: await this.checkAvailability(),
                    timestamp: new Date()
                };

                this.metrics.performance = performanceMetrics;
                await this.storePerformanceMetrics(performanceMetrics);

                this.io.emit('performanceMetrics', performanceMetrics);

            } catch (error) {
                console.error(chalk.red('Performance monitoring error:'), error);
            }
        }, 5000);

        this.monitoringIntervals.push(interval);
    }

    startApplicationMonitoring() {
        // Monitor application-specific metrics every 20 seconds
        const interval = setInterval(async () => {
            if (!this.isMonitoring) {
                clearInterval(interval);
                return;
            }

            try {
                const appMetrics = {
                    nodeMemory: process.memoryUsage(),
                    uptime: process.uptime(),
                    activeConnections: this.io.engine.clientsCount,
                    eventLoopLag: await this.measureEventLoopLag(),
                    timestamp: new Date()
                };

                this.metrics.application = appMetrics;
                await this.storeApplicationMetrics(appMetrics);

                this.io.emit('applicationMetrics', appMetrics);

            } catch (error) {
                console.error(chalk.red('Application monitoring error:'), error);
            }
        }, 20000);

        this.monitoringIntervals.push(interval);
    }

    async getCPUUsage() {
        try {
            const output = await this.executeCommand("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1");
            return parseFloat(output.trim()) || 0;
        } catch (error) {
            // Fallback for systems without top
            try {
                const output = await this.executeCommand("cat /proc/loadavg | awk '{print $1}'");
                return parseFloat(output.trim()) * 100 || 0;
            } catch (fallbackError) {
                return 0;
            }
        }
    }

    async getMemoryUsage() {
        try {
            const output = await this.executeCommand("free | grep Mem | awk '{printf \"%.2f\", $3/$2 * 100.0}'");
            return parseFloat(output.trim()) || 0;
        } catch (error) {
            return 0;
        }
    }

    async getDiskUsage() {
        try {
            const output = await this.executeCommand("df -h / | awk 'NR==2{print $5}' | cut -d'%' -f1");
            return parseFloat(output.trim()) || 0;
        } catch (error) {
            return 0;
        }
    }

    async getNetworkStats() {
        try {
            const output = await this.executeCommand("cat /proc/net/dev | grep -E '^\\s*(eth|ens|wl)' | head -1 | awk '{print $2 \" \" $10}'");
            const [rxBytes, txBytes] = output.trim().split(' ').map(n => parseInt(n) || 0);
            return { rxBytes, txBytes };
        } catch (error) {
            return { rxBytes: 0, txBytes: 0 };
        }
    }

    async getProcessStats() {
        try {
            const output = await this.executeCommand("ps aux | wc -l");
            const processCount = parseInt(output.trim()) || 0;

            const nodeProcesses = await this.executeCommand("ps aux | grep node | grep -v grep | wc -l");
            const nodeCount = parseInt(nodeProcesses.trim()) || 0;

            return { total: processCount, node: nodeCount };
        } catch (error) {
            return { total: 0, node: 0 };
        }
    }

    async getDockerMetrics() {
        const containerMetrics = {};

        for (const container of this.dockerContainers) {
            try {
                const statsOutput = await this.executeCommand(`docker stats ${container} --no-stream --format "{{.CPUPerc}},{{.MemUsage}},{{.NetIO}},{{.BlockIO}}"`);
                const [cpu, memory, network, disk] = statsOutput.trim().split(',');

                containerMetrics[container] = {
                    cpu: parseFloat(cpu.replace('%', '')) || 0,
                    memory: memory || '0B / 0B',
                    network: network || '0B / 0B',
                    disk: disk || '0B / 0B'
                };

            } catch (error) {
                console.warn(chalk.yellow(`Failed to get stats for container ${container}`), error.message);
                containerMetrics[container] = {
                    cpu: 0,
                    memory: 'unknown',
                    network: 'unknown',
                    disk: 'unknown'
                };
            }
        }

        return containerMetrics;
    }

    async monitorDockerLogs() {
        for (const container of this.dockerContainers) {
            try {
                const logs = await this.executeCommand(`docker logs ${container} --tail 10 --since 1m`);
                const logLines = logs.split('\n').filter(line => line.trim());

                for (const line of logLines) {
                    if (this.isErrorLog(line)) {
                        await this.recordDockerEvent(container, 'error', line);
                    } else if (this.isWarningLog(line)) {
                        await this.recordDockerEvent(container, 'warning', line);
                    }
                }

            } catch (error) {
                // Silently continue if logs are not accessible
            }
        }
    }

    isErrorLog(line) {
        const errorPatterns = [
            /error/i,
            /exception/i,
            /failed/i,
            /fatal/i,
            /critical/i
        ];
        return errorPatterns.some(pattern => pattern.test(line));
    }

    isWarningLog(line) {
        const warningPatterns = [
            /warning/i,
            /warn/i,
            /deprecated/i,
            /timeout/i
        ];
        return warningPatterns.some(pattern => pattern.test(line));
    }

    async recordDockerEvent(container, level, message) {
        try {
            const eventId = `docker_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await this.db.query(`
                INSERT INTO docker_events (
                    session_id, event_id, container_name, event_level, message, raw_line
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                this.currentSession,
                eventId,
                container,
                level,
                message.substring(0, 500), // Limit message length
                message
            ]);

            this.io.emit('dockerEvent', {
                container,
                level,
                message: message.substring(0, 200),
                timestamp: new Date()
            });

        } catch (error) {
            console.error(chalk.red('Failed to record Docker event:'), error);
        }
    }

    async measureResponseTime() {
        if (!this.currentSession) return 0;

        try {
            // Get average response time from recent test results
            const result = await this.db.query(`
                SELECT AVG(duration_ms) as avg_response_time
                FROM test_results
                WHERE session_id = $1
                AND created_at > NOW() - INTERVAL '1 minute'
            `, [this.currentSession]);

            return parseFloat(result.rows[0]?.avg_response_time) || 0;

        } catch (error) {
            return 0;
        }
    }

    async measureThroughput() {
        if (!this.currentSession) return 0;

        try {
            // Count tests completed in the last minute
            const result = await this.db.query(`
                SELECT COUNT(*) as test_count
                FROM test_results
                WHERE session_id = $1
                AND created_at > NOW() - INTERVAL '1 minute'
            `, [this.currentSession]);

            return parseInt(result.rows[0]?.test_count) || 0;

        } catch (error) {
            return 0;
        }
    }

    async calculateErrorRate() {
        if (!this.currentSession) return 0;

        try {
            const result = await this.db.query(`
                SELECT
                    COUNT(*) as total_tests,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tests
                FROM test_results
                WHERE session_id = $1
                AND created_at > NOW() - INTERVAL '5 minutes'
            `, [this.currentSession]);

            const { total_tests, failed_tests } = result.rows[0];
            if (total_tests > 0) {
                return (failed_tests / total_tests) * 100;
            }
            return 0;

        } catch (error) {
            return 0;
        }
    }

    async checkAvailability() {
        // Simple availability check by testing if the application is responding
        try {
            const startTime = Date.now();
            await this.executeCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:8888', 5000);
            const responseTime = Date.now() - startTime;
            return responseTime < 5000 ? 100 : 0; // 100% if responds within 5s, 0% otherwise
        } catch (error) {
            return 0;
        }
    }

    async measureEventLoopLag() {
        return new Promise((resolve) => {
            const start = process.hrtime.bigint();
            setImmediate(() => {
                const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
                resolve(lag);
            });
        });
    }

    async storeSystemMetrics(metrics) {
        try {
            const metricEntries = [
                { name: 'cpu_usage', value: metrics.cpu, unit: 'percent' },
                { name: 'memory_usage', value: metrics.memory, unit: 'percent' },
                { name: 'disk_usage', value: metrics.disk, unit: 'percent' },
                { name: 'process_count', value: metrics.processes.total, unit: 'count' },
                { name: 'node_process_count', value: metrics.processes.node, unit: 'count' }
            ];

            for (const metric of metricEntries) {
                await this.db.query(`
                    INSERT INTO system_metrics (
                        session_id, metric_name, metric_value, metric_unit
                    ) VALUES ($1, $2, $3, $4)
                `, [
                    this.currentSession,
                    metric.name,
                    metric.value,
                    metric.unit
                ]);
            }

        } catch (error) {
            console.error(chalk.red('Failed to store system metrics:'), error);
        }
    }

    async storeDockerMetrics(metrics) {
        try {
            for (const [container, stats] of Object.entries(metrics)) {
                await this.db.query(`
                    INSERT INTO system_metrics (
                        session_id, metric_name, metric_value, metric_unit, service_name
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [
                    this.currentSession,
                    'docker_cpu_usage',
                    stats.cpu,
                    'percent',
                    container
                ]);
            }

        } catch (error) {
            console.error(chalk.red('Failed to store Docker metrics:'), error);
        }
    }

    async storePerformanceMetrics(metrics) {
        try {
            const metricEntries = [
                { name: 'response_time', value: metrics.responseTime, unit: 'ms' },
                { name: 'throughput', value: metrics.throughput, unit: 'tests/min' },
                { name: 'error_rate', value: metrics.errorRate, unit: 'percent' },
                { name: 'availability', value: metrics.availability, unit: 'percent' }
            ];

            for (const metric of metricEntries) {
                await this.db.query(`
                    INSERT INTO performance_metrics (
                        session_id, page_url, metric_name, metric_value, metric_unit
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [
                    this.currentSession,
                    'system',
                    metric.name,
                    metric.value,
                    metric.unit
                ]);
            }

        } catch (error) {
            console.error(chalk.red('Failed to store performance metrics:'), error);
        }
    }

    async storeApplicationMetrics(metrics) {
        try {
            const metricEntries = [
                { name: 'node_memory_used', value: metrics.nodeMemory.heapUsed / 1024 / 1024, unit: 'MB' },
                { name: 'node_memory_total', value: metrics.nodeMemory.heapTotal / 1024 / 1024, unit: 'MB' },
                { name: 'uptime', value: metrics.uptime, unit: 'seconds' },
                { name: 'active_connections', value: metrics.activeConnections, unit: 'count' },
                { name: 'event_loop_lag', value: metrics.eventLoopLag, unit: 'ms' }
            ];

            for (const metric of metricEntries) {
                await this.db.query(`
                    INSERT INTO system_metrics (
                        session_id, metric_name, metric_value, metric_unit, service_name
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [
                    this.currentSession,
                    metric.name,
                    metric.value,
                    metric.unit,
                    'tester_app'
                ]);
            }

        } catch (error) {
            console.error(chalk.red('Failed to store application metrics:'), error);
        }
    }

    async checkSystemAnomalies(metrics) {
        const anomalies = [];

        // CPU anomaly detection
        if (metrics.cpu > 90) {
            anomalies.push({
                type: 'cpu_high',
                severity: 'high',
                message: `CPU usage critically high: ${metrics.cpu.toFixed(1)}%`
            });
        } else if (metrics.cpu > 70) {
            anomalies.push({
                type: 'cpu_elevated',
                severity: 'medium',
                message: `CPU usage elevated: ${metrics.cpu.toFixed(1)}%`
            });
        }

        // Memory anomaly detection
        if (metrics.memory > 90) {
            anomalies.push({
                type: 'memory_high',
                severity: 'high',
                message: `Memory usage critically high: ${metrics.memory.toFixed(1)}%`
            });
        } else if (metrics.memory > 80) {
            anomalies.push({
                type: 'memory_elevated',
                severity: 'medium',
                message: `Memory usage elevated: ${metrics.memory.toFixed(1)}%`
            });
        }

        // Disk anomaly detection
        if (metrics.disk > 95) {
            anomalies.push({
                type: 'disk_full',
                severity: 'high',
                message: `Disk space critically low: ${metrics.disk.toFixed(1)}% used`
            });
        } else if (metrics.disk > 85) {
            anomalies.push({
                type: 'disk_high',
                severity: 'medium',
                message: `Disk space high: ${metrics.disk.toFixed(1)}% used`
            });
        }

        // Report anomalies
        for (const anomaly of anomalies) {
            await this.reportAnomaly(anomaly);
        }
    }

    async reportAnomaly(anomaly) {
        try {
            const issueId = `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await this.db.query(`
                INSERT INTO issues (
                    issue_id, session_id, source, severity, title, description
                ) VALUES ($1, $2, $3, $4, $5, $6)
            `, [
                issueId,
                this.currentSession,
                'monitoring',
                anomaly.severity,
                `System Anomaly: ${anomaly.type}`,
                anomaly.message
            ]);

            this.io.emit('systemAnomaly', {
                issueId,
                type: anomaly.type,
                severity: anomaly.severity,
                message: anomaly.message,
                timestamp: new Date()
            });

            console.warn(chalk.yellow(`⚠️ System anomaly detected: ${anomaly.message}`));

        } catch (error) {
            console.error(chalk.red('Failed to report anomaly:'), error);
        }
    }

    async stopMonitoring() {
        console.log(chalk.blue('📊 Stopping monitoring...'));

        this.isMonitoring = false;

        // Clear all monitoring intervals
        this.monitoringIntervals.forEach(interval => {
            clearInterval(interval);
        });
        this.monitoringIntervals = [];

        this.currentSession = null;

        this.io.emit('monitoringStopped', {
            timestamp: new Date()
        });

        console.log(chalk.green('✅ Monitoring stopped'));
    }

    async executeCommand(command, timeout = 10000) {
        return new Promise((resolve, reject) => {
            exec(command, { timeout }, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(stdout);
                }
            });
        });
    }

    getAllMetrics() {
        return this.metrics;
    }
}

module.exports = MonitoringSystem;