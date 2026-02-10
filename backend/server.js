const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Logging Middleware
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

// Static Files
app.use(express.static(path.join(__dirname, '../frontend/loginpage')));
app.use('/dashboard', express.static(path.join(__dirname, '../frontend/dashboard')));

// Routes
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Root Route (Login Page)
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, '../frontend/loginpage', 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            console.error('Error serving index.html:', err);
            res.status(500).send('Error loading login page');
        }
    });
});

// Error Handling
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`- Login: http://localhost:${PORT}`);
    console.log(`- Dashboard: http://localhost:${PORT}/dashboard`);
});
