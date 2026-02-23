# Tempus

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)

A modern, fluid web application designed for comprehensive event management, meeting coordination, and robust schedule analytics. Tempus features a sleek glassmorphic UI, dynamic collision detection, and a role-based authentication system.

---

## Key Features

- **Lightning Fast SPA**: Fully migrated to React 18 powered by Vite for instant navigation without page reloads.
- **Role-Based Access Control (RBAC)**: Distinct, secure dashboard experiences for `Admin` and `Worker` roles.
- **Interactive Calendar & Timeline**: Visual event mapping with deep-linked daily detail drawers.
- **Real-Time Collision Alerts**: Pure-function mathematical overlap detection to warn users of scheduling conflicts before they finalize meetings.
- **Interactive Mascot**: The beloved Chronos mascot reacts dynamically to user inputs on the login screen.
- **Robust Analytics**: Live statistics on meeting hours, participant counts, and active events.

---

## Architecture

Tempus uses a decoupled single-page application (SPA) architecture. The React frontend interacts seamlessly with the Express backend APIs to manage the `tempus_db` PostgreSQL database.
---

## Getting Started

### Prerequisites
- **Node.js**: v18 or entirely compatible newer versions
- **PostgreSQL**: v15+ running locally or securely hosted

### 1. Database & Backend Setup
Navigate into the backend directory, install packages, and initialize the PostgreSQL database using Prisma.

```bash
cd backend
npm install

# Create a .env file locally (do not commit it!)
# .env format: DATABASE_URL="postgresql://user:password@localhost:5432/tempus_db?schema=public"
# .env format: PORT=3000
# .env format: JWT_SECRET="your_secret_key_here"

# Push the Prisma schema to your database
npx prisma db push
```

### 2. Frontend React Setup
Navigate into the frontend directory and install the React dependencies.

```bash
cd frontend-react
npm install
```

### 3. Running the Application locally

You can run the frontend and backend in separate terminal windows for the best development experience.

**Terminal 1 (Backend API):**
```bash
cd backend
node server.js
```

**Terminal 2 (Frontend UI):**
```bash
cd frontend-react
npm run dev
```

Visit the provided Vite localhost URL (typically `http://localhost:5173`) to view the application!

*(For production, you can run `npm run build` in the frontend to compile static assets, which the Express backend will automatically serve via a fallback wildcard route.)*

---
*Built with precision and style.*
