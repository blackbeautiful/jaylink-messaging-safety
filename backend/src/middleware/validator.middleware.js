const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');

/**
 * Middleware to validate request data against a Joi schema
 * @param {Object} schema - Joi validation schema
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware function
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      // Skip validation if no schema provided
      if (!schema) {
        return next();
      }

      // Get data to validate based on source
      const dataToValidate = req[source];
      
      if (!dataToValidate) {
        // If data source is empty but required for validation
        if (['body', 'params'].includes(source) && schema._flags?.presence === 'required') {
          return next(new ApiError(`No ${source} data provided`, 400, null, 'VALIDATION_ERROR'));
        }
        // If query parameters are optional, continue
        if (source === 'query') {
          return next();
        }
      }

      // Validation options
      const options = {
        abortEarly: false,         // Include all errors
        allowUnknown: true,        // Ignore unknown props
        stripUnknown: false,       // Keep unknown props
        convert: true,             // Auto-convert types (string -> number, etc.)
      };

      // Validate data against schema
      const { error, value } = schema.validate(dataToValidate, options);

      if (error) {
        // Format validation errors
        const validationErrors = error.details.map((detail) => ({
          field: detail.path.join('.'),
          message: detail.message.replace(/['"]/g, ''),
          type: detail.type,
        }));

        // Log validation error
        const sanitizedData = { ...dataToValidate };
        // Remove sensitive fields from logs
        ['password', 'newPassword', 'currentPassword', 'token'].forEach(field => {
          if (sanitizedData[field]) {
            sanitizedData[field] = '[REDACTED]';
          }
        });

        logger.warn('Validation error:', {
          url: req.originalUrl,
          method: req.method,
          source,
          data: sanitizedData,
          errors: validationErrors,
          userId: req.user?.id,
        });

        return next(new ApiError('Validation failed', 400, validationErrors, 'VALIDATION_ERROR'));
      }

      // Update request data with validated data (including type conversions)
      req[source] = value;
      
      return next();
    } catch (error) {
      logger.error(`Validator middleware error: ${error.message}`, {
        stack: error.stack,
        url: req.originalUrl,
        method: req.method,
      });
      return next(new ApiError('Validation processing error', 500, null, 'VALIDATOR_ERROR'));
    }
  };
};

module.exports = validate;