const express = require('express');
const { getUnreadNotifications, markAsRead } = require('../controllers/notificationController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

// Fetch active/unread alerts for the logged-in user
router.get('/', getUnreadNotifications);

// Mark a specific alert as read (primarily for standard messages, Invites self-clear upon accept)
router.patch('/:id/read', markAsRead);

module.exports = router;
