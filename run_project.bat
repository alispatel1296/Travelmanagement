@echo off
title TransFleet - Smart Transit & Fleet Management
color 0B

echo =========================================================
echo       TransFleet - Smart Transportation Management
echo           5th Sem Full Stack Development Project
echo =========================================================
echo.

echo [1/3] Verifying MySQL Database (Port 3306)...
netstat -ano | findstr :3306 >nul 2>&1
if %errorlevel% neq 0 (
    echo [INFO] MySQL is not running. Launching XAMPP MySQL daemon...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start "" /B "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone >nul 2>&1
    ) else if exist "C:\xampp\mysql_start.bat" (
        start "" /B "C:\xampp\mysql_start.bat" >nul 2>&1
    ) else (
        echo [WARNING] Could not automatically find XAMPP MySQL.
        echo Please open XAMPP Control Panel and click "Start" next to MySQL.
    )
    timeout /t 3 /nobreak >nul
) else (
    echo [OK] MySQL is active and listening on port 3306.
)

echo.
echo [2/3] Launching TransFleet Full-Stack Engine (Port 5000)...
cd /d "%~dp0server"
start "TransFleet Server" node server.js

timeout /t 2 /nobreak >nul
echo.
echo [3/3] Opening TransFleet in your default browser...
start http://localhost:5000

echo.
echo =========================================================
echo  TransFleet is running live at: http://localhost:5000
echo.
echo  Quick Demo Accounts:
echo   - Fleet Admin: admin@transfleet.com (Pass: admin123)
echo   - Driver:      driver.rajesh@transfleet.com (Pass: driver123)
echo   - Passenger:   priya.sharma@gmail.com (Pass: passenger123)
echo =========================================================
echo.
echo Leave this window open while using TransFleet.
echo To stop the server, simply close this window and the server terminal.
echo.
pause
