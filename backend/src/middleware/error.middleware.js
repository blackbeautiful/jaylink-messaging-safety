// backend/src/middleware/error.middleware.js (Updated version)
const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');
const { Sequelize } = require('sequelize');
const config = require('../config/config');

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Prepare error information (preserving original statusCode if set)
  let statusCode = err.statusCode || 500;
  let errorMessage = err.message || 'Internal server error';
  let errorDetails = err.details || null;
  let errorCode = err.code || `ERROR_${statusCode}`;

  // Collect request context for logging
  const requestContext = {
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    path: req.path,
    query: req.query,
  };

  // Add sanitized body data for logging (exclude sensitive fields)
  if (req.body) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    ['password', 'newPassword', 'currentPassword', 'token', 'refreshToken', 'apiKey'].forEach(field => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '[REDACTED]';
      }
    });
    requestContext.body = sanitizedBody;
  }

  // Handle different types of errors
  if (err instanceof ApiError) {
    // Our custom API errors - use as is
    // statusCode, errorMessage, errorDetails already set from err
  } else if (err instanceof Sequelize.ValidationError) {
    // Sequelize validation errors
    statusCode = 400;
    errorMessage = 'Validation error';
    errorDetails = err.errors.map((error) => ({
      field: error.path,
      message: error.message,
    }));
    errorCode = 'VALIDATION_ERROR';
  } else if (err instanceof Sequelize.UniqueConstraintError) {
    // Sequelize unique constraint errors
    statusCode = 409;
    errorMessage = 'Duplicate entry error';
    errorDetails = err.errors.map((error) => ({
      field: error.path,
      message: error.message,
    }));
    errorCode = 'DUPLICATE_ERROR';
  } else if (err instanceof Sequelize.ForeignKeyConstraintError) {
    // Sequelize foreign key constraint errors
    statusCode = 400;
    errorMessage = 'Invalid relationship error';
    errorCode = 'FOREIGN_KEY_ERROR';
  } else if (err instanceof Sequelize.DatabaseError) {
    // Other database errors - Special handling for pagination issue
    statusCode = 500;
    errorCode = 'DATABASE_ERROR';
    
    // Specific handling for LIMIT parameter error
    if (err.parent && err.parent.code === 'ER_PARSE_ERROR' && 
        err.sql && err.sql.includes('LIMIT') && err.sql.includes('\'')) {
      statusCode = 400;
      errorMessage = 'Invalid pagination parameters. Please ensure page and limit are valid numbers.';
      errorCode = 'INVALID_PAGINATION';
    } else {
      // Generic database error (don't expose details in production)
      errorMessage = config.env === 'development' 
        ? `Database error: ${err.message}`
        : 'A database error occurred. Please try again later.';
      
      // Log detailed database error info
      logger.error('Database error details:', {
        message: err.message,
        sql: err.sql,
        params: err.parameters,
        code: err.parent?.code,
        errno: err.parent?.errno,
        ...requestContext
      });
    }
  } else if (err.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = 401;
    errorMessage = 'Invalid token';
    errorCode = 'INVALID_TOKEN';
  } else if (err.name === 'TokenExpiredError') {
    // JWT expiration errors
    statusCode = 401;
    errorMessage = 'Token expired';
    errorCode = 'TOKEN_EXPIRED';
  } else if (statusCode === 404) {
    // Handle 404 errors (properly preserve 404 status code)
    errorCode = 'NOT_FOUND';
  }

  // Log error with appropriate level based on status code
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  logger[logLevel](`${err.name || 'Error'}: ${err.message}`, {
    error: err.message,
    code: errorCode,
    statusCode,
    stack: err.stack,
    ...requestContext
  });

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: {
      code: errorCode,
      details: errorDetails,
      // Include stack trace only in development environment
      ...(config.env === 'development' && { stack: err.stack }),
    },
  });
};

module.exports = errorHandler;