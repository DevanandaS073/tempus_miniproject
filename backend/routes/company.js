const express = require('express');
const router = express.Router();
const {
    createCompany,
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole
} = require('../controllers/companyController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');
const { requireFeature } = require('../middleware/rbacMiddleware');

// Route: POST /api/companies
// Description: Create a new company and assign the requesting user as the Admin
router.post('/', authenticateToken, createCompany);

// ─── Role CRUD Routes (All require tenant + RBAC) ──────────────────────────

// Route: GET /api/companies/roles
// Description: Get all roles for the current company (any authenticated tenant user)
router.get('/roles', authenticateToken, requireTenant, getRoles);

// Route: GET /api/companies/roles/:id
// Description: Get a single role with its feature assignments
router.get('/roles/:id', authenticateToken, requireTenant, getRoleById);

// Route: POST /api/companies/roles
// Description: Create a new custom role with selected features
router.post('/roles', authenticateToken, requireTenant, requireFeature('role:create'), createRole);

// Route: PUT /api/companies/roles/:id
// Description: Update an existing role's name and/or features
router.put('/roles/:id', authenticateToken, requireTenant, requireFeature('role:edit'), updateRole);

// Route: DELETE /api/companies/roles/:id
// Description: Permanently delete a custom role
router.delete('/roles/:id', authenticateToken, requireTenant, requireFeature('role:delete'), deleteRole);

module.exports = router;
