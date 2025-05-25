// backend/src/controllers/balance.controller.js - Complete controller with all methods
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
    const { type, page = 1, limit = 20, startDate, endDate, status, search, sortBy, sortOrder } = req.query;
    
    const transactions = await balanceService.getEnhancedTransactions(userId, { 
      type, page, limit, startDate, endDate, status, search, sortBy, sortOrder
    });
    
    return response.success(res, transactions, 'Transactions retrieved successfully');
  } catch (error) {
    logger.error(`Get transactions controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Export transaction history as CSV
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const exportTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, startDate, endDate, status, format = 'csv' } = req.query;
    
    const csvData = await balanceService.exportTransactionHistory(userId, {
      type, startDate, endDate, status
    });
    
    // Set headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=transactions-${new Date().toISOString().split('T')[0]}.csv`);
    
    return res.send(csvData);
  } catch (error) {
    logger.error(`Export transactions controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get specific transaction by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getTransactionById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { transactionId } = req.params;
    
    const transaction = await balanceService.getTransactionById(userId, transactionId);
    
    return response.success(res, transaction, 'Transaction retrieved successfully');
  } catch (error) {
    logger.error(`Get transaction by ID controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get transaction statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getTransactionStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = '30d', groupBy = 'day', includeServices = false } = req.query;
    
    const stats = await balanceService.getTransactionStats(userId, period);
    
    return response.success(res, stats, 'Transaction statistics retrieved successfully');
  } catch (error) {
    logger.error(`Get transaction stats controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get balance trend data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getBalanceTrend = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = '30d', groupBy = 'day', includeProjection = false } = req.query;
    
    const trendData = await balanceService.getBalanceTrend(userId, period, groupBy);
    
    return response.success(res, trendData, 'Balance trend data retrieved successfully');
  } catch (error) {
    logger.error(`Get balance trend controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get recent transactions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getRecentTransactions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { limit = 5, type, status } = req.query;
    
    const transactions = await balanceService.getRecentTransactions(userId, parseInt(limit, 10));
    
    // Apply filters if provided
    let filteredTransactions = transactions;
    if (type) {
      filteredTransactions = filteredTransactions.filter(t => t.type === type);
    }
    if (status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === status);
    }
    
    return response.success(res, { transactions: filteredTransactions }, 'Recent transactions retrieved successfully');
  } catch (error) {
    logger.error(`Get recent transactions controller error: ${error.message}`, { stack: error.stack });
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
    const { amount, paymentMethod = 'paystack' } = req.body;
    
    // Validate amount
    if (!amount || parseFloat(amount) <= 0) {
      return response.error(res, 'Valid amount is required', 400);
    }
    
    if (parseFloat(amount) < 100) {
      return response.error(res, 'Minimum top-up amount is ₦100', 400);
    }
    
    const result = await balanceService.addBalance(userId, parseFloat(amount), paymentMethod);
    
    return response.success(res, result, 'Balance topped up successfully');
  } catch (error) {
    logger.error(`Top up controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get balance summary with analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getBalanceSummary = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { includeTrend = false, includeRecentTransactions = true, period = '30d' } = req.query;
    
    const summary = await balanceService.getBalanceSummary(userId);
    
    // Add trend data if requested
    if (includeTrend === 'true') {
      const trendData = await balanceService.getBalanceTrend(userId, period, 'day');
      summary.trend = trendData;
    }
    
    // Add recent transactions if requested
    if (includeRecentTransactions === 'true') {
      const recentTransactions = await balanceService.getRecentTransactions(userId, 5);
      summary.recentTransactions = recentTransactions;
    }
    
    return response.success(res, summary, 'Balance summary retrieved successfully');
  } catch (error) {
    logger.error(`Get balance summary controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Balance service health check
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const balanceHealthCheck = async (req, res, next) => {
  try {
    const healthStatus = await balanceService.balanceHealthCheck();
    
    if (healthStatus.status === 'healthy') {
      return response.success(res, healthStatus, 'Balance service is healthy');
    } else {
      return response.error(res, 'Balance service is unhealthy', 503, healthStatus);
    }
  } catch (error) {
    logger.error(`Balance health check controller error: ${error.message}`, { stack: error.stack });
    
    const healthStatus = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      version: '1.0.0',
    };
    
    return response.error(res, 'Balance service health check failed', 503, healthStatus);
  }
};

/**
 * Get transaction analytics for dashboard
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getTransactionAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;
    
    // Get transaction stats
    const stats = await balanceService.getTransactionStats(userId, period);
    
    // Get balance summary
    const balanceSummary = await balanceService.getBalanceSummary(userId);
    
    // Combine analytics data
    const analytics = {
      ...stats,
      currentBalance: balanceSummary.balance,
      lowBalance: balanceSummary.lowBalance,
      minimumBalanceThreshold: balanceSummary.minimumBalanceThreshold,
      transactionCount: balanceSummary.transactionCount,
      lastUpdated: new Date().toISOString()
    };
    
    return response.success(res, analytics, 'Transaction analytics retrieved successfully');
  } catch (error) {
    logger.error(`Get transaction analytics controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Validate transaction amount
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const validateAmount = async (req, res, next) => {
  try {
    const { amount, currency = 'NGN' } = req.body;
    
    const isValid = balanceService.validateTransactionAmount(parseFloat(amount));
    
    const validation = {
      isValid,
      amount: parseFloat(amount),
      currency,
      formatted: isValid ? balanceService.formatTransactionResponse({ amount: parseFloat(amount) }) : null,
      errors: []
    };
    
    if (!isValid) {
      if (isNaN(parseFloat(amount))) {
        validation.errors.push('Amount must be a valid number');
      }
      if (parseFloat(amount) <= 0) {
        validation.errors.push('Amount must be greater than zero');
      }
      if (parseFloat(amount) > 10000000) {
        validation.errors.push('Amount exceeds maximum limit');
      }
    }
    
    return response.success(res, validation, 'Amount validation completed');
  } catch (error) {
    logger.error(`Validate amount controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get balance alerts and notifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getBalanceAlerts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get current balance
    const balanceSummary = await balanceService.getBalanceSummary(userId);
    
    // Check for alerts
    const alerts = [];
    
    // Low balance alert
    if (balanceSummary.lowBalance) {
      alerts.push({
        type: 'low_balance',
        severity: 'warning',
        title: 'Low Balance Alert',
        message: `Your account balance is below the recommended minimum of ₦${balanceSummary.minimumBalanceThreshold}`,
        currentBalance: balanceSummary.balance,
        threshold: balanceSummary.minimumBalanceThreshold,
        actionRequired: true,
        suggestedAction: 'top_up'
      });
    }
    
    // Recent failed transactions
    const recentTransactions = await balanceService.getRecentTransactions(userId, 10);
    const failedTransactions = recentTransactions.filter(t => t.status === 'failed');
    
    if (failedTransactions.length > 0) {
      alerts.push({
        type: 'failed_transactions',
        severity: 'error',
        title: 'Failed Transactions',
        message: `You have ${failedTransactions.length} failed transaction(s) in the last 10 transactions`,
        count: failedTransactions.length,
        actionRequired: false,
        suggestedAction: 'review_transactions'
      });
    }
    
    // High spending alert (if spending is unusually high)
    const stats = await balanceService.getTransactionStats(userId, '7d');
    if (stats.totalOut > balanceSummary.balance * 0.5) {
      alerts.push({
        type: 'high_spending',
        severity: 'info',
        title: 'High Spending Alert',
        message: 'Your spending this week is higher than usual',
        weeklySpending: stats.totalOut,
        currentBalance: balanceSummary.balance,
        actionRequired: false,
        suggestedAction: 'review_spending'
      });
    }
    
    return response.success(res, {
      alerts,
      alertCount: alerts.length,
      hasWarnings: alerts.some(a => a.severity === 'warning'),
      hasErrors: alerts.some(a => a.severity === 'error'),
      lastChecked: new Date().toISOString()
    }, 'Balance alerts retrieved successfully');
  } catch (error) {
    logger.error(`Get balance alerts controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

module.exports = {
  // Core balance operations
  getBalance,
  getTransactions,
  exportTransactions,
  topUp,
  getBalanceSummary,
  
  // Transaction management
  getTransactionById,
  getRecentTransactions,
  
  // Analytics and reporting
  getTransactionStats,
  getBalanceTrend,
  getTransactionAnalytics,
  
  // Utility functions
  validateAmount,
  getBalanceAlerts,
  balanceHealthCheck,
};