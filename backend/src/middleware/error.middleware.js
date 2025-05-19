// backend/src/middleware/error.middleware.js (Improved version)
const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');
const { Sequelize } = require('sequelize');
const config = require('../config/config');

/**
 * Maps various error types to standardized ApiError instances
 * @param {Error} err - Original error object
 * @returns {ApiError} Standardized API error
 */
const mapErrorToApiError = (err) => {
  // Already an ApiError, return as is
  if (err instanceof ApiError) {
    return err;
  }

  // Handle Sequelize errors
  if (err instanceof Sequelize.ValidationError) {
    return ApiError.validationError(
      'Validation error',
      err.errors.map(e => ({ field: e.path, message: e.message }))
    );
  } else if (err instanceof Sequelize.UniqueConstraintError) {
    return ApiError.conflict(
      'Duplicate entry',
      err.errors.map(e => ({ field: e.path, message: e.message }))
    );
  } else if (err instanceof Sequelize.ForeignKeyConstraintError) {
    return ApiError.badRequest('Invalid relationship reference', null, 'FOREIGN_KEY_ERROR');
  } else if (err instanceof Sequelize.DatabaseError) {
    // Special handling for pagination errors
    if (err.parent?.code === 'ER_PARSE_ERROR' && err.sql?.includes('LIMIT')) {
      return ApiError.badRequest('Invalid pagination parameters', null, 'INVALID_PAGINATION');
    } else {
      return ApiError.internal('Database operation failed', null, 'DATABASE_ERROR');
    }
  } 
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    return ApiError.unauthorized('Invalid token', null, 'INVALID_TOKEN');
  } else if (err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Token expired', null, 'TOKEN_EXPIRED');
  }
  // Handle HTTP errors with status codes
  else if (err.statusCode) {
    return new ApiError(err.message, err.statusCode, err.details, err.code);
  }
  // Fallback for generic errors
  else {
    return ApiError.internal(err.message);
  }
};

/**
 * Converts error to ApiError if needed
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorConverter = (err, req, res, next) => {  
  const convertedError = mapErrorToApiError(err);
  
  // Preserve stack trace in development
  if (config.env === 'development') {
    convertedError.stack = err.stack;
  }

  next(convertedError);
};

/**
 * Error handling middleware
 * @param {Error} err - Error object (should be ApiError instance at this point)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // At this point, err should always be an ApiError instance
  const statusCode = err.statusCode;
  const errorMessage = err.message;
  const errorDetails = err.details;
  const errorCode = err.code;

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
    const sensitiveFields = ['password', 'newPassword', 'currentPassword', 'token', 'refreshToken', 'apiKey'];
    const sanitizedBody = { ...req.body };
    
    sensitiveFields.forEach(field => {
      if (sanitizedBody[field]) {
        sanitizedBody[field] = '[REDACTED]';
      }
    });
    
    requestContext.body = sanitizedBody;
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

module.exports = {
  errorConverter,
  errorHandler,
  mapErrorToApiError // Exported for testing
};