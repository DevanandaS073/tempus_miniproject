# Tempus App ⏳

A modern, fluid web application featuring an interactive mascot, liquid background animations, and a PostgreSQL backend.

## 🚀 Getting Started

### Prerequisites

*   **Node.js** (v18+)
*   **PostgreSQL** (v15+)
*   **npm** or **yarn**

### 1. Installation

Clone the repository and navigate to the `app/backend` directory:

```bash
cd app/backend
npm install
```

### 2. Environment Setup

Create a `.env` file in the `app/backend` folder with your database credentials:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/tempus_db?schema=public"
PORT=3000
SECRET_KEY="your_secret_key_here"
```

### 3. Database Migration

Initialize the database schema using Prisma:

```bash
npx prisma migrate dev --name init
```

### 4. Run the App

Start the server:

```bash
# Production
npm start

# Development (with auto-reload)
npm install -g nodemon
nodemon server.js
```

The app will be available at `http://localhost:3000`.

## 📂 Project Structure

*   **`frontend/`**:
    *   **`dashboard/`**: Dashboard UI (HTML/CSS/JS)
    *   **`loginpage/`**: Login/Signup UI (HTML/CSS/JS)
*   **`backend/`**:
    *   **`prisma/`**: Database Schema & Migrations
    *   **`server.js`**: Main Express Server & API Routes

## ✨ Features

*   **Authentication**: Login, Signup, Forgot Password (SPA Flow)
*   **Interactive Mascot**: Reacts to mouse, typing, password visibility, and errors.
*   **Persistent Session**: User data stored in `localStorage` post-login.
*   **Responsive UI**: Glassmorphism design with fluid background animations.
