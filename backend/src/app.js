// backend/src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');

const routes = require('./routes');
const { errorConverter, errorHandler } = require('./middleware/error.middleware');
const config = require('./config/config');
const logger = require('./config/logger');

// Initialize Express app
const app = express();

// Set trust proxy setting for Railway/other PaaS environments
// This is important for express-rate-limit to work correctly
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS setup
app.use(
  cors({
    origin: config.corsOrigins || config.frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// Request logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(
    morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    })
  );
}

// Special handling for Paystack webhook (raw body)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  if (req.body) {
    try {
      req.body = JSON.parse(req.body.toString());
    } catch (error) {
      logger.error('Failed to parse webhook JSON body', { error: error.message });
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }
  next();
});

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Cookie parser
app.use(cookieParser());

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs || 15 * 60 * 1000, // 15 minutes
  max: config.security.rateLimitMax || 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    error: {
      code: 'TOO_MANY_REQUESTS',
      details: null,
    },
  },
  // Skip rate limiting for webhooks
  skip: (req) => req.path.startsWith('/api/payments/webhook'),
});

// Apply rate limiting to all requests
app.use('/api/', limiter);

// Static files - serve uploads
app.use(
  '/uploads',
  express.static(path.join(__dirname, '..', config.upload.directory), {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.csv')) {
        res.setHeader('Content-Type', 'text/csv');
      }
    },
  })
);

// API routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: config.env,
    database: {
      host: config.db.host?.replace(/:[^:]+$/, ':****'), // Hide port for security
      name: config.db.name,
    },
  });
});

// Serve static frontend files in production
// if (config.env === 'production' || config.env === 'staging') {
  
// }

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// For SPA routing - serve index.html for unmatched routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// 404 handler for API routes
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    next(createError(404, `Not Found - ${req.originalUrl}`));
  } else {
    next();
  }
});

// Convert errors to ApiError, if needed
app.use(errorConverter);

// Handle errors
app.use(errorHandler);

module.exports = app;
