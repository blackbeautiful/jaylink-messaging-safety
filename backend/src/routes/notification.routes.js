// backend/src/routes/notification.routes.js
/**
 * Enhanced notification routes with WebSocket support
 * Optimized for performance and resource efficiency
 */
const express = require('express');
const notificationController = require('../controllers/notification.controller');
const { authenticate, authorizeAdmin } = require('../middleware/auth.middleware');
const validate = require('../middleware/validator.middleware');
const notificationValidator = require('../validators/notification.validator');

const router = express.Router();

/**
 * @route GET /api/notifications
 * @desc Get user notifications with pagination and filtering
 * @access Private
 */
router.get(
  '/',
  authenticate,
  validate(notificationValidator.getNotificationsSchema, 'query'),
  notificationController.getNotifications
);

/**
 * @route GET /api/notifications/stats
 * @desc Get notification statistics
 * @access Private
 */
router.get(
  '/stats', 
  authenticate, 
  notificationController.getNotificationStats
);

/**
 * @route POST /api/notifications/read
 * @desc Mark notifications as read
 * @access Private
 */
router.post(
  '/read',
  authenticate,
  validate(notificationValidator.markAsReadSchema),
  notificationController.markAsRead
);

/**
 * @route PATCH /api/notifications/:id/read
 * @desc Mark a single notification as read
 * @access Private
 */
router.patch(
  '/:id/read', 
  authenticate, 
  notificationController.markOneAsRead
);

/**
 * @route DELETE /api/notifications
 * @desc Delete multiple notifications
 * @access Private
 */
router.delete(
  '/',
  authenticate,
  validate(notificationValidator.deleteNotificationsSchema),
  notificationController.deleteNotifications
);

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete a single notification
 * @access Private
 */
router.delete(
  '/:id', 
  authenticate, 
  notificationController.deleteNotification
);

/**
 * @route PUT /api/notifications/settings
 * @desc Update notification settings
 * @access Private
 */
router.put(
  '/settings',
  authenticate,
  validate(notificationValidator.updateNotificationSettingsSchema),
  notificationController.updateSettings
);

/**
 * @route GET /api/notifications/settings
 * @desc Get notification settings
 * @access Private
 */
router.get(
  '/settings',
  authenticate,
  notificationController.getSettings
);

/**
 * @route POST /api/notifications/device-token
 * @desc Register device token for push notifications
 * @access Private
 */
router.post(
  '/device-token',
  authenticate,
  validate(notificationValidator.registerDeviceTokenSchema),
  notificationController.registerDeviceToken
);

/**
 * @route DELETE /api/notifications/device-token
 * @desc Unregister device token
 * @access Private
 */
router.delete(
  '/device-token',
  authenticate,
  validate(notificationValidator.unregisterDeviceTokenSchema),
  notificationController.unregisterDeviceToken
);

/**
 * @route POST /api/notifications/check-scheduled
 * @desc Check for updates to scheduled messages
 * @access Private
 */
router.post(
  '/check-scheduled',
  authenticate,
  validate(notificationValidator.checkScheduledUpdatesSchema),
  notificationController.checkScheduledUpdates
);

/**
 * @route GET /api/notifications/ws-status
 * @desc Get WebSocket server status (admin only)
 * @access Private (Admin)
 */
router.get(
  '/ws-status',
  authenticate,
  authorizeAdmin,
  notificationController.getWebSocketStatus
);

// Development-only routes
if (process.env.NODE_ENV === 'development') {
  /**
   * @route POST /api/notifications/test
   * @desc Create a test notification (development only)
   * @access Private
   */
  router.post(
    '/test',
    authenticate,
    validate(notificationValidator.createTestNotificationSchema),
    notificationController.createTestNotification
  );
}

module.exports = router;