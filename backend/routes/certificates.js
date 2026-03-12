const express = require('express');
const { sendCertificate, downloadCertificate } = require('../controllers/certificatesController');
const { authenticateToken } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

// Send generated certificates to participants (creates DB record + notification per recipient)
router.post('/send', sendCertificate);

// Download a specific certificate — only the intended recipient can access it
router.get('/:id/download', downloadCertificate);

module.exports = router;
