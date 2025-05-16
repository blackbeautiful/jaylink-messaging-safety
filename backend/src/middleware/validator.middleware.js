const ApiError = require('../utils/api-error.util');

/**
 * Middleware to validate request data against a Joi schema
 * @param {Object} schema - Joi validation schema
 * @returns {Function} Express middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    if (!schema) {
      return next();
    }

    // Determine what to validate based on request method
    let dataToValidate = {};

    if (req.method === 'GET') {
      dataToValidate = req.query;
    } else {
      dataToValidate = req.body;
    }

    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: false,
      allowUnknown: true,
    });

    if (error) {
      // Format validation errors
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return next(new ApiError('Validation failed', 400, errors));
    }

    // Update request data with validated data
    if (req.method === 'GET') {
      req.query = value;
    } else {
      req.body = value;
    }

    return next();
  };
};

module.exports = validate;