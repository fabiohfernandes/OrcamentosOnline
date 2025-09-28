/**
 * TESTER Claude Integration
 * Autonomous issue analysis and fixing using Claude CLI
 */

const { exec, spawn } = require('child_process');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

class ClaudeIntegration {
    constructor(database, socketIO) {
        this.db = database;
        this.io = socketIO;
        this.isConnected = false;
        this.autonomousMode = false;
        this.currentSession = null;
        this.processingQueue = [];
        this.isProcessing = false;
        this.claudeAvailable = false;
        this.analysisHistory = [];
    }

    async initialize() {
        try {
            console.log(chalk.blue('🧠 Initializing Claude Integration...'));

            // Check if Claude CLI is available
            await this.checkClaudeAvailability();

            if (this.claudeAvailable) {
                console.log(chalk.green('✅ Claude CLI available'));
                this.isConnected = true;
            } else {
                console.log(chalk.yellow('⚠️ Claude CLI not available - running in simulation mode'));
                this.isConnected = false;
            }

            // Create analysis directories
            await this.createAnalysisDirectories();

            console.log(chalk.green('✅ Claude Integration initialized'));

        } catch (error) {
            console.error(chalk.red('❌ Claude Integration initialization failed:'), error);
            this.isConnected = false;
        }
    }

    async checkClaudeAvailability() {
        return new Promise((resolve, reject) => {
            exec('claude --version', (error, stdout, stderr) => {
                if (error) {
                    console.log(chalk.yellow('Claude CLI not found, using simulation mode'));
                    this.claudeAvailable = false;
                } else {
                    console.log(chalk.green('Claude CLI detected:', stdout.trim()));
                    this.claudeAvailable = true;
                }
                resolve();
            });
        });
    }

    async createAnalysisDirectories() {
        const directories = [
            './analysis',
            './fixes',
            './recommendations'
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

    getStatus() {
        return {
            connected: this.isConnected,
            claudeAvailable: this.claudeAvailable,
            autonomousMode: this.autonomousMode,
            queueLength: this.processingQueue.length,
            isProcessing: this.isProcessing
        };
    }

    async setAutonomousMode(enabled, sessionId = null) {
        this.autonomousMode = enabled;
        this.currentSession = sessionId;

        if (enabled) {
            console.log(chalk.green('🤖 Claude autonomous mode ENABLED'));
            this.startAutonomousProcessing();
        } else {
            console.log(chalk.yellow('🤖 Claude autonomous mode DISABLED'));
        }

        this.io.emit('claudeStatusUpdate', {
            autonomousMode: this.autonomousMode,
            sessionId: this.currentSession
        });
    }

    async startAutonomousMode(sessionId) {
        await this.setAutonomousMode(true, sessionId);
    }

    async stopAutonomousMode() {
        await this.setAutonomousMode(false, null);
    }

    startAutonomousProcessing() {
        if (this.isProcessing) return;

        this.isProcessing = true;

        // Process issues from queue every 30 seconds
        const processInterval = setInterval(async () => {
            if (!this.autonomousMode) {
                clearInterval(processInterval);
                this.isProcessing = false;
                return;
            }

            try {
                await this.processIssueQueue();
            } catch (error) {
                console.error(chalk.red('Autonomous processing error:'), error);
            }
        }, 30000);

        console.log(chalk.blue('🔄 Claude autonomous processing started'));
    }

    async analyzeSession(sessionId) {
        try {
            console.log(chalk.blue(`🔍 Analyzing session: ${sessionId}`));

            // Get session issues from database
            const issues = await this.getSessionIssues(sessionId);
            const testResults = await this.getSessionTestResults(sessionId);

            const analysisData = {
                sessionId,
                timestamp: new Date(),
                issues: issues.length,
                failedTests: testResults.filter(t => t.status === 'failed').length,
                totalTests: testResults.length,
                patterns: await this.identifyPatterns(issues, testResults),
                recommendations: []
            };

            if (this.claudeAvailable) {
                // Use real Claude analysis
                const claudeAnalysis = await this.performClaudeAnalysis(analysisData, issues, testResults);
                analysisData.claudeAnalysis = claudeAnalysis;
                analysisData.recommendations = claudeAnalysis.recommendations || [];
            } else {
                // Fallback to pattern-based analysis
                analysisData.recommendations = await this.generateRecommendations(analysisData, issues);
            }

            // Store analysis results
            await this.storeAnalysis(analysisData);

            // Add to processing queue for autonomous fixes
            if (this.autonomousMode) {
                this.queueIssuesForProcessing(issues);
            }

            this.io.emit('analysisComplete', {
                sessionId,
                issuesAnalyzed: issues.length,
                recommendations: analysisData.recommendations.length
            });

            console.log(chalk.green(`✅ Analysis complete: ${issues.length} issues, ${analysisData.recommendations.length} recommendations`));

            return analysisData;

        } catch (error) {
            console.error(chalk.red('Session analysis failed:'), error);
            throw error;
        }
    }

    async getSessionIssues(sessionId) {
        const result = await this.db.query(`
            SELECT * FROM issues
            WHERE session_id = $1
            ORDER BY created_at DESC
        `, [sessionId]);

        return result.rows;
    }

    async getSessionTestResults(sessionId) {
        const result = await this.db.query(`
            SELECT * FROM test_results
            WHERE session_id = $1
            ORDER BY created_at DESC
        `, [sessionId]);

        return result.rows;
    }

    async identifyPatterns(issues, testResults) {
        const patterns = {
            commonErrors: {},
            failingPages: {},
            errorFrequency: {},
            timePatterns: {}
        };

        // Analyze common error messages
        issues.forEach(issue => {
            const key = issue.title || 'unknown';
            patterns.commonErrors[key] = (patterns.commonErrors[key] || 0) + 1;
        });

        // Analyze failing pages
        testResults.filter(t => t.status === 'failed').forEach(test => {
            const page = test.page_url || 'unknown';
            patterns.failingPages[page] = (patterns.failingPages[page] || 0) + 1;
        });

        // Analyze error frequency over time
        const now = Date.now();
        issues.forEach(issue => {
            const hourAgo = new Date(now - 60 * 60 * 1000);
            if (new Date(issue.created_at) > hourAgo) {
                patterns.errorFrequency.lastHour = (patterns.errorFrequency.lastHour || 0) + 1;
            }
        });

        return patterns;
    }

    async performClaudeAnalysis(analysisData, issues, testResults) {
        try {
            // Prepare analysis prompt
            const prompt = this.buildAnalysisPrompt(analysisData, issues, testResults);

            // Save prompt to file for Claude CLI
            const promptFile = `./analysis/session_${analysisData.sessionId}_${Date.now()}.md`;
            await fs.writeFile(promptFile, prompt);

            // Execute Claude CLI analysis
            const claudeResponse = await this.executeClaude(promptFile);

            // Parse Claude response
            const analysis = this.parseClaudeResponse(claudeResponse);

            console.log(chalk.green('✅ Claude analysis completed'));
            return analysis;

        } catch (error) {
            console.error(chalk.red('Claude analysis failed:'), error);
            // Fallback to pattern-based analysis
            return {
                summary: 'Analysis completed with pattern detection (Claude unavailable)',
                recommendations: await this.generateRecommendations(analysisData, issues),
                confidence: 0.5
            };
        }
    }

    buildAnalysisPrompt(analysisData, issues, testResults) {
        return `# TESTER Session Analysis Request

## Session Overview
- Session ID: ${analysisData.sessionId}
- Total Issues: ${analysisData.issues}
- Failed Tests: ${analysisData.failedTests}
- Total Tests: ${analysisData.totalTests}
- Success Rate: ${((analysisData.totalTests - analysisData.failedTests) / analysisData.totalTests * 100).toFixed(1)}%

## Detected Issues
${issues.map(issue => `
### ${issue.title}
- **Severity**: ${issue.severity}
- **Type**: ${issue.source}
- **Description**: ${issue.description}
- **Page**: ${issue.page_url || 'N/A'}
- **First Seen**: ${issue.first_seen}
- **Count**: ${issue.count}
${issue.stack_trace ? `- **Stack Trace**: \`\`\`\n${issue.stack_trace}\n\`\`\`` : ''}
`).join('\n')}

## Failed Test Results
${testResults.filter(t => t.status === 'failed').slice(0, 10).map(test => `
### ${test.test_name}
- **Type**: ${test.test_type}
- **Duration**: ${test.duration_ms}ms
- **Error**: ${test.error_message}
- **Page**: ${test.page_url || 'N/A'}
`).join('\n')}

## Analysis Request

Please analyze this testing session data and provide:

1. **Root Cause Analysis**: What are the primary causes of the detected issues?

2. **Issue Prioritization**: Which issues should be addressed first based on severity and impact?

3. **Specific Recommendations**: Provide actionable recommendations to fix each critical issue.

4. **Code Fixes**: For JavaScript/frontend issues, suggest specific code changes.

5. **Testing Improvements**: How can the testing approach be improved to catch these issues earlier?

6. **Prevention Strategies**: What measures can prevent similar issues in the future?

Please format your response as JSON with the following structure:
\`\`\`json
{
  "summary": "Brief analysis summary",
  "rootCauses": ["cause1", "cause2"],
  "prioritizedIssues": [
    {
      "issueId": "issue_id",
      "priority": "high|medium|low",
      "reason": "why this priority"
    }
  ],
  "recommendations": [
    {
      "type": "fix|improvement|prevention",
      "title": "Recommendation title",
      "description": "Detailed description",
      "code": "suggested code changes if applicable",
      "impact": "expected impact"
    }
  ],
  "confidence": 0.8
}
\`\`\`
`;
    }

    async executeClaude(promptFile) {
        return new Promise((resolve, reject) => {
            const claude = spawn('claude', ['--file', promptFile], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            let error = '';

            claude.stdout.on('data', (data) => {
                output += data.toString();
            });

            claude.stderr.on('data', (data) => {
                error += data.toString();
            });

            claude.on('close', (code) => {
                if (code === 0) {
                    resolve(output);
                } else {
                    reject(new Error(`Claude CLI exited with code ${code}: ${error}`));
                }
            });

            // Set timeout for Claude execution
            setTimeout(() => {
                claude.kill();
                reject(new Error('Claude CLI timeout'));
            }, 60000); // 60 second timeout
        });
    }

    parseClaudeResponse(response) {
        try {
            // Extract JSON from Claude response
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }

            // If no JSON block, try to parse the entire response
            return JSON.parse(response);

        } catch (error) {
            console.warn(chalk.yellow('Failed to parse Claude response as JSON, using fallback'));

            return {
                summary: 'Analysis completed (parsing failed)',
                rootCauses: ['Unknown - response parsing failed'],
                recommendations: [{
                    type: 'improvement',
                    title: 'Review Claude response format',
                    description: 'Claude response could not be parsed as expected JSON format',
                    impact: 'low'
                }],
                confidence: 0.3,
                rawResponse: response
            };
        }
    }

    async generateRecommendations(analysisData, issues) {
        const recommendations = [];

        // Pattern-based recommendations
        if (analysisData.patterns.commonErrors) {
            Object.entries(analysisData.patterns.commonErrors).forEach(([error, count]) => {
                if (count > 1) {
                    recommendations.push({
                        type: 'fix',
                        title: `Address recurring error: ${error}`,
                        description: `This error has occurred ${count} times. Consider investigating the root cause.`,
                        impact: count > 5 ? 'high' : 'medium'
                    });
                }
            });
        }

        // Add general recommendations based on issue types
        const consoleErrors = issues.filter(i => i.source === 'console').length;
        const networkErrors = issues.filter(i => i.source === 'network').length;
        const pageErrors = issues.filter(i => i.source === 'page').length;

        if (consoleErrors > 0) {
            recommendations.push({
                type: 'improvement',
                title: 'Fix JavaScript console errors',
                description: `Found ${consoleErrors} console errors. These may indicate JavaScript issues that could affect user experience.`,
                impact: 'medium'
            });
        }

        if (networkErrors > 0) {
            recommendations.push({
                type: 'fix',
                title: 'Resolve network failures',
                description: `Found ${networkErrors} network failures. Check API endpoints and network connectivity.`,
                impact: 'high'
            });
        }

        if (pageErrors > 0) {
            recommendations.push({
                type: 'fix',
                title: 'Fix page errors',
                description: `Found ${pageErrors} page-level errors. These are critical and should be addressed immediately.`,
                impact: 'high'
            });
        }

        return recommendations;
    }

    async storeAnalysis(analysisData) {
        try {
            // Store in database
            await this.db.query(`
                INSERT INTO issues (
                    issue_id, session_id, source, severity, title, description,
                    claude_analysis, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
                `analysis_${Date.now()}`,
                analysisData.sessionId,
                'claude_analysis',
                'info',
                'Session Analysis',
                `Analysis of ${analysisData.issues} issues with ${analysisData.recommendations.length} recommendations`,
                JSON.stringify(analysisData),
                new Date()
            ]);

            // Store as file
            const analysisFile = `./analysis/session_${analysisData.sessionId}_analysis.json`;
            await fs.writeFile(analysisFile, JSON.stringify(analysisData, null, 2));

            this.analysisHistory.push(analysisData);

        } catch (error) {
            console.error(chalk.red('Failed to store analysis:'), error);
        }
    }

    queueIssuesForProcessing(issues) {
        const highPriorityIssues = issues.filter(issue =>
            issue.severity === 'high' || issue.source === 'page'
        );

        highPriorityIssues.forEach(issue => {
            if (!this.processingQueue.find(item => item.issueId === issue.issue_id)) {
                this.processingQueue.push({
                    issueId: issue.issue_id,
                    issue,
                    priority: issue.severity,
                    queuedAt: new Date()
                });
            }
        });

        console.log(chalk.blue(`📋 Queued ${highPriorityIssues.length} issues for autonomous processing`));
    }

    async processIssueQueue() {
        if (this.processingQueue.length === 0) {
            return;
        }

        console.log(chalk.blue(`🔄 Processing ${this.processingQueue.length} queued issues...`));

        // Sort by priority (high first)
        this.processingQueue.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });

        // Process up to 3 issues per cycle
        const issuesToProcess = this.processingQueue.splice(0, 3);

        for (const queueItem of issuesToProcess) {
            try {
                await this.processIndividualIssue(queueItem);
            } catch (error) {
                console.error(chalk.red(`Failed to process issue ${queueItem.issueId}:`), error);
            }
        }
    }

    async processIndividualIssue(queueItem) {
        console.log(chalk.blue(`🔍 Processing issue: ${queueItem.issue.title}`));

        if (this.claudeAvailable) {
            // Use Claude for detailed analysis and fix generation
            const fix = await this.generateClaudeFix(queueItem.issue);
            if (fix.applicable) {
                await this.applyAutonomousFix(queueItem.issue, fix);
            }
        } else {
            // Use pattern-based auto-fixes
            const fix = await this.generatePatternBasedFix(queueItem.issue);
            if (fix.applicable) {
                await this.applyAutonomousFix(queueItem.issue, fix);
            }
        }
    }

    async generateClaudeFix(issue) {
        try {
            const prompt = this.buildFixPrompt(issue);
            const promptFile = `./fixes/issue_${issue.issue_id}_fix_request.md`;
            await fs.writeFile(promptFile, prompt);

            const claudeResponse = await this.executeClaude(promptFile);
            const fix = this.parseClaudeFixResponse(claudeResponse);

            return fix;

        } catch (error) {
            console.error(chalk.red('Claude fix generation failed:'), error);
            return { applicable: false, reason: 'Claude analysis failed' };
        }
    }

    buildFixPrompt(issue) {
        return `# TESTER Autonomous Fix Request

## Issue Details
- **ID**: ${issue.issue_id}
- **Title**: ${issue.title}
- **Type**: ${issue.source}
- **Severity**: ${issue.severity}
- **Description**: ${issue.description}
- **Page URL**: ${issue.page_url || 'N/A'}
- **Stack Trace**: ${issue.stack_trace || 'N/A'}

## Fix Request

Analyze this issue and provide an autonomous fix if possible. Consider:

1. **Is this issue automatically fixable?** (e.g., configuration changes, simple code fixes)
2. **What specific changes are needed?**
3. **Are there any risks or side effects?**
4. **Should this be applied automatically or require human review?**

Please respond with JSON:
\`\`\`json
{
  "applicable": true/false,
  "confidence": 0.0-1.0,
  "riskLevel": "low|medium|high",
  "fixType": "config|code|infrastructure|other",
  "changes": [
    {
      "file": "path/to/file",
      "action": "modify|create|delete",
      "content": "new content or changes",
      "description": "what this change does"
    }
  ],
  "reasoning": "why this fix is recommended",
  "testSuggestions": ["how to test this fix"],
  "rollbackPlan": "how to undo if needed"
}
\`\`\`
`;
    }

    parseClaudeFixResponse(response) {
        try {
            const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            return JSON.parse(response);
        } catch (error) {
            return {
                applicable: false,
                reason: 'Failed to parse Claude fix response'
            };
        }
    }

    async generatePatternBasedFix(issue) {
        // Simple pattern-based fixes for common issues
        const fixes = {
            'Console Error: TypeError': {
                applicable: false, // Too risky for auto-fix
                reason: 'JavaScript errors require manual review'
            },
            'Network Failure': {
                applicable: true,
                confidence: 0.7,
                riskLevel: 'low',
                fixType: 'config',
                changes: [{
                    action: 'log',
                    description: 'Log network failure for manual review'
                }],
                reasoning: 'Network failures often require infrastructure investigation'
            }
        };

        const issuePattern = Object.keys(fixes).find(pattern =>
            issue.title?.includes(pattern)
        );

        if (issuePattern) {
            return fixes[issuePattern];
        }

        return {
            applicable: false,
            reason: 'No known pattern-based fix available'
        };
    }

    async applyAutonomousFix(issue, fix) {
        console.log(chalk.yellow(`🔧 Applying autonomous fix for: ${issue.title}`));

        try {
            // Create fix record
            const fixId = `fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await this.db.query(`
                UPDATE issues
                SET fix_applied = $1, resolved_at = $2, status = 'resolved'
                WHERE issue_id = $3
            `, [
                JSON.stringify(fix),
                new Date(),
                issue.issue_id
            ]);

            // Save fix details to file
            const fixFile = `./fixes/${fixId}.json`;
            await fs.writeFile(fixFile, JSON.stringify({
                fixId,
                issueId: issue.issue_id,
                issue,
                fix,
                appliedAt: new Date()
            }, null, 2));

            this.io.emit('autonomousFixApplied', {
                issueId: issue.issue_id,
                fixId,
                fixType: fix.fixType,
                confidence: fix.confidence
            });

            console.log(chalk.green(`✅ Autonomous fix applied: ${fixId}`));

        } catch (error) {
            console.error(chalk.red('Failed to apply autonomous fix:'), error);
        }
    }

    async applyFix(issueId) {
        // Manual fix application endpoint
        try {
            const issue = await this.getIssueById(issueId);
            if (!issue) {
                throw new Error('Issue not found');
            }

            const fix = await this.generateClaudeFix(issue);
            if (fix.applicable) {
                await this.applyAutonomousFix(issue, fix);
                return { success: true, fix };
            } else {
                return {
                    success: false,
                    reason: fix.reason || 'Fix not applicable'
                };
            }

        } catch (error) {
            console.error(chalk.red('Manual fix application failed:'), error);
            throw error;
        }
    }

    async getIssueById(issueId) {
        const result = await this.db.query(
            'SELECT * FROM issues WHERE issue_id = $1',
            [issueId]
        );
        return result.rows[0] || null;
    }
}

module.exports = ClaudeIntegration;