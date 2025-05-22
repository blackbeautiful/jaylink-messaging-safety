// backend/src/controllers/scheduled.controller.js
const smsService = require('../services/sms.service');
const notificationService = require('../services/notification.service');
const response = require('../utils/response.util');
const logger = require('../config/logger');
const { emit } = require('../utils/websocket.util');

/**
 * Get scheduled messages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getScheduledMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const options = req.query;

    const result = await smsService.getScheduledMessages(userId, options);

    return response.success(res, result, 'Scheduled messages retrieved successfully');
  } catch (error) {
    logger.error(`Get scheduled messages controller error: ${error.message}`, {
      stack: error.stack,
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
    const scheduledId = req.params.id;

    await smsService.cancelScheduledMessage(userId, scheduledId);

    return response.success(res, { success: true }, 'Scheduled message cancelled successfully');
  } catch (error) {
    logger.error(`Cancel scheduled message controller error: ${error.message}`, {
      stack: error.stack,
    });
    next(error);
  }
};

/**
 * Check for scheduled message updates
 * This endpoint allows clients to check for updates to scheduled messages
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const checkScheduledUpdates = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return response.success(res, { updates: [] }, 'No message IDs provided');
    }

    // Get updates for the provided message IDs
    const updates = await smsService.getScheduledMessageUpdates(userId, messageIds);

    return response.success(res, { updates }, 'Scheduled message updates retrieved successfully');
  } catch (error) {
    logger.error(`Check scheduled updates controller error: ${error.message}`, {
      stack: error.stack,
    });
    next(error);
  }
};

module.exports = {
  getScheduledMessages,
  cancelScheduledMessage,
  checkScheduledUpdates,
};
