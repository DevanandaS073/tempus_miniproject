const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');

const { authenticateToken } = require('../middleware/authMiddleware');

// Routes for /api/events
router.get('/', eventsController.getEvents);       // Public (or protect if needed)
router.post('/', authenticateToken, eventsController.createEvent);    // Manager Only (Eventually)
router.post('/join', authenticateToken, eventsController.joinEvent);  // User action

module.exports = router;
