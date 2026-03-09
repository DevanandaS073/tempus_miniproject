const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');
const { requireFeature } = require('../middleware/rbacMiddleware');

router.use(authenticateToken);
router.use(requireTenant);

// Get high-level organizational analytics (requires reports:company feature)
router.get('/admin', requireFeature('reports:company'), statsController.getAdminStats);

// Get personal analytics (requires reports:personal feature)
router.get('/worker', requireFeature('reports:personal'), statsController.getWorkerStats);

module.exports = router;
