const Joi = require('joi');

// Contact validation schema for create/update operations
const contactSchema = Joi.object({
  name: Joi.string().min(2).max(100).required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least {#limit} characters',
      'string.max': 'Name must not exceed {#limit} characters',
      'any.required': 'Name is required'
    }),
  phone: Joi.string().max(20).required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.max': 'Phone number must not exceed {#limit} characters',
      'any.required': 'Phone number is required'
    }),
  email: Joi.string().email().allow('', null)
    .messages({
      'string.email': 'Please enter a valid email address',
    }),
});

// List contacts query validation schema
const listContactsSchema = Joi.object({
  search: Joi.string().allow('', null),
  page: Joi.number().integer().min(1).default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be an integer',
      'number.min': 'Page must be greater than or equal to 1'
    }),
  limit: Joi.number().integer().min(1).max(100).default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be greater than or equal to 1',
      'number.max': 'Limit must not exceed 100'
    }),
});

// Import contacts validation schema
const importContactsSchema = Joi.object({
  replaceAll: Joi.boolean().default(false),
});

// Bulk delete contacts validation schema
const bulkDeleteContactsSchema = Joi.object({
  contactIds: Joi.array().items(Joi.number().integer().positive()).min(1).required()
    .messages({
      'array.base': 'Contact IDs must be an array',
      'array.min': 'At least one contact ID is required',
      'any.required': 'Contact IDs are required'
    }),
});

module.exports = {
  contactSchema,
  listContactsSchema,
  importContactsSchema,
  bulkDeleteContactsSchema,
};