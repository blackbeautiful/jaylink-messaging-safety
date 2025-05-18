/**
 * Parse and normalize phone numbers
 * @param {string|Array} phoneNumbers - Single phone number or array of phone numbers
 * @returns {Array} Array of normalized phone numbers
 */
const parsePhoneNumbers = (phoneNumbers) => {
    // Handle single phone number
    if (typeof phoneNumbers === 'string') {
      return [normalizePhoneNumber(phoneNumbers)].filter(Boolean);
    }
    
    // Handle array of phone numbers
    if (Array.isArray(phoneNumbers)) {
      return phoneNumbers
        .map(phone => normalizePhoneNumber(phone))
        .filter(Boolean); // Remove invalid numbers
    }
    
    return [];
  };
  
  /**
   * Normalize a single phone number
   * @param {string} phoneNumber - Phone number to normalize
   * @returns {string|null} Normalized phone number or null if invalid
   */
  const normalizePhoneNumber = (phoneNumber) => {
    if (!phoneNumber || typeof phoneNumber !== 'string') {
      return null;
    }
    
    // Remove whitespace, hyphens, parentheses
    const cleaned = phoneNumber.replace(/\s+|-|\(|\)/g, '');
    
    // Basic validation (at least 8 digits after cleaning)
    if (!/^\+?[0-9]{8,15}$/.test(cleaned)) {
      return null;
    }
    
    // Ensure number starts with + if it doesn't already
    return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  };
  
  /**
   * Validate a phone number
   * @param {string} phoneNumber - Phone number to validate
   * @returns {boolean} True if phone number is valid
   */
  const isValidPhoneNumber = (phoneNumber) => {
    return normalizePhoneNumber(phoneNumber) !== null;
  };
  
  /**
   * Format a phone number for display
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} Formatted phone number
   */
  const formatPhoneNumber = (phoneNumber) => {
    const normalized = normalizePhoneNumber(phoneNumber);
    
    if (!normalized) {
      return phoneNumber; // Return original if invalid
    }
    
    // Format international numbers in a readable way
    // This is a simplified version
    if (normalized.startsWith('+')) {
      // Split into country code and rest
      const countryCode = normalized.slice(0, 3); // Usually +XX format
      const rest = normalized.slice(3);
      
      if (rest.length <= 4) {
        return `${countryCode} ${rest}`;
      } else if (rest.length <= 7) {
        return `${countryCode} ${rest.slice(0, 3)} ${rest.slice(3)}`;
      } else {
        return `${countryCode} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
      }
    }
    
    // Fallback for other formats
    return normalized;
  };
  
  module.exports = {
    parsePhoneNumbers,
    normalizePhoneNumber,
    isValidPhoneNumber,
    formatPhoneNumber,
  };