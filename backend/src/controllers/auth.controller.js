const authService = require('../services/auth.service');
const response = require('../utils/response.util');
const logger = require('../config/logger');

/**
 * Register new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const register = async (req, res, next) => {
  try {
    const userData = req.body;
    const result = await authService.register(userData);
    
    return response.success(res, result, 'Registration successful', 201);
  } catch (error) {
    logger.error(`Registration controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * User login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    return response.success(res, result, 'Login successful');
  } catch (error) {
    logger.error(`Login controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Admin login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const adminLogin = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const result = await authService.adminLogin(username, password);
    
    return response.success(res, result, 'Admin login successful');
  } catch (error) {
    logger.error(`Admin login controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get current user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await authService.getCurrentUser(userId);
    
    return response.success(res, { user }, 'User profile retrieved successfully');
  } catch (error) {
    logger.error(`Get current user controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Request password reset
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    await authService.forgotPassword(email);
    
    // Always return success to prevent email enumeration
    return response.success(res, { success: true }, 'Password reset email sent if email exists');
  } catch (error) {
    logger.error(`Forgot password controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Reset password using token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    await authService.resetPassword(token, password);
    
    return response.success(res, { success: true }, 'Password reset successful');
  } catch (error) {
    logger.error(`Reset password controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Logout user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const logout = async (req, res, next) => {
  try {
    const token = req.token;
    await authService.logout(token);
    
    return response.success(res, { success: true }, 'Logout successful');
  } catch (error) {
    logger.error(`Logout controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  logout,
};