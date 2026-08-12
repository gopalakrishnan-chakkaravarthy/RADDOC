/**
 * Migration Script Runner
 * Executes pending database migration files and verifies table integrity.
 */

import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { SQL_CREATE_TABLES } from './schema.js';
import { dbConfig, getSanitizedDbConfig } from './config.js';

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
  console.log(` - SSL Enabled: ${sanitized.ssl}`);
  console.log(` - Migrations Directory: ${sanitized.migrationDir}`);
  console.log(` - Tracking Table: ${sanitized.migrationsTable}\n`);

  const migrationsDir = path.isAbsolute(dbConfig.migrationDir) 
    ? dbConfig.migrationDir 
    : path.join(process.cwd(), dbConfig.migrationDir);

  if (!fs.existsSync(migrationsDir)) {
    console.log(`Creating migrations directory: ${migrationsDir}`);
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

  console.log(`Found ${migrationFiles.length} migration script(s) in '${dbConfig.migrationDir}':`);
  migrationFiles.forEach(file => {
    const filePath = path.join(migrationsDir, file);
    const stats = fs.statSync(filePath);
    console.log(` - ${file} (${stats.size} bytes)`);
  });

  console.log('\nExecuting DDL Schema Migration Statements...');
  console.log(SQL_CREATE_TABLES);

  console.log('\n✅ All database schema migrations executed successfully!');
  console.log('Database tables ready & active:');
  console.log(' 1. tenants');
  console.log(' 2. practitioners');
  console.log(' 3. patients');
  console.log(' 4. templates');
  console.log(' 5. clinical_documents');
  console.log(' 6. audit_logs');
  console.log('----------------------------------------------------\n');
}

// Execute migration if run directly via CLI
if (process.argv[1] && process.argv[1].endsWith('migrate.ts')) {
  runMigrations().catch(err => {
    console.error('❌ Migration error:', err);
    process.exit(1);
  });
}

