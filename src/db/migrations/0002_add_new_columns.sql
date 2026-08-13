-- ============================================================================
-- Migration 0002: ALTER TABLE Scripts for Newly Added Columns & Enhancements
-- Database Target: PostgreSQL / Supabase
-- ============================================================================

-- 1. Tenants Table (Hospital Details): Add department column
ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS department VARCHAR(255) DEFAULT 'Department of Radio-Diagnosis & Imaging';

-- 2. Templates Table (Radiology Schemas): Add category and description columns
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS category VARCHAR(128) DEFAULT 'General Radiology';

ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- 3. Clinical Documents Table (Radiology Reports): Add JSONB snapshot columns
ALTER TABLE clinical_documents 
ADD COLUMN IF NOT EXISTS patient_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE clinical_documents 
ADD COLUMN IF NOT EXISTS practitioner_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE clinical_documents 
ADD COLUMN IF NOT EXISTS ai_results_json JSONB DEFAULT '{}'::jsonb;

ALTER TABLE clinical_documents 
ADD COLUMN IF NOT EXISTS validation_json JSONB DEFAULT '{}'::jsonb;

-- Set default empty string for findings_text
ALTER TABLE clinical_documents 
ALTER COLUMN findings_text SET DEFAULT '';

-- 4. Foreign Key Adjustments (Allows decoupled patient snapshots & audit trails)
ALTER TABLE clinical_documents 
DROP CONSTRAINT IF EXISTS clinical_documents_patient_id_fkey;

ALTER TABLE clinical_documents 
DROP CONSTRAINT IF EXISTS clinical_documents_template_id_fkey;

ALTER TABLE clinical_documents 
DROP CONSTRAINT IF EXISTS clinical_documents_practitioner_id_fkey;

ALTER TABLE audit_logs 
DROP CONSTRAINT IF EXISTS audit_logs_document_id_fkey;
