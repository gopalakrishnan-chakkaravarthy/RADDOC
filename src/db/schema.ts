/**
 * Chakkra Clinical Document Intelligence Engine - Database Schema Definition
 * Defines SQL tables, columns, constraints, and TypeScript mappings for persistent storage.
 */

export interface TenantTable {
  id: string; // Primary Key
  name: string;
  code: string;
  logo_url?: string;
  header_title: string;
  department?: string;
  address: string;
  phone: string;
  email: string;
  accreditation: string;
  created_at: string;
}

export interface PractitionerTable {
  id: string; // Primary Key
  name: string;
  qualification: string;
  registration_no: string;
  designation: string;
  signature_image?: string;
  created_at: string;
}

export interface PatientTable {
  id: string; // Primary Key
  patient_id: string; // UHID (Unique Hospital Identifier)
  name: string;
  age: number;
  gender: 'M' | 'F' | 'O';
  dob?: string;
  phone?: string;
  clinical_history?: string;
  created_at: string;
}

export interface TemplateTable {
  id: string; // Primary Key
  name: string;
  modality: 'US' | 'CT' | 'MRI' | 'XRAY';
  category?: string;
  description?: string;
  version: string;
  fields_json: string; // JSON schema of template observation fields
  created_at: string;
}

export interface ClinicalDocumentTable {
  id: string; // Primary Key
  tenant_id: string; // FK -> tenants.id
  patient_id?: string;
  patient_json: string;
  template_id?: string;
  template_name: string;
  practitioner_id?: string;
  practitioner_json?: string;
  modality: string;
  study_date: string;
  accession_number: string;
  referring_physician: string;
  status: 'DRAFT' | 'PRELIMINARY' | 'UNDER_REVIEW' | 'APPROVED' | 'DIGITALLY_SIGNED' | 'COMMITTED';
  observations_json: string; // JSON key-value measurements
  findings_text?: string;
  impression_text_json?: string; // JSON array of impression bullet points
  ai_results_json?: string;
  validation_json?: string;
  digital_signature_json?: string;
  previous_document_id?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLogTable {
  id: string; // Primary Key
  document_id?: string;
  tenant_id: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}

export const SQL_CREATE_TABLES = `
-- 1. Tenants Table
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(64) NOT NULL UNIQUE,
  logo_url TEXT,
  header_title VARCHAR(255) NOT NULL,
  department VARCHAR(255) DEFAULT 'Department of Radio-Diagnosis & Imaging',
  address TEXT NOT NULL,
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(128) NOT NULL,
  accreditation VARCHAR(128) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Practitioners Table
CREATE TABLE IF NOT EXISTS practitioners (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  qualification VARCHAR(255) NOT NULL,
  registration_no VARCHAR(128) NOT NULL UNIQUE,
  designation VARCHAR(255) NOT NULL,
  signature_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Patients Table
CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(64) PRIMARY KEY,
  patient_id VARCHAR(64) NOT NULL UNIQUE, -- UHID
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(10) NOT NULL,
  dob DATE,
  phone VARCHAR(32),
  clinical_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Templates Table
CREATE TABLE IF NOT EXISTS templates (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  modality VARCHAR(16) NOT NULL,
  category VARCHAR(128),
  description TEXT,
  version VARCHAR(32) NOT NULL DEFAULT '1.0',
  fields_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Clinical Documents Table
CREATE TABLE IF NOT EXISTS clinical_documents (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id VARCHAR(64),
  patient_json JSONB NOT NULL,
  template_id VARCHAR(64),
  template_name VARCHAR(255) NOT NULL,
  practitioner_id VARCHAR(64),
  practitioner_json JSONB,
  modality VARCHAR(16) NOT NULL,
  study_date TIMESTAMP WITH TIME ZONE NOT NULL,
  accession_number VARCHAR(64) NOT NULL UNIQUE,
  referring_physician VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  observations_json JSONB DEFAULT '{}'::jsonb,
  findings_text TEXT DEFAULT '',
  impression_text_json JSONB DEFAULT '[]'::jsonb,
  ai_results_json JSONB,
  validation_json JSONB,
  digital_signature_json JSONB,
  previous_document_id VARCHAR(64),
  version INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  document_id VARCHAR(64),
  tenant_id VARCHAR(64) REFERENCES tenants(id),
  actor VARCHAR(255) NOT NULL,
  action VARCHAR(64) NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Fast Query Performance
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON clinical_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_patient ON clinical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON clinical_documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_accession ON clinical_documents(accession_number);
CREATE INDEX IF NOT EXISTS idx_audit_document ON audit_logs(document_id);
`;

console.log("Database Schema loaded successfully.");
