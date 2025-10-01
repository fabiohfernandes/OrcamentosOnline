// Database Schema Initialization
// ORION Agent - Backend Development
// WebPropostas API Database Schema

const { pool } = require('./database');

/**
 * Initialize all database tables
 * This script creates all required tables if they don't exist
 */
const initializeSchema = async () => {
  const client = await pool.connect();

  try {
    console.log('🔧 Initializing database schema...');

    // Start transaction
    await client.query('BEGIN');

    // 1. Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE,
        is_active BOOLEAN DEFAULT true,
        reset_token TEXT,
        reset_token_expires TIMESTAMP WITH TIME ZONE,
        CONSTRAINT email_lowercase CHECK (email = LOWER(email))
      );
    `);
    console.log('✅ Users table created/verified');

    // Create index on email for faster lookups
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);

    // 2. Clients table
    await client.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        company_name VARCHAR(255),
        cpf_cnpj VARCHAR(18),
        address TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT email_lowercase CHECK (email IS NULL OR email = LOWER(email))
      );
    `);
    console.log('✅ Clients table created/verified');

    // Create indexes for clients
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
      CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
      CREATE INDEX IF NOT EXISTS idx_clients_cpf_cnpj ON clients(cpf_cnpj);
    `);

    // 3. Proposals table
    await client.query(`
      CREATE TABLE IF NOT EXISTS proposals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
        proposal_name VARCHAR(255) NOT NULL,
        job_name VARCHAR(255),
        client_name VARCHAR(255) NOT NULL,
        client_username VARCHAR(100) UNIQUE NOT NULL,
        client_password TEXT NOT NULL,
        client_password_display VARCHAR(50),
        public_token VARCHAR(100) UNIQUE,
        status VARCHAR(50) DEFAULT 'draft',
        proposal_value DECIMAL(15, 2) DEFAULT 0,
        presentation_url TEXT,
        commercial_url TEXT,
        scope_content TEXT,
        terms_content TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        closed_at TIMESTAMP WITH TIME ZONE,
        expires_at TIMESTAMP WITH TIME ZONE,
        client_email VARCHAR(255),
        title VARCHAR(500),
        username VARCHAR(100),
        password VARCHAR(100),
        CONSTRAINT username_lowercase CHECK (client_username = LOWER(client_username))
      );
    `);
    console.log('✅ Proposals table created/verified');

    // Create indexes for proposals
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON proposals(user_id);
      CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals(client_id);
      CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
      CREATE INDEX IF NOT EXISTS idx_proposals_client_username ON proposals(client_username);
      CREATE INDEX IF NOT EXISTS idx_proposals_public_token ON proposals(public_token);
      CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON proposals(created_at DESC);
    `);

    // 4. Proposal sections table (for multi-section proposals)
    await client.query(`
      CREATE TABLE IF NOT EXISTS proposal_sections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
        section_order INTEGER NOT NULL,
        section_title VARCHAR(255) NOT NULL,
        section_content TEXT,
        section_type VARCHAR(50) DEFAULT 'content',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Proposal sections table created/verified');

    // Create index for proposal sections
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_proposal_sections_proposal_id ON proposal_sections(proposal_id);
      CREATE INDEX IF NOT EXISTS idx_proposal_sections_order ON proposal_sections(proposal_id, section_order);
    `);

    // 5. Proposal activities/history table
    await client.query(`
      CREATE TABLE IF NOT EXISTS proposal_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        activity_type VARCHAR(100) NOT NULL,
        activity_description TEXT NOT NULL,
        metadata JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Proposal activities table created/verified');

    // Create indexes for activities
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_proposal_activities_proposal_id ON proposal_activities(proposal_id);
      CREATE INDEX IF NOT EXISTS idx_proposal_activities_created_at ON proposal_activities(created_at DESC);
    `);

    // 6. LGPD audit log table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lgpd_audit_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        operation VARCHAR(100) NOT NULL,
        legal_basis VARCHAR(100) NOT NULL,
        data_subject_email VARCHAR(255),
        data_subject_id UUID,
        request_path VARCHAR(500),
        request_method VARCHAR(10),
        ip_address VARCHAR(45),
        user_agent TEXT,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ LGPD audit log table created/verified');

    // Create indexes for LGPD audit
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lgpd_audit_user_id ON lgpd_audit_log(user_id);
      CREATE INDEX IF NOT EXISTS idx_lgpd_audit_created_at ON lgpd_audit_log(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_lgpd_audit_data_subject ON lgpd_audit_log(data_subject_email, data_subject_id);
    `);

    // 7. Sessions table (for JWT token blacklist/session management)
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL,
        refresh_token_hash TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        is_revoked BOOLEAN DEFAULT false
      );
    `);
    console.log('✅ Sessions table created/verified');

    // Create indexes for sessions
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
    `);

    // Commit transaction
    await client.query('COMMIT');

    console.log('✅ Database schema initialized successfully');
    return true;

  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Error initializing database schema:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Drop all tables (DANGEROUS - use only in development)
 */
const dropAllTables = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot drop tables in production environment');
  }

  const client = await pool.connect();

  try {
    console.log('⚠️  Dropping all tables...');

    await client.query('BEGIN');

    await client.query(`
      DROP TABLE IF EXISTS sessions CASCADE;
      DROP TABLE IF EXISTS lgpd_audit_log CASCADE;
      DROP TABLE IF EXISTS proposal_activities CASCADE;
      DROP TABLE IF EXISTS proposal_sections CASCADE;
      DROP TABLE IF EXISTS proposals CASCADE;
      DROP TABLE IF EXISTS clients CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    await client.query('COMMIT');

    console.log('✅ All tables dropped successfully');
    return true;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error dropping tables:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Reset database (drop and recreate all tables)
 */
const resetDatabase = async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot reset database in production environment');
  }

  await dropAllTables();
  await initializeSchema();
  console.log('✅ Database reset complete');
};

module.exports = {
  initializeSchema,
  dropAllTables,
  resetDatabase
};