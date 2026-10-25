$loginRes = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/auth/login' -Method Post -Body (@{username='admin';password='Admin@123456'} | ConvertTo-Json) -ContentType 'application/json'
$token = $loginRes.data.accessToken

$coursesRes = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/courses' -Method Get -Headers @{Authorization="Bearer $token"}
Write-Host "Admin courses fetched: $($coursesRes.data.content.Count) items"

$categoriesRes = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/course-categories' -Method Get -Headers @{Authorization="Bearer $token"}
Write-Host "Categories fetched: $($categoriesRes.data.Count) items"
