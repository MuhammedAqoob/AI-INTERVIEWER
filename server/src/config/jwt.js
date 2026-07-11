module.exports = {
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-key-change-in-production-2024',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },
};
