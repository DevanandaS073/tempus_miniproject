const express = require('express');
const { getNotifications, markRead, markAllRead, clearAll, deleteOne } = require('../controllers/notificationsController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

// Fetch active/unread alerts for the logged-in user
router.get('/', getNotifications);

// Mark a specific alert as read (primarily for standard messages, Invites self-clear upon accept)
router.patch('/:id/read', markRead);

// Advanced Notification Management
router.patch('/read-all', markAllRead);
router.delete('/clear', clearAll);
router.delete('/:id', deleteOne);

module.exports = router;
