// src/utils/password.util.js
const bcrypt = require('bcrypt');
const config = require('../config/config');

/**
 * Password utility functions
 */
const passwordUtil = {
  /**
   * Hash password
   * @param {string} password - Plain password
   * @returns {Promise<string>} Hashed password
   */
  hash: async (password) => {
    const salt = await bcrypt.genSalt(parseInt(config.auth.saltRounds, 10));
    return bcrypt.hash(password, salt);
  },

  /**
   * Compare password with hash
   * @param {string} password - Plain password
   * @param {string} hash - Hashed password
   * @returns {Promise<boolean>} Is password valid
   */
  compare: async (password, hash) => {
    return bcrypt.compare(password, hash);
  },

  /**
   * Generate random password
   * @param {number} length - Password length
   * @returns {string} Random password
   */
  generateRandomPassword: (length = 12) => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let password = '';
    
    // Ensure at least one uppercase, one lowercase, one number, and one special char
    password += charset.match(/[A-Z]/)[0];
    password += charset.match(/[a-z]/)[0];
    password += charset.match(/[0-9]/)[0];
    password += charset.match(/[^a-zA-Z0-9]/)[0];
    
    // Fill the rest with random chars
    for (let i = 4; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    return password
      .split('')
      .sort(() => 0.5 - Math.random())
      .join('');
  },

  /**
   * Validate password strength
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  validateStrength: (password) => {
    // Regular expressions for password criteria
    const lengthRegex = /.{8,}/;
    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const numberRegex = /[0-9]/;
    const specialCharRegex = /[^A-Za-z0-9]/;
    
    // Check each criterion
    const checks = {
      length: lengthRegex.test(password),
      uppercase: uppercaseRegex.test(password),
      lowercase: lowercaseRegex.test(password),
      number: numberRegex.test(password),
      specialChar: specialCharRegex.test(password),
    };
    
    // Calculate strength score (0-4)
    const score = Object.values(checks).filter(Boolean).length - 1;
    
    // Determine strength level
    let strength = 'weak';
    if (score >= 3) {
      strength = 'strong';
    } else if (score >= 2) {
      strength = 'medium';
    }
    
    return {
      isValid: checks.length && checks.uppercase && checks.lowercase && checks.number,
      strength,
      score,
      checks,
    };
  },
};

module.exports = passwordUtil;