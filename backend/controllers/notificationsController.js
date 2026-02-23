const prisma = require('../prismaClient');

/**
 * Helper — create a notification for one user.
 * Called from other controllers (events, meetings, etc.)
 */
async function createNotification(userId, type, title, message, link = null) {
    try {
        await prisma.notifications.create({
            data: { user_id: userId, type, title, message, link }
        });
    } catch (err) {
        // Non-fatal — log but don't crash the parent request
        console.error('[Notification] Failed to create notification:', err.message);
    }
}

/**
 * Helper — broadcast a notification to every user matching a given role.
 * If excludeUserId is set, that user is skipped (e.g. the creator).
 */
async function broadcastNotification(role, type, title, message, link = null, excludeUserId = null) {
    try {
        const users = await prisma.users.findMany({
            where: {
                role,
                ...(excludeUserId ? { NOT: { id: excludeUserId } } : {})
            },
            select: { id: true }
        });

        await Promise.all(
            users.map(u =>
                prisma.notifications.create({
                    data: { user_id: u.id, type, title, message, link }
                })
            )
        );
    } catch (err) {
        console.error('[Notification] Broadcast failed:', err.message);
    }
}

// ── GET /api/notifications ──────────────────────────────────────────────────
// Returns the 50 most recent notifications for the logged-in user.
async function getNotifications(req, res) {
    const userId = req.user.id;
    try {
        const notifications = await prisma.notifications.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: 50
        });

        const unreadCount = notifications.filter(n => !n.is_read).length;

        res.json({ notifications, unreadCount });
    } catch (err) {
        console.error('[Notification] getNotifications error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// ── PATCH /api/notifications/:id/read ──────────────────────────────────────
async function markRead(req, res) {
    const userId = req.user.id;
    const id = parseInt(req.params.id);

    if (isNaN(id)) return res.status(400).json({ error: 'Invalid id' });

    try {
        // Ensure the notification belongs to this user
        const notif = await prisma.notifications.findFirst({
            where: { id, user_id: userId }
        });
        if (!notif) return res.status(404).json({ error: 'Not found' });

        await prisma.notifications.update({
            where: { id },
            data: { is_read: true }
        });

        res.json({ success: true });
    } catch (err) {
        console.error('[Notification] markRead error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// ── PATCH /api/notifications/read-all ──────────────────────────────────────
async function markAllRead(req, res) {
    const userId = req.user.id;
    try {
        await prisma.notifications.updateMany({
            where: { user_id: userId, is_read: false },
            data: { is_read: true }
        });
        res.json({ success: true });
    } catch (err) {
        console.error('[Notification] markAllRead error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

// ── DELETE /api/notifications ───────────────────────────────────────────────
// Deletes all READ notifications for the user.
async function clearAll(req, res) {
    const userId = req.user.id;
    try {
        await prisma.notifications.deleteMany({
            where: { user_id: userId, is_read: true }
        });
        res.json({ success: true });
    } catch (err) {
        console.error('[Notification] clearAll error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}

module.exports = {
    getNotifications,
    markRead,
    markAllRead,
    clearAll,
    createNotification,
    broadcastNotification
};
