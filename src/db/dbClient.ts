/**
 * PostgreSQL Client Integration Wrapper
 * Connects to PostgreSQL database when USE_DATABASE_DATA=true or DATA_SOURCE=DATABASE
 */

import pg from 'pg';
import { dbConfig } from './config.js';
import { ClinicalDocument, HospitalTenant, Practitioner, Patient } from '../types.js';
import { SAMPLE_TENANTS, SAMPLE_PRACTITIONERS, SAMPLE_PATIENTS, HISTORICAL_DOCUMENTS } from '../data/sampleData.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

export function getDbPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: dbConfig.databaseUrl,
      ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.warn('⚠️ PostgreSQL Pool Error:', err.message);
    });
  }
  return pool;
}

/**
 * Tests database connectivity
 */
export async function testDbConnection(): Promise<boolean> {
  try {
    const client = getDbPool();
    const res = await client.query('SELECT NOW()');
    return !!res.rows[0];
  } catch (err: any) {
    console.warn('⚠️ Database connection test failed:', err.message);
    return false;
  }
}

/**
 * Loads clinical documents either from PostgreSQL or Sample Data depending on the USE_DATABASE_DATA flag.
 */
export async function loadDocumentsFromSource(useDb: boolean): Promise<ClinicalDocument[]> {
  if (!useDb) {
    console.log('📌 Data Source: Using Sample Historical Documents (USE_DATABASE_DATA=false)');
    return [...HISTORICAL_DOCUMENTS];
  }

  try {
    console.log('🐘 Data Source: Attempting to query PostgreSQL database (USE_DATABASE_DATA=true)...');
    const isConnected = await testDbConnection();
    if (!isConnected) {
      console.warn('⚠️ Database connection unavailable. Falling back to Sample Documents.');
      return [...HISTORICAL_DOCUMENTS];
    }

    const client = getDbPool();
    const result = await client.query('SELECT * FROM clinical_documents ORDER BY created_at DESC');

    if (result.rows.length === 0) {
      console.log('ℹ️ PostgreSQL clinical_documents table is empty. Falling back to initial seed data.');
      return [...HISTORICAL_DOCUMENTS];
    }

    // Map SQL rows to ClinicalDocument TS model
    return result.rows.map((row: any) => ({
      id: row.id,
      tenantId: row.tenant_id,
      patient: typeof row.patient_json === 'string' ? JSON.parse(row.patient_json) : (row.patient_json || SAMPLE_PATIENTS[0]),
      templateId: row.template_id || 'tpl-us-abdomen-01',
      templateName: row.template_name || 'US Whole Abdomen & Pelvis',
      modality: row.modality || 'US',
      studyDate: row.study_date ? new Date(row.study_date).toISOString() : new Date().toISOString(),
      accessionNumber: row.accession_number,
      referringPhysician: row.referring_physician,
      status: row.status || 'DRAFT',
      observations: typeof row.observations_json === 'string' ? JSON.parse(row.observations_json) : (row.observations_json || {}),
      findingsText: row.findings_text || '',
      impressionText: typeof row.impression_text_json === 'string' ? JSON.parse(row.impression_text_json) : (row.impression_text_json || []),
      digitalSignature: typeof row.digital_signature_json === 'string' ? JSON.parse(row.digital_signature_json) : row.digital_signature_json,
      previousDocumentId: row.previous_document_id,
      createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
      version: row.version || 1
    }));
  } catch (err: any) {
    console.error('❌ Error loading documents from PostgreSQL:', err.message);
    console.log('🔄 Fallback: Returning Sample Documents.');
    return [...HISTORICAL_DOCUMENTS];
  }
}
