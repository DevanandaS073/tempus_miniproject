const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

// Get high-level organizational analytics for the Admin UI
router.get('/admin', authenticateToken, isAdmin, statsController.getAdminStats);

// Get personal analytics for the Worker UI
router.get('/worker', authenticateToken, statsController.getWorkerStats);

module.exports = router;
