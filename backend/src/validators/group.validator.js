const Joi = require('joi');

// Group validation schema for create/update operations
const groupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required()
    .messages({
      'string.empty': 'Group name is required',
      'string.min': 'Group name must be at least {#limit} characters',
      'string.max': 'Group name must not exceed {#limit} characters',
      'any.required': 'Group name is required'
    }),
  description: Joi.string().max(1000).allow('', null)
    .messages({
      'string.max': 'Description must not exceed {#limit} characters',
    }),
});

// List groups query validation schema
const listGroupsSchema = Joi.object({
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

// Add contacts to group validation schema
const addContactsToGroupSchema = Joi.object({
  contactIds: Joi.array().items(Joi.number().integer().positive()).min(1).required()
    .messages({
      'array.base': 'Contact IDs must be an array',
      'array.min': 'At least one contact ID is required',
      'any.required': 'Contact IDs are required'
    }),
});

module.exports = {
  groupSchema,
  listGroupsSchema,
  addContactsToGroupSchema,
};