// src/services/balance.service.js - Complete backend implementation
const { Op } = require('sequelize');
const db = require('../models');
const ApiError = require('../utils/api-error.util');
const logger = require('../config/logger');
const notificationService = require('./notification.service');
const emailService = require('./email.service');

const User = db.User;
const Transaction = db.Transaction;
const SystemSetting = db.SystemSetting;

/**
 * Get user balance
 * @param {number} userId - User ID
 * @returns {Object} User balance info
 */
const getBalance = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'balance'],
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    return {
      balance: parseFloat(user.balance),
      currency: 'USD',
      lastUpdated: new Date(),
    };
  } catch (error) {
    logger.error(`Get balance service error: ${error.message}`);
    throw error;
  }
};

/**
 * Get transaction history
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Transactions with pagination
 */
const getTransactions = async (userId, options) => {
  try {
    const { type, page = 1, limit = 20, startDate, endDate } = options;
    const offset = (page - 1) * limit;
    
    // Build where clause
    const whereClause = { userId };
    
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
    
    // Query transactions
    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    return {
      transactions: rows,
      total: count,
      page: parseInt(page, 10),
      pages: totalPages,
    };
  } catch (error) {
    logger.error(`Get transactions service error: ${error.message}`);
    throw error;
  }
};

/**
 * Add balance (for top-up)
 * @param {number} userId - User ID
 * @param {number} amount - Amount to add
 * @param {string} paymentMethod - Payment method
 * @returns {Object} Transaction result
 */
const addBalance = async (userId, amount, paymentMethod) => {
  try {
    if (amount <= 0) {
      throw new ApiError('Amount must be greater than zero', 400);
    }

    // Get user
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Start transaction
    const t = await db.sequelize.transaction();
    
    try {
      // Update balance
      const newBalance = parseFloat(user.balance) + parseFloat(amount);
      await user.update({ balance: newBalance }, { transaction: t });
      
      // Create transaction record
      const transaction = await Transaction.create({
        userId,
        transactionId: `TOP-${Date.now()}`,
        type: 'credit',
        amount: parseFloat(amount),
        balanceAfter: newBalance,
        service: 'top-up',
        status: 'completed',
        description: `Account top-up via ${paymentMethod}`,
      }, { transaction: t });
      
      // Commit transaction
      await t.commit();
      
      // Create notification
      notificationService.createNotification(
        userId,
        'Balance Updated',
        `Your account has been credited with $${amount.toFixed(2)} via ${paymentMethod}.`,
        'success'
      ).catch(err => logger.error(`Failed to create notification: ${err.message}`));
      
      return {
        transactionId: transaction.transactionId,
        status: transaction.status,
        amount: parseFloat(amount),
        balance: newBalance,
      };
    } catch (error) {
      // Rollback transaction
      await t.rollback();
      throw error;
    }
  } catch (error) {
    logger.error(`Add balance service error: ${error.message}`);
    throw error;
  }
};

/**
 * Deduct balance (for services)
 * @param {number} userId - User ID
 * @param {number} amount - Amount to deduct
 * @param {string} service - Service type
 * @param {string} description - Transaction description
 * @returns {Object} Transaction result
 */
const deductBalance = async (userId, amount, service, description) => {
  try {
    if (amount <= 0) {
      throw new ApiError('Amount must be greater than zero', 400);
    }

    // Get user
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Check if balance is sufficient
    if (parseFloat(user.balance) < parseFloat(amount)) {
      throw new ApiError('Insufficient balance', 400);
    }

    // Start transaction
    const t = await db.sequelize.transaction();
    
    try {
      // Update balance
      const newBalance = parseFloat(user.balance) - parseFloat(amount);
      await user.update({ balance: newBalance }, { transaction: t });
      
      // Create transaction record
      const transaction = await Transaction.create({
        userId,
        transactionId: `SRV-${Date.now()}`,
        type: 'debit',
        amount: parseFloat(amount),
        balanceAfter: newBalance,
        service,
        status: 'completed',
        description,
      }, { transaction: t });
      
      // Commit transaction
      await t.commit();
      
      // Check if balance is below threshold and send alert if needed
      checkLowBalance(userId, newBalance).catch(err => 
        logger.error(`Failed to check low balance: ${err.message}`)
      );
      
      return {
        transactionId: transaction.transactionId,
        status: transaction.status,
        amount: parseFloat(amount),
        balance: newBalance,
      };
    } catch (error) {
      // Rollback transaction
      await t.rollback();
      throw error;
    }
  } catch (error) {
    logger.error(`Deduct balance service error: ${error.message}`);
    throw error;
  }
};

/**
 * Process payment (for handling payment gateway responses)
 * @param {number} userId - User ID
 * @param {string} paymentId - Payment gateway reference ID
 * @param {number} amount - Payment amount
 * @param {string} status - Payment status
 * @returns {Object} Payment result
 */
const processPayment = async (userId, paymentId, amount, status) => {
  try {
    // Get user
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Start transaction
    const t = await db.sequelize.transaction();
    
    try {
      let transaction;
      
      if (status === 'success') {
        // Update balance
        const newBalance = parseFloat(user.balance) + parseFloat(amount);
        await user.update({ balance: newBalance }, { transaction: t });
        
        // Create transaction record
        transaction = await Transaction.create({
          userId,
          transactionId: `PMT-${paymentId}`,
          type: 'credit',
          amount: parseFloat(amount),
          balanceAfter: newBalance,
          service: 'payment',
          status: 'completed',
          description: `Payment processed successfully. Reference: ${paymentId}`,
        }, { transaction: t });
        
        // Create notification
        notificationService.createNotification(
          userId,
          'Payment Successful',
          `Your payment of $${amount.toFixed(2)} has been processed successfully.`,
          'success'
        ).catch(err => logger.error(`Failed to create notification: ${err.message}`));
      } else {
        // Create failed transaction record without updating balance
        transaction = await Transaction.create({
          userId,
          transactionId: `PMT-${paymentId}`,
          type: 'credit',
          amount: parseFloat(amount),
          balanceAfter: user.balance,
          service: 'payment',
          status: 'failed',
          description: `Payment failed. Reference: ${paymentId}`,
        }, { transaction: t });
        
        // Create notification
        notificationService.createNotification(
          userId,
          'Payment Failed',
          `Your payment of $${amount.toFixed(2)} failed to process. Please try again or contact support.`,
          'error'
        ).catch(err => logger.error(`Failed to create notification: ${err.message}`));
      }
      
      // Commit transaction
      await t.commit();
      
      return {
        success: status === 'success',
        transactionId: transaction.transactionId,
        paymentId,
        amount: parseFloat(amount),
        balance: parseFloat(user.balance) + (status === 'success' ? parseFloat(amount) : 0),
      };
    } catch (error) {
      // Rollback transaction
      await t.rollback();
      throw error;
    }
  } catch (error) {
    logger.error(`Process payment service error: ${error.message}`);
    throw error;
  }
};

/**
 * Check if user's balance is below threshold and send alert if needed
 * @param {number} userId - User ID
 * @param {number} balance - Current balance
 */
const checkLowBalance = async (userId, balance) => {
  try {
    // Get user
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Get minimum balance threshold from system settings
    const settingRow = await SystemSetting.findOne({ 
      where: { settingKey: 'minimumBalanceThreshold' } 
    });
    
    if (!settingRow) {
      logger.warn('Minimum balance threshold setting not found');
      return;
    }
    
    const threshold = parseFloat(settingRow.settingValue);
    
    // Check if balance is below threshold
    if (balance < threshold) {
      // Get user settings to check if low balance alerts are enabled
      const userSettings = await db.Setting.findOne({
        where: { 
          userId,
          category: 'notifications'
        }
      });
      
      const notificationSettings = userSettings?.settings || {};
      
      // Send email alert if enabled
      if (notificationSettings.lowBalanceAlerts !== false) {
        emailService.sendLowBalanceEmail(user, balance, threshold)
          .catch(err => logger.error(`Failed to send low balance email: ${err.message}`));
      }
      
      // Create in-app notification
      notificationService.createNotification(
        userId,
        'Low Balance Alert',
        `Your account balance is below the recommended minimum. Current balance: $${balance.toFixed(2)}`,
        'warning'
      ).catch(err => logger.error(`Failed to create notification: ${err.message}`));
    }
  } catch (error) {
    logger.error(`Check low balance error: ${error.message}`);
    // Don't throw the error as this is a background operation
  }
};

/**
 * Get balance summary with recent transactions
 * @param {number} userId - User ID
 * @returns {Object} Balance summary
 */
const getBalanceSummary = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'balance'],
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Get recent transactions (last 5)
    const recentTransactions = await Transaction.findAll({
      where: { userId },
      limit: 5,
      order: [['createdAt', 'DESC']],
    });
    
    // Calculate spending for current month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthlySpending = await Transaction.sum('amount', {
      where: {
        userId,
        type: 'debit',
        createdAt: {
          [Op.gte]: startOfMonth,
        },
      },
    }) || 0;
    
    // Get transaction count
    const transactionCount = await Transaction.count({
      where: { userId },
    });

    return {
      balance: parseFloat(user.balance),
      currency: 'USD',
      recentTransactions,
      monthlySpending,
      transactionCount,
      lastUpdated: new Date(),
    };
  } catch (error) {
    logger.error(`Get balance summary service error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getBalance,
  getTransactions,
  addBalance,
  deductBalance,
  processPayment,
  checkLowBalance,
  getBalanceSummary,
};