const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const path = require('path');
require('dotenv').config();

const app = express();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    if (req.method === 'POST') console.log('Body:', JSON.stringify(req.body, null, 2));
    next();
});
// CSP Middleware
app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://ui-avatars.com;"
    );
    next();
});

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, '../frontend/loginpage', 'index.html');
    console.log(`Serving index from: ${indexPath}`);
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Error loading login page');
        }
    });
});
app.use(express.static(path.join(__dirname, '../frontend/loginpage')));
app.use('/dashboard', express.static(path.join(__dirname, '../frontend/dashboard')));

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await prisma.users.findUnique({ where: { email } });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        if (user.password_hash !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        res.json({ message: 'Login successful', user: { id: user.id, name: user.name } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const user = await prisma.users.create({
            data: {
                email,
                name,
                password_hash: password
            }
        });
        res.json({ message: 'User created', user });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
            console.log(`Forgot password requested for non-existent email: ${email}`);
        } else {
            console.log(`[MOCK EMAIL] Password reset link sent to: ${email}`);
            console.log(`[MOCK TOKEN] https://tempus.com/reset-password?token=123456`);
        }

        res.json({ message: 'If an account exists, a reset link has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`- Login: http://localhost:${PORT}`);
    console.log(`- Dashboard: http://localhost:${PORT}/dashboard`);
});
