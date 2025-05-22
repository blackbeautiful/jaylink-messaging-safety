// backend/src/routes/scheduled.routes.js
const express = require('express');
const scheduledController = require('../controllers/scheduled.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validator.middleware');
const smsValidator = require('../validators/sms.validator');

const router = express.Router();

/**
 * @route GET /api/scheduled
 * @desc Get scheduled messages
 * @access Private
 */
router.get(
  '/',
  authenticate,
  validate(smsValidator.scheduledMessagesSchema, 'query'),
  scheduledController.getScheduledMessages
);

/**
 * @route DELETE /api/scheduled/:id
 * @desc Cancel a scheduled message
 * @access Private
 */
router.delete('/:id', authenticate, scheduledController.cancelScheduledMessage);

/**
 * @route POST /api/scheduled/check-updates
 * @desc Check for updates to scheduled messages
 * @access Private
 */
router.post(
  '/check-updates',
  authenticate,
  validate(smsValidator.checkScheduledUpdatesSchema),
  scheduledController.checkScheduledUpdates
);

module.exports = router;
