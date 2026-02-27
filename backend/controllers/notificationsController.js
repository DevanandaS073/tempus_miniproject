const prisma = require('../prismaClient');

exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit) || 20;

        const notifications = await prisma.notifications.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
            take: limit
        });

        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications', details: error.message });
    }
};

exports.markRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = parseInt(req.params.id);

        await prisma.notifications.update({
            where: {
                id: notificationId,
                user_id: userId // Ensure user owns this notification
            },
            data: { is_read: true }
        });

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        if (error.code === 'P2025') {
            return res.status(404).json({ error: 'Notification not found' });
        }
        console.error('Error marking notification read:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};

exports.markAllRead = async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.notifications.updateMany({
            where: {
                user_id: userId,
                is_read: false
            },
            data: { is_read: true }
        });

        res.json({ message: 'All notifications marked as read' });
    } catch (error) {
        console.error('Error marking all notifications read:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
};

exports.clearAll = async (req, res) => {
    try {
        const userId = req.user.id;

        await prisma.notifications.deleteMany({
            where: { user_id: userId }
        });

        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        console.error('Error clearing notifications:', error);
        res.status(500).json({ error: 'Failed to clear notifications' });
    }
};
