$publicLead = @{
    fullName = 'Trần Văn Khảo Sát'
    phone = '0988665544'
    email = 'khaosat@gmail.com'
    notes = 'Muốn tìm hiểu lớp lập trình cho con 10 tuổi'
} | ConvertTo-Json

Write-Host "--- 1. Testing POST /api/v1/public/leads ---"
$resPublic = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/public/leads' -Method POST -Body $publicLead -ContentType 'application/json'
Write-Host "Public Lead Success:" $resPublic.success
Write-Host "Created Lead:" $resPublic.data.leadCode $resPublic.data.fullName $resPublic.data.status

Write-Host "--- 2. Testing Authenticated GET /api/v1/leads ---"
$loginBody = @{ username = 'admin'; password = 'password' } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/auth/login' -Method POST -Body $loginBody -ContentType 'application/json'
$token = $loginRes.data.accessToken
$headers = @{ Authorization = "Bearer $token" }

$leadsRes = Invoke-RestMethod -Uri 'http://localhost:8088/api/v1/leads' -Headers $headers
Write-Host "Leads Total Elements:" $leadsRes.data.totalElements
foreach ($l in $leadsRes.data.content) {
    Write-Host "Lead:" $l.leadCode "-" $l.fullName "- Status:" $l.status "- Source:" $l.source
}
