#!/usr/bin/env node

/**
 * TESTER Agent Install Kit
 * Universal installation script for any project
 */

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const readline = require('readline');

class TesterInstaller {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        this.config = {
            projectName: '',
            targetDirectory: '',
            port: 8888,
            installType: 'standalone', // standalone, docker-compose, kubernetes
            services: {
                postgres: { port: 5432, enabled: true },
                redis: { port: 6379, enabled: true },
                frontend: { port: 3001, enabled: true },
                backend: { port: 3000, enabled: true }
            }
        };
    }

    async install() {
        console.log(chalk.blue.bold('\n🤖 TESTER Agent Installation Kit'));
        console.log(chalk.cyan('Universal Testing Dashboard for Any Project\n'));

        try {
            await this.gatherConfiguration();
            await this.validateTarget();
            await this.copyFiles();
            await this.configureDocker();
            await this.generateReadme();
            await this.displayInstructions();

            console.log(chalk.green.bold('\n✅ TESTER Agent installed successfully!'));
            console.log(chalk.yellow(`🌐 Dashboard will be available at: http://localhost:${this.config.port}`));

        } catch (error) {
            console.error(chalk.red.bold('\n❌ Installation failed:'), error.message);
            process.exit(1);
        } finally {
            this.rl.close();
        }
    }

    async gatherConfiguration() {
        console.log(chalk.yellow('📋 Configuration Setup\n'));

        // Project name
        this.config.projectName = await this.question('Project name: ') || 'MyProject';

        // Target directory
        const currentDir = process.cwd();
        const suggestedTarget = path.join(currentDir, 'tester-dashboard');
        this.config.targetDirectory = await this.question(`Installation directory [${suggestedTarget}]: `) || suggestedTarget;

        // Port
        const portInput = await this.question('Dashboard port [8888]: ');
        this.config.port = parseInt(portInput) || 8888;

        // Installation type
        console.log('\nInstallation types:');
        console.log('1. Standalone (independent service)');
        console.log('2. Docker Compose integration');
        console.log('3. Kubernetes deployment');

        const typeChoice = await this.question('Choose installation type [1]: ') || '1';
        switch (typeChoice) {
            case '2':
                this.config.installType = 'docker-compose';
                break;
            case '3':
                this.config.installType = 'kubernetes';
                break;
            default:
                this.config.installType = 'standalone';
        }

        // Services configuration
        if (await this.question('Configure custom service ports? [y/N]: ').toLowerCase() === 'y') {
            await this.configureServices();
        }

        console.log(chalk.green('\n✅ Configuration complete\n'));
    }

    async configureServices() {
        console.log('\n📡 Service Port Configuration\n');

        for (const [key, service] of Object.entries(this.config.services)) {
            const enabled = await this.question(`Enable ${key} monitoring? [Y/n]: `);
            service.enabled = enabled.toLowerCase() !== 'n';

            if (service.enabled) {
                const port = await this.question(`${key} port [${service.port}]: `);
                service.port = parseInt(port) || service.port;
            }
        }
    }

    async validateTarget() {
        const targetExists = await fs.pathExists(this.config.targetDirectory);

        if (targetExists) {
            const overwrite = await this.question(`Directory ${this.config.targetDirectory} exists. Overwrite? [y/N]: `);
            if (overwrite.toLowerCase() !== 'y') {
                throw new Error('Installation cancelled');
            }
            await fs.remove(this.config.targetDirectory);
        }

        await fs.ensureDir(this.config.targetDirectory);
        console.log(chalk.green(`📁 Target directory created: ${this.config.targetDirectory}`));
    }

    async copyFiles() {
        console.log(chalk.blue('\n📦 Copying TESTER Agent files...\n'));

        const sourceDir = __dirname;
        const targetDir = this.config.targetDirectory;

        // Copy core files
        const filesToCopy = [
            'package.json',
            'server.js',
            'public/index.html',
            'public/styles.css',
            'public/dashboard.js'
        ];

        for (const file of filesToCopy) {
            const sourcePath = path.join(sourceDir, file);
            const targetPath = path.join(targetDir, file);

            await fs.ensureDir(path.dirname(targetPath));
            await fs.copy(sourcePath, targetPath);
            console.log(chalk.green(`✅ Copied: ${file}`));
        }

        // Update package.json with project-specific info
        await this.updatePackageJson(targetDir);

        console.log(chalk.green('\n✅ Files copied successfully'));
    }

    async updatePackageJson(targetDir) {
        const packagePath = path.join(targetDir, 'package.json');
        const packageJson = await fs.readJSON(packagePath);

        packageJson.name = `tester-dashboard-${this.config.projectName.toLowerCase().replace(/\s+/g, '-')}`;
        packageJson.description = `TESTER Agent Dashboard for ${this.config.projectName}`;

        await fs.writeJSON(packagePath, packageJson, { spaces: 2 });
    }

    async configureDocker() {
        if (this.config.installType !== 'docker-compose') return;

        console.log(chalk.blue('\n🐳 Configuring Docker integration...\n'));

        const dockerCompose = this.generateDockerCompose();
        const dockerComposeDestination = path.join(this.config.targetDirectory, 'docker-compose.tester.yml');

        await fs.writeFile(dockerComposeDestination, dockerCompose);
        console.log(chalk.green('✅ Docker Compose configuration created'));

        // Create Dockerfile
        const dockerfile = this.generateDockerfile();
        const dockerfileDestination = path.join(this.config.targetDirectory, 'Dockerfile');

        await fs.writeFile(dockerfileDestination, dockerfile);
        console.log(chalk.green('✅ Dockerfile created'));
    }

    generateDockerCompose() {
        return `version: '3.8'

# TESTER Agent Dashboard - Auto-generated
# Project: ${this.config.projectName}

services:
  tester-dashboard:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${this.config.projectName.toLowerCase().replace(/\s+/g, '-')}-tester
    restart: unless-stopped
    ports:
      - "${this.config.port}:${this.config.port}"
    environment:
      - NODE_ENV=production
      - TESTER_PORT=${this.config.port}
      - PROJECT_NAME=${this.config.projectName}
    volumes:
      - ./logs:/app/logs
      - ./backlogs:/app/backlogs
      - /var/run/docker.sock:/var/run/docker.sock:ro
    networks:
      - tester-network

networks:
  tester-network:
    driver: bridge

volumes:
  tester-logs:
  tester-backlogs:
`;
    }

    generateDockerfile() {
        return `FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    curl \
    bash \
    docker-cli

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Create directories
RUN mkdir -p logs backlogs

# Expose port
EXPOSE ${this.config.port}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${this.config.port}/api/status || exit 1

# Start the application
CMD ["npm", "start"]
`;
    }

    async generateReadme() {
        console.log(chalk.blue('\n📝 Generating documentation...\n'));

        const readme = this.generateReadmeContent();
        const readmePath = path.join(this.config.targetDirectory, 'README.md');

        await fs.writeFile(readmePath, readme);
        console.log(chalk.green('✅ README.md created'));

        // Create .env.example
        const envExample = this.generateEnvExample();
        const envPath = path.join(this.config.targetDirectory, '.env.example');

        await fs.writeFile(envPath, envExample);
        console.log(chalk.green('✅ .env.example created'));
    }

    generateReadmeContent() {
        return `# TESTER Agent Dashboard - ${this.config.projectName}

Universal Testing Dashboard for comprehensive project testing.

## 🚀 Quick Start

### Standalone Installation
\`\`\`bash
# Install dependencies
npm install

# Start the dashboard
npm start
\`\`\`

Dashboard will be available at: http://localhost:${this.config.port}

### Docker Installation
\`\`\`bash
# Build and run with Docker Compose
docker-compose -f docker-compose.tester.yml up -d

# View logs
docker-compose -f docker-compose.tester.yml logs -f
\`\`\`

## 🎯 Features

✅ **Real-time Testing** - Continuous testing until 100% success rate
✅ **Service Monitoring** - Monitor all configured services
✅ **Auto-Discovery** - Automatically discover project features
✅ **Progress Tracking** - Color-coded progress (red→orange→yellow→green→blue)
✅ **Error Analysis** - Comprehensive error logging and analysis
✅ **Backlog Management** - Save and manage test backlogs
✅ **Auto Options** - Automated retry, fix, and restart capabilities

## ⚙️ Configuration

### Monitored Services
${Object.entries(this.config.services)
  .filter(([, service]) => service.enabled)
  .map(([name, service]) => `- **${name}**: Port ${service.port}`)
  .join('\n')}

### Environment Variables
- \`TESTER_PORT\`: Dashboard port (default: ${this.config.port})
- \`PROJECT_NAME\`: Project name (${this.config.projectName})
- \`NODE_ENV\`: Environment (development/production)

## 🔧 Usage

1. **Set Project Name**: Enter your project name in the dashboard
2. **Configure Services**: Enable/disable service monitoring
3. **Set Iterations**: Choose number of test iterations (1-100)
4. **Start Testing**: Click "Start Testing" to begin
5. **Monitor Progress**: Watch real-time progress and results
6. **Save Backlogs**: Save test results for later analysis

## 📊 Dashboard Sections

- **Project Configuration**: Set project name and basic settings
- **Service Monitoring**: Configure which services to monitor
- **Test Configuration**: Set number of test iterations
- **Auto Options**: Configure automated behaviors
- **Progress Indicator**: Real-time success rate with color coding
- **Control Buttons**: Start, pause, stop testing
- **Real-time Results**: Live test results and status
- **Discovered Features**: Auto-discovered project features
- **Error Log**: Real-time error tracking
- **Comprehensive Summary**: Overall testing statistics

## 🎨 Progress Colors

- 🔴 **Red (0-19%)**: System broken, needs immediate attention
- 🟠 **Orange (20-39%)**: Major issues, significant work needed
- 🟡 **Yellow (40-59%)**: Moderate issues, improvements needed
- 🟢 **Green (60-79%)**: Good state, minor issues remaining
- 🔵 **Blue (80-100%)**: Excellent state, system fully functional

## 🔄 Auto Options

- **Auto Retry**: Automatically retry failed tests
- **Auto Fix**: Apply common fixes automatically
- **Auto Refresh Scope**: Refresh feature discovery on changes
- **Auto Restart Containers**: Restart containers when they crash

## 📁 Generated Files

- \`logs/\`: Test execution logs
- \`backlogs/\`: Saved test backlogs
- \`tester_log_*.json\`: Downloadable log files

## 🛠️ API Endpoints

- \`GET /api/status\`: Get current testing status
- \`POST /api/test/start\`: Start testing
- \`POST /api/test/pause\`: Pause/resume testing
- \`POST /api/test/stop\`: Stop testing
- \`POST /api/discovery/refresh\`: Refresh feature discovery

## 📞 Support

TESTER Agent is designed to work with any project. If you encounter issues:

1. Check the error log in the dashboard
2. Review generated log files
3. Ensure all required services are running
4. Verify port configurations

---

Generated by TESTER Agent Install Kit
Dashboard Port: ${this.config.port}
Project: ${this.config.projectName}
Installation Date: ${new Date().toISOString()}
`;
    }

    generateEnvExample() {
        return `# TESTER Agent Configuration
# Copy this file to .env and customize as needed

# Dashboard Configuration
TESTER_PORT=${this.config.port}
PROJECT_NAME="${this.config.projectName}"
NODE_ENV=development

# Service Monitoring
${Object.entries(this.config.services)
  .map(([name, service]) => `${name.toUpperCase()}_PORT=${service.port}`)
  .join('\n')}

# Auto Options (true/false)
AUTO_RETRY=false
AUTO_FIX=false
AUTO_REFRESH_SCOPE=false
AUTO_RESTART_CONTAINERS=false

# Testing Configuration
MAX_ITERATIONS=1000
TARGET_SUCCESS_RATE=100
DEFAULT_TEST_CYCLES=10
`;
    }

    async displayInstructions() {
        console.log(chalk.cyan.bold('\n📋 Next Steps:\n'));
        console.log(chalk.white('1. Navigate to the installation directory:'));
        console.log(chalk.yellow(`   cd ${this.config.targetDirectory}`));

        console.log(chalk.white('\n2. Install dependencies:'));
        console.log(chalk.yellow('   npm install'));

        console.log(chalk.white('\n3. Start the dashboard:'));
        if (this.config.installType === 'docker-compose') {
            console.log(chalk.yellow('   docker-compose -f docker-compose.tester.yml up -d'));
        } else {
            console.log(chalk.yellow('   npm start'));
        }

        console.log(chalk.white('\n4. Open the dashboard:'));
        console.log(chalk.yellow(`   http://localhost:${this.config.port}`));

        console.log(chalk.white('\n5. Configure your project and start testing!'));

        console.log(chalk.green.bold('\n🎉 TESTER Agent is ready to test your project comprehensively!'));
    }

    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(chalk.cyan(prompt), resolve);
        });
    }
}

// Run installer if called directly
if (require.main === module) {
    const installer = new TesterInstaller();
    installer.install().catch(console.error);
}

module.exports = TesterInstaller;