$res = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/auth/login' -Method Post -Body (@{username='admin';password='Admin@123456'} | ConvertTo-Json) -ContentType 'application/json'
$token = $res.data.accessToken
Write-Host "Login success: $($res.success), User: $($res.data.user.username)"

$headers = @{Authorization = "Bearer $token"}
$me = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/auth/me' -Method Get -Headers $headers
Write-Host "GET /me success: $($me.success), FullName: $($me.data.fullName)"
