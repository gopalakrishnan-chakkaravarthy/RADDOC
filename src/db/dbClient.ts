/**
 * PostgreSQL Database Integration & Persistence Layer
 * Provides full CRUD operations for Tenants, Practitioners, Patients, Templates, Clinical Documents, and Audit Logs.
 */

import pg from 'pg';
import { dbConfig } from './config';
import { ClinicalDocument, HospitalTenant, Practitioner, Patient, TemplateDefinition, AuditLogEntry } from '../types';
import { SAMPLE_TENANTS, SAMPLE_PRACTITIONERS, SAMPLE_PATIENTS, HISTORICAL_DOCUMENTS } from '../data/sampleData';
import { RADIOLOGY_TEMPLATES } from '../data/templates';

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

// ==========================================
// 1. HOSPITAL TENANTS CRUD
// ==========================================

export async function getTenantsFromDb(): Promise<HospitalTenant[]> {
  const client = getDbPool();
  const res = await client.query('SELECT * FROM tenants ORDER BY created_at ASC');
  return res.rows.map(row => ({
    id: row.id,
    name: row.name,
    code: row.code,
    logoUrl: row.logo_url || '',
    headerTitle: row.header_title,
    department: row.department || 'Department of Radio-Diagnosis & Imaging',
    address: row.address,
    phone: row.phone,
    email: row.email,
    accreditation: row.accreditation
  }));
}

export async function saveTenantToDb(tenant: HospitalTenant): Promise<HospitalTenant> {
  const client = getDbPool();
  const query = `
    INSERT INTO tenants (id, name, code, logo_url, header_title, department, address, phone, email, accreditation)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      code = EXCLUDED.code,
      logo_url = EXCLUDED.logo_url,
      header_title = EXCLUDED.header_title,
      department = EXCLUDED.department,
      address = EXCLUDED.address,
      phone = EXCLUDED.phone,
      email = EXCLUDED.email,
      accreditation = EXCLUDED.accreditation
    RETURNING *;
  `;
  const values = [
    tenant.id,
    tenant.name,
    tenant.code,
    tenant.logoUrl,
    tenant.headerTitle,
    tenant.department || 'Department of Radio-Diagnosis & Imaging',
    tenant.address,
    tenant.phone,
    tenant.email,
    tenant.accreditation
  ];
  const res = await client.query(query, values);
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    logoUrl: row.logo_url || '',
    headerTitle: row.header_title,
    department: row.department || 'Department of Radio-Diagnosis & Imaging',
    address: row.address,
    phone: row.phone,
    email: row.email,
    accreditation: row.accreditation
  };
}

export async function updateTenantInDb(id: string, updates: Partial<HospitalTenant>): Promise<HospitalTenant> {
  const allTenants = await getTenantsFromDb();
  const existing = allTenants.find(t => t.id === id);
  const fallback: HospitalTenant = existing || {
    id,
    name: updates.name || 'Chakkra Health Facility',
    code: updates.code || 'CHF-01',
    logoUrl: updates.logoUrl || '',
    headerTitle: updates.headerTitle || updates.name || 'Hospital Report Header',
    department: updates.department || 'Department of Radio-Diagnosis & Imaging',
    address: updates.address || '',
    phone: updates.phone || '',
    email: updates.email || '',
    accreditation: updates.accreditation || 'NABH Accredited'
  };
  const merged: HospitalTenant = { ...fallback, ...updates, id };
  return await saveTenantToDb(merged);
}

// ==========================================
// 2. PRACTITIONERS (DOCTORS) CRUD
// ==========================================

export async function getPractitionersFromDb(): Promise<Practitioner[]> {
  const client = getDbPool();
  const res = await client.query('SELECT * FROM practitioners ORDER BY created_at ASC');
  return res.rows.map(row => ({
    id: row.id,
    name: row.name,
    qualification: row.qualification,
    registrationNo: row.registration_no,
    designation: row.designation,
    signatureImage: row.signature_image
  }));
}

export async function createPractitionerInDb(doctor: Partial<Practitioner>): Promise<Practitioner> {
  const client = getDbPool();
  const id = doctor.id || `doc-rad-${Date.now()}`;
  const name = doctor.name || 'Dr. Practitioner';
  const qualification = doctor.qualification || 'MD (Radiodiagnosis)';
  const registrationNo = doctor.registrationNo || `DMC-${Math.floor(10000 + Math.random() * 90000)}`;
  const designation = doctor.designation || 'Consultant Radiologist';
  const signatureImage = doctor.signatureImage || name;

  const query = `
    INSERT INTO practitioners (id, name, qualification, registration_no, designation, signature_image)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      qualification = EXCLUDED.qualification,
      registration_no = EXCLUDED.registration_no,
      designation = EXCLUDED.designation,
      signature_image = EXCLUDED.signature_image
    RETURNING *;
  `;
  const res = await client.query(query, [id, name, qualification, registrationNo, designation, signatureImage]);
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    qualification: row.qualification,
    registrationNo: row.registration_no,
    designation: row.designation,
    signatureImage: row.signature_image
  };
}

export async function updatePractitionerInDb(id: string, updates: Partial<Practitioner>): Promise<Practitioner> {
  const client = getDbPool();
  const existingRes = await client.query('SELECT * FROM practitioners WHERE id = $1', [id]);
  if (existingRes.rows.length === 0) {
    throw new Error(`Practitioner with ID ${id} not found`);
  }
  const existing = existingRes.rows[0];
  const name = updates.name !== undefined ? updates.name : existing.name;
  const qualification = updates.qualification !== undefined ? updates.qualification : existing.qualification;
  const registrationNo = updates.registrationNo !== undefined ? updates.registrationNo : existing.registration_no;
  const designation = updates.designation !== undefined ? updates.designation : existing.designation;
  const signatureImage = updates.signatureImage !== undefined ? updates.signatureImage : existing.signature_image;

  const query = `
    UPDATE practitioners
    SET name = $1, qualification = $2, registration_no = $3, designation = $4, signature_image = $5
    WHERE id = $6
    RETURNING *;
  `;
  const res = await client.query(query, [name, qualification, registrationNo, designation, signatureImage, id]);
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    qualification: row.qualification,
    registrationNo: row.registration_no,
    designation: row.designation,
    signatureImage: row.signature_image
  };
}

export async function deletePractitionerFromDb(id: string): Promise<boolean> {
  const client = getDbPool();
  const res = await client.query('DELETE FROM practitioners WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

// ==========================================
// 3. PATIENTS CRUD
// ==========================================

export async function getPatientsFromDb(): Promise<Patient[]> {
  const client = getDbPool();
  const res = await client.query('SELECT * FROM patients ORDER BY created_at ASC');
  return res.rows.map(row => ({
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    age: row.age,
    gender: row.gender === 'M' ? 'Male' : row.gender === 'F' ? 'Female' : 'Other',
    dob: row.dob ? new Date(row.dob).toISOString().split('T')[0] : undefined,
    phone: row.phone,
    clinicalHistory: row.clinical_history
  }));
}

export async function createPatientInDb(patient: Partial<Patient>): Promise<Patient> {
  const client = getDbPool();
  const id = patient.id || `pat-${Date.now()}`;
  const patientId = patient.patientId || `PAT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const name = patient.name || 'New Patient';
  const age = patient.age !== undefined ? patient.age : 30;
  const gender = patient.gender === 'Male' ? 'M' : patient.gender === 'Female' ? 'F' : 'O';
  const dob = patient.dob ? new Date(patient.dob) : null;
  const phone = patient.phone || '';
  const clinicalHistory = patient.clinicalHistory || '';

  const query = `
    INSERT INTO patients (id, patient_id, name, age, gender, dob, phone, clinical_history)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (id) DO UPDATE SET
      patient_id = EXCLUDED.patient_id,
      name = EXCLUDED.name,
      age = EXCLUDED.age,
      gender = EXCLUDED.gender,
      dob = EXCLUDED.dob,
      phone = EXCLUDED.phone,
      clinical_history = EXCLUDED.clinical_history
    RETURNING *;
  `;
  const res = await client.query(query, [id, patientId, name, age, gender, dob, phone, clinicalHistory]);
  const row = res.rows[0];
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    age: row.age,
    gender: row.gender === 'M' ? 'Male' : row.gender === 'F' ? 'Female' : 'Other',
    dob: row.dob ? new Date(row.dob).toISOString().split('T')[0] : undefined,
    phone: row.phone,
    clinicalHistory: row.clinical_history
  };
}

export async function updatePatientInDb(id: string, updates: Partial<Patient>): Promise<Patient> {
  const client = getDbPool();
  const existingRes = await client.query('SELECT * FROM patients WHERE id = $1', [id]);
  if (existingRes.rows.length === 0) {
    throw new Error(`Patient with ID ${id} not found`);
  }
  const existing = existingRes.rows[0];
  const patientId = updates.patientId !== undefined ? updates.patientId : existing.patient_id;
  const name = updates.name !== undefined ? updates.name : existing.name;
  const age = updates.age !== undefined ? updates.age : existing.age;
  const genderStr = updates.gender !== undefined ? updates.gender : (existing.gender === 'M' ? 'Male' : existing.gender === 'F' ? 'Female' : 'Other');
  const gender = genderStr === 'Male' ? 'M' : genderStr === 'Female' ? 'F' : 'O';
  const dob = updates.dob !== undefined ? (updates.dob ? new Date(updates.dob) : null) : existing.dob;
  const phone = updates.phone !== undefined ? updates.phone : existing.phone;
  const clinicalHistory = updates.clinicalHistory !== undefined ? updates.clinicalHistory : existing.clinical_history;

  const query = `
    UPDATE patients
    SET patient_id = $1, name = $2, age = $3, gender = $4, dob = $5, phone = $6, clinical_history = $7
    WHERE id = $8
    RETURNING *;
  `;
  const res = await client.query(query, [patientId, name, age, gender, dob, phone, clinicalHistory, id]);
  const row = res.rows[0];
  return {
    id: row.id,
    patientId: row.patient_id,
    name: row.name,
    age: row.age,
    gender: row.gender === 'M' ? 'Male' : row.gender === 'F' ? 'Female' : 'Other',
    dob: row.dob ? new Date(row.dob).toISOString().split('T')[0] : undefined,
    phone: row.phone,
    clinicalHistory: row.clinical_history
  };
}

export async function deletePatientFromDb(id: string): Promise<boolean> {
  const client = getDbPool();
  const res = await client.query('DELETE FROM patients WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

// ==========================================
// 4. TEMPLATES CRUD
// ==========================================

export async function getTemplatesFromDb(modality?: string): Promise<TemplateDefinition[]> {
  const client = getDbPool();
  let query = 'SELECT * FROM templates';
  const params: any[] = [];
  if (modality) {
    query += ' WHERE modality = $1';
    params.push(modality.toUpperCase());
  }
  query += ' ORDER BY name ASC';
  const res = await client.query(query, params);
  if (res.rows.length === 0) {
    return RADIOLOGY_TEMPLATES;
  }
  return res.rows.map(row => ({
    id: row.id,
    name: row.name,
    modality: row.modality,
    category: row.category || 'General',
    description: row.description || '',
    fields: typeof row.fields_json === 'string' ? JSON.parse(row.fields_json) : row.fields_json
  }));
}

export async function saveTemplateToDb(tmpl: TemplateDefinition): Promise<TemplateDefinition> {
  const client = getDbPool();
  const query = `
    INSERT INTO templates (id, name, modality, category, description, version, fields_json)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (id) DO UPDATE SET
      name = EXCLUDED.name,
      modality = EXCLUDED.modality,
      category = EXCLUDED.category,
      description = EXCLUDED.description,
      fields_json = EXCLUDED.fields_json
    RETURNING *;
  `;
  const res = await client.query(query, [
    tmpl.id,
    tmpl.name,
    tmpl.modality,
    tmpl.category || 'General',
    tmpl.description || '',
    '1.0',
    JSON.stringify(tmpl.fields)
  ]);
  const row = res.rows[0];
  return {
    id: row.id,
    name: row.name,
    modality: row.modality,
    category: row.category || 'General',
    description: row.description || '',
    fields: typeof row.fields_json === 'string' ? JSON.parse(row.fields_json) : row.fields_json
  };
}

// ==========================================
// 5. CLINICAL DOCUMENTS CRUD
// ==========================================

export async function getDocumentsFromDb(tenantId?: string, patientId?: string, status?: string): Promise<ClinicalDocument[]> {
  const client = getDbPool();
  let query = 'SELECT * FROM clinical_documents WHERE 1=1';
  const params: any[] = [];
  let paramIdx = 1;

  if (tenantId) {
    query += ` AND tenant_id = $${paramIdx++}`;
    params.push(tenantId);
  }
  if (patientId) {
    query += ` AND (patient_id = $${paramIdx} OR patient_json->>'patientId' = $${paramIdx})`;
    paramIdx++;
    params.push(patientId);
  }
  if (status) {
    query += ` AND status = $${paramIdx++}`;
    params.push(status);
  }

  query += ' ORDER BY updated_at DESC';

  const res = await client.query(query, params);
  return res.rows.map(mapRowToDocument);
}

export async function getDocumentByIdFromDb(id: string): Promise<ClinicalDocument | null> {
  const client = getDbPool();
  const res = await client.query('SELECT * FROM clinical_documents WHERE id = $1', [id]);
  if (res.rows.length === 0) return null;
  return mapRowToDocument(res.rows[0]);
}

export async function saveDocumentToDb(doc: ClinicalDocument): Promise<ClinicalDocument> {
  const client = getDbPool();
  const query = `
    INSERT INTO clinical_documents (
      id, tenant_id, patient_id, patient_json, template_id, template_name,
      practitioner_id, practitioner_json, modality, study_date, accession_number,
      referring_physician, status, observations_json, findings_text, impression_text_json,
      ai_results_json, validation_json, digital_signature_json, previous_document_id, version, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, NOW())
    ON CONFLICT (id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id,
      patient_id = EXCLUDED.patient_id,
      patient_json = EXCLUDED.patient_json,
      template_id = EXCLUDED.template_id,
      template_name = EXCLUDED.template_name,
      practitioner_id = EXCLUDED.practitioner_id,
      practitioner_json = EXCLUDED.practitioner_json,
      modality = EXCLUDED.modality,
      study_date = EXCLUDED.study_date,
      accession_number = EXCLUDED.accession_number,
      referring_physician = EXCLUDED.referring_physician,
      status = EXCLUDED.status,
      observations_json = EXCLUDED.observations_json,
      findings_text = EXCLUDED.findings_text,
      impression_text_json = EXCLUDED.impression_text_json,
      ai_results_json = EXCLUDED.ai_results_json,
      validation_json = EXCLUDED.validation_json,
      digital_signature_json = EXCLUDED.digital_signature_json,
      previous_document_id = EXCLUDED.previous_document_id,
      version = EXCLUDED.version,
      updated_at = NOW()
    RETURNING *;
  `;

  const values = [
    doc.id,
    doc.tenantId,
    doc.patient?.id || null,
    JSON.stringify(doc.patient),
    doc.templateId,
    doc.templateName,
    doc.practitioner?.id || null,
    doc.practitioner ? JSON.stringify(doc.practitioner) : null,
    doc.modality,
    doc.studyDate ? new Date(doc.studyDate) : new Date(),
    doc.accessionNumber,
    doc.referringPhysician,
    doc.status,
    JSON.stringify(doc.observations || {}),
    doc.findingsText || '',
    JSON.stringify(doc.impressionText || []),
    doc.aiResults ? JSON.stringify(doc.aiResults) : null,
    doc.validation ? JSON.stringify(doc.validation) : null,
    doc.digitalSignature ? JSON.stringify(doc.digitalSignature) : null,
    doc.previousDocumentId || null,
    doc.version || 1
  ];

  const res = await client.query(query, values);
  return mapRowToDocument(res.rows[0]);
}

export async function deleteDocumentFromDb(id: string): Promise<boolean> {
  const client = getDbPool();
  const res = await client.query('DELETE FROM clinical_documents WHERE id = $1', [id]);
  return (res.rowCount ?? 0) > 0;
}

function mapRowToDocument(row: any): ClinicalDocument {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    patient: typeof row.patient_json === 'string' ? JSON.parse(row.patient_json) : (row.patient_json || SAMPLE_PATIENTS[0]),
    practitioner: typeof row.practitioner_json === 'string' ? JSON.parse(row.practitioner_json) : row.practitioner_json,
    templateId: row.template_id || 'tpl-us-abdomen-01',
    templateName: row.template_name || 'US Whole Abdomen & Pelvis',
    modality: row.modality || 'USG',
    studyDate: row.study_date ? new Date(row.study_date).toISOString() : new Date().toISOString(),
    accessionNumber: row.accession_number,
    referringPhysician: row.referring_physician,
    status: row.status || 'DRAFT',
    observations: typeof row.observations_json === 'string' ? JSON.parse(row.observations_json) : (row.observations_json || {}),
    findingsText: row.findings_text || '',
    impressionText: typeof row.impression_text_json === 'string' ? JSON.parse(row.impression_text_json) : (row.impression_text_json || []),
    aiResults: typeof row.ai_results_json === 'string' ? JSON.parse(row.ai_results_json) : row.ai_results_json,
    validation: typeof row.validation_json === 'string' ? JSON.parse(row.validation_json) : row.validation_json,
    digitalSignature: typeof row.digital_signature_json === 'string' ? JSON.parse(row.digital_signature_json) : row.digital_signature_json,
    previousDocumentId: row.previous_document_id,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date().toISOString(),
    version: row.version || 1
  };
}

// ==========================================
// 6. AUDIT LOGS CRUD
// ==========================================

export async function getAuditLogsFromDb(): Promise<AuditLogEntry[]> {
  const client = getDbPool();
  const res = await client.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 200');
  return res.rows.map(row => ({
    id: row.id,
    documentId: row.document_id || '',
    tenantId: row.tenant_id || 'tenant-xyz-hospital',
    actor: row.actor,
    action: row.action,
    details: row.details,
    timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString()
  }));
}

export async function createAuditLogInDb(log: Partial<AuditLogEntry>): Promise<AuditLogEntry> {
  const client = getDbPool();
  const id = log.id || `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const documentId = log.documentId || null;
  const tenantId = log.tenantId || 'tenant-xyz-hospital';
  const actor = log.actor || 'System API';
  const action = log.action || 'INFO';
  const details = log.details || 'Audit action logged.';

  const query = `
    INSERT INTO audit_logs (id, document_id, tenant_id, actor, action, details, timestamp)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING *;
  `;
  const res = await client.query(query, [id, documentId, tenantId, actor, action, details]);
  const row = res.rows[0];
  return {
    id: row.id,
    documentId: row.document_id || '',
    tenantId: row.tenant_id || 'tenant-xyz-hospital',
    actor: row.actor,
    action: row.action,
    details: row.details,
    timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString()
  };
}

/**
 * Loads clinical documents from PostgreSQL database.
 */
export async function loadDocumentsFromSource(useDb: boolean = true): Promise<ClinicalDocument[]> {
  try {
    const docs = await getDocumentsFromDb();
    if (docs.length > 0) {
      console.log(`🐘 Loaded ${docs.length} clinical document records from PostgreSQL.`);
      return docs;
    }
  } catch (err: any) {
    console.warn('⚠️ Could not load documents from DB:', err.message);
  }
  return [...HISTORICAL_DOCUMENTS];
}
