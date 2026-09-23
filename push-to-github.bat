@echo off
title Push ARSH MAKEUP ARTIST to GitHub (Public0Gamer)
cd /d "%~dp0"

echo ===================================================================
echo   Pushing code to: https://github.com/Public0Gamer/arsh-makeup-artist
echo ===================================================================
echo.
echo [NOTE] Make sure you have created the empty repository:
echo        'arsh-makeup-artist' on https://github.com/Public0Gamer
echo.
echo Pushing now...
"C:\Program Files\Git\cmd\git.exe" push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ===================================================================
    echo [SUCCESS] Code pushed successfully to GitHub!
    echo Now open Render.com to deploy it for 100%% Free.
    echo ===================================================================
) else (
    echo [ERROR] Push failed. If GitHub asks for login/token, please authenticate.
)
pause
