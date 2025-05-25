// backend/src/routes/balance.routes.js - Enhanced with export and analytics
const express = require('express');
const balanceController = require('../controllers/balance.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validator.middleware');
const balanceValidator = require('../validators/balance.validator');

const router = express.Router();

/**
 * @route GET /api/balance
 * @desc Get account balance
 * @access Private
 */
router.get(
  '/',
  authenticate,
  balanceController.getBalance
);

/**
 * @route GET /api/balance/summary
 * @desc Get balance summary with analytics
 * @access Private
 */
router.get(
  '/summary',
  authenticate,
  balanceController.getBalanceSummary
);

/**
 * @route GET /api/balance/transactions
 * @desc Get transaction history
 * @access Private
 */
router.get(
  '/transactions',
  authenticate,
  validate(balanceValidator.transactionQuerySchema, 'query'),
  balanceController.getTransactions
);

/**
 * @route GET /api/balance/transactions/export
 * @desc Export transaction history as CSV
 * @access Private
 */
router.get(
  '/transactions/export',
  authenticate,
  validate(balanceValidator.transactionQuerySchema, 'query'),
  balanceController.exportTransactions
);

/**
 * @route GET /api/balance/transactions/:transactionId
 * @desc Get specific transaction details
 * @access Private
 */
router.get(
  '/transactions/:transactionId',
  authenticate,
  validate(balanceValidator.transactionIdSchema, 'params'),
  balanceController.getTransactionById
);

/**
 * @route GET /api/balance/stats
 * @desc Get transaction statistics
 * @access Private
 */
router.get(
  '/stats',
  authenticate,
  validate(balanceValidator.statsQuerySchema, 'query'),
  balanceController.getTransactionStats
);

/**
 * @route GET /api/balance/trend
 * @desc Get balance trend data for charts
 * @access Private
 */
router.get(
  '/trend',
  authenticate,
  validate(balanceValidator.trendQuerySchema, 'query'),
  balanceController.getBalanceTrend
);

/**
 * @route GET /api/balance/recent
 * @desc Get recent transactions
 * @access Private
 */
router.get(
  '/recent',
  authenticate,
  validate(balanceValidator.recentTransactionsSchema, 'query'),
  balanceController.getRecentTransactions
);

/**
 * @route POST /api/balance/topup
 * @desc Add funds to account
 * @access Private
 */
router.post(
  '/topup',
  authenticate,
  validate(balanceValidator.topupSchema),
  balanceController.topUp
);

/**
 * @route GET /api/balance/health
 * @desc Health check for balance service
 * @access Private
 */
router.get(
  '/health',
  authenticate,
  balanceController.balanceHealthCheck
);

module.exports = router;