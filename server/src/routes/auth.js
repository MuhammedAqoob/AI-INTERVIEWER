const express = require('express');
const { register, login, logout, getMe } = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');
const { registerValidation, loginValidation } = require('../middleware/validate');

const router = express.Router();

// POST /api/auth/register
router.post('/register', registerValidation, register);

// POST /api/auth/login
router.post('/login', loginValidation, login);

// POST /api/auth/logout
router.post('/logout', logout);

// GET /api/auth/me (protected route)
router.get('/me', authenticate, getMe);

module.exports = router;
