@echo off
cd /d "%~dp0"
if not exist "node_modules\electron\dist\electron.exe" (
  echo Install dependencies with npm install, then run npm start.
  pause
  exit /b 1
)
if not exist "dist\index.html" (
  call npm.cmd run build
  if errorlevel 1 (
    pause
    exit /b 1
  )
)
start "" /D "%~dp0" "%~dp0node_modules\electron\dist\electron.exe" "%~dp0"
