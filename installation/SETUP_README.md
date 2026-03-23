# Tempus Application Setup Guide

Welcome to the Tempus Project. This guide outlines the prerequisites necessary before running the automated setup scripts.

## Prerequisites

Before starting the setup process, ensure your local development environment has the following installed:

1. **Node.js** (v18 or higher recommended)
   - You can download it from [Nodejs.org](https://nodejs.org/).
   - Verify installation by running `node -v` in your terminal.

2. **PostgreSQL** (running locally)
   - Download the installer from the [PostgreSQL Official Website](https://www.postgresql.org/download/).
   - Take note of your root `postgres` password during installation.
   - **Important:** The setup script will ask for a PostgreSQL username and password. You can either use the default `postgres` superuser, or manually create a dedicated user (e.g., `tempus_user`) in your local database before running the script.
   - *(Optional Alternative)*: You can use a cloud database like Render or Supabase instead of a local Postgres server.

3. **Git**
   - Download from [Git-SCM](https://git-scm.com/).

---

## Running the Automated Setup

Once you have cloned this repository and ensured the prerequisites are met, use the automated scripts provided to install dependencies, generate your `.env` configuration file, and build the database schema.

* **On Windows:** Double-click the `setup.bat` file, or run `setup.bat` from your command prompt inside the `app/installation/` folder.
* **On macOS / Linux:** Open your terminal, navigate to `app/installation/`, ensure the script is executable (`chmod +x setup.sh`), and run `./setup.sh`.

### What the Script Does:
1. Installs backend dependencies in the `app/backend/` directory.
2. Interactively prompts you for your Postgres username and password to string together and create the `.env` file securely.
3. If an `.env` file already exists, it prompts you with a strict triple-confirmation flow (Are you sure? Are you SERIOUSLY sure?) to prevent catastrophic overwrites of custom configurations.
4. Uses Prisma to push the newly configured database schema directly into PostgreSQL. *(Note: Prisma will pause and ask if you want to create the `tempus_db` database because it doesn't exist yet. Simply type `y` and hit Enter!)*
5. Installs frontend dependencies in the `app/frontend-react/` directory.

---

## Starting the Application

After the setup finishes successfully, open two separate terminal windows from the root directory:

**Terminal 1 (Backend API):**
```bash
cd app/backend
npm run dev
```

**Terminal 2 (Frontend UI):**
```bash
cd app/frontend-react
npm run dev
```

Your React application will now be running and visible at `http://localhost:5173`.

---

## Postman & Automated API Testing

The backend includes a Postman collection and automated test scripts.

### Postman setup

1. Open Postman and import both files from `app/backend/postman/`:
   - `Tempus-Auth.postman_collection.json`
   - `Tempus.local.postman_environment.json`
2. Select the `Tempus Local` environment.
3. Ensure backend server is running at `http://localhost:3000`.
4. Run the full collection (`Tempus Auth API`) from the Collection Runner.

### CLI testing commands

From `app/backend/`:

- `npm run test:auth` → runs auth smoke tests (`tests/test_auth.js`)
- `npm run test:all` → runs sequential backend test modules (`tests/run_all_tests.js`)
- `npm run test:all:auto` → auto-logins test users, injects tokens, then runs full suite
- `npm run test:setup-credentials` → prompts once and safely writes login credentials to `.env`
- `npm run test:postman` → runs Postman collection with Newman
- `npm run test:postman:ci` → runs Newman with `cli` + `junit` output (`tests/newman-results.xml`)

### Optional test environment variables

- `TEST_BASE_URL` (default: `http://localhost:3000`)
- `TEST_TOKEN` (for modules requiring admin token)
- `TEST_WORKER_TOKEN` (optional worker token for RBAC checks)

For `npm run test:all:auto`, set login credentials (in `.env` or shell):

- `TEST_LOGIN_EMAIL` and `TEST_LOGIN_PASSWORD` (required)
- `TEST_WORKER_LOGIN_EMAIL` and `TEST_WORKER_LOGIN_PASSWORD` (optional)

Recommended local flow:

1. Run `npm run test:setup-credentials` once.
2. Run `npm run test:all:auto` for full automated backend testing.
