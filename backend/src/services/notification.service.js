// backend/src/services/notification.service.js
const { Op } = require('sequelize');
const db = require('../models');
const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');
const config = require('../config/config');
const emailService = require('./email.service');
const Queue = require('../utils/queue.util');

const User = db.User;
const Notification = db.Notification;
const Setting = db.Setting;
const DeviceToken = db.DeviceToken;

// Create push notification queue
const pushQueue = new Queue('pushNotifications');

/**
 * Create a notification for a user
 * @param {number} userId - User ID to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, success, warning, error)
 * @param {Object} metadata - Additional notification metadata
 * @param {boolean} sendEmail - Whether to send an email notification
 * @param {boolean} sendPush - Whether to send a push notification
 * @returns {Object} Created notification
 */
const createNotification = async (userId, title, message, type = 'info', metadata = {}, sendEmail = false, sendPush = true) => {
  try {
    // Check if user exists
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Check user notification settings
    const userSettings = await Setting.findOne({
      where: {
        userId,
        category: 'notifications'
      }
    });
    
    // Get notification settings or use defaults if not found
    const notificationSettings = userSettings?.settings || {};
    
    // Check if notifications are enabled for this type
    const settingKey = `${type}Notifications`;
    if (notificationSettings[settingKey] === false) {
      logger.debug(`${type} notifications disabled for user ${userId}`);
      return null;
    }
    
    // Determine push and email notification status based on user settings
    const shouldSendPush = sendPush && 
                          notificationSettings.pushNotifications !== false && 
                          config.notifications.pushEnabled;
                          
    const shouldSendEmail = sendEmail && 
                          notificationSettings.emailAlerts !== false;
    
    // Initial status for push and email
    const pushStatus = shouldSendPush ? 'pending' : 'not_applicable';
    const emailStatus = shouldSendEmail ? 'pending' : 'not_applicable';
    
    // Create notification record
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      metadata,
      read: false,
      pushStatus,
      emailStatus
    });
    
    // Process push notification if needed
    if (shouldSendPush) {
      processPushNotification(userId, notification.id, title, message, type, metadata)
        .catch(err => logger.error(`Push notification error: ${err.message}`, { 
          userId, 
          notificationId: notification.id,
          error: err.message
        }));
    }
    
    // Process email notification if needed
    if (shouldSendEmail) {
      processEmailNotification(user, notification.id, title, message, type, metadata)
        .catch(err => logger.error(`Email notification error: ${err.message}`, {
          userId,
          notificationId: notification.id,
          error: err.message
        }));
    }
    
    return notification;
  } catch (error) {
    logger.error(`Create notification error: ${error.message}`, { 
      stack: error.stack,
      userId,
      title,
      type
    });
    // Don't throw the error - notifications should be non-blocking
    return null;
  }
};

/**
 * Process push notification sending
 * @private
 */
const processPushNotification = async (userId, notificationId, title, message, type, metadata) => {
  try {
    // Get active device tokens for the user
    const deviceTokens = await DeviceToken.findAll({
      where: {
        userId,
        active: true
      }
    });
    
    if (!deviceTokens || deviceTokens.length === 0) {
      // No device tokens found, mark as not applicable
      await Notification.update(
        { pushStatus: 'not_applicable' },
        { where: { id: notificationId } }
      );
      return;
    }
    
    // Add to push notification queue
    const result = await queuePushNotification(userId, notificationId, title, message, type, 
      deviceTokens.map(dt => ({ token: dt.token, deviceType: dt.deviceType })),
      metadata
    );
    
    logger.debug(`Queued push notification for user ${userId}: ${notificationId}`, { result });
    
    return result;
  } catch (error) {
    logger.error(`Process push notification error: ${error.message}`, {
      userId,
      notificationId,
      error: error.message
    });
    
    // Mark push notification as failed
    await Notification.update(
      { pushStatus: 'failed' },
      { where: { id: notificationId } }
    );
    
    throw error;
  }
};

/**
 * Queue push notification for processing
 * @private
 */
const queuePushNotification = async (userId, notificationId, title, message, type, deviceTokens, metadata) => {
  try {
    // Add to queue for processing
    const job = await pushQueue.add('sendPushNotification', {
      userId,
      notificationId,
      title,
      message,
      type,
      deviceTokens,
      metadata,
      timestamp: new Date().toISOString()
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000 // 5 seconds initial delay, then exponential backoff
      }
    });
    
    return {
      jobId: job.id,
      queued: true
    };
  } catch (error) {
    logger.error(`Queue push notification error: ${error.message}`, {
      error: error.message,
      userId,
      notificationId
    });
    
    // Mark push notification as failed
    await Notification.update(
      { pushStatus: 'failed' },
      { where: { id: notificationId } }
    );
    
    throw error;
  }
};

/**
 * Process email notification
 * @private
 */
const processEmailNotification = async (user, notificationId, title, message, type, metadata) => {
  try {
    // Map notification types to email templates
    const templateMap = {
      info: 'notification',
      success: 'notification-success',
      warning: 'notification-warning',
      error: 'notification-error'
    };
    
    // Get email template based on notification type or fall back to default
    const template = templateMap[type] || 'notification';
    
    // Send email
    const emailResult = await emailService.sendTemplateEmail({
      to: user.email,
      subject: title,
      template,
      context: {
        title,
        firstName: user.firstName,
        message,
        metadata,
        appUrl: config.frontendUrl,
        type
      }
    });
    
    // Update notification email status
    await Notification.update(
      { emailStatus: emailResult ? 'sent' : 'failed' },
      { where: { id: notificationId } }
    );
    
    return emailResult;
  } catch (error) {
    logger.error(`Process email notification error: ${error.message}`, {
      userId: user.id,
      notificationId,
      error: error.message
    });
    
    // Mark email notification as failed
    await Notification.update(
      { emailStatus: 'failed' },
      { where: { id: notificationId } }
    );
    
    throw error;
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
  const currencySymbol = config.currency.symbol;
  let title, message, type;
  
  if (operation === 'add') {
    title = 'Balance Added';
    message = `${currencySymbol}${amount.toFixed(2)} has been added to your account. Your new balance is ${currencySymbol}${newBalance.toFixed(2)}.`;
    type = 'success';
  } else {
    title = 'Balance Deducted';
    message = `${currencySymbol}${amount.toFixed(2)} has been deducted from your account. Your new balance is ${currencySymbol}${newBalance.toFixed(2)}.`;
    type = 'info';
  }
  
  const metadata = {
    operation,
    amount,
    newBalance,
    currency: config.currency.code
  };
  
  // Send email for low balance alerts
  const sendEmail = operation === 'deduct' && 
                  newBalance < (config.systemDefaults.minimumBalanceThreshold || 500);
  
  return createNotification(userId, title, message, type, metadata, sendEmail);
};

/**
 * Create a notification for password reset
 * @param {number} userId - User ID to notify
 * @returns {Object} Created notification
 */
const createPasswordResetNotification = async (userId) => {
  const title = 'Password Reset';
  const message = 'Your password has been reset. If you did not request this change, please contact support immediately.';
  const type = 'warning';
  
  // Always send email for password resets for security
  return createNotification(userId, title, message, type, {}, true);
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
  
  // Send email for status changes
  return createNotification(userId, title, message, type, { status }, true);
};

/**
 * Create a notification for successful payment
 * @param {number} userId - User ID to notify
 * @param {number} amount - Payment amount
 * @param {string} paymentMethod - Payment method
 * @param {string} reference - Payment reference
 * @returns {Object} Created notification
 */
const createPaymentNotification = async (userId, amount, paymentMethod, reference) => {
  const currencySymbol = config.currency.symbol;
  const title = 'Payment Successful';
  const message = `Your payment of ${currencySymbol}${amount.toFixed(2)} via ${paymentMethod} was successful.`;
  const type = 'success';
  
  return createNotification(userId, title, message, type, { 
    amount, 
    paymentMethod, 
    reference,
    currency: config.currency.code
  });
};

/**
 * Create a notification for message delivery
 * @param {number} userId - User ID to notify
 * @param {string} messageId - Message ID
 * @param {number} recipients - Number of recipients
 * @param {number} delivered - Number of delivered messages
 * @param {number} failed - Number of failed messages
 * @returns {Object} Created notification
 */
const createMessageDeliveryNotification = async (userId, messageId, recipients, delivered, failed) => {
  // Skip if all messages were delivered successfully
  if (failed === 0) {
    return null;
  }
  
  const title = 'Message Delivery Status';
  const message = `Your message (ID: ${messageId}) was sent to ${recipients} recipients. ${delivered} delivered, ${failed} failed.`;
  const type = failed > 0 ? 'warning' : 'success';
  
  // Send email for failed messages if there are significant failures (over 10%)
  const failureRate = failed / recipients;
  const sendEmail = failureRate > 0.1;
  
  return createNotification(userId, title, message, type, { 
    messageId, 
    recipients, 
    delivered, 
    failed 
  }, sendEmail);
};

/**
 * Get user notifications with pagination
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Notifications with pagination
 */
const getUserNotifications = async (userId, options = {}) => {
  try {
    const { page = 1, limit = 20, read, type, startDate, endDate } = options;
    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = { userId };
    
    if (read !== undefined) {
      whereClause.read = read === 'true' || read === true;
    }
    
    if (type) {
      whereClause.type = type;
    }
    
    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereClause.createdAt = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.createdAt = {
        [Op.lte]: new Date(endDate),
      };
    }
    
    // Query notifications
    const { count, rows } = await Notification.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    // Get unread count
    const unreadCount = await Notification.count({
      where: { 
        userId,
        read: false
      }
    });
    
    return {
      notifications: rows,
      pagination: {
        total: count,
        totalPages,
        currentPage: parseInt(page, 10),
        limit: parseInt(limit, 10),
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      unreadCount
    };
  } catch (error) {
    logger.error(`Get user notifications error: ${error.message}`, { 
      stack: error.stack,
      userId,
      options
    });
    throw error;
  }
};

/**
 * Mark notifications as read
 * @param {number} userId - User ID
 * @param {number|Array} notificationIds - Notification ID(s) to mark as read
 * @returns {Object} Success status with count
 */
const markAsRead = async (userId, notificationIds) => {
  try {
    // If notificationIds is 'all', mark all as read
    if (notificationIds === 'all') {
      const result = await Notification.update(
        { read: true },
        { where: { userId, read: false } }
      );
      
      return {
        success: true,
        updated: result[0],
        message: `Marked ${result[0]} notifications as read`
      };
    }
    
    // Convert single ID to array
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
    
    // Validate the array
    if (!ids.length) {
      throw new ApiError('No notification IDs provided', 400);
    }
    
    // Update notifications
    const result = await Notification.update(
      { read: true },
      { 
        where: { 
          id: { [Op.in]: ids },
          userId // Ensure user can only update their own notifications
        } 
      }
    );
    
    return {
      success: true,
      updated: result[0],
      message: `Marked ${result[0]} notifications as read`
    };
  } catch (error) {
    logger.error(`Mark notifications as read error: ${error.message}`, { 
      stack: error.stack,
      userId,
      notificationIds
    });
    throw error;
  }
};

/**
 * Delete notifications
 * @param {number} userId - User ID
 * @param {number|Array} notificationIds - Notification ID(s) to delete
 * @returns {Object} Success status with count
 */
const deleteNotifications = async (userId, notificationIds) => {
  try {
    // Convert single ID to array
    const ids = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
    
    // Validate the array
    if (!ids.length) {
      throw new ApiError('No notification IDs provided', 400);
    }
    
    // Delete notifications
    const deleted = await Notification.destroy({
      where: { 
        id: { [Op.in]: ids },
        userId // Ensure user can only delete their own notifications
      }
    });
    
    return {
      success: true,
      deleted,
      message: `Deleted ${deleted} notifications`
    };
  } catch (error) {
    logger.error(`Delete notifications error: ${error.message}`, { 
      stack: error.stack,
      userId,
      notificationIds
    });
    throw error;
  }
};

/**
 * Clean up old notifications
 * @param {number} days - Number of days to keep notifications (default from config)
 * @returns {Object} Cleanup result
 */
const cleanupOldNotifications = async (days = null) => {
  try {
    // Use provided days or get from config
    const retentionDays = days || config.notifications.retentionDays || 30;
    
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    // Delete old notifications
    const deleted = await Notification.destroy({
      where: {
        createdAt: {
          [Op.lt]: cutoffDate
        }
      }
    });
    
    logger.info(`Cleaned up ${deleted} old notifications older than ${retentionDays} days`);
    
    return {
      success: true,
      deleted,
      retentionDays
    };
  } catch (error) {
    logger.error(`Cleanup old notifications error: ${error.message}`, { 
      stack: error.stack
    });
    // Don't throw error as this is a maintenance operation
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get notification statistics
 * @param {number} userId - User ID (optional, for admin use)
 * @returns {Object} Notification stats
 */
const getNotificationStats = async (userId = null) => {
  try {
    const whereClause = userId ? { userId } : {};
    
    // Get total count
    const totalCount = await Notification.count({
      where: whereClause
    });
    
    // Get unread count
    const unreadCount = await Notification.count({
      where: {
        ...whereClause,
        read: false
      }
    });
    
    // Get counts by type
    const typePromises = ['info', 'success', 'warning', 'error'].map(type => 
      Notification.count({
        where: {
          ...whereClause,
          type
        }
      })
    );
    
    const typeCounts = await Promise.all(typePromises);
    
    // Get recent notifications
    const recentNotifications = await Notification.findAll({
      where: whereClause,
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    
    return {
      totalCount,
      unreadCount,
      readCount: totalCount - unreadCount,
      types: {
        info: typeCounts[0],
        success: typeCounts[1],
        warning: typeCounts[2],
        error: typeCounts[3]
      },
      recentNotifications
    };
  } catch (error) {
    logger.error(`Get notification stats error: ${error.message}`, { 
      stack: error.stack,
      userId
    });
    throw error;
  }
};

/**
 * Get user notification settings
 * @param {number} userId - User ID
 * @returns {Object} User notification settings
 */
const getUserSettings = async (userId) => {
  try {
    // Check if user exists
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Get settings
    const userSettings = await Setting.findOne({
      where: {
        userId,
        category: 'notifications'
      }
    });
    
    // Return settings or defaults
    if (userSettings && userSettings.settings) {
      return userSettings.settings;
    }
    
    // Default notification settings
    const defaultSettings = {
      emailAlerts: true,
      lowBalanceAlerts: true,
      deliveryReports: true,
      marketingEmails: false,
      pushNotifications: true,
      infoNotifications: true,
      successNotifications: true,
      warningNotifications: true,
      errorNotifications: true
    };
    
    return defaultSettings;
  } catch (error) {
    logger.error(`Get user notification settings error: ${error.message}`, {
      stack: error.stack,
      userId
    });
    throw error;
  }
};

/**
 * Update user notification settings
 * @param {number} userId - User ID
 * @param {Object} settings - Notification settings to update
 * @returns {Object} Updated settings
 */
const updateNotificationSettings = async (userId, settings) => {
  try {
    // Check if user exists
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Get existing settings or create if doesn't exist
    const [userSettings, created] = await Setting.findOrCreate({
      where: { 
        userId,
        category: 'notifications'
      },
      defaults: {
        userId,
        category: 'notifications',
        settings: {}
      }
    });
    
    // Update settings with new data
    const currentSettings = userSettings.settings || {};
    const updatedSettings = { ...currentSettings, ...settings };
    
    await userSettings.update({ settings: updatedSettings });
    
    return updatedSettings;
  } catch (error) {
    logger.error(`Update notification settings error: ${error.message}`, {
      stack: error.stack,
      userId,
      settings: JSON.stringify(settings)
    });
    throw error;
  }
};

/**
 * Register a device token for push notifications
 * @param {number} userId - User ID
 * @param {string} token - FCM or similar push token
 * @param {string} deviceType - Device type (android/ios/web/other)
 * @param {Object} deviceInfo - Additional device info
 * @returns {Object} Registered token
 */
const registerDeviceToken = async (userId, token, deviceType = 'web', deviceInfo = {}) => {
  try {
    // Check if user exists
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Check if token already exists for user
    const existingToken = await DeviceToken.findOne({
      where: {
        userId,
        token
      }
    });
    
    // Update existing token if found
    if (existingToken) {
      await existingToken.update({
        deviceType,
        deviceInfo,
        active: true,
        updatedAt: new Date()
      });
      
      return existingToken;
    }
    
    // Create new token
    const deviceToken = await DeviceToken.create({
      userId,
      token,
      deviceType,
      deviceInfo,
      active: true
    });
    
    return deviceToken;
  } catch (error) {
    logger.error(`Register device token error: ${error.message}`, {
      stack: error.stack,
      userId,
      deviceType
    });
    throw error;
  }
};

/**
 * Unregister a device token
 * @param {number} userId - User ID
 * @param {string} token - Device token to unregister
 * @returns {Object} Result
 */
const unregisterDeviceToken = async (userId, token) => {
  try {
    // Find and update token
    const result = await DeviceToken.update(
      { active: false },
      { 
        where: { 
          userId,
          token
        } 
      }
    );
    
    return {
      success: true,
      deactivated: result[0] > 0,
      message: result[0] > 0 ? 'Device token unregistered' : 'Device token not found'
    };
  } catch (error) {
    logger.error(`Unregister device token error: ${error.message}`, {
      stack: error.stack,
      userId,
      token: token.substring(0, 10) + '...' // Log partial token for privacy
    });
    throw error;
  }
};

module.exports = {
  createNotification,
  createBalanceNotification,
  createPasswordResetNotification,
  createStatusChangeNotification,
  createPaymentNotification,
  createMessageDeliveryNotification,
  getUserNotifications,
  markAsRead,
  deleteNotifications,
  cleanupOldNotifications,
  getNotificationStats,
  updateNotificationSettings,
  getUserSettings,
  registerDeviceToken,
  unregisterDeviceToken
};