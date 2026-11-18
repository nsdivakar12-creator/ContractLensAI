@echo off
setlocal
cd /d "%~dp0"
echo.
echo  CONTRACTLENS AI - PREMIUM EDITION
 echo -----------------------------------
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 20 or later is required.
  echo Install it from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)
for /f "tokens=1" %%v in ('node -p "process.versions.node.split('.')[0]"') do set NODE_MAJOR=%%v
if %NODE_MAJOR% LSS 20 (
  echo Please upgrade to Node.js 20 or later.
  pause
  exit /b 1
)
start "ContractLens AI Browser" cmd /c "timeout /t 2 >nul & start http://127.0.0.1:3000"
echo Starting local server at http://127.0.0.1:3000
 echo Keep this window open while using ContractLens AI.
node backend\server.js
pause
