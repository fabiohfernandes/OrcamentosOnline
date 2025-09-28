/**
 * TESTER Metrics Server
 * Prometheus-compatible metrics endpoint for external monitoring
 */

const express = require('express');
const chalk = require('chalk');
const { register, collectDefaultMetrics, Counter, Histogram, Gauge } = require('prom-client');

class MetricsServer {
    constructor() {
        this.app = express();
        this.port = process.env.METRICS_PORT || 8000;
        this.server = null;

        // Initialize Prometheus metrics
        this.initializeMetrics();
        this.setupRoutes();
    }

    initializeMetrics() {
        // Collect default Node.js metrics
        collectDefaultMetrics({ register });

        // Custom TESTER metrics
        this.testCounter = new Counter({
            name: 'tester_tests_total',
            help: 'Total number of tests executed',
            labelNames: ['status', 'test_type', 'session_id']
        });

        this.testDuration = new Histogram({
            name: 'tester_test_duration_ms',
            help: 'Test execution duration in milliseconds',
            labelNames: ['test_type', 'session_id'],
            buckets: [10, 50, 100, 500, 1000, 5000, 10000, 30000]
        });

        this.issueCounter = new Counter({
            name: 'tester_issues_total',
            help: 'Total number of issues detected',
            labelNames: ['severity', 'source', 'session_id']
        });

        this.virtualUsersGauge = new Gauge({
            name: 'tester_virtual_users_active',
            help: 'Number of active virtual users',
            labelNames: ['session_id']
        });

        this.responseTimeGauge = new Gauge({
            name: 'tester_response_time_ms',
            help: 'Average response time in milliseconds',
            labelNames: ['session_id']
        });

        this.systemCpuGauge = new Gauge({
            name: 'tester_system_cpu_percent',
            help: 'System CPU usage percentage'
        });

        this.systemMemoryGauge = new Gauge({
            name: 'tester_system_memory_percent',
            help: 'System memory usage percentage'
        });

        this.systemDiskGauge = new Gauge({
            name: 'tester_system_disk_percent',
            help: 'System disk usage percentage'
        });

        this.dockerCpuGauge = new Gauge({
            name: 'tester_docker_cpu_percent',
            help: 'Docker container CPU usage percentage',
            labelNames: ['container_name']
        });

        this.sessionGauge = new Gauge({
            name: 'tester_sessions_active',
            help: 'Number of active testing sessions'
        });

        this.errorRateGauge = new Gauge({
            name: 'tester_error_rate_percent',
            help: 'Current error rate percentage',
            labelNames: ['session_id']
        });

        this.throughputGauge = new Gauge({
            name: 'tester_throughput_tests_per_minute',
            help: 'Test throughput in tests per minute',
            labelNames: ['session_id']
        });

        console.log(chalk.green('✅ Prometheus metrics initialized'));
    }

    setupRoutes() {
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage()
            });
        });

        // Prometheus metrics endpoint
        this.app.get('/metrics', async (req, res) => {
            try {
                res.set('Content-Type', register.contentType);
                const metrics = await register.metrics();
                res.end(metrics);
            } catch (error) {
                console.error(chalk.red('Failed to generate metrics:'), error);
                res.status(500).json({ error: 'Failed to generate metrics' });
            }
        });

        // Custom metrics endpoint (JSON format)
        this.app.get('/metrics/json', async (req, res) => {
            try {
                const metrics = await this.getCustomMetrics();
                res.json(metrics);
            } catch (error) {
                console.error(chalk.red('Failed to generate JSON metrics:'), error);
                res.status(500).json({ error: 'Failed to generate metrics' });
            }
        });

        // Reset metrics endpoint (for testing)
        this.app.post('/metrics/reset', (req, res) => {
            try {
                register.clear();
                this.initializeMetrics();
                res.json({ message: 'Metrics reset successfully' });
            } catch (error) {
                console.error(chalk.red('Failed to reset metrics:'), error);
                res.status(500).json({ error: 'Failed to reset metrics' });
            }
        });

        console.log(chalk.green('✅ Metrics server routes configured'));
    }

    async getCustomMetrics() {
        const metrics = await register.getMetricsAsJSON();

        // Transform Prometheus metrics to custom format
        const customMetrics = {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            tester: {},
            system: {},
            nodejs: {}
        };

        metrics.forEach(metric => {
            const { name, help, values } = metric;

            if (name.startsWith('tester_')) {
                const shortName = name.replace('tester_', '');
                customMetrics.tester[shortName] = {
                    help,
                    values: values.map(v => ({
                        value: v.value,
                        labels: v.labels || {}
                    }))
                };
            } else if (name.startsWith('process_') || name.startsWith('nodejs_')) {
                customMetrics.nodejs[name] = {
                    help,
                    values: values.map(v => ({
                        value: v.value,
                        labels: v.labels || {}
                    }))
                };
            } else {
                customMetrics.system[name] = {
                    help,
                    values: values.map(v => ({
                        value: v.value,
                        labels: v.labels || {}
                    }))
                };
            }
        });

        return customMetrics;
    }

    // Method to record test execution
    recordTest(status, testType, sessionId, duration) {
        this.testCounter.inc({ status, test_type: testType, session_id: sessionId });

        if (duration) {
            this.testDuration.observe({ test_type: testType, session_id: sessionId }, duration);
        }
    }

    // Method to record issue detection
    recordIssue(severity, source, sessionId) {
        this.issueCounter.inc({ severity, source, session_id: sessionId });
    }

    // Method to update virtual users count
    updateVirtualUsers(sessionId, count) {
        this.virtualUsersGauge.set({ session_id: sessionId }, count);
    }

    // Method to update response time
    updateResponseTime(sessionId, responseTime) {
        this.responseTimeGauge.set({ session_id: sessionId }, responseTime);
    }

    // Method to update system metrics
    updateSystemMetrics(cpu, memory, disk) {
        if (cpu !== undefined) this.systemCpuGauge.set(cpu);
        if (memory !== undefined) this.systemMemoryGauge.set(memory);
        if (disk !== undefined) this.systemDiskGauge.set(disk);
    }

    // Method to update Docker metrics
    updateDockerMetrics(containerName, cpuUsage) {
        this.dockerCpuGauge.set({ container_name: containerName }, cpuUsage);
    }

    // Method to update active sessions count
    updateActiveSessions(count) {
        this.sessionGauge.set(count);
    }

    // Method to update error rate
    updateErrorRate(sessionId, errorRate) {
        this.errorRateGauge.set({ session_id: sessionId }, errorRate);
    }

    // Method to update throughput
    updateThroughput(sessionId, throughput) {
        this.throughputGauge.set({ session_id: sessionId }, throughput);
    }

    // Method to clear session-specific metrics
    clearSessionMetrics(sessionId) {
        try {
            // Reset session-specific metrics to 0
            this.virtualUsersGauge.set({ session_id: sessionId }, 0);
            this.responseTimeGauge.set({ session_id: sessionId }, 0);
            this.errorRateGauge.set({ session_id: sessionId }, 0);
            this.throughputGauge.set({ session_id: sessionId }, 0);

            console.log(chalk.yellow(`🧹 Cleared metrics for session: ${sessionId}`));
        } catch (error) {
            console.error(chalk.red('Failed to clear session metrics:'), error);
        }
    }

    start() {
        this.server = this.app.listen(this.port, () => {
            console.log(chalk.green(`📊 Metrics server running on port ${this.port}`));
            console.log(chalk.cyan(`📈 Prometheus metrics: http://localhost:${this.port}/metrics`));
            console.log(chalk.cyan(`📋 JSON metrics: http://localhost:${this.port}/metrics/json`));
            console.log(chalk.cyan(`💚 Health check: http://localhost:${this.port}/health`));
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log(chalk.yellow('📊 Shutting down metrics server...'));
            this.server.close(() => {
                console.log(chalk.green('✅ Metrics server shut down gracefully'));
            });
        });
    }

    stop() {
        if (this.server) {
            this.server.close(() => {
                console.log(chalk.yellow('📊 Metrics server stopped'));
            });
        }
    }

    // Method to export metrics for external systems
    async exportMetrics(format = 'prometheus') {
        try {
            switch (format.toLowerCase()) {
                case 'prometheus':
                    return await register.metrics();

                case 'json':
                    return JSON.stringify(await this.getCustomMetrics(), null, 2);

                case 'influxdb':
                    return await this.convertToInfluxDB();

                default:
                    throw new Error(`Unsupported format: ${format}`);
            }
        } catch (error) {
            console.error(chalk.red('Failed to export metrics:'), error);
            throw error;
        }
    }

    // Convert metrics to InfluxDB line protocol
    async convertToInfluxDB() {
        const metrics = await register.getMetricsAsJSON();
        const lines = [];
        const timestamp = Math.floor(Date.now() * 1000000); // nanoseconds

        metrics.forEach(metric => {
            metric.values.forEach(value => {
                const tags = Object.entries(value.labels || {})
                    .map(([k, v]) => `${k}=${v}`)
                    .join(',');

                const line = tags
                    ? `${metric.name},${tags} value=${value.value} ${timestamp}`
                    : `${metric.name} value=${value.value} ${timestamp}`;

                lines.push(line);
            });
        });

        return lines.join('\n');
    }

    // Method to get metric by name
    async getMetric(metricName) {
        try {
            const metrics = await register.getMetricsAsJSON();
            return metrics.find(m => m.name === metricName) || null;
        } catch (error) {
            console.error(chalk.red('Failed to get metric:'), error);
            return null;
        }
    }

    // Method to get metrics summary
    async getSummary() {
        try {
            const customMetrics = await this.getCustomMetrics();

            const summary = {
                timestamp: customMetrics.timestamp,
                uptime: customMetrics.uptime,
                totals: {
                    tests: 0,
                    issues: 0,
                    activeSessions: 0
                },
                averages: {
                    responseTime: 0,
                    errorRate: 0,
                    throughput: 0
                },
                system: {
                    cpu: 0,
                    memory: 0,
                    disk: 0
                }
            };

            // Calculate totals and averages from metrics
            Object.entries(customMetrics.tester).forEach(([name, metric]) => {
                if (name.includes('tests_total')) {
                    summary.totals.tests = metric.values.reduce((sum, v) => sum + v.value, 0);
                } else if (name.includes('issues_total')) {
                    summary.totals.issues = metric.values.reduce((sum, v) => sum + v.value, 0);
                } else if (name.includes('sessions_active')) {
                    summary.totals.activeSessions = metric.values.reduce((sum, v) => sum + v.value, 0);
                } else if (name.includes('response_time')) {
                    const values = metric.values.filter(v => v.value > 0);
                    summary.averages.responseTime = values.length > 0
                        ? values.reduce((sum, v) => sum + v.value, 0) / values.length
                        : 0;
                } else if (name.includes('error_rate')) {
                    const values = metric.values.filter(v => v.value > 0);
                    summary.averages.errorRate = values.length > 0
                        ? values.reduce((sum, v) => sum + v.value, 0) / values.length
                        : 0;
                } else if (name.includes('throughput')) {
                    const values = metric.values.filter(v => v.value > 0);
                    summary.averages.throughput = values.length > 0
                        ? values.reduce((sum, v) => sum + v.value, 0) / values.length
                        : 0;
                }
            });

            // Extract system metrics
            if (customMetrics.tester.system_cpu_percent) {
                summary.system.cpu = customMetrics.tester.system_cpu_percent.values[0]?.value || 0;
            }
            if (customMetrics.tester.system_memory_percent) {
                summary.system.memory = customMetrics.tester.system_memory_percent.values[0]?.value || 0;
            }
            if (customMetrics.tester.system_disk_percent) {
                summary.system.disk = customMetrics.tester.system_disk_percent.values[0]?.value || 0;
            }

            return summary;
        } catch (error) {
            console.error(chalk.red('Failed to generate summary:'), error);
            return null;
        }
    }
}

// Start metrics server if this file is run directly
if (require.main === module) {
    const metricsServer = new MetricsServer();
    metricsServer.start();

    // Example of updating metrics (for testing)
    setInterval(() => {
        const sessionId = 'test_session';
        metricsServer.recordTest('passed', 'page_load', sessionId, Math.random() * 1000);
        metricsServer.updateVirtualUsers(sessionId, Math.floor(Math.random() * 10) + 1);
        metricsServer.updateResponseTime(sessionId, Math.random() * 500 + 100);
        metricsServer.updateSystemMetrics(
            Math.random() * 100,
            Math.random() * 100,
            Math.random() * 100
        );
        metricsServer.updateErrorRate(sessionId, Math.random() * 10);
        metricsServer.updateThroughput(sessionId, Math.random() * 60 + 10);
    }, 5000);
}

module.exports = MetricsServer;