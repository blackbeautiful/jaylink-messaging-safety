// backend/src/services/balance.service.js - FIXED VERSION with duplicate prevention
const { Op } = require('sequelize');
const db = require('../models');
const ApiError = require('../utils/api-error.util');
const logger = require('../config/logger');
const notificationService = require('./notification.service');
const emailService = require('./email.service');
const { generateUniqueId } = require('../utils/id.util');
const config = require('../config/config');

const User = db.User;
const Transaction = db.Transaction;
const SystemSetting = db.SystemSetting;

// Get currency configuration
const currency = config.currency;

/**
 * Process payment - FIXED with duplicate prevention and proper error handling
 * @param {number} userId - User ID
 * @param {string} paymentId - Payment gateway reference ID
 * @param {number} amount - Payment amount
 * @param {string} status - Payment status
 * @param {string} paymentMethod - Payment method
 * @returns {Object} Payment result
 */
const processPayment = async (userId, paymentId, amount, status, paymentMethod = 'Paystack') => {
  try {
    // FIXED: Check if transaction already exists to prevent duplicates
    const existingTransaction = await Transaction.findOne({
      where: {
        transactionId: `PMT-${paymentId}`
      }
    });

    if (existingTransaction) {
      logger.info(`Transaction already exists for payment: ${paymentId}`, {
        userId,
        paymentId,
        existingTransactionId: existingTransaction.transactionId,
        existingStatus: existingTransaction.status
      });

      // Return existing transaction details
      return {
        success: existingTransaction.status === 'completed',
        transactionId: existingTransaction.transactionId,
        paymentId,
        amount: parseFloat(existingTransaction.amount),
        balance: parseFloat(existingTransaction.balanceAfter),
        currency: currency.code,
        currencySymbol: currency.symbol,
        message: 'Transaction already processed',
        alreadyProcessed: true
      };
    }

    // Get user
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Start transaction
    const t = await db.sequelize.transaction();
    
    try {
      let transaction;
      let newBalance = parseFloat(user.balance);
      
      if (status === 'success') {
        // Update balance
        newBalance = parseFloat(user.balance) + parseFloat(amount);
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
          description: `Payment processed successfully via ${paymentMethod}. Reference: ${paymentId}`,
        }, { transaction: t });
        
        logger.info('Payment processed successfully', {
          userId,
          paymentId,
          amount: parseFloat(amount),
          newBalance,
          transactionId: transaction.transactionId
        });

        // Create notification
        if (notificationService && notificationService.createNotification) {
          notificationService.createNotification(
            userId,
            'Payment Successful',
            `Your payment of ${currency.symbol}${amount.toFixed(2)} has been processed successfully.`,
            'success'
          ).catch(err => logger.error(`Failed to create notification: ${err.message}`));
        }
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
          description: `Payment failed via ${paymentMethod}. Reference: ${paymentId}`,
        }, { transaction: t });
        
        logger.warn('Payment failed - transaction recorded', {
          userId,
          paymentId,
          amount: parseFloat(amount),
          transactionId: transaction.transactionId
        });

        // Create notification
        if (notificationService && notificationService.createNotification) {
          notificationService.createNotification(
            userId,
            'Payment Failed',
            `Your payment of ${currency.symbol}${amount.toFixed(2)} failed to process. Please try again or contact support.`,
            'error'
          ).catch(err => logger.error(`Failed to create notification: ${err.message}`));
        }
      }
      
      // Commit transaction
      await t.commit();
      
      return {
        success: status === 'success',
        transactionId: transaction.transactionId,
        paymentId,
        amount: parseFloat(amount),
        balance: newBalance,
        currency: currency.code,
        currencySymbol: currency.symbol,
      };
    } catch (error) {
      // Rollback transaction
      await t.rollback();
      throw error;
    }
  } catch (error) {
    logger.error(`Process payment service error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      paymentId,
      amount,
      status
    });
    throw error;
  }
};

/**
 * Process Paystack webhook payment notification - FIXED with better error handling
 * @param {Object} webhookData - Webhook data from Paystack
 * @returns {Object} Processing result
 */
const processPaystackWebhook = async (webhookData) => {
  try {
    const { reference, amount, status, userId } = webhookData;
    
    logger.info('Processing Paystack webhook', {
      reference,
      amount,
      status,
      userId,
      eventType: webhookData.eventType
    });
    
    if (!userId) {
      logger.warn('Paystack webhook missing userId', { reference, webhookData });
      throw new ApiError('User ID not found in payment metadata', 400);
    }
    
    // Validate amount
    if (!amount || amount <= 0) {
      logger.warn('Invalid amount in webhook', { reference, amount, webhookData });
      throw new ApiError('Invalid amount in webhook data', 400);
    }
    
    // Map Paystack status to our system status
    let paymentStatus;
    if (status === 'completed' || status === 'success') {
      paymentStatus = 'success';
    } else if (status === 'failed' || status === 'abandoned') {
      paymentStatus = 'failed';
    } else {
      paymentStatus = 'pending';
    }
    
    // Only process completed or failed payments
    if (paymentStatus === 'pending') {
      logger.info('Payment still pending, no action taken', {
        reference,
        status,
        userId
      });
      return {
        processed: false,
        reference,
        status: paymentStatus,
        message: 'Payment still pending, no action taken'
      };
    }
    
    // Process the payment
    const result = await processPayment(
      userId,
      reference,
      amount, // Amount should already be in Naira from webhook processing
      paymentStatus,
      'Paystack'
    );
    
    logger.info('Webhook processing completed', {
      reference,
      status: paymentStatus,
      amount,
      userId,
      transactionId: result.transactionId,
      alreadyProcessed: result.alreadyProcessed || false
    });
    
    return {
      processed: true,
      reference,
      status: paymentStatus,
      transactionId: result.transactionId,
      amount: amount,
      currency: currency.code,
      alreadyProcessed: result.alreadyProcessed || false
    };
  } catch (error) {
    logger.error(`Process Paystack webhook error: ${error.message}`, { 
      stack: error.stack,
      reference: webhookData.reference,
      userId: webhookData.userId,
      amount: webhookData.amount
    });
    throw error;
  }
};

// Keep all other existing functions unchanged...

/**
 * Get user balance
 * @param {number} userId - User ID
 * @returns {number} User balance amount
 */
const getUserBalance = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: ['id', 'balance'],
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    return parseFloat(user.balance);
  } catch (error) {
    logger.error(`Get user balance error: ${error.message}`, { stack: error.stack, userId });
    throw error;
  }
};

/**
 * Get user balance with additional info
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
      currency: currency.code,
      currencySymbol: currency.symbol,
      lastUpdated: new Date(),
    };
  } catch (error) {
    logger.error(`Get balance service error: ${error.message}`, { stack: error.stack, userId });
    throw error;
  }
};

/**
 * Get transaction history
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Transactions with pagination
 */
const getTransactions = async (userId, options = {}) => {
  const { type, page = 1, limit = 20, startDate = null, endDate = null, status = null } = options;
  const offset = (page - 1) * limit;

  try {
    // Build where clause
    const whereClause = { userId };
    
    if (type && type !== 'all') {
      whereClause.type = type;
    }
    
    if (status && status !== 'all') {
      whereClause.status = status;
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
        [Op.lte]: new Date(endDate)
      };
    }
    
    // Query transactions
    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    
    // Format transaction amounts with currency information
    const transactions = rows.map(transaction => {
      const transObj = transaction.toJSON();
      transObj.currencyCode = currency.code;
      transObj.currencySymbol = currency.symbol;
      return transObj;
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    return {
      transactions,
      pagination: {
        total: count,
        totalPages,
        currentPage: parseInt(page, 10),
        limit: parseInt(limit, 10),
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      currency: {
        code: currency.code,
        symbol: currency.symbol,
        name: currency.name
      }
    };
  } catch (error) {
    logger.error(`Get transactions service error: ${error.message}`, { stack: error.stack, userId, options });
    throw error;
  }
};

/**
 * Get enhanced transactions with better filtering and search
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Transactions with pagination and analytics
 */
const getEnhancedTransactions = async (userId, options = {}) => {
  const {
    page = 1,
    limit = 20,
    startDate = null,
    endDate = null,
    type = null,
    status = null,
    search = null,
    sortBy = 'createdAt',
    sortOrder = 'DESC'
  } = options;

  const offset = (page - 1) * limit;

  try {
    // Build where conditions
    const whereConditions = { userId };

    // Add date range if provided
    if (startDate && endDate) {
      whereConditions.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereConditions.createdAt = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereConditions.createdAt = {
        [Op.lte]: new Date(endDate),
      };
    }

    // Add transaction type filter if provided
    if (type && type !== 'all') {
      whereConditions.type = type;
    }

    // Add status filter if provided
    if (status && status !== 'all') {
      whereConditions.status = status;
    }

    // Enhanced search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();
      
      whereConditions[Op.or] = [
        // Search in transaction ID
        db.sequelize.where(
          db.sequelize.fn('LOWER', db.sequelize.col('transactionId')),
          'LIKE',
          `%${searchTerm.toLowerCase()}%`
        ),
        // Search in description
        db.sequelize.where(
          db.sequelize.fn('LOWER', db.sequelize.col('description')),
          'LIKE',
          `%${searchTerm.toLowerCase()}%`
        ),
        // Search in service
        db.sequelize.where(
          db.sequelize.fn('LOWER', db.sequelize.col('service')),
          'LIKE',
          `%${searchTerm.toLowerCase()}%`
        ),
      ];
    }

    // Query database with pagination
    const { count, rows } = await Transaction.findAndCountAll({
      where: whereConditions,
      order: [[sortBy, sortOrder.toUpperCase()]],
      limit: parseInt(limit, 10),
      offset,
    });

    // Format transactions with currency information
    const transactions = rows.map(transaction => {
      const transObj = transaction.toJSON();
      transObj.currencyCode = currency.code;
      transObj.currencySymbol = currency.symbol;
      return transObj;
    });

    // Calculate pagination details
    const totalPages = Math.ceil(count / limit);

    // Calculate analytics for current result set
    const analytics = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'credit') {
        acc.totalCredits += transaction.amount;
        acc.creditCount += 1;
      } else {
        acc.totalDebits += transaction.amount;
        acc.debitCount += 1;
      }
      
      if (transaction.status === 'completed') {
        acc.completedCount += 1;
      } else if (transaction.status === 'pending') {
        acc.pendingCount += 1;
      } else if (transaction.status === 'failed') {
        acc.failedCount += 1;
      }
      
      return acc;
    }, {
      totalCredits: 0,
      totalDebits: 0,
      creditCount: 0,
      debitCount: 0,
      completedCount: 0,
      pendingCount: 0,
      failedCount: 0
    });

    return {
      transactions,
      pagination: {
        total: count,
        totalPages,
        currentPage: parseInt(page, 10),
        limit: parseInt(limit, 10),
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      analytics,
      currency: {
        code: currency.code,
        symbol: currency.symbol,
        name: currency.name
      }
    };
  } catch (error) {
    logger.error(`Get enhanced transactions error: ${error.message}`, {
      stack: error.stack,
      userId,
      options,
    });
    throw error;
  }
};

/**
 * Export transaction history as CSV
 * @param {number} userId - User ID
 * @param {Object} options - Export options
 * @returns {string} CSV data
 */
const exportTransactionHistory = async (userId, options = {}) => {
  try {
    const { 
      startDate = null, 
      endDate = null, 
      type = null, 
      status = null
    } = options;
    
    // Validate user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Build where conditions
    const whereConditions = { userId };
    
    // Add date range if provided
    if (startDate && endDate) {
      whereConditions.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereConditions.createdAt = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereConditions.createdAt = {
        [Op.lte]: new Date(endDate),
      };
    }
    
    // Add transaction type filter if provided
    if (type && type !== 'all') {
      whereConditions.type = type;
    }
    
    // Add status filter if provided
    if (status && status !== 'all') {
      whereConditions.status = status;
    }
    
    // Query all transactions without pagination for export
    const transactions = await Transaction.findAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit: 10000, // Reasonable limit for export
    });
    
    // Convert to CSV format
    const csvHeaders = [
      'Date & Time',
      'Transaction ID',
      'Type',
      'Amount',
      'Balance After',
      'Service',
      'Status',
      'Description',
      'Currency'
    ];
    
    const csvRows = transactions.map(transaction => {
      return [
        new Date(transaction.createdAt).toISOString(),
        transaction.transactionId || '',
        transaction.type || '',
        transaction.amount || 0,
        transaction.balanceAfter || 0,
        transaction.service || '',
        transaction.status || '',
        `"${(transaction.description || '').replace(/"/g, '""')}"`, // Escape quotes
        currency.code || 'NGN'
      ];
    });
    
    // Combine headers and rows
    const csvData = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n');
    
    logger.info(`Transaction history exported`, { 
      userId, 
      exportedCount: transactions.length,
      filters: options
    });
    
    return csvData;
  } catch (error) {
    logger.error(`Export transaction history error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      options
    });
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
      const transactionId = generateUniqueId('top');
      const transaction = await Transaction.create({
        userId,
        transactionId,
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
      if (notificationService && notificationService.createBalanceNotification) {
        notificationService.createBalanceNotification(
          userId, 
          'add',
          amount, 
          newBalance
        ).catch(err => logger.error(`Failed to create notification: ${err.message}`));
      }
      
      return {
        transactionId: transaction.transactionId,
        status: transaction.status,
        amount: parseFloat(amount),
        balance: newBalance,
        currency: currency.code,
        currencySymbol: currency.symbol,
      };
    } catch (error) {
      // Rollback transaction
      await t.rollback();
      throw error;
    }
  } catch (error) {
    logger.error(`Add balance service error: ${error.message}`, { stack: error.stack, userId, amount, paymentMethod });
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
      const transactionId = generateUniqueId(service);
      const transaction = await Transaction.create({
        userId,
        transactionId,
        type: 'debit',
        amount: parseFloat(amount),
        balanceAfter: newBalance,
        service,
        status: 'completed',
        description,
      }, { transaction: t });
      
      // Commit transaction
      await t.commit();
      
      // Create deduction notification
      if (notificationService && notificationService.createBalanceNotification) {
        notificationService.createBalanceNotification(
          userId, 
          'deduct',
          amount, 
          newBalance
        ).catch(err => logger.error(`Failed to create notification: ${err.message}`));
      }
      
      // Check if balance is below threshold and send alert if needed
      checkLowBalance(userId, newBalance).catch(err => 
        logger.error(`Failed to check low balance: ${err.message}`)
      );
      
      return {
        transactionId: transaction.transactionId,
        status: transaction.status,
        amount: parseFloat(amount),
        balance: newBalance,
        currency: currency.code,
        currencySymbol: currency.symbol,
      };
    } catch (error) {
      // Rollback transaction
      await t.rollback();
      throw error;
    }
  } catch (error) {
    logger.error(`Deduct balance service error: ${error.message}`, { stack: error.stack, userId, amount, service });
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
    
    // Get minimum balance threshold from system settings or config defaults
    let threshold;
    try {
      const settingRow = await SystemSetting.findOne({ 
        where: { settingKey: 'minimumBalanceThreshold' } 
      });
      threshold = settingRow 
        ? parseFloat(settingRow.settingValue) 
        : config.systemDefaults.minimumBalanceThreshold;
    } catch (error) {
      threshold = config.systemDefaults.minimumBalanceThreshold;
    }
    
    // Check if balance is below threshold
    if (balance < threshold) {
      // Get user settings to check if low balance alerts are enabled
      let notificationSettings = {};
      try {
        const userSettings = await db.Setting.findOne({
          where: { 
            userId,
            category: 'notifications'
          }
        });
        notificationSettings = userSettings?.settings || {};
      } catch (error) {
        // Default to enabled if can't fetch settings
        notificationSettings = { lowBalanceAlerts: true };
      }
      
      // Send email alert if enabled
      if (notificationSettings.lowBalanceAlerts !== false && emailService && emailService.sendLowBalanceEmail) {
        emailService.sendLowBalanceEmail(user, balance, threshold, currency)
          .catch(err => logger.error(`Failed to send low balance email: ${err.message}`));
      }
      
      // Create in-app notification
      if (notificationService && notificationService.createNotification) {
        notificationService.createNotification(
          userId,
          'Low Balance Alert',
          `Your account balance is below the recommended minimum. Current balance: ${currency.symbol}${balance.toFixed(2)}`,
          'warning'
        ).catch(err => logger.error(`Failed to create notification: ${err.message}`));
      }
    }
  } catch (error) {
    logger.error(`Check low balance error: ${error.message}`, { stack: error.stack, userId, balance });
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
    
    // Format transactions with currency information
    const formattedTransactions = recentTransactions.map(transaction => {
      const transObj = transaction.toJSON();
      transObj.currencyCode = currency.code;
      transObj.currencySymbol = currency.symbol;
      return transObj;
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

    // Get minimum balance threshold from system settings or config defaults
    let minimumBalanceThreshold;
    try {
      const settingRow = await SystemSetting.findOne({ 
        where: { settingKey: 'minimumBalanceThreshold' } 
      });
      minimumBalanceThreshold = settingRow 
        ? parseFloat(settingRow.settingValue) 
        : config.systemDefaults.minimumBalanceThreshold;
    } catch (error) {
      minimumBalanceThreshold = config.systemDefaults.minimumBalanceThreshold;
    }

    return {
      balance: parseFloat(user.balance),
      currency: currency.code,
      currencySymbol: currency.symbol,
      currencyName: currency.name,
      recentTransactions: formattedTransactions,
      monthlySpending,
      transactionCount,
      minimumBalanceThreshold,
      lastUpdated: new Date(),
      lowBalance: parseFloat(user.balance) < minimumBalanceThreshold
    };
  } catch (error) {
    logger.error(`Get balance summary service error: ${error.message}`, { stack: error.stack, userId });
    throw error;
  }
};

/**
 * Get transaction statistics for dashboard
 * @param {number} userId - User ID
 * @param {string} period - Time period (1d, 7d, 30d, 90d)
 * @returns {Object} Transaction statistics
 */
const getTransactionStats = async (userId, period = '30d') => {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get transactions for the period
    const transactions = await Transaction.findAll({
      where: {
        userId,
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      order: [['createdAt', 'DESC']],
    });
    
    // Calculate statistics
    const stats = transactions.reduce((acc, transaction) => {
      const amount = parseFloat(transaction.amount) || 0;
      
      if (transaction.type === 'credit') {
        acc.totalIn += amount;
        acc.creditTransactions += 1;
      } else {
        acc.totalOut += amount;
        acc.debitTransactions += 1;
      }
      
      // Status counts
      if (transaction.status === 'completed') {
        acc.completed += 1;
      } else if (transaction.status === 'pending') {
        acc.pending += 1;
      } else if (transaction.status === 'failed') {
        acc.failed += 1;
      }
      
      // Service breakdown
      const service = transaction.service || 'other';
      acc.serviceBreakdown[service] = (acc.serviceBreakdown[service] || 0) + amount;
      
      return acc;
    }, {
      totalIn: 0,
      totalOut: 0,
      netFlow: 0,
      creditTransactions: 0,
      debitTransactions: 0,
      completed: 0,
      pending: 0,
      failed: 0,
      serviceBreakdown: {},
      period: period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString()
    });
    
    // Calculate net flow
    stats.netFlow = stats.totalIn - stats.totalOut;
    
    // Add currency information
    stats.currency = {
      code: currency.code,
      symbol: currency.symbol,
      name: currency.name
    };
    
    return stats;
  } catch (error) {
    logger.error(`Get transaction stats error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      period
    });
    throw error;
  }
};

/**
 * Get recent transactions for dashboard
 * @param {number} userId - User ID
 * @param {number} limit - Number of transactions to return
 * @returns {Array} Recent transactions
 */
const getRecentTransactions = async (userId, limit = 5) => {
  try {
    const transactions = await Transaction.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
    });
    
    // Format transactions with currency information
    return transactions.map(transaction => {
      const transObj = transaction.toJSON();
      transObj.currencyCode = currency.code;
      transObj.currencySymbol = currency.symbol;
      return transObj;
    });
  } catch (error) {
    logger.error(`Get recent transactions error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      limit
    });
    throw error;
  }
};

/**
 * Get transaction by ID
 * @param {number} userId - User ID
 * @param {string} transactionId - Transaction ID
 * @returns {Object} Transaction details
 */
const getTransactionById = async (userId, transactionId) => {
  try {
    const transaction = await Transaction.findOne({
      where: {
        userId,
        transactionId,
      },
    });
    
    if (!transaction) {
      throw new ApiError('Transaction not found', 404);
    }
    
    const transObj = transaction.toJSON();
    transObj.currencyCode = currency.code;
    transObj.currencySymbol = currency.symbol;
    
    return transObj;
  } catch (error) {
    logger.error(`Get transaction by ID error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      transactionId
    });
    throw error;
  }
};

/**
 * Get balance trend data for charts
 * @param {number} userId - User ID
 * @param {string} period - Time period (7d, 30d, 90d)
 * @param {string} groupBy - Group by (day, week, month)
 * @returns {Object} Balance trend data
 */
const getBalanceTrend = async (userId, period = '30d', groupBy = 'day') => {
  try {
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get transactions for the period
    const transactions = await Transaction.findAll({
      where: {
        userId,
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      order: [['createdAt', 'ASC']],
    });
    
    // Group transactions by date
    const trendData = {};
    let runningBalance = 0;
    
    // Get initial balance (balance before the period)
    const initialTransaction = await Transaction.findOne({
      where: {
        userId,
        createdAt: {
          [Op.lt]: startDate,
        },
      },
      order: [['createdAt', 'DESC']],
    });
    
    if (initialTransaction) {
      runningBalance = parseFloat(initialTransaction.balanceAfter) || 0;
    }
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.createdAt);
      let dateKey;
      
      switch (groupBy) {
        case 'week':
          const weekNumber = getWeekNumber(date);
          dateKey = `${date.getFullYear()}-W${weekNumber}`;
          break;
        case 'month':
          dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default: // day
          dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      }
      
      if (!trendData[dateKey]) {
        trendData[dateKey] = {
          date: dateKey,
          credits: 0,
          debits: 0,
          balance: runningBalance,
          transactionCount: 0
        };
      }
      
      const amount = parseFloat(transaction.amount) || 0;
      
      if (transaction.type === 'credit') {
        trendData[dateKey].credits += amount;
        runningBalance += amount;
      } else {
        trendData[dateKey].debits += amount;
        runningBalance -= amount;
      }
      
      trendData[dateKey].balance = runningBalance;
      trendData[dateKey].transactionCount += 1;
    });
    
    // Convert to array and fill missing dates
    const trendArray = Object.values(trendData).sort((a, b) => a.date.localeCompare(b.date));
    
    return {
      period,
      groupBy,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      data: trendArray,
      currency: {
        code: currency.code,
        symbol: currency.symbol,
        name: currency.name
      }
    };
  } catch (error) {
    logger.error(`Get balance trend error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      period, 
      groupBy
    });
    throw error;
  }
};

/**
 * Helper function to get week number
 * @private
 */
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

/**
 * Validate transaction amount
 * @param {number} amount - Amount to validate
 * @returns {boolean} Is valid amount
 */
const validateTransactionAmount = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return false;
  }
  
  if (amount <= 0) {
    return false;
  }
  
  // Check for reasonable limits (adjust as needed)
  if (amount > 10000000) { // 10 million limit
    return false;
  }
  
  return true;
};

/**
 * Format transaction for API response
 * @param {Object} transaction - Transaction object
 * @returns {Object} Formatted transaction
 */
const formatTransactionResponse = (transaction) => {
  const formatted = {
    id: transaction.id,
    transactionId: transaction.transactionId,
    type: transaction.type,
    amount: parseFloat(transaction.amount) || 0,
    balanceAfter: parseFloat(transaction.balanceAfter) || 0,
    service: transaction.service,
    status: transaction.status,
    description: transaction.description,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
    currency: {
      code: currency.code,
      symbol: currency.symbol,
      name: currency.name
    }
  };
  
  return formatted;
};

/**
 * Health check for balance service
 * @returns {Object} Health status
 */
const balanceHealthCheck = async () => {
  try {
    // Check database connection
    await db.sequelize.authenticate();
    
    // Check if we can query transactions table
    const transactionCount = await Transaction.count({ limit: 1 });
    
    // Check if we can query users table
    const userCount = await User.count({ limit: 1 });
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      transactionsTable: 'accessible',
      usersTable: 'accessible',
      currency: currency.code,
      version: '1.0.0',
    };
  } catch (error) {
    logger.error(`Balance service health check error: ${error.message}`, { 
      stack: error.stack
    });
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      version: '1.0.0',
    };
  }
};

module.exports = {
  // Core balance functions
  getUserBalance,
  getBalance,
  getTransactions,
  addBalance,
  deductBalance,
  processPayment, 
  processPaystackWebhook, 
  checkLowBalance,
  getBalanceSummary,
  
  // Enhanced transaction functions
  getEnhancedTransactions,
  exportTransactionHistory,
  getTransactionStats,
  getRecentTransactions,
  getTransactionById,
  getBalanceTrend,
  
  // Utility functions
  validateTransactionAmount,
  formatTransactionResponse,
  balanceHealthCheck,
};