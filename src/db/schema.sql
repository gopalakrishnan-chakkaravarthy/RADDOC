-- ============================================================================
-- Chakkra Clinical Intelligence API - Relational Database Schema (PostgreSQL)
-- ============================================================================

CREATE TABLE IF NOT EXISTS app_users (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  tenant_id VARCHAR(64),
  role VARCHAR(16) NOT NULL DEFAULT 'user',
  session_version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 1. Tenants Table (Multi-tenant Healthcare Facilities)
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
  tenant_id VARCHAR(64),
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
  category VARCHAR(128),
  description TEXT,
  version VARCHAR(32) NOT NULL DEFAULT '1.0',
  fields_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Clinical Documents Table (Radiology Studies & Reports)
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

-- 6. Audit Logs Table (FHIR & Security Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  document_id VARCHAR(64),
  tenant_id VARCHAR(64) REFERENCES tenants(id),
  actor VARCHAR(255) NOT NULL,
  action VARCHAR(64) NOT NULL,
  details TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
  id VARCHAR(64) PRIMARY KEY,
  invoice_number VARCHAR(64) NOT NULL UNIQUE,
  document_id VARCHAR(64) NOT NULL UNIQUE,
  tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id VARCHAR(64),
  patient_name VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(32),
  diagnostic_type VARCHAR(255) NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Performance & Lookup Indexes
CREATE INDEX IF NOT EXISTS idx_documents_tenant ON clinical_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_patient ON clinical_documents(patient_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON clinical_documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_accession ON clinical_documents(accession_number);
CREATE INDEX IF NOT EXISTS idx_audit_document ON audit_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_patient ON invoices(patient_id);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS role VARCHAR(16) NOT NULL DEFAULT 'user';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
UPDATE patients SET tenant_id = (SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1) WHERE tenant_id IS NULL;
UPDATE app_users SET tenant_id = (SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1) WHERE tenant_id IS NULL;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_users_tenant_id_fkey') THEN
    ALTER TABLE app_users ADD CONSTRAINT app_users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patients_tenant_id_fkey') THEN
    ALTER TABLE patients ADD CONSTRAINT patients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_patients_tenant ON patients(tenant_id);

