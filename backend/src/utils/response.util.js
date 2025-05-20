// backend/src/utils/response.util.js
/**
 * Standard API response formatter
 */
const response = {
    /**
     * Format success response
     * @param {Object} res - Express response object
     * @param {any} data - Response data
     * @param {string} message - Success message
     * @param {number} statusCode - HTTP status code
     * @returns {Object} Formatted response
     */
    success: (res, data = null, message = 'Success', statusCode = 200) => {
      return res.status(statusCode).json({
        success: true,
        message,
        data,
      });
    },
  
    /**
     * Format error response
     * @param {Object} res - Express response object
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string} errorCode - Error code
     * @param {any} details - Error details
     * @returns {Object} Formatted error response
     */
    error: (res, message = 'Error', statusCode = 500, errorCode = null, details = null) => {
      return res.status(statusCode).json({
        success: false,
        message,
        error: {
          code: errorCode || `ERROR_${statusCode}`,
          details,
        },
      });
    },
  };
  
  module.exports = response;