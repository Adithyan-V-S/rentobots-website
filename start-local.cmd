@echo off
rem Starts the local database and the website (Windows). Double-click to run.
rem Website: http://localhost:3000   Admin: http://localhost:3000/admin
cd /d "%~dp0"
set "PATH=%~dp0.tools\node;%PATH%"
start "Rentobots DB" cmd /k npm run db
timeout /t 5 /nobreak >nul
start "Rentobots site" cmd /k npm run dev
timeout /t 8 /nobreak >nul
start "" http://localhost:3000/admin
