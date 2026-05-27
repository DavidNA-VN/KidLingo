BEGIN;

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS teacher_feedback TEXT,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_at ON submissions(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_submissions_reviewed_by ON submissions(reviewed_by);

COMMIT;
