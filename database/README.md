# Database Import

Database name: `doodle_english`

PostgreSQL local port: `5434`

Default PostgreSQL user/password:

```text
postgres / NAMANHh_0212
```

## 1. Create Database

```powershell
psql -h localhost -p 5434 -U postgres -f database/create-database.sql
```

Skip this step if `doodle_english` already exists.

## 2. Import Schema

```powershell
psql -h localhost -p 5434 -U postgres -d doodle_english -f database/schema.sql
```

## 3. Import Seed Data

```powershell
psql -h localhost -p 5434 -U postgres -d doodle_english -f database/seed.sql
```

## Existing Database Migrations

Use these only when applying changes to an older imported database.

```powershell
psql -h localhost -p 5434 -U postgres -d doodle_english -f database/migrations/001_lesson_materials.sql
psql -h localhost -p 5434 -U postgres -d doodle_english -f database/migrations/002_assignment_instructions.sql
psql -h localhost -p 5434 -U postgres -d doodle_english -f database/migrations/003_submission_review.sql
psql -h localhost -p 5434 -U postgres -d doodle_english -f database/migrations/004_teacher_redesign_foundation.sql
psql -h localhost -p 5434 -U postgres -d doodle_english -f database/migrations/005_class_scoped_lessons_pdf_assignments.sql
psql -h localhost -p 5434 -U postgres -d doodle_english -f database/migrations/006_class_group_chat.sql
psql -h localhost -p 5434 -U postgres -d doodle_english -f database/migrations/007_child_profile_fields.sql
psql -h localhost -p 5434 -U postgres -d doodle_english -f database/migrations/008_child_avatar_url.sql
psql -h localhost -p 5434 -U postgres -d doodle_english -f database/migrations/009_admin_role.sql
psql -h localhost -p 5434 -U postgres -d doodle_english -f database/migrations/010_audit_logs.sql
psql -h localhost -p 5434 -U postgres -d doodle_english -f database/migrations/011_audit_explorer_indexes.sql
```

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | `admin@doodle.test` | `Demo@123456` |
| TEACHER | `teacher@doodle.test` | `Demo@123456` |
| TEACHER | `teacher2@doodle.test` | `Demo@123456` |
| PARENT | `parent@doodle.test` | `Demo@123456` |
| PARENT | `parent2@doodle.test` | `Demo@123456` |

## pgAdmin

Create a server connection with:

- Host: `localhost`
- Port: `5434`
- Database: `doodle_english`
- Username: `postgres`
- Password: `NAMANHh_0212`
