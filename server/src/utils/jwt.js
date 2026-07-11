const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/jwt');

/**
 * Generate JWT token with user id and role only
 * @param {Object} user - User object with id and role
 * @returns {string} JWT token
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    role: user.role,
  };

  return jwt.sign(payload, jwtSecret, { expiresIn: jwtExpiresIn });
}

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 */
function verifyToken(token) {
  return jwt.verify(token, jwtSecret);
}

module.exports = {
  generateToken,
  verifyToken,
};
