BEGIN;

ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS conversation_type VARCHAR(30) NOT NULL DEFAULT 'DIRECT';

ALTER TABLE conversations
  ALTER COLUMN parent_id DROP NOT NULL;

ALTER TABLE conversations
  DROP CONSTRAINT IF EXISTS conversations_conversation_type_check;

ALTER TABLE conversations
  ADD CONSTRAINT conversations_conversation_type_check
  CHECK (conversation_type IN ('DIRECT', 'CLASS_GROUP'));

DROP INDEX IF EXISTS uq_conversations_scope;
DROP INDEX IF EXISTS uq_conversations_direct_scope;
DROP INDEX IF EXISTS uq_conversations_class_group;

CREATE UNIQUE INDEX uq_conversations_direct_scope ON conversations(
  teacher_id,
  parent_id,
  COALESCE(class_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(child_id, '00000000-0000-0000-0000-000000000000'::uuid)
) WHERE conversation_type = 'DIRECT';

CREATE UNIQUE INDEX uq_conversations_class_group ON conversations(teacher_id, class_id)
WHERE conversation_type = 'CLASS_GROUP';

CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(conversation_type);

COMMIT;
