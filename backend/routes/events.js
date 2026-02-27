const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// Routes for /api/events
router.get('/', optionalAuthenticateToken, eventsController.getEvents);                          // Public with optional auth
router.post('/', authenticateToken, isAdmin, eventsController.createEvent);    // Protected + Admin Only
router.get('/my-events', authenticateToken, eventsController.getUserEvents);   // Protected (Worker/Personal)
router.get('/:id/participants', authenticateToken, isAdmin, eventsController.getEventParticipants); // Protected + Admin
router.post('/join', authenticateToken, eventsController.joinEvent);  // Protected

module.exports = router;
