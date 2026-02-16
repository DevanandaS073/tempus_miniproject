const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authenticateToken } = require('../middleware/authMiddleware');

<<<<<<< HEAD
const { authenticateToken } = require('../middleware/authMiddleware');

// Routes for /api/calendar
router.use(authenticateToken); // Protect all routes

router.get('/meetings', calendarController.getMeetings);  // Fetch all
router.post('/meetings', calendarController.createMeeting); // Create new
router.delete('/meetings/:id', calendarController.deleteMeeting); // Cancel
=======
// Routes for /api/calendar — all protected
router.use(authenticateToken);

router.get('/meetings', calendarController.getMeetings);
router.post('/meetings', calendarController.createMeeting);
router.delete('/meetings/:id', calendarController.deleteMeeting);
>>>>>>> origin/GouthamSanthosh

module.exports = router;
