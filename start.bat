@echo off
title ARSH MAKEUP ARTIST DELHI - LUXURY STUDIO SERVER
cd /d "%~dp0"
echo ===================================================================
echo     ARSH MAKEUP ARTIST DELHI - LUXURY BRIDAL WEB & CMS
echo ===================================================================
echo.
echo [1] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found in PATH!
    echo Trying Program Files default location...
    if exist "C:\Program Files\nodejs\node.exe" (
        set PATH=%PATH%;C:\Program Files\nodejs
    ) else (
        echo Please install Node.js from https://nodejs.org
        pause
        exit /b 1
    )
)

echo [2] Starting Studio Express Server...
echo.
echo *******************************************************************
echo   Client Luxury Website: http://localhost:3000
echo   Admin CMS Dashboard:   http://localhost:3000/admin
echo   Default Admin Key:     arsh@2026 (changeable in admin panel)
echo   Cloudinary Cloud:      gdkzinnv (Verified & Active)
echo *******************************************************************
echo.

start http://localhost:3000
node server.js
pause
