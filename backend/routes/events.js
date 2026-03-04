const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// Global Protection: Must be authenticated AND belong to a workspace
router.use(authenticateToken);
router.use(requireTenant);

// Routes for /api/events
router.get('/', eventsController.getEvents);
router.post('/', isAdmin, eventsController.createEvent);
router.get('/my-events', eventsController.getUserEvents);
router.get('/:id/participants', isAdmin, eventsController.getEventParticipants);
router.post('/join', eventsController.joinEvent);

module.exports = router;
