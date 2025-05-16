const jwt = require('jsonwebtoken');
const config = require('../config/config');
const db = require('../models');
const ApiError = require('../utils/api-error.util');
const logger = require('../config/logger');

const User = db.User;
const UserSession = db.UserSession;

/**
 * Authentication middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new ApiError('Authentication required', 401));
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.auth.jwtSecret);
    } catch (error) {
      return next(new ApiError('Invalid or expired token', 401));
    }
    
    // Check if token exists in active sessions
    const session = await UserSession.findOne({
      where: {
        token,
        expiresAt: { [db.Sequelize.Op.gt]: new Date() }
      }
    });
    
    if (!session) {
      return next(new ApiError('Session expired or invalid', 401));
    }
    
    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user || user.status !== 'active') {
      return next(new ApiError('User not found or inactive', 401));
    }
    
    // Set user and token in request
    req.user = user;
    req.token = token;
    req.decoded = decoded;
    
    next();
  } catch (error) {
    logger.error(`Authentication middleware error: ${error.message}`, { stack: error.stack });
    next(new ApiError('Authentication failed', 500));
  }
};

/**
 * Admin authorization middleware
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authorizeAdmin = (req, res, next) => {
  try {
    // Check if user exists and is admin
    if (!req.user || req.user.role !== 'admin') {
      return next(new ApiError('Admin access required', 403));
    }
    
    next();
  } catch (error) {
    logger.error(`Admin authorization middleware error: ${error.message}`, { stack: error.stack });
    next(new ApiError('Authorization failed', 500));
  }
};

/**
 * Optional authentication middleware
 * If token is present, decodes and sets user, but doesn't fail if no token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const optionalAuthenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without authentication
      return next();
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.auth.jwtSecret);
    } catch (error) {
      // Invalid token, continue without authentication
      return next();
    }
    
    // Check if token exists in active sessions
    const session = await UserSession.findOne({
      where: {
        token,
        expiresAt: { [db.Sequelize.Op.gt]: new Date() }
      }
    });
    
    if (!session) {
      // No session, continue without authentication
      return next();
    }
    
    // Get user from database
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user || user.status !== 'active') {
      // User not found or inactive, continue without authentication
      return next();
    }
    
    // Set user and token in request
    req.user = user;
    req.token = token;
    req.decoded = decoded;
    
    next();
  } catch (error) {
    // Log error but continue without authentication
    logger.error(`Optional authentication middleware error: ${error.message}`, { stack: error.stack });
    next();
  }
};

module.exports = {
  authenticate,
  authorizeAdmin,
  optionalAuthenticate,
};