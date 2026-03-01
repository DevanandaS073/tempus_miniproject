const express = require('express');
const { getCompanyUsers } = require('../controllers/networkController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

// Ensure they are authenticated
router.use(authenticateToken);

// Fetch all users in the authenticated user's company
router.get('/users', getCompanyUsers);

module.exports = router;
