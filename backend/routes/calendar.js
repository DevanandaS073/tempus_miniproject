const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');

const { authenticateToken } = require('../middleware/authMiddleware');

// Routes for /api/calendar
router.use(authenticateToken); // Protect all routes

router.get('/meetings', calendarController.getMeetings);  // Fetch all
router.post('/meetings', calendarController.createMeeting); // Create new
router.delete('/meetings/:id', calendarController.deleteMeeting); // Cancel

module.exports = router;
