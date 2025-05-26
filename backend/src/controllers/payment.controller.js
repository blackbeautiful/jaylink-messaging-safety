// backend/src/controllers/payment.controller.js - COMPLETE FIXED VERSION
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
    
    // Get request origin for dynamic redirect
    const requestOrigin = req.get('origin') || req.get('referer') || req.protocol + '://' + req.get('host');
    
    // Initialize payment with Paystack
    const result = await paymentService.initializePayment(paymentData, requestOrigin);
    
    logger.info('Payment initialized successfully', {
      reference: result.reference,
      amount: paymentData.amount,
      currency: 'NGN',
      callbackUrl: result.callbackUrl
    });
    
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
 * Verify payment - FIXED with better error handling and duplicate prevention
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
    
    logger.info('Payment verification started', {
      userId,
      reference
    });
    
    // Verify payment with Paystack
    const verificationResult = await paymentService.verifyPayment(reference);
    
    logger.info('Payment verified with gateway', {
      userId,
      reference,
      success: verificationResult.success,
      amount: verificationResult.amount
    });
    
    // If payment was successful, credit user's balance
    if (verificationResult.success) {
      // FIXED: Check if user ID matches
      if (verificationResult.userId && verificationResult.userId !== userId) {
        logger.warn('Payment verification: User ID mismatch', {
          requestUserId: userId,
          paymentUserId: verificationResult.userId,
          reference
        });
        throw new ApiError('Payment verification failed: User mismatch', 400);
      }
      
      try {
        // Process the payment in our system
        const result = await balanceService.processPayment(
          userId,
          reference,
          verificationResult.amount,
          'success',
          verificationResult.paymentMethod || 'Paystack'
        );
        
        logger.info('Payment processed successfully', {
          userId,
          reference,
          amount: verificationResult.amount,
          transactionId: result.transactionId,
          newBalance: result.balance,
          alreadyProcessed: result.alreadyProcessed || false
        });
        
        // Create notification only if not already processed
        if (!result.alreadyProcessed) {
          try {
            await notificationService.createPaymentNotification(
              userId,
              verificationResult.amount,
              verificationResult.paymentMethod || 'Paystack',
              reference
            );
          } catch (notificationError) {
            logger.error('Failed to create payment notification', {
              error: notificationError.message,
              userId,
              reference
            });
            // Don't fail the whole process for notification errors
          }
        }
        
        return response.success(
          res, 
          { 
            ...result,
            authorizationData: verificationResult.cardDetails
          }, 
          result.alreadyProcessed ? 'Payment already processed' : 'Payment verification successful'
        );
      } catch (balanceError) {
        logger.error('Balance processing error during payment verification', {
          error: balanceError.message,
          stack: balanceError.stack,
          userId,
          reference,
          amount: verificationResult.amount
        });
        
        // Check if it's a validation error (likely duplicate)
        if (balanceError.message && balanceError.message.includes('Validation error')) {
          // Try to find the existing transaction
          try {
            const db = require('../models');
            const existingTransaction = await db.Transaction.findOne({
              where: {
                transactionId: `PMT-${reference}`
              }
            });
            
            if (existingTransaction) {
              logger.info('Found existing transaction for payment', {
                userId,
                reference,
                existingTransactionId: existingTransaction.transactionId,
                status: existingTransaction.status
              });
              
              return response.success(
                res,
                {
                  success: existingTransaction.status === 'completed',
                  transactionId: existingTransaction.transactionId,
                  paymentId: reference,
                  amount: parseFloat(existingTransaction.amount),
                  balance: parseFloat(existingTransaction.balanceAfter),
                  currency: 'NGN',
                  currencySymbol: '₦',
                  alreadyProcessed: true
                },
                'Payment already processed'
              );
            }
          } catch (findError) {
            logger.error('Error finding existing transaction', {
              error: findError.message,
              userId,
              reference
            });
          }
        }
        
        throw balanceError;
      }
    } else {
      // Record failed payment
      try {
        await balanceService.processPayment(
          userId,
          reference,
          verificationResult.amount || 0,
          'failed',
          'Paystack'
        );
      } catch (failedPaymentError) {
        logger.error('Error recording failed payment', {
          error: failedPaymentError.message,
          userId,
          reference
        });
        // Continue with the error response even if we can't record the failed payment
      }
      
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
 * Handle webhook from payment provider - FIXED with better async handling
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
    
    logger.info('Webhook received', {
      event: webhookData?.event,
      reference: webhookData?.data?.reference,
      status: webhookData?.data?.status
    });
    
    // Process webhook asynchronously
    processWebhook(webhookData, headers).catch(error => {
      logger.error(`Async webhook processing error: ${error.message}`, { 
        stack: error.stack,
        event: webhookData?.event,
        reference: webhookData?.data?.reference
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
 * Process webhook data asynchronously - FIXED with better error handling
 * @private
 */
const processWebhook = async (webhookData, headers) => {
  try {
    // Verify and process the webhook event
    const event = await paymentService.processWebhook(headers, webhookData);
    
    logger.info(`Processing webhook event: ${event.eventType}`, {
      reference: event.reference,
      status: event.status,
      userId: event.userId,
      amount: event.amount
    });
    
    // Handle different event types
    switch (event.eventType) {
      case 'charge.success':
        // Process successful payment
        if (event.status === 'completed' && event.userId && event.amount) {
          try {
            const result = await balanceService.processPaystackWebhook(event);
            
            logger.info('Webhook payment processing completed', {
              reference: event.reference,
              userId: event.userId,
              amount: event.amount,
              processed: result.processed,
              alreadyProcessed: result.alreadyProcessed
            });
            
            // Create notification only if newly processed
            if (result.processed && !result.alreadyProcessed) {
              try {
                await notificationService.createPaymentNotification(
                  event.userId,
                  event.amount,
                  'Paystack',
                  event.reference
                );
              } catch (notificationError) {
                logger.error('Failed to create webhook notification', {
                  error: notificationError.message,
                  userId: event.userId,
                  reference: event.reference
                });
                // Don't fail the whole process for notification errors
              }
            }
          } catch (processingError) {
            logger.error('Webhook payment processing failed', {
              error: processingError.message,
              stack: processingError.stack,
              reference: event.reference,
              userId: event.userId,
              amount: event.amount
            });
            
            // Don't throw error to prevent webhook retries for processing errors
          }
        } else {
          logger.warn('Webhook event missing required data', {
            eventType: event.eventType,
            reference: event.reference,
            status: event.status,
            userId: event.userId,
            amount: event.amount
          });
        }
        break;
        
      case 'transfer.success':
        // Handle successful transfers if needed
        logger.info('Transfer success webhook received', {
          reference: event.reference
        });
        break;
        
      case 'transfer.failed':
        // Handle failed transfers if needed
        logger.info('Transfer failed webhook received', {
          reference: event.reference
        });
        break;
        
      default:
        logger.info(`Unhandled webhook event type: ${event.eventType}`, {
          reference: event.reference
        });
    }
    
    return {
      processed: true,
      event: event.eventType
    };
  } catch (error) {
    logger.error(`Webhook processing error: ${error.message}`, { 
      stack: error.stack,
      event: webhookData?.event,
      reference: webhookData?.data?.reference
    });
    
    // Don't throw error to prevent webhook retries
    return {
      processed: false,
      error: error.message
    };
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

/**
 * Get payment status - New endpoint to check payment status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getPaymentStatus = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const { reference } = req.params;
    
    if (!reference) {
      throw new ApiError('Payment reference is required', 400);
    }
    
    // Check if transaction exists in our database
    const db = require('../models');
    const existingTransaction = await db.Transaction.findOne({
      where: {
        transactionId: `PMT-${reference}`,
        userId: userId
      }
    });
    
    if (existingTransaction) {
      return response.success(res, {
        reference,
        status: existingTransaction.status,
        amount: parseFloat(existingTransaction.amount),
        transactionId: existingTransaction.transactionId,
        processed: true,
        createdAt: existingTransaction.createdAt
      }, 'Payment status retrieved');
    }
    
    // If not found in database, check with payment gateway
    try {
      const verificationResult = await paymentService.verifyPayment(reference);
      
      return response.success(res, {
        reference,
        status: verificationResult.success ? 'completed' : 'failed',
        amount: verificationResult.amount,
        processed: false,
        gatewayStatus: verificationResult.success
      }, 'Payment status retrieved from gateway');
    } catch (gatewayError) {
      return response.success(res, {
        reference,
        status: 'unknown',
        processed: false,
        error: 'Unable to verify with gateway'
      }, 'Payment status unknown');
    }
  } catch (error) {
    logger.error(`Get payment status controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      reference: req.params?.reference
    });
    next(error);
  }
};

/**
 * Resend payment notification - New endpoint for resending notifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const resendPaymentNotification = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const { reference } = req.params;
    
    if (!reference) {
      throw new ApiError('Payment reference is required', 400);
    }
    
    // Find the transaction
    const db = require('../models');
    const transaction = await db.Transaction.findOne({
      where: {
        transactionId: `PMT-${reference}`,
        userId: userId,
        status: 'completed'
      }
    });
    
    if (!transaction) {
      throw new ApiError('Completed payment transaction not found', 404);
    }
    
    // Resend notification
    try {
      await notificationService.createPaymentNotification(
        userId,
        parseFloat(transaction.amount),
        'Paystack',
        reference
      );
      
      return response.success(res, {
        reference,
        transactionId: transaction.transactionId,
        notificationSent: true
      }, 'Payment notification resent successfully');
    } catch (notificationError) {
      logger.error('Failed to resend payment notification', {
        error: notificationError.message,
        userId,
        reference
      });
      
      throw new ApiError('Failed to send notification', 500);
    }
  } catch (error) {
    logger.error(`Resend payment notification controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      reference: req.params?.reference
    });
    next(error);
  }
};

/**
 * Cancel payment - New endpoint for canceling pending payments
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const cancelPayment = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const { reference } = req.params;
    
    if (!reference) {
      throw new ApiError('Payment reference is required', 400);
    }
    
    // Check payment status with gateway first
    try {
      const verificationResult = await paymentService.verifyPayment(reference);
      
      if (verificationResult.success) {
        throw new ApiError('Cannot cancel a successful payment', 400);
      }
      
      // If payment is not successful, we can mark it as cancelled
      const db = require('../models');
      const existingTransaction = await db.Transaction.findOne({
        where: {
          transactionId: `PMT-${reference}`,
          userId: userId
        }
      });
      
      if (existingTransaction && existingTransaction.status === 'completed') {
        throw new ApiError('Cannot cancel a completed payment', 400);
      }
      
      // Update or create cancelled transaction record
      if (existingTransaction) {
        await existingTransaction.update({
          status: 'failed',
          description: `${existingTransaction.description} - Cancelled by user`
        });
      } else {
        // Create a cancelled transaction record
        await db.Transaction.create({
          userId,
          transactionId: `PMT-${reference}`,
          type: 'credit',
          amount: verificationResult.amount || 0,
          balanceAfter: req.user.balance || 0,
          service: 'payment',
          status: 'failed',
          description: `Payment cancelled by user. Reference: ${reference}`,
        });
      }
      
      return response.success(res, {
        reference,
        status: 'cancelled',
        message: 'Payment has been cancelled'
      }, 'Payment cancelled successfully');
      
    } catch (gatewayError) {
      // If we can't verify with gateway, assume it's safe to cancel
      logger.warn('Could not verify payment with gateway for cancellation', {
        reference,
        userId,
        error: gatewayError.message
      });
      
      return response.success(res, {
        reference,
        status: 'cancelled',
        message: 'Payment cancellation requested'
      }, 'Payment cancellation processed');
    }
  } catch (error) {
    logger.error(`Cancel payment controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id,
      reference: req.params?.reference
    });
    next(error);
  }
};

/**
 * Get payment history - New endpoint for getting user's payment history
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getPaymentHistory = async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new ApiError('User not authenticated', 401);
    }
    
    const userId = req.user.id;
    const { page = 1, limit = 20, status = null } = req.query;
    
    const db = require('../models');
    const whereClause = {
      userId,
      service: 'payment'
    };
    
    if (status) {
      whereClause.status = status;
    }
    
    const { count, rows } = await db.Transaction.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset: (parseInt(page, 10) - 1) * parseInt(limit, 10)
    });
    
    const payments = rows.map(transaction => ({
      id: transaction.id,
      reference: transaction.transactionId.replace('PMT-', ''),
      amount: parseFloat(transaction.amount),
      status: transaction.status,
      description: transaction.description,
      createdAt: transaction.createdAt,
      currency: 'NGN',
      currencySymbol: '₦'
    }));
    
    return response.success(res, {
      payments,
      pagination: {
        total: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page, 10),
        limit: parseInt(limit, 10),
        hasNext: page < Math.ceil(count / limit),
        hasPrev: page > 1
      }
    }, 'Payment history retrieved successfully');
  } catch (error) {
    logger.error(`Get payment history controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.user?.id
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
  getBanks,
  getPaymentStatus,
  resendPaymentNotification,
  cancelPayment,
  getPaymentHistory
};