# Tempus Miniproject Startup Guide

This guide explains how to set up and run the Tempus Miniproject.

## Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (Ensure it is running and accessible)

## Project Structure
- `backend/`: Contains the specific Node.js/Express server and Prisma ORM.
- `frontend/`: Contains static HTML/JS/CSS files (loginpage, dashboard, calendar).
    - **Note**: The frontend is **NOT** a React application. It is served directly by the backend server.

## Setup Instructions

### 1. Database Configuration
Ensure your `backend/.env` file contains the correct database connection string:
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
```

### 2. Backend Setup
Open a terminal and navigate to the `backend` directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Generate the Prisma Client (Fixes `MODULE_NOT_FOUND` errors):
```bash
npx prisma generate
```

Run Database Migrations (if needed):
```bash
npx prisma migrate dev --name init
```

### 3. Running the Application
Start the backend server:
```bash
node server.js
```

You should see output similar to:
```
Server running on http://localhost:3000
- Login: http://localhost:3000
- Dashboard: http://localhost:3000/dashboard
- Calendar: http://localhost:3000/calendar
```

## Accessing the Application
Open your web browser and go to:
**[http://localhost:3000](http://localhost:3000)**

This will load the login page. The dashboard and calendar are accessible after login or directly via the URLs above.
