const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.use(authenticateToken);
router.use(requireTenant);

// Get high-level organizational analytics for the Admin UI
router.get('/admin', isAdmin, statsController.getAdminStats);

// Get personal analytics for the Worker UI
router.get('/worker', statsController.getWorkerStats);

module.exports = router;
