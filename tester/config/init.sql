-- TESTER Database Schema
-- Autonomous Stress Testing System

-- Create test sessions table
CREATE TABLE IF NOT EXISTS test_sessions (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    start_time TIMESTAMP DEFAULT NOW(),
    end_time TIMESTAMP,
    status VARCHAR(50) DEFAULT 'running',
    total_tests INTEGER DEFAULT 0,
    passed_tests INTEGER DEFAULT 0,
    failed_tests INTEGER DEFAULT 0,
    virtual_users INTEGER DEFAULT 1,
    duration_seconds INTEGER,
    config JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create test results table
CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES test_sessions(session_id),
    test_id VARCHAR(255) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    test_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    duration_ms INTEGER NOT NULL,
    page_url VARCHAR(500),
    flow_name VARCHAR(255),
    error_message TEXT,
    stack_trace TEXT,
    screenshot_path VARCHAR(500),
    video_path VARCHAR(500),
    trace_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create issues table (for backlog)
CREATE TABLE IF NOT EXISTS issues (
    id SERIAL PRIMARY KEY,
    issue_id VARCHAR(255) UNIQUE NOT NULL,
    session_id VARCHAR(255) REFERENCES test_sessions(session_id),
    source VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    first_seen TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW(),
    count INTEGER DEFAULT 1,
    page_url VARCHAR(500),
    flow_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'open',
    evidence JSONB,
    http_details JSONB,
    stack_trace TEXT,
    suspected_modules TEXT[],
    reproduction_steps TEXT,
    claude_analysis JSONB,
    fix_applied TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create coverage map table
CREATE TABLE IF NOT EXISTS coverage_map (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES test_sessions(session_id),
    page_url VARCHAR(500) NOT NULL,
    element_role VARCHAR(100),
    element_text VARCHAR(500),
    element_selector TEXT,
    element_metadata JSONB,
    discovered_at TIMESTAMP DEFAULT NOW()
);

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES test_sessions(session_id),
    page_url VARCHAR(500) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,3) NOT NULL,
    metric_unit VARCHAR(20),
    percentile VARCHAR(10),
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Create console events table
CREATE TABLE IF NOT EXISTS console_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES test_sessions(session_id),
    event_id VARCHAR(255) NOT NULL,
    page_url VARCHAR(500),
    event_type VARCHAR(50) NOT NULL,
    level VARCHAR(20) NOT NULL,
    message TEXT,
    stack_trace TEXT,
    request_details JSONB,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Create docker events table
CREATE TABLE IF NOT EXISTS docker_events (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES test_sessions(session_id),
    event_id VARCHAR(255) NOT NULL,
    container_name VARCHAR(255),
    event_level VARCHAR(20) NOT NULL,
    message TEXT,
    raw_line TEXT,
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Create system metrics table
CREATE TABLE IF NOT EXISTS system_metrics (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) REFERENCES test_sessions(session_id),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(10,3) NOT NULL,
    metric_unit VARCHAR(20),
    service_name VARCHAR(100),
    timestamp TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_test_sessions_status ON test_sessions(status);
CREATE INDEX IF NOT EXISTS idx_test_sessions_project ON test_sessions(project_name);
CREATE INDEX IF NOT EXISTS idx_test_results_session ON test_results(session_id);
CREATE INDEX IF NOT EXISTS idx_test_results_status ON test_results(status);
CREATE INDEX IF NOT EXISTS idx_test_results_type ON test_results(test_type);
CREATE INDEX IF NOT EXISTS idx_issues_session ON issues(session_id);
CREATE INDEX IF NOT EXISTS idx_issues_severity ON issues(severity);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_coverage_session ON coverage_map(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_session ON performance_metrics(session_id);
CREATE INDEX IF NOT EXISTS idx_console_events_session ON console_events(session_id);
CREATE INDEX IF NOT EXISTS idx_docker_events_session ON docker_events(session_id);
CREATE INDEX IF NOT EXISTS idx_system_metrics_session ON system_metrics(session_id);