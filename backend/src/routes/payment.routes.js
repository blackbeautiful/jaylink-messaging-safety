// backend/src/routes/payment.routes.js
const express = require('express');
const paymentController = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validator.middleware');
const paymentValidator = require('../validators/payment.validator');

const router = express.Router();

/**
 * @route POST /api/payments/initialize
 * @desc Initialize a payment transaction
 * @access Private
 */
router.post(
  '/initialize',
  authenticate,
  validate(paymentValidator.initializePaymentSchema),
  paymentController.initializePayment
);

/**
 * @route POST /api/payments/details
 * @desc Get payment details for frontend initialization
 * @access Private
 */
router.post(
  '/details',
  authenticate,
  validate(paymentValidator.initializePaymentSchema),
  paymentController.getPaymentDetails
);

/**
 * @route GET /api/payments/verify/:reference
 * @desc Verify a payment transaction
 * @access Private
 */
router.get(
  '/verify/:reference',
  authenticate,
  validate(paymentValidator.verifyPaymentSchema, 'params'),
  paymentController.verifyPayment
);

/**
 * @route POST /api/payments/webhook
 * @desc Handle payment webhook events
 * @access Public
 */
router.post(
  '/webhook',
  validate(paymentValidator.webhookSchema),
  paymentController.handleWebhook
);

/**
 * @route GET /api/payments/methods
 * @desc Get available payment methods
 * @access Private
 */
router.get(
  '/methods',
  authenticate,
  paymentController.getPaymentMethods
);

/**
 * @route GET /api/payments/banks
 * @desc Get list of supported banks
 * @access Private
 */
router.get(
  '/banks',
  authenticate,
  paymentController.getBanks
);

module.exports = router;