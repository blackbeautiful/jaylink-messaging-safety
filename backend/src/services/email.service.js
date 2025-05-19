// backend/src/services/email.service.js
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
let handlebars;
try {
  handlebars = require('handlebars');
  
  // Register Handlebars helpers
  handlebars.registerHelper('currentYear', () => new Date().getFullYear());
} catch (error) {
  console.error('Failed to load handlebars:', error.message);
}

const config = require('../config/config');
const logger = require('../config/logger');

// Create a transporter using the configured email settings
const createTransporter = () => {
  return nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.port === 465, // true for 465, false for other ports
    auth: {
      user: config.email.user,
      pass: config.email.password,
    },
  });
};

/**
 * Load an email template and compile it with Handlebars
 * @param {string} templateName - The name of the template file (without extension)
 * @returns {Promise<Function>} Compiled Handlebars template
 */
const loadTemplate = async (templateName) => {
  try {
    if (!handlebars) {
      throw new Error('Handlebars is not available');
    }
    
    // Try to load from templates directory first
    const filePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.hbs`);
    
    try {
      // Check if file exists
      await fs.access(filePath);
      const templateSource = await fs.readFile(filePath, 'utf-8');
      return handlebars.compile(templateSource);
    } catch (fileError) {
      // If file doesn't exist, use a simple fallback template
      logger.warn(`Email template '${templateName}' not found, using fallback template`);
      
      // Create a fallback template
      const fallbackTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${templateName}</title>
        </head>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2>{{title}}</h2>
            <p>Hello {{firstName}},</p>
            <p>{{message}}</p>
            <p>Best regards,<br>The JayLink Team</p>
          </div>
        </body>
        </html>
      `;
      
      return handlebars.compile(fallbackTemplate);
    }
  } catch (error) {
    logger.error(`Failed to load email template '${templateName}': ${error.message}`);
    throw new Error(`Email template '${templateName}' not found or cannot be loaded`);
  }
};

/**
 * Send an email using a template
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name
 * @param {Object} options.context - Template variables
 * @param {Array<Object>} [options.attachments] - Email attachments
 * @returns {Promise<boolean>} Success status
 */
const sendTemplateEmail = async (options) => {
  try {
    // Load and compile template
    const template = await loadTemplate(options.template);
    const html = template(options.context);

    // Prepare mail options
    const mailOptions = {
      from: config.email.from,
      to: options.to,
      subject: options.subject,
      html,
      attachments: options.attachments || [],
    };

    // Create transporter and send email
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);

    logger.info(`Email sent to ${options.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}: ${error.message}`, { stack: error.stack });
    
    // In production, we might want to retry sending or queue the email
    if (config.env === 'production') {
      // Here you could implement a retry mechanism or add to a queue
      logger.warn(`Email sending will be retried later or added to queue`);
    }
    
    return false;
  }
};

/**
 * Send a welcome email to a new user
 * @param {Object} user - User object
 * @returns {Promise<boolean>} Success status
 */
const sendWelcomeEmail = async (user) => {
  return sendTemplateEmail({
    to: user.email,
    subject: 'Welcome to JayLink SMS',
    template: 'welcome',
    context: {
      title: 'Welcome to JayLink SMS',
      firstName: user.firstName,
      lastName: user.lastName,
      appUrl: config.frontendUrl,
      message: 'Thank you for joining JayLink SMS, your reliable platform for SMS and voice messaging. We\'re excited to have you onboard!'
    },
  });
};

/**
 * Send a password reset email
 * @param {Object} user - User object
 * @param {string} token - Reset token
 * @returns {Promise<boolean>} Success status
 */
const sendPasswordResetEmail = async (user, token) => {
  const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
  
  return sendTemplateEmail({
    to: user.email,
    subject: 'Reset Your JayLink Password',
    template: 'password-reset',
    context: {
      title: 'Reset Your Password',
      firstName: user.firstName,
      resetUrl,
      expiryTime: '1 hour', // This should match your token expiry
      message: 'We received a request to reset your password. If you didn\'t make this request, you can safely ignore this email.'
    },
  });
};

/**
 * Send a password reset confirmation email with temporary password
 * @param {Object} user - User object
 * @param {string} tempPassword - Temporary password
 * @returns {Promise<boolean>} Success status
 */
const sendPasswordResetConfirmation = async (user, tempPassword) => {
  return sendTemplateEmail({
    to: user.email,
    subject: 'Your JayLink Password Has Been Reset',
    template: 'password-reset-confirmation',
    context: {
      title: 'Password Reset Confirmation',
      firstName: user.firstName,
      tempPassword: tempPassword,
      loginUrl: `${config.frontendUrl}/login`,
      supportEmail: 'support@jaylink.com',
      message: 'Your password has been reset by an administrator. Please use the temporary password below to log in, then change your password immediately.'
    },
  });
};

/**
 * Send a password change confirmation email
 * @param {Object} user - User object
 * @returns {Promise<boolean>} Success status
 */
const sendPasswordChangedEmail = async (user) => {
  return sendTemplateEmail({
    to: user.email,
    subject: 'Your JayLink Password Has Been Changed',
    template: 'password-changed',
    context: {
      title: 'Password Changed Successfully',
      firstName: user.firstName,
      supportEmail: 'support@jaylink.com',
      appUrl: config.frontendUrl,
      message: 'Your password has been successfully changed. If you did not make this change, please contact support immediately.'
    },
  });
};

/**
 * Send a low balance alert email
 * @param {Object} user - User object
 * @param {number} balance - Current balance
 * @param {number} threshold - Low balance threshold
 * @returns {Promise<boolean>} Success status
 */
const sendLowBalanceEmail = async (user, balance, threshold) => {
  return sendTemplateEmail({
    to: user.email,
    subject: 'Low Balance Alert - JayLink SMS',
    template: 'low-balance',
    context: {
      title: 'Low Balance Alert',
      firstName: user.firstName,
      balance: balance.toFixed(2),
      threshold: threshold.toFixed(2),
      topUpUrl: `${config.frontendUrl}/balance`,
      message: 'Your account balance is below the recommended minimum threshold. Please top up your account to ensure uninterrupted service.'
    },
  });
};

/**
 * Send a message delivery report email
 * @param {Object} user - User object
 * @param {Object} message - Message details
 * @returns {Promise<boolean>} Success status
 */
const sendDeliveryReportEmail = async (user, message) => {
  return sendTemplateEmail({
    to: user.email,
    subject: 'Message Delivery Report - JayLink SMS',
    template: 'delivery-report',
    context: {
      title: 'Message Delivery Report',
      firstName: user.firstName,
      messageId: message.messageId,
      recipients: message.recipients,
      delivered: message.delivered,
      failed: message.failed,
      sentTime: message.sentTime,
      reportUrl: `${config.frontendUrl}/analytics`,
      message: 'Here is the delivery report for your recent message campaign.'
    },
  });
};

module.exports = {
  sendTemplateEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
  sendLowBalanceEmail,
  sendDeliveryReportEmail,
  sendPasswordResetConfirmation,
};