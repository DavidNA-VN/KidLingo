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
```

## Demo Accounts

| Role | Email | Password |
| --- | --- | --- |
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
