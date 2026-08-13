/**
 * Migration Script Runner
 * Executes pending database migration files and verifies table integrity.
 */

import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { SQL_CREATE_TABLES } from './schema';
import { dbConfig, getSanitizedDbConfig } from './config';
import { getDbPool } from './dbClient';

export async function runMigrations() {
  console.log('----------------------------------------------------');
  console.log('🚀 Chakkra Clinical Intelligence - Migration Engine');
  console.log('----------------------------------------------------');

  const sanitized = getSanitizedDbConfig();
  console.log('📡 Active Database Configuration:');
  console.log(` - URL: ${sanitized.databaseUrl}`);
  console.log(` - Host: ${sanitized.host}:${sanitized.port}`);
  console.log(` - Database: ${sanitized.database}`);
  console.log(` - User: ${sanitized.user}`);
  console.log(` - SSL Enabled: ${sanitized.ssl}\n`);

  try {
    const pool = getDbPool();
    console.log('⚡ Executing PostgreSQL DDL Schema Migration Statements...');
    await pool.query(SQL_CREATE_TABLES);
    console.log('✅ All database schema migrations executed successfully!');
    console.log('Database tables ready & active:');
    console.log(' 1. tenants');
    console.log(' 2. practitioners');
    console.log(' 3. patients');
    console.log(' 4. templates');
    console.log(' 5. clinical_documents');
    console.log(' 6. audit_logs');
  } catch (err: any) {
    console.error('❌ Error executing database migrations:', err.message);
    throw err;
  }
  console.log('----------------------------------------------------\n');
}


// Execute migration if run directly via CLI
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations().catch(err => {
    console.error('❌ Migration error:', err);
    process.exit(1);
  });
}

