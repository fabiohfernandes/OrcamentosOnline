/**
 * TESTER Activity Logger
 * Provides file-based logging for Claude integration
 * Creates readable backlog documents for analysis
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const moment = require('moment');

class ActivityLogger {
    constructor() {
        this.logsDir = path.join(process.cwd(), 'logs');
        this.currentDate = moment().format('YYYY-MM-DD');
        this.sessionLog = null;
        this.activityLogPath = null;
        this.summaryLogPath = null;
        this.initialize();
    }

    async initialize() {
        try {
            // Ensure logs directory exists
            await fs.mkdir(this.logsDir, { recursive: true });

            // Set up log file paths
            this.activityLogPath = path.join(this.logsDir, `activity-${this.currentDate}.log`);
            this.summaryLogPath = path.join(this.logsDir, `summary-${this.currentDate}.md`);

            console.log(chalk.blue('📝 Activity Logger initialized'));
            console.log(chalk.cyan(`   Activity Log: ${this.activityLogPath}`));
            console.log(chalk.cyan(`   Summary Log: ${this.summaryLogPath}`));

            // Write initial header
            await this.writeActivityLog('SYSTEM', 'TESTER Activity Logger Started', {
                timestamp: moment().toISOString(),
                logsDirectory: this.logsDir
            });

        } catch (error) {
            console.error(chalk.red('❌ Failed to initialize Activity Logger:'), error);
        }
    }

    async writeActivityLog(source, message, data = {}) {
        try {
            const timestamp = moment().format('YYYY-MM-DD HH:mm:ss.SSS');
            const logEntry = {
                timestamp,
                source,
                message,
                data
            };

            const logLine = `[${timestamp}] [${source.padEnd(12)}] ${message}${data && Object.keys(data).length > 0 ? ' | ' + JSON.stringify(data) : ''}\n`;

            await fs.appendFile(this.activityLogPath, logLine);

        } catch (error) {
            console.error(chalk.red('❌ Failed to write activity log:'), error);
        }
    }

    async logSessionStart(sessionId, config) {
        this.sessionLog = {
            sessionId,
            startTime: moment().toISOString(),
            config,
            activities: [],
            tests: [],
            errors: [],
            metrics: {}
        };

        await this.writeActivityLog('SESSION', 'Test session started', {
            sessionId,
            config,
            virtualUsers: config.virtualUsers || 1,
            duration: config.duration || 'unlimited',
            targetUrl: config.targetUrl
        });

        await this.updateSummary();
    }

    async logSessionEnd(sessionId, results) {
        if (this.sessionLog) {
            this.sessionLog.endTime = moment().toISOString();
            this.sessionLog.results = results;
        }

        await this.writeActivityLog('SESSION', 'Test session completed', {
            sessionId,
            duration: this.sessionLog ? moment(this.sessionLog.endTime).diff(moment(this.sessionLog.startTime), 'seconds') + 's' : 'unknown',
            results
        });

        await this.updateSummary();
    }

    async logTestExecution(testName, result, responseTime, error = null) {
        const testLog = {
            timestamp: moment().toISOString(),
            testName,
            result,
            responseTime,
            error
        };

        if (this.sessionLog) {
            this.sessionLog.tests.push(testLog);
            if (error) {
                this.sessionLog.errors.push({ testName, error, timestamp: testLog.timestamp });
            }
        }

        await this.writeActivityLog('TEST', `${testName} ${result.toUpperCase()}`, {
            responseTime: responseTime + 'ms',
            error: error || undefined
        });
    }

    async logDiscovery(targetUrl, coverage) {
        await this.writeActivityLog('DISCOVERY', 'Application discovery completed', {
            targetUrl,
            pagesFound: coverage.pages.length,
            elementsFound: coverage.elements.length,
            formsFound: coverage.forms.length,
            flowsFound: coverage.flows.length,
            errorsFound: coverage.errors.length
        });

        if (this.sessionLog) {
            this.sessionLog.discovery = coverage;
        }

        await this.updateSummary();
    }

    async logError(source, error, context = {}) {
        const errorLog = {
            timestamp: moment().toISOString(),
            source,
            error: error.message || error,
            stack: error.stack || null,
            context
        };

        if (this.sessionLog) {
            this.sessionLog.errors.push(errorLog);
        }

        await this.writeActivityLog('ERROR', `${source} error: ${error.message || error}`, {
            context,
            stack: error.stack || undefined
        });
    }

    async logMetrics(metrics) {
        if (this.sessionLog) {
            this.sessionLog.metrics = { ...this.sessionLog.metrics, ...metrics, timestamp: moment().toISOString() };
        }

        await this.writeActivityLog('METRICS', 'Performance metrics updated', metrics);
    }

    async logClaudeAnalysis(analysis) {
        await this.writeActivityLog('CLAUDE', 'AI Analysis completed', {
            issuesFound: analysis.issues?.length || 0,
            recommendations: analysis.recommendations?.length || 0,
            severity: analysis.severity || 'unknown'
        });

        if (this.sessionLog) {
            this.sessionLog.claudeAnalysis = analysis;
        }

        await this.updateSummary();
    }

    async updateSummary() {
        try {
            const summary = this.generateSummary();
            await fs.writeFile(this.summaryLogPath, summary);
        } catch (error) {
            console.error(chalk.red('❌ Failed to update summary:'), error);
        }
    }

    generateSummary() {
        const now = moment().format('YYYY-MM-DD HH:mm:ss');

        let summary = `# TESTER Activity Summary - ${this.currentDate}\n\n`;
        summary += `**Generated:** ${now}\n\n`;

        if (this.sessionLog) {
            summary += `## Current Session: ${this.sessionLog.sessionId}\n\n`;
            summary += `- **Started:** ${moment(this.sessionLog.startTime).format('HH:mm:ss')}\n`;
            summary += `- **Status:** ${this.sessionLog.endTime ? 'Completed' : 'Running'}\n`;

            if (this.sessionLog.endTime) {
                const duration = moment(this.sessionLog.endTime).diff(moment(this.sessionLog.startTime), 'seconds');
                summary += `- **Duration:** ${duration}s\n`;
            }

            summary += `- **Target:** ${this.sessionLog.config?.targetUrl || 'Unknown'}\n`;
            summary += `- **Virtual Users:** ${this.sessionLog.config?.virtualUsers || 1}\n\n`;

            // Test Results
            if (this.sessionLog.tests.length > 0) {
                const passed = this.sessionLog.tests.filter(t => t.result === 'passed').length;
                const failed = this.sessionLog.tests.filter(t => t.result === 'failed').length;

                summary += `### Test Results\n\n`;
                summary += `- **Total Tests:** ${this.sessionLog.tests.length}\n`;
                summary += `- **Passed:** ${passed} (${((passed/this.sessionLog.tests.length)*100).toFixed(1)}%)\n`;
                summary += `- **Failed:** ${failed} (${((failed/this.sessionLog.tests.length)*100).toFixed(1)}%)\n\n`;

                // Recent test results
                const recentTests = this.sessionLog.tests.slice(-10);
                summary += `### Recent Test Results\n\n`;
                recentTests.forEach(test => {
                    const status = test.result === 'passed' ? '✅' : '❌';
                    summary += `${status} **${test.testName}** (${test.responseTime}ms)\n`;
                });
                summary += `\n`;
            }

            // Discovery Results
            if (this.sessionLog.discovery) {
                const d = this.sessionLog.discovery;
                summary += `### Discovery Results\n\n`;
                summary += `- **Pages Found:** ${d.pages.length}\n`;
                summary += `- **Interactive Elements:** ${d.elements.length}\n`;
                summary += `- **Forms:** ${d.forms.length}\n`;
                summary += `- **User Flows:** ${d.flows.length}\n`;
                summary += `- **Errors:** ${d.errors.length}\n\n`;
            }

            // Errors
            if (this.sessionLog.errors.length > 0) {
                summary += `### Errors (${this.sessionLog.errors.length})\n\n`;
                this.sessionLog.errors.slice(-5).forEach(error => {
                    summary += `- **${moment(error.timestamp).format('HH:mm:ss')}** [${error.source || 'UNKNOWN'}] ${error.error}\n`;
                });
                summary += `\n`;
            }

            // Claude Analysis
            if (this.sessionLog.claudeAnalysis) {
                const analysis = this.sessionLog.claudeAnalysis;
                summary += `### AI Analysis\n\n`;
                summary += `- **Issues Found:** ${analysis.issues?.length || 0}\n`;
                summary += `- **Recommendations:** ${analysis.recommendations?.length || 0}\n`;
                summary += `- **Severity:** ${analysis.severity || 'Unknown'}\n\n`;
            }

            // Current Metrics
            if (this.sessionLog.metrics && Object.keys(this.sessionLog.metrics).length > 0) {
                summary += `### Current Metrics\n\n`;
                Object.entries(this.sessionLog.metrics).forEach(([key, value]) => {
                    if (key !== 'timestamp') {
                        summary += `- **${key}:** ${value}\n`;
                    }
                });
                summary += `\n`;
            }
        }

        summary += `## Activity Log Location\n\n`;
        summary += `Full activity details: \`${this.activityLogPath}\`\n\n`;
        summary += `*This summary is automatically updated as testing progresses.*\n`;

        return summary;
    }

    async getCurrentActivitySummary() {
        try {
            const summary = await fs.readFile(this.summaryLogPath, 'utf8');
            return summary;
        } catch (error) {
            return 'No activity summary available yet.';
        }
    }

    async getActivityLog(lines = 50) {
        try {
            const log = await fs.readFile(this.activityLogPath, 'utf8');
            const logLines = log.split('\n').filter(line => line.length > 0);
            return logLines.slice(-lines).join('\n');
        } catch (error) {
            return 'No activity log available yet.';
        }
    }
}

module.exports = ActivityLogger;