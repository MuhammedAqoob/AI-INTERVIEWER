const rateLimit = require("express-rate-limit");

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 5,

    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many login attempts. Try again after 5 minutes."
        });
    }
});

const registerLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5,

    standardHeaders: true,
    legacyHeaders: false,

    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many registration attempts. Please try again later."
        });
    }
});

module.exports = {
    loginLimiter,
    registerLimiter
};