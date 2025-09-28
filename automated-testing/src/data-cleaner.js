/**
 * DATA CLEANUP AUTOMATION
 * Cleans test data from database and system
 */

const axios = require('axios');
const winston = require('winston');
const moment = require('moment');

class DataCleaner {
  constructor(config) {
    this.config = config;
    this.apiUrl = config.apiUrl;

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.json(),
      transports: [
        new winston.transports.File({ filename: 'logs/data-cleaner.log' })
      ]
    });

    this.testDataPatterns = [
      'autotest_',
      'functest_',
      'Auto Test',
      'Auto Client',
      'Auto Company',
      'Auto Proposal',
      'Functional Test',
      'test@autotest.com',
      'autoclient',
      '@test.com'
    ];
  }

  async cleanup() {
    this.logger.info('Starting data cleanup process...');

    try {
      // Get admin token for cleanup operations
      const adminToken = await this.getAdminToken();

      if (!adminToken) {
        this.logger.warn('No admin token available, skipping database cleanup');
        return;
      }

      // Clean test users
      await this.cleanTestUsers(adminToken);

      // Clean test clients
      await this.cleanTestClients(adminToken);

      // Clean test proposals
      await this.cleanTestProposals(adminToken);

      // Clean logs and temporary files
      await this.cleanLogFiles();

      this.logger.info('Data cleanup completed successfully');

    } catch (error) {
      this.logger.error('Error during cleanup:', error.message);
      throw error;
    }
  }

  async getAdminToken() {
    try {
      // Try to login with admin credentials for cleanup
      const response = await axios.post(`${this.apiUrl}/auth/login`, {
        email: 'admin@test.com',
        password: 'admin123'
      }, {
        timeout: 10000
      });

      return response.data.token;
    } catch (error) {
      // If admin login fails, return null (cleanup will be skipped)
      this.logger.warn('Admin login failed, cleanup will be limited');
      return null;
    }
  }

  async cleanTestUsers(token) {
    try {
      // Get all users
      const response = await axios.get(`${this.apiUrl}/users`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      const users = response.data.users || response.data || [];
      let deletedCount = 0;

      for (const user of users) {
        if (this.isTestData(user.name) || this.isTestData(user.email)) {
          try {
            await axios.delete(`${this.apiUrl}/users/${user.id}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000
            });
            deletedCount++;
          } catch (error) {
            this.logger.warn(`Failed to delete user ${user.id}:`, error.message);
          }
        }
      }

      this.logger.info(`Cleaned ${deletedCount} test users`);

    } catch (error) {
      this.logger.warn('User cleanup failed:', error.message);
    }
  }

  async cleanTestClients(token) {
    try {
      // Get all clients
      const response = await axios.get(`${this.apiUrl}/clients`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      const clients = response.data.clients || response.data || [];
      let deletedCount = 0;

      for (const client of clients) {
        if (this.isTestData(client.name) || this.isTestData(client.email) || this.isTestData(client.company)) {
          try {
            await axios.delete(`${this.apiUrl}/clients/${client.id}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000
            });
            deletedCount++;
          } catch (error) {
            this.logger.warn(`Failed to delete client ${client.id}:`, error.message);
          }
        }
      }

      this.logger.info(`Cleaned ${deletedCount} test clients`);

    } catch (error) {
      this.logger.warn('Client cleanup failed:', error.message);
    }
  }

  async cleanTestProposals(token) {
    try {
      // Get all proposals
      const response = await axios.get(`${this.apiUrl}/proposals`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000
      });

      const proposals = response.data.proposals || response.data || [];
      let deletedCount = 0;

      for (const proposal of proposals) {
        if (this.isTestData(proposal.title) ||
            this.isTestData(proposal.proposalName) ||
            this.isTestData(proposal.clientName) ||
            this.isTestData(proposal.jobName)) {
          try {
            await axios.delete(`${this.apiUrl}/proposals/${proposal.id}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000
            });
            deletedCount++;
          } catch (error) {
            this.logger.warn(`Failed to delete proposal ${proposal.id}:`, error.message);
          }
        }
      }

      this.logger.info(`Cleaned ${deletedCount} test proposals`);

    } catch (error) {
      this.logger.warn('Proposal cleanup failed:', error.message);
    }
  }

  async cleanLogFiles() {
    const fs = require('fs-extra');

    try {
      // Clean old log files (keep only last 24 hours)
      const logDir = 'logs';
      if (await fs.pathExists(logDir)) {
        const files = await fs.readdir(logDir);
        const cutoffTime = moment().subtract(24, 'hours');

        for (const file of files) {
          const filePath = `${logDir}/${file}`;
          const stats = await fs.stat(filePath);

          if (moment(stats.birthtime).isBefore(cutoffTime)) {
            await fs.remove(filePath);
            this.logger.info(`Removed old log file: ${file}`);
          }
        }
      }

      // Clean old reports (keep only last 50 iterations)
      const reportsDir = 'reports';
      if (await fs.pathExists(reportsDir)) {
        const files = await fs.readdir(reportsDir);
        const iterationFiles = files.filter(f => f.startsWith('iteration_') && f.endsWith('.json'));

        if (iterationFiles.length > 50) {
          // Sort by iteration number and remove oldest
          iterationFiles.sort();
          const toRemove = iterationFiles.slice(0, iterationFiles.length - 50);

          for (const file of toRemove) {
            await fs.remove(`${reportsDir}/${file}`);
            this.logger.info(`Removed old report: ${file}`);
          }
        }
      }

    } catch (error) {
      this.logger.warn('Log cleanup failed:', error.message);
    }
  }

  isTestData(value) {
    if (!value || typeof value !== 'string') return false;

    return this.testDataPatterns.some(pattern =>
      value.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  // Advanced cleanup methods
  async deepCleanup() {
    this.logger.info('Starting deep cleanup process...');

    try {
      // Clean database by patterns
      await this.cleanDatabaseByPatterns();

      // Clean uploaded files
      await this.cleanUploadedFiles();

      // Clean cache and temporary files
      await this.cleanCacheFiles();

      // Reset auto-increment IDs if needed
      await this.resetSequences();

      this.logger.info('Deep cleanup completed');

    } catch (error) {
      this.logger.error('Deep cleanup failed:', error.message);
    }
  }

  async cleanDatabaseByPatterns() {
    // This would require direct database access for more thorough cleanup
    // For now, we rely on API endpoints
    this.logger.info('Database pattern cleanup (using API endpoints)');
  }

  async cleanUploadedFiles() {
    const fs = require('fs-extra');

    try {
      // Clean test uploads directory if it exists
      const uploadsDir = '../services/api/uploads/test';
      if (await fs.pathExists(uploadsDir)) {
        await fs.emptyDir(uploadsDir);
        this.logger.info('Cleaned test uploads directory');
      }

      // Clean temporary files
      const tempDir = '../services/api/temp';
      if (await fs.pathExists(tempDir)) {
        const files = await fs.readdir(tempDir);
        for (const file of files) {
          if (this.isTestData(file)) {
            await fs.remove(`${tempDir}/${file}`);
            this.logger.info(`Removed test file: ${file}`);
          }
        }
      }

    } catch (error) {
      this.logger.warn('File cleanup failed:', error.message);
    }
  }

  async cleanCacheFiles() {
    const fs = require('fs-extra');

    try {
      // Clean cache directories
      const cacheDirs = ['cache', 'tmp', '.cache'];

      for (const dir of cacheDirs) {
        if (await fs.pathExists(dir)) {
          await fs.emptyDir(dir);
          this.logger.info(`Cleaned cache directory: ${dir}`);
        }
      }

    } catch (error) {
      this.logger.warn('Cache cleanup failed:', error.message);
    }
  }

  async resetSequences() {
    // This would require database access to reset auto-increment sequences
    // Implementation depends on database type (PostgreSQL, MySQL, etc.)
    this.logger.info('Sequence reset (would require direct DB access)');
  }

  // Generate cleanup report
  async generateCleanupReport() {
    const report = {
      timestamp: moment().toISOString(),
      cleanup: {
        logFiles: 'cleaned',
        testData: 'removed',
        cacheFiles: 'cleared',
        tempFiles: 'cleaned'
      },
      patterns: this.testDataPatterns,
      status: 'completed'
    };

    const fs = require('fs-extra');
    await fs.writeJSON('reports/cleanup_report.json', report, { spaces: 2 });

    return report;
  }
}

module.exports = DataCleaner;