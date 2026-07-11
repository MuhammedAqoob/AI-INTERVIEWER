const { verifyToken } = require('../utils/jwt');
const prisma = require('../config/database');

/**
 * Check database connection
 */
async function checkDatabaseConnection() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Authentication middleware
 * Reads JWT from cookie, verifies token, attaches user to request
 */
async function authenticate(req, res, next) {
  try {
    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Check database connection first
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
      });
    }

    // Find user in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired.',
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error.',
    });
  }
}

module.exports = authenticate;
