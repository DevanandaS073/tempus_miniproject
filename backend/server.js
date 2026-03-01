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
const notificationsRoutes = require('./routes/notifications'); // Import Notifications API
const authRoutes = require('./routes/auth'); // Import Auth API
const companyRoutes = require('./routes/company'); // Import Company API
const invitesRoutes = require('./routes/invites'); // Import Invite API
const networkRoutes = require('./routes/network'); // Import Network API

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
app.use('/api/notifications', notificationsRoutes); // Register Notifications API
app.use('/api/auth', authRoutes); // Refactored Auth Router
app.use('/api/companies', companyRoutes); // Register Company API
app.use('/api/invites', invitesRoutes); // Register Invite Router
app.use('/api/network', networkRoutes); // Register Network Router

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
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
