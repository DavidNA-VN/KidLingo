# Backend

FastAPI backend for business APIs:

- Authentication and role-based access.
- Class, child profile, lesson and assignment management.
- Submission history and reward calculation.
- Teacher and parent dashboards.
- Realtime chat WebSocket.

Planned structure:

```text
app/
  api/
  core/
  models/
  repositories/
  schemas/
  services/
  ws/
```

## Local Run

Install dependencies:

```powershell
python -m pip install -r backend/requirements.txt
```

Run API:

```powershell
python -m uvicorn app.main:app --reload --app-dir backend --host 127.0.0.1 --port 8000
```

Health checks:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
Invoke-RestMethod http://127.0.0.1:8000/health/db
```
