// backend/src/controllers/user.controller.js - Enhanced implementation with better error handling
const userService = require('../services/user.service');
const authService = require('../services/auth.service');
const response = require('../utils/response.util');
const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');

/**
 * Get user profile
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProfile = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const profile = await userService.getProfile(userId);
    
    return response.success(res, { profile }, 'User profile retrieved successfully');
  } catch (error) {
    logger.error(`Get profile controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * Get profile with settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getProfileWithSettings = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const profile = await userService.getProfileWithSettings(userId);
    
    return response.success(res, { profile }, 'User profile with settings retrieved successfully');
  } catch (error) {
    logger.error(`Get profile with settings controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id
    });
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
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const profileData = req.body;
    
    if (!profileData || Object.keys(profileData).length === 0) {
      throw new ApiError('No profile data provided for update', 400);
    }
    
    const profile = await userService.updateProfile(userId, profileData);
    
    return response.success(res, { profile }, 'Profile updated successfully');
  } catch (error) {
    logger.error(`Update profile controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      updateData: JSON.stringify(req.body)
    });
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
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      throw new ApiError('Current password and new password are required', 400);
    }
    
    await authService.changePassword(userId, currentPassword, newPassword);
    
    return response.success(res, { success: true }, 'Password changed successfully');
  } catch (error) {
    logger.error(`Change password controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * Get user settings
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getSettings = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const { category } = req.query;
    const settings = await userService.getSettings(userId, category);
    
    return response.success(res, { settings }, 'Settings retrieved successfully');
  } catch (error) {
    logger.error(`Get settings controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      category: req.query.category
    });
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
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const settingsData = req.body;
    
    if (!settingsData || Object.keys(settingsData).length === 0) {
      throw new ApiError('No settings data provided for update', 400);
    }
    
    const settings = await userService.updateSettings(userId, settingsData);
    
    return response.success(res, { settings }, 'Settings updated successfully');
  } catch (error) {
    logger.error(`Update settings controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      settingsData: JSON.stringify(req.body)
    });
    next(error);
  }
};

module.exports = {
  getProfile,
  getProfileWithSettings,
  updateProfile,
  changePassword,
  getSettings,
  updateSettings,
};