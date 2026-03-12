@echo off
setlocal

set FRESH=false
if "%~1"=="--fresh" set FRESH=true

if "%FRESH%"=="true" goto :install_root
if not exist "node_modules\" goto :install_root
echo [1/4] Root dependencies already installed (use --fresh to reinstall)
goto :check_frontend

:install_root
echo [1/4] Installing root dependencies...
call npm install --silent

:check_frontend
if "%FRESH%"=="true" goto :install_frontend
if not exist "frontend\node_modules\" goto :install_frontend
echo       Frontend dependencies already installed
goto :start_hardhat

:install_frontend
echo       Installing frontend dependencies...
cd frontend
call npm install --silent
cd ..

:start_hardhat
echo [2/4] Starting Hardhat node in a new window...
start "CarbonX - Hardhat Node" cmd /c "npx hardhat node"

echo       Waiting for Hardhat RPC (waiting 5 seconds)...
timeout /t 5 /nobreak >nul

echo       Deploying CarbonCreditNFT contract...
echo y | call npx hardhat ignition deploy ignition/modules/CarbonCreditNFT.js --network localhost

:start_backend
echo [3/4] Starting backend server in a new window...
start "CarbonX - Backend" cmd /c "node backend\server.js"
timeout /t 3 /nobreak >nul

:start_frontend
echo [4/4] Starting frontend dev server in a new window...
cd frontend
start "CarbonX - Frontend" cmd /c "npm run dev"
cd ..

echo.
echo ========================================
echo   CarbonX Stack Running (Windows)
echo ----------------------------------------
echo   Hardhat  : http://127.0.0.1:8545
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:3000
echo   Health   : http://localhost:5000/api/health
echo ----------------------------------------
echo   Close the opened command prompt windows to stop the servers.
echo ========================================
echo.
pause
