#!/usr/bin/env node
/**
 * Create Railway Production Database Schema
 * Run with: railway run node create-railway-schema.js
 */

const fs = require('fs');
const { Client } = require('pg');

async function createSchema() {
  console.log('🔧 Connecting to Railway PostgreSQL database...');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Read the SQL file
    const sql = fs.readFileSync('./railway-production-schema.sql', 'utf8');

    console.log('📝 Running schema creation SQL...');

    // Execute the SQL
    await client.query(sql);

    console.log('✅ Schema created successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('users', 'proposals', 'client_comments', 'proposal_views')
      ORDER BY table_name
    `);

    console.log('\n📊 Created tables:');
    result.rows.forEach(row => {
      console.log(`  ✓ ${row.table_name}`);
    });

    // Check if users table has correct structure
    const usersColumns = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Users table structure:');
    usersColumns.rows.forEach(col => {
      console.log(`  • ${col.column_name}: ${col.data_type}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ Done!');
  }
}

createSchema();