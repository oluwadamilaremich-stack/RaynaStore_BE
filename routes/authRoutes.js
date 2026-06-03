const express = require('express');
const { authUser, registerUser } = require('../controllers/authController');
const router = express.Router();

router.post('/login', authUser);
router.post('/register', registerUser);

module.exports = router;
