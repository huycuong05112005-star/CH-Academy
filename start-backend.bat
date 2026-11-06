@echo off
chcp 65001 >nul
echo ========================================================
echo   CH ACADEMY - KHỞI ĐỘNG BACKEND SPRING BOOT (CỔNG 8088)
echo ========================================================
echo.
cd /d "%~dp0backend"
echo [1/2] Kiem tra ket noi Database PostgreSQL 5432...
powershell -Command "if (!(Test-NetConnection -ComputerName localhost -Port 5432 -InformationLevel Quiet -WarningAction SilentlyContinue)) { Write-Host '[CANH BAO] PostgreSQL 5432 chua bat. Vui long bat Docker Desktop hoac chay start-database.bat truoc!' -ForegroundColor Yellow } else { Write-Host '[OK] Database PostgreSQL 5432 da san sang.' -ForegroundColor Green }"
echo.
echo [2/2] Dang chay Spring Boot...
call mvnw.cmd spring-boot:run
pause
