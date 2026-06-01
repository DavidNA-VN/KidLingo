BEGIN;

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email VARCHAR(255),
  actor_role VARCHAR(20),
  action VARCHAR(120) NOT NULL,
  category VARCHAR(40) NOT NULL DEFAULT 'BUSINESS',
  result VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
  risk_level VARCHAR(20) NOT NULL DEFAULT 'LOW' CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  resource_type VARCHAR(80),
  resource_id VARCHAR(120),
  request_id VARCHAR(120),
  ip_address VARCHAR(80),
  user_agent TEXT,
  http_method VARCHAR(12),
  request_path TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_occurred_at ON audit_logs(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_occurred_at ON audit_logs(risk_level, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_occurred_at ON audit_logs(actor_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_role_occurred_at ON audit_logs(actor_role, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_occurred_at ON audit_logs(action, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category_occurred_at ON audit_logs(category, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_result_occurred_at ON audit_logs(result, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_request_id ON audit_logs(request_id);

COMMIT;
