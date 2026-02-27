const express = require('express');
const router = express.Router();
const { login, signup, forgotPassword, updateProfile, updatePassword } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);
router.patch('/profile', authenticateToken, updateProfile);
router.patch('/password', authenticateToken, updatePassword);

module.exports = router;
