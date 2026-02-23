const prisma = require('../prismaClient');
const { createNotification, broadcastNotification } = require('./notificationsController');

// Get all public events (filterable by type)
const getEvents = async (req, res) => {
    try {
        const { type, search } = req.query;
        let whereClause = {};

        if (type) whereClause.event_type = type;
        if (search) whereClause.title = { contains: search, mode: 'insensitive' };

        const events = await prisma.events.findMany({
            where: whereClause,
            include: {
                creator: { select: { id: true, name: true, email: true } },
                participants: { include: { user: { select: { id: true, name: true, email: true } } } }
            },
            orderBy: { start_date: 'asc' }
        });

        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

// Create a new organizational event
const createEvent = async (req, res) => {
    try {
        const { title, description, event_type, start_date, end_date, location } = req.body;
        const userId = req.user.id;
        const startDt = new Date(start_date);
        const endDt = new Date(end_date);

        // 1. Conflict Check — against events the user already created
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

        // 2. Conflict Check — against meetings in the user's calendar
        const calendar = await prisma.calendars.findUnique({ where: { user_id: userId } });
        if (calendar) {
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
        }

        // 3. Create Event
        const newEvent = await prisma.events.create({
            data: {
                title,
                description,
                event_type,
                start_date: startDt,
                end_date: endDt,
                location,
                created_by: userId
            }
        });

        res.status(201).json(newEvent);

        // Notify all WORKERs about the new event (fire-and-forget)
        const dateLabel = startDt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
        broadcastNotification(
            'WORKER',
            'event_created',
            `New Event: ${title}`,
            `A new ${event_type} event has been scheduled on ${dateLabel}${location ? ' at ' + location : ''}.`,
            '/worker-dashboard#events',
            userId // exclude creator
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};

// User registers/joins an event
const joinEvent = async (req, res) => {
    try {
        const { event_id, note } = req.body;
        const userId = req.user.id;

        // 1. Find the event
        const event = await prisma.events.findUnique({ where: { event_id: parseInt(event_id) } });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        // 2. Check if already registered
        const existing = await prisma.event_participants.findUnique({
            where: { event_id_user_id: { event_id: parseInt(event_id), user_id: userId } }
        });
        if (existing) {
            return res.status(409).json({ error: 'You have already registered for this event' });
        }

        // 3. Get user's calendar (create if missing)
        let calendar = await prisma.calendars.findUnique({ where: { user_id: userId } });
        if (!calendar) calendar = await prisma.calendars.create({ data: { user_id: userId } });

        // 4. Conflict Check — against meetings in user's calendar
        const meetingConflict = await prisma.meetings.findFirst({
            where: {
                calendar_id: calendar.calendar_id,
                start_time: { lt: event.end_date },
                end_time: { gt: event.start_date }
            }
        });

        if (meetingConflict) {
            return res.status(409).json({
                error: `Event time conflicts with your meeting: "${meetingConflict.title}"`,
                conflictWith: { type: 'meeting', title: meetingConflict.title, start: meetingConflict.start_time, end: meetingConflict.end_time }
            });
        }

        // 5. Register in event_participants
        await prisma.event_participants.create({
            data: {
                event_id: parseInt(event_id),
                user_id: userId,
                status: 'registered'
            }
        });

        // 6. Add to personal calendar as a meeting entry
        const meeting = await prisma.meetings.create({
            data: {
                calendar_id: calendar.calendar_id,
                title: `[Event] ${event.title}`,
                description: event.description,
                start_time: event.start_date,
                end_time: event.end_date,
                created_by: userId,
                status: 'scheduled'
            }
        });

        res.json({ message: 'Successfully registered for event', meeting });

        // Notify the event creator that someone joined
        const joiningUser = await prisma.users.findUnique({ where: { id: userId }, select: { name: true } });
        const joinerName = joiningUser ? joiningUser.name : 'A user';
        createNotification(
            event.created_by,
            'event_joined',
            `New Registration: ${event.title}`,
            `${joinerName} has registered for "${event.title}".`,
            '/dashboard#events'
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to join event' });
    }
};

// Get participants for a specific event (admin only)
const getEventParticipants = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await prisma.events.findUnique({
            where: { event_id: parseInt(id) },
            include: {
                creator: { select: { id: true, name: true } },
                participants: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } }
                    },
                    orderBy: { id: 'asc' }
                }
            }
        });

        if (!event) return res.status(404).json({ error: 'Event not found' });

        res.json({
            event_id: event.event_id,
            title: event.title,
            event_type: event.event_type,
            start_date: event.start_date,
            created_by: event.creator,
            participant_count: event.participants.length,
            participants: event.participants.map(p => ({
                id: p.user.id,
                name: p.user.name,
                email: p.user.email,
                role: p.user.role,
                status: p.status
            }))
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch participants' });
    }
};

module.exports = { getEvents, createEvent, joinEvent, getEventParticipants };
