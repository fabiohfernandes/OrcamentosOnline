/**
 * LOG MONITORING AGENT
 * Monitors Chrome console and Docker logs for errors
 */

const { spawn } = require('child_process');
const winston = require('winston');
const moment = require('moment');
const Docker = require('dockerode');

class LogMonitor {
  constructor() {
    this.docker = new Docker();
    this.monitoring = false;
    this.consoleErrors = [];
    this.dockerErrors = [];

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/log-monitor.log' })
      ]
    });
  }

  async startMonitoring() {
    this.monitoring = true;
    this.consoleErrors = [];
    this.dockerErrors = [];

    this.logger.info('Starting log monitoring...');

    // Start Docker log monitoring
    this.dockerMonitorPromise = this.monitorDockerLogs();

    // Console errors are captured in user-simulator.js
    // This method sets up the monitoring state

    return new Promise((resolve) => {
      // Monitor for a reasonable time period
      setTimeout(() => {
        resolve();
      }, 5000);
    });
  }

  async stopMonitoring() {
    this.monitoring = false;
    this.logger.info('Stopping log monitoring...');

    // Wait for docker monitoring to finish
    if (this.dockerMonitorPromise) {
      await this.dockerMonitorPromise;
    }

    return {
      consoleErrors: this.consoleErrors,
      dockerErrors: this.dockerErrors
    };
  }

  async monitorDockerLogs() {
    const containers = [
      'orcamentos-frontend',
      'orcamentos-api',
      'orcamentos-postgres',
      'orcamentos-redis',
      'orcamentos-nginx'
    ];

    const monitorPromises = containers.map(containerName =>
      this.monitorContainerLogs(containerName)
    );

    await Promise.all(monitorPromises);
  }

  async monitorContainerLogs(containerName) {
    try {
      const container = this.docker.getContainer(containerName);

      // Get recent logs
      const logStream = await container.logs({
        stdout: true,
        stderr: true,
        since: Math.floor(Date.now() / 1000) - 300, // Last 5 minutes
        follow: false
      });

      const logs = logStream.toString();
      this.analyzeLogs(containerName, logs);

    } catch (error) {
      this.logger.error(`Failed to get logs for ${containerName}:`, error.message);
    }
  }

  analyzeLogs(service, logs) {
    const lines = logs.split('\\n');

    lines.forEach(line => {
      if (this.isErrorLog(line)) {
        this.dockerErrors.push({
          service,
          message: this.cleanLogLine(line),
          timestamp: moment().toISOString(),
          severity: this.getLogSeverity(line)
        });
      }
    });
  }

  isErrorLog(line) {
    const errorPatterns = [
      /error/i,
      /exception/i,
      /failed/i,
      /timeout/i,
      /connection.*refused/i,
      /cannot.*connect/i,
      /unable.*to/i,
      /fatal/i,
      /critical/i,
      /stack trace/i,
      /unhandled/i,
      /500/,
      /502/,
      /503/,
      /504/
    ];

    return errorPatterns.some(pattern => pattern.test(line));
  }

  getLogSeverity(line) {
    if (/fatal|critical|unhandled/i.test(line)) return 'critical';
    if (/error|exception|failed/i.test(line)) return 'high';
    if (/warning|warn/i.test(line)) return 'medium';
    return 'low';
  }

  cleanLogLine(line) {
    // Remove ANSI color codes and timestamps
    return line
      .replace(/\\x1b\\[[0-9;]*m/g, '')
      .replace(/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z\\s*/, '')
      .replace(/^\\w+\\s+\\d{2}:\\d{2}:\\d{2}\\s+/, '')
      .trim();
  }

  // Method to be called from user-simulator to record console errors
  recordConsoleError(error) {
    this.consoleErrors.push({
      message: error.message,
      url: error.url || 'unknown',
      timestamp: error.timestamp || moment().toISOString(),
      level: error.level || 'error'
    });
  }

  // Advanced log analysis methods
  async generateLogAnalysisReport() {
    const report = {
      timestamp: moment().toISOString(),
      consoleErrors: {
        total: this.consoleErrors.length,
        byLevel: this.groupBy(this.consoleErrors, 'level'),
        topErrors: this.getTopErrors(this.consoleErrors)
      },
      dockerErrors: {
        total: this.dockerErrors.length,
        byService: this.groupBy(this.dockerErrors, 'service'),
        bySeverity: this.groupBy(this.dockerErrors, 'severity'),
        topErrors: this.getTopErrors(this.dockerErrors)
      },
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  groupBy(array, key) {
    return array.reduce((groups, item) => {
      const group = item[key] || 'unknown';
      groups[group] = (groups[group] || 0) + 1;
      return groups;
    }, {});
  }

  getTopErrors(errors) {
    const errorCounts = {};

    errors.forEach(error => {
      const key = error.message.substring(0, 100); // First 100 chars
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });

    return Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([message, count]) => ({ message, count }));
  }

  generateRecommendations() {
    const recommendations = [];

    // Console error recommendations
    if (this.consoleErrors.length > 0) {
      const corsErrors = this.consoleErrors.filter(e => e.message.includes('CORS'));
      if (corsErrors.length > 0) {
        recommendations.push({
          type: 'cors',
          priority: 'high',
          description: 'Multiple CORS errors detected',
          suggestion: 'Review and update CORS configuration in API server'
        });
      }

      const networkErrors = this.consoleErrors.filter(e => e.message.includes('network') || e.message.includes('fetch'));
      if (networkErrors.length > 0) {
        recommendations.push({
          type: 'network',
          priority: 'medium',
          description: 'Network errors detected',
          suggestion: 'Check API endpoints and network connectivity'
        });
      }
    }

    // Docker error recommendations
    if (this.dockerErrors.length > 0) {
      const dbErrors = this.dockerErrors.filter(e => e.service.includes('postgres'));
      if (dbErrors.length > 0) {
        recommendations.push({
          type: 'database',
          priority: 'high',
          description: 'Database errors detected',
          suggestion: 'Check database connectivity and schema integrity'
        });
      }

      const apiErrors = this.dockerErrors.filter(e => e.service.includes('api'));
      if (apiErrors.length > 0) {
        recommendations.push({
          type: 'api',
          priority: 'high',
          description: 'API server errors detected',
          suggestion: 'Review API server logs and fix application errors'
        });
      }
    }

    return recommendations;
  }
}

module.exports = LogMonitor;