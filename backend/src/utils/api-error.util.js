/**
 * Custom API Error class
 */
class ApiError extends Error {
    /**
     * Create a new API error
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {any} details - Error details
     * @param {string} code - Error code
     */
    constructor(message, statusCode = 500, details = null, code = null) {
      super(message);
      this.name = this.constructor.name;
      this.statusCode = statusCode;
      this.details = details;
      this.code = code || `ERROR_${statusCode}`;
      
      Error.captureStackTrace(this, this.constructor);
    }
  
    /**
     * Create a 400 Bad Request error
     * @param {string} message - Error message
     * @param {any} details - Error details
     * @param {string} code - Error code
     * @returns {ApiError} API error instance
     */
    static badRequest(message = 'Bad request', details = null, code = 'BAD_REQUEST') {
      return new ApiError(message, 400, details, code);
    }
  
    /**
     * Create a 401 Unauthorized error
     * @param {string} message - Error message
     * @param {any} details - Error details
     * @param {string} code - Error code
     * @returns {ApiError} API error instance
     */
    static unauthorized(message = 'Unauthorized', details = null, code = 'UNAUTHORIZED') {
      return new ApiError(message, 401, details, code);
    }
  
    /**
     * Create a 403 Forbidden error
     * @param {string} message - Error message
     * @param {any} details - Error details
     * @param {string} code - Error code
     * @returns {ApiError} API error instance
     */
    static forbidden(message = 'Forbidden', details = null, code = 'FORBIDDEN') {
      return new ApiError(message, 403, details, code);
    }
  
    /**
     * Create a 404 Not Found error
     * @param {string} message - Error message
     * @param {any} details - Error details
     * @param {string} code - Error code
     * @returns {ApiError} API error instance
     */
    static notFound(message = 'Not found', details = null, code = 'NOT_FOUND') {
      return new ApiError(message, 404, details, code);
    }
  
    /**
     * Create a 409 Conflict error
     * @param {string} message - Error message
     * @param {any} details - Error details
     * @param {string} code - Error code
     * @returns {ApiError} API error instance
     */
    static conflict(message = 'Conflict', details = null, code = 'CONFLICT') {
      return new ApiError(message, 409, details, code);
    }
  
    /**
     * Create a 422 Unprocessable Entity error
     * @param {string} message - Error message
     * @param {any} details - Error details
     * @param {string} code - Error code
     * @returns {ApiError} API error instance
     */
    static validationError(message = 'Validation error', details = null, code = 'VALIDATION_ERROR') {
      return new ApiError(message, 422, details, code);
    }
  
    /**
     * Create a 429 Too Many Requests error
     * @param {string} message - Error message
     * @param {any} details - Error details
     * @param {string} code - Error code
     * @returns {ApiError} API error instance
     */
    static tooManyRequests(message = 'Too many requests', details = null, code = 'TOO_MANY_REQUESTS') {
      return new ApiError(message, 429, details, code);
    }
  
    /**
     * Create a 500 Internal Server Error
     * @param {string} message - Error message
     * @param {any} details - Error details
     * @param {string} code - Error code
     * @returns {ApiError} API error instance
     */
    static internal(message = 'Internal server error', details = null, code = 'SERVER_ERROR') {
      return new ApiError(message, 500, details, code);
    }
  }
  
  module.exports = ApiError;