@echo off
chcp 65001 >nul
echo ========================================================
echo   CH ACADEMY - KHỞI ĐỘNG TOÀN BỘ HỆ THỐNG
echo ========================================================
echo.
echo [1/3] Khoi dong Database PostgreSQL...
call start-database.bat

echo.
echo [2/3] Mo cua so Backend Spring Boot...
start "CH Academy Backend (Port 8088)" cmd /c "%~dp0start-backend.bat"

echo.
echo [3/3] Mo cua so Frontend Vite...
start "CH Academy Frontend (Port 5173)" cmd /c "%~dp0start-frontend.bat"

echo.
echo ========================================================
echo   HE THONG DANG KHOI DONG TRONG CAC CUA SO RIENG BIET:
echo   - Frontend: http://localhost:5173
echo   - Backend : http://localhost:8088
echo ========================================================
pause
