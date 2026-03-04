const prisma = require('../prismaClient');

// Get all meetings for a user's company (Company Calendar)
const getMeetings = async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = req.user.company_id;

        if (!companyId) {
            return res.status(403).json({ error: 'User must belong to a workspace to access the calendar.' });
        }

        // Ensure user has a personal calendar instance inside the company
        let calendar = await prisma.calendars.findUnique({
            where: { user_id: userId }
        });

        if (!calendar) {
            calendar = await prisma.calendars.create({ data: { user_id: userId, company_id: companyId } });
        }

        // Fetch all meetings for this company
        const meetings = await prisma.meetings.findMany({
            where: {
                company_id: companyId
            },
            include: { participants: true, creator: { select: { first_name: true, last_name: true } } },
            orderBy: { start_time: 'asc' }
        });

        res.json(meetings);
    } catch (error) {
        console.error("GET Meetings Error:", error);
        res.status(500).json({ error: 'Failed to fetch meetings', details: error.message });
    }
};

// Create a new meeting
const createMeeting = async (req, res) => {
    try {
        const { title, start_time, end_time } = req.body;
        const userId = req.user.id;
        const companyId = req.user.company_id;

        if (!companyId) return res.status(403).json({ error: 'User must belong to a workspace.' });

        const startDt = new Date(start_time);
        const endDt = new Date(end_time);

        // 1. Get User's Calendar
        let calendar = await prisma.calendars.findUnique({ where: { user_id: userId } });
        if (!calendar) calendar = await prisma.calendars.create({ data: { user_id: userId, company_id: companyId } });

        // 2. Conflict Check — against other meetings in this company
        const meetingConflict = await prisma.meetings.findFirst({
            where: {
                company_id: companyId,
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

        // 3. Conflict Check — against events in this company
        const eventConflict = await prisma.events.findFirst({
            where: {
                company_id: companyId,
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
                company_id: companyId,
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
        console.error("POST Meetings Error:", error);
        res.status(500).json({ error: 'Failed to create meeting', details: error.message });
    }
};

const deleteMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.company_id;

        // Security: Prevent cross-tenant deletions
        const meeting = await prisma.meetings.findUnique({ where: { meeting_id: parseInt(id) } });
        if (!meeting || meeting.company_id !== companyId) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        await prisma.meetings.delete({ where: { meeting_id: parseInt(id) } });
        res.json({ message: 'Meeting cancelled successfully' });
    } catch (error) {
        console.error("DELETE Meeting Error:", error);
        res.status(500).json({ error: 'Failed to delete meeting' });
    }
};

module.exports = { getMeetings, createMeeting, deleteMeeting };
