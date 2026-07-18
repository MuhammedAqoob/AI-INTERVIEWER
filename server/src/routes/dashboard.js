const express = require('express');
const { getSummary } = require('../controllers/dashboardController');
const authenticate = require('../middleware/authenticate');
const { dashboardLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/summary', authenticate, dashboardLimiter, getSummary);

module.exports = router;
