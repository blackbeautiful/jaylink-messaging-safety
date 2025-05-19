// backend/src/services/payment.service.js
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');
const { generateUniqueId } = require('../utils/id.util');

/**
 * Paystack Payment Service
 * Handles payment integration with Paystack for Nigerian payments
 */
class PaymentService {
  constructor() {
    this.provider = config.paymentGateway.provider;
    this.secretKey = config.paymentGateway.secretKey;
    this.publicKey = config.paymentGateway.publicKey;
    this.baseUrl = config.paymentGateway.baseUrl;
    this.callbackUrl = config.paymentGateway.callbackUrl;
    this.webhookSecret = config.paymentGateway.webhookSecret;
    this.testMode = config.paymentGateway.testMode;
    this.channels = config.paymentGateway.channels;
    
    // Initialize HTTP client for Paystack
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.secretKey}`
      },
      timeout: 15000 // 15s timeout
    });

    logger.info(`Payment Service initialized: ${this.provider} (${this.testMode ? 'test' : 'live'} mode)`);
  }

  /**
   * Initialize a payment transaction
   * @param {Object} paymentData - Payment data
   * @param {number} paymentData.amount - Amount in Naira
   * @param {string} paymentData.email - Customer email
   * @param {string} paymentData.reference - Optional custom reference
   * @param {string} paymentData.userId - User ID (for metadata)
   * @param {string} paymentData.name - Customer name (optional)
   * @param {string} paymentData.phone - Customer phone (optional)
   * @returns {Promise<Object>} Payment initialization response
   */
  async initializePayment(paymentData) {
    try {
      // Validate amount
      if (!paymentData.amount || paymentData.amount <= 0) {
        throw new ApiError('Invalid amount', 400);
      }

      // Validate email
      if (!paymentData.email || !this._isValidEmail(paymentData.email)) {
        throw new ApiError('Valid email is required', 400);
      }

      // Generate reference if not provided
      const reference = paymentData.reference || `pay_${generateUniqueId()}`;

      // Create payment metadata
      const metadata = {
        userId: paymentData.userId,
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: paymentData.userId
          }
        ]
      };

      if (paymentData.name) {
        metadata.custom_fields.push({
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: paymentData.name
        });
      }

      if (paymentData.phone) {
        metadata.custom_fields.push({
          display_name: "Phone Number",
          variable_name: "phone",
          value: paymentData.phone
        });
      }

      // Format amount in kobo (Paystack requires amount in kobo)
      const amountInKobo = Math.round(paymentData.amount * 100);

      // Create payment payload
      const payload = {
        amount: amountInKobo,
        email: paymentData.email,
        reference,
        callback_url: this.callbackUrl,
        metadata,
        channels: this.channels
      };

      // Set currency to NGN
      payload.currency = 'NGN';

      // Log the request (excluding sensitive data)
      logger.debug('Initializing payment', {
        provider: this.provider,
        reference,
        amount: paymentData.amount,
        currency: 'NGN',
        email: this._maskEmail(paymentData.email),
        testMode: this.testMode
      });

      // Initialize payment with Paystack
      const response = await this.client.post('/transaction/initialize', payload);

      if (response.data.status) {
        const result = {
          success: true,
          reference,
          authorizationUrl: response.data.data.authorization_url,
          accessCode: response.data.data.access_code,
          amount: paymentData.amount, // Send back in Naira for consistency
          currency: 'NGN',
          provider: this.provider
        };

        logger.info('Payment initialized successfully', {
          reference,
          amount: paymentData.amount,
          currency: 'NGN'
        });

        return result;
      } else {
        throw new ApiError(response.data.message || 'Payment initialization failed', 400);
      }
    } catch (error) {
      logger.error(`Payment initialization error: ${error.message}`, { stack: error.stack });

      if (error instanceof ApiError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || error.message;
        throw new ApiError(`Payment gateway error: ${errorMessage}`, statusCode);
      }

      throw new ApiError('Failed to initialize payment', 500);
    }
  }

  /**
   * Verify a payment transaction
   * @param {string} reference - Payment reference
   * @returns {Promise<Object>} Payment verification result
   */
  async verifyPayment(reference) {
    try {
      if (!reference) {
        throw new ApiError('Payment reference is required', 400);
      }

      logger.debug(`Verifying payment: ${reference}`);

      // Verify payment with Paystack
      const response = await this.client.get(`/transaction/verify/${reference}`);

      if (response.data.status && response.data.data.status === 'success') {
        // Extract relevant data for our application
        const transactionData = response.data.data;
        const amountInNaira = transactionData.amount / 100; // Convert from kobo to Naira

        // Extract user ID from metadata if available
        const userId = transactionData.metadata?.userId || 
                      transactionData.metadata?.user_id || 
                      transactionData.metadata?.custom_fields?.find(f => f.variable_name === 'user_id')?.value;

        const result = {
          success: true,
          reference: transactionData.reference,
          amount: amountInNaira, // Return in Naira
          currency: 'NGN',
          paymentDate: new Date(transactionData.paid_at || transactionData.created_at),
          channel: transactionData.channel,
          gatewayResponse: transactionData.gateway_response,
          paymentMethod: this._getPaymentMethod(transactionData),
          userId: userId || null,
          cardDetails: this._extractCardDetails(transactionData.authorization),
          raw: this.testMode ? transactionData : undefined // Only include raw data in test mode
        };

        logger.info('Payment verified successfully', {
          reference,
          amount: amountInNaira,
          currency: 'NGN',
          channel: result.channel
        });

        return result;
      } else if (response.data.status && response.data.data.status === 'failed') {
        // Payment failed but verification API call was successful
        const transactionData = response.data.data;
        
        return {
          success: false,
          reference: transactionData.reference,
          amount: transactionData.amount / 100,
          currency: 'NGN',
          failureReason: transactionData.gateway_response || 'Payment failed',
          status: transactionData.status
        };
      } else {
        throw new ApiError(response.data.message || 'Payment verification failed', 400);
      }
    } catch (error) {
      logger.error(`Payment verification error: ${error.message}`, { stack: error.stack });

      if (error instanceof ApiError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          return {
            success: false,
            reference,
            message: 'Payment not found',
            status: 'unknown'
          };
        }

        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || error.message;
        throw new ApiError(`Payment gateway error: ${errorMessage}`, statusCode);
      }

      throw new ApiError('Failed to verify payment', 500);
    }
  }

  /**
   * Process webhook event from Paystack
   * @param {Object} headers - Request headers
   * @param {Object} body - Webhook event body
   * @returns {Object} Processed event details
   */
  processWebhook(headers, body) {
    try {
      // Verify webhook signature
      const signature = headers['x-paystack-signature'];
      if (!signature) {
        throw new ApiError('Missing Paystack signature', 401);
      }

      const isValid = this._verifySignature(signature, body);
      if (!isValid) {
        throw new ApiError('Invalid webhook signature', 401);
      }

      // Process based on event type
      const event = body.event;
      const data = body.data;

      logger.info(`Received webhook event: ${event}`, {
        reference: data.reference,
        amount: data.amount ? data.amount / 100 : null
      });

      // Map event to standardized format
      const processedEvent = {
        eventType: event,
        reference: data.reference,
        status: this._mapPaystackStatus(data.status),
        amount: data.amount ? data.amount / 100 : null, // Convert from kobo to Naira
        currency: data.currency || 'NGN',
        metadata: data.metadata || {},
        paymentData: data,
        raw: this.testMode ? body : undefined // Only include raw data in test mode
      };

      // Add user ID if available in metadata
      if (data.metadata?.userId || data.metadata?.user_id) {
        processedEvent.userId = data.metadata.userId || data.metadata.user_id;
      } else if (data.metadata?.custom_fields) {
        const userIdField = data.metadata.custom_fields.find(f => 
          f.variable_name === 'user_id' || f.variable_name === 'userId'
        );
        if (userIdField) {
          processedEvent.userId = userIdField.value;
        }
      }

      return processedEvent;
    } catch (error) {
      logger.error(`Webhook processing error: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Get list of banks supported by Paystack
   * @returns {Promise<Array>} List of banks
   */
  async getBanks() {
    try {
      const response = await this.client.get('/bank');
      
      if (response.data.status) {
        return response.data.data.map(bank => ({
          id: bank.id,
          name: bank.name,
          code: bank.code,
          country: bank.country,
          currency: bank.currency,
          type: bank.type,
          isActive: bank.active
        }));
      } else {
        throw new ApiError(response.data.message || 'Failed to fetch banks', 400);
      }
    } catch (error) {
      logger.error(`Get banks error: ${error.message}`, { stack: error.stack });
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || error.message;
        throw new ApiError(`Payment gateway error: ${errorMessage}`, statusCode);
      }
      
      throw new ApiError('Failed to fetch banks', 500);
    }
  }

  /**
   * Generate a payment link URL directly for front-end usage
   * @param {Object} paymentData - Payment data
   * @returns {Object} Payment details with public key
   */
  getPaymentDetails(paymentData) {
    // Generate reference if not provided
    const reference = paymentData.reference || `pay_${generateUniqueId()}`;
    
    // Format amount in kobo (Paystack requires amount in kobo)
    const amountInKobo = Math.round(paymentData.amount * 100);
    
    return {
      publicKey: this.publicKey,
      reference: reference,
      amount: amountInKobo, // in kobo for Paystack frontend
      currency: 'NGN',
      email: paymentData.email,
      callbackUrl: this.callbackUrl,
      metadata: {
        userId: paymentData.userId
      },
      channels: this.channels
    };
  }

  /**
   * Validate email format
   * @private
   */
  _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Mask email for logging
   * @private
   */
  _maskEmail(email) {
    if (!email) return null;
    const parts = email.split('@');
    if (parts.length !== 2) return email;
    
    const name = parts[0];
    const domain = parts[1];
    
    const maskedName = name.length <= 3 
      ? name.charAt(0) + '***'
      : name.charAt(0) + '***' + name.charAt(name.length - 1);
    
    return `${maskedName}@${domain}`;
  }

  /**
   * Extract card details while removing sensitive information
   * @private
   */
  _extractCardDetails(authorization) {
    if (!authorization) return null;
    
    // Only include non-sensitive card details
    return {
      bin: authorization.bin,
      last4: authorization.last4,
      brand: authorization.brand,
      bank: authorization.bank,
      cardType: authorization.card_type,
      expMonth: authorization.exp_month,
      expYear: authorization.exp_year,
      countryCode: authorization.country_code,
      reusable: authorization.reusable
    };
  }

  /**
   * Get payment method from transaction data
   * @private
   */
  _getPaymentMethod(transactionData) {
    if (!transactionData) return 'unknown';
    
    // Determine payment method from channel and authorization
    const channel = transactionData.channel || '';
    
    switch (channel.toLowerCase()) {
      case 'card':
        return transactionData.authorization?.card_type || 'card';
      case 'bank':
        return 'bank_transfer';
      case 'ussd':
        return 'ussd';
      case 'qr':
        return 'qr_code';
      case 'mobile_money':
        return 'mobile_money';
      default:
        return channel || 'unknown';
    }
  }

  /**
   * Map Paystack status to standardized status
   * @private
   */
  _mapPaystackStatus(status) {
    if (!status) return 'unknown';
    
    switch (status.toLowerCase()) {
      case 'success':
        return 'completed';
      case 'abandoned':
        return 'abandoned';
      case 'failed':
        return 'failed';
      case 'reversed':
        return 'refunded';
      case 'pending':
        return 'pending';
      default:
        return status.toLowerCase();
    }
  }

  /**
   * Verify webhook signature
   * @private
   */
  _verifySignature(signature, payload) {
    try {
      const hash = crypto
        .createHmac('sha512', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      return hash === signature;
    } catch (error) {
      logger.error(`Signature verification error: ${error.message}`, { stack: error.stack });
      return false;
    }
  }
}

// Export as singleton
module.exports = new PaymentService();