const express = require('express');
const router = express.Router();
const eventsController = require('../controllers/eventsController');

// Routes for /api/events
router.get('/', eventsController.getEvents);       // Public
router.post('/', eventsController.createEvent);    // Manager Only (Eventually)
router.post('/join', eventsController.joinEvent);  // User action

module.exports = router;
