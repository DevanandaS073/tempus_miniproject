#!/bin/bash
echo "=========================================="
echo "    Starting Tempus Setup (Mac/Linux)     "
echo "=========================================="
echo ""
echo "[!] PRE-FLIGHT CHECKS:"
echo "Before continuing, please ensure you have:"
echo "  1. Node.js installed"
echo "  2. PostgreSQL installed and running locally (or a cloud DB URL)"
echo "  3. A postgres user and password ready"
echo ""
echo "Press ENTER to continue, or Ctrl+C to cancel..."
read

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
  echo "PORT=5000" >> .env
  echo "[+] Saved credentials to app/backend/.env."
else
  echo "[>] Skipping .env creation."
fi

echo -e "\n[3/4] Pushing Database Schema..."
npx prisma db push

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
