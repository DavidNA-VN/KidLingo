# Frontend

React + TypeScript + Vite frontend for Doodle English Classroom.

## Local Run

```powershell
cd frontend
npm install
npm run dev
```

Default URL: `http://127.0.0.1:5173`.

## Build

```powershell
cd frontend
npm run build
```

The app reads API base URL from:

```text
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

## Current UI Scope

- Teacher workspace: overview, classes, lessons/materials, assignments, submissions, chat.
- Parent workspace: child profiles, join class, assignments, progress, chat.
- Child learning session: PDF/video/note preview, doodle vocabulary game, TTS/STT, submission/reward.
