@echo off
echo ==========================================
echo     Starting Tempus Setup (Windows)     
echo ==========================================
echo.
echo [!] PRE-FLIGHT CHECKS:
echo Before continuing, please ensure you have:
echo   1. Node.js installed
echo   2. PostgreSQL installed and running locally ^(or a cloud DB URL^)
echo   3. A postgres user and password ready
echo.
pause

echo.
echo [1/4] Installing Backend Dependencies...
cd ..\backend
call npm install

echo.
echo [2/4] Checking for .env file...
if not exist .env goto create_env

echo [!] An .env file already exists in app\backend!
set /p OVERWRITE_1="Do you want to overwrite it? (y/N): "
if /I not "%OVERWRITE_1%"=="y" goto skip_env

set /p OVERWRITE_2="Are you SURE? This will delete your current .env! (y/N): "
if /I not "%OVERWRITE_2%"=="y" goto skip_env

set /p OVERWRITE_3="Are you SERIOUSLY sure? There is no undo! (y/N): "
if /I not "%OVERWRITE_3%"=="y" goto skip_env

:create_env
echo Please provide your local PostgreSQL credentials for the .env file.
set /p PG_USER="Enter your PostgreSQL username (default: postgres): "
if "%PG_USER%"=="" set PG_USER=postgres

set /p PG_PASS="Enter your PostgreSQL password (default: password): "
if "%PG_PASS%"=="" set PG_PASS=password

echo DATABASE_URL="postgresql://%PG_USER%:%PG_PASS%@localhost:5432/tempus_db?schema=public" > .env
echo JWT_SECRET="super_secret_local_dev_key_12345" >> .env
echo PORT=5000 >> .env
echo [+] Saved credentials to app\backend\.env.
goto end_env

:skip_env
echo [^>] Skipping .env creation.

:end_env
echo.
echo [3/4] Pushing Database Schema ^& Generating Client...
call npx prisma db push
call npx prisma generate
node prisma\seed.js

echo.
echo [4/4] Installing Frontend Dependencies...
cd ..\frontend-react
call npm install

echo.
echo ==========================================
echo           [ SUCCESS ] Setup Complete!    
echo ==========================================
echo To run the app, please open TWO terminal windows:
echo.
echo Terminal 1 (Backend):
echo   cd ..\backend ^&^& npm run dev
echo.
echo Terminal 2 (Frontend):
echo   cd ..\frontend-react ^&^& npm run dev
echo ==========================================
pause
