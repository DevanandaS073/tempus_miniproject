const express = require('express');
const router = express.Router();
const { createCompany, getRoles } = require('../controllers/companyController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');

// Route: POST /api/companies
// Description: Create a new company and assign the requesting user as the Admin
router.post('/', authenticateToken, createCompany);

// Route: GET /api/companies/roles
// Description: Get available roles for the current company
router.get('/roles', authenticateToken, requireTenant, getRoles);

module.exports = router;
