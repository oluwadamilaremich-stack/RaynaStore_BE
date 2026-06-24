const express = require('express');
const { authUser, registerUser, verifyEmail, forgotPassword, resetPassword } = require('../controllers/authController');
const router = express.Router();

router.post('/login', authUser);
router.post('/register', registerUser);
router.post('/verify', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
