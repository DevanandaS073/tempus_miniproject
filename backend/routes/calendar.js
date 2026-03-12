const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { requireTenant } = require('../middleware/tenantMiddleware');
const { requireFeature } = require('../middleware/rbacMiddleware');

// Global Protection: Must be authenticated AND belong to a workspace
router.use(authenticateToken);
router.use(requireTenant);

// ─── Meeting CRUD ───────────────────────────────────────────────────────────
router.get('/meetings', requireFeature('calendar:view'), calendarController.getMeetings);
router.post('/meetings', requireFeature('meeting:create'), calendarController.createMeeting);
// Ownership check (edit_own vs edit_any) happens inside the controller
router.put('/meetings/:id', calendarController.updateMeeting);
router.delete('/meetings/:id', calendarController.deleteMeeting);

// ─── Meeting Participation ───────────────────────────────────────────────────
router.post('/meetings/:id/join', requireFeature('calendar:view'), calendarController.joinMeeting);
router.delete('/meetings/:id/join', requireFeature('calendar:view'), calendarController.leaveMeeting);

module.exports = router;
