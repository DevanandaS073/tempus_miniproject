const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {
    getNotifications,
    markRead,
    markAllRead,
    clearAll
} = require('../controllers/notificationsController');

// All notification routes require authentication
router.use(authenticateToken);

router.get('/', getNotifications);
router.patch('/read-all', markAllRead);
router.patch('/:id/read', markRead);
router.delete('/', clearAll);

module.exports = router;
