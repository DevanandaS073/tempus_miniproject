const prisma = require('../prismaClient');

// ─── GET /api/events ────────────────────────────────────────────────────────
// Get all company events (filterable by type/search), enriched with isJoined flag
const getEvents = async (req, res) => {
    try {
        const { type, search } = req.query;
        const companyId = req.user.company_id;

        let whereClause = { company_id: companyId };
        if (type) whereClause.event_type = type;
        if (search) whereClause.title = { contains: search, mode: 'insensitive' };

        let events = await prisma.events.findMany({
            where: whereClause,
            include: {
                creator: { select: { first_name: true, last_name: true } },
                _count: { select: { participants: true } }
            },
            orderBy: { start_date: 'asc' }
        });

        // Enrich with isJoined flag for the current user
        const joinedEvents = await prisma.event_participants.findMany({
            where: { user_id: req.user.id },
            select: { event_id: true }
        });
        const joinedEventIds = new Set(joinedEvents.map(je => je.event_id));

        events = events.map(event => ({
            ...event,
            isJoined: joinedEventIds.has(event.event_id),
            participantCount: event._count.participants
        }));

        res.json(events);
    } catch (error) {
        console.error('GET Events Error:', error);
        res.status(500).json({ error: 'Failed to fetch events' });
    }
};

// ─── POST /api/events ───────────────────────────────────────────────────────
// Create a new organizational event (with conflict detection)
const createEvent = async (req, res) => {
    try {
        const { title, description, event_type, start_date, end_date, location } = req.body;
        const userId = req.user.id;
        const companyId = req.user.company_id;
        const startDt = new Date(start_date);
        const endDt = new Date(end_date);
        const force = req.query.force === 'true';

        if (!title || !event_type || !start_date || !end_date) {
            return res.status(400).json({ error: 'title, event_type, start_date, and end_date are required' });
        }

        if (!force) {
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

            // Conflict Check — against meetings in the user's calendar
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

        const newEvent = await prisma.events.create({
            data: {
                company_id: companyId,
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
        console.error('POST Events Error:', error);
        res.status(500).json({ error: 'Failed to create event' });
    }
};

// ─── PUT /api/events/:id ────────────────────────────────────────────────────
// Update an existing event (tenant-isolated)
const updateEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const companyId = req.user.company_id;
        const { title, description, event_type, start_date, end_date, location } = req.body;

        // Verify event exists and belongs to this company
        const existingEvent = await prisma.events.findFirst({
            where: { event_id: eventId, company_id: companyId }
        });
        if (!existingEvent) {
            return res.status(404).json({ error: 'Event not found in your workspace' });
        }

        const updateData = {};
        if (title) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (event_type) updateData.event_type = event_type;
        if (start_date) updateData.start_date = new Date(start_date);
        if (end_date) updateData.end_date = new Date(end_date);
        if (location !== undefined) updateData.location = location;

        const updatedEvent = await prisma.events.update({
            where: { event_id: eventId },
            data: updateData
        });

        res.json(updatedEvent);
    } catch (error) {
        console.error('PUT Events Error:', error);
        res.status(500).json({ error: 'Failed to update event' });
    }
};

// ─── DELETE /api/events/:id ─────────────────────────────────────────────────
// Delete an event (tenant-isolated, cascades participants)
const deleteEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const companyId = req.user.company_id;

        // Verify event exists and belongs to this company
        const existingEvent = await prisma.events.findFirst({
            where: { event_id: eventId, company_id: companyId }
        });
        if (!existingEvent) {
            return res.status(404).json({ error: 'Event not found in your workspace' });
        }

        // Delete event (cascades to event_participants and generated_posters via schema)
        await prisma.events.delete({ where: { event_id: eventId } });

        res.json({ message: `Event "${existingEvent.title}" deleted successfully` });
    } catch (error) {
        console.error('DELETE Events Error:', error);
        res.status(500).json({ error: 'Failed to delete event' });
    }
};

// ─── POST /api/events/:id/join ──────────────────────────────────────────────
// User joins/RSVPs to an event (tenant-isolated)
const joinEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const userId = req.user.id;
        const companyId = req.user.company_id;

        // Tenant isolation: Verify event belongs to user's company
        const event = await prisma.events.findFirst({
            where: { event_id: eventId, company_id: companyId }
        });
        if (!event) return res.status(404).json({ error: 'Event not found in your workspace' });

        // Ensure user has a calendar
        let calendar = await prisma.calendars.findUnique({ where: { user_id: userId } });
        if (!calendar) {
            calendar = await prisma.calendars.create({ data: { user_id: userId, company_id: companyId } });
        }

        // Add RSVP (ignore duplicates via unique constraint)
        try {
            await prisma.event_participants.create({
                data: {
                    event_id: eventId,
                    user_id: userId,
                    status: 'registered'
                }
            });
        } catch (participantError) {
            if (participantError.code === 'P2002') {
                return res.status(409).json({ error: 'You have already joined this event' });
            }
            throw participantError;
        }

        res.json({ message: 'RSVP recorded successfully' });
    } catch (error) {
        console.error('POST Join Error:', error);
        res.status(500).json({ error: 'Failed to join event' });
    }
};

// ─── DELETE /api/events/:id/join ────────────────────────────────────────────
// User leaves/un-RSVPs from an event
const leaveEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const userId = req.user.id;
        const companyId = req.user.company_id;

        // Tenant isolation: Verify event belongs to user's company
        const event = await prisma.events.findFirst({
            where: { event_id: eventId, company_id: companyId }
        });
        if (!event) return res.status(404).json({ error: 'Event not found in your workspace' });

        // Find and delete the participant record
        const participation = await prisma.event_participants.findFirst({
            where: { event_id: eventId, user_id: userId }
        });
        if (!participation) {
            return res.status(404).json({ error: 'You are not registered for this event' });
        }

        await prisma.event_participants.delete({ where: { id: participation.id } });

        res.json({ message: 'Successfully left the event' });
    } catch (error) {
        console.error('DELETE Leave Error:', error);
        res.status(500).json({ error: 'Failed to leave event' });
    }
};

// ─── GET /api/events/:id/participants ───────────────────────────────────────
// Get participants for a specific event (tenant-isolated)
const getEventParticipants = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const companyId = req.user.company_id;

        // Verify event belongs to this company
        const event = await prisma.events.findFirst({
            where: { event_id: eventId, company_id: companyId }
        });
        if (!event) return res.status(404).json({ error: 'Event not found in your workspace' });

        const participants = await prisma.event_participants.findMany({
            where: { event_id: eventId },
            include: {
                user: { select: { id: true, first_name: true, last_name: true, email: true } }
            }
        });
        res.json(participants);
    } catch (error) {
        console.error('GET Participants Error:', error);
        res.status(500).json({ error: 'Failed to fetch participants' });
    }
};

// ─── GET /api/events/mine ───────────────────────────────────────────────────
// Get all events the logged-in user has joined
const getUserEvents = async (req, res) => {
    try {
        const userId = req.user.id;
        const companyId = req.user.company_id;

        const userEvents = await prisma.event_participants.findMany({
            where: { user_id: userId, event: { company_id: companyId } },
            include: {
                event: {
                    include: {
                        creator: { select: { first_name: true, last_name: true } },
                        _count: { select: { participants: true } }
                    }
                }
            }
        });

        // Flatten into event objects with isJoined = true
        const events = userEvents.map(ue => ({
            ...ue.event,
            isJoined: true,
            participantCount: ue.event._count.participants
        }));

        res.json(events);
    } catch (error) {
        console.error('GET User Events Error:', error);
        res.status(500).json({ error: 'Failed to fetch user events' });
    }
};

module.exports = {
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    joinEvent,
    leaveEvent,
    getEventParticipants,
    getUserEvents
};
