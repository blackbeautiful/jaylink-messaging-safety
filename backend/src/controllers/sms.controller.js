// backend/src/controllers/sms.controller.js
const smsService = require('../services/sms.service');
const response = require('../utils/response.util');
const logger = require('../config/logger');

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
    logger.error(`Send SMS controller error: ${error.message}`, { stack: error.stack });
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
    const filePath = req.file.path;
    const messageData = req.body;
    
    const result = await smsService.sendBulkSMS(userId, filePath, messageData);
    
    return response.success(res, result, 'Bulk message sent successfully');
  } catch (error) {
    logger.error(`Send bulk SMS controller error: ${error.message}`, { stack: error.stack });
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
    
    const result = await smsService.getMessageStatus(userId, messageId);
    
    return response.success(res, result, 'Message status retrieved successfully');
  } catch (error) {
    logger.error(`Get message status controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get message history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getMessageHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const options = req.query;
    
    const result = await smsService.getMessageHistory(userId, options);
    
    return response.success(res, result, 'Message history retrieved successfully');
  } catch (error) {
    logger.error(`Get message history controller error: ${error.message}`, { stack: error.stack });
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
    
    const result = await smsService.getMessageAnalytics(userId);
    
    return response.success(res, result, 'Message analytics retrieved successfully');
  } catch (error) {
    logger.error(`Get message analytics controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

module.exports = {
  sendSMS,
  sendBulkSMS,
  getMessageStatus,
  getMessageHistory,
  getMessageAnalytics,
};