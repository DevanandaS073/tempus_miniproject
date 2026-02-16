const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const prisma = require('./prismaClient');
const path = require('path');
require('dotenv').config();

// Routes
const calendarRoutes = require('./routes/calendar');
const eventsRoutes = require('./routes/events');

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

app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, '../frontend/loginpage', 'index.html');
    res.sendFile(indexPath, (err) => {
        if (err) {
            res.status(500).send('Error loading login page');
        }
    });
});

// Static Files
app.use(express.static(path.join(__dirname, '../frontend/loginpage')));

// Dashboard routes (serve index.html for root paths)
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard/index.html'));
});
app.get('/worker-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/worker-dashboard/index.html'));
});
<<<<<<< HEAD
=======
app.get('/poster-gen', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/poster-gen/index.html'));
});
>>>>>>> origin/GouthamSanthosh

app.use('/dashboard', express.static(path.join(__dirname, '../frontend/dashboard')));
app.use('/worker-dashboard', express.static(path.join(__dirname, '../frontend/worker-dashboard')));
app.use('/calendar', express.static(path.join(__dirname, '../frontend/calendar')));
app.use('/poster-gen', express.static(path.join(__dirname, '../frontend/poster-gen')));

// API Routes
app.use('/api/calendar', calendarRoutes);
app.use('/api/events', eventsRoutes);

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

<<<<<<< HEAD
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
=======
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET || 'tempus-secret-key',
>>>>>>> origin/GouthamSanthosh
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
            console.log(`Password reset requested for: ${email}`);
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
    console.log(`- Dashboard (Admin): http://localhost:${PORT}/dashboard`);
    console.log(`- Dashboard (Worker): http://localhost:${PORT}/worker-dashboard`);
    console.log(`- Calendar: http://localhost:${PORT}/calendar`);
    console.log(`- Poster Generator: http://localhost:${PORT}/poster-gen`);
});
