CREATE EXTENSION IF NOT EXISTS pgcrypto;

BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('TEACHER', 'PARENT')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  class_code VARCHAR(30) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(120) NOT NULL,
  birth_year INT,
  avatar_url TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  total_stars INT NOT NULL DEFAULT 0,
  total_coins INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS class_children (
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  PRIMARY KEY (class_id, child_id)
);

CREATE TABLE IF NOT EXISTS lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  title VARCHAR(160) NOT NULL,
  description TEXT,
  vocabulary_items JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  assignment_type VARCHAR(30) NOT NULL DEFAULT 'PDF_ASSIGNMENT',
  title VARCHAR(160) NOT NULL,
  instructions TEXT,
  worksheet_file_url TEXT,
  answer_template_url TEXT,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  due_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'CLOSED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  submission_type VARCHAR(30) NOT NULL DEFAULT 'PDF_ANSWER',
  answer_file_url TEXT,
  target_class VARCHAR(60),
  predicted_class VARCHAR(60),
  confidence NUMERIC(5,4) CHECK (confidence >= 0 AND confidence <= 1),
  is_correct BOOLEAN NOT NULL DEFAULT false,
  top_predictions JSONB,
  canvas_image_url TEXT,
  speech_transcript TEXT,
  speech_passed BOOLEAN NOT NULL DEFAULT false,
  stars_earned INT NOT NULL DEFAULT 0,
  coins_earned INT NOT NULL DEFAULT 0,
  submitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  score NUMERIC(5,2),
  max_score NUMERIC(5,2),
  grading_status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED',
  returned_at TIMESTAMPTZ,
  teacher_feedback TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type VARCHAR(30) NOT NULL DEFAULT 'DIRECT' CHECK (conversation_type IN ('DIRECT', 'CLASS_GROUP')),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  child_id UUID REFERENCES children(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_children_parent_id ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_children_status ON children(status);
CREATE INDEX IF NOT EXISTS idx_class_children_child_id ON class_children(child_id);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON lessons(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lessons_class_id ON lessons(class_id);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_class ON lessons(teacher_id, class_id);
CREATE INDEX IF NOT EXISTS idx_lessons_vocabulary_items ON lessons USING GIN (vocabulary_items);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson_id ON lesson_materials(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_lesson_sort ON lesson_materials(lesson_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_lesson_materials_type ON lesson_materials(type);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_lesson_id ON assignments(lesson_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_type ON assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_submissions_child_id ON submissions(child_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_child_created_at ON submissions(child_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_submissions_grading_status ON submissions(grading_status);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_by ON submissions(graded_by);
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_direct_scope ON conversations(
  teacher_id,
  parent_id,
  COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(child_id, '00000000-0000-0000-0000-000000000000'::uuid)
) WHERE conversation_type = 'DIRECT';
CREATE UNIQUE INDEX IF NOT EXISTS uq_conversations_class_group ON conversations(teacher_id, class_id)
WHERE conversation_type = 'CLASS_GROUP';
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);
CREATE INDEX IF NOT EXISTS idx_conversations_class_id ON conversations(class_id);
CREATE INDEX IF NOT EXISTS idx_conversations_child_id ON conversations(child_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created_at ON messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

COMMIT;
