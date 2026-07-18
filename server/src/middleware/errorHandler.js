/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  const isOperational = err.isOperational === true;

  if (!isOperational) {
    console.error('Unexpected error:', err);
  }

  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  if (err.code === 'P1001' || err.code === 'P1002' || err.code === 'P1003') {
    statusCode = 503;
    message = 'Service temporarily unavailable. Please try again later.';
  }

  if (err.code === 'P2002') {
    statusCode = 409;
    message = 'Resource already exists';
  }

  if (err.code === 'P2025') {
    statusCode = 404;
    message = 'Resource not found';
  }

  if (err.message && err.message.includes('Can\'t reach database server')) {
    statusCode = 503;
    message = 'Service temporarily unavailable. Please try again later.';
  }

  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal server error';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = errorHandler;
