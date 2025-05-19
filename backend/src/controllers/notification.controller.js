// backend/src/controllers/notification.controller.js
const notificationService = require('../services/notification.service');
const response = require('../utils/response.util');
const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');

/**
 * Get user notifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getNotifications = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const options = {
      page: parseInt(req.query.page, 10) || 1,
      limit: parseInt(req.query.limit, 10) || 20,
      read: req.query.read,
      type: req.query.type,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const result = await notificationService.getUserNotifications(userId, options);
    
    return response.success(res, result, 'Notifications retrieved successfully');
  } catch (error) {
    logger.error(`Get notifications controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * Get notification statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getNotificationStats = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const result = await notificationService.getNotificationStats(userId);
    
    return response.success(res, result, 'Notification statistics retrieved successfully');
  } catch (error) {
    logger.error(`Get notification stats controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * Mark notifications as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const markAsRead = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    let notificationIds;
    
    // Check if marking all as read
    if (req.body.all === true || req.body.all === 'true') {
      notificationIds = 'all';
    } else {
      // Get notification IDs from request body
      notificationIds = req.body.notificationIds;
      
      if (!notificationIds || (Array.isArray(notificationIds) && notificationIds.length === 0)) {
        throw new ApiError('Notification IDs are required', 400);
      }
    }
    
    const result = await notificationService.markAsRead(userId, notificationIds);
    
    return response.success(res, result, 'Notifications marked as read successfully');
  } catch (error) {
    logger.error(`Mark as read controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * Mark a single notification as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const markOneAsRead = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    if (!notificationId) {
      throw new ApiError('Notification ID is required', 400);
    }
    
    const result = await notificationService.markAsRead(userId, notificationId);
    
    return response.success(res, result, 'Notification marked as read successfully');
  } catch (error) {
    logger.error(`Mark one as read controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      notificationId: req.params.id
    });
    next(error);
  }
};

/**
 * Delete notifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteNotifications = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const notificationIds = req.body.notificationIds;
    
    if (!notificationIds || (Array.isArray(notificationIds) && notificationIds.length === 0)) {
      throw new ApiError('Notification IDs are required', 400);
    }
    
    const result = await notificationService.deleteNotifications(userId, notificationIds);
    
    return response.success(res, result, 'Notifications deleted successfully');
  } catch (error) {
    logger.error(`Delete notifications controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * Delete a single notification
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteNotification = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const notificationId = req.params.id;
    
    if (!notificationId) {
      throw new ApiError('Notification ID is required', 400);
    }
    
    const result = await notificationService.deleteNotifications(userId, notificationId);
    
    return response.success(res, result, 'Notification deleted successfully');
  } catch (error) {
    logger.error(`Delete notification controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      notificationId: req.params.id
    });
    next(error);
  }
};

/**
 * Create a test notification (for development/testing)
 * Only available in development mode
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createTestNotification = async (req, res, next) => {
  try {
    // Only allow in development mode
    if (process.env.NODE_ENV !== 'development') {
      throw new ApiError('This endpoint is only available in development mode', 403);
    }
    
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const { title, message, type = 'info', metadata } = req.body;
    
    if (!title || !message) {
      throw new ApiError('Title and message are required', 400);
    }
    
    const notification = await notificationService.createNotification(
      userId,
      title,
      message,
      type,
      metadata || {}
    );
    
    return response.success(res, { notification }, 'Test notification created successfully');
  } catch (error) {
    logger.error(`Create test notification controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id
    });
    next(error);
  }
};

module.exports = {
  getNotifications,
  getNotificationStats,
  markAsRead,
  markOneAsRead,
  deleteNotifications,
  deleteNotification,
  createTestNotification
};