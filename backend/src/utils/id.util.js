const crypto = require('crypto');

/**
 * Generate a unique ID with optional prefix
 * @param {string} prefix - Optional prefix for the ID
 * @returns {string} Unique ID
 */
const generateUniqueId = (prefix = '') => {
  // Create unique components
  const timestamp = Date.now().toString(36);
  const randomPart = crypto.randomBytes(4).toString('hex');
  
  // Combine with prefix
  return prefix 
    ? `${prefix}_${timestamp}_${randomPart}`
    : `${timestamp}_${randomPart}`;
};

/**
 * Generate a random referral code
 * @param {number} length - Length of the code (default 6)
 * @returns {string} Random alphanumeric code
 */
const generateReferralCode = (length = 6) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed confusing characters like 0, O, 1, I
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Generate a temporary password
 * @param {number} length - Length of the password (default 10)
 * @returns {string} Random password with mixed characters
 */
const generateTemporaryPassword = (length = 10) => {
  // Character sets for a strong password
  const lowerChars = 'abcdefghijkmnopqrstuvwxyz'; // Removed l to avoid confusion
  const upperChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Removed I, O to avoid confusion
  const numericChars = '23456789'; // Removed 0, 1 to avoid confusion
  const specialChars = '@#$%&*!?';
  const allChars = lowerChars + upperChars + numericChars + specialChars;
  
  // Start with one character from each set to ensure password strength
  let password = '';
  password += lowerChars.charAt(Math.floor(Math.random() * lowerChars.length));
  password += upperChars.charAt(Math.floor(Math.random() * upperChars.length));
  password += numericChars.charAt(Math.floor(Math.random() * numericChars.length));
  password += specialChars.charAt(Math.floor(Math.random() * specialChars.length));
  
  // Fill the rest with random characters from all sets
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password to randomize the positions of the characters
  return password.split('').sort(() => 0.5 - Math.random()).join('');
};

module.exports = {
  generateUniqueId,
  generateReferralCode,
  generateTemporaryPassword,
};