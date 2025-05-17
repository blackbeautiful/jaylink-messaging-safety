// src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const config = require('./config/config');
const logger = require('./config/logger');
const errorHandler = require('./middleware/error.middleware');
const routes = require('./routes');

// Initialize Express app
const app = express();

// Set trust proxy setting for Railway/other PaaS environments
// This is important for express-rate-limit to work correctly
// It fixes the "ValidationError: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false" error
app.set('trust proxy', 1);

// Security headers
app.use(helmet());

// CORS setup
app.use(cors({
  origin: config.corsOrigins || config.frontendUrl,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Request logging
if (config.env === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim()),
    },
  }));
}

// Body parser
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Compression
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMax,
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
});

// Apply rate limiting to all requests
app.use(limiter);

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.directory)));

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

// 404 handler
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;