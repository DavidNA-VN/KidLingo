$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\.."
Set-Location -Path $root

$backend = Start-Process -FilePath python -ArgumentList @(
  "-m",
  "uvicorn",
  "app.main:app",
  "--app-dir",
  "backend",
  "--host",
  "127.0.0.1",
  "--port",
  "8010"
) -WindowStyle Hidden -PassThru

Start-Sleep -Seconds 3

try {
  $base = "http://127.0.0.1:8010/api/v1"
  $admin = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body '{"email":"admin@doodle.test","password":"Demo@123456"}'
  $teacher = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body '{"email":"teacher@doodle.test","password":"Demo@123456"}'
  $parent = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body '{"email":"parent@doodle.test","password":"Demo@123456"}'

  $adminHeaders = @{ Authorization = "Bearer $($admin.access_token)" }
  $teacherHeaders = @{ Authorization = "Bearer $($teacher.access_token)" }
  $parentHeaders = @{ Authorization = "Bearer $($parent.access_token)" }

  $status = Invoke-RestMethod -Uri "$base/admin/status" -Headers $adminHeaders
  Write-Output "admin-status=$($status.status) email=$($status.admin_email)"

  $dashboard = Invoke-RestMethod -Uri "$base/admin/dashboard?days=7" -Headers $adminHeaders
  if ($dashboard.metrics.Count -lt 8 -or $dashboard.activity_trend.Count -ne 7 -or $dashboard.risk_distribution.Count -ne 3) {
    throw "Admin dashboard read model is incomplete"
  }
  Write-Output "dashboard-metrics=$($dashboard.metrics.Count) trend-days=$($dashboard.activity_trend.Count) timeline=$($dashboard.timeline.Count)"

  $audit = Invoke-RestMethod -Uri "$base/admin/audit-logs?page=1&page_size=5&risk_level=MEDIUM" -Headers $adminHeaders
  Write-Output "audit-page=$($audit.page) items=$($audit.items.Count) total=$($audit.total)"

  $actorAudit = Invoke-RestMethod -Uri "$base/admin/audit-logs?page=1&page_size=5&actor_query=admin%40doodle.test&actor_role=ADMIN" -Headers $adminHeaders
  if ($actorAudit.total -lt 1) {
    throw "Expected actor email filter results"
  }
  Write-Output "audit-actor-filter=$($actorAudit.total)"

  $related = Invoke-RestMethod -Uri "$base/admin/audit-logs/$($audit.items[0].id)/related" -Headers $adminHeaders
  if (@($related).Count -lt 1) {
    throw "Expected related audit events"
  }
  Write-Output "audit-related=$(@($related).Count)"

  try {
    Invoke-RestMethod -Uri "$base/admin/audit-logs?date_from=2026-06-03T00:00:00Z&date_to=2026-06-01T00:00:00Z" -Headers $adminHeaders | Out-Null
    throw "Invalid audit date range should be rejected"
  } catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 400) {
      throw
    }
    Write-Output "audit-date-validation=blocked"
  }

  for ($attempt = 1; $attempt -le 3; $attempt++) {
    try {
      Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body '{"email":"smoke-suspicious@doodle.test","password":"wrong-password"}' | Out-Null
      throw "Invalid credentials should be rejected"
    } catch {
      if ($_.Exception.Response.StatusCode.value__ -ne 401) {
        throw
      }
    }
  }
  Write-Output "failed-login-burst=recorded"

  try {
    Invoke-RestMethod -Uri "$base/admin/audit-logs?risk_level=CRITICAL" -Headers $adminHeaders | Out-Null
    throw "Invalid audit risk should be rejected"
  } catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 400) {
      throw
    }
    Write-Output "audit-risk-validation=blocked"
  }

  foreach ($testCase in @(
    @{ Name = "teacher"; Headers = $teacherHeaders },
    @{ Name = "parent"; Headers = $parentHeaders }
  )) {
    try {
      Invoke-RestMethod -Uri "$base/admin/status" -Headers $testCase.Headers | Out-Null
      throw "$($testCase.Name) should not access admin endpoint"
    } catch {
      if ($_.Exception.Response.StatusCode.value__ -ne 403) {
        throw
      }
      Write-Output "admin-permission=$($testCase.Name)-blocked"
    }
    try {
      Invoke-RestMethod -Uri "$base/admin/audit-logs" -Headers $testCase.Headers | Out-Null
      throw "$($testCase.Name) should not access audit timeline"
    } catch {
      if ($_.Exception.Response.StatusCode.value__ -ne 403) {
        throw
      }
      Write-Output "audit-permission=$($testCase.Name)-blocked"
    }
    try {
      Invoke-RestMethod -Uri "$base/admin/suspicious-activities" -Headers $testCase.Headers | Out-Null
      throw "$($testCase.Name) should not access suspicious activities"
    } catch {
      if ($_.Exception.Response.StatusCode.value__ -ne 403) {
        throw
      }
      Write-Output "suspicious-permission=$($testCase.Name)-blocked"
    }
    try {
      Invoke-RestMethod -Uri "$base/admin/dashboard" -Headers $testCase.Headers | Out-Null
      throw "$($testCase.Name) should not access admin dashboard"
    } catch {
      if ($_.Exception.Response.StatusCode.value__ -ne 403) {
        throw
      }
      Write-Output "dashboard-permission=$($testCase.Name)-blocked"
    }
  }

  $alertsResponse = Invoke-RestMethod -Uri "$base/admin/suspicious-activities?minutes=60" -Headers $adminHeaders
  $alerts = @($alertsResponse | ForEach-Object { $_ })
  if ($alerts.Count -lt 1) {
    throw "Expected suspicious activity alerts"
  }
  $loginAlert = $alerts | Where-Object { $_.reason -eq "MULTIPLE_LOGIN_FAILURES" } | Select-Object -First 1
  if (-not $loginAlert) {
    throw "Expected multiple login failures alert"
  }
  Write-Output "suspicious-alerts=$($alerts.Count) login-alert-count=$($loginAlert.event_count)"

  try {
    Invoke-RestMethod -Method Post -Uri "$base/auth/register" -ContentType "application/json" -Body '{"email":"second-admin@doodle.test","password":"Demo@123456","full_name":"Second Admin","role":"ADMIN"}' | Out-Null
    throw "Public register should not create an admin"
  } catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 400) {
      throw
    }
    Write-Output "admin-register=blocked"
  }
} finally {
  if ($backend -and -not $backend.HasExited) {
    Stop-Process -Id $backend.Id -Force
  }
}
