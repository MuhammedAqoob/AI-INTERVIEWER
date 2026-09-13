const rateLimit = require("express-rate-limit");
const interviewStartLimit = parseInt(
    process.env.INTERVIEW_START_RATE_LIMIT,
    10
) || (process.env.NODE_ENV === 'production' ? 3 : 20);

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    // Composite key: IP + username. Prevents credential stuffing (same IP
    // trying many usernames) while keeping per-username attempts bounded.
    // Runs before authenticate, so req.user is unavailable — username comes
    // from the validated login body.
    keyGenerator: (req) => `${req.ip}:${req.body?.username || 'unknown'}`,
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
    windowMs: 10 * 60 * 1000,
    max: 5,
    // Composite key: IP + username. Prevents bulk account creation from one
    // IP while allowing legitimate multi-account scenarios. Runs before
    // authenticate, so req.user is unavailable.
    keyGenerator: (req) => `${req.ip}:${req.body?.username || 'unknown'}`,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many registration attempts. Please try again later."
        });
    }
});

const interviewStartLimiter = rateLimit({
    windowMs: 60 * 1000,
    // This route runs after authentication, so each signed-in user gets an
    // independent allowance instead of every local account sharing one IP key.
    keyGenerator: (req) => req.user?.id || 'unauthenticated-start',
    max: interviewStartLimit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many interview start attempts. Please wait a moment."
        });
    }
});

const interviewAnswerLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    // Runs after authenticate — each user gets an independent bucket so
    // different users sharing a Vercel proxy IP are not throttled together.
    keyGenerator: (req) => req.user?.id || 'unauthenticated-answer',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many answer submissions. Please wait a moment."
        });
    }
});

const interviewDeleteLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    // Runs after authenticate — user-based bucket.
    keyGenerator: (req) => req.user?.id || 'unauthenticated-delete',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many delete requests. Please wait a moment."
        });
    }
});

const interviewStatusLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    // Runs after authenticate — user-based bucket.
    keyGenerator: (req) => req.user?.id || 'unauthenticated-status',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many requests. Please slow down."
        });
    }
});

const dashboardLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    // Runs after authenticate — user-based bucket.
    keyGenerator: (req) => req.user?.id || 'unauthenticated-dashboard',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many requests. Please slow down."
        });
    }
});

const leaderboardLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            message: "Too many requests. Please slow down."
        });
    }
});

module.exports = {
    loginLimiter,
    registerLimiter,
    interviewStartLimiter,
    interviewAnswerLimiter,
    interviewDeleteLimiter,
    interviewStatusLimiter,
    dashboardLimiter,
    leaderboardLimiter,
};
