const express = require('express');
const router = express.Router();
const {
	login,
	signup,
	forgotPassword,
	verifyForgotPasswordOtp,
	resetPasswordWithOtp,
	updateProfile,
	updatePassword
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/login', login);
router.post('/signup', signup);
router.post('/forgot-password', forgotPassword);
router.post('/forgot-password/verify-otp', verifyForgotPasswordOtp);
router.post('/forgot-password/reset', resetPasswordWithOtp);
router.patch('/profile', authenticateToken, updateProfile);
router.patch('/password', authenticateToken, updatePassword);

module.exports = router;
