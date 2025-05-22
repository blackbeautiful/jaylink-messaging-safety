const Joi = require('joi');

// Send SMS validation schema
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

// Bulk send SMS validation schema
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

// Message history query validation schema
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
  status: Joi.string().valid('queued', 'sent', 'delivered', 'failed').allow('', null)
    .messages({
      'any.only': 'Status must be one of queued, sent, delivered, or failed'
    })
});

// Scheduled messages query validation schema
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
 * Schema for checking scheduled message updates
 */
const checkScheduledUpdatesSchema = {
  body: Joi.object().keys({
    messageIds: Joi.array().items(Joi.string().required()).required()
      .messages({
        'array.base': 'Message IDs must be an array',
        'array.empty': 'At least one message ID is required',
        'any.required': 'Message IDs are required'
      })
  })
};

module.exports = {
  sendSmsSchema,
  bulkSendSmsSchema,
  messageHistorySchema,
  scheduledMessagesSchema,
  checkScheduledUpdatesSchema,
};