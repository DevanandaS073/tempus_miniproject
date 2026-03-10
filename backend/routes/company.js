const express = require('express');
const router = express.Router();
const {
    createCompany,
    getCompany,
    updateCompany,
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
    removeUser,
    leaveCompany
} = require('../controllers/companyController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');
const { requireFeature } = require('../middleware/rbacMiddleware');

// Route: POST /api/companies
// Description: Create a new company and assign the requesting user as the Admin
router.post('/', authenticateToken, createCompany);

// Route: GET /api/companies/current
// Description: Get the currently authenticated user's company settings
router.get('/current', authenticateToken, requireTenant, requireFeature('admin:view_settings'), getCompany);

// Route: PUT /api/companies/current
// Description: Update the current user's company settings (requires company:update_info feature)
router.put('/current', authenticateToken, requireTenant, requireFeature('company:update_info'), updateCompany);

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

// ─── User Management Routes ────────────────────────────────────────────────

// Route: DELETE /api/companies/users/:userId
// Description: Admin removes a user from the company
router.delete('/users/:userId', authenticateToken, requireTenant, requireFeature('network:remove_user'), removeUser);

// Route: POST /api/companies/leave
// Description: User voluntarily leaves their company
router.post('/leave', authenticateToken, requireTenant, leaveCompany);

module.exports = router;
