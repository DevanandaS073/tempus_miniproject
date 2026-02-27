const prisma = require('../prismaClient');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
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
            token,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed due to a server error' });
    }
};

exports.signup = async (req, res) => {
    const { email, password, name, role } = req.body;
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

        const updatedUser = await prisma.users.update({
            where: { id: userId },
            data: { name: name.trim() },
            select: { id: true, name: true, email: true, role: true }
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

        // Handling the insecure plain-text passwords currently in the DB
        const validPassword = currentPassword === user.password_hash;

        if (!validPassword) {
            return res.status(401).json({ error: 'Incorrect current password' });
        }

        // Just saving it as plain text directly since the assignment seemingly doesn't ask for bcrypt overhauls yet
        await prisma.users.update({
            where: { id: userId },
            data: { password_hash: newPassword }
        });

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ error: 'Failed to update password' });
    }
};
