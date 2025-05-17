// src/services/user.service.js - Enhanced implementation
const db = require('../models');
const ApiError = require('../utils/api-error.util');
const logger = require('../config/logger');
const emailService = require('./email.service');

const User = db.User;
const Setting = db.Setting;

/**
 * Get user profile by ID
 * @param {number|string} userId - User ID
 * @returns {Object} User profile object
 */
const getProfile = async (userId) => {
  try {
    // Validate userId
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      throw new ApiError('Invalid user ID format', 400);
    }
    
    const user = await User.findByPk(userIdInt, {
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    return user;
  } catch (error) {
    logger.error(`Get profile service error: ${error.message}`, { stack: error.stack, userId });
    throw error;
  }
};

/**
 * Update user profile
 * @param {number|string} userId - User ID
 * @param {Object} profileData - User profile data to update
 * @returns {Object} Updated user profile
 */
const updateProfile = async (userId, profileData) => {
  try {
    // Validate userId
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      throw new ApiError('Invalid user ID format', 400);
    }
    
    const user = await User.findByPk(userIdInt);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Sanitize profile data
    const sanitizedData = { ...profileData };
    
    // Trim string inputs
    ['email', 'firstName', 'lastName', 'company', 'phone'].forEach(field => {
      if (sanitizedData[field] !== undefined) {
        sanitizedData[field] = sanitizedData[field]?.trim() || null;
      }
    });

    // If email is being updated, check if it already exists
    if (sanitizedData.email && sanitizedData.email.toLowerCase() !== user.email.toLowerCase()) {
      const existingUser = await User.findOne({
        where: { email: sanitizedData.email.toLowerCase() },
      });

      if (existingUser) {
        throw new ApiError('Email already in use', 409);
      }
      
      // Convert email to lowercase
      sanitizedData.email = sanitizedData.email.toLowerCase();
    }

    // Update user fields
    const allowedFields = ['firstName', 'lastName', 'email', 'company', 'phone'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (sanitizedData[field] !== undefined) {
        updateData[field] = sanitizedData[field];
      }
    });

    await user.update(updateData);

    // Return updated user (exclude sensitive fields)
    const updatedUser = user.toJSON();
    delete updatedUser.password;
    delete updatedUser.resetToken;
    delete updatedUser.resetTokenExpiry;

    return updatedUser;
  } catch (error) {
    logger.error(`Update profile service error: ${error.message}`, { 
      stack: error.stack, 
      userId,
      profileData: JSON.stringify(profileData)
    });
    throw error;
  }
};

/**
 * Update user settings
 * @param {number|string} userId - User ID
 * @param {Object} settingsData - User settings data
 * @returns {Object} Updated user settings
 */
const updateSettings = async (userId, settingsData) => {
  try {
    // Validate userId
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      throw new ApiError('Invalid user ID format', 400);
    }
    
    // First check if user exists
    const user = await User.findByPk(userIdInt);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Validate settings data
    if (!settingsData || Object.keys(settingsData).length === 0) {
      throw new ApiError('No settings provided for update', 400);
    }

    // Process different types of settings
    const categories = ['preferences', 'notifications', 'appearance', 'security'];
    const updates = [];
    
    // Loop through each possible category of settings
    for (const category of categories) {
      if (settingsData[category] || (category === 'preferences' && Object.keys(settingsData).length > 0)) {
        let categoryData = settingsData[category];
        
        // For the preferences category, we can accept direct settings without category nesting
        if (category === 'preferences' && !categoryData) {
          categoryData = { ...settingsData };
          
          // Remove other known categories
          categories.forEach(c => {
            if (c !== 'preferences' && categoryData[c]) {
              delete categoryData[c];
            }
          });
        }
        
        if (categoryData && Object.keys(categoryData).length > 0) {
          // Get existing settings or create if doesn't exist
          const [settings, created] = await Setting.findOrCreate({
            where: { 
              userId: userIdInt,
              category
            },
            defaults: {
              userId: userIdInt,
              category,
              settings: {}
            }
          });
          
          // Update settings with new data
          const currentSettings = settings.settings || {};
          const updatedSettings = { ...currentSettings, ...categoryData };
          
          await settings.update({ settings: updatedSettings });
          updates.push({ category, settings: updatedSettings });
        }
      }
    }

    if (updates.length === 0) {
      throw new ApiError('No valid settings provided for update', 400);
    }

    // Return all updated settings
    return updates.length === 1 ? updates[0].settings : 
           updates.reduce((result, update) => {
             result[update.category] = update.settings;
             return result;
           }, {});
  } catch (error) {
    logger.error(`Update settings service error: ${error.message}`, { 
      stack: error.stack, 
      userId,
      settingsData: JSON.stringify(settingsData)
    });
    throw error;
  }
};

/**
 * Get user settings
 * @param {number|string} userId - User ID
 * @param {string} category - Settings category (optional)
 * @returns {Object} User settings
 */
const getSettings = async (userId, category = null) => {
  try {
    // Validate userId
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      throw new ApiError('Invalid user ID format', 400);
    }
    
    // First check if user exists
    const user = await User.findByPk(userIdInt);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // If category is specified, get only that category
    if (category) {
      const settings = await Setting.findOne({
        where: { 
          userId: userIdInt,
          category 
        }
      });

      return settings ? settings.settings : {};
    }

    // Otherwise, get all settings categories
    const allSettings = await Setting.findAll({
      where: { userId: userIdInt }
    });

    // Format response as category-keyed object
    return allSettings.reduce((result, setting) => {
      result[setting.category] = setting.settings;
      return result;
    }, {});
  } catch (error) {
    logger.error(`Get settings service error: ${error.message}`, { 
      stack: error.stack, 
      userId,
      category
    });
    throw error;
  }
};

/**
 * Get all user settings by profile
 * @param {number|string} userId - User ID  
 * @returns {Object} User profile with settings
 */
const getProfileWithSettings = async (userId) => {
  try {
    // Validate userId
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      throw new ApiError('Invalid user ID format', 400);
    }
    
    // Get user profile
    const user = await User.findByPk(userIdInt, {
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Get all user settings
    const settings = await getSettings(userIdInt);

    // Combine profile and settings
    return {
      ...user.toJSON(),
      settings
    };
  } catch (error) {
    logger.error(`Get profile with settings service error: ${error.message}`, { 
      stack: error.stack, 
      userId 
    });
    throw error;
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
  getProfileWithSettings,
};