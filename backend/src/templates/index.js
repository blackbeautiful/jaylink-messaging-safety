// backend/src/templates/index.js - FIXED VERSION
const fs = require('fs');
const path = require('path');
let handlebars;

try {
  handlebars = require('handlebars');
  
  // Register Handlebars helpers
  handlebars.registerHelper('currentYear', () => new Date().getFullYear());
  
  handlebars.registerHelper('formatDate', (date, format) => {
    if (!date) return '';
    
    const d = new Date(date);
    
    if (format === 'short') {
      return d.toLocaleDateString();
    } else if (format === 'long') {
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
    } else {
      return d.toISOString();
    }
  });
  
  // FIXED: Handle both currency codes and symbols properly
  handlebars.registerHelper('formatCurrency', (amount, currencyOrSymbol = 'USD') => {
    if (typeof amount !== 'number') {
      amount = parseFloat(amount) || 0;
    }
    
    // Map currency symbols to codes
    const currencyMap = {
      '₦': 'NGN',
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY'
    };
    
    // Check if it's a symbol that needs to be converted to code
    let currencyCode = currencyOrSymbol;
    if (currencyMap[currencyOrSymbol]) {
      currencyCode = currencyMap[currencyOrSymbol];
    }
    
    // Validate currency code (must be 3 letters)
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      // If not a valid currency code, use simple formatting with symbol
      const symbol = currencyOrSymbol || '₦';
      return `${symbol}${amount.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    }
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode
      }).format(amount);
    } catch (error) {
      // Fallback to simple formatting if Intl.NumberFormat fails
      console.warn(`Failed to format currency with code ${currencyCode}, using fallback`);
      const symbol = currencyOrSymbol || '₦';
      return `${symbol}${amount.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}`;
    }
  });
  
  handlebars.registerHelper('if_eq', function(a, b, opts) {
    if (a === b) {
      return opts.fn(this);
    } else {
      return opts.inverse(this);
    }
  });
  
  handlebars.registerHelper('if_not_eq', function(a, b, opts) {
    if (a !== b) {
      return opts.fn(this);
    } else {
      return opts.inverse(this);
    }
  });
  
  console.log('Handlebars helpers registered successfully');
} catch (error) {
  console.error('Failed to initialize Handlebars:', error.message);
}

// Template directory
const templateDir = path.join(__dirname, '..', 'templates');

// Check and create templates directory if it doesn't exist
try {
  if (!fs.existsSync(path.join(templateDir, 'emails'))) {
    fs.mkdirSync(path.join(templateDir, 'emails'), { recursive: true });
    console.log('Created email templates directory');
  }
} catch (error) {
  console.error('Failed to create templates directory:', error.message);
}

module.exports = {
  // Export any shared functionality here if needed
};