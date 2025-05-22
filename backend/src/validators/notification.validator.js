// backend/src/validators/notification.validator.js
/**
 * Enhanced validation schemas for notification-related requests
 * Includes WebSocket support and optimized performance
 */
const Joi = require('joi');

/**
 * Schema for marking notifications as read
 */
const markAsReadSchema = Joi.alternatives().try(
  Joi.object({
    notificationIds: Joi.array().items(
      Joi.alternatives().try(
        Joi.number().integer().positive(),
        Joi.string().pattern(/^[0-9]+$/) // Accept string IDs that can be parsed as positive integers
      )
    ).min(1).required()
    .messages({
      'array.min': 'At least one notification ID is required',
      'array.base': 'Notification IDs must be an array',
      'any.required': 'Notification IDs are required'
    })
  }),
  Joi.object({
    all: Joi.boolean().valid(true).required()
      .messages({
        'any.only': 'The "all" parameter must be true',
        'any.required': 'The "all" parameter is required'
      })
  })
).messages({
  'alternatives.match': 'Either provide notificationIds array or set all=true'
});

/**
 * Schema for deleting notifications
 */
const deleteNotificationsSchema = Joi.object({
  notificationIds: Joi.array().items(
    Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string().pattern(/^[0-9]+$/) // Accept string IDs that can be parsed as positive integers
    )
  ).min(1).required()
  .messages({
    'array.min': 'At least one notification ID is required',
    'array.base': 'Notification IDs must be an array',
    'any.required': 'Notification IDs are required'
  })
});

/**
 * Schema for creating test notifications (development only)
 */
const createTestNotificationSchema = Joi.object({
  title: Joi.string().max(100).required()
    .messages({
      'string.empty': 'Title cannot be empty',
      'string.max': 'Title cannot exceed 100 characters',
      'any.required': 'Title is required'
    }),
  message: Joi.string().max(500).required()
    .messages({
      'string.empty': 'Message cannot be empty',
      'string.max': 'Message cannot exceed 500 characters',
      'any.required': 'Message is required'
    }),
  type: Joi.string().valid('info', 'success', 'warning', 'error').default('info')
    .messages({
      'any.only': 'Type must be one of: info, success, warning, error'
    }),
  metadata: Joi.object().default({}),
  action: Joi.string().max(50),
  sendEmail: Joi.boolean().default(false),
  sendPush: Joi.boolean().default(true),
  sendWebSocket: Joi.boolean().default(true)
});

/**
 * Schema for retrieving notifications with filtering and pagination
 */
const getNotificationsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number().integer().min(1).max(100).default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  read: Joi.string().valid('true', 'false')
    .messages({
      'any.only': 'Read must be either true or false'
    }),
  type: Joi.string().valid('info', 'success', 'warning', 'error')
    .messages({
      'any.only': 'Type must be one of: info, success, warning, error'
    }),
  startDate: Joi.date().iso()
    .messages({
      'date.base': 'Start date must be a valid date',
      'date.format': 'Start date must be in ISO format (YYYY-MM-DD)'
    }),
  endDate: Joi.date().iso().min(Joi.ref('startDate'))
    .messages({
      'date.base': 'End date must be a valid date',
      'date.format': 'End date must be in ISO format (YYYY-MM-DD)',
      'date.min': 'End date must be after start date'
    }),
  includeMeta: Joi.boolean().default(false)
    .messages({
      'boolean.base': 'includeMeta must be a boolean'
    })
});

/**
 * Schema for updating notification settings
 * Enhanced with WebSocket and device-specific settings
 */
const updateNotificationSettingsSchema = Joi.object({
  emailAlerts: Joi.boolean(),
  lowBalanceAlerts: Joi.boolean(),
  deliveryReports: Joi.boolean(),
  marketingEmails: Joi.boolean(),
  pushNotifications: Joi.boolean(),
  infoNotifications: Joi.boolean(),
  successNotifications: Joi.boolean(),
  warningNotifications: Joi.boolean(), 
  errorNotifications: Joi.boolean(),
  webSocketNotifications: Joi.boolean(),
  deviceSpecificSettings: Joi.object().pattern(
    Joi.string(), // Device ID
    Joi.object({
      pushEnabled: Joi.boolean(),
      pushSilentHours: Joi.object({
        enabled: Joi.boolean(),
        start: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/), // HH:MM format
        end: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)    // HH:MM format
      })
    })
  )
}).min(1).messages({
  'object.min': 'At least one notification setting is required'
});

/**
 * Schema for registering device token for push notifications
 */
const registerDeviceTokenSchema = Joi.object({
  token: Joi.string().required()
    .messages({
      'string.empty': 'Device token is required',
      'any.required': 'Device token is required'
    }),
  deviceType: Joi.string().valid('ios', 'android', 'web', 'desktop').default('web')
    .messages({
      'any.only': 'Device type must be one of: ios, android, web, desktop'
    }),
  deviceInfo: Joi.object({
    model: Joi.string(),
    osVersion: Joi.string(),
    appVersion: Joi.string(),
    browserName: Joi.string(),
    browserVersion: Joi.string(),
    screenSize: Joi.string(),
    language: Joi.string().length(2),
    timeZone: Joi.string()
  }).default({})
});

/**
 * Schema for unregistering device token
 */
const unregisterDeviceTokenSchema = Joi.object({
  token: Joi.string().required()
    .messages({
      'string.empty': 'Device token is required',
      'any.required': 'Device token is required'
    })
});

/**
 * Schema for checking scheduled message updates
 */
const checkScheduledUpdatesSchema = Joi.object({
  messageIds: Joi.array().items(
    Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string()
    )
  ).min(1).required()
    .messages({
      'array.min': 'At least one message ID is required',
      'array.base': 'Message IDs must be an array',
      'any.required': 'Message IDs are required'
    })
});

/**
 * Schema for WebSocket authentication
 */
const wsAuthSchema = Joi.object({
  token: Joi.string().required()
    .messages({
      'string.empty': 'Authentication token is required',
      'any.required': 'Authentication token is required'
    })
});

/**
 * Schema for WebSocket subscription
 */
const wsSubscriptionSchema = Joi.object({
  channel: Joi.string().required()
    .messages({
      'string.empty': 'Channel name is required',
      'any.required': 'Channel name is required'
    }),
  options: Joi.object().default({})
});

module.exports = {
  markAsReadSchema,
  deleteNotificationsSchema,
  createTestNotificationSchema,
  getNotificationsSchema,
  updateNotificationSettingsSchema,
  registerDeviceTokenSchema,
  unregisterDeviceTokenSchema,
  checkScheduledUpdatesSchema,
  wsAuthSchema,
  wsSubscriptionSchema
};