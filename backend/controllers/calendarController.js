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
        const force = req.query.force === 'true';

        if (!companyId) return res.status(403).json({ error: 'User must belong to a workspace.' });

        const startDt = new Date(start_time);
        const endDt = new Date(end_time);

        // 1. Get User's Calendar
        let calendar = await prisma.calendars.findUnique({ where: { user_id: userId } });
        if (!calendar) calendar = await prisma.calendars.create({ data: { user_id: userId, company_id: companyId } });

        if (!force) {
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

// Update an existing meeting
const updateMeeting = async (req, res) => {
    try {
        const meetingId = parseInt(req.params.id);
        const userId = req.user.id;
        const companyId = req.user.company_id;
        const permissions = req.user.permissions || [];
        const { title, description, start_time, end_time } = req.body;

        if (!companyId) return res.status(403).json({ error: 'User must belong to a workspace.' });

        // Verify meeting exists and belongs to this company
        const existingMeeting = await prisma.meetings.findFirst({
            where: { meeting_id: meetingId, company_id: companyId }
        });
        if (!existingMeeting) {
            return res.status(404).json({ error: 'Meeting not found in your workspace' });
        }

        // Ownership-based RBAC: edit_own vs edit_any
        const isCreator = existingMeeting.created_by === userId;
        if (isCreator && !permissions.includes('meeting:edit_own')) {
            return res.status(403).json({ error: 'You do not have permission to edit your own meetings.' });
        }
        if (!isCreator && !permissions.includes('meeting:edit_any')) {
            return res.status(403).json({ error: 'You do not have permission to edit other users\' meetings.' });
        }

        // Build update data
        const updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (start_time) updateData.start_time = new Date(start_time);
        if (end_time) updateData.end_time = new Date(end_time);

        // Conflict check (exclude the meeting being edited)
        const newStart = updateData.start_time || existingMeeting.start_time;
        const newEnd = updateData.end_time || existingMeeting.end_time;

        const meetingConflict = await prisma.meetings.findFirst({
            where: {
                company_id: companyId,
                meeting_id: { not: meetingId },
                start_time: { lt: newEnd },
                end_time: { gt: newStart }
            }
        });

        if (meetingConflict) {
            return res.status(409).json({
                error: `Time conflicts with existing meeting: "${meetingConflict.title}"`,
                conflictWith: { type: 'meeting', title: meetingConflict.title, start: meetingConflict.start_time, end: meetingConflict.end_time }
            });
        }

        const updatedMeeting = await prisma.meetings.update({
            where: { meeting_id: meetingId },
            data: updateData
        });

        res.json(updatedMeeting);
    } catch (error) {
        console.error("PUT Meeting Error:", error);
        res.status(500).json({ error: 'Failed to update meeting', details: error.message });
    }
};

const deleteMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const companyId = req.user.company_id;
        const permissions = req.user.permissions || [];

        // Security: Prevent cross-tenant deletions
        const meeting = await prisma.meetings.findUnique({ where: { meeting_id: parseInt(id) } });
        if (!meeting || meeting.company_id !== companyId) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Ownership-based RBAC: delete_own vs delete_any
        const isCreator = meeting.created_by === userId;
        if (isCreator && !permissions.includes('meeting:delete_own')) {
            return res.status(403).json({ error: 'You do not have permission to cancel your own meetings.' });
        }
        if (!isCreator && !permissions.includes('meeting:delete_any')) {
            return res.status(403).json({ error: 'You do not have permission to cancel other users\' meetings.' });
        }

        await prisma.meetings.delete({ where: { meeting_id: parseInt(id) } });
        res.json({ message: 'Meeting cancelled successfully' });
    } catch (error) {
        console.error("DELETE Meeting Error:", error);
        res.status(500).json({ error: 'Failed to delete meeting' });
    }
};

// Join a meeting (add current user as participant)
const joinMeeting = async (req, res) => {
    try {
        const meetingId = parseInt(req.params.id);
        const userId = req.user.id;
        const companyId = req.user.company_id;

        if (!companyId) return res.status(403).json({ error: 'User must belong to a workspace.' });

        const meeting = await prisma.meetings.findFirst({
            where: { meeting_id: meetingId, company_id: companyId }
        });
        if (!meeting) return res.status(404).json({ error: 'Meeting not found in your workspace.' });

        // Upsert participant row (idempotent)
        await prisma.meeting_participants.upsert({
            where: { meeting_id_user_id: { meeting_id: meetingId, user_id: userId } },
            update: { status: 'accepted' },
            create: { meeting_id: meetingId, user_id: userId, status: 'accepted' }
        });

        res.json({ message: 'Joined meeting successfully.' });
    } catch (error) {
        console.error("JOIN Meeting Error:", error);
        res.status(500).json({ error: 'Failed to join meeting', details: error.message });
    }
};

// Leave a meeting (remove current user as participant)
const leaveMeeting = async (req, res) => {
    try {
        const meetingId = parseInt(req.params.id);
        const userId = req.user.id;
        const companyId = req.user.company_id;

        if (!companyId) return res.status(403).json({ error: 'User must belong to a workspace.' });

        const meeting = await prisma.meetings.findFirst({
            where: { meeting_id: meetingId, company_id: companyId }
        });
        if (!meeting) return res.status(404).json({ error: 'Meeting not found in your workspace.' });

        await prisma.meeting_participants.deleteMany({
            where: { meeting_id: meetingId, user_id: userId }
        });

        res.json({ message: 'Left meeting successfully.' });
    } catch (error) {
        console.error("LEAVE Meeting Error:", error);
        res.status(500).json({ error: 'Failed to leave meeting', details: error.message });
    }
};

module.exports = { getMeetings, createMeeting, updateMeeting, deleteMeeting, joinMeeting, leaveMeeting };

