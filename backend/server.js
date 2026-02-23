const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const prisma = require('./prismaClient');
const path = require('path');
require('dotenv').config();

// Routes
const calendarRoutes = require('./routes/calendar');
const eventsRoutes = require('./routes/events');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
    next();
});

app.use((req, res, next) => {
    res.setHeader(
        "Content-Security-Policy",
        "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://*; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com; font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; img-src 'self' data: https://ui-avatars.com; connect-src 'self' ws: localhost:*;"
    );
    next();
});

// Static Files: Serve the Vite React app from dist
const frontendDistPath = path.join(__dirname, '../frontend-react/dist');
app.use(express.static(frontendDistPath));

// API Routes
app.use('/api/calendar', calendarRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/stats', statsRoutes);

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

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'tempus-secret-key',
            { expiresIn: '1h' }
        );

        res.json({
            message: 'Login successful',
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
            token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/api/auth/signup', async (req, res) => {
    const { email, password, name, role } = req.body;
    // Map frontend role selection to Prisma enum
    const dbRole = (role && role.toUpperCase() === 'ADMIN') ? 'admin' : 'user';
    try {
        const user = await prisma.users.create({
            data: {
                email,
                name,
                password_hash: password,
                role: dbRole
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
            console.log(`Password reset requested for: ${email}`);
        }

        res.json({ message: 'If an account exists, a reset link has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Fallback route for React Router (Single Page Application)
// Must be declared after all API routes
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend-react/dist', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`- Login: http://localhost:${PORT}`);
    console.log(`- Dashboard (Admin): http://localhost:${PORT}/dashboard`);
    console.log(`- Dashboard (Worker): http://localhost:${PORT}/worker-dashboard`);
    console.log(`- Calendar: http://localhost:${PORT}/calendar`);
    console.log(`- Poster Generator: http://localhost:${PORT}/poster-gen`);
});
