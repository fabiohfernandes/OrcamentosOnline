/**
 * TESTER Stress Testing Engine
 * Playwright-based autonomous stress testing with virtual users
 */

const { chromium } = require('playwright');
const chalk = require('chalk');
const path = require('path');
const fs = require('fs').promises;

class StressRunner {
    constructor(database, socketIO) {
        this.db = database;
        this.io = socketIO;
        this.isRunning = false;
        this.isPaused = false;
        this.browsers = [];
        this.contexts = [];
        this.virtualUsers = [];
        this.currentSession = null;
        this.config = null;
        this.metrics = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            averageResponseTime: 0,
            responseTimes: []
        };
        this.testFlows = [];
        this.screenshotCounter = 0;
        this.traceCounter = 0;
    }

    async initialize() {
        try {
            console.log(chalk.blue('🧪 Initializing Stress Testing Engine...'));

            // Create evidence directories
            await this.createEvidenceDirectories();

            console.log(chalk.green('✅ Stress Runner initialized'));
        } catch (error) {
            console.error(chalk.red('❌ Stress Runner initialization failed:'), error);
            throw error;
        }
    }

    async createEvidenceDirectories() {
        const directories = [
            './screenshots',
            './videos',
            './traces',
            './reports'
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
            status: this.isRunning ? (this.isPaused ? 'paused' : 'running') : 'idle',
            virtualUsers: this.virtualUsers.length,
            metrics: this.metrics,
            currentSession: this.currentSession
        };
    }

    async startStressTesting(sessionId, coverage, config) {
        if (this.isRunning) {
            throw new Error('Stress testing already running');
        }

        try {
            console.log(chalk.blue(`🚀 Starting stress testing session: ${sessionId}`));

            this.currentSession = sessionId;
            this.config = config;
            this.isRunning = true;
            this.isPaused = false;

            // Generate test flows from discovery coverage
            this.testFlows = await this.generateTestFlows(coverage);

            console.log(chalk.cyan(`📋 Generated ${this.testFlows.length} test flows`));

            // Launch virtual users
            await this.launchVirtualUsers(config.virtualUsers || 5);

            // Start stress testing loops
            this.startTestingLoops();

            this.io.emit('stressTestingStarted', {
                sessionId,
                virtualUsers: this.virtualUsers.length,
                testFlows: this.testFlows.length
            });

            console.log(chalk.green('✅ Stress testing started successfully'));

        } catch (error) {
            console.error(chalk.red('❌ Failed to start stress testing:'), error);
            this.isRunning = false;
            throw error;
        }
    }

    async generateTestFlows(coverage) {
        const flows = [];

        // Generate flows from discovered forms
        for (const form of coverage.forms || []) {
            flows.push({
                type: 'form_submission',
                name: `Form Test - ${form.pageUrl}`,
                pageUrl: form.pageUrl,
                selector: form.selector,
                inputs: form.inputs,
                buttons: form.buttons,
                weight: 1
            });
        }

        // Generate flows from discovered navigation
        for (const element of coverage.elements || []) {
            if (element.tagName === 'a' && element.href) {
                flows.push({
                    type: 'navigation',
                    name: `Navigate to ${element.text || element.href}`,
                    pageUrl: element.pageUrl,
                    targetUrl: element.href,
                    selector: element.selector,
                    weight: 0.5
                });
            }

            if (element.tagName === 'button' || element.role === 'button') {
                flows.push({
                    type: 'interaction',
                    name: `Click ${element.text || 'button'}`,
                    pageUrl: element.pageUrl,
                    selector: element.selector,
                    action: 'click',
                    weight: 0.7
                });
            }
        }

        // Generate flows from discovered API endpoints
        for (const api of coverage.apis || []) {
            flows.push({
                type: 'api_test',
                name: `API ${api.method} ${api.url}`,
                method: api.method,
                url: api.url,
                headers: api.headers,
                weight: 0.3
            });
        }

        // Add basic page load tests
        for (const page of coverage.pages || []) {
            flows.push({
                type: 'page_load',
                name: `Load ${page.title || page.url}`,
                pageUrl: page.url,
                weight: 1
            });
        }

        return flows;
    }

    async launchVirtualUsers(count) {
        console.log(chalk.blue(`👥 Launching ${count} virtual users...`));

        for (let i = 0; i < count; i++) {
            try {
                const browser = await chromium.launch({
                    headless: process.env.HEADLESS !== 'false',
                    args: ['--no-sandbox', '--disable-setuid-sandbox']
                });

                const context = await browser.newContext({
                    viewport: { width: 1920, height: 1080 },
                    userAgent: `TESTER-VirtualUser-${i + 1}/1.0`,
                    recordVideo: {
                        dir: './videos',
                        size: { width: 1920, height: 1080 }
                    }
                });

                // Enable tracing for evidence collection
                await context.tracing.start({
                    screenshots: true,
                    snapshots: true,
                    sources: true
                });

                const page = await context.newPage();

                // Set up page monitoring
                this.setupPageMonitoring(page, i + 1);

                const virtualUser = {
                    id: i + 1,
                    browser,
                    context,
                    page,
                    isActive: false,
                    testCount: 0,
                    errors: []
                };

                this.browsers.push(browser);
                this.contexts.push(context);
                this.virtualUsers.push(virtualUser);

                console.log(chalk.green(`✅ Virtual user ${i + 1} launched`));

            } catch (error) {
                console.error(chalk.red(`❌ Failed to launch virtual user ${i + 1}:`), error);
            }
        }

        console.log(chalk.green(`✅ ${this.virtualUsers.length}/${count} virtual users launched`));
    }

    setupPageMonitoring(page, userId) {
        // Monitor console events
        page.on('console', msg => {
            if (msg.type() === 'error') {
                this.handleConsoleError(msg, userId);
            }
        });

        // Monitor network failures
        page.on('requestfailed', request => {
            this.handleNetworkFailure(request, userId);
        });

        // Monitor page errors
        page.on('pageerror', error => {
            this.handlePageError(error, userId);
        });

        // Monitor response times
        page.on('response', response => {
            this.recordResponseTime(response, userId);
        });
    }

    async startTestingLoops() {
        const promises = this.virtualUsers.map(user => this.runVirtualUserLoop(user));

        // Don't wait for all loops to complete, let them run independently
        Promise.allSettled(promises).then(results => {
            const errors = results.filter(r => r.status === 'rejected').map(r => r.reason);
            if (errors.length > 0) {
                console.error(chalk.red('Virtual user loops encountered errors:'), errors);
            }
        });

        // Start metrics reporting
        this.startMetricsReporting();
    }

    async runVirtualUserLoop(user) {
        console.log(chalk.cyan(`🤖 Starting test loop for virtual user ${user.id}`));

        while (this.isRunning) {
            if (this.isPaused) {
                await this.sleep(1000);
                continue;
            }

            try {
                user.isActive = true;
                await this.executeRandomTestFlow(user);
                user.testCount++;

                // Random delay between tests (1-5 seconds)
                const delay = Math.random() * 4000 + 1000;
                await this.sleep(delay);

            } catch (error) {
                console.error(chalk.red(`❌ Virtual user ${user.id} error:`), error);
                user.errors.push({
                    error: error.message,
                    timestamp: new Date(),
                    stack: error.stack
                });

                // Take screenshot on error
                await this.captureErrorEvidence(user, error);

                // Longer delay after error
                await this.sleep(5000);
            } finally {
                user.isActive = false;
            }
        }

        console.log(chalk.yellow(`🤖 Virtual user ${user.id} loop ended`));
    }

    async executeRandomTestFlow(user) {
        if (this.testFlows.length === 0) {
            throw new Error('No test flows available');
        }

        // Select weighted random flow
        const flow = this.selectWeightedRandomFlow();
        const startTime = Date.now();

        try {
            console.log(chalk.blue(`🎯 User ${user.id} executing: ${flow.name}`));

            let result;
            switch (flow.type) {
                case 'page_load':
                    result = await this.executePageLoadTest(user, flow);
                    break;
                case 'form_submission':
                    result = await this.executeFormTest(user, flow);
                    break;
                case 'navigation':
                    result = await this.executeNavigationTest(user, flow);
                    break;
                case 'interaction':
                    result = await this.executeInteractionTest(user, flow);
                    break;
                case 'api_test':
                    result = await this.executeApiTest(user, flow);
                    break;
                default:
                    throw new Error(`Unknown flow type: ${flow.type}`);
            }

            const duration = Date.now() - startTime;
            await this.recordTestResult(user, flow, 'passed', duration, result);

            this.metrics.passedTests++;
            this.io.emit('testResult', {
                userId: user.id,
                testName: flow.name,
                status: 'passed',
                durationMs: duration
            });

        } catch (error) {
            const duration = Date.now() - startTime;
            await this.recordTestResult(user, flow, 'failed', duration, null, error);

            this.metrics.failedTests++;
            this.io.emit('testResult', {
                userId: user.id,
                testName: flow.name,
                status: 'failed',
                durationMs: duration,
                error: error.message
            });

            throw error;
        } finally {
            this.metrics.totalTests++;
        }
    }

    selectWeightedRandomFlow() {
        const totalWeight = this.testFlows.reduce((sum, flow) => sum + flow.weight, 0);
        let random = Math.random() * totalWeight;

        for (const flow of this.testFlows) {
            random -= flow.weight;
            if (random <= 0) {
                return flow;
            }
        }

        // Fallback to first flow
        return this.testFlows[0];
    }

    async executePageLoadTest(user, flow) {
        await user.page.goto(flow.pageUrl, {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // Wait for page to be fully loaded
        await user.page.waitForLoadState('domcontentloaded');

        // Check for basic page elements
        const title = await user.page.title();
        const hasContent = await user.page.locator('body').isVisible();

        return {
            title,
            hasContent,
            url: user.page.url()
        };
    }

    async executeFormTest(user, flow) {
        await user.page.goto(flow.pageUrl);

        const form = user.page.locator(flow.selector);
        await form.waitFor({ state: 'visible', timeout: 10000 });

        // Fill form inputs with test data
        for (const input of flow.inputs) {
            if (input.name) {
                const inputElement = form.locator(`[name="${input.name}"]`);
                const testValue = this.generateTestData(input.type, input.name);

                if (testValue) {
                    await inputElement.fill(testValue);
                    await this.sleep(100); // Human-like delay
                }
            }
        }

        // Submit form
        const submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
        await submitButton.click();

        // Wait for navigation or response
        await Promise.race([
            user.page.waitForNavigation({ timeout: 10000 }),
            user.page.waitForSelector('.success, .error, .message', { timeout: 10000 }),
            this.sleep(5000) // Fallback timeout
        ]);

        return {
            submitted: true,
            currentUrl: user.page.url()
        };
    }

    async executeNavigationTest(user, flow) {
        await user.page.goto(flow.pageUrl);

        const link = user.page.locator(flow.selector);
        await link.waitFor({ state: 'visible', timeout: 10000 });

        await link.click();
        await user.page.waitForLoadState('domcontentloaded', { timeout: 10000 });

        return {
            navigated: true,
            targetUrl: flow.targetUrl,
            actualUrl: user.page.url()
        };
    }

    async executeInteractionTest(user, flow) {
        await user.page.goto(flow.pageUrl);

        const element = user.page.locator(flow.selector);
        await element.waitFor({ state: 'visible', timeout: 10000 });

        switch (flow.action) {
            case 'click':
                await element.click();
                break;
            case 'hover':
                await element.hover();
                break;
            case 'focus':
                await element.focus();
                break;
            default:
                await element.click();
        }

        // Wait for any potential effects
        await this.sleep(1000);

        return {
            interacted: true,
            action: flow.action
        };
    }

    async executeApiTest(user, flow) {
        const response = await user.page.request.fetch(flow.url, {
            method: flow.method,
            headers: flow.headers
        });

        return {
            status: response.status(),
            statusText: response.statusText(),
            headers: await response.allHeaders()
        };
    }

    generateTestData(inputType, inputName) {
        const testData = {
            email: 'test@example.com',
            password: 'testpassword123',
            text: 'Test Input',
            name: 'Test User',
            phone: '+1234567890',
            number: '123',
            url: 'https://example.com',
            date: '2024-01-01'
        };

        // Match by input type
        if (testData[inputType]) {
            return testData[inputType];
        }

        // Match by input name patterns
        const namePatterns = {
            email: /email|mail/i,
            password: /password|pass/i,
            name: /name|user/i,
            phone: /phone|tel/i
        };

        for (const [dataType, pattern] of Object.entries(namePatterns)) {
            if (pattern.test(inputName) && testData[dataType]) {
                return testData[dataType];
            }
        }

        return 'Test Input';
    }

    async recordTestResult(user, flow, status, duration, result, error = null) {
        try {
            const testId = `test_${Date.now()}_${user.id}`;

            await this.db.query(`
                INSERT INTO test_results (
                    session_id, test_id, test_name, test_type, status, duration_ms,
                    page_url, flow_name, error_message, stack_trace
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `, [
                this.currentSession,
                testId,
                flow.name,
                flow.type,
                status,
                duration,
                flow.pageUrl || null,
                flow.name,
                error?.message || null,
                error?.stack || null
            ]);

        } catch (dbError) {
            console.error(chalk.red('Failed to record test result:'), dbError);
        }
    }

    async captureErrorEvidence(user, error) {
        try {
            const timestamp = Date.now();

            // Take screenshot
            const screenshotPath = `./screenshots/error_${timestamp}_user${user.id}.png`;
            await user.page.screenshot({
                path: screenshotPath,
                fullPage: true
            });

            // Save trace
            const tracePath = `./traces/error_${timestamp}_user${user.id}.zip`;
            await user.context.tracing.stop({ path: tracePath });

            // Restart tracing for continued monitoring
            await user.context.tracing.start({
                screenshots: true,
                snapshots: true,
                sources: true
            });

            console.log(chalk.yellow(`📸 Error evidence captured: ${screenshotPath}`));

        } catch (evidenceError) {
            console.error(chalk.red('Failed to capture error evidence:'), evidenceError);
        }
    }

    handleConsoleError(msg, userId) {
        const error = {
            type: 'console',
            level: 'error',
            message: msg.text(),
            userId,
            timestamp: new Date()
        };

        this.recordIssue(error);
    }

    handleNetworkFailure(request, userId) {
        const error = {
            type: 'network',
            url: request.url(),
            method: request.method(),
            failure: request.failure()?.errorText,
            userId,
            timestamp: new Date()
        };

        this.recordIssue(error);
    }

    handlePageError(error, userId) {
        const issue = {
            type: 'page',
            message: error.message,
            stack: error.stack,
            userId,
            timestamp: new Date()
        };

        this.recordIssue(issue);
    }

    recordResponseTime(response, userId) {
        const responseTime = response.request().timing()?.responseEnd || 0;
        this.metrics.responseTimes.push(responseTime);

        // Keep only last 100 response times for average calculation
        if (this.metrics.responseTimes.length > 100) {
            this.metrics.responseTimes.shift();
        }

        this.metrics.averageResponseTime =
            this.metrics.responseTimes.reduce((a, b) => a + b, 0) /
            this.metrics.responseTimes.length;
    }

    async recordIssue(issue) {
        try {
            const issueId = `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            await this.db.query(`
                INSERT INTO issues (
                    issue_id, session_id, source, severity, title, description,
                    page_url, evidence, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                ON CONFLICT (issue_id) DO UPDATE SET
                    last_seen = NOW(),
                    count = issues.count + 1
            `, [
                issueId,
                this.currentSession,
                issue.type,
                this.calculateSeverity(issue),
                this.generateIssueTitle(issue),
                issue.message || JSON.stringify(issue),
                issue.url || null,
                JSON.stringify(issue),
                new Date()
            ]);

            this.io.emit('issueDetected', {
                issueId,
                type: issue.type,
                severity: this.calculateSeverity(issue),
                title: this.generateIssueTitle(issue),
                timestamp: new Date()
            });

        } catch (error) {
            console.error(chalk.red('Failed to record issue:'), error);
        }
    }

    calculateSeverity(issue) {
        if (issue.type === 'page') return 'high';
        if (issue.type === 'console' && issue.level === 'error') return 'medium';
        if (issue.type === 'network') return 'medium';
        return 'low';
    }

    generateIssueTitle(issue) {
        switch (issue.type) {
            case 'console':
                return `Console Error: ${issue.message?.substring(0, 50)}...`;
            case 'network':
                return `Network Failure: ${issue.method} ${issue.url}`;
            case 'page':
                return `Page Error: ${issue.message?.substring(0, 50)}...`;
            default:
                return `Unknown Issue: ${issue.type}`;
        }
    }

    startMetricsReporting() {
        setInterval(() => {
            if (this.isRunning) {
                const activeUsers = this.virtualUsers.filter(u => u.isActive).length;

                this.io.emit('metricsUpdate', {
                    ...this.metrics,
                    activeUsers,
                    totalUsers: this.virtualUsers.length
                });
            }
        }, 2000); // Update every 2 seconds
    }

    async pause() {
        this.isPaused = true;
        console.log(chalk.yellow('⏸️ Stress testing paused'));
    }

    async resume() {
        this.isPaused = false;
        console.log(chalk.green('▶️ Stress testing resumed'));
    }

    async stop() {
        console.log(chalk.blue('🛑 Stopping stress testing...'));

        this.isRunning = false;
        this.isPaused = false;

        // Close all browser contexts and browsers
        for (const context of this.contexts) {
            try {
                await context.close();
            } catch (error) {
                console.warn(chalk.yellow('Warning: Failed to close context'), error.message);
            }
        }

        for (const browser of this.browsers) {
            try {
                await browser.close();
            } catch (error) {
                console.warn(chalk.yellow('Warning: Failed to close browser'), error.message);
            }
        }

        // Reset state
        this.browsers = [];
        this.contexts = [];
        this.virtualUsers = [];
        this.currentSession = null;
        this.testFlows = [];

        console.log(chalk.green('✅ Stress testing stopped'));
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = StressRunner;