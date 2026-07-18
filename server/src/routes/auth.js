const express = require('express');
const { register, login, logout, getMe } = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { registerValidation, loginValidation } = require('../middleware/validate');
const {
    loginLimiter,
    registerLimiter
} = require("../middleware/rateLimiter");

const router = express.Router();

// POST /api/auth/register
router.post('/register',registerLimiter, registerValidation, register);

// POST /api/auth/login
router.post('/login', loginLimiter, loginValidation, login);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me (protected route)
router.get('/me', authenticate, getMe);

module.exports = router;
