const express = require('express');
const { getCompanyUsers } = require('../controllers/networkController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');

const router = express.Router();

// Ensure they are authenticated
router.use(authenticateToken);
router.use(requireTenant);

// Fetch all users in the authenticated user's company
router.get('/users', getCompanyUsers);

module.exports = router;
