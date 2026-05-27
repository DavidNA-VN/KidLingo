BEGIN;

ALTER TABLE assignments
  ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(30) NOT NULL DEFAULT 'PDF_ASSIGNMENT',
  ADD COLUMN IF NOT EXISTS worksheet_file_url TEXT,
  ADD COLUMN IF NOT EXISTS answer_template_url TEXT,
  ADD COLUMN IF NOT EXISTS max_score NUMERIC(5,2) NOT NULL DEFAULT 10.00;

ALTER TABLE assignments
  DROP CONSTRAINT IF EXISTS assignments_class_id_lesson_id_key;

ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS submission_type VARCHAR(30) NOT NULL DEFAULT 'PDF_ANSWER',
  ADD COLUMN IF NOT EXISTS answer_file_url TEXT,
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS max_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS grading_status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
  ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;

UPDATE submissions
SET
  submission_type = CASE
    WHEN canvas_image_url IS NOT NULL OR predicted_class IS NOT NULL THEN 'DOODLE_ATTEMPT'
    WHEN speech_transcript IS NOT NULL THEN 'PRONUNCIATION_ATTEMPT'
    ELSE submission_type
  END,
  submitted_at = COALESCE(submitted_at, created_at),
  grading_status = CASE
    WHEN canvas_image_url IS NOT NULL OR predicted_class IS NOT NULL OR speech_transcript IS NOT NULL THEN 'NOT_REQUIRED'
    ELSE grading_status
  END
WHERE submitted_at IS NULL OR grading_status = 'SUBMITTED';

ALTER TABLE submissions
  ALTER COLUMN predicted_class DROP NOT NULL,
  ALTER COLUMN confidence DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_assignments_type ON assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_submissions_grading_status ON submissions(grading_status);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_by ON submissions(graded_by);

COMMIT;
