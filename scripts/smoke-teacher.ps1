$ErrorActionPreference = "Stop"

$backend = Start-Process -FilePath python -ArgumentList @(
  "-m",
  "uvicorn",
  "app.main:app",
  "--app-dir",
  "backend",
  "--host",
  "127.0.0.1",
  "--port",
  "8000"
) -WindowStyle Hidden -PassThru

Start-Sleep -Seconds 3

try {
  $teacher = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/auth/login" -ContentType "application/json" -Body '{"email":"teacher@doodle.test","password":"Demo@123456"}'
  $teacher2 = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/auth/login" -ContentType "application/json" -Body '{"email":"teacher2@doodle.test","password":"Demo@123456"}'

  $h = @{ Authorization = "Bearer $($teacher.access_token)" }
  $h2 = @{ Authorization = "Bearer $($teacher2.access_token)" }

  $overview = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/teacher/dashboard" -Headers $h
  Write-Output "overview classes=$($overview.summary.class_count) students=$($overview.summary.active_child_count) review=$($overview.summary.review_submission_count)"

  $classBody = @{
    name = "Smoke Auto Code $(Get-Date -Format 'yyyyMMddHHmmss')"
    description = "Class created without a class_code payload."
  } | ConvertTo-Json -Compress
  $createdClass = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/teacher/classes" -Headers $h -ContentType "application/json" -Body $classBody
  if (-not $createdClass.class_code) {
    throw "Class code should be generated automatically"
  }
  Write-Output "auto-class-code=$($createdClass.class_code)"

  $assignments = @(Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/teacher/assignments" -Headers $h)
  Write-Output "assignments=$($assignments.Count)"

  $lessonResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/lessons?class_id=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1" -Headers $h
  $lessonOptions = @($lessonResponse)
  if ($lessonResponse.value) {
    $lessonOptions = @($lessonResponse.value)
  }
  if ($lessonOptions.Count -lt 1) {
    throw "Expected at least one lesson for assignment dropdown smoke"
  }
  $lessonId = [string]($lessonOptions | ForEach-Object { $_.id } | Where-Object { $_ } | Select-Object -First 1)
  if (-not $lessonId) {
    $lessonId = "cccccccc-cccc-cccc-cccc-ccccccccccc1"
  }
  $assignmentBody = @{
    class_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1"
    lesson_id = $lessonId
    title = "Smoke PDF assignment $(Get-Date -Format 'yyyyMMddHHmmss')"
    instructions = "Created from a class-scoped lesson dropdown smoke."
    assignment_type = "PDF_ASSIGNMENT"
    max_score = 10
    due_at = (Get-Date).AddDays(3).ToString("o")
    status = "DRAFT"
  } | ConvertTo-Json -Compress
  $createdAssignment = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/assignments" -Headers $h -ContentType "application/json" -Body $assignmentBody
  Write-Output "created-assignment=$($createdAssignment.id) lesson=$($createdAssignment.lesson_title)"

  $submissions = @(Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/teacher/submissions?reviewed=false" -Headers $h)
  Write-Output "unreviewed-submissions=$($submissions.Count)"

  $conversationResponse = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/chat/conversations" -Headers $h
  $conversations = @($conversationResponse)
  if ($conversationResponse.value) {
    $conversations = @($conversationResponse.value)
  }
  Write-Output "conversations=$($conversations.Count)"

  $groupBody = '{"class_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1","context_message":"Smoke test class group"}'
  $groupConversation = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/chat/class-groups" -Headers $h -ContentType "application/json" -Body $groupBody
  $groupMembers = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/chat/conversations/$($groupConversation.id)/members" -Headers $h
  if ($groupMembers.members.Count -lt 1) {
    throw "Class group should expose active class members"
  }
  Write-Output "group-members=$($groupMembers.members.Count)"
  $groupMessage = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/chat/conversations/$($groupConversation.id)/messages" -Headers $h -ContentType "application/json" -Body '{"body":"Smoke test group message"}'
  Write-Output "group-chat-message=$($groupMessage.body)"

  $body = '{"parent_id":"33333333-3333-3333-3333-333333333333","class_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1","child_id":"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1","context_message":"Smoke test teacher workflow"}'
  $conversation = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/chat/conversations" -Headers $h -ContentType "application/json" -Body $body
  $message = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/api/v1/chat/conversations/$($conversation.id)/messages" -Headers $h -ContentType "application/json" -Body '{"body":"Smoke test message"}'
  Write-Output "chat-message=$($message.body)"

  try {
    Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/v1/chat/conversations/$($conversation.id)/messages" -Headers $h2 | Out-Null
    throw "Teacher2 should not access teacher1 conversation"
  } catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 404) {
      throw
    }
    Write-Output "permission-check=teacher2-blocked"
  }
} finally {
  if ($backend -and -not $backend.HasExited) {
    Stop-Process -Id $backend.Id -Force
  }
}
