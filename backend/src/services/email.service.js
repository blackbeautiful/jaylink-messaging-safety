const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
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

// Register Handlebars helpers
handlebars.registerHelper('currentYear', () => new Date().getFullYear());

/**
 * Load an email template and compile it with Handlebars
 * @param {string} templateName - The name of the template file (without extension)
 * @returns {Promise<Function>} Compiled Handlebars template
 */
const loadTemplate = async (templateName) => {
  try {
    const filePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.hbs`);
    const templateSource = await fs.readFile(filePath, 'utf-8');
    return handlebars.compile(templateSource);
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
      firstName: user.firstName,
      lastName: user.lastName,
      appUrl: config.frontendUrl,
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
      firstName: user.firstName,
      resetUrl,
      expiryTime: '1 hour', // This should match your token expiry
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
      firstName: user.firstName,
      supportEmail: 'support@jaylink.com',
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
      firstName: user.firstName,
      balance: balance.toFixed(2),
      threshold: threshold.toFixed(2),
      topUpUrl: `${config.frontendUrl}/balance`,
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
      firstName: user.firstName,
      messageId: message.messageId,
      recipients: message.recipients,
      delivered: message.delivered,
      failed: message.failed,
      sentTime: message.sentTime,
      reportUrl: `${config.frontendUrl}/analytics`,
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
};