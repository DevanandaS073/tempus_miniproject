const prisma = require('../prismaClient');
const { broadcastNotification } = require('./notificationsController');

// Get all meetings for a user (Personal Calendar)
const getMeetings = async (req, res) => {
    try {
        const userId = req.user.id;
        const userRole = req.user.role; // 'ADMIN' or 'WORKER'

        // Ensure user has a calendar
        let calendar = await prisma.calendars.findUnique({ where: { user_id: userId } });
        if (!calendar) calendar = await prisma.calendars.create({ data: { user_id: userId } });

        const includeClause = {
            participants: true,
            creator: { select: { id: true, name: true, role: true } }
        };

        // Fetch user's own meetings (excluding auto-created [Event] entries)
        const ownMeetings = await prisma.meetings.findMany({
            where: {
                calendar_id: calendar.calendar_id,
                NOT: { title: { startsWith: '[Event]' } }
            },
            include: includeClause,
            orderBy: { start_time: 'asc' }
        });

        let allMeetings = ownMeetings;

        // Workers also see all meetings created by any ADMIN
        if (userRole === 'WORKER') {
            const adminMeetings = await prisma.meetings.findMany({
                where: {
                    creator: { role: 'ADMIN' },
                    NOT: { title: { startsWith: '[Event]' } }
                },
                include: includeClause,
                orderBy: { start_time: 'asc' }
            });

            // Merge & deduplicate by meeting_id
            const seen = new Set(ownMeetings.map(m => m.meeting_id));
            for (const m of adminMeetings) {
                if (!seen.has(m.meeting_id)) {
                    seen.add(m.meeting_id);
                    allMeetings.push(m);
                }
            }
            allMeetings.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
        }

        res.json(allMeetings);
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

        // If creator is ADMIN, notify all WORKERs (fire-and-forget)
        const creator = await prisma.users.findUnique({ where: { id: userId }, select: { role: true, name: true } });
        if (creator && creator.role === 'ADMIN') {
            const dateLabel = startDt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeLabel = startDt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            broadcastNotification(
                'WORKER',
                'meeting_invite',
                `New Meeting: ${title}`,
                `A meeting has been scheduled by ${creator.name} on ${dateLabel} at ${timeLabel}.`,
                '/worker-dashboard#meetings',
                userId
            );
        }
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
