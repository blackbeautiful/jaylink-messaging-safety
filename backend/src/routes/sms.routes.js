const express = require('express');
const smsController = require('../controllers/sms.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { csvUploadMiddleware } = require('../middleware/upload.middleware');
const validate = require('../middleware/validator.middleware');
const smsValidator = require('../validators/sms.validator');

const router = express.Router();

/**
 * @route POST /api/sms/send
 * @desc Send SMS message
 * @access Private
 */
router.post(
  '/send',
  authenticate,
  validate(smsValidator.sendSmsSchema),
  smsController.sendSMS
);

/**
 * @route POST /api/sms/bulk-send
 * @desc Send bulk SMS using CSV file
 * @access Private
 */
router.post(
  '/bulk-send',
  authenticate,
  csvUploadMiddleware,
  validate(smsValidator.bulkSendSmsSchema),
  smsController.sendBulkSMS
);

/**
 * @route GET /api/sms/status/:messageId
 * @desc Get message status
 * @access Private
 */
router.get(
  '/status/:messageId',
  authenticate,
  smsController.getMessageStatus
);

/**
 * @route GET /api/sms/history
 * @desc Get message history
 * @access Private
 */
router.get(
  '/history',
  authenticate,
  validate(smsValidator.messageHistorySchema, 'query'),
  smsController.getMessageHistory
);

/**
 * @route GET /api/sms/analytics
 * @desc Get message analytics
 * @access Private
 */
router.get(
  '/analytics',
  authenticate,
  smsController.getMessageAnalytics
);

module.exports = router;