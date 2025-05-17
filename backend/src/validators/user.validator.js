// src/validators/user.validator.js - Enhanced implementation
const Joi = require('joi');

// Update profile validation schema
const updateProfileSchema = Joi.object({
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
  company: Joi.string().max(100).allow('', null),
  phone: Joi.string().max(20).allow('', null),
}).min(1).messages({
  'object.min': 'At least one field is required for update',
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

// Update settings validation schema with expanded options
const updateSettingsSchema = Joi.object({
  // Main settings object - can contain any of these categories
  theme: Joi.string().valid('light', 'dark', 'system'),
  
  // Email notification preferences
  emailAlerts: Joi.boolean(),
  lowBalanceAlerts: Joi.boolean(),
  deliveryReports: Joi.boolean(),
  marketingEmails: Joi.boolean(),

  // Appearance settings
  reducedMotion: Joi.boolean(),
  compactView: Joi.boolean(),
  highContrast: Joi.boolean(),
  
  // Nested settings objects
  notifications: Joi.object({
    email: Joi.boolean(),
    sms: Joi.boolean(),
    app: Joi.boolean(),
    emailAlerts: Joi.boolean(),
    lowBalanceAlerts: Joi.boolean(),
    deliveryReports: Joi.boolean(),
    marketingEmails: Joi.boolean(),
  }),
  
  appearance: Joi.object({
    theme: Joi.string().valid('light', 'dark', 'system'),
    compactView: Joi.boolean(),
    reducedMotion: Joi.boolean(),
    highContrast: Joi.boolean(),
  }),
  
  security: Joi.object({
    twoFactorAuth: Joi.boolean()
  }),
  
}).min(1).messages({
  'object.min': 'At least one setting is required for update',
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  updateSettingsSchema,
};