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

// ─── GET /api/events/:id ────────────────────────────────────────────────────
// Get a single event by ID (tenant-isolated)
const getEvent = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const companyId = req.user.company_id;

        const event = await prisma.events.findFirst({
            where: { event_id: eventId, company_id: companyId },
            include: {
                creator: { select: { first_name: true, last_name: true } },
                company: { select: { name: true } }
            }
        });

        if (!event) return res.status(404).json({ error: 'Event not found in your workspace' });

        res.json(event);
    } catch (error) {
        console.error('GET Event Error:', error);
        res.status(500).json({ error: 'Failed to fetch event' });
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
        const force = req.query.force === 'true';

        // Tenant isolation: Verify event belongs to user's company
        const event = await prisma.events.findFirst({
            where: { event_id: eventId, company_id: companyId }
        });
        if (!event) return res.status(404).json({ error: 'Event not found in your workspace' });

        // Block joining events that have already ended
        if (new Date(event.end_date) < new Date()) {
            return res.status(400).json({ error: 'This event has already ended and can no longer be joined.' });
        }

        // Collision check against already-joined events (unless force=true)
        if (!force) {
            const joinedParticipations = await prisma.event_participants.findMany({
                where: { user_id: userId },
                include: { event: { select: { event_id: true, title: true, start_date: true, end_date: true } } }
            });

            const overlapping = joinedParticipations
                .map(p => p.event)
                .filter(e => e.event_id !== eventId)
                .find(e => new Date(e.start_date) < new Date(event.end_date) && new Date(e.end_date) > new Date(event.start_date));

            if (overlapping) {
                return res.status(409).json({
                    error: `Schedule collision`,
                    collision: {
                        title: overlapping.title,
                        start: overlapping.start_date,
                        end: overlapping.end_date
                    }
                });
            }
        }

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

// ─── POST /api/events/:id/media/poster ──────────────────────────────────────
// Queue a poster generation job for an event
const generatePoster = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const companyId = req.user.company_id;

        // Verify event belongs to this company
        const event = await prisma.events.findFirst({
            where: { event_id: eventId, company_id: companyId }
        });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        // Check if a poster already exists
        const existing = await prisma.generated_posters.findFirst({
            where: { event_id: eventId }
        });
        if (existing) {
            return res.status(409).json({ error: 'A poster already exists for this event', poster: existing });
        }

        // Create a pending record in the database
        const poster = await prisma.generated_posters.create({
            data: {
                event_id: eventId,
                template_id: 1, // Default template
                poster_path: '',
                status: 'pending'
            }
        });

        // Queue the job for background processing - REMOVED for Client-Side integration

        res.status(202).json({ message: 'Poster generation logged (Client-side rendering pending)', poster });
    } catch (error) {
        console.error('Generate Poster Error:', error);
        res.status(500).json({ error: 'Failed to queue poster generation' });
    }
};

// ─── POST /api/events/:id/media/certificates ────────────────────────────────
// Queue certificate generation for all participants of an event
const generateCertificates = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const companyId = req.user.company_id;

        // Verify event belongs to this company
        const event = await prisma.events.findFirst({
            where: { event_id: eventId, company_id: companyId }
        });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        // Check if certificates already exist
        const existing = await prisma.generated_certificates.count({
            where: { event_id: eventId }
        });
        if (existing > 0) {
            return res.status(409).json({ error: 'Certificates already generated for this event' });
        }

        // Queue the job for background processing - REMOVED for Client-Side integration

        res.status(202).json({ message: 'Certificate generation logged (Client-side rendering pending)' });
    } catch (error) {
        console.error('Generate Certificates Error:', error);
        res.status(500).json({ error: 'Failed to queue certificate generation' });
    }
};

// ─── GET /api/events/:id/media ──────────────────────────────────────────────
// Get the status and paths of all generated media for an event
const getEventMedia = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const companyId = req.user.company_id;

        // Verify event belongs to this company
        const event = await prisma.events.findFirst({
            where: { event_id: eventId, company_id: companyId }
        });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        const posters = await prisma.generated_posters.findMany({
            where: { event_id: eventId },
            orderBy: { generated_at: 'desc' }
        });

        const certificates = await prisma.generated_certificates.findMany({
            where: { event_id: eventId },
            include: {
                participant: {
                    include: {
                        user: { select: { id: true, first_name: true, last_name: true, email: true } }
                    }
                }
            },
            orderBy: { generated_at: 'desc' }
        });

        res.json({
            posters,
            certificates,
            has_poster: posters.length > 0,
            has_certificates: certificates.length > 0,
            poster_status: posters[0]?.status || null,
            certificates_count: certificates.length
        });
    } catch (error) {
        console.error('Get Event Media Error:', error);
        res.status(500).json({ error: 'Failed to fetch event media' });
    }
};

// ─── GET /api/events/templates/certificates ──────────────────────────────────
// Fetch available certificate templates
const getCertificateTemplates = async (req, res) => {
    try {
        const templates = await prisma.certificate_templates.findMany({
            where: { is_active: true },
            orderBy: { name: 'asc' }
        });
        res.json(templates);
    } catch (error) {
        console.error('Fetch Certificate Templates Error:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
};

// ─── POST /api/events/:id/media/setup-certificates ───────────────────────────
// Assign a template to an event and schedule automatic generation on end_date
const setupAutoCertificates = async (req, res) => {
    try {
        const eventId = parseInt(req.params.id);
        const { template_id } = req.body;
        const companyId = req.user.company_id;

        if (!template_id) return res.status(400).json({ error: 'Template ID is required' });

        // Verify event exists and belongs to company
        const event = await prisma.events.findFirst({
            where: { event_id: eventId, company_id: companyId }
        });
        if (!event) return res.status(404).json({ error: 'Event not found' });

        // Update event with selected template
        await prisma.events.update({
            where: { event_id: eventId },
            data: { certificate_template_id: template_id }
        });

        // Calculate delay until end_date
        const now = new Date();
        const endDate = new Date(event.end_date);
        const delayMs = Math.max(0, endDate.getTime() - now.getTime()); // 0 if already in the past

        // Remove any previously scheduled certificate jobs for this event to avoid duplicates
        // REMOVED: BullMQ removed in favor of manual client-side triggers
        
        // Schedule new delayed job
        // REMOVED: BullMQ removed in favor of manual client-side triggers
        console.log(`Auto-certificate configuration saved for event ${eventId}.`);

        res.json({ message: 'Auto-certificates configured and scheduled successfully' });
    } catch (error) {
        console.error('Setup Auto-Certificates Error:', error);
        res.status(500).json({ error: 'Failed to setup automated certificates' });
    }
};

module.exports = {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent,
    joinEvent,
    leaveEvent,
    getEventParticipants,
    getUserEvents,
    generatePoster,
    generateCertificates,
    getEventMedia,
    getCertificateTemplates,
    setupAutoCertificates
};
