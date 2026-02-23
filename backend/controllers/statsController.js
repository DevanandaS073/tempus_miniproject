const prisma = require('../prismaClient');

const getAdminStats = async (req, res) => {
    try {
        const [totalWorkers, totalEvents, totalRSVPs] = await Promise.all([
            prisma.users.count({ where: { role: 'user' } }),
            prisma.events.count(),
            prisma.event_participants.count()
        ]);

        res.json({ totalWorkers, totalEvents, totalRSVPs });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        res.status(500).json({ error: 'Failed to fetch admin stats' });
    }
};

const getWorkerStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [joinedEvents, upcomingMeetings] = await Promise.all([
            prisma.event_participants.count({ where: { user_id: userId } }),

            // Count upcoming personal meetings
            prisma.meetings.count({
                where: {
                    calendar: { user_id: userId },
                    end_time: { gt: new Date() }
                }
            })
        ]);

        res.json({ joinedEvents, upcomingMeetings });
    } catch (error) {
        console.error('Error fetching worker stats:', error);
        res.status(500).json({ error: 'Failed to fetch worker stats' });
    }
};

module.exports = { getAdminStats, getWorkerStats };
