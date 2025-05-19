// backend/src/validators/payment.validator.js
const Joi = require('joi');

// Initialize payment validation schema
const initializePaymentSchema = Joi.object({
  amount: Joi.number().greater(0).required().messages({
    'number.base': 'Amount must be a number',
    'number.greater': 'Amount must be greater than 0',
    'any.required': 'Amount is required',
  }),
});

// Verify payment validation schema
const verifyPaymentSchema = Joi.object({
  reference: Joi.string().required().messages({
    'string.empty': 'Payment reference cannot be empty',
    'any.required': 'Payment reference is required',
  }),
});

// Webhook validation schema
const webhookSchema = Joi.object({
  event: Joi.string().required(),
  data: Joi.object().required(),
}).unknown(true);

module.exports = {
  initializePaymentSchema,
  verifyPaymentSchema,
  webhookSchema,
};
