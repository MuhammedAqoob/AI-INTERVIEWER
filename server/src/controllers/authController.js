const prisma = require('../config/database');
const { hashPassword, comparePassword } = require('../utils/password');
const { generateToken } = require('../utils/jwt');
const { cookieOptions } = require('../config/jwt');
const rateLimit=require("express-rate-limit");


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
 * Register a new user
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    // Check database connection first
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
      });
    }

    const { username, password } = req.body;

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username already exists',
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate JWT
    const token = generateToken(user);

    // Set cookie
    res.cookie('token', token, cookieOptions);

    // Return user data
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Login user
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    // Check database connection first
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      return res.status(503).json({
        success: false,
        message: 'Service temporarily unavailable. Please try again later.',
      });
    }

    const { username, password } = req.body;

    // Find user by username
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT
    const token = generateToken(user);

    // Set cookie
    res.cookie('token', token, cookieOptions);

    // Return user data
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Logout user
 * POST /api/auth/logout
 */
function logout(req, res) {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
}

/**
 * Get current user
 * GET /api/auth/me
 */
async function getMe(req, res) {
  res.status(200).json({
    success: true,
    data: {
      user: req.user,
    },
  });
}

const loginLimiter=rateLimit({

windowMs:15*60*1000,

max:5,

message:"Too many login attempts"

});

module.exports = {
  register,
  login,
  logout,
  getMe,
  loginLimiter
};

