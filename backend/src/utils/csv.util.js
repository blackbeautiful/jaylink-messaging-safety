const fs = require('fs');
const { parse } = require('csv-parse');
const logger = require('../config/logger');
const ApiError = require('./api-error.util');

/**
 * Process a CSV file and transform it into an array of objects
 * @param {string} filePath - Path to the CSV file
 * @param {Object} options - CSV parsing options
 * @returns {Promise<Array>} Array of objects representing the CSV data
 */
const processCsvFile = async (filePath, options = {}) => {
  try {
    // Default options
    const defaultOptions = {
      columns: true, // Auto-discover columns from header row
      skip_empty_lines: true,
      trim: true,
      relax_column_count: false, // Strict column count
      ...options
    };

    return new Promise((resolve, reject) => {
      const results = [];
      
      fs.createReadStream(filePath)
        .pipe(parse(defaultOptions))
        .on('data', (data) => results.push(data))
        .on('end', () => resolve(results))
        .on('error', (error) => reject(new Error(`Error parsing CSV: ${error.message}`)));
    });
  } catch (error) {
    logger.error(`CSV processing error: ${error.message}`, { stack: error.stack });
    throw new ApiError(`Failed to process CSV file: ${error.message}`, 500);
  }
};

/**
 * Validate contacts data from CSV
 * @param {Array} contacts - Array of contact objects from CSV
 * @returns {Object} Object containing valid contacts and errors
 */
const validateContacts = (contacts) => {
  const validContacts = [];
  const errors = [];
  
  // Process each contact
  contacts.forEach((contact, index) => {
    const lineNumber = index + 2; // +2 because index starts at 0 and we skip header row
    const { name, phone, email } = contact;
    
    // Validate required fields
    if (!name || !phone) {
      errors.push({
        line: lineNumber,
        message: 'Name and phone are required fields',
        data: contact
      });
      return;
    }
    
    // Validate name length
    if (name.length < 2 || name.length > 100) {
      errors.push({
        line: lineNumber,
        message: 'Name must be between 2 and 100 characters',
        data: contact
      });
      return;
    }
    
    // Validate phone length
    if (phone.length > 20) {
      errors.push({
        line: lineNumber,
        message: 'Phone number must not exceed 20 characters',
        data: contact
      });
      return;
    }
    
    // Validate email format if provided
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push({
          line: lineNumber,
          message: 'Invalid email format',
          data: contact
        });
        return;
      }
    }
    
    // If all validations pass, add to valid contacts
    validContacts.push({
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : null
    });
  });
  
  return { validContacts, errors };
};

/**
 * Delete a CSV file
 * @param {string} filePath - Path to the CSV file
 */
const deleteCsvFile = async (filePath) => {
  try {
    await fs.promises.unlink(filePath);
    logger.debug(`Successfully deleted CSV file: ${filePath}`);
  } catch (error) {
    logger.warn(`Failed to delete CSV file ${filePath}: ${error.message}`);
    // Don't throw error to avoid disrupting the main flow
  }
};

module.exports = {
  processCsvFile,
  validateContacts,
  deleteCsvFile,
};