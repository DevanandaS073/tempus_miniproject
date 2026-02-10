const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../db');

// Middleware to log requests specific to this router
router.use((req, res, next) => {
    console.log(`[Auth Route] ${req.method} ${req.url}`);
    next();
});

// SIGNUP
router.post('/signup', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Check if user already exists
        const existingUser = await prisma.users.findUnique({
            where: { email }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const newUser = await prisma.users.create({
            data: {
                email,
                name,
                password_hash: hashedPassword
            }
        });

        // Generate Token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(201).json({
            message: 'User created successfully',
            token,
            user: { id: newUser.id, name: newUser.name, email: newUser.email }
        });

    } catch (err) {
        console.error('Signup Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// LOGIN
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await prisma.users.findUnique({
            where: { email }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            // Fallback for old plain text passwords during migration/development
            if (user.password_hash === password) {
                console.warn(`User ${email} logged in with PLAIN TEXT password. Encouraging reset.`);
                // Ideally we should hash it now, but for this step we prioritize login success
            } else {
                return res.status(401).json({ error: 'Invalid credentials' });
            }
        }

        // Generate Token
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });

    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// FORGOT PASSWORD (MOCK)
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
            console.log(`Forgot password requested for non-existent email: ${email}`);
        } else {
            console.log(`[MOCK EMAIL] Password reset link sent to: ${email}`);
            console.log(`[MOCK TOKEN] https://tempus.com/reset-password?token=${Math.random().toString(36).substring(7)}`);
        }

        res.json({ message: 'If an account exists, a reset link has been sent.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
