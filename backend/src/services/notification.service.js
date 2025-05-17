// src/services/notification.service.js
const db = require('../models');
const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');

const User = db.User;
const Notification = db.Notification;

/**
 * Create a notification for a user
 * @param {number} userId - User ID to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, success, warning, error)
 * @returns {Object} Created notification
 */
const createNotification = async (userId, title, message, type = 'info') => {
  try {
    // Check if user exists
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Create notification
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      read: false,
    });
    
    return notification;
  } catch (error) {
    logger.error(`Create notification error: ${error.message}`);
    // Don't throw the error - notifications should be non-blocking
    return null;
  }
};

/**
 * Create a notification for balance update
 * @param {number} userId - User ID to notify
 * @param {string} operation - Operation type (add or deduct)
 * @param {number} amount - Amount updated
 * @param {number} newBalance - New balance
 * @returns {Object} Created notification
 */
const createBalanceNotification = async (userId, operation, amount, newBalance) => {
  const title = operation === 'add' ? 'Balance Added' : 'Balance Deducted';
  const message = operation === 'add'
    ? `$${amount} has been added to your account. Your new balance is $${newBalance}.`
    : `$${amount} has been deducted from your account. Your new balance is $${newBalance}.`;
  const type = operation === 'add' ? 'success' : 'info';
  
  return createNotification(userId, title, message, type);
};

/**
 * Create a notification for password reset
 * @param {number} userId - User ID to notify
 * @returns {Object} Created notification
 */
const createPasswordResetNotification = async (userId) => {
  const title = 'Password Reset';
  const message = 'Your password has been reset by an administrator. Check your email for the temporary password.';
  const type = 'warning';
  
  return createNotification(userId, title, message, type);
};

/**
 * Create a notification for status change
 * @param {number} userId - User ID to notify
 * @param {string} status - New status
 * @returns {Object} Created notification
 */
const createStatusChangeNotification = async (userId, status) => {
  const title = 'Account Status Updated';
  const message = `Your account status has been changed to "${status}".`;
  const type = status === 'active' ? 'success' : (status === 'suspended' ? 'warning' : 'error');
  
  return createNotification(userId, title, message, type);
};

module.exports = {
  createNotification,
  createBalanceNotification,
  createPasswordResetNotification,
  createStatusChangeNotification,
};