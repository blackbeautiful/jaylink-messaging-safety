// backend/src/validators/notification.validator.js
const Joi = require('joi');

// Mark notifications as read validation schema
const markAsReadSchema = Joi.alternatives().try(
  Joi.object({
    notificationIds: Joi.array().items(Joi.number().integer().positive()).min(1).required()
      .messages({
        'array.min': 'At least one notification ID is required',
        'array.base': 'Notification IDs must be an array'
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

// Delete notifications validation schema
const deleteNotificationsSchema = Joi.object({
  notificationIds: Joi.array().items(Joi.number().integer().positive()).min(1).required()
    .messages({
      'array.min': 'At least one notification ID is required',
      'array.base': 'Notification IDs must be an array',
      'any.required': 'Notification IDs are required'
    })
});

// Create test notification validation schema
const createTestNotificationSchema = Joi.object({
  title: Joi.string().required()
    .messages({
      'string.empty': 'Title cannot be empty',
      'any.required': 'Title is required'
    }),
  message: Joi.string().required()
    .messages({
      'string.empty': 'Message cannot be empty',
      'any.required': 'Message is required'
    }),
  type: Joi.string().valid('info', 'success', 'warning', 'error').default('info')
    .messages({
      'any.only': 'Type must be one of: info, success, warning, error'
    }),
  metadata: Joi.object().default({}),
  action: Joi.string(),
  sendEmail: Joi.boolean().default(false)
});

// Get notifications validation schema
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
    })
});

// Update notification settings validation schema
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
}).min(1).messages({
  'object.min': 'At least one notification setting is required'
});

module.exports = {
  markAsReadSchema,
  deleteNotificationsSchema,
  createTestNotificationSchema,
  getNotificationsSchema,
  updateNotificationSettingsSchema
};