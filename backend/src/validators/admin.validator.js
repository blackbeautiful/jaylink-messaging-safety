const Joi = require('joi');

// Create user validation schema
const createUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least {#limit} characters',
      'string.max': 'First name must not exceed {#limit} characters',
      'any.required': 'First name is required'
    }),
  lastName: Joi.string().min(2).max(50).required()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least {#limit} characters',
      'string.max': 'Last name must not exceed {#limit} characters',
      'any.required': 'Last name is required'
    }),
  email: Joi.string().email().required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string().min(8).required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$'))
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least {#limit} characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
      'any.required': 'Password is required'
    }),
  role: Joi.string().valid('user', 'admin').required()
    .messages({
      'string.empty': 'Role is required',
      'any.only': 'Role must be either user or admin',
      'any.required': 'Role is required'
    }),
  company: Joi.string().max(100).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  status: Joi.string().valid('active', 'suspended', 'inactive').default('active')
    .messages({
      'any.only': 'Status must be active, suspended, or inactive'
    }),
});

// Update user validation schema
const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50)
    .messages({
      'string.min': 'First name must be at least {#limit} characters',
      'string.max': 'First name must not exceed {#limit} characters',
    }),
  lastName: Joi.string().min(2).max(50)
    .messages({
      'string.min': 'Last name must be at least {#limit} characters',
      'string.max': 'Last name must not exceed {#limit} characters',
    }),
  email: Joi.string().email()
    .messages({
      'string.email': 'Please enter a valid email address',
    }),
  password: Joi.string().min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$'))
    .messages({
      'string.min': 'Password must be at least {#limit} characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
    }),
  role: Joi.string().valid('user', 'admin')
    .messages({
      'any.only': 'Role must be either user or admin',
    }),
  company: Joi.string().max(100).allow('', null),
  phone: Joi.string().max(20).allow('', null),
  status: Joi.string().valid('active', 'suspended', 'inactive')
    .messages({
      'any.only': 'Status must be active, suspended, or inactive'
    }),
}).min(1).messages({
  'object.min': 'At least one field is required for update',
});

// Admin service costs schema
const servicesCostSchema = Joi.object({
  cost: Joi.number().positive().required()
    .messages({
      'number.base': 'Cost must be a number',
      'number.positive': 'Cost must be a positive number',
      'any.required': 'Cost is required'
    })
});

// Admin dashboard schema - for reference only, not used directly
const dashboardSchema = Joi.object({
  timeFrame: Joi.string().valid('day', 'week', 'month', 'year').default('week')
    .messages({
      'any.only': 'Time frame must be day, week, month, or year'
    }),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
  servicesCostSchema,
  dashboardSchema,
};