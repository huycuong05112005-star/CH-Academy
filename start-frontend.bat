@echo off
chcp 65001 >nul
echo ========================================================
echo   CH ACADEMY - KHỞI ĐỘNG FRONTEND REACT VITE (CỔNG 5173)
echo ========================================================
echo.
cd /d "%~dp0frontend"
echo Dang chay may chu phat trien Frontend...
call npm run dev
pause

