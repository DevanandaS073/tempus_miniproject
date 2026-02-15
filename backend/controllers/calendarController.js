const prisma = require('../prismaClient');

// Get all meetings for a user (Personal Calendar)
const getMeetings = async (req, res) => {
    try {
        const userId = req.user.id; // From JWT

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
        const { title, start_time, end_time } = req.body;
        const userId = req.user.id; // From JWT
        const startDt = new Date(start_time);
        const endDt = new Date(end_time);

        // 1. Get User's Calendar
        let calendar = await prisma.calendars.findUnique({ where: { user_id: userId } });
        if (!calendar) calendar = await prisma.calendars.create({ data: { user_id: userId } });

        // 2. Conflict Check — against other meetings in this calendar
        const meetingConflict = await prisma.meetings.findFirst({
            where: {
                calendar_id: calendar.calendar_id,
                start_time: { lt: endDt },
                end_time: { gt: startDt }
            }
        });

        if (meetingConflict) {
            return res.status(409).json({
                error: `Time conflicts with existing meeting: "${meetingConflict.title}"`,
                conflictWith: { type: 'meeting', title: meetingConflict.title, start: meetingConflict.start_time, end: meetingConflict.end_time }
            });
        }

        // 3. Conflict Check — against events the user created
        const eventConflict = await prisma.events.findFirst({
            where: {
                created_by: userId,
                start_date: { lt: endDt },
                end_date: { gt: startDt }
            }
        });

        if (eventConflict) {
            return res.status(409).json({
                error: `Time conflicts with existing event: "${eventConflict.title}"`,
                conflictWith: { type: 'event', title: eventConflict.title, start: eventConflict.start_date, end: eventConflict.end_date }
            });
        }

        // 4. Create Meeting
        const meeting = await prisma.meetings.create({
            data: {
                calendar_id: calendar.calendar_id,
                title,
                start_time: startDt,
                end_time: endDt,
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
