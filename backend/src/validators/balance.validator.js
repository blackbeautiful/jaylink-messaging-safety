// src/validators/balance.validator.js
const Joi = require('joi');

// Topup validation schema
const topupSchema = Joi.object({
  amount: Joi.number().positive().required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be a positive number',
      'any.required': 'Amount is required'
    }),
  paymentMethod: Joi.string().valid('credit-card', 'bank-transfer', 'paypal').required()
    .messages({
      'string.empty': 'Payment method is required',
      'any.only': 'Payment method must be credit-card, bank-transfer, or paypal',
      'any.required': 'Payment method is required'
    }),
});

// Transaction query validation schema
const transactionQuerySchema = Joi.object({
  type: Joi.string().valid('credit', 'debit'),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
  startDate: Joi.date().iso(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')),
});

module.exports = {
  topupSchema,
  transactionQuerySchema,
};