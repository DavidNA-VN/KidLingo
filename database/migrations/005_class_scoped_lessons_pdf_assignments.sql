BEGIN;

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

UPDATE lessons
SET class_id = classes.id
FROM classes
WHERE lessons.class_id IS NULL
  AND classes.teacher_id = lessons.teacher_id
  AND classes.id = (
    SELECT c.id
    FROM classes c
    WHERE c.teacher_id = lessons.teacher_id
    ORDER BY c.created_at ASC
    LIMIT 1
  );

CREATE INDEX IF NOT EXISTS idx_lessons_class_id ON lessons(class_id);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_class ON lessons(teacher_id, class_id);

COMMIT;
