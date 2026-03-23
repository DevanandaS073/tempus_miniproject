#!/bin/bash
echo "=========================================="
echo "    Starting Tempus Setup (Mac/Linux)     "
echo "=========================================="
echo ""
echo "[!] PRE-FLIGHT CHECKS:"
echo "Before continuing, please ensure you have:"
echo "  1. Node.js installed"
echo "  2. Either:"
echo "     - Supabase Session Pooler URL, or"
echo "     - Local PostgreSQL running with credentials"
echo ""
echo "Press ENTER to continue, or Ctrl+C to cancel..."
read

DB_MODE=""

echo -e "\n[1/4] Installing Backend Dependencies..."
cd ../backend || exit
npm install

echo -e "\n[2/4] Checking for .env file..."
CREATE_ENV="yes"

if [ -f .env ]; then
  CREATE_ENV="no"
  echo "[!] An .env file already exists in app/backend!"
  echo -n "Do you want to overwrite it? (y/N): "
  read OVERWRITE_1
  if [ "$OVERWRITE_1" == "y" ] || [ "$OVERWRITE_1" == "Y" ]; then
    echo -n "Are you SURE? This will delete your current .env! (y/N): "
    read OVERWRITE_2
    if [ "$OVERWRITE_2" == "y" ] || [ "$OVERWRITE_2" == "Y" ]; then
      echo -n "Are you SERIOUSLY sure? There is no undo! (y/N): "
      read OVERWRITE_3
      if [ "$OVERWRITE_3" == "y" ] || [ "$OVERWRITE_3" == "Y" ]; then
        CREATE_ENV="yes"
      fi
    fi
  fi
fi

if [ "$CREATE_ENV" == "yes" ]; then
  echo "Select database mode:"
  echo "  [1] Supabase (recommended for cloud/production)"
  echo "  [2] Local PostgreSQL (default)"
  echo -n "Choose 1 or 2 (default: 2): "
  read DB_MODE
  DB_MODE=${DB_MODE:-2}

  if [ "$DB_MODE" = "1" ]; then
    echo -n "Paste your Supabase Session Pooler DATABASE_URL: "
    read SUPABASE_URL
    while [ -z "$SUPABASE_URL" ]; do
      echo -n "DATABASE_URL cannot be empty. Paste Supabase DATABASE_URL: "
      read SUPABASE_URL
    done

    echo "DATABASE_URL=\"$SUPABASE_URL\"" > .env
    echo "JWT_SECRET=\"super_secret_local_dev_key_12345\"" >> .env
    echo "PORT=3000" >> .env
    echo "[+] Saved Supabase config to app/backend/.env."
  else
    DB_MODE="2"
    echo "Please provide your local PostgreSQL credentials for the .env file."
    echo -n "Enter your PostgreSQL username (default: postgres): "
    read PG_USER
    PG_USER=${PG_USER:-postgres}

    echo -n "Enter your PostgreSQL password (default: password): "
    read -s PG_PASS
    PG_PASS=${PG_PASS:-password}
    echo ""

    echo "DATABASE_URL=\"postgresql://$PG_USER:$PG_PASS@localhost:5432/tempus_db?schema=public\"" > .env
    echo "JWT_SECRET=\"super_secret_local_dev_key_12345\"" >> .env
    echo "PORT=3000" >> .env
    echo "[+] Saved local PostgreSQL config to app/backend/.env."
  fi
else
  echo "[>] Skipping .env creation."
  if grep -qiE "supabase\.co|pooler\.supabase\.com" .env; then
    DB_MODE="1"
  else
    DB_MODE="2"
  fi
fi

echo -e "\n[3/4] Applying Database Schema & Generating Client..."
if [ "$DB_MODE" = "1" ]; then
  npx prisma migrate deploy
else
  npx prisma db push
fi
npx prisma generate
if [ "$DB_MODE" = "2" ]; then
  node prisma/seed.js
fi

echo -e "\n[4/4] Installing Frontend Dependencies..."
cd ../frontend-react || exit
npm install

echo -e "\n=========================================="
echo "          [ SUCCESS ] Setup Complete!     "
echo "=========================================="
echo -e "To run the app, please open TWO terminal windows:\n"
echo "Terminal 1 (Backend):"
echo "  cd ../backend && npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd ../frontend-react && npm run dev"
echo "=========================================="
