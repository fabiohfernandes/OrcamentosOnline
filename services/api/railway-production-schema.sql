-- Railway Production Database Schema
-- Simple schema for user registration and proposal platform
-- Run this directly in Railway PostgreSQL console

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Create proposals table (simplified for proposal platform)
CREATE TABLE IF NOT EXISTS proposals (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  proposal_name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  job_name VARCHAR(255) NOT NULL,
  presentation_url TEXT,
  commercial_proposal_url TEXT,
  scope_text TEXT,
  terms_text TEXT,
  client_username VARCHAR(100) UNIQUE NOT NULL,
  client_password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'archived')),
  proposal_value DECIMAL(10,2) DEFAULT 0,
  deadline DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP NULL
);

-- Create client comments table
CREATE TABLE IF NOT EXISTS client_comments (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER REFERENCES proposals(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create proposal analytics table
CREATE TABLE IF NOT EXISTS proposal_views (
  id SERIAL PRIMARY KEY,
  proposal_id INTEGER REFERENCES proposals(id) ON DELETE CASCADE,
  page_name VARCHAR(50),
  viewed_at TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),
  session_id VARCHAR(255)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_proposals_user_id ON proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_client_username ON proposals(client_username);
CREATE INDEX IF NOT EXISTS idx_client_comments_proposal_id ON client_comments(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_views_proposal_id ON proposal_views(proposal_id);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verify tables were created
SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('users', 'proposals', 'client_comments', 'proposal_views')
ORDER BY table_name;