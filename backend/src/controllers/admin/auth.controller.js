const authService = require('../../services/auth.service');
const response = require('../../utils/response.util');
const logger = require('../../config/logger');

/**
 * Admin login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const login = async (req, res, next) => {
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
 * Get current admin profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getCurrentAdmin = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const admin = await authService.getCurrentUser(adminId);
    
    // Check if user is admin
    if (admin.role !== 'admin') {
      return response.error(res, 'Not authorized as admin', 403);
    }
    
    return response.success(res, { admin }, 'Admin profile retrieved successfully');
  } catch (error) {
    logger.error(`Get current admin controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Logout admin
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const logout = async (req, res, next) => {
  try {
    const token = req.token;
    await authService.logout(token);
    
    return response.success(res, { success: true }, 'Admin logout successful');
  } catch (error) {
    logger.error(`Admin logout controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

module.exports = {
  login,
  getCurrentAdmin,
  logout,
};