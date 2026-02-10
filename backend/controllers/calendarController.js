const prisma = require('../prismaClient');

// Get all meetings for a user (Personal Calendar)
const getMeetings = async (req, res) => {
    try {
        // TODO: In real app, get user_id from req.user (Auth Token)
        // For now, we'll accept user_id in query or body for testing
        const userId = parseInt(req.query.user_id) || 1;

        // Ensure user has a calendar
        let calendar = await prisma.calendars.findUnique({
            where: { user_id: userId }
        });

        if (!calendar) {
            calendar = await prisma.calendars.create({ data: { user_id: userId } });
        }

        const meetings = await prisma.meetings.findMany({
            where: { calendar_id: calendar.calendar_id },
            include: { participants: true },
            orderBy: { start_time: 'asc' }
        });

        res.json(meetings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch meetings' });
    }
};

// Create a new meeting
const createMeeting = async (req, res) => {
    try {
        const { title, start_time, end_time, user_id } = req.body;
        const userId = user_id || 1; // Default for testing

        // 1. Get User's Calendar
        let calendar = await prisma.calendars.findUnique({ where: { user_id: userId } });
        if (!calendar) calendar = await prisma.calendars.create({ data: { user_id: userId } });

        // 2. Conflict Check (Simple overlap)
        const conflict = await prisma.meetings.findFirst({
            where: {
                calendar_id: calendar.calendar_id,
                OR: [
                    {
                        start_time: { lte: new Date(end_time) },
                        end_time: { gte: new Date(start_time) }
                    }
                ]
            }
        });

        if (conflict) {
            return res.status(409).json({ error: 'Meeting time conflicts with an existing event.' });
        }

        // 3. Create Meeting
        const meeting = await prisma.meetings.create({
            data: {
                calendar_id: calendar.calendar_id,
                title,
                start_time: new Date(start_time),
                end_time: new Date(end_time),
                created_by: userId,
                status: 'scheduled'
            }
        });

        res.status(201).json(meeting);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create meeting' });
    }
};

// Delete a meeting
const deleteMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.meetings.delete({ where: { meeting_id: parseInt(id) } });
        res.json({ message: 'Meeting cancelled successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete meeting' });
    }
};

module.exports = { getMeetings, createMeeting, deleteMeeting };
