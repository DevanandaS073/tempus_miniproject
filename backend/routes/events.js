const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');
const { requireFeature } = require('../middleware/rbacMiddleware');

// Global Protection: Must be authenticated AND belong to a workspace
router.use(authenticateToken);
router.use(requireTenant);

// ─── Event CRUD ─────────────────────────────────────────────────────────────
router.get('/', requireFeature('event:view'), eventsController.getEvents);
router.get('/mine', requireFeature('event:view'), eventsController.getUserEvents);
router.get('/:id', requireFeature('event:view'), eventsController.getEvent);
router.post('/', requireFeature('event:create'), eventsController.createEvent);
router.put('/:id', requireFeature('event:edit'), eventsController.updateEvent);
router.delete('/:id', requireFeature('event:delete'), eventsController.deleteEvent);

// ─── Event RSVP (Join / Leave) ──────────────────────────────────────────────
router.post('/:id/join', requireFeature('event:join'), eventsController.joinEvent);
router.delete('/:id/join', requireFeature('event:join'), eventsController.leaveEvent);

// ─── Event Participants ─────────────────────────────────────────────────────
router.get('/:id/participants', requireFeature('event:view'), eventsController.getEventParticipants);

// ─── Media Generation (Posters & Certificates) ─────────────────────────────
router.get('/:id/media', requireFeature('event:view'), eventsController.getEventMedia);
router.get('/:id/media/poster/data', requireFeature('event:view'), eventsController.getPosterData);
router.post('/:id/media/poster', requireFeature('event:generate_poster'), eventsController.generatePoster);
router.put('/:id/media/poster', requireFeature('event:generate_poster'), eventsController.savePoster);
router.post('/:id/media/certificates', requireFeature('event:create'), eventsController.generateCertificates);
router.get('/templates/certificates', requireFeature('event:create'), eventsController.getCertificateTemplates);
router.post('/:id/media/setup-certificates', requireFeature('event:create'), eventsController.setupAutoCertificates);

module.exports = router;
