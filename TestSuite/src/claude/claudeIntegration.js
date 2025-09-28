/**
 * Claude Integration Module
 * Real-time monitoring and auto-fixing integration
 * Handles signal-based communication and automated analysis
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

class ClaudeIntegration {
    constructor(activityLogger, database = null) {
        this.activityLogger = activityLogger;
        this.db = database;
        this.monitoringEnabled = false;
        this.signalCheckInterval = null;
        this.logDirectory = null;
        this.signalProcessors = new Map();

        // Initialize signal processors
        this.initializeSignalProcessors();
    }

    initializeSignalProcessors() {
        // Test session started signal
        this.signalProcessors.set('test-session-started', async (signal) => {
            await this.handleTestSessionStarted(signal);
        });

        // Test session completed signal
        this.signalProcessors.set('test-session-completed', async (signal) => {
            await this.handleTestSessionCompleted(signal);
        });

        // Test failure signal
        this.signalProcessors.set('test-failure', async (signal) => {
            await this.handleTestFailure(signal);
        });

        // Feature discovery signal
        this.signalProcessors.set('feature-discovery-completed', async (signal) => {
            await this.handleFeatureDiscovery(signal);
        });

        // Error detection signal
        this.signalProcessors.set('error-detected', async (signal) => {
            await this.handleErrorDetection(signal);
        });
    }

    async initialize(logDirectory) {
        try {
            this.logDirectory = logDirectory;
            console.log(chalk.blue('🤖 Initializing Claude Integration...'));

            // Ensure log directory exists
            await fs.mkdir(logDirectory, { recursive: true });

            // Create monitoring enabled signal
            await this.activityLogger.signalMonitoringEnabled();

            console.log(chalk.green('✅ Claude Integration initialized'));
            return true;

        } catch (error) {
            console.error(chalk.red('❌ Claude Integration initialization failed:'), error);
            return false;
        }
    }

    async startMonitoring() {
        if (this.monitoringEnabled) {
            console.log(chalk.yellow('⚠️ Claude monitoring already enabled'));
            return;
        }

        console.log(chalk.blue('🤖 Starting Claude monitoring...'));
        this.monitoringEnabled = true;

        // Start signal file monitoring
        this.signalCheckInterval = setInterval(async () => {
            await this.checkForSignals();
        }, 2000); // Check every 2 seconds

        // Log monitoring start
        await this.activityLogger.logActivity('info', 'Claude monitoring started', {
            component: 'ClaudeIntegration',
            monitoringInterval: '2000ms'
        });

        console.log(chalk.green('✅ Claude monitoring active'));
    }

    async stopMonitoring() {
        if (!this.monitoringEnabled) {
            console.log(chalk.yellow('⚠️ Claude monitoring not active'));
            return;
        }

        console.log(chalk.blue('🤖 Stopping Claude monitoring...'));
        this.monitoringEnabled = false;

        if (this.signalCheckInterval) {
            clearInterval(this.signalCheckInterval);
            this.signalCheckInterval = null;
        }

        // Create monitoring disabled signal
        await this.activityLogger.signalMonitoringDisabled();

        console.log(chalk.green('✅ Claude monitoring stopped'));
    }

    async checkForSignals() {
        if (!this.logDirectory || !this.monitoringEnabled) {
            return;
        }

        try {
            const files = await fs.readdir(this.logDirectory);
            const signalFiles = files.filter(file => file.endsWith('.signal'));

            for (const signalFile of signalFiles) {
                await this.processSignalFile(path.join(this.logDirectory, signalFile));
            }

        } catch (error) {
            console.warn(chalk.yellow('⚠️ Signal check failed:'), error.message);
        }
    }

    async processSignalFile(signalPath) {
        try {
            const signalContent = await fs.readFile(signalPath, 'utf8');
            const signal = JSON.parse(signalContent);

            if (this.signalProcessors.has(signal.signalType)) {
                console.log(chalk.cyan(`🔔 Processing signal: ${signal.signalType}`));

                const processor = this.signalProcessors.get(signal.signalType);
                await processor(signal);

                await this.activityLogger.logActivity('info', `Processed Claude signal: ${signal.signalType}`, {
                    signalData: signal,
                    processedAt: new Date()
                });
            }

            // Auto-cleanup signal file after processing (30 second delay)
            setTimeout(async () => {
                try {
                    await fs.unlink(signalPath);
                } catch (error) {
                    // File might already be deleted, ignore
                }
            }, 30000);

        } catch (error) {
            console.warn(chalk.yellow(`⚠️ Failed to process signal file ${signalPath}:`), error.message);
        }
    }

    async handleTestSessionStarted(signal) {
        console.log(chalk.blue('📊 Test session started - initiating Claude analysis'));

        await this.activityLogger.logActivity('info', 'Test session analysis initiated', {
            sessionId: signal.sessionId,
            config: signal.config,
            analysisType: 'session_start'
        });

        // Generate analysis summary for Claude
        const analysisSummary = {
            timestamp: new Date(),
            sessionId: signal.sessionId,
            analysis: 'TEST_SESSION_STARTED',
            config: signal.config,
            recommendations: [
                'Monitor test execution progress',
                'Watch for element selector failures',
                'Track API response times',
                'Identify error patterns'
            ],
            nextActions: [
                'Monitor activity logs for failures',
                'Prepare auto-fix strategies',
                'Track performance metrics'
            ]
        };

        await this.saveAnalysisReport(signal.sessionId, analysisSummary);
    }

    async handleTestSessionCompleted(signal) {
        console.log(chalk.blue('📊 Test session completed - generating final analysis'));

        const sessionStats = signal.sessionStats || {};
        const failures = signal.failures || [];

        // Generate completion analysis
        const completionAnalysis = {
            timestamp: new Date(),
            sessionId: signal.sessionId,
            analysis: 'TEST_SESSION_COMPLETED',
            results: {
                totalTests: sessionStats.totalTests || 0,
                successRate: sessionStats.successRate || 0,
                failures: failures.length,
                duration: sessionStats.duration || 0
            },
            recommendations: this.generateRecommendations(sessionStats, failures),
            autoFixOpportunities: this.identifyAutoFixOpportunities(failures)
        };

        await this.saveAnalysisReport(signal.sessionId, completionAnalysis);

        // Log completion summary
        await this.activityLogger.logActivity('info', 'Test session analysis completed', {
            sessionId: signal.sessionId,
            successRate: sessionStats.successRate,
            failureCount: failures.length,
            analysisGenerated: true
        });
    }

    async handleTestFailure(signal) {
        console.log(chalk.red('🔴 Test failure detected - analyzing for auto-fix'));

        const failure = signal.failure || {};
        const autoFixSuggestion = await this.analyzeFailureForAutoFix(failure);

        if (autoFixSuggestion.canAutoFix) {
            console.log(chalk.yellow('🔧 Auto-fix opportunity detected'));

            await this.activityLogger.logActivity('warning', 'Auto-fix opportunity identified', {
                failure: failure,
                autoFixType: autoFixSuggestion.fixType,
                confidence: autoFixSuggestion.confidence
            });

            // Create auto-fix signal for TestSuite
            await this.activityLogger.signalAutoFixRequired(failure, autoFixSuggestion);
        }

        // Generate failure analysis
        const failureAnalysis = {
            timestamp: new Date(),
            sessionId: signal.sessionId,
            analysis: 'TEST_FAILURE_ANALYSIS',
            failure: failure,
            autoFixSuggestion: autoFixSuggestion,
            troubleshootingSteps: this.generateTroubleshootingSteps(failure)
        };

        await this.saveAnalysisReport(signal.sessionId, failureAnalysis);
    }

    async handleFeatureDiscovery(signal) {
        console.log(chalk.blue('🎯 Feature discovery completed - updating testing scope'));

        const discoveredFeatures = signal.features || [];
        const testingScope = signal.testingScope || {};

        // Generate feature analysis
        const featureAnalysis = {
            timestamp: new Date(),
            sessionId: signal.sessionId,
            analysis: 'FEATURE_DISCOVERY_COMPLETED',
            discoveredFeatures: discoveredFeatures.length,
            highPriorityFeatures: discoveredFeatures.filter(f => f.priority === 'high').length,
            testingScope: testingScope,
            scopeRecommendations: this.generateScopeRecommendations(discoveredFeatures, testingScope)
        };

        await this.saveAnalysisReport(signal.sessionId, featureAnalysis);

        await this.activityLogger.logActivity('info', 'Feature discovery analysis completed', {
            featuresDiscovered: discoveredFeatures.length,
            testingScopeUpdated: true
        });
    }

    async handleErrorDetection(signal) {
        console.log(chalk.red('⚠️ Error detected - analyzing severity and impact'));

        const error = signal.error || {};
        const errorAnalysis = await this.analyzeError(error);

        // Generate error analysis
        const analysis = {
            timestamp: new Date(),
            sessionId: signal.sessionId,
            analysis: 'ERROR_DETECTION_ANALYSIS',
            error: error,
            severity: errorAnalysis.severity,
            impact: errorAnalysis.impact,
            possibleCauses: errorAnalysis.possibleCauses,
            recommendedActions: errorAnalysis.recommendedActions
        };

        await this.saveAnalysisReport(signal.sessionId, analysis);

        if (errorAnalysis.severity === 'critical') {
            await this.activityLogger.logActivity('error', 'Critical error detected requiring immediate attention', {
                error: error,
                severity: errorAnalysis.severity,
                impact: errorAnalysis.impact
            });
        }
    }

    async analyzeFailureForAutoFix(failure) {
        const suggestion = {
            canAutoFix: false,
            fixType: null,
            confidence: 0,
            actions: []
        };

        // Element not found - selector issues
        if (failure.type === 'element_not_found' || failure.message?.includes('not found')) {
            suggestion.canAutoFix = true;
            suggestion.fixType = 'selector_update';
            suggestion.confidence = 0.8;
            suggestion.actions = [
                'Re-run element discovery',
                'Update element selectors',
                'Use alternative selector strategies'
            ];
        }

        // Timeout errors
        if (failure.type === 'timeout' || failure.message?.includes('timeout')) {
            suggestion.canAutoFix = true;
            suggestion.fixType = 'timeout_adjustment';
            suggestion.confidence = 0.9;
            suggestion.actions = [
                'Increase timeout values',
                'Add wait conditions',
                'Check for loading states'
            ];
        }

        // Network/API errors
        if (failure.type === 'network_error' || failure.message?.includes('CORS')) {
            suggestion.canAutoFix = true;
            suggestion.fixType = 'network_configuration';
            suggestion.confidence = 0.7;
            suggestion.actions = [
                'Update CORS configuration',
                'Retry failed requests',
                'Check service health'
            ];
        }

        return suggestion;
    }

    async analyzeError(error) {
        const analysis = {
            severity: 'medium',
            impact: 'test_execution',
            possibleCauses: [],
            recommendedActions: []
        };

        // Console errors
        if (error.type === 'console') {
            if (error.message.includes('404') || error.message.includes('not found')) {
                analysis.severity = 'high';
                analysis.possibleCauses = ['Missing resources', 'Broken links', 'Incorrect URLs'];
                analysis.recommendedActions = ['Check resource paths', 'Verify file existence', 'Update URLs'];
            }

            if (error.message.includes('CORS')) {
                analysis.severity = 'high';
                analysis.possibleCauses = ['Cross-origin request blocked', 'Missing CORS headers'];
                analysis.recommendedActions = ['Configure CORS policy', 'Update API endpoints'];
            }
        }

        // Network errors
        if (error.type === 'network') {
            analysis.severity = 'critical';
            analysis.impact = 'application_unavailable';
            analysis.possibleCauses = ['Service downtime', 'Network connectivity', 'DNS issues'];
            analysis.recommendedActions = ['Check service status', 'Verify network connectivity', 'Restart services'];
        }

        return analysis;
    }

    generateRecommendations(sessionStats, failures) {
        const recommendations = [];

        if (sessionStats.successRate < 0.5) {
            recommendations.push('Success rate below 50% - investigate major issues');
        }

        if (failures.length > 10) {
            recommendations.push('High failure count - focus on most common failure patterns');
        }

        const selectorFailures = failures.filter(f => f.type === 'element_not_found').length;
        if (selectorFailures > 0) {
            recommendations.push(`${selectorFailures} selector failures - update element discovery strategy`);
        }

        const timeoutFailures = failures.filter(f => f.type === 'timeout').length;
        if (timeoutFailures > 0) {
            recommendations.push(`${timeoutFailures} timeout failures - adjust timing configurations`);
        }

        return recommendations;
    }

    generateScopeRecommendations(features, testingScope) {
        const recommendations = [];

        if (features.length === 0) {
            recommendations.push('No features detected - verify application is loading correctly');
        }

        const highPriorityFeatures = features.filter(f => f.priority === 'high').length;
        if (highPriorityFeatures > 0) {
            recommendations.push(`Focus testing on ${highPriorityFeatures} high-priority features first`);
        }

        if (testingScope.testScenarios?.length > 20) {
            recommendations.push('Large testing scope - consider prioritizing scenarios');
        }

        return recommendations;
    }

    generateTroubleshootingSteps(failure) {
        const steps = ['Review failure details', 'Check application logs'];

        if (failure.type === 'element_not_found') {
            steps.push('Verify element exists on page', 'Check selector accuracy', 'Run element discovery');
        }

        if (failure.type === 'timeout') {
            steps.push('Check network connectivity', 'Verify service response times', 'Increase timeout values');
        }

        if (failure.type === 'network_error') {
            steps.push('Check service status', 'Verify API endpoints', 'Review CORS configuration');
        }

        return steps;
    }

    identifyAutoFixOpportunities(failures) {
        const opportunities = [];

        const selectorFailures = failures.filter(f => f.type === 'element_not_found').length;
        if (selectorFailures > 0) {
            opportunities.push({
                type: 'selector_update',
                description: 'Update element selectors based on current page structure',
                confidence: 0.8,
                impact: 'high'
            });
        }

        const timeoutFailures = failures.filter(f => f.type === 'timeout').length;
        if (timeoutFailures > 0) {
            opportunities.push({
                type: 'timeout_adjustment',
                description: 'Adjust timeout values based on observed response times',
                confidence: 0.9,
                impact: 'medium'
            });
        }

        return opportunities;
    }

    async saveAnalysisReport(sessionId, analysis) {
        if (!this.logDirectory) {
            return;
        }

        try {
            const reportFile = path.join(this.logDirectory, `claude-analysis-${sessionId}-${Date.now()}.json`);
            await fs.writeFile(reportFile, JSON.stringify(analysis, null, 2));

            console.log(chalk.green(`✅ Claude analysis report saved: ${path.basename(reportFile)}`));

        } catch (error) {
            console.warn(chalk.yellow('⚠️ Failed to save analysis report:'), error.message);
        }
    }

    async getMonitoringStatus() {
        return {
            enabled: this.monitoringEnabled,
            logDirectory: this.logDirectory,
            signalProcessors: Array.from(this.signalProcessors.keys()),
            checkInterval: this.signalCheckInterval ? '2000ms' : null
        };
    }

    async cleanup() {
        await this.stopMonitoring();
        console.log(chalk.yellow('🤖 Claude Integration cleaned up'));
    }
}

module.exports = ClaudeIntegration;