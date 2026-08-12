/**
 * Database Configuration & Environment Connection Settings
 * Reads database parameters from process environment variables or defaults.
 */

import 'dotenv/config';

export interface DbConfig {
  databaseUrl: string;
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
  ssl: boolean;
  migrationDir: string;
  migrationsTable: string;
  autoRunMigrations: boolean;
  useDatabaseData: boolean;
  dataSource: 'DATABASE' | 'SAMPLE';
}

export const dbConfig: DbConfig = {
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chakkra_clinical_db',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres_password',
  database: process.env.DB_NAME || 'chakkra_clinical_db',
  ssl: process.env.DB_SSL === 'true',
  migrationDir: process.env.MIGRATION_DIR || 'src/db/migrations',
  migrationsTable: process.env.MIGRATIONS_TABLE || '_sql_migrations',
  autoRunMigrations: process.env.AUTO_RUN_MIGRATIONS !== 'false',
  useDatabaseData: process.env.USE_DATABASE_DATA === 'true' || process.env.DATA_SOURCE === 'DATABASE' || process.env.USE_DB === 'true',
  dataSource: (process.env.USE_DATABASE_DATA === 'true' || process.env.DATA_SOURCE === 'DATABASE' || process.env.USE_DB === 'true') ? 'DATABASE' : 'SAMPLE'
};

export function isDatabaseModeEnabled(): boolean {
  return dbConfig.useDatabaseData;
}

/**
 * Returns sanitized database configuration for diagnostic logging (hides password)
 */
export function getSanitizedDbConfig() {
  const urlParts = dbConfig.databaseUrl.split('@');
  const sanitizedUrl = urlParts.length > 1 
    ? `postgresql://****:****@${urlParts[1]}`
    : dbConfig.databaseUrl;

  return {
    databaseUrl: sanitizedUrl,
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database,
    ssl: dbConfig.ssl,
    migrationDir: dbConfig.migrationDir,
    migrationsTable: dbConfig.migrationsTable
  };
}
