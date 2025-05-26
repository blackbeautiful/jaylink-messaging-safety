// backend/src/services/payment.service.js - FIXED with dynamic redirects
const axios = require('axios');
const crypto = require('crypto');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');
const { generateUniqueId } = require('../utils/id.util');

/**
 * Paystack Payment Service - FIXED VERSION with Dynamic Redirects
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
      timeout: 15000
    });

    logger.info(`Payment Service initialized: ${this.provider} (${this.testMode ? 'test' : 'live'} mode)`);
  }

  /**
   * Initialize a payment transaction - FIXED WITH DYNAMIC REDIRECT
   */
  async initializePayment(paymentData, requestOrigin = null) {
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

      // Create payment metadata - FIXED: Ensure userId is properly included
      const metadata = {
        userId: paymentData.userId,
        requestOrigin: requestOrigin, // Track where the request came from
        custom_fields: [
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: String(paymentData.userId)
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

      // FIXED: Format amount in kobo (Paystack requires amount in kobo)
      const amountInKobo = Math.round(paymentData.amount * 100);
      
      // Log the amount conversion for debugging
      logger.info('Payment amount conversion', {
        originalAmount: paymentData.amount,
        amountInKobo: amountInKobo,
        reference: reference
      });

      // FIXED: Create dynamic callback URL based on request origin
      const frontendRedirectUrl = this._getDynamicRedirectUrl(reference, requestOrigin);

      // Create payment payload
      const payload = {
        amount: amountInKobo,
        email: paymentData.email,
        reference,
        callback_url: frontendRedirectUrl,
        metadata,
        channels: this.channels,
        currency: 'NGN'
      };

      logger.debug('Initializing payment', {
        provider: this.provider,
        reference,
        amount: paymentData.amount,
        amountInKobo: amountInKobo,
        currency: 'NGN',
        email: this._maskEmail(paymentData.email),
        callbackUrl: frontendRedirectUrl,
        testMode: this.testMode,
        userId: paymentData.userId,
        requestOrigin: requestOrigin
      });

      // Initialize payment with Paystack
      const response = await this.client.post('/transaction/initialize', payload);

      if (response.data.status) {
        const result = {
          success: true,
          reference,
          authorizationUrl: response.data.data.authorization_url,
          accessCode: response.data.data.access_code,
          amount: paymentData.amount,
          currency: 'NGN',
          provider: this.provider,
          callbackUrl: frontendRedirectUrl
        };

        logger.info('Payment initialized successfully', {
          reference,
          amount: paymentData.amount,
          amountInKobo: amountInKobo,
          currency: 'NGN',
          callbackUrl: frontendRedirectUrl,
          userId: paymentData.userId
        });

        return result;
      } else {
        throw new ApiError(response.data.message || 'Payment initialization failed', 400);
      }
    } catch (error) {
      logger.error(`Payment initialization error: ${error.message}`, { 
        stack: error.stack,
        userId: paymentData?.userId,
        amount: paymentData?.amount
      });

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
   * Get dynamic redirect URL based on request origin
   * @private
   */
  _getDynamicRedirectUrl(reference, requestOrigin) {
    // If request came from API URL (embedded frontend), redirect to API URL
    if (requestOrigin && requestOrigin.includes(config.apiUrl || 'localhost:3000')) {
      return `${config.apiUrl}/balance?payment=success&reference=${reference}`;
    }
    
    // If request came from separate frontend, redirect to frontend URL
    if (requestOrigin && requestOrigin !== config.apiUrl) {
      return `${requestOrigin}/balance?payment=success&reference=${reference}`;
    }
    
    // Default to configured frontend URL
    return `${config.frontendUrl}/balance?payment=success&reference=${reference}`;
  }

  /**
   * Process webhook event from Paystack - SAME AS BEFORE
   */
  processWebhook(headers, body) {
    try {
      // Get webhook signature
      const signature = headers['x-paystack-signature'];
      
      // FIXED: Allow webhook processing even without signature in development
      if (!signature && !this.testMode) {
        throw new ApiError('Missing Paystack signature', 401);
      }

      // FIXED: Only verify signature if we have a webhook secret and signature
      if (signature && this.webhookSecret && this.webhookSecret !== 'your_paystack_webhook_secret') {
        const isValid = this._verifySignature(signature, body);
        if (!isValid) {
          logger.warn('Invalid webhook signature received', {
            signature: signature ? 'present' : 'missing',
            webhookSecret: this.webhookSecret ? 'configured' : 'missing',
            testMode: this.testMode
          });
          
          // FIXED: In test mode, log warning but continue processing
          if (!this.testMode) {
            throw new ApiError('Invalid webhook signature', 401);
          }
        }
      } else {
        logger.info('Webhook signature verification skipped', {
          reason: !signature ? 'no signature' : 'no webhook secret configured',
          testMode: this.testMode
        });
      }

      // Process based on event type
      const event = body.event;
      const data = body.data;

      // FIXED: Proper amount conversion - Paystack amounts are in kobo
      const amountInNaira = data.amount ? data.amount / 100 : null;

      logger.info(`Processing webhook event: ${event}`, {
        reference: data.reference,
        amount: amountInNaira,
        amountInKobo: data.amount,
        status: data.status
      });

      // Map event to standardized format
      const processedEvent = {
        eventType: event,
        reference: data.reference,
        status: this._mapPaystackStatus(data.status),
        amount: amountInNaira, // FIXED: Use converted amount
        currency: data.currency || 'NGN',
        metadata: data.metadata || {},
        paymentData: data,
        raw: this.testMode ? body : undefined
      };

      // FIXED: Better user ID extraction from metadata
      if (data.metadata?.userId) {
        processedEvent.userId = parseInt(data.metadata.userId, 10);
      } else if (data.metadata?.user_id) {
        processedEvent.userId = parseInt(data.metadata.user_id, 10);
      } else if (data.metadata?.custom_fields) {
        const userIdField = data.metadata.custom_fields.find(f => 
          f.variable_name === 'user_id' || f.variable_name === 'userId'
        );
        if (userIdField) {
          processedEvent.userId = parseInt(userIdField.value, 10);
        }
      }

      // Log user ID extraction for debugging
      logger.info('User ID extraction from webhook', {
        reference: data.reference,
        extractedUserId: processedEvent.userId,
        metadata: data.metadata
      });

      return processedEvent;
    } catch (error) {
      logger.error(`Webhook processing error: ${error.message}`, { stack: error.stack });
      throw error;
    }
  }

  /**
   * Verify a payment transaction - SAME AS BEFORE
   */
  async verifyPayment(reference) {
    try {
      if (!reference) {
        throw new ApiError('Payment reference is required', 400);
      }

      logger.debug(`Verifying payment: ${reference}`);

      const response = await this.client.get(`/transaction/verify/${reference}`);

      if (response.data.status && response.data.data.status === 'success') {
        const transactionData = response.data.data;
        
        // FIXED: Proper amount conversion from kobo to naira
        const amountInNaira = transactionData.amount / 100;
        
        // Log amount conversion for debugging
        logger.info('Payment verification amount conversion', {
          reference: reference,
          amountInKobo: transactionData.amount,
          amountInNaira: amountInNaira
        });

        // Extract user ID from metadata
        let userId = null;
        if (transactionData.metadata?.userId) {
          userId = parseInt(transactionData.metadata.userId, 10);
        } else if (transactionData.metadata?.user_id) {
          userId = parseInt(transactionData.metadata.user_id, 10);
        } else if (transactionData.metadata?.custom_fields) {
          const userIdField = transactionData.metadata.custom_fields.find(f => f.variable_name === 'user_id');
          if (userIdField) {
            userId = parseInt(userIdField.value, 10);
          }
        }

        const result = {
          success: true,
          reference: transactionData.reference,
          amount: amountInNaira, // FIXED: Use properly converted amount
          currency: 'NGN',
          paymentDate: new Date(transactionData.paid_at || transactionData.created_at),
          channel: transactionData.channel,
          gatewayResponse: transactionData.gateway_response,
          paymentMethod: this._getPaymentMethod(transactionData),
          userId: userId,
          cardDetails: this._extractCardDetails(transactionData.authorization),
          raw: this.testMode ? transactionData : undefined
        };

        logger.info('Payment verified successfully', {
          reference,
          amountInKobo: transactionData.amount,
          amountInNaira: amountInNaira,
          currency: 'NGN',
          channel: result.channel,
          userId: userId
        });

        return result;
      } else if (response.data.status && response.data.data.status === 'failed') {
        const transactionData = response.data.data;
        
        return {
          success: false,
          reference: transactionData.reference,
          amount: transactionData.amount / 100, // Convert from kobo
          currency: 'NGN',
          failureReason: transactionData.gateway_response || 'Payment failed',
          status: transactionData.status
        };
      } else {
        throw new ApiError(response.data.message || 'Payment verification failed', 400);
      }
    } catch (error) {
      logger.error(`Payment verification error: ${error.message}`, { 
        stack: error.stack,
        reference: reference
      });

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

  // Keep all other existing methods unchanged...
  
  _verifySignature(signature, payload) {
    try {
      // Handle case where webhook secret is not properly configured
      if (!this.webhookSecret || this.webhookSecret === 'your_paystack_webhook_secret') {
        logger.warn('Webhook secret not properly configured');
        return false;
      }

      const hash = crypto
        .createHmac('sha512', this.webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');
      
      const isValid = hash === signature;
      
      if (!isValid) {
        logger.warn('Webhook signature mismatch', {
          expectedLength: hash.length,
          receivedLength: signature.length,
          testMode: this.testMode
        });
      }
      
      return isValid;
    } catch (error) {
      logger.error(`Signature verification error: ${error.message}`, { stack: error.stack });
      return false;
    }
  }

  _isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

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

  _extractCardDetails(authorization) {
    if (!authorization) return null;
    
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

  _getPaymentMethod(transactionData) {
    if (!transactionData) return 'unknown';
    
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

  getPaymentDetails(paymentData) {
    const reference = paymentData.reference || `pay_${generateUniqueId()}`;
    const amountInKobo = Math.round(paymentData.amount * 100);
    
    return {
      publicKey: this.publicKey,
      reference: reference,
      amount: amountInKobo,
      currency: 'NGN',
      email: paymentData.email,
      callbackUrl: `${config.frontendUrl}/balance?payment=success&reference=${reference}`,
      metadata: {
        userId: paymentData.userId
      },
      channels: this.channels
    };
  }
}

module.exports = new PaymentService();