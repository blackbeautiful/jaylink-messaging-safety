// src/routes/balance.routes.js
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
 * @route GET /api/balance/transactions
 * @desc Get transaction history
 * @access Private
 */
router.get(
  '/transactions',
  authenticate,
  balanceController.getTransactions
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

module.exports = router;