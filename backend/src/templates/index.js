// Ensure template directory exists
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');

// Template directory
const templateDir = path.join(__dirname, 'templates');

// Check and create templates directory if it doesn't exist
if (!fs.existsSync(path.join(templateDir, 'emails'))) {
  console.log('Creating email templates directory...');
  fs.mkdirSync(path.join(templateDir, 'emails'), { recursive: true });
}

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

handlebars.registerHelper('formatCurrency', (amount, currency = 'USD') => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
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

module.exports = {
  // Export any shared functionality here if needed
};