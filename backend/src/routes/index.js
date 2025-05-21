// backend/src/routes/index.js
const express = require('express');
const { rateLimit } = require('express-rate-limit');
const config = require('../config/config');

// Import routes
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const balanceRoutes = require('./balance.routes');
const contactRoutes = require('./contact.routes');
const groupRoutes = require('./group.routes');
const smsRoutes = require('./sms.routes');
const scheduledRoutes = require('./scheduled.routes');
const notificationRoutes = require('./notification.routes');
const paymentRoutes = require('./payment.routes');
const healthRoutes = require('./health.routes');
const adminRoutes = require('./admin');

const router = express.Router();

// Rate limiters
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
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

// SMS rate limiter
const smsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Rate limit exceeded for messaging operations, please try again later.',
    error: {
      code: 'SMS_RATE_LIMIT',
      details: null,
    },
  },
});

// Define API route configuration
const apiRoutes = [
  {
    path: '/auth',
    route: authRoutes,
    middleware: [authLimiter]
  },
  {
    path: '/users',
    route: userRoutes
  },
  {
    path: '/balance',
    route: balanceRoutes
  },
  {
    path: '/contacts',
    route: contactRoutes
  },
  {
    path: '/groups',
    route: groupRoutes
  },
  {
    path: '/sms',
    route: smsRoutes,
    middleware: [smsLimiter]
  },
  {
    path: '/scheduled',
    route: scheduledRoutes
  },
  {
    path: '/notifications',
    route: notificationRoutes
  },
  {
    path: '/payments',
    route: paymentRoutes
  },
  {
    path: '/health',
    route: healthRoutes
  },
  {
    path: '/admin',
    route: adminRoutes
  }
];

// Mount routes with their middlewares
apiRoutes.forEach((route) => {
  if (route.middleware) {
    router.use(route.path, ...route.middleware, route.route);
  } else {
    router.use(route.path, route.route);
  }
});

// API information route
router.get('/', (req, res) => {
  res.json({
    name: 'JayLink API',
    version: '1.0.0',
    description: 'API for JayLink SMS and Voice Messaging Platform',
    currency: config.currency?.code || 'NGN'
  });
});

module.exports = router;