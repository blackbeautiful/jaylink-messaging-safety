// src/routes/index.js
const express = require('express');
const router = express.Router();
const { rateLimit } = require('express-rate-limit');
const config = require('../config/config');

// Import routes
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const healthRoutes = require('./health.routes');
const adminRoutes = require('./admin');
const balanceRoutes = require('./balance.routes');

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    error: {
      code: 'TOO_MANY_AUTH_ATTEMPTS',
      details: null,
    },
  },
});

// Mount routes with appropriate rate limiters
router.use('/auth', authLimiter, authRoutes);
router.use('/users', userRoutes);
router.use('/health', healthRoutes);
router.use('/admin', adminRoutes);
router.use('/balance', balanceRoutes);

// API information route
router.get('/', (req, res) => {
  res.json({
    name: 'JayLink API',
    version: '1.0.0',
    description: 'API for JayLink SMS and Voice Messaging Platform',
  });
});

module.exports = router;