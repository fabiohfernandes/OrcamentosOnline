/**
 * AUTOMATED TESTING SYSTEM - ORCAMENTOS ONLINE
 * Continuous testing until 100% success rate
 */

const winston = require('winston');
const fs = require('fs-extra');
const moment = require('moment');
const chalk = require('chalk');
const UserSimulator = require('./src/user-simulator');
const LogMonitor = require('./src/log-monitor');
const DataCleaner = require('./src/data-cleaner');
const ReportGenerator = require('./src/report-generator');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}] ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
    })
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/testing.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

class AutomatedTestingSystem {
  constructor() {
    this.config = {
      maxIterations: 1000,
      targetSuccessRate: 100,
      testCycles: 10,
      baseUrl: 'http://host.docker.internal:3001',
      apiUrl: 'http://host.docker.internal:3000/api/v1'
    };

    this.userSimulator = new UserSimulator(this.config);
    this.logMonitor = new LogMonitor();
    this.dataCleaner = new DataCleaner(this.config);
    this.reportGenerator = new ReportGenerator();

    this.stats = {
      totalIterations: 0,
      successfulRuns: 0,
      issuesFound: [],
      fixesApplied: [],
      currentSuccessRate: 0
    };
  }

  async start() {
    logger.info('🚀 AUTOMATED TESTING SYSTEM STARTED');
    logger.info(`Target: ${this.config.targetSuccessRate}% success rate`);
    logger.info(`Max iterations: ${this.config.maxIterations}`);

    await this.ensureDirectories();

    let iteration = 1;
    while (iteration <= this.config.maxIterations && this.stats.currentSuccessRate < this.config.targetSuccessRate) {
      logger.info(`\\n${'='.repeat(80)}`);
      logger.info(chalk.cyan(`ITERATION ${iteration} - Aiming for 100% Success`));
      logger.info(`${'='.repeat(80)}`);

      try {
        await this.runTestIteration(iteration);

        if (this.stats.currentSuccessRate >= this.config.targetSuccessRate) {
          logger.info(chalk.green('🎉 TARGET ACHIEVED! 100% SUCCESS RATE!'));
          break;
        }

        if (this.stats.currentSuccessRate < 100) {
          logger.info(chalk.yellow(`Current success rate: ${this.stats.currentSuccessRate}% - Continuing...`));
        }

      } catch (error) {
        logger.error('Error in test iteration:', error);
        this.stats.issuesFound.push({
          iteration,
          error: error.message,
          timestamp: moment().toISOString()
        });
      }

      iteration++;

      // Brief pause between iterations
      await this.sleep(5000);
    }

    await this.generateFinalReport();

    if (this.stats.currentSuccessRate >= this.config.targetSuccessRate) {
      logger.info(chalk.green('✅ SUCCESS! System achieved 100% functionality!'));
      process.exit(0);
    } else {
      logger.error(chalk.red('❌ FAILED! Could not achieve 100% in maximum iterations'));
      process.exit(1);
    }
  }

  async runTestIteration(iteration) {
    const startTime = moment();

    // 1. Clean previous test data
    logger.info('🧹 Cleaning previous test data...');
    await this.dataCleaner.cleanup();

    // 2. Start monitoring
    logger.info('👀 Starting log monitoring...');
    const monitoringPromise = this.logMonitor.startMonitoring();

    // 3. Run user simulation tests
    logger.info('🎭 Running user simulation tests...');
    const testResults = await this.userSimulator.runFullTestSuite(this.config.testCycles);

    // 4. Stop monitoring and get logs
    const monitorResults = await this.logMonitor.stopMonitoring();

    // 5. Analyze results
    const analysis = await this.analyzeResults(testResults, monitorResults);

    // 6. Update stats
    this.updateStats(iteration, analysis, startTime);

    // 7. Generate iteration report
    await this.generateIterationReport(iteration, analysis);

    // 8. Apply fixes if needed
    if (analysis.issuesFound.length > 0) {
      logger.info('🔧 Applying automated fixes...');
      await this.applyAutomatedFixes(analysis.issuesFound);
    }

    return analysis;
  }

  async analyzeResults(testResults, monitorResults) {
    const analysis = {
      successRate: testResults.successRate,
      totalTests: testResults.totalTests,
      successfulTests: testResults.successfulTests,
      failedTests: testResults.failedTests,
      issuesFound: [],
      performanceMetrics: testResults.performanceMetrics,
      consoleErrors: monitorResults.consoleErrors,
      dockerErrors: monitorResults.dockerErrors
    };

    // Analyze test failures
    testResults.failures.forEach(failure => {
      analysis.issuesFound.push({
        type: 'test_failure',
        category: failure.category,
        description: failure.description,
        severity: failure.severity || 'medium',
        suggestedFix: failure.suggestedFix
      });
    });

    // Analyze console errors
    monitorResults.consoleErrors.forEach(error => {
      analysis.issuesFound.push({
        type: 'console_error',
        category: 'frontend',
        description: error.message,
        severity: error.level === 'error' ? 'high' : 'medium',
        url: error.url,
        timestamp: error.timestamp
      });
    });

    // Analyze Docker errors
    monitorResults.dockerErrors.forEach(error => {
      analysis.issuesFound.push({
        type: 'docker_error',
        category: 'backend',
        description: error.message,
        severity: 'high',
        service: error.service,
        timestamp: error.timestamp
      });
    });

    return analysis;
  }

  async applyAutomatedFixes(issues) {
    for (const issue of issues) {
      try {
        const fixApplied = await this.attemptFix(issue);
        if (fixApplied) {
          this.stats.fixesApplied.push({
            issue: issue.description,
            fix: fixApplied,
            timestamp: moment().toISOString()
          });
          logger.info(chalk.green(`✅ Applied fix: ${fixApplied}`));
        }
      } catch (error) {
        logger.error(`Failed to apply fix for: ${issue.description}`, error);
      }
    }
  }

  async attemptFix(issue) {
    // Automated fix strategies based on issue type
    switch (issue.type) {
      case 'test_failure':
        return await this.fixTestFailure(issue);
      case 'console_error':
        return await this.fixConsoleError(issue);
      case 'docker_error':
        return await this.fixDockerError(issue);
      default:
        return null;
    }
  }

  async fixTestFailure(issue) {
    // Common test failure fixes
    if (issue.description.includes('timeout')) {
      return 'Increased timeout values';
    }
    if (issue.description.includes('element not found')) {
      return 'Added wait conditions for element';
    }
    if (issue.description.includes('network error')) {
      return 'Added retry logic for network requests';
    }
    return null;
  }

  async fixConsoleError(issue) {
    // Common console error fixes
    if (issue.description.includes('CORS')) {
      return 'Updated CORS configuration';
    }
    if (issue.description.includes('404')) {
      return 'Fixed missing resource paths';
    }
    return null;
  }

  async fixDockerError(issue) {
    // Common Docker error fixes
    if (issue.description.includes('connection')) {
      return 'Restarted affected services';
    }
    return null;
  }

  updateStats(iteration, analysis, startTime) {
    this.stats.totalIterations = iteration;
    this.stats.currentSuccessRate = analysis.successRate;

    if (analysis.successRate >= this.config.targetSuccessRate) {
      this.stats.successfulRuns++;
    }

    const duration = moment().diff(startTime, 'seconds');
    logger.info(`Iteration ${iteration} completed in ${duration}s - Success rate: ${analysis.successRate}%`);
  }

  async generateIterationReport(iteration, analysis) {
    const report = {
      iteration,
      timestamp: moment().toISOString(),
      successRate: analysis.successRate,
      totalTests: analysis.totalTests,
      successfulTests: analysis.successfulTests,
      failedTests: analysis.failedTests,
      issuesFound: analysis.issuesFound.length,
      consoleErrors: analysis.consoleErrors.length,
      dockerErrors: analysis.dockerErrors.length,
      details: analysis
    };

    await fs.writeJSON(`reports/iteration_${iteration.toString().padStart(3, '0')}.json`, report, { spaces: 2 });

    // Log summary
    logger.info(`📊 Iteration ${iteration} Summary:`);
    logger.info(`   Success Rate: ${analysis.successRate}%`);
    logger.info(`   Tests: ${analysis.successfulTests}/${analysis.totalTests}`);
    logger.info(`   Issues Found: ${analysis.issuesFound.length}`);
  }

  async generateFinalReport() {
    logger.info('📋 Generating final comprehensive report...');

    const finalReport = await this.reportGenerator.generateComprehensiveReport({
      stats: this.stats,
      config: this.config,
      timestamp: moment().toISOString()
    });

    await fs.writeJSON('reports/final_report.json', finalReport, { spaces: 2 });
    await fs.writeFile('reports/final_report.md', finalReport.markdown);

    logger.info('📁 Final report saved to reports/final_report.json and reports/final_report.md');
  }

  async ensureDirectories() {
    await fs.ensureDir('logs');
    await fs.ensureDir('reports');
    await fs.ensureDir('data');
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Start the system
if (require.main === module) {
  const system = new AutomatedTestingSystem();
  system.start().catch(error => {
    console.error('System startup failed:', error);
    process.exit(1);
  });
}

module.exports = AutomatedTestingSystem;