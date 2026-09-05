const express = require('express');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const corsOptions = require('./config/cors');
const authRoutes = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const interviewRoutes = require('./routes/interview');
const errorHandler = require('./middleware/errorHandler');
const performanceService = require('./services/performanceService');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors(corsOptions));
// gzip JSON/text responses above the default 1 KB threshold. Transparent to
// clients (fetch/Accept-Encoding), so response parsing and cookies are unaffected.
app.use(compression());
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());
app.use(helmet());
app.use(morgan('dev'));

// Request logger
app.use((req, res, next) => {
  console.log(`${req.method} ${req.originalUrl}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/interview', interviewRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Global error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  // Backfill existing answers once into the persistent score store. Future
  // session deletion only removes session detail, never these totals.
  performanceService.backfillAll().catch((error) => console.error('Performance score backfill failed:', error.message));
});

module.exports = app;
