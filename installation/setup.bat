@echo off
echo ==========================================
echo     Starting Tempus Setup (Windows)     
echo ==========================================
echo.
echo [!] PRE-FLIGHT CHECKS:
echo Before continuing, please ensure you have:
echo   1. Node.js installed
echo   2. Either:
echo      - Supabase Session Pooler URL, or
echo      - Local PostgreSQL running with credentials
echo.
pause

set DB_MODE=

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
echo Select database mode:
echo   [1] Supabase (recommended for cloud/production)
echo   [2] Local PostgreSQL (default)
set /p DB_MODE="Choose 1 or 2 (default: 2): "
if "%DB_MODE%"=="" set DB_MODE=2

if "%DB_MODE%"=="1" goto create_env_supabase
if "%DB_MODE%"=="2" goto create_env_local

echo [!] Invalid option. Falling back to Local PostgreSQL.
set DB_MODE=2
goto create_env_local

:create_env_supabase
set /p SUPABASE_URL="Paste your Supabase Session Pooler DATABASE_URL: "
if "%SUPABASE_URL%"=="" (
	echo [!] DATABASE_URL cannot be empty.
	goto create_env_supabase
)
echo DATABASE_URL="%SUPABASE_URL%" > .env
echo JWT_SECRET="super_secret_local_dev_key_12345" >> .env
echo PORT=3000 >> .env
echo [+] Saved Supabase config to app\backend\.env.
goto end_env

:create_env_local
echo Please provide your local PostgreSQL credentials for the .env file.
set /p PG_USER="Enter your PostgreSQL username (default: postgres): "
if "%PG_USER%"=="" set PG_USER=postgres

set /p PG_PASS="Enter your PostgreSQL password (default: password): "
if "%PG_PASS%"=="" set PG_PASS=password

echo DATABASE_URL="postgresql://%PG_USER%:%PG_PASS%@localhost:5432/tempus_db?schema=public" > .env
echo JWT_SECRET="super_secret_local_dev_key_12345" >> .env
echo PORT=3000 >> .env
echo [+] Saved local PostgreSQL config to app\backend\.env.
goto end_env

:skip_env
echo [^>] Skipping .env creation.
findstr /I "supabase.co pooler.supabase.com" .env >nul
if not errorlevel 1 (
	set DB_MODE=1
) else (
	set DB_MODE=2
)

:end_env
echo.
echo [3/4] Applying Database Schema ^& Generating Client...
if "%DB_MODE%"=="1" (
	call npx prisma migrate deploy
) else (
	call npx prisma db push
)
call npx prisma generate
if "%DB_MODE%"=="2" (
	node prisma\seed.js
)

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
