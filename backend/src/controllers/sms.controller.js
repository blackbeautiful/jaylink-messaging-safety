// backend/src/controllers/sms.controller.js - Enhanced with delete operations and improved search
const smsService = require('../services/sms.service');
const response = require('../utils/response.util');
const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');

/**
 * Send SMS message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const sendSMS = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const messageData = req.body;
    
    const result = await smsService.sendSMS(userId, messageData);
    
    return response.success(res, result, 'Message sent successfully');
  } catch (error) {
    logger.error(`Send SMS controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      messageData: req.body
    });
    next(error);
  }
};

/**
 * Send bulk SMS messages from CSV file
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const sendBulkSMS = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      throw new ApiError('CSV file is required for bulk messaging', 400);
    }
    
    const filePath = req.file.path;
    const messageData = req.body;
    
    const result = await smsService.sendBulkSMS(userId, filePath, messageData);
    
    return response.success(res, result, 'Bulk message sent successfully');
  } catch (error) {
    logger.error(`Send bulk SMS controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      messageData: req.body,
      fileName: req.file?.originalname
    });
    next(error);
  }
};

/**
 * Get message status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getMessageStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.messageId;
    
    if (!messageId) {
      throw new ApiError('Message ID is required', 400);
    }
    
    const result = await smsService.getMessageStatus(userId, messageId);
    
    return response.success(res, result, 'Message status retrieved successfully');
  } catch (error) {
    logger.error(`Get message status controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      messageId: req.params.messageId
    });
    next(error);
  }
};

/**
 * Get message history with enhanced search and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getMessageHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      type: req.query.type || null,
      status: req.query.status || null,
      search: req.query.search || null,
    };

    // Validate pagination limits
    if (options.limit > 100) {
      options.limit = 100;
    }
    
    const result = await smsService.getMessageHistory(userId, options);
    
    return response.success(res, result, 'Message history retrieved successfully');
  } catch (error) {
    logger.error(`Get message history controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      queryParams: req.query
    });
    next(error);
  }
};

/**
 * Delete a single message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.messageId;
    
    if (!messageId) {
      throw new ApiError('Message ID is required', 400);
    }
    
    const result = await smsService.deleteMessage(userId, messageId);
    
    return response.success(res, result, 'Message deleted successfully');
  } catch (error) {
    logger.error(`Delete message controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      messageId: req.params.messageId
    });
    next(error);
  }
};

/**
 * Delete multiple messages (batch delete)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const batchDeleteMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      throw new ApiError('Message IDs array is required', 400);
    }
    
    if (messageIds.length > 100) {
      throw new ApiError('Cannot delete more than 100 messages at once', 400);
    }
    
    const result = await smsService.batchDeleteMessages(userId, messageIds);
    
    return response.success(res, result, `${result.deletedCount} messages deleted successfully`);
  } catch (error) {
    logger.error(`Batch delete messages controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      messageIds: req.body?.messageIds
    });
    next(error);
  }
};

/**
 * Export message history as CSV
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const exportMessageHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const options = {
      startDate: req.query.startDate || null,
      endDate: req.query.endDate || null,
      type: req.query.type || null,
      status: req.query.status || null,
      search: req.query.search || null,
    };
    
    const csvData = await smsService.exportMessageHistory(userId, options);
    
    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=message-history.csv');
    
    return res.send(csvData);
  } catch (error) {
    logger.error(`Export message history controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      queryParams: req.query
    });
    next(error);
  }
};

/**
 * Get message analytics for dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getMessageAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const timeRange = req.query.timeRange || '30d'; // Default to 30 days
    
    const result = await smsService.getMessageAnalytics(userId, { timeRange });
    
    return response.success(res, result, 'Message analytics retrieved successfully');
  } catch (error) {
    logger.error(`Get message analytics controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      timeRange: req.query.timeRange
    });
    next(error);
  }
};

/**
 * Get scheduled messages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getScheduledMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      type: req.query.type || null,
    };

    // Validate pagination limits
    if (options.limit > 100) {
      options.limit = 100;
    }
    
    const result = await smsService.getScheduledMessages(userId, options);
    
    return response.success(res, result, 'Scheduled messages retrieved successfully');
  } catch (error) {
    logger.error(`Get scheduled messages controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      queryParams: req.query
    });
    next(error);
  }
};

/**
 * Cancel a scheduled message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const cancelScheduledMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const scheduledId = req.params.scheduledId;
    
    if (!scheduledId) {
      throw new ApiError('Scheduled message ID is required', 400);
    }
    
    const result = await smsService.cancelScheduledMessage(userId, scheduledId);
    
    return response.success(res, result, 'Scheduled message cancelled successfully');
  } catch (error) {
    logger.error(`Cancel scheduled message controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      scheduledId: req.params.scheduledId
    });
    next(error);
  }
};

/**
 * Get updates for scheduled messages (for real-time updates)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getScheduledMessageUpdates = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { messageIds } = req.body;
    
    if (!messageIds || !Array.isArray(messageIds)) {
      throw new ApiError('Message IDs array is required', 400);
    }
    
    const updates = await smsService.getScheduledMessageUpdates(userId, messageIds);
    
    return response.success(res, { updates }, 'Scheduled message updates retrieved successfully');
  } catch (error) {
    logger.error(`Get scheduled message updates controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      messageIds: req.body?.messageIds
    });
    next(error);
  }
};

/**
 * Resend a failed message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const resendMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const messageId = req.params.messageId;
    
    if (!messageId) {
      throw new ApiError('Message ID is required', 400);
    }
    
    const result = await smsService.resendMessage(userId, messageId);
    
    return response.success(res, result, 'Message resent successfully');
  } catch (error) {
    logger.error(`Resend message controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      messageId: req.params.messageId
    });
    next(error);
  }
};

/**
 * Health check for SMS service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const healthCheck = async (req, res, next) => {
  try {
    const health = await smsService.healthCheck();
    
    return response.success(res, health, 'SMS service health check completed');
  } catch (error) {
    logger.error(`SMS health check controller error: ${error.message}`, { 
      stack: error.stack
    });
    next(error);
  }
};

module.exports = {
  sendSMS,
  sendBulkSMS,
  getMessageStatus,
  getMessageHistory,
  deleteMessage,
  batchDeleteMessages,
  exportMessageHistory,
  getMessageAnalytics,
  getScheduledMessages,
  cancelScheduledMessage,
  getScheduledMessageUpdates,
  resendMessage,
  healthCheck,
};