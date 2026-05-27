$ErrorActionPreference = "Stop"

$root = Resolve-Path "$PSScriptRoot\.."
Set-Location -Path $root

$ai = Start-Process -FilePath python -ArgumentList @(
  "-m",
  "uvicorn",
  "app.main:app",
  "--app-dir",
  "ai-service",
  "--host",
  "127.0.0.1",
  "--port",
  "8001"
) -WindowStyle Hidden -PassThru

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

Start-Sleep -Seconds 10

try {
  $base = "http://127.0.0.1:8010/api/v1"
  $parent = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body '{"email":"parent@doodle.test","password":"Demo@123456"}'
  $parent2 = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body '{"email":"parent2@doodle.test","password":"Demo@123456"}'
  $teacher = Invoke-RestMethod -Method Post -Uri "$base/auth/login" -ContentType "application/json" -Body '{"email":"teacher@doodle.test","password":"Demo@123456"}'

  $h = @{ Authorization = "Bearer $($parent.access_token)" }
  $hParent2 = @{ Authorization = "Bearer $($parent2.access_token)" }
  $teacherHeaders = @{ Authorization = "Bearer $($teacher.access_token)" }

  $dashboard = Invoke-RestMethod -Uri "$base/parent/dashboard" -Headers $h
  Write-Output "parent-dashboard children=$($dashboard.child_count) submissions=$($dashboard.total_submissions)"

  $childId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1"

  $progress = Invoke-RestMethod -Uri "$base/parent/children/$childId/progress" -Headers $h
  Write-Output "child-progress child=$($progress.display_name) total_submissions=$($progress.total_submissions)"

  $assignmentId = "dddddddd-dddd-dddd-dddd-ddddddddddd1"

  Add-Type -AssemblyName System.Drawing
  $bitmap = New-Object System.Drawing.Bitmap 640, 420
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.Clear([System.Drawing.Color]::White)
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::Black), 14
  $graphics.DrawEllipse($pen, 180, 90, 280, 240)
  $memory = New-Object System.IO.MemoryStream
  $bitmap.Save($memory, [System.Drawing.Imaging.ImageFormat]::Png)
  $image = "data:image/png;base64," + [Convert]::ToBase64String($memory.ToArray())
  $graphics.Dispose()
  $bitmap.Dispose()

  $predictBody = @{
    child_id = $childId
    assignment_id = $assignmentId
    image_data_url = $image
    target_class = "apple"
    top_k = 3
  } | ConvertTo-Json -Compress
  $prediction = Invoke-RestMethod -Method Post -Uri "$base/ai/predict" -Headers $h -ContentType "application/json" -Body $predictBody
  Write-Output "ai-predict predicted=$($prediction.predicted_class) correct=$($prediction.is_correct)"

  $conversationResponse = Invoke-RestMethod -Uri "$base/chat/conversations" -Headers $h
  $conversations = @($conversationResponse)
  if ($conversationResponse.value) {
    $conversations = @($conversationResponse.value)
  }
  Write-Output "parent-conversations=$($conversations.Count)"
  $groupSetupBody = '{"class_id":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2","context_message":"Rainbow class group smoke setup"}'
  $groupConversation = Invoke-RestMethod -Method Post -Uri "$base/chat/class-groups" -Headers $teacherHeaders -ContentType "application/json" -Body $groupSetupBody
  $conversationResponse = Invoke-RestMethod -Uri "$base/chat/conversations" -Headers $h
  $conversations = @($conversationResponse)
  if ($conversationResponse.value) {
    $conversations = @($conversationResponse.value)
  }
  $groupMembers = Invoke-RestMethod -Uri "$base/chat/conversations/$($groupConversation.id)/members" -Headers $h
  if ($groupMembers.members.Count -lt 1) {
    throw "Parent should see active members for an accessible class group"
  }
  Write-Output "parent-group-members=$($groupMembers.members.Count)"
  Invoke-RestMethod -Uri "$base/chat/conversations/$($groupConversation.id)/messages" -Headers $h | Out-Null
  $groupReply = Invoke-RestMethod -Method Post -Uri "$base/chat/conversations/$($groupConversation.id)/messages" -Headers $h -ContentType "application/json" -Body '{"body":"Parent group smoke reply."}'
  Write-Output "parent-group-message-role=$($groupReply.sender_role)"

  try {
    Invoke-RestMethod -Uri "$base/chat/conversations/$($groupConversation.id)/messages" -Headers $hParent2 | Out-Null
    throw "Parent2 should not access Rainbow class group conversation"
  } catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 404) {
      throw
    }
    Write-Output "permission-check=parent2-group-blocked"
  }

  $conversationId = "ffffffff-ffff-ffff-ffff-fffffffffff1"
  $message = Invoke-RestMethod -Method Post -Uri "$base/chat/conversations/$conversationId/messages" -Headers $h -ContentType "application/json" -Body '{"body":"Parent smoke test reply."}'
  Write-Output "parent-chat-message-role=$($message.sender_role)"

  try {
    Invoke-RestMethod -Uri "$base/parent/children/$childId/progress" -Headers $teacherHeaders | Out-Null
    throw "Teacher should not access parent progress API"
  } catch {
    if ($_.Exception.Response.StatusCode.value__ -ne 403) {
      throw
    }
    Write-Output "permission-check=teacher-blocked"
  }
} finally {
  if ($backend -and -not $backend.HasExited) {
    Stop-Process -Id $backend.Id -Force
  }
  if ($ai -and -not $ai.HasExited) {
    Stop-Process -Id $ai.Id -Force
  }
}
