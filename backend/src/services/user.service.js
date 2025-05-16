const db = require('../models');
const ApiError = require('../utils/api-error.util');
const logger = require('../config/logger');

const User = db.User;
const Setting = db.Setting;

/**
 * Get user profile by ID
 * @param {number} userId - User ID
 * @returns {Object} User profile object
 */
const getProfile = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    return user;
  } catch (error) {
    logger.error(`Get profile service error: ${error.message}`);
    throw error;
  }
};

/**
 * Update user profile
 * @param {number} userId - User ID
 * @param {Object} profileData - User profile data to update
 * @returns {Object} Updated user profile
 */
const updateProfile = async (userId, profileData) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // If email is being updated, check if it already exists
    if (profileData.email && profileData.email !== user.email) {
      const existingUser = await User.findOne({
        where: { email: profileData.email },
      });

      if (existingUser) {
        throw new ApiError('Email already in use', 409);
      }
    }

    // Update user fields
    const allowedFields = ['firstName', 'lastName', 'email', 'company', 'phone'];
    const updateData = {};

    allowedFields.forEach((field) => {
      if (profileData[field] !== undefined) {
        updateData[field] = profileData[field];
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
    logger.error(`Update profile service error: ${error.message}`);
    throw error;
  }
};

/**
 * Update user settings
 * @param {number} userId - User ID
 * @param {Object} settingsData - User settings data
 * @returns {Object} Updated user settings
 */
const updateSettings = async (userId, settingsData) => {
  try {
    // First check if user exists
    const user = await User.findByPk(userId);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Get existing settings or create if doesn't exist
    const [settings, created] = await Setting.findOrCreate({
      where: { 
        userId,
        category: 'preferences' 
      },
      defaults: {
        userId,
        category: 'preferences',
        settings: {}
      }
    });

    // Update settings with new data
    const currentSettings = settings.settings || {};
    const updatedSettings = { ...currentSettings, ...settingsData };

    await settings.update({ settings: updatedSettings });

    return updatedSettings;
  } catch (error) {
    logger.error(`Update settings service error: ${error.message}`);
    throw error;
  }
};

/**
 * Get user settings
 * @param {number} userId - User ID
 * @param {string} category - Settings category
 * @returns {Object} User settings
 */
const getSettings = async (userId, category = 'preferences') => {
  try {
    const settings = await Setting.findOne({
      where: { 
        userId,
        category 
      }
    });

    return settings ? settings.settings : {};
  } catch (error) {
    logger.error(`Get settings service error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getProfile,
  updateProfile,
  updateSettings,
  getSettings,
};