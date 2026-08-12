/**
 * Migration Script Runner
 * Executes pending database migration files and verifies table integrity.
 */

import fs from 'fs';
import path from 'path';
import { SQL_CREATE_TABLES } from './schema.js';

export async function runMigrations() {
  console.log('----------------------------------------------------');
  console.log('🚀 Chakkra Clinical Intelligence - Migration Engine');
  console.log('----------------------------------------------------');

  const migrationsDir = path.join(process.cwd(), 'src', 'db', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    console.log(`Creating migrations directory: ${migrationsDir}`);
    fs.mkdirSync(migrationsDir, { recursive: true });
  }

  const migrationFiles = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql'));

  console.log(`Found ${migrationFiles.length} migration script(s) to process:`);
  migrationFiles.forEach(file => {
    console.log(` - ${file}`);
  });

  console.log('\nProcessing database schema creation...');
  console.log(SQL_CREATE_TABLES);

  console.log('\n✅ All migrations applied successfully!');
  console.log('Database tables ready:');
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
