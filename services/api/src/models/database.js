// Database Connection Module
// ORION Agent - Backend Development
// OrçamentosOnline API Database Configuration

const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  idleTimeoutMillis: parseInt(process.env.DB_TIMEOUT) || 30000,
  connectionTimeoutMillis: 10000
});

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful');

    // Test basic query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('🕒 Database time:', result.rows[0].current_time);
    console.log('🗄️  PostgreSQL version:', result.rows[0].postgres_version.split(' ')[0]);

    client.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Execute query with error handling
const query = async (text, params) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('📊 Query executed:', { text: text.substring(0, 50) + '...', duration: `${duration}ms`, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('❌ Query error:', error.message);
    console.error('📝 Query:', text);
    console.error('📋 Params:', params);
    throw error;
  }
};

// Get a client from the pool for transactions
const getClient = async () => {
  try {
    const client = await pool.connect();
    console.log('🔗 Database client acquired');
    return client;
  } catch (error) {
    console.error('❌ Failed to acquire database client:', error.message);
    throw error;
  }
};

// Health check function
const healthCheck = async () => {
  try {
    const result = await pool.query('SELECT 1 as healthy');
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      connections: {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
      }
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Graceful shutdown
const closePool = async () => {
  try {
    await pool.end();
    console.log('🔌 Database pool closed gracefully');
  } catch (error) {
    console.error('❌ Error closing database pool:', error.message);
  }
};

// Handle process termination
process.on('SIGINT', closePool);
process.on('SIGTERM', closePool);

// Initialize database function (alias for testConnection)
const initializeDatabase = async () => {
  console.log('🚀 Initializing database connection...');
  return await testConnection();
};

// Check connection function (alias for testConnection)
const checkConnection = async () => {
  return await testConnection();
};

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  healthCheck,
  closePool,
  initializeDatabase,
  checkConnection
};