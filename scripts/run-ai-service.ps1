$ErrorActionPreference = "Stop"

Set-Location -Path (Resolve-Path "$PSScriptRoot\..")

python -m uvicorn app.main:app --app-dir ai-service --host 127.0.0.1 --port 8001
