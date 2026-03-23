const prisma = require('../prismaClient');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendForgotPasswordOtpEmail } = require('../services/emailService');

const OTP_TTL_MINUTES = Number(process.env.PASSWORD_RESET_OTP_TTL_MINUTES || 10);
const OTP_MAX_ATTEMPTS = Number(process.env.PASSWORD_RESET_OTP_MAX_ATTEMPTS || 5);

function normalizeEmail(email) {
    return (email || '').trim().toLowerCase();
}

function generateOtp() {
    return String(crypto.randomInt(100000, 1000000));
}

function hashOtp(otp) {
    return crypto.createHash('sha256').update(String(otp)).digest('hex');
}

function genericForgotResponse(res) {
    return res.json({
        message: 'If an account exists, an OTP has been sent to the registered email.'
    });
}

async function findLatestActiveOtp(userId) {
    return prisma.password_reset_otps.findFirst({
        where: {
            user_id: userId,
            consumed_at: null,
            expires_at: { gt: new Date() }
        },
        orderBy: { created_at: 'desc' }
    });
}

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
    const email = normalizeEmail(req.body?.email);

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    try {
        const user = await prisma.users.findUnique({ where: { email } });
        if (!user) {
            console.log(`Forgot password requested for non-existent email: ${email}`);
            return genericForgotResponse(res);
        }

        const otp = generateOtp();
        const otpHash = hashOtp(otp);
        const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

        await prisma.password_reset_otps.updateMany({
            where: {
                user_id: user.id,
                consumed_at: null
            },
            data: { consumed_at: new Date() }
        });

        await prisma.password_reset_otps.create({
            data: {
                user_id: user.id,
                otp_hash: otpHash,
                expires_at: expiresAt
            }
        });

        await sendForgotPasswordOtpEmail(user.email, otp);

        return genericForgotResponse(res);
    } catch (err) {
        console.error('Forgot password error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.verifyForgotPasswordOtp = async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const otp = (req.body?.otp || '').trim();

    if (!email || !otp) {
        return res.status(400).json({ error: 'Email and OTP are required' });
    }

    try {
        const user = await prisma.users.findUnique({ where: { email }, select: { id: true } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        const latestOtp = await findLatestActiveOtp(user.id);
        if (!latestOtp) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        if (latestOtp.attempt_count >= OTP_MAX_ATTEMPTS) {
            await prisma.password_reset_otps.update({
                where: { id: latestOtp.id },
                data: { consumed_at: new Date() }
            });
            return res.status(400).json({ error: 'OTP attempts exceeded. Request a new OTP.' });
        }

        const valid = hashOtp(otp) === latestOtp.otp_hash;
        if (!valid) {
            const nextAttempts = latestOtp.attempt_count + 1;
            await prisma.password_reset_otps.update({
                where: { id: latestOtp.id },
                data: {
                    attempt_count: nextAttempts,
                    consumed_at: nextAttempts >= OTP_MAX_ATTEMPTS ? new Date() : null
                }
            });
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        return res.json({ message: 'OTP verified' });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

exports.resetPasswordWithOtp = async (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const otp = (req.body?.otp || '').trim();
    const newPassword = req.body?.newPassword;

    if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: 'Email, OTP, and new password are required' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    try {
        const user = await prisma.users.findUnique({ where: { email }, select: { id: true } });
        if (!user) {
            return res.status(400).json({ error: 'Invalid OTP or reset request' });
        }

        const latestOtp = await findLatestActiveOtp(user.id);
        if (!latestOtp) {
            return res.status(400).json({ error: 'Invalid OTP or reset request' });
        }

        if (latestOtp.attempt_count >= OTP_MAX_ATTEMPTS) {
            await prisma.password_reset_otps.update({
                where: { id: latestOtp.id },
                data: { consumed_at: new Date() }
            });
            return res.status(400).json({ error: 'OTP attempts exceeded. Request a new OTP.' });
        }

        const valid = hashOtp(otp) === latestOtp.otp_hash;
        if (!valid) {
            const nextAttempts = latestOtp.attempt_count + 1;
            await prisma.password_reset_otps.update({
                where: { id: latestOtp.id },
                data: {
                    attempt_count: nextAttempts,
                    consumed_at: nextAttempts >= OTP_MAX_ATTEMPTS ? new Date() : null
                }
            });
            return res.status(400).json({ error: 'Invalid OTP or reset request' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedNewPassword = await bcrypt.hash(newPassword, salt);

        await prisma.$transaction([
            prisma.users.update({
                where: { id: user.id },
                data: { password_hash: hashedNewPassword }
            }),
            prisma.password_reset_otps.updateMany({
                where: { user_id: user.id, consumed_at: null },
                data: { consumed_at: new Date() }
            })
        ]);

        return res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Reset password with OTP error:', error);
        return res.status(500).json({ error: 'Internal server error' });
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
