const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Routes for /api/calendar — all protected
router.use(authenticateToken);

router.get('/meetings', calendarController.getMeetings);
router.post('/meetings', calendarController.createMeeting);
router.delete('/meetings/:id', calendarController.deleteMeeting);

module.exports = router;
