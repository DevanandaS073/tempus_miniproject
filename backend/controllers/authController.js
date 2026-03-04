const prisma = require('../prismaClient');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Server-side validation
    if (!email || !email.trim() || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const user = await prisma.users.findUnique({
            where: { email: email.trim().toLowerCase() },
            include: {
                role: {
                    include: {
                        role_features: {
                            include: { feature: true }
                        }
                    }
                }
            }
        });

        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        // Map the complicated role_features graph into a simple array of permission strings
        const permissions = (user.role && user.role.role_features)
            ? user.role.role_features.map(rf => rf.feature.code)
            : [];

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                company_id: user.company_id,
                role: user.role?.name,
                permissions // Store the array of strings directly in the JWT
            },
            process.env.JWT_SECRET || 'tempus-secret-key',
            { expiresIn: '12h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                first_name: user.first_name,
                last_name: user.last_name,
                company_id: user.company_id,
                role: user.role?.name,
                permissions
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed due to a server error' });
    }
};

exports.signup = async (req, res) => {
    const { email, password, name } = req.body;

    // ── Server-side input validation ──
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Full name is required' });
    }
    if (!email || !email.trim()) {
        return res.status(400).json({ error: 'Email is required' });
    }
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    if (!password || password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const parts = name.trim().split(' ');
    const first_name = parts[0];
    const last_name = parts.slice(1).join(' ') || '';

    try {
        // Hash the password before storing
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.users.create({
            data: {
                email: email.trim().toLowerCase(),
                first_name,
                last_name,
                password_hash: hashedPassword,
                company_id: null, // Explicitly joining as Free Agent
                role_id: null
            }
        });
        res.json({ message: 'User created as Free Agent', user });
    } catch (err) {
        if (err.code === 'P2002') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        console.error('Signup error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.forgotPassword = async (req, res) => {
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
};

exports.updateProfile = async (req, res) => {
    try {
        // middleware unpacks user data slightly differently, let's gracefully handle both
        const userId = req.user.id || req.user.userId;
        const { name } = req.body;

        if (!name || name.trim() === '') {
            return res.status(400).json({ error: 'Name is required' });
        }

        const parts = (name || '').trim().split(' ');
        const first_name = parts[0] || '';
        const last_name = parts.slice(1).join(' ') || '';

        const updatedUser = await prisma.users.update({
            where: { id: userId },
            data: { first_name, last_name },
            select: { id: true, first_name: true, last_name: true, email: true, company_id: true }
        });

        res.json({ message: 'Profile updated successfully', user: updatedUser });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const userId = req.user.id || req.user.userId;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        const user = await prisma.users.findUnique({ where: { id: userId } });

        // Compare the current password against the stored bcrypt hash
        const validPassword = await bcrypt.compare(currentPassword, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        // Hash the new password before saving
        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        await prisma.users.update({
            where: { id: userId },
            data: { password_hash: hashedNewPassword }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
};
