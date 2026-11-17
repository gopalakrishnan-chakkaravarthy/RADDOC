CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(64) PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(128) NOT NULL,
  annual_price_usd NUMERIC(12,2) NOT NULL CHECK (annual_price_usd >= 0),
  max_users INTEGER CHECK (max_users IS NULL OR max_users > 0),
  annual_report_limit INTEGER CHECK (annual_report_limit IS NULL OR annual_report_limit > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hospital_subscriptions (
  id VARCHAR(64) PRIMARY KEY,
  tenant_id VARCHAR(64) NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id VARCHAR(64) NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(16) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CANCELLED', 'EXPIRED')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 year'),
  reports_used BIGINT NOT NULL DEFAULT 0 CHECK (reports_used >= 0),
  assigned_by VARCHAR(64) REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_hospital_subscriptions_plan ON hospital_subscriptions(plan_id);

INSERT INTO subscription_plans (id, code, name, annual_price_usd, max_users, annual_report_limit)
VALUES
  ('plan-basic', 'BASIC', 'Basic', 72.00, 1, 3000),
  ('plan-corporate', 'CORPORATE', 'Corporate', 600.00, 10, 3500),
  ('plan-unlimited', 'UNLIMITED', 'Unlimited', 3600.00, NULL, NULL)
ON CONFLICT (code) DO NOTHING;
