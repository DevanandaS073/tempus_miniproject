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

// Create a new organizational event
const createEvent = async (req, res) => {
    try {
        const { title, description, event_type, start_date, end_date, location } = req.body;
        const userId = req.user.id;
        const startDt = new Date(start_date);
        const endDt = new Date(end_date);
        const force = req.query.force === 'true';

        if (!force) {
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};

// User "Joins" an event (Adds to their calendar)
const joinEvent = async (req, res) => {
    try {
        const { event_id } = req.body;
        const userId = req.user.id;

        // 1. Find the event
        const event = await prisma.events.findUnique({ where: { event_id: parseInt(event_id) } });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        // 2. Get user's calendar
        let calendar = await prisma.calendars.findUnique({ where: { user_id: userId } });
        if (!calendar) calendar = await prisma.calendars.create({ data: { user_id: userId } });

        // 3. Conflict Check — against meetings in user's calendar
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

        // 4. Add to calendar as a meeting
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

        res.json({ message: 'Event added to calendar', meeting });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to join event' });
    }
};

module.exports = { getEvents, createEvent, joinEvent };
