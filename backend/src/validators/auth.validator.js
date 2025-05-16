const Joi = require('joi');

// Register validation schema
const registerSchema = Joi.object({
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
  company: Joi.string().max(100).allow('', null),
  phone: Joi.string().max(20).allow('', null),
});

// Login validation schema
const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
  password: Joi.string().required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    }),
});

// Admin login validation schema
const adminLoginSchema = Joi.object({
  username: Joi.string().required()
    .messages({
      'string.empty': 'Username is required',
      'any.required': 'Username is required'
    }),
  password: Joi.string().required()
    .messages({
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    }),
});

// Forgot password validation schema
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address',
      'any.required': 'Email is required'
    }),
});

// Reset password validation schema
const resetPasswordSchema = Joi.object({
  token: Joi.string().required()
    .messages({
      'string.empty': 'Token is required',
      'any.required': 'Token is required'
    }),
  password: Joi.string().min(8).required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$'))
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least {#limit} characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one digit',
      'any.required': 'Password is required'
    }),
});

// Change password validation schema
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required()
    .messages({
      'string.empty': 'Current password is required',
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string().min(8).required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d@$!%*?&]{8,}$'))
    .messages({
      'string.empty': 'New password is required',
      'string.min': 'New password must be at least {#limit} characters',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, and one digit',
      'any.required': 'New password is required'
    }),
});

module.exports = {
  registerSchema,
  loginSchema,
  adminLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};