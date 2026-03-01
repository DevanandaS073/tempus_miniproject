const prisma = require('../prismaClient');

const getUnreadNotifications = async (req, res) => {
    try {
        const userId = req.user.id;

        const notifications = await prisma.notifications.findMany({
            where: {
                user_id: userId,
                is_read: false
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        res.json(notifications);

    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
};

const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const notificationId = parseInt(req.params.id);

        // Security check: ensure notification belongs to user
        const notification = await prisma.notifications.findUnique({
            where: { id: notificationId }
        });

        if (!notification || notification.user_id !== userId) {
            return res.status(404).json({ error: 'Notification not found or unauthorized' });
        }

        await prisma.notifications.update({
            where: { id: notificationId },
            data: { is_read: true }
        });

        res.json({ message: 'Notification marked as read' });

    } catch (error) {
        console.error('Error marking notification read:', error);
        res.status(500).json({ error: 'Failed to update notification' });
    }
};

module.exports = {
    getUnreadNotifications,
    markAsRead
};
