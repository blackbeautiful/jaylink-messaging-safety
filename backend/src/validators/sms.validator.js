// backend/src/validators/sms.validator.js - Complete SMS validation schemas
const Joi = require('joi');

/**
 * Send SMS validation schema
 */
const sendSmsSchema = Joi.object({
  recipients: Joi.string().required()
    .messages({
      'string.empty': 'Recipients are required',
      'any.required': 'Recipients are required'
    }),
  message: Joi.string().required().max(1600)
    .messages({
      'string.empty': 'Message content is required',
      'string.max': 'Message cannot exceed 1600 characters',
      'any.required': 'Message content is required'
    }),
  senderId: Joi.string().max(11).allow('', null)
    .messages({
      'string.max': 'Sender ID cannot exceed 11 characters'
    }),
  scheduled: Joi.date().iso().min('now').allow('', null)
    .messages({
      'date.min': 'Scheduled time must be in the future',
      'date.format': 'Scheduled time must be in ISO format'
    })
});

/**
 * Bulk send SMS validation schema
 */
const bulkSendSmsSchema = Joi.object({
  message: Joi.string().required().max(1600)
    .messages({
      'string.empty': 'Message content is required',
      'string.max': 'Message cannot exceed 1600 characters',
      'any.required': 'Message content is required'
    }),
  senderId: Joi.string().max(11).allow('', null)
    .messages({
      'string.max': 'Sender ID cannot exceed 11 characters'
    }),
  scheduled: Joi.date().iso().min('now').allow('', null)
    .messages({
      'date.min': 'Scheduled time must be in the future',
      'date.format': 'Scheduled time must be in ISO format'
    })
});

/**
 * Message history query validation schema with enhanced search
 */
const messageHistorySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number().integer().min(1).max(100).default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  startDate: Joi.date().iso().allow('', null)
    .messages({
      'date.format': 'Start date must be in ISO format'
    }),
  endDate: Joi.date().iso().allow('', null)
    .messages({
      'date.format': 'End date must be in ISO format'
    }),
  type: Joi.string().valid('sms', 'voice', 'audio').allow('', null)
    .messages({
      'any.only': 'Type must be one of sms, voice, or audio'
    }),
  status: Joi.string().valid('queued', 'sent', 'delivered', 'failed', 'processing', 'resent').allow('', null)
    .messages({
      'any.only': 'Status must be one of queued, sent, delivered, failed, processing, or resent'
    }),
  search: Joi.string().max(500).allow('', null)
    .messages({
      'string.max': 'Search term cannot exceed 500 characters'
    })
});

/**
 * Scheduled messages query validation schema
 */
const scheduledMessagesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be at least 1'
    }),
  limit: Joi.number().integer().min(1).max(100).default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    }),
  type: Joi.string().valid('sms', 'voice', 'audio').allow('', null)
    .messages({
      'any.only': 'Type must be one of sms, voice, or audio'
    })
});

/**
 * Batch delete validation schema
 */
const batchDeleteSchema = Joi.object({
  messageIds: Joi.array()
    .items(Joi.string().required().messages({
      'string.empty': 'Message ID cannot be empty',
      'any.required': 'Message ID is required'
    }))
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.base': 'Message IDs must be an array',
      'array.min': 'At least one message ID is required',
      'array.max': 'Cannot delete more than 100 messages at once',
      'any.required': 'Message IDs are required'
    })
});

/**
 * Export history validation schema
 */
const exportHistorySchema = Joi.object({
  startDate: Joi.date().iso().allow('', null)
    .messages({
      'date.format': 'Start date must be in ISO format'
    }),
  endDate: Joi.date().iso().allow('', null)
    .messages({
      'date.format': 'End date must be in ISO format'
    }),
  type: Joi.string().valid('sms', 'voice', 'audio').allow('', null)
    .messages({
      'any.only': 'Type must be one of sms, voice, or audio'
    }),
  status: Joi.string().valid('queued', 'sent', 'delivered', 'failed', 'processing', 'resent').allow('', null)
    .messages({
      'any.only': 'Status must be one of queued, sent, delivered, failed, processing, or resent'
    }),
  search: Joi.string().max(500).allow('', null)
    .messages({
      'string.max': 'Search term cannot exceed 500 characters'
    })
});

/**
 * Schema for checking scheduled message updates
 */
const checkScheduledUpdatesSchema = Joi.object({
  messageIds: Joi.array()
    .items(Joi.string().required().messages({
      'string.empty': 'Message ID cannot be empty',
      'any.required': 'Message ID is required'
    }))
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.base': 'Message IDs must be an array',
      'array.min': 'At least one message ID is required',
      'array.max': 'Cannot check more than 50 messages at once',
      'any.required': 'Message IDs are required'
    })
});

/**
 * Cost estimation validation schema
 */
const costEstimateSchema = Joi.object({
  recipients: Joi.alternatives().try(
    Joi.string().min(1).required(),
    Joi.array().items(Joi.string().min(1)).min(1).required()
  ).required()
    .messages({
      'any.required': 'Recipients are required',
      'alternatives.match': 'Recipients must be a non-empty string or array of strings',
      'string.min': 'Recipients cannot be empty',
      'array.min': 'At least one recipient is required'
    }),
  message: Joi.string().required().min(1).max(1600)
    .messages({
      'string.empty': 'Message content is required',
      'string.min': 'Message content cannot be empty',
      'string.max': 'Message cannot exceed 1600 characters',
      'any.required': 'Message content is required'
    }),
  isInternational: Joi.boolean().default(false)
    .messages({
      'boolean.base': 'isInternational must be a boolean value'
    })
});

/**
 * Message resend validation schema
 */
const resendMessageSchema = Joi.object({
  messageId: Joi.string().required()
    .messages({
      'string.empty': 'Message ID is required',
      'any.required': 'Message ID is required'
    })
});

/**
 * Analytics query validation schema
 */
const analyticsQuerySchema = Joi.object({
  timeRange: Joi.string().valid('1d', '7d', '30d', '90d', '1y').default('30d')
    .messages({
      'any.only': 'Time range must be one of 1d, 7d, 30d, 90d, or 1y'
    }),
  groupBy: Joi.string().valid('day', 'week', 'month').allow('', null)
    .messages({
      'any.only': 'Group by must be one of day, week, or month'
    })
});

/**
 * Template validation schema (for future use)
 */
const templateSchema = Joi.object({
  name: Joi.string().required().min(3).max(100)
    .messages({
      'string.empty': 'Template name is required',
      'string.min': 'Template name must be at least 3 characters',
      'string.max': 'Template name cannot exceed 100 characters',
      'any.required': 'Template name is required'
    }),
  content: Joi.string().required().min(1).max(1600)
    .messages({
      'string.empty': 'Template content is required',
      'string.min': 'Template content cannot be empty',
      'string.max': 'Template content cannot exceed 1600 characters',
      'any.required': 'Template content is required'
    }),
  category: Joi.string().valid('general', 'promotional', 'transactional', 'reminder').default('general')
    .messages({
      'any.only': 'Category must be one of general, promotional, transactional, or reminder'
    }),
  isActive: Joi.boolean().default(true)
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    })
});

/**
 * Sender ID validation schema
 */
const senderIdSchema = Joi.object({
  senderId: Joi.string().required().min(3).max(11).alphanum()
    .messages({
      'string.empty': 'Sender ID is required',
      'string.min': 'Sender ID must be at least 3 characters',
      'string.max': 'Sender ID cannot exceed 11 characters',
      'string.alphanum': 'Sender ID must contain only letters and numbers',
      'any.required': 'Sender ID is required'
    }),
  purpose: Joi.string().valid('personal', 'business', 'promotional').default('personal')
    .messages({
      'any.only': 'Purpose must be one of personal, business, or promotional'
    })
});

/**
 * Phone number validation schema
 */
const phoneNumberSchema = Joi.object({
  phoneNumber: Joi.string().required().pattern(/^(\+234|234|0)[0-9]{10}$/)
    .messages({
      'string.empty': 'Phone number is required',
      'string.pattern.base': 'Phone number must be a valid Nigerian number',
      'any.required': 'Phone number is required'
    })
});

/**
 * Bulk phone numbers validation schema
 */
const bulkPhoneNumbersSchema = Joi.object({
  phoneNumbers: Joi.array()
    .items(Joi.string().pattern(/^(\+234|234|0)[0-9]{10}$/))
    .min(1)
    .max(1000)
    .required()
    .messages({
      'array.base': 'Phone numbers must be an array',
      'array.min': 'At least one phone number is required',
      'array.max': 'Cannot process more than 1000 phone numbers at once',
      'string.pattern.base': 'All phone numbers must be valid Nigerian numbers',
      'any.required': 'Phone numbers are required'
    })
});

/**
 * Date range validation schema
 */
const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().required()
    .messages({
      'date.format': 'Start date must be in ISO format',
      'any.required': 'Start date is required'
    }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required()
    .messages({
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date',
      'any.required': 'End date is required'
    })
});

/**
 * Webhook validation schema (for future use)
 */
const webhookSchema = Joi.object({
  url: Joi.string().uri().required()
    .messages({
      'string.uri': 'Webhook URL must be a valid URL',
      'any.required': 'Webhook URL is required'
    }),
  events: Joi.array()
    .items(Joi.string().valid('message.sent', 'message.delivered', 'message.failed'))
    .min(1)
    .required()
    .messages({
      'array.base': 'Events must be an array',
      'array.min': 'At least one event must be selected',
      'any.only': 'Events must be one of message.sent, message.delivered, or message.failed',
      'any.required': 'Events are required'
    }),
  secret: Joi.string().min(16).max(64)
    .messages({
      'string.min': 'Webhook secret must be at least 16 characters',
      'string.max': 'Webhook secret cannot exceed 64 characters'
    }),
  isActive: Joi.boolean().default(true)
    .messages({
      'boolean.base': 'isActive must be a boolean value'
    })
});

/**
 * Message stats validation schema
 */
const messageStatsSchema = Joi.object({
  period: Joi.string().valid('today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month').default('today')
    .messages({
      'any.only': 'Period must be one of today, yesterday, this_week, last_week, this_month, or last_month'
    }),
  includeDetails: Joi.boolean().default(false)
    .messages({
      'boolean.base': 'includeDetails must be a boolean value'
    })
});

module.exports = {
  // Core SMS operations
  sendSmsSchema,
  bulkSendSmsSchema,
  messageHistorySchema,
  scheduledMessagesSchema,
  batchDeleteSchema,
  exportHistorySchema,
  checkScheduledUpdatesSchema,
  costEstimateSchema,
  resendMessageSchema,
  
  // Analytics and reporting
  analyticsQuerySchema,
  messageStatsSchema,
  dateRangeSchema,
  
  // Templates and sender IDs
  templateSchema,
  senderIdSchema,
  
  // Phone number validation
  phoneNumberSchema,
  bulkPhoneNumbersSchema,
  
  // Advanced features
  webhookSchema,
};