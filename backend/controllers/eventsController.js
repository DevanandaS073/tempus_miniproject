const prisma = require('../prismaClient');

// Get all public events (filterable by type)
const getEvents = async (req, res) => {
    try {
        const { type, search } = req.query;
        let whereClause = {};

        if (type) whereClause.event_type = type;
        if (search) whereClause.title = { contains: search, mode: 'insensitive' };

        const events = await prisma.events.findMany({
            where: whereClause,
            orderBy: { start_date: 'asc' }
        });

        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

// Create a new organizational event (Manager Only - Simplified for now)
const createEvent = async (req, res) => {
    try {
        const { title, description, event_type, start_date, end_date, location, created_by } = req.body;

        // TODO: Role Check (Manager Only) - Team B will implement middleware

        const newEvent = await prisma.events.create({
            data: {
                title,
                description,
                event_type,
                start_date: new Date(start_date),
                end_date: new Date(end_date),
                location,
                created_by: created_by || 1 // Default to admin/test user
            }
        });

        res.status(201).json(newEvent);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};

// User "Joins" an event (Adds to their calendar)
const joinEvent = async (req, res) => {
    try {
        const { event_id, user_id } = req.body;

        // 1. Register logic (Optional: Event Participants table)
        // await prisma.event_participants.create(...)

        // 2. Add to User's Personal Calendar as a Meeting
        const event = await prisma.events.findUnique({ where: { event_id: parseInt(event_id) } });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        let calendar = await prisma.calendars.findUnique({ where: { user_id: user_id || 1 } });

        const meeting = await prisma.meetings.create({
            data: {
                calendar_id: calendar.calendar_id,
                title: `[Event] ${event.title}`,
                description: event.description,
                start_time: event.start_date,
                end_time: event.end_date,
                created_by: user_id || 1,
                status: 'scheduled'
            }
        });

        res.json({ message: 'Event added to calendar', meeting });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to join event' });
    }
};

module.exports = { getEvents, createEvent, joinEvent };
