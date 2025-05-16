const userService = require('../services/user.service');
const authService = require('../services/auth.service');
const response = require('../utils/response.util');
const logger = require('../config/logger');

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profile = await userService.getProfile(userId);
    
    return response.success(res, { profile }, 'User profile retrieved successfully');
  } catch (error) {
    logger.error(`Get profile controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Update user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;
    const profile = await userService.updateProfile(userId, profileData);
    
    return response.success(res, { profile }, 'Profile updated successfully');
  } catch (error) {
    logger.error(`Update profile controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Change user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(userId, currentPassword, newPassword);
    
    return response.success(res, { success: true }, 'Password changed successfully');
  } catch (error) {
    logger.error(`Change password controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Update user settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const settingsData = req.body;
    const settings = await userService.updateSettings(userId, settingsData);
    
    return response.success(res, { settings }, 'Settings updated successfully');
  } catch (error) {
    logger.error(`Update settings controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  updateSettings,
};