const smsService = require('../services/sms.service');
const response = require('../utils/response.util');
const logger = require('../config/logger');

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
    logger.error(`Get scheduled messages controller error: ${error.message}`, { stack: error.stack });
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
    logger.error(`Cancel scheduled message controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

module.exports = {
  getScheduledMessages,
  cancelScheduledMessage,
};