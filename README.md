# Tempus Application Architecture

This directory (`app/`) contains the entirety of the functional Tempus SaaS application. The project is strictly separated into a headless API backend and a React-powered frontend.

## Directory Structure

*   `backend/` - The Node.js and Express API server. It handles authentication (JWT), Role-Based Access Control (RBAC), and serves as the primary interface for the PostgreSQL database via Prisma ORM.
*   `frontend-react/` - The React Single Page Application (SPA) powered by Vite and styled with Tailwind CSS. It communicates securely with the backend API.
*   `installation/` - Contains cross-platform automation scripts to help you initialize the project for the first time.

## Installation and Setup

If you have just cloned this repository, please navigate to the `installation/` directory and follow the instructions provided in `SETUP_README.md`. 

You will find automated scripts (`setup.bat` for Windows and `setup.sh` for macOS/Linux) that will handle dependency installation, database schema generation, and environment configuration for you.

## Tech Stack Overview

### Backend Core
*   Language: Node.js (JavaScript)
*   Framework: Express.js
*   ORM: Prisma
*   Database: PostgreSQL
*   Authentication: JSON Web Tokens (JWT) / bcryptjs

### Frontend Core
*   Library: React (v18+)
*   Build Tool: Vite
*   Styling: Tailwind CSS
*   Routing: React Router

## Security Architecture

This application utilizes a strict, custom Role-Based Access Control (RBAC) engine. Standard "Admin" and "User" strings are not used for authorization. Instead, authorization is validated against a 24-permission feature matrix.

Every API request and UI component is independently verified against the specific features assigned to the authenticated user's role (e.g., `meeting:edit_own`, `network:invite_user`). This ensures total tenant isolation and rigorous access control across the entire platform.
