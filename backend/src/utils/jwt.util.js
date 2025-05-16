const jwt = require('jsonwebtoken');
const config = require('../config/config');
const ApiError = require('./api-error.util');

/**
 * JWT utility functions
 */
const jwtUtil = {
  /**
   * Generate JWT token
   * @param {Object} payload - Token payload
   * @param {string} secret - JWT secret
   * @param {string} expiresIn - Token expiration time
   * @returns {string} JWT token
   */
  generateToken: (payload, secret = config.auth.jwtSecret, expiresIn = config.auth.jwtExpiresIn) => {
    return jwt.sign(payload, secret, { expiresIn });
  },

  /**
   * Generate access token
   * @param {Object} user - User object
   * @param {boolean} isAdmin - Is admin flag
   * @returns {string} JWT access token
   */
  generateAccessToken: (user, isAdmin = false) => {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      isAdmin: isAdmin || user.role === 'admin',
      type: 'access',
    };

    return jwt.sign(payload, config.auth.jwtSecret, {
      expiresIn: config.auth.jwtExpiresIn,
    });
  },

  /**
   * Generate refresh token
   * @param {Object} user - User object
   * @returns {string} JWT refresh token
   */
  generateRefreshToken: (user) => {
    const payload = {
      id: user.id,
      type: 'refresh',
    };

    return jwt.sign(payload, config.auth.jwtRefreshSecret, {
      expiresIn: config.auth.jwtRefreshExpiresIn,
    });
  },

  /**
   * Generate password reset token
   * @param {Object} user - User object
   * @returns {string} JWT reset token
   */
  generateResetToken: (user) => {
    const payload = {
      id: user.id,
      email: user.email,
      type: 'reset',
    };

    return jwt.sign(payload, config.auth.jwtResetSecret, {
      expiresIn: '1h', // Reset tokens expire in 1 hour
    });
  },

  /**
   * Verify JWT token
   * @param {string} token - JWT token
   * @param {string} secret - JWT secret
   * @returns {Object} Decoded token payload
   */
  verifyToken: (token, secret = config.auth.jwtSecret) => {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError('Token expired', 401, null, 'TOKEN_EXPIRED');
      }
      
      throw new ApiError('Invalid token', 401, null, 'INVALID_TOKEN');
    }
  },

  /**
   * Verify access token
   * @param {string} token - JWT access token
   * @returns {Object} Decoded token payload
   */
  verifyAccessToken: (token) => {
    const decoded = jwtUtil.verifyToken(token, config.auth.jwtSecret);
    
    if (decoded.type !== 'access' && !decoded.id) {
      throw new ApiError('Invalid access token', 401, null, 'INVALID_ACCESS_TOKEN');
    }
    
    return decoded;
  },

  /**
   * Verify refresh token
   * @param {string} token - JWT refresh token
   * @returns {Object} Decoded token payload
   */
  verifyRefreshToken: (token) => {
    const decoded = jwtUtil.verifyToken(token, config.auth.jwtRefreshSecret);
    
    if (decoded.type !== 'refresh') {
      throw new ApiError('Invalid refresh token', 401, null, 'INVALID_REFRESH_TOKEN');
    }
    
    return decoded;
  },

  /**
   * Verify reset token
   * @param {string} token - JWT reset token
   * @returns {Object} Decoded token payload
   */
  verifyResetToken: (token) => {
    const decoded = jwtUtil.verifyToken(token, config.auth.jwtResetSecret);
    
    if (decoded.type !== 'reset') {
      throw new ApiError('Invalid reset token', 401, null, 'INVALID_RESET_TOKEN');
    }
    
    return decoded;
  },
};

module.exports = jwtUtil;