/**
 * TESTER Database Manager
 * PostgreSQL connection and query management
 */

const { Pool } = require('pg');
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

class DatabaseManager {
    constructor() {
        this.pool = null;
        this.isConnected = false;
        this.connectionConfig = {
            host: process.env.POSTGRES_HOST || 'postgres',
            port: process.env.POSTGRES_PORT || 5432,
            database: process.env.POSTGRES_DB || 'testerdb',
            user: process.env.POSTGRES_USER || 'testeruser',
            password: process.env.POSTGRES_PASSWORD || 'testerpass',
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        };
    }

    async initialize() {
        try {
            console.log(chalk.blue('🗄️ Initializing Database Manager...'));

            // Create connection pool
            this.pool = new Pool(this.connectionConfig);

            // Test connection
            await this.testConnection();

            // Run database migrations if needed
            await this.runMigrations();

            this.isConnected = true;
            console.log(chalk.green('✅ Database Manager initialized'));

        } catch (error) {
            console.error(chalk.red('❌ Database initialization failed:'), error);
            throw error;
        }
    }

    async testConnection() {
        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();

            console.log(chalk.green('✅ Database connection successful'));
            return true;
        } catch (error) {
            console.error(chalk.red('❌ Database connection failed:'), error);
            throw error;
        }
    }

    async runMigrations() {
        try {
            console.log(chalk.blue('📋 Running database migrations...'));

            // Check if schema exists
            const schemaExists = await this.checkSchemaExists();

            if (!schemaExists) {
                console.log(chalk.yellow('📋 Schema not found, creating...'));
                await this.createSchema();
            } else {
                console.log(chalk.green('✅ Database schema already exists'));
            }

        } catch (error) {
            console.error(chalk.red('❌ Migration failed:'), error);
            throw error;
        }
    }

    async checkSchemaExists() {
        try {
            const result = await this.query(`
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'test_sessions'
            `);

            return result.rows.length > 0;
        } catch (error) {
            return false;
        }
    }

    async createSchema() {
        try {
            // Read schema file
            const schemaPath = path.join(__dirname, '..', '..', 'config', 'init.sql');
            const schemaSQL = await fs.readFile(schemaPath, 'utf-8');

            // Execute schema creation
            await this.query(schemaSQL);

            console.log(chalk.green('✅ Database schema created successfully'));
        } catch (error) {
            console.error(chalk.red('❌ Schema creation failed:'), error);
            throw error;
        }
    }

    async query(text, params = []) {
        if (!this.pool) {
            throw new Error('Database not initialized');
        }

        try {
            const start = Date.now();
            const result = await this.pool.query(text, params);
            const duration = Date.now() - start;

            // Log slow queries (> 1 second)
            if (duration > 1000) {
                console.warn(chalk.yellow(`⚠️ Slow query (${duration}ms): ${text.substring(0, 100)}...`));
            }

            return result;
        } catch (error) {
            console.error(chalk.red('❌ Database query failed:'), error);
            console.error(chalk.red('Query:'), text);
            console.error(chalk.red('Params:'), params);
            throw error;
        }
    }

    async transaction(callback) {
        const client = await this.pool.connect();

        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async createSession(sessionData) {
        try {
            const result = await this.query(`
                INSERT INTO test_sessions (
                    session_id, project_name, start_time, status, virtual_users, config
                ) VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [
                sessionData.sessionId,
                sessionData.projectName,
                new Date(),
                sessionData.status || 'running',
                sessionData.config?.virtualUsers || 1,
                JSON.stringify(sessionData.config || {})
            ]);

            return result.rows[0];
        } catch (error) {
            console.error(chalk.red('Failed to create session:'), error);
            throw error;
        }
    }

    async updateSession(sessionId, updates) {
        try {
            const setParts = [];
            const values = [];
            let paramIndex = 1;

            Object.entries(updates).forEach(([key, value]) => {
                setParts.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            });

            values.push(sessionId);

            const result = await this.query(`
                UPDATE test_sessions
                SET ${setParts.join(', ')}, updated_at = NOW()
                WHERE session_id = $${paramIndex}
                RETURNING *
            `, values);

            return result.rows[0];
        } catch (error) {
            console.error(chalk.red('Failed to update session:'), error);
            throw error;
        }
    }

    async getSession(sessionId) {
        try {
            const result = await this.query(`
                SELECT * FROM test_sessions WHERE session_id = $1
            `, [sessionId]);

            return result.rows[0] || null;
        } catch (error) {
            console.error(chalk.red('Failed to get session:'), error);
            throw error;
        }
    }

    async getRecentSessions(limit = 10) {
        try {
            const result = await this.query(`
                SELECT * FROM test_sessions
                ORDER BY start_time DESC
                LIMIT $1
            `, [limit]);

            return result.rows;
        } catch (error) {
            console.error(chalk.red('Failed to get recent sessions:'), error);
            throw error;
        }
    }

    async getSessionStats(sessionId) {
        try {
            const result = await this.query(`
                SELECT
                    COUNT(*) as total_tests,
                    COUNT(CASE WHEN status = 'passed' THEN 1 END) as passed_tests,
                    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_tests,
                    AVG(duration_ms) as avg_duration,
                    MIN(duration_ms) as min_duration,
                    MAX(duration_ms) as max_duration
                FROM test_results
                WHERE session_id = $1
            `, [sessionId]);

            return result.rows[0];
        } catch (error) {
            console.error(chalk.red('Failed to get session stats:'), error);
            throw error;
        }
    }

    async getSessionIssues(sessionId, severityFilter = null) {
        try {
            let query = `
                SELECT * FROM issues
                WHERE session_id = $1
            `;
            const params = [sessionId];

            if (severityFilter) {
                query += ' AND severity = $2';
                params.push(severityFilter);
            }

            query += ' ORDER BY created_at DESC';

            const result = await this.query(query, params);
            return result.rows;
        } catch (error) {
            console.error(chalk.red('Failed to get session issues:'), error);
            throw error;
        }
    }

    async cleanupOldData(daysToKeep = 30) {
        try {
            console.log(chalk.blue(`🧹 Cleaning up data older than ${daysToKeep} days...`));

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            // Delete old test results
            const testResultsDeleted = await this.query(`
                DELETE FROM test_results
                WHERE created_at < $1
            `, [cutoffDate]);

            // Delete old issues
            const issuesDeleted = await this.query(`
                DELETE FROM issues
                WHERE created_at < $1
            `, [cutoffDate]);

            // Delete old performance metrics
            const metricsDeleted = await this.query(`
                DELETE FROM performance_metrics
                WHERE recorded_at < $1
            `, [cutoffDate]);

            // Delete old system metrics
            const systemMetricsDeleted = await this.query(`
                DELETE FROM system_metrics
                WHERE timestamp < $1
            `, [cutoffDate]);

            // Delete old console events
            const consoleEventsDeleted = await this.query(`
                DELETE FROM console_events
                WHERE timestamp < $1
            `, [cutoffDate]);

            // Delete old docker events
            const dockerEventsDeleted = await this.query(`
                DELETE FROM docker_events
                WHERE timestamp < $1
            `, [cutoffDate]);

            // Delete old coverage maps
            const coverageDeleted = await this.query(`
                DELETE FROM coverage_map
                WHERE discovered_at < $1
            `, [cutoffDate]);

            // Delete old sessions
            const sessionsDeleted = await this.query(`
                DELETE FROM test_sessions
                WHERE start_time < $1
            `, [cutoffDate]);

            console.log(chalk.green(`✅ Cleanup complete:
                - Test Results: ${testResultsDeleted.rowCount}
                - Issues: ${issuesDeleted.rowCount}
                - Performance Metrics: ${metricsDeleted.rowCount}
                - System Metrics: ${systemMetricsDeleted.rowCount}
                - Console Events: ${consoleEventsDeleted.rowCount}
                - Docker Events: ${dockerEventsDeleted.rowCount}
                - Coverage Maps: ${coverageDeleted.rowCount}
                - Sessions: ${sessionsDeleted.rowCount}
            `));

        } catch (error) {
            console.error(chalk.red('❌ Cleanup failed:'), error);
            throw error;
        }
    }

    async getDatabaseStats() {
        try {
            const result = await this.query(`
                SELECT
                    schemaname,
                    tablename,
                    n_tup_ins as inserts,
                    n_tup_upd as updates,
                    n_tup_del as deletes,
                    n_live_tup as live_tuples,
                    n_dead_tup as dead_tuples,
                    last_vacuum,
                    last_autovacuum,
                    last_analyze,
                    last_autoanalyze
                FROM pg_stat_user_tables
                ORDER BY n_live_tup DESC
            `);

            return result.rows;
        } catch (error) {
            console.error(chalk.red('Failed to get database stats:'), error);
            return [];
        }
    }

    async vacuum() {
        try {
            console.log(chalk.blue('🧹 Running database vacuum...'));

            // Get list of tables
            const tablesResult = await this.query(`
                SELECT tablename
                FROM pg_tables
                WHERE schemaname = 'public'
            `);

            // Vacuum each table
            for (const table of tablesResult.rows) {
                await this.query(`VACUUM ANALYZE ${table.tablename}`);
            }

            console.log(chalk.green('✅ Database vacuum completed'));
        } catch (error) {
            console.error(chalk.red('❌ Vacuum failed:'), error);
            throw error;
        }
    }

    async backup(backupPath) {
        try {
            console.log(chalk.blue(`💾 Creating database backup: ${backupPath}`));

            const { spawn } = require('child_process');

            return new Promise((resolve, reject) => {
                const pgDump = spawn('pg_dump', [
                    '-h', this.connectionConfig.host,
                    '-p', this.connectionConfig.port,
                    '-U', this.connectionConfig.user,
                    '-d', this.connectionConfig.database,
                    '-f', backupPath,
                    '--verbose'
                ], {
                    env: {
                        ...process.env,
                        PGPASSWORD: this.connectionConfig.password
                    }
                });

                pgDump.on('close', (code) => {
                    if (code === 0) {
                        console.log(chalk.green(`✅ Database backup completed: ${backupPath}`));
                        resolve(backupPath);
                    } else {
                        reject(new Error(`pg_dump exited with code ${code}`));
                    }
                });

                pgDump.on('error', (error) => {
                    reject(error);
                });
            });

        } catch (error) {
            console.error(chalk.red('❌ Backup failed:'), error);
            throw error;
        }
    }

    async isHealthy() {
        try {
            if (!this.pool) {
                return false;
            }

            // Test with a simple query
            const result = await this.query('SELECT 1 as health_check');
            return result.rows.length > 0 && result.rows[0].health_check === 1;
        } catch (error) {
            console.error(chalk.red('Database health check failed:'), error);
            return false;
        }
    }

    async getConnectionInfo() {
        try {
            const result = await this.query(`
                SELECT
                    count(*) as total_connections,
                    count(*) FILTER (WHERE state = 'active') as active_connections,
                    count(*) FILTER (WHERE state = 'idle') as idle_connections
                FROM pg_stat_activity
                WHERE datname = $1
            `, [this.connectionConfig.database]);

            return result.rows[0];
        } catch (error) {
            console.error(chalk.red('Failed to get connection info:'), error);
            return { total_connections: 0, active_connections: 0, idle_connections: 0 };
        }
    }

    async close() {
        if (this.pool) {
            try {
                await this.pool.end();
                this.isConnected = false;
                console.log(chalk.yellow('🗄️ Database connections closed'));
            } catch (error) {
                console.error(chalk.red('Error closing database connections:'), error);
            }
        }
    }

    // Utility method for pagination
    async paginate(baseQuery, params = [], page = 1, limit = 50) {
        try {
            const offset = (page - 1) * limit;

            // Count total records
            const countQuery = baseQuery.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM');
            const countResult = await this.query(countQuery, params);
            const total = parseInt(countResult.rows[0].total);

            // Get paginated results
            const dataQuery = `${baseQuery} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
            const dataResult = await this.query(dataQuery, [...params, limit, offset]);

            return {
                data: dataResult.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                    hasNext: page < Math.ceil(total / limit),
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            console.error(chalk.red('Pagination failed:'), error);
            throw error;
        }
    }

    // Bulk insert helper
    async bulkInsert(table, records, conflictAction = 'ON CONFLICT DO NOTHING') {
        if (!records.length) return [];

        try {
            const columns = Object.keys(records[0]);
            const values = records.map(record =>
                columns.map(col => record[col])
            );

            const placeholders = values.map((_, i) =>
                `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(',')})`
            ).join(',');

            const query = `
                INSERT INTO ${table} (${columns.join(',')})
                VALUES ${placeholders}
                ${conflictAction}
                RETURNING *
            `;

            const flatValues = values.flat();
            const result = await this.query(query, flatValues);

            return result.rows;
        } catch (error) {
            console.error(chalk.red('Bulk insert failed:'), error);
            throw error;
        }
    }
}

module.exports = DatabaseManager;