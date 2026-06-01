BEGIN;

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('TEACHER', 'PARENT', 'ADMIN'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_single_admin
  ON users(role)
  WHERE role = 'ADMIN';

COMMIT;
