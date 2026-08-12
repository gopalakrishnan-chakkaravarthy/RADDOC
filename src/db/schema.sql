-- ============================================================================
-- Chakkra Clinical Intelligence API - Relational Database Schema (PostgreSQL)
-- ============================================================================

-- 1. Tenants Table (Multi-tenant Healthcare Facilities)
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(64) NOT NULL UNIQUE,
  logo_url TEXT,
  header_title VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(64) NOT NULL,
  email VARCHAR(128) NOT NULL,
  accreditation VARCHAR(128) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Practitioners Table (Radiologists, Physicians, Registration Details)
CREATE TABLE IF NOT EXISTS practitioners (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  qualification VARCHAR(255) NOT NULL,
  registration_no VARCHAR(128) NOT NULL UNIQUE,
  designation VARCHAR(255) NOT NULL,
  signature_image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Patients Table (Demographics & UHID)
CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(64) PRIMARY KEY,
  patient_id VARCHAR(64) NOT NULL UNIQUE, -- UHID (Unique Hospital ID)
  name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(10) NOT NULL,
  dob DATE,
  phone VARCHAR(32),
  clinical_history TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Templates Table (Radiology Structured Schema Definitions)
CREATE TABLE IF NOT EXISTS templates (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  modality VARCHAR(16) NOT NULL,
  version VARCHAR(32) NOT NULL,
  fields_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Clinical Documents Table (Radiology Studies & Reports)
CREATE TABLE IF NOT EXISTS clinical_documents (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE CASCADE,
  template_id VARCHAR(64) REFERENCES templates(id),
  practitioner_id VARCHAR(64) REFERENCES practitioners(id),
  modality VARCHAR(16) NOT NULL,
  study_date TIMESTAMP WITH TIME ZONE NOT NULL,
  accession_number VARCHAR(64) NOT NULL UNIQUE,
  referring_physician VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
  observations_json JSONB DEFAULT '{}'::jsonb,
  findings_text TEXT,
  impression_text_json JSONB DEFAULT '[]'::jsonb,
  digital_signature_json JSONB,
  previous_document_id VARCHAR(64),
  version INT DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Audit Logs Table (FHIR & Security Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  document_id VARCHAR(64) REFERENCES clinical_documents(id) ON DELETE CASCADE,
  tenant_id VARCHAR(64) REFERENCES tenants(id),
  actor VARCHAR(255) NOT NULL,
  action VARCHAR(64) NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON clinical_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_patient ON clinical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON clinical_documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_accession ON clinical_documents(accession_number);
CREATE INDEX IF NOT EXISTS idx_audit_document ON audit_logs(document_id);
