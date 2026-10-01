@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
if not exist "..\.venv\Scripts\python.exe" (
  echo The local Python runtime is missing. Run the project setup first.
  pause
  exit /b 1
)
"..\.venv\Scripts\python.exe" -u dev_server.py 8270
if errorlevel 1 (
  echo Local website startup failed. The error is shown above.
  pause
)
