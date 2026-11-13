ALTER TABLE app_users ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS role VARCHAR(16) NOT NULL DEFAULT 'user';
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(64);

-- Preserve existing data under the first configured facility so it remains visible after isolation is enabled.
UPDATE patients
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1)
WHERE tenant_id IS NULL;

UPDATE app_users
SET tenant_id = (SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1)
WHERE tenant_id IS NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'app_users_tenant_id_fkey') THEN
    ALTER TABLE app_users ADD CONSTRAINT app_users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'patients_tenant_id_fkey') THEN
    ALTER TABLE patients ADD CONSTRAINT patients_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_patients_tenant ON patients(tenant_id);
