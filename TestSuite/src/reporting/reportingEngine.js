/**
 * TESTER Reporting Engine
 * Comprehensive test result analysis and report generation
 */

const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');

class ReportingEngine {
    constructor(database) {
        this.db = database;
        this.reportFormats = ['html', 'json', 'pdf', 'csv'];
        this.templatePath = './src/reporting/templates';
        this.outputPath = './reports';
    }

    async initialize() {
        try {
            console.log(chalk.blue('📋 Initializing Reporting Engine...'));

            // Create report directories
            await this.createReportDirectories();

            // Copy report templates
            await this.setupReportTemplates();

            console.log(chalk.green('✅ Reporting Engine initialized'));

        } catch (error) {
            console.error(chalk.red('❌ Reporting Engine initialization failed:'), error);
            throw error;
        }
    }

    async createReportDirectories() {
        const directories = [
            this.outputPath,
            path.join(this.outputPath, 'html'),
            path.join(this.outputPath, 'json'),
            path.join(this.outputPath, 'pdf'),
            path.join(this.outputPath, 'csv'),
            path.join(this.outputPath, 'archive'),
            this.templatePath
        ];

        for (const dir of directories) {
            try {
                await fs.mkdir(dir, { recursive: true });
            } catch (error) {
                if (error.code !== 'EEXIST') {
                    throw error;
                }
            }
        }
    }

    async setupReportTemplates() {
        // Create HTML report template
        const htmlTemplate = await this.createHTMLTemplate();
        await fs.writeFile(path.join(this.templatePath, 'report.html'), htmlTemplate);

        // Create CSS styles
        const cssStyles = await this.createCSSStyles();
        await fs.writeFile(path.join(this.templatePath, 'report.css'), cssStyles);

        console.log(chalk.cyan('📄 Report templates created'));
    }

    async generateReport(sessionId, format = 'html') {
        try {
            console.log(chalk.blue(`📊 Generating ${format.toUpperCase()} report for session: ${sessionId}`));

            // Collect all session data
            const reportData = await this.collectSessionData(sessionId);

            // Generate report based on format
            let reportPath;
            switch (format.toLowerCase()) {
                case 'html':
                    reportPath = await this.generateHTMLReport(reportData);
                    break;
                case 'json':
                    reportPath = await this.generateJSONReport(reportData);
                    break;
                case 'pdf':
                    reportPath = await this.generatePDFReport(reportData);
                    break;
                case 'csv':
                    reportPath = await this.generateCSVReport(reportData);
                    break;
                default:
                    throw new Error(`Unsupported report format: ${format}`);
            }

            console.log(chalk.green(`✅ Report generated: ${reportPath}`));
            return { reportPath, data: reportData };

        } catch (error) {
            console.error(chalk.red('Report generation failed:'), error);
            throw error;
        }
    }

    async collectSessionData(sessionId) {
        console.log(chalk.blue('📊 Collecting session data...'));

        // Get session information
        const session = await this.getSessionInfo(sessionId);
        const testResults = await this.getTestResults(sessionId);
        const issues = await this.getIssues(sessionId);
        const coverageMap = await this.getCoverageMap(sessionId);
        const performanceMetrics = await this.getPerformanceMetrics(sessionId);
        const systemMetrics = await this.getSystemMetrics(sessionId);
        const consoleEvents = await this.getConsoleEvents(sessionId);
        const dockerEvents = await this.getDockerEvents(sessionId);

        // Calculate summary statistics
        const summary = await this.calculateSummaryStats(testResults, issues, performanceMetrics);

        // Analyze trends and patterns
        const analysis = await this.performDataAnalysis(testResults, issues, performanceMetrics);

        const reportData = {
            metadata: {
                sessionId,
                generatedAt: new Date(),
                reportVersion: '1.0.0',
                testerVersion: '1.0.0'
            },
            session,
            summary,
            analysis,
            testResults,
            issues,
            coverageMap,
            performanceMetrics,
            systemMetrics,
            consoleEvents,
            dockerEvents,
            evidence: await this.collectEvidence(sessionId)
        };

        console.log(chalk.cyan(`📊 Data collection complete: ${testResults.length} tests, ${issues.length} issues`));
        return reportData;
    }

    async getSessionInfo(sessionId) {
        const result = await this.db.query(`
            SELECT * FROM test_sessions WHERE session_id = $1
        `, [sessionId]);
        return result.rows[0] || null;
    }

    async getTestResults(sessionId) {
        const result = await this.db.query(`
            SELECT * FROM test_results
            WHERE session_id = $1
            ORDER BY created_at DESC
        `, [sessionId]);
        return result.rows;
    }

    async getIssues(sessionId) {
        const result = await this.db.query(`
            SELECT * FROM issues
            WHERE session_id = $1
            ORDER BY severity DESC, created_at DESC
        `, [sessionId]);
        return result.rows;
    }

    async getCoverageMap(sessionId) {
        const result = await this.db.query(`
            SELECT * FROM coverage_map
            WHERE session_id = $1
            ORDER BY discovered_at DESC
        `, [sessionId]);
        return result.rows;
    }

    async getPerformanceMetrics(sessionId) {
        const result = await this.db.query(`
            SELECT * FROM performance_metrics
            WHERE session_id = $1
            ORDER BY recorded_at DESC
        `, [sessionId]);
        return result.rows;
    }

    async getSystemMetrics(sessionId) {
        const result = await this.db.query(`
            SELECT * FROM system_metrics
            WHERE session_id = $1
            ORDER BY timestamp DESC
        `, [sessionId]);
        return result.rows;
    }

    async getConsoleEvents(sessionId) {
        const result = await this.db.query(`
            SELECT * FROM console_events
            WHERE session_id = $1
            ORDER BY timestamp DESC
        `, [sessionId]);
        return result.rows;
    }

    async getDockerEvents(sessionId) {
        const result = await this.db.query(`
            SELECT * FROM docker_events
            WHERE session_id = $1
            ORDER BY timestamp DESC
        `, [sessionId]);
        return result.rows;
    }

    async calculateSummaryStats(testResults, issues, performanceMetrics) {
        const totalTests = testResults.length;
        const passedTests = testResults.filter(t => t.status === 'passed').length;
        const failedTests = testResults.filter(t => t.status === 'failed').length;
        const successRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

        const avgResponseTime = testResults.length > 0
            ? testResults.reduce((sum, t) => sum + t.duration_ms, 0) / testResults.length
            : 0;

        const issuesByType = issues.reduce((acc, issue) => {
            acc[issue.source] = (acc[issue.source] || 0) + 1;
            return acc;
        }, {});

        const issuesBySeverity = issues.reduce((acc, issue) => {
            acc[issue.severity] = (acc[issue.severity] || 0) + 1;
            return acc;
        }, {});

        return {
            testExecution: {
                totalTests,
                passedTests,
                failedTests,
                successRate: parseFloat(successRate.toFixed(2)),
                avgResponseTime: parseFloat(avgResponseTime.toFixed(2))
            },
            issues: {
                total: issues.length,
                byType: issuesByType,
                bySeverity: issuesBySeverity,
                resolved: issues.filter(i => i.status === 'resolved').length
            },
            performance: {
                totalMetrics: performanceMetrics.length,
                avgMetricValue: performanceMetrics.length > 0
                    ? performanceMetrics.reduce((sum, m) => sum + m.metric_value, 0) / performanceMetrics.length
                    : 0
            }
        };
    }

    async performDataAnalysis(testResults, issues, performanceMetrics) {
        // Time-based analysis
        const timeAnalysis = this.analyzeTimePatterns(testResults, issues);

        // Error pattern analysis
        const errorPatterns = this.analyzeErrorPatterns(testResults, issues);

        // Performance trend analysis
        const performanceTrends = this.analyzePerformanceTrends(performanceMetrics);

        // Test stability analysis
        const stabilityAnalysis = this.analyzeTestStability(testResults);

        return {
            timePatterns: timeAnalysis,
            errorPatterns,
            performanceTrends,
            stability: stabilityAnalysis,
            recommendations: this.generateRecommendations(testResults, issues, performanceMetrics)
        };
    }

    analyzeTimePatterns(testResults, issues) {
        const patterns = {
            testFrequency: {},
            issueFrequency: {},
            peakTimes: []
        };

        // Analyze test frequency by hour
        testResults.forEach(test => {
            const hour = new Date(test.created_at).getHours();
            patterns.testFrequency[hour] = (patterns.testFrequency[hour] || 0) + 1;
        });

        // Analyze issue frequency by hour
        issues.forEach(issue => {
            const hour = new Date(issue.created_at).getHours();
            patterns.issueFrequency[hour] = (patterns.issueFrequency[hour] || 0) + 1;
        });

        return patterns;
    }

    analyzeErrorPatterns(testResults, issues) {
        const patterns = {
            commonErrors: {},
            failingFlows: {},
            errorCorrelation: []
        };

        // Find common error messages
        testResults.filter(t => t.status === 'failed').forEach(test => {
            if (test.error_message) {
                const key = test.error_message.substring(0, 100);
                patterns.commonErrors[key] = (patterns.commonErrors[key] || 0) + 1;
            }
        });

        // Find frequently failing test flows
        testResults.filter(t => t.status === 'failed').forEach(test => {
            const flow = test.flow_name || test.test_name;
            patterns.failingFlows[flow] = (patterns.failingFlows[flow] || 0) + 1;
        });

        return patterns;
    }

    analyzePerformanceTrends(performanceMetrics) {
        const trends = {
            responseTimeOverTime: [],
            metricsByType: {},
            degradationPoints: []
        };

        // Group metrics by type
        performanceMetrics.forEach(metric => {
            if (!trends.metricsByType[metric.metric_name]) {
                trends.metricsByType[metric.metric_name] = [];
            }
            trends.metricsByType[metric.metric_name].push({
                value: metric.metric_value,
                timestamp: metric.recorded_at
            });
        });

        // Detect performance degradation
        Object.entries(trends.metricsByType).forEach(([metricName, values]) => {
            if (values.length > 10) {
                const recent = values.slice(-5);
                const older = values.slice(0, 5);
                const recentAvg = recent.reduce((sum, v) => sum + v.value, 0) / recent.length;
                const olderAvg = older.reduce((sum, v) => sum + v.value, 0) / older.length;

                if (recentAvg > olderAvg * 1.5) { // 50% degradation threshold
                    trends.degradationPoints.push({
                        metric: metricName,
                        degradation: ((recentAvg - olderAvg) / olderAvg * 100).toFixed(1),
                        recentAvg: recentAvg.toFixed(2),
                        olderAvg: olderAvg.toFixed(2)
                    });
                }
            }
        });

        return trends;
    }

    analyzeTestStability(testResults) {
        const stability = {
            overallStability: 0,
            unstableFlows: [],
            stabilityTrend: 'stable'
        };

        // Group tests by flow name
        const flowResults = {};
        testResults.forEach(test => {
            const flow = test.flow_name || test.test_name;
            if (!flowResults[flow]) {
                flowResults[flow] = [];
            }
            flowResults[flow].push(test.status === 'passed');
        });

        // Calculate stability for each flow
        Object.entries(flowResults).forEach(([flow, results]) => {
            if (results.length >= 5) { // Only analyze flows with sufficient data
                const successRate = results.filter(r => r).length / results.length;
                if (successRate < 0.8) { // Less than 80% success rate
                    stability.unstableFlows.push({
                        flow,
                        successRate: (successRate * 100).toFixed(1),
                        attempts: results.length
                    });
                }
            }
        });

        // Calculate overall stability
        const totalPassed = testResults.filter(t => t.status === 'passed').length;
        stability.overallStability = testResults.length > 0
            ? (totalPassed / testResults.length * 100).toFixed(1)
            : 0;

        return stability;
    }

    generateRecommendations(testResults, issues, performanceMetrics) {
        const recommendations = [];

        // Test-based recommendations
        const failureRate = testResults.length > 0
            ? (testResults.filter(t => t.status === 'failed').length / testResults.length)
            : 0;

        if (failureRate > 0.2) {
            recommendations.push({
                category: 'Test Quality',
                priority: 'high',
                title: 'High Test Failure Rate Detected',
                description: `${(failureRate * 100).toFixed(1)}% of tests are failing. Review test implementation and application stability.`,
                actionItems: [
                    'Review failing test patterns',
                    'Check application logs for errors',
                    'Consider test environment stability'
                ]
            });
        }

        // Issue-based recommendations
        const highSeverityIssues = issues.filter(i => i.severity === 'high').length;
        if (highSeverityIssues > 0) {
            recommendations.push({
                category: 'Critical Issues',
                priority: 'high',
                title: 'Critical Issues Require Immediate Attention',
                description: `Found ${highSeverityIssues} high-severity issues that need immediate resolution.`,
                actionItems: [
                    'Review and fix high-severity issues',
                    'Implement error monitoring',
                    'Add preventive measures'
                ]
            });
        }

        // Performance-based recommendations
        const avgResponseTime = testResults.length > 0
            ? testResults.reduce((sum, t) => sum + t.duration_ms, 0) / testResults.length
            : 0;

        if (avgResponseTime > 5000) {
            recommendations.push({
                category: 'Performance',
                priority: 'medium',
                title: 'Slow Response Times Detected',
                description: `Average response time is ${avgResponseTime.toFixed(0)}ms, which may impact user experience.`,
                actionItems: [
                    'Profile application performance',
                    'Optimize database queries',
                    'Consider caching strategies',
                    'Review server resources'
                ]
            });
        }

        return recommendations;
    }

    async collectEvidence(sessionId) {
        const evidence = {
            screenshots: [],
            videos: [],
            traces: [],
            logs: []
        };

        try {
            // Collect screenshots
            const screenshotFiles = await fs.readdir('./screenshots');
            evidence.screenshots = screenshotFiles
                .filter(file => file.includes(sessionId) || file.includes('error'))
                .map(file => ({ filename: file, path: `./screenshots/${file}` }));

            // Collect videos
            const videoFiles = await fs.readdir('./videos');
            evidence.videos = videoFiles
                .filter(file => file.includes(sessionId))
                .map(file => ({ filename: file, path: `./videos/${file}` }));

            // Collect traces
            const traceFiles = await fs.readdir('./traces');
            evidence.traces = traceFiles
                .filter(file => file.includes(sessionId) || file.includes('error'))
                .map(file => ({ filename: file, path: `./traces/${file}` }));

        } catch (error) {
            console.warn(chalk.yellow('Warning: Could not collect all evidence files'), error.message);
        }

        return evidence;
    }

    async generateHTMLReport(reportData) {
        const templateContent = await fs.readFile(path.join(this.templatePath, 'report.html'), 'utf-8');
        const cssContent = await fs.readFile(path.join(this.templatePath, 'report.css'), 'utf-8');

        // Replace template variables
        let htmlContent = templateContent
            .replace(/{{SESSION_ID}}/g, reportData.metadata.sessionId)
            .replace(/{{GENERATED_AT}}/g, reportData.metadata.generatedAt.toISOString())
            .replace(/{{PROJECT_NAME}}/g, reportData.session?.project_name || 'Unknown')
            .replace(/{{TOTAL_TESTS}}/g, reportData.summary.testExecution.totalTests)
            .replace(/{{PASSED_TESTS}}/g, reportData.summary.testExecution.passedTests)
            .replace(/{{FAILED_TESTS}}/g, reportData.summary.testExecution.failedTests)
            .replace(/{{SUCCESS_RATE}}/g, reportData.summary.testExecution.successRate)
            .replace(/{{AVG_RESPONSE_TIME}}/g, reportData.summary.testExecution.avgResponseTime)
            .replace(/{{TOTAL_ISSUES}}/g, reportData.summary.issues.total)
            .replace(/{{HIGH_ISSUES}}/g, reportData.summary.issues.bySeverity.high || 0)
            .replace(/{{MEDIUM_ISSUES}}/g, reportData.summary.issues.bySeverity.medium || 0)
            .replace(/{{LOW_ISSUES}}/g, reportData.summary.issues.bySeverity.low || 0)
            .replace(/{{CSS_CONTENT}}/g, cssContent);

        // Generate test results table
        const testResultsHTML = this.generateTestResultsTable(reportData.testResults);
        htmlContent = htmlContent.replace(/{{TEST_RESULTS_TABLE}}/g, testResultsHTML);

        // Generate issues table
        const issuesHTML = this.generateIssuesTable(reportData.issues);
        htmlContent = htmlContent.replace(/{{ISSUES_TABLE}}/g, issuesHTML);

        // Generate recommendations
        const recommendationsHTML = this.generateRecommendationsHTML(reportData.analysis.recommendations);
        htmlContent = htmlContent.replace(/{{RECOMMENDATIONS}}/g, recommendationsHTML);

        // Save report
        const reportFilename = `report_${reportData.metadata.sessionId}_${Date.now()}.html`;
        const reportPath = path.join(this.outputPath, 'html', reportFilename);
        await fs.writeFile(reportPath, htmlContent);

        return reportPath;
    }

    generateTestResultsTable(testResults) {
        const rows = testResults.slice(0, 100).map(test => `
            <tr class="${test.status}">
                <td>${test.test_name}</td>
                <td>${test.test_type}</td>
                <td><span class="status ${test.status}">${test.status}</span></td>
                <td>${test.duration_ms}ms</td>
                <td>${test.page_url || 'N/A'}</td>
                <td>${new Date(test.created_at).toLocaleString()}</td>
            </tr>
        `).join('');

        return `
            <table class="results-table">
                <thead>
                    <tr>
                        <th>Test Name</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Page URL</th>
                        <th>Timestamp</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    generateIssuesTable(issues) {
        const rows = issues.slice(0, 50).map(issue => `
            <tr class="severity-${issue.severity}">
                <td>${issue.title}</td>
                <td><span class="severity ${issue.severity}">${issue.severity}</span></td>
                <td>${issue.source}</td>
                <td>${issue.page_url || 'N/A'}</td>
                <td>${issue.count}</td>
                <td>${new Date(issue.created_at).toLocaleString()}</td>
            </tr>
        `).join('');

        return `
            <table class="issues-table">
                <thead>
                    <tr>
                        <th>Issue</th>
                        <th>Severity</th>
                        <th>Source</th>
                        <th>Page</th>
                        <th>Count</th>
                        <th>First Seen</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        `;
    }

    generateRecommendationsHTML(recommendations) {
        const items = recommendations.map(rec => `
            <div class="recommendation priority-${rec.priority}">
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
                <ul>
                    ${rec.actionItems.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
        `).join('');

        return items;
    }

    async generateJSONReport(reportData) {
        const reportFilename = `report_${reportData.metadata.sessionId}_${Date.now()}.json`;
        const reportPath = path.join(this.outputPath, 'json', reportFilename);
        await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2));
        return reportPath;
    }

    async generateCSVReport(reportData) {
        // Generate CSV for test results
        const csvHeaders = ['Test Name', 'Type', 'Status', 'Duration (ms)', 'Page URL', 'Timestamp', 'Error Message'];
        const csvRows = reportData.testResults.map(test => [
            test.test_name,
            test.test_type,
            test.status,
            test.duration_ms,
            test.page_url || '',
            test.created_at,
            test.error_message || ''
        ]);

        const csvContent = [
            csvHeaders.join(','),
            ...csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const reportFilename = `report_${reportData.metadata.sessionId}_${Date.now()}.csv`;
        const reportPath = path.join(this.outputPath, 'csv', reportFilename);
        await fs.writeFile(reportPath, csvContent);
        return reportPath;
    }

    async generatePDFReport(reportData) {
        // For PDF generation, we'd typically use a library like Puppeteer or pdf-lib
        // For now, we'll create a simple text-based report
        const textContent = this.generateTextReport(reportData);

        const reportFilename = `report_${reportData.metadata.sessionId}_${Date.now()}.txt`;
        const reportPath = path.join(this.outputPath, 'pdf', reportFilename);
        await fs.writeFile(reportPath, textContent);
        return reportPath;
    }

    generateTextReport(reportData) {
        return `
TESTER Autonomous Stress Testing Report
======================================

Session ID: ${reportData.metadata.sessionId}
Generated: ${reportData.metadata.generatedAt.toISOString()}
Project: ${reportData.session?.project_name || 'Unknown'}

SUMMARY
-------
Total Tests: ${reportData.summary.testExecution.totalTests}
Passed: ${reportData.summary.testExecution.passedTests}
Failed: ${reportData.summary.testExecution.failedTests}
Success Rate: ${reportData.summary.testExecution.successRate}%
Average Response Time: ${reportData.summary.testExecution.avgResponseTime}ms

ISSUES
------
Total Issues: ${reportData.summary.issues.total}
High Severity: ${reportData.summary.issues.bySeverity.high || 0}
Medium Severity: ${reportData.summary.issues.bySeverity.medium || 0}
Low Severity: ${reportData.summary.issues.bySeverity.low || 0}

RECOMMENDATIONS
--------------
${reportData.analysis.recommendations.map(rec => `
${rec.title} (${rec.priority})
${rec.description}
Action Items:
${rec.actionItems.map(item => `- ${item}`).join('\n')}
`).join('\n')}

TEST RESULTS (Last 20)
---------------------
${reportData.testResults.slice(0, 20).map(test => `
${test.test_name} - ${test.status} (${test.duration_ms}ms)
${test.error_message ? `Error: ${test.error_message}` : ''}
`).join('\n')}
        `;
    }

    async generateDownloadableReport(sessionId, format = 'html') {
        const report = await this.generateReport(sessionId, format);

        // Create a comprehensive archive with all evidence
        const archivePath = await this.createReportArchive(sessionId, report);

        return archivePath;
    }

    async createReportArchive(sessionId, report) {
        const archiveFilename = `tester_report_${sessionId}_${Date.now()}.zip`;
        const archivePath = path.join(this.outputPath, 'archive', archiveFilename);

        return new Promise((resolve, reject) => {
            const output = require('fs').createWriteStream(archivePath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                console.log(chalk.green(`📦 Report archive created: ${archivePath} (${archive.pointer()} bytes)`));
                resolve(archivePath);
            });

            archive.on('error', (err) => {
                reject(err);
            });

            archive.pipe(output);

            // Add main report
            archive.file(report.reportPath, { name: path.basename(report.reportPath) });

            // Add evidence files
            if (report.data.evidence) {
                // Add screenshots
                report.data.evidence.screenshots.forEach(screenshot => {
                    try {
                        archive.file(screenshot.path, { name: `evidence/screenshots/${screenshot.filename}` });
                    } catch (error) {
                        console.warn(chalk.yellow(`Warning: Could not add screenshot ${screenshot.filename}`));
                    }
                });

                // Add videos
                report.data.evidence.videos.forEach(video => {
                    try {
                        archive.file(video.path, { name: `evidence/videos/${video.filename}` });
                    } catch (error) {
                        console.warn(chalk.yellow(`Warning: Could not add video ${video.filename}`));
                    }
                });

                // Add traces
                report.data.evidence.traces.forEach(trace => {
                    try {
                        archive.file(trace.path, { name: `evidence/traces/${trace.filename}` });
                    } catch (error) {
                        console.warn(chalk.yellow(`Warning: Could not add trace ${trace.filename}`));
                    }
                });
            }

            // Add JSON report for machine processing
            const jsonData = JSON.stringify(report.data, null, 2);
            archive.append(jsonData, { name: 'data.json' });

            archive.finalize();
        });
    }

    async createHTMLTemplate() {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TESTER Report - {{SESSION_ID}}</title>
    <style>{{CSS_CONTENT}}</style>
</head>
<body>
    <div class="container">
        <header class="header">
            <h1>TESTER Autonomous Stress Testing Report</h1>
            <div class="header-info">
                <p><strong>Session ID:</strong> {{SESSION_ID}}</p>
                <p><strong>Project:</strong> {{PROJECT_NAME}}</p>
                <p><strong>Generated:</strong> {{GENERATED_AT}}</p>
            </div>
        </header>

        <section class="summary">
            <h2>Executive Summary</h2>
            <div class="summary-grid">
                <div class="summary-card">
                    <h3>Test Execution</h3>
                    <div class="metric">
                        <span class="value">{{TOTAL_TESTS}}</span>
                        <span class="label">Total Tests</span>
                    </div>
                    <div class="metric">
                        <span class="value success">{{PASSED_TESTS}}</span>
                        <span class="label">Passed</span>
                    </div>
                    <div class="metric">
                        <span class="value error">{{FAILED_TESTS}}</span>
                        <span class="label">Failed</span>
                    </div>
                    <div class="metric">
                        <span class="value">{{SUCCESS_RATE}}%</span>
                        <span class="label">Success Rate</span>
                    </div>
                </div>

                <div class="summary-card">
                    <h3>Performance</h3>
                    <div class="metric">
                        <span class="value">{{AVG_RESPONSE_TIME}}ms</span>
                        <span class="label">Avg Response Time</span>
                    </div>
                </div>

                <div class="summary-card">
                    <h3>Issues Detected</h3>
                    <div class="metric">
                        <span class="value">{{TOTAL_ISSUES}}</span>
                        <span class="label">Total Issues</span>
                    </div>
                    <div class="metric">
                        <span class="value error">{{HIGH_ISSUES}}</span>
                        <span class="label">High Severity</span>
                    </div>
                    <div class="metric">
                        <span class="value warning">{{MEDIUM_ISSUES}}</span>
                        <span class="label">Medium Severity</span>
                    </div>
                    <div class="metric">
                        <span class="value info">{{LOW_ISSUES}}</span>
                        <span class="label">Low Severity</span>
                    </div>
                </div>
            </div>
        </section>

        <section class="recommendations">
            <h2>Recommendations</h2>
            {{RECOMMENDATIONS}}
        </section>

        <section class="test-results">
            <h2>Test Results</h2>
            {{TEST_RESULTS_TABLE}}
        </section>

        <section class="issues">
            <h2>Issues Detected</h2>
            {{ISSUES_TABLE}}
        </section>

        <footer class="footer">
            <p>Generated by TESTER Autonomous Stress Testing System</p>
            <p>Report Version: 1.0.0</p>
        </footer>
    </div>
</body>
</html>
        `;
    }

    async createCSSStyles() {
        return `
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #f5f5f5;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    background: white;
    box-shadow: 0 0 10px rgba(0,0,0,0.1);
}

.header {
    border-bottom: 3px solid #007acc;
    padding-bottom: 20px;
    margin-bottom: 30px;
}

.header h1 {
    color: #007acc;
    font-size: 2.5em;
    margin-bottom: 10px;
}

.header-info {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
}

.header-info p {
    color: #666;
}

.summary {
    margin-bottom: 30px;
}

.summary h2 {
    color: #333;
    margin-bottom: 20px;
    font-size: 1.8em;
}

.summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
}

.summary-card {
    background: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 8px;
    padding: 20px;
}

.summary-card h3 {
    color: #495057;
    margin-bottom: 15px;
    font-size: 1.2em;
}

.metric {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
    padding: 8px 0;
    border-bottom: 1px solid #e9ecef;
}

.metric:last-child {
    border-bottom: none;
}

.value {
    font-size: 1.4em;
    font-weight: bold;
}

.value.success { color: #28a745; }
.value.error { color: #dc3545; }
.value.warning { color: #ffc107; }
.value.info { color: #17a2b8; }

.label {
    color: #6c757d;
    font-size: 0.9em;
}

.recommendations, .test-results, .issues {
    margin-bottom: 30px;
}

.recommendations h2, .test-results h2, .issues h2 {
    color: #333;
    margin-bottom: 20px;
    font-size: 1.8em;
}

.recommendation {
    background: #f8f9fa;
    border-left: 4px solid #007acc;
    padding: 15px;
    margin-bottom: 15px;
    border-radius: 4px;
}

.recommendation.priority-high {
    border-left-color: #dc3545;
    background-color: #f8d7da;
}

.recommendation.priority-medium {
    border-left-color: #ffc107;
    background-color: #fff3cd;
}

.recommendation h4 {
    color: #333;
    margin-bottom: 10px;
}

.recommendation p {
    margin-bottom: 10px;
    color: #666;
}

.recommendation ul {
    margin-left: 20px;
}

.recommendation li {
    color: #555;
    margin-bottom: 5px;
}

.results-table, .issues-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
}

.results-table th, .issues-table th {
    background-color: #007acc;
    color: white;
    padding: 12px;
    text-align: left;
    font-weight: 600;
}

.results-table td, .issues-table td {
    padding: 10px 12px;
    border-bottom: 1px solid #dee2e6;
}

.results-table tr:nth-child(even), .issues-table tr:nth-child(even) {
    background-color: #f8f9fa;
}

.results-table tr.failed {
    background-color: #f8d7da;
}

.results-table tr.passed {
    background-color: #d4edda;
}

.status, .severity {
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 0.85em;
    font-weight: 600;
    text-transform: uppercase;
}

.status.passed, .severity.low {
    background-color: #d4edda;
    color: #155724;
}

.status.failed, .severity.high {
    background-color: #f8d7da;
    color: #721c24;
}

.severity.medium {
    background-color: #fff3cd;
    color: #856404;
}

.footer {
    border-top: 1px solid #dee2e6;
    padding-top: 20px;
    margin-top: 40px;
    text-align: center;
    color: #666;
    font-size: 0.9em;
}

@media (max-width: 768px) {
    .container {
        margin: 0;
        padding: 10px;
    }

    .header-info {
        flex-direction: column;
        gap: 10px;
    }

    .summary-grid {
        grid-template-columns: 1fr;
    }

    .results-table, .issues-table {
        font-size: 0.9em;
    }

    .results-table th, .issues-table th,
    .results-table td, .issues-table td {
        padding: 8px;
    }
}
        `;
    }
}

module.exports = ReportingEngine;