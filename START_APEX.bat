@echo off
title APEX INTELLIGENCE OS LAUNCHER

echo ===================================================
echo   INITIALIZING APEX TRADE AI V8 - INSTITUTIONAL OS
echo ===================================================
echo.
echo [1] Launching AI Prediction Daemon (Hidden)...
start /b /min python tools\production\daemon.py --no-mt5 > logs\daemon_log.txt 2>&1

echo [2] Starting Next.js Terminal Dashboard...
cd web-dashboard
start /b npm run dev:safe

echo [3] Awaiting Webpack compilation (10s)...
timeout /t 10 /nobreak > nul

echo [4] Engaging Uplink...
start http://localhost:3000

echo ===================================================
echo   SYSTEM ONLINE. YOU MAY MINIMIZE THIS WINDOW.
echo ===================================================
pause
