// backend/src/controllers/payment.controller.js
const paymentService = require('../services/payment.service');
const balanceService = require('../services/balance.service');
const notificationService = require('../services/notification.service');
const response = require('../utils/response.util');
const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');
const config = require('../config/config');

/**
 * Initialize payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const initializePayment = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const { amount } = req.body;
    
    if (!amount || parseFloat(amount) <= 0) {
      throw new ApiError('Valid amount is required', 400);
    }
    
    // Create payment initialization data
    const paymentData = {
      amount: parseFloat(amount),
      email: req.user.email,
      userId: userId,
      name: `${req.user.firstName} ${req.user.lastName}`,
      phone: req.user.phone || ''
    };
    
    // Initialize payment with Paystack
    const result = await paymentService.initializePayment(paymentData);
    
    return response.success(res, result, 'Payment initialized successfully');
  } catch (error) {
    logger.error(`Initialize payment controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      amount: req.body?.amount
    });
    next(error);
  }
};

/**
 * Verify payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const verifyPayment = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const { reference } = req.params;
    
    if (!reference) {
      throw new ApiError('Payment reference is required', 400);
    }
    
    // Verify payment with Paystack
    const verificationResult = await paymentService.verifyPayment(reference);
    
    // If payment was successful, credit user's balance
    if (verificationResult.success) {
      // Process the payment in our system
      const result = await balanceService.processPayment(
        userId,
        reference,
        verificationResult.amount,
        'success',
        verificationResult.paymentMethod || 'Paystack'
      );
      
      // Create notification
      await notificationService.createPaymentNotification(
        userId,
        verificationResult.amount,
        verificationResult.paymentMethod || 'Paystack',
        reference
      );
      
      return response.success(
        res, 
        { 
          ...result,
          authorizationData: verificationResult.cardDetails
        }, 
        'Payment verification successful'
      );
    } else {
      // Record failed payment
      await balanceService.processPayment(
        userId,
        reference,
        verificationResult.amount || 0,
        'failed',
        'Paystack'
      );
      
      return response.error(
        res,
        'Payment verification failed',
        400,
        { reference, reason: verificationResult.failureReason || 'Unknown error' }
      );
    }
  } catch (error) {
    logger.error(`Verify payment controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      reference: req.params?.reference
    });
    next(error);
  }
};

/**
 * Get payment details for frontend initialization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getPaymentDetails = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const { amount } = req.body;
    
    if (!amount || parseFloat(amount) <= 0) {
      throw new ApiError('Valid amount is required', 400);
    }
    
    // Create payment data for frontend
    const paymentData = {
      amount: parseFloat(amount),
      email: req.user.email,
      userId: userId
    };
    
    // Get payment details for frontend
    const result = paymentService.getPaymentDetails(paymentData);
    
    return response.success(res, result, 'Payment details retrieved successfully');
  } catch (error) {
    logger.error(`Get payment details controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      amount: req.body?.amount
    });
    next(error);
  }
};

/**
 * Handle webhook from payment provider
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const handleWebhook = async (req, res, next) => {
  try {
    // Process webhook immediately to avoid timeout
    res.status(200).json({ received: true });
    
    // Get webhook data and headers
    const webhookData = req.body;
    const headers = req.headers;
    
    // Process webhook asynchronously
    processWebhook(webhookData, headers).catch(error => {
      logger.error(`Async webhook processing error: ${error.message}`, { 
        stack: error.stack,
        event: webhookData?.event
      });
    });
  } catch (error) {
    logger.error(`Webhook controller error: ${error.message}`, { 
      stack: error.stack,
      body: req.body
    });
    // Respond with 200 even on error to prevent retries
    res.status(200).json({ received: true });
  }
};

/**
 * Process webhook data asynchronously
 * @private
 */
const processWebhook = async (webhookData, headers) => {
  try {
    // Verify and process the webhook event
    const event = await paymentService.processWebhook(headers, webhookData);
    
    logger.info(`Processing webhook event: ${event.eventType}`, {
      reference: event.reference,
      status: event.status
    });
    
    // Handle different event types
    switch (event.eventType) {
      case 'charge.success':
        // Process successful payment
        if (event.status === 'completed' && event.userId) {
          await balanceService.processPaystackWebhook(event);
          
          // Create notification
          if (event.amount) {
            await notificationService.createPaymentNotification(
              event.userId,
              event.amount,
              'Paystack',
              event.reference
            );
          }
        }
        break;
        
      case 'transfer.success':
        // Handle successful transfers if needed
        break;
        
      case 'transfer.failed':
        // Handle failed transfers if needed
        break;
        
      default:
        logger.info(`Unhandled webhook event type: ${event.eventType}`);
    }
    
    return {
      processed: true,
      event: event.eventType
    };
  } catch (error) {
    logger.error(`Webhook processing error: ${error.message}`, { 
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Get payment methods for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getPaymentMethods = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    // Get supported payment channels from config
    const paymentMethods = config.paymentGateway.channels.map(channel => {
      // Map channel codes to user-friendly names
      const displayNames = {
        'card': 'Credit/Debit Card',
        'bank': 'Bank Transfer',
        'ussd': 'USSD',
        'qr': 'QR Code',
        'bank_transfer': 'Bank Transfer',
        'mobile_money': 'Mobile Money'
      };
      
      return {
        code: channel,
        name: displayNames[channel] || channel,
        enabled: true
      };
    });
    
    return response.success(res, { paymentMethods }, 'Payment methods retrieved successfully');
  } catch (error) {
    logger.error(`Get payment methods controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id
    });
    next(error);
  }
};

/**
 * Get list of supported banks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getBanks = async (req, res, next) => {
  try {
    const banks = await paymentService.getBanks();
    
    return response.success(res, { banks }, 'Banks retrieved successfully');
  } catch (error) {
    logger.error(`Get banks controller error: ${error.message}`, { 
      stack: error.stack
    });
    next(error);
  }
};

module.exports = {
  initializePayment,
  verifyPayment,
  getPaymentDetails,
  handleWebhook,
  getPaymentMethods,
  getBanks
};