const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reportsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All report routes require authentication
router.use(authenticateToken);

// GET  /api/reports/latest   — Fetch most recent report for the logged-in user
router.get('/latest', reportsController.getLatestReport);

// POST /api/reports/generate — Run aggregation and save a new report snapshot
router.post('/generate', reportsController.generateReport);

module.exports = router;
