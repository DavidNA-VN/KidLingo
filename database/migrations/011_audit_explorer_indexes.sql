BEGIN;

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_email_occurred_at
  ON audit_logs(actor_email, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_occurred_at
  ON audit_logs(resource_type, occurred_at DESC);

COMMIT;
