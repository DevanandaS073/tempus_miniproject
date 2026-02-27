const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const notificationsController = require('../controllers/notificationsController');

// All notification routes require authentication
router.use(authenticateToken);

router.get('/', notificationsController.getNotifications);
router.patch('/read-all', notificationsController.markAllRead);
router.patch('/:id/read', notificationsController.markRead);
router.delete('/', notificationsController.clearAll);

module.exports = router;
