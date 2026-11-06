@echo off
chcp 65001 >nul
echo ========================================================
echo   CH ACADEMY - KHỞI ĐỘNG POSTGRESQL DATABASE (CỔNG 5432)
echo ========================================================
echo.
cd /d "%~dp0"
echo Dang khoi dong container PostgreSQL 16 qua Docker Compose...
docker compose up -d postgres
if %errorlevel% neq 0 (
    echo.
    echo =====================================================================
    echo [HUONG DAN] Neu gap loi Docker API hoac Docker daemon chua chay:
    echo 1. Hay mo ung dung "Docker Desktop" tu Start Menu cua Windows.
    echo 2. Doi Docker Desktop hien thi icon mau xanh (Engine running).
    echo 3. Chay lai file start-database.bat nay.
    echo =====================================================================
) else (
    echo.
    echo [THANH CONG] Database PostgreSQL da san sang tren cong 5432.
)
echo.
pause
