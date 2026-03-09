const express = require('express');
const { getCompanyUsers, updateUserRole } = require('../controllers/networkController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');
const { requireFeature } = require('../middleware/rbacMiddleware');

const router = express.Router();

// Ensure they are authenticated
router.use(authenticateToken);
router.use(requireTenant);

// Fetch all users in the authenticated user's company
router.get('/users', requireFeature('network:view'), getCompanyUsers);

// Assign a new role to a specific user (requires role:assign permission)
router.put('/users/:id/role', requireFeature('role:assign'), updateUserRole);

module.exports = router;
