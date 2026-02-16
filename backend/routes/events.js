const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Routes for /api/events
router.get('/', eventsController.getEvents);                          // Public
router.post('/', authenticateToken, eventsController.createEvent);    // Protected
router.post('/join', authenticateToken, eventsController.joinEvent);  // Protected

module.exports = router;
