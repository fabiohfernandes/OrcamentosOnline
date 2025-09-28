/**
 * REAL USER SIMULATION AGENT
 * Simulates real users massively using all features
 */

const { chromium } = require('playwright');
const winston = require('winston');
const moment = require('moment');

class UserSimulator {
  constructor(config) {
    this.config = config;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/user-simulation.log' })
      ]
    });

    this.testResults = {
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      failures: [],
      performanceMetrics: {},
      userJourneys: []
    };
  }

  async runFullTestSuite(cycles = 10) {
    this.logger.info(`Starting full test suite with ${cycles} cycles`);

    const browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      for (let cycle = 1; cycle <= cycles; cycle++) {
        this.logger.info(`Running test cycle ${cycle}/${cycles}`);

        await this.runSingleCycle(browser, cycle);

        // Brief pause between cycles
        await this.sleep(2000);
      }

      this.calculateResults();
      return this.testResults;

    } finally {
      await browser.close();
    }
  }

  async runSingleCycle(browser, cycle) {
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 }
    });

    const page = await context.newPage();

    // Monitor console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push({
          message: msg.text(),
          timestamp: moment().toISOString()
        });
      }
    });

    try {
      // Complete user journey simulation
      await this.simulateCompleteUserJourney(page, cycle);

    } catch (error) {
      this.recordFailure('complete_user_journey', `Cycle ${cycle} failed: ${error.message}`, 'high');
    } finally {
      await context.close();
    }
  }

  async simulateCompleteUserJourney(page, cycle) {
    const journey = {
      cycle,
      startTime: moment().toISOString(),
      steps: [],
      errors: [],
      performance: {}
    };

    try {
      // Step 1: Home Page Access
      await this.testStep(page, journey, 'home_page_access', async () => {
        await page.goto(this.config.baseUrl, { waitUntil: 'networkidle' });
        await page.waitForSelector('body', { timeout: 10000 });

        // Verify home page loads
        const title = await page.title();
        if (!title.includes('OrçamentosOnline')) {
          throw new Error('Home page title incorrect');
        }
      });

      // Step 2: Navigation Testing
      await this.testStep(page, journey, 'navigation_testing', async () => {
        // Test all navigation links
        const navLinks = ['/auth/login', '/auth/register'];

        for (const link of navLinks) {
          await page.goto(`${this.config.baseUrl}${link}`, { waitUntil: 'networkidle' });
          await page.waitForSelector('body', { timeout: 5000 });
        }
      });

      // Step 3: User Registration
      await this.testStep(page, journey, 'user_registration', async () => {
        await page.goto(`${this.config.baseUrl}/auth/register`);

        const username = `autotest_${cycle}_${Date.now()}`;
        const email = `${username}@autotest.com`;

        await page.fill('input[name="name"]', `Auto Test User ${cycle}`);
        await page.fill('input[name="email"]', email);
        await page.fill('input[name="phone"]', `(11) 9${cycle.toString().padStart(4, '0')}-${Date.now().toString().slice(-4)}`);
        await page.fill('input[name="password"]', 'AutoTest123!');
        await page.fill('input[name="confirmPassword"]', 'AutoTest123!');
        await page.check('input[name="terms"]');

        await page.click('button[type="submit"]');

        // Wait for redirect to dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 });
      });

      // Step 4: Dashboard Interaction
      await this.testStep(page, journey, 'dashboard_interaction', async () => {
        // Wait for dashboard to load
        await page.waitForSelector('[data-testid="dashboard"]', { timeout: 5000 });

        // Interact with dashboard elements
        const dashboardElements = await page.$$('[role="button"], button, a[href]');
        for (let i = 0; i < Math.min(dashboardElements.length, 5); i++) {
          try {
            await dashboardElements[i].click();
            await this.sleep(1000);
          } catch (e) {
            // Element might not be clickable, continue
          }
        }
      });

      // Step 5: Client Management
      await this.testStep(page, journey, 'client_management', async () => {
        await page.goto(`${this.config.baseUrl}/clients`);

        // Create new client
        const createButton = await page.$('button:has-text("Novo Cliente"), button:has-text("Create Client"), [data-testid="create-client"]');
        if (createButton) {
          await createButton.click();

          await page.fill('input[name="name"]', `Auto Client ${cycle}`);
          await page.fill('input[name="email"]', `autoclient${cycle}@test.com`);
          await page.fill('input[name="phone"]', `(11) 8${cycle.toString().padStart(4, '0')}-${Date.now().toString().slice(-4)}`);
          await page.fill('input[name="company"]', `Auto Company ${cycle}`);

          const saveButton = await page.$('button:has-text("Salvar"), button:has-text("Save"), button[type="submit"]');
          if (saveButton) {
            await saveButton.click();
          }
        }

        // Test client list
        await page.waitForSelector('table, [data-testid="client-list"]', { timeout: 5000 });
      });

      // Step 6: Proposal Management
      await this.testStep(page, journey, 'proposal_management', async () => {
        await page.goto(`${this.config.baseUrl}/proposals`);

        // Create new proposal
        const createButton = await page.$('button:has-text("Nova Proposta"), button:has-text("Create Proposal"), [data-testid="create-proposal"]');
        if (createButton) {
          await createButton.click();

          await page.fill('input[name="title"], input[name="proposalName"]', `Auto Proposal ${cycle}`);
          await page.fill('input[name="clientName"]', `Auto Client ${cycle}`);
          await page.fill('input[name="jobName"]', `Auto Job ${cycle}`);
          await page.fill('textarea[name="scopeText"], textarea[name="scope"]', `Scope for auto proposal ${cycle}`);
          await page.fill('textarea[name="termsText"], textarea[name="terms"]', `Terms for auto proposal ${cycle}`);
          await page.fill('input[name="clientUsername"]', `autoclient${cycle}`);
          await page.fill('input[name="clientPassword"]', 'AutoClient123!');
          await page.fill('input[name="proposalValue"]', '5000.00');

          const saveButton = await page.$('button:has-text("Salvar"), button:has-text("Save"), button[type="submit"]');
          if (saveButton) {
            await saveButton.click();
          }
        }

        // Test proposal list
        await page.waitForSelector('table, [data-testid="proposal-list"]', { timeout: 5000 });
      });

      // Step 7: Settings Page
      await this.testStep(page, journey, 'settings_page', async () => {
        await page.goto(`${this.config.baseUrl}/settings`);
        await page.waitForSelector('form, [data-testid="settings"]', { timeout: 5000 });

        // Test settings form
        const settingsForm = await page.$('form');
        if (settingsForm) {
          const inputs = await settingsForm.$$('input, select, textarea');
          for (let i = 0; i < Math.min(inputs.length, 3); i++) {
            try {
              const tagName = await inputs[i].tagName();
              const type = await inputs[i].getAttribute('type');

              if (tagName === 'INPUT' && type === 'text') {
                await inputs[i].fill(`Updated ${cycle}`);
              }
            } catch (e) {
              // Continue if element is not editable
            }
          }
        }
      });

      // Step 8: Reports Page
      await this.testStep(page, journey, 'reports_page', async () => {
        await page.goto(`${this.config.baseUrl}/reports`);
        await page.waitForSelector('[data-testid="reports"], .reports-container', { timeout: 5000 });

        // Interact with report elements
        const reportElements = await page.$$('button, [role="button"]');
        for (let i = 0; i < Math.min(reportElements.length, 3); i++) {
          try {
            await reportElements[i].click();
            await this.sleep(1000);
          } catch (e) {
            // Continue if element is not clickable
          }
        }
      });

      // Step 9: Performance Testing
      await this.testStep(page, journey, 'performance_testing', async () => {
        const startTime = Date.now();

        // Navigate between pages multiple times
        const pages = ['/dashboard', '/clients', '/proposals', '/settings', '/reports'];
        for (const pagePath of pages) {
          const pageStartTime = Date.now();
          await page.goto(`${this.config.baseUrl}${pagePath}`, { waitUntil: 'networkidle' });
          const pageLoadTime = Date.now() - pageStartTime;

          journey.performance[pagePath] = pageLoadTime;
        }

        journey.performance.totalTime = Date.now() - startTime;
      });

      journey.endTime = moment().toISOString();
      journey.success = true;
      this.testResults.userJourneys.push(journey);

    } catch (error) {
      journey.error = error.message;
      journey.success = false;
      journey.endTime = moment().toISOString();
      this.testResults.userJourneys.push(journey);

      this.recordFailure('user_journey', `Journey ${cycle} failed: ${error.message}`, 'high');
    }
  }

  async testStep(page, journey, stepName, testFunction) {
    const stepStart = Date.now();

    try {
      await testFunction();

      journey.steps.push({
        name: stepName,
        status: 'success',
        duration: Date.now() - stepStart,
        timestamp: moment().toISOString()
      });

      this.testResults.successfulTests++;
    } catch (error) {
      journey.steps.push({
        name: stepName,
        status: 'failed',
        error: error.message,
        duration: Date.now() - stepStart,
        timestamp: moment().toISOString()
      });

      journey.errors.push({
        step: stepName,
        error: error.message,
        timestamp: moment().toISOString()
      });

      this.recordFailure(stepName, error.message, 'medium');
      throw error;
    } finally {
      this.testResults.totalTests++;
    }
  }

  recordFailure(category, description, severity, suggestedFix = null) {
    this.testResults.failures.push({
      category,
      description,
      severity,
      suggestedFix,
      timestamp: moment().toISOString()
    });

    this.testResults.failedTests++;
  }

  calculateResults() {
    this.testResults.successRate = this.testResults.totalTests > 0
      ? Math.round((this.testResults.successfulTests / this.testResults.totalTests) * 100)
      : 0;

    // Calculate average performance metrics
    const allJourneys = this.testResults.userJourneys;
    if (allJourneys.length > 0) {
      const avgPerformance = {};
      const performanceKeys = Object.keys(allJourneys[0]?.performance || {});

      performanceKeys.forEach(key => {
        const values = allJourneys
          .map(j => j.performance?.[key])
          .filter(v => v !== undefined);

        if (values.length > 0) {
          avgPerformance[key] = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
        }
      });

      this.testResults.performanceMetrics = avgPerformance;
    }

    this.logger.info(`Test suite completed: ${this.testResults.successRate}% success rate`);
    this.logger.info(`Total tests: ${this.testResults.totalTests}`);
    this.logger.info(`Successful: ${this.testResults.successfulTests}`);
    this.logger.info(`Failed: ${this.testResults.failedTests}`);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = UserSimulator;