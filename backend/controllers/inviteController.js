const jwt = require('jsonwebtoken');
const prisma = require('../prismaClient');

/**
 * Admin logic: Find user by email, ensure they are a Free Agent, and create an Invite Notification
 */
const sendInvite = async (req, res) => {
    try {
        const { email, role_id } = req.body;
        const adminId = req.user.id;
        const companyId = req.user.company_id;

        // 1. Validations
        if (!companyId) return res.status(403).json({ error: 'You must belong to a company to send invites.' });
        if (!email || !role_id) return res.status(400).json({ error: 'Email and role_id are required.' });

        // 2. Look up the target user
        const targetUser = await prisma.users.findUnique({ where: { email } });
        if (!targetUser) {
            return res.status(404).json({ error: 'No user exists with this email address.' });
        }

        // 3. Prevent inviting someone already in a company
        if (targetUser.company_id) {
            return res.status(400).json({ error: 'This user already belongs to a workspace.' });
        }

        // 4. Verify target role exists in this company
        const role = await prisma.roles.findFirst({
            where: { id: role_id, company_id: companyId }
        });
        if (!role) {
            return res.status(404).json({ error: 'Invalid role selected.' });
        }

        // 5. Build the Notification payload (JSON)
        const payload = JSON.stringify({
            company_id: companyId,
            role_id: role.id,
            company_name: req.user.company_name || 'A Workspace' // We might need to join to get exact company name, but we can do it on the frontend or here
        });

        const company = await prisma.companies.findUnique({ where: { id: companyId } });

        // 6. Create the Invite Notification for the Free Agent
        await prisma.notifications.create({
            data: {
                user_id: targetUser.id,
                type: 'INVITE',
                title: `Workspace Invitation: ${company.name}`,
                message: `You have been invited to join ${company.name} as a ${role.name}.`,
                link: payload, // Inject the JSON routing exacts
            }
        });

        res.status(200).json({ message: 'Invitation sent successfully.' });

    } catch (error) {
        console.error('Error sending invite:', error);
        res.status(500).json({ error: 'Failed to send invitation.', details: error.message });
    }
};

/**
 * Free Agent logic: Accept the invite, update self role/company, and get a new JWT
 */
const acceptInvite = async (req, res) => {
    try {
        const { notification_id } = req.params;
        const userId = req.user.id;

        // 1. Fetch Notification
        const notification = await prisma.notifications.findUnique({
            where: { id: parseInt(notification_id) }
        });

        if (!notification || notification.user_id !== userId || notification.type !== 'INVITE') {
            return res.status(404).json({ error: 'Invitation not found or unauthorized.' });
        }

        if (notification.is_read) {
            return res.status(400).json({ error: 'This invitation has already been processed.' });
        }

        // 2. Parse payload
        let payload;
        try {
            payload = JSON.parse(notification.link);
        } catch (e) {
            return res.status(500).json({ error: 'Corrupted invitation payload.' });
        }

        const { company_id, role_id } = payload;

        // 3. Atomically attach to company and destroy ALL pending invites
        const result = await prisma.$transaction(async (tx) => {
            // Attach user
            const updatedUser = await tx.users.update({
                where: { id: userId },
                data: { company_id, role_id },
                include: {
                    role: { include: { role_features: { include: { feature: true } } } },
                    company: true
                }
            });

            // Mark ALL invite notifications as read (so they drop off unread bell count once a company is joined)
            await tx.notifications.updateMany({
                where: { user_id: userId, type: 'INVITE' },
                data: { is_read: true }
            });

            return updatedUser;
        });

        // 4. Extract features for new JWT
        const allowedFeatures = result.role?.role_features.map(rf => rf.feature.code) || [];

        // 5. Generate fresh Identity Token
        const token = jwt.sign(
            {
                id: result.id,
                email: result.email,
                company_id: result.company_id,
                role: result.role?.name,
                features: allowedFeatures
            },
            process.env.JWT_SECRET || 'tempus-secret-key', // Fixed crashing bug here
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Invitation accepted!',
            token,
            user: {
                id: result.id,
                email: result.email,
                firstName: result.first_name,
                lastName: result.last_name,
                company_id: result.company_id,
                role: result.role?.name,
                features: allowedFeatures
            }
        });

    } catch (error) {
        console.error('Error accepting invite:', error);
        res.status(500).json({ error: 'Failed to accept invitation.', details: error.message });
    }
};

/**
 * Free Agent logic: Decline the invite (simply dismiss the notification)
 */
const declineInvite = async (req, res) => {
    try {
        const { notification_id } = req.params;
        const userId = req.user.id;

        const notification = await prisma.notifications.findUnique({
            where: { id: parseInt(notification_id) }
        });

        if (!notification || notification.user_id !== userId || notification.type !== 'INVITE') {
            return res.status(404).json({ error: 'Invitation not found or unauthorized.' });
        }

        await prisma.notifications.update({
            where: { id: notification.id },
            data: { is_read: true }
        });

        res.json({ message: 'Invitation declined.' });

    } catch (error) {
        console.error('Error declining invite:', error);
        res.status(500).json({ error: 'Failed to decline invitation.', details: error.message });
    }
};

module.exports = {
    sendInvite,
    acceptInvite,
    declineInvite
};
