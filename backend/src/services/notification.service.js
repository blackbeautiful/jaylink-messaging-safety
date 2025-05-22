// backend/src/services/notification.service.js
/**
 * Enhanced Notification Service with WebSocket Integration
 * Optimized for real-time delivery with fallback mechanisms
 */
const { Op } = require('sequelize');
const db = require('../models');
const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');
const config = require('../config/config');
const emailService = require('./email.service');
const websocket = require('../utils/websocket.util');
const Queue = require('../utils/queue.util');

const User = db.User;
const Notification = db.Notification;
const Setting = db.Setting;
const DeviceToken = db.DeviceToken;

// Create push notification queue with optimized settings
const pushQueue = new Queue('pushNotifications', {
  limiter: { max: 300, duration: 60000 }, // 300 jobs per minute
  removeOnComplete: true, 
  removeOnFail: 1000 // Keep last 1000 failed jobs for debugging
});

/**
 * Create a notification for a user with WebSocket delivery
 * @param {number} userId - User ID to notify
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, success, warning, error)
 * @param {Object} metadata - Additional notification metadata
 * @param {boolean} sendEmail - Whether to send an email notification
 * @param {boolean} sendPush - Whether to send a push notification
 * @param {boolean} sendWebSocket - Whether to send a WebSocket notification
 * @returns {Object} Created notification
 */
const createNotification = async (userId, title, message, type = 'info', metadata = {}, 
                                 sendEmail = false, sendPush = true, sendWebSocket = true) => {
  try {
    // Check if user exists
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Check user notification settings
    const userSettings = await getUserNotificationSettings(userId);
    
    // Check if notifications are enabled for this type
    const settingKey = `${type}Notifications`;
    if (userSettings[settingKey] === false) {
      logger.debug(`${type} notifications disabled for user ${userId}`);
      return null;
    }
    
    // Determine delivery channels based on user settings
    const shouldSendPush = sendPush && 
                          userSettings.pushNotifications !== false && 
                          config.notifications.pushEnabled;
                          
    const shouldSendEmail = sendEmail && 
                          userSettings.emailAlerts !== false;
                          
    const shouldSendWebSocket = sendWebSocket && 
                              config.websocket?.enabled !== false &&
                              websocket.isInitialized();
    
    // Initial status for push and email
    const pushStatus = shouldSendPush ? 'pending' : 'not_applicable';
    const emailStatus = shouldSendEmail ? 'pending' : 'not_applicable';
    const wsStatus = shouldSendWebSocket ? 'pending' : 'not_applicable';
    
    // Create notification record
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
      metadata,
      read: false,
      pushStatus,
      emailStatus,
      wsStatus
    });
    
    // Process WebSocket notification immediately (for real-time experience)
    if (shouldSendWebSocket) {
      try {
        const wsDelivered = processWebSocketNotification(userId, notification.id, title, message, type, metadata);
        
        // Update WebSocket status based on delivery
        if (wsDelivered) {
          await notification.update({ wsStatus: 'sent' });
        } else {
          // If WebSocket failed but we have push or email fallbacks, mark as pending_retry
          // This allows the background job to attempt delivery again
          const hasOtherChannels = shouldSendPush || shouldSendEmail;
          await notification.update({ 
            wsStatus: hasOtherChannels ? 'pending_retry' : 'failed' 
          });
        }
      } catch (wsError) {
        logger.error(`WebSocket notification error: ${wsError.message}`, { 
          userId, 
          notificationId: notification.id 
        });
        await notification.update({ wsStatus: 'failed' });
      }
    }
    
    // Process push notification if needed (in background)
    if (shouldSendPush) {
      processPushNotification(userId, notification.id, title, message, type, metadata)
        .catch(err => logger.error(`Push notification error: ${err.message}`, { 
          userId, 
          notificationId: notification.id,
          error: err.message
        }));
    }
    
    // Process email notification if needed (in background)
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
 * Get user notification settings with caching
 * @param {number} userId - User ID
 * @returns {Object} User notification settings
 */
const getUserNotificationSettings = async (userId) => {
  try {
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
    return {
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
  } catch (error) {
    logger.error(`Get user notification settings error: ${error.message}`, {
      userId
    });
    
    // Return default settings on error to ensure notifications still work
    return {
      emailAlerts: true,
      pushNotifications: true,
      infoNotifications: true,
      successNotifications: true,
      warningNotifications: true,
      errorNotifications: true
    };
  }
};

/**
 * Process WebSocket notification (immediate delivery)
 * @param {number} userId - User ID
 * @param {number} notificationId - Notification ID
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} type - Notification type
 * @param {Object} metadata - Additional notification metadata
 * @returns {boolean} True if successfully delivered
 */
const processWebSocketNotification = (userId, notificationId, title, message, type, metadata) => {
  try {
    if (!websocket.isInitialized()) {
      return false;
    }
    
    // Prepare notification payload
    const payload = {
      id: notificationId,
      title,
      message,
      type,
      metadata,
      timestamp: new Date().toISOString(),
      read: false
    };
    
    // Send to user's channel
    const sentCount = websocket.emit(`user:${userId}`, 'notification', payload);
    
    // Return true if delivered to at least one client
    return sentCount > 0;
  } catch (error) {
    logger.error(`WebSocket notification error: ${error.message}`, {
      userId,
      notificationId
    });
    return false;
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
    // Add to queue for processing with improved error handling and backoff
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
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 5000 // 5 seconds initial delay, then exponential backoff
      },
      removeOnComplete: true,
      removeOnFail: 100, // Keep the last 100 failed jobs
      timeout: 30000, // 30 second timeout for processing
      priority: getPriorityForNotificationType(type)
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
 * Get priority based on notification type
 * @private
 */
const getPriorityForNotificationType = (type) => {
  switch (type) {
    case 'error':
      return 1; // Highest priority
    case 'warning':
      return 2;
    case 'success':
      return 3;
    case 'info':
    default:
      return 4; // Lowest priority
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
        firstName: user.firstName || user.name || 'User',
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
                  newBalance < (config.systemDefaults?.minimumBalanceThreshold || 500);
  
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
 * Create a notification for scheduled message status
 * @param {number} userId - User ID to notify
 * @param {string} scheduleId - Scheduled message ID
 * @param {string} status - Status (sent, failed)
 * @param {number} recipients - Number of recipients
 * @param {Object} additionalData - Additional data
 * @returns {Object} Created notification
 */
const createScheduledMessageStatusNotification = async (userId, scheduleId, status, recipients, additionalData = {}) => {
  let title, message, type, sendEmail;
  
  if (status === 'sent') {
    title = 'Scheduled Message Sent';
    message = `Your scheduled message to ${recipients} recipient(s) has been sent successfully.`;
    type = 'success';
    sendEmail = false;
  } else if (status === 'failed') {
    title = 'Scheduled Message Failed';
    message = `Your scheduled message to ${recipients} recipient(s) could not be sent. ${additionalData.errorMessage || ''}`;
    type = 'error';
    sendEmail = true;
  } else {
    title = 'Scheduled Message Update';
    message = `Your scheduled message to ${recipients} recipient(s) has been updated to status: ${status}.`;
    type = 'info';
    sendEmail = false;
  }
  
  const metadata = { 
    scheduleId,
    status,
    recipients,
    ...additionalData,
    timestamp: new Date().toISOString()
  };
  
  // WebSocket notification is ideal for scheduled message status updates
  return createNotification(userId, title, message, type, metadata, sendEmail, true, true);
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
 * Mark notifications as read with WebSocket update
 * @param {number} userId - User ID
 * @param {number|Array|string} notificationIds - Notification ID(s) to mark as read or 'all'
 * @returns {Object} Success status with count
 */
const markAsRead = async (userId, notificationIds) => {
  try {
    let updatedIds = [];
    
    // If notificationIds is 'all', mark all as read
    if (notificationIds === 'all') {
      // Find all unread notifications first to get their IDs
      const unreadNotifications = await Notification.findAll({
        attributes: ['id'],
        where: { userId, read: false }
      });
      
      updatedIds = unreadNotifications.map(n => n.id);
      
      // Update all unread notifications
      const result = await Notification.update(
        { read: true },
        { where: { userId, read: false } }
      );
      
      // Send WebSocket update if WebSockets are enabled
      if (websocket.isInitialized() && updatedIds.length > 0) {
        websocket.emit(`user:${userId}`, 'notifications_read', {
          ids: updatedIds,
          all: true,
          timestamp: new Date().toISOString()
        });
      }
      
      return {
        success: true,
        updated: result[0],
        ids: updatedIds,
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
    
    // Send WebSocket update if WebSockets are enabled
    if (websocket.isInitialized() && result[0] > 0) {
      websocket.emit(`user:${userId}`, 'notifications_read', {
        ids,
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      success: true,
      updated: result[0],
      ids,
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
 * Delete notifications with WebSocket update
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
    
    // Send WebSocket update if WebSockets are enabled
    if (websocket.isInitialized() && deleted > 0) {
      websocket.emit(`user:${userId}`, 'notifications_deleted', {
        ids,
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      success: true,
      deleted,
      ids,
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
    const retentionDays = days || config.notifications?.retentionDays || 30;
    
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
 * Get scheduled message updates for polling
 * @param {number} userId - User ID
 * @param {Array<string>} messageIds - Array of scheduled message IDs
 * @returns {Array} Array of updated messages
 */
const getScheduledMessageUpdates = async (userId, messageIds) => {
  try {
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return [];
    }
    
    // Query for notifications related to these message IDs
    // that were created recently (last 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const notifications = await Notification.findAll({
      where: {
        userId,
        createdAt: { [Op.gte]: fiveMinutesAgo },
        metadata: {
          [Op.and]: [
            { [Op.ne]: null },
            Sequelize.where(
              Sequelize.fn('JSON_EXTRACT', Sequelize.col('metadata'), '$.scheduleId'),
              { [Op.in]: messageIds }
            )
          ]
        }
      },
      order: [['createdAt', 'DESC']]
    });
    
    // Format the updates
    const updates = notifications.map(notification => {
      try {
        const metadata = notification.metadata || {};
        
        return {
          id: metadata.scheduleId,
          status: metadata.status || 'unknown',
          recipientCount: metadata.recipients || 0,
          messageId: metadata.messageId,
          errorMessage: metadata.errorMessage,
          timestamp: notification.createdAt.toISOString()
        };
      } catch (error) {
        logger.error(`Error formatting notification update: ${error.message}`, {
          notificationId: notification.id
        });
        return null;
      }
    }).filter(Boolean); // Remove any null values
    
    return updates;
  } catch (error) {
    logger.error(`Get scheduled message updates error: ${error.message}`, {
      userId,
      messageIds
    });
    return [];
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
  createScheduledMessageStatusNotification,
  getUserNotifications,
  markAsRead,
  deleteNotifications,
  cleanupOldNotifications,
  getNotificationStats,
  getScheduledMessageUpdates,
  updateNotificationSettings,
  getUserNotificationSettings,
  registerDeviceToken,
  unregisterDeviceToken
};