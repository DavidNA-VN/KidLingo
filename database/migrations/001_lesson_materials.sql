CREATE TABLE IF NOT EXISTS lesson_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('PDF', 'YOUTUBE_VIDEO', 'SPEAKING_PROMPT', 'DOODLE_VOCAB', 'NOTE')),
  title VARCHAR(160) NOT NULL,
  description TEXT,
  file_url TEXT,
  external_url TEXT,
  youtube_video_id VARCHAR(30),
  vocabulary_items JSONB,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson_id ON lesson_materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson_sort ON lesson_materials(lesson_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_type ON lesson_materials(type);
