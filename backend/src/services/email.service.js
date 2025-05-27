// backend/src/services/email.service.js - ENHANCED with payment success email
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
let handlebars;
try {
  handlebars = require('handlebars');
  
  // Register Handlebars helpers
  handlebars.registerHelper('currentYear', () => new Date().getFullYear());
  handlebars.registerHelper('formatCurrency', (amount, symbol) => `${symbol}${parseFloat(amount).toFixed(2)}`);
  handlebars.registerHelper('formatDate', (date) => new Date(date).toLocaleString());
} catch (error) {
  console.error('Failed to load handlebars:', error.message);
}

const config = require('../config/config');
const logger = require('../config/logger');

// Create a transporter using the configured email settings
const createTransporter = () => {
  return nodemailer.createTransporter({
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
      // If file doesn't exist, use a fallback template
      logger.warn(`Email template '${templateName}' not found, using fallback template`);
      
      // Create a fallback template based on template type
      let fallbackTemplate;
      
      switch (templateName) {
        case 'payment-success':
          fallbackTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Payment Successful - JayLink SMS</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
                .amount { font-size: 24px; font-weight: bold; color: #10b981; text-align: center; margin: 20px 0; }
                .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🎉 Payment Successful!</h1>
                </div>
                <div class="content">
                  <p>Hello {{firstName}},</p>
                  <p>Great news! Your payment has been processed successfully and your account has been credited.</p>
                  
                  <div class="amount">{{formatCurrency amount currencySymbol}}</div>
                  
                  <div class="details">
                    <h3>Payment Details:</h3>
                    <p><strong>Amount:</strong> {{formatCurrency amount currencySymbol}}</p>
                    <p><strong>Payment Method:</strong> {{paymentMethod}}</p>
                    <p><strong>Reference:</strong> {{reference}}</p>
                    <p><strong>New Balance:</strong> {{formatCurrency newBalance currencySymbol}}</p>
                    <p><strong>Date:</strong> {{formatDate timestamp}}</p>
                  </div>
                  
                  <p>You can now continue using JayLink SMS services. Your account balance has been updated and is ready for use.</p>
                  
                  <div style="text-align: center;">
                    <a href="{{appUrl}}/balance" class="button">View Balance</a>
                  </div>
                  
                  <p>Thank you for choosing JayLink SMS!</p>
                </div>
                <div class="footer">
                  <p>This is an automated email. Please do not reply to this message.</p>
                  <p>&copy; {{currentYear}} JayLink SMS. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `;
          break;
          
        case 'low-balance':
          fallbackTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>Low Balance Alert - JayLink SMS</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #f59e0b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #fef3c7; padding: 30px; border-radius: 0 0 8px 8px; }
                .balance { font-size: 24px; font-weight: bold; color: #f59e0b; text-align: center; margin: 20px 0; }
                .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>⚠️ Low Balance Alert</h1>
                </div>
                <div class="content">
                  <p>Hello {{firstName}},</p>
                  <p>This is a friendly reminder that your JayLink SMS account balance is running low.</p>
                  
                  <div class="balance">Current Balance: {{formatCurrency balance currencySymbol}}</div>
                  
                  <p>To ensure uninterrupted service, we recommend topping up your account when your balance falls below {{formatCurrency threshold currencySymbol}}.</p>
                  
                  <div style="text-align: center;">
                    <a href="{{topUpUrl}}" class="button">Top Up Now</a>
                  </div>
                  
                  <p>Thank you for using JayLink SMS!</p>
                </div>
                <div class="footer">
                  <p>&copy; {{currentYear}} JayLink SMS. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `;
          break;
          
        default:
          fallbackTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>{{title}}</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .content { background: #f9fafb; padding: 30px; border-radius: 8px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="content">
                  <h2>{{title}}</h2>
                  <p>Hello {{firstName}},</p>
                  <p>{{message}}</p>
                  <p>Best regards,<br>The JayLink Team</p>
                </div>
                <div class="footer">
                  <p>&copy; {{currentYear}} JayLink SMS. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `;
      }
      
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
 * NEW: Send a payment success email
 * @param {Object} user - User object
 * @param {Object} paymentData - Payment data
 * @returns {Promise<boolean>} Success status
 */
const sendPaymentSuccessEmail = async (user, paymentData) => {
  return sendTemplateEmail({
    to: user.email,
    subject: `Payment Successful - ${paymentData.currencySymbol}${paymentData.amount.toFixed(2)} Added to Your Account`,
    template: 'payment-success',
    context: {
      title: 'Payment Successful',
      firstName: user.firstName,
      lastName: user.lastName,
      amount: paymentData.amount,
      currencySymbol: paymentData.currency || '₦',
      paymentMethod: paymentData.paymentMethod || 'Paystack',
      reference: paymentData.reference,
      newBalance: paymentData.newBalance,
      transactionId: paymentData.transactionId,
      timestamp: new Date().toISOString(),
      appUrl: config.frontendUrl,
      message: `Your payment of ${paymentData.currency}${paymentData.amount.toFixed(2)} has been processed successfully and added to your JayLink SMS account.`
    },
  });
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
 * Send a low balance alert email - ENHANCED with configurable threshold
 * @param {Object} user - User object
 * @param {number} balance - Current balance
 * @param {number} threshold - Low balance threshold
 * @param {Object} currency - Currency configuration
 * @returns {Promise<boolean>} Success status
 */
const sendLowBalanceEmail = async (user, balance, threshold, currency = { symbol: '₦' }) => {
  return sendTemplateEmail({
    to: user.email,
    subject: 'Low Balance Alert - JayLink SMS',
    template: 'low-balance',
    context: {
      title: 'Low Balance Alert',
      firstName: user.firstName,
      balance: balance.toFixed(2),
      threshold: threshold.toFixed(2),
      currencySymbol: currency.symbol || '₦',
      topUpUrl: `${config.frontendUrl}/balance`,
      appUrl: config.frontendUrl,
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
  sendPaymentSuccessEmail, // NEW: Payment success email
};