const express = require('express');
const { sendInvite, acceptInvite, declineInvite } = require('../controllers/inviteController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');

const router = express.Router();

// All invite flows require an authenticated user
router.use(authenticateToken);

// Admin sends an invite (Type 3 -> Type 1)
router.post('/send', requireTenant, sendInvite);

// Free Agent accepts an invite (Morphs into Type 2/3)
router.post('/accept/:notification_id', acceptInvite);

// Free Agent declines an invite
router.post('/decline/:notification_id', declineInvite);

module.exports = router;
