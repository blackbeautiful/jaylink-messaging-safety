const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');
const { Sequelize } = require('sequelize');

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let errorMessage = 'Internal server error';
  let errorDetails = null;
  let errorCode = 'SERVER_ERROR';

  // Log error
  logger.error(`Error: ${err.message}`, {
    error: err,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // Handle different types of errors
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    errorMessage = err.message;
    errorDetails = err.details;
    errorCode = err.code || `ERROR_${statusCode}`;
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
    // Other database errors
    statusCode = 500;
    errorMessage = 'Database error';
    errorCode = 'DATABASE_ERROR';
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
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message: errorMessage,
    error: {
      code: errorCode,
      details: errorDetails,
    },
  });
};

module.exports = errorHandler;