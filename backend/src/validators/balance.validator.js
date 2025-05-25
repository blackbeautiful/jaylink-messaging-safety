// backend/src/validators/balance.validator.js - Enhanced with comprehensive validation
const Joi = require('joi');

// Topup validation schema
const topupSchema = Joi.object({
  amount: Joi.number().positive().min(100).max(10000000).required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be a positive number',
      'number.min': 'Minimum top-up amount is 100',
      'number.max': 'Maximum top-up amount is 10,000,000',
      'any.required': 'Amount is required'
    }),
  paymentMethod: Joi.string().valid('credit-card', 'bank-transfer', 'paypal', 'paystack').default('paystack')
    .messages({
      'string.empty': 'Payment method is required',
      'any.only': 'Payment method must be one of: credit-card, bank-transfer, paypal, paystack'
    }),
});

// Enhanced transaction query validation schema
const transactionQuerySchema = Joi.object({
  type: Joi.string().valid('credit', 'debit').allow('', null)
    .messages({
      'any.only': 'Transaction type must be either credit or debit'
    }),
  status: Joi.string().valid('completed', 'pending', 'failed').allow('', null)
    .messages({
      'any.only': 'Status must be one of: completed, pending, failed'
    }),
  service: Joi.string().max(50).allow('', null)
    .messages({
      'string.max': 'Service name cannot exceed 50 characters'
    }),
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
  endDate: Joi.date().iso().min(Joi.ref('startDate')).allow('', null)
    .messages({
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date'
    }),
  search: Joi.string().max(500).allow('', null)
    .messages({
      'string.max': 'Search term cannot exceed 500 characters'
    }),
  sortBy: Joi.string().valid('createdAt', 'amount', 'balanceAfter', 'type', 'status').default('createdAt')
    .messages({
      'any.only': 'Sort field must be one of: createdAt, amount, balanceAfter, type, status'
    }),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
    .messages({
      'any.only': 'Sort order must be either ASC or DESC'
    })
});

// Transaction ID validation schema
const transactionIdSchema = Joi.object({
  transactionId: Joi.string().required()
    .messages({
      'string.empty': 'Transaction ID is required',
      'any.required': 'Transaction ID is required'
    })
});

// Transaction statistics query validation schema
const statsQuerySchema = Joi.object({
  period: Joi.string().valid('1d', '7d', '30d', '90d', '1y').default('30d')
    .messages({
      'any.only': 'Period must be one of: 1d, 7d, 30d, 90d, 1y'
    }),
  groupBy: Joi.string().valid('hour', 'day', 'week', 'month').default('day')
    .messages({
      'any.only': 'Group by must be one of: hour, day, week, month'
    }),
  includeServices: Joi.boolean().default(false)
    .messages({
      'boolean.base': 'Include services must be a boolean value'
    })
});

// Balance trend query validation schema
const trendQuerySchema = Joi.object({
  period: Joi.string().valid('7d', '30d', '90d', '1y').default('30d')
    .messages({
      'any.only': 'Period must be one of: 7d, 30d, 90d, 1y'
    }),
  groupBy: Joi.string().valid('day', 'week', 'month').default('day')
    .messages({
      'any.only': 'Group by must be one of: day, week, month'
    }),
  includeProjection: Joi.boolean().default(false)
    .messages({
      'boolean.base': 'Include projection must be a boolean value'
    })
});

// Recent transactions query validation schema
const recentTransactionsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(50).default(5)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be an integer',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 50'
    }),
  type: Joi.string().valid('credit', 'debit').allow('', null)
    .messages({
      'any.only': 'Transaction type must be either credit or debit'
    }),
  status: Joi.string().valid('completed', 'pending', 'failed').allow('', null)
    .messages({
      'any.only': 'Status must be one of: completed, pending, failed'
    })
});

// Export transactions validation schema
const exportTransactionsSchema = Joi.object({
  format: Joi.string().valid('csv', 'xlsx', 'json').default('csv')
    .messages({
      'any.only': 'Export format must be one of: csv, xlsx, json'
    }),
  type: Joi.string().valid('credit', 'debit').allow('', null)
    .messages({
      'any.only': 'Transaction type must be either credit or debit'
    }),
  status: Joi.string().valid('completed', 'pending', 'failed').allow('', null)
    .messages({
      'any.only': 'Status must be one of: completed, pending, failed'
    }),
  startDate: Joi.date().iso().allow('', null)
    .messages({
      'date.format': 'Start date must be in ISO format'
    }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).allow('', null)
    .messages({
      'date.format': 'End date must be in ISO format',
      'date.min': 'End date must be after start date'
    }),
  includeBalance: Joi.boolean().default(true)
    .messages({
      'boolean.base': 'Include balance must be a boolean value'
    }),
  maxRecords: Joi.number().integer().min(1).max(50000).default(10000)
    .messages({
      'number.base': 'Max records must be a number',
      'number.integer': 'Max records must be an integer',
      'number.min': 'Max records must be at least 1',
      'number.max': 'Max records cannot exceed 50,000'
    })
});

// Balance alert settings validation schema
const alertSettingsSchema = Joi.object({
  lowBalanceThreshold: Joi.number().positive().min(0).max(1000000).required()
    .messages({
      'number.base': 'Low balance threshold must be a number',
      'number.positive': 'Low balance threshold must be positive',
      'number.min': 'Low balance threshold must be at least 0',
      'number.max': 'Low balance threshold cannot exceed 1,000,000',
      'any.required': 'Low balance threshold is required'
    }),
  enableEmailAlerts: Joi.boolean().default(true)
    .messages({
      'boolean.base': 'Enable email alerts must be a boolean value'
    }),
  enableSmsAlerts: Joi.boolean().default(false)
    .messages({
      'boolean.base': 'Enable SMS alerts must be a boolean value'
    }),
  alertFrequency: Joi.string().valid('once', 'daily', 'weekly').default('once')
    .messages({
      'any.only': 'Alert frequency must be one of: once, daily, weekly'
    })
});

// Balance summary query validation schema
const summaryQuerySchema = Joi.object({
  includeTrend: Joi.boolean().default(false)
    .messages({
      'boolean.base': 'Include trend must be a boolean value'
    }),
  includeRecentTransactions: Joi.boolean().default(true)
    .messages({
      'boolean.base': 'Include recent transactions must be a boolean value'
    }),
  period: Joi.string().valid('7d', '30d', '90d').default('30d')
    .messages({
      'any.only': 'Period must be one of: 7d, 30d, 90d'
    })
});

// Date range validation schema
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

// Amount validation schema
const amountSchema = Joi.object({
  amount: Joi.number().positive().precision(2).required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.positive': 'Amount must be positive',
      'number.precision': 'Amount can have at most 2 decimal places',
      'any.required': 'Amount is required'
    }),
  currency: Joi.string().valid('NGN', 'USD', 'EUR', 'GBP').default('NGN')
    .messages({
      'any.only': 'Currency must be one of: NGN, USD, EUR, GBP'
    })
});

// Bulk transaction validation schema
const bulkTransactionSchema = Joi.object({
  transactions: Joi.array()
    .items(
      Joi.object({
        type: Joi.string().valid('credit', 'debit').required(),
        amount: Joi.number().positive().precision(2).required(),
        description: Joi.string().max(500).required(),
        service: Joi.string().max(50).allow('', null),
        reference: Joi.string().max(100).allow('', null)
      }).messages({
        'any.required': 'All transaction fields are required'
      })
    )
    .min(1)
    .max(100)
    .required()
    .messages({
      'array.base': 'Transactions must be an array',
      'array.min': 'At least one transaction is required',
      'array.max': 'Cannot process more than 100 transactions at once',
      'any.required': 'Transactions are required'
    })
});

// Pagination validation schema
const paginationSchema = Joi.object({
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
  sortBy: Joi.string().valid('createdAt', 'amount', 'type', 'status').default('createdAt')
    .messages({
      'any.only': 'Sort field must be one of: createdAt, amount, type, status'
    }),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
    .messages({
      'any.only': 'Sort order must be either ASC or DESC'
    })
});

module.exports = {
  // Core validation schemas
  topupSchema,
  transactionQuerySchema,
  transactionIdSchema,
  
  // Analytics and reporting schemas
  statsQuerySchema,
  trendQuerySchema,
  recentTransactionsSchema,
  summaryQuerySchema,
  
  // Export and bulk operations
  exportTransactionsSchema,
  bulkTransactionSchema,
  
  // Settings and configuration
  alertSettingsSchema,
  
  // Utility schemas
  dateRangeSchema,
  amountSchema,
  paginationSchema,
};