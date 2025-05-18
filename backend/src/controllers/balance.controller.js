// backend/src/controllers/balance.controller.js
const balanceService = require('../services/balance.service');
const response = require('../utils/response.util');
const logger = require('../config/logger');

/**
 * Get user balance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getBalance = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const balance = await balanceService.getBalance(userId);
    
    return response.success(res, balance, 'Balance retrieved successfully');
  } catch (error) {
    logger.error(`Get balance controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get transaction history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, page = 1, limit = 20, startDate, endDate } = req.query;
    
    const transactions = await balanceService.getTransactions(userId, { 
      type, page, limit, startDate, endDate 
    });
    
    return response.success(res, transactions, 'Transactions retrieved successfully');
  } catch (error) {
    logger.error(`Get transactions controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Top up account balance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const topUp = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, paymentMethod } = req.body;
    
    const result = await balanceService.addBalance(userId, amount, paymentMethod);
    
    return response.success(res, result, 'Balance topped up successfully');
  } catch (error) {
    logger.error(`Top up controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

module.exports = {
  getBalance,
  getTransactions,
  topUp,
};