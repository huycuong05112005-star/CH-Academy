$loginRes = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/auth/login' -Method Post -Body (@{username='admin';password='Admin@123456'} | ConvertTo-Json) -ContentType 'application/json'
$token = $loginRes.data.accessToken

$studentsRes = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/students' -Method Get -Headers @{Authorization="Bearer $token"}
Write-Host "Total students in DB: $($studentsRes.data.totalElements)"
foreach ($s in $studentsRes.data.content) {
    Write-Host "- $($s.studentCode): $($s.fullName) ($($s.targetType), $($s.status)) | Guardians: $($s.guardians.Count)"
}

$guardiansRes = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/guardians/all' -Method Get -Headers @{Authorization="Bearer $token"}
Write-Host "Total guardians in DB: $($guardiansRes.data.Count)"
