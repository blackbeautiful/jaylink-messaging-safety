// backend/src/services/sms-provider.service.js
const axios = require('axios');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');
const { parsePhoneNumbers } = require('../utils/phone.util');

/**
 * SMS Provider Service - Handles API communication with SMS provider
 * Supports multiple providers with Nigerian SMS provider as default
 */
class SmsProviderService {
  constructor() {
    this.providerName = config.smsProvider.provider;
    this.apiKey = config.smsProvider.apiKey;
    this.baseUrl = config.smsProvider.baseUrl;
    this.defaultSender = config.smsProvider.defaultSender;
    this.options = config.smsProvider.options || {};
    this.backupProviderEnabled = config.smsProvider.backup.enabled;
    
    // Initialize the HTTP client
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      timeout: 15000 // 15s timeout
    });

    // Configure backup provider if enabled
    if (this.backupProviderEnabled) {
      this.backupClient = axios.create({
        baseURL: config.smsProvider.backup.baseUrl,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.smsProvider.backup.apiKey}`
        },
        timeout: 15000
      });
    }

    logger.info(`SMS Provider initialized: ${this.providerName}`);
  }

  /**
   * Send an SMS message
   * @param {string|Array} recipients - Recipient phone number(s)
   * @param {string} message - Message content
   * @param {string} senderId - Sender ID (optional)
   * @returns {Promise<Object>} Provider API response
   */
  async sendSms(recipients, message, senderId = null) {
    try {
      // Normalize recipients to array format and ensure they're valid Nigerian numbers
      const phoneNumbers = Array.isArray(recipients) 
        ? recipients 
        : recipients.split(/[,;]/).map(r => r.trim()).filter(Boolean);

      if (phoneNumbers.length === 0) {
        throw new ApiError('No valid recipients provided', 400);
      }

      // Use configured sender ID or default
      const finalSenderId = senderId || this.defaultSender;

      // Format phone numbers based on provider requirements
      const formattedNumbers = this._formatPhoneNumbersForProvider(phoneNumbers);
      
      // Log the request for debugging
      logger.debug('SMS Provider sendSms request', { 
        provider: this.providerName,
        recipientCount: formattedNumbers.length,
        messageLength: message.length,
        senderId: finalSenderId
      });

      // If in development mode and not explicitly configured to use real SMS,
      // simulate successful response unless FORCE_REAL_SMS=true
      if (config.env === 'development' && process.env.FORCE_REAL_SMS !== 'true') {
        logger.info('DEVELOPMENT MODE: Simulating SMS send operation');
        return this._simulateSendSms(formattedNumbers, message, finalSenderId);
      }
      
      // Send the message using the appropriate provider implementation
      const response = await this._sendWithProvider(formattedNumbers, message, finalSenderId);
      
      // Log success
      logger.info(`SMS sent successfully via ${this.providerName}`, {
        recipientCount: formattedNumbers.length,
        messageId: response.messageId
      });
      
      return response;
    } catch (error) {
      logger.error(`SMS Provider sendSms error: ${error.message}`, { 
        stack: error.stack,
        recipients: recipients,
      });
      
      // Try backup provider if primary fails and backup is enabled
      if (this.backupProviderEnabled && !error.isBackupProviderError) {
        try {
          logger.info('Attempting to send SMS using backup provider');
          const backupResponse = await this._sendWithBackupProvider(recipients, message, senderId);
          
          logger.info('SMS sent successfully via backup provider', {
            recipientCount: Array.isArray(recipients) ? recipients.length : 1,
          });
          
          return backupResponse;
        } catch (backupError) {
          backupError.isBackupProviderError = true;
          logger.error(`Backup SMS provider error: ${backupError.message}`, { 
            stack: backupError.stack
          });
        }
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status || 500;
        const errorMessage = error.response?.data?.message || error.message;
        throw new ApiError(`SMS provider error: ${errorMessage}`, statusCode);
      }
      
      throw new ApiError('Failed to send SMS', 500);
    }
  }

  /**
   * Send SMS using the configured provider
   * @private
   */
  async _sendWithProvider(phoneNumbers, message, senderId) {
    // Different API handling based on the provider
    switch (this.providerName.toLowerCase()) {
      case 'smsprovider.com.ng':
        return this._sendWithSmsProviderNG(phoneNumbers, message, senderId);
      case 'termii':
        return this._sendWithTermii(phoneNumbers, message, senderId);
      case 'twilio':
        return this._sendWithTwilio(phoneNumbers, message, senderId);
      default:
        return this._sendWithGenericProvider(phoneNumbers, message, senderId);
    }
  }

  /**
   * Send with smsprovider.com.ng API
   * @private
   */
  async _sendWithSmsProviderNG(phoneNumbers, message, senderId) {
    // Format payload for smsprovider.com.ng API
    const payload = {
      recipient: phoneNumbers.join(','),
      message: message,
      sender_name: senderId,
      // Add any provider-specific options
      ...(this.options.accountId && { account_id: this.options.accountId }),
      ...(this.options.username && { username: this.options.username })
    };

    // Implement retries with exponential backoff
    let attempt = 0;
    const maxAttempts = 3;
    let lastError = null;

    while (attempt < maxAttempts) {
      try {
        const response = await this.client.post('/sms/send', payload);
        
        if (response.data.status === 'success' || response.data.code === '1000') {
          return {
            provider: 'smsprovider.com.ng',
            messageId: response.data.message_id || `sms_${Date.now()}`,
            accepted: phoneNumbers.length,
            rejected: 0,
            status: 'queued'
          };
        } else {
          throw new ApiError(`Provider API error: ${response.data.message || 'Unknown error'}`, 400);
        }
      } catch (error) {
        lastError = error;
        attempt++;
        
        if (attempt < maxAttempts) {
          // Exponential backoff: 1s, 2s, 4s, etc.
          const backoffTime = Math.pow(2, attempt - 1) * 1000;
          logger.warn(`SMS send attempt ${attempt} failed, retrying in ${backoffTime}ms`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }

    // All attempts failed
    throw lastError || new ApiError('Failed to send SMS after multiple attempts', 500);
  }

  /**
   * Send with Termii API
   * @private
   */
  async _sendWithTermii(phoneNumbers, message, senderId) {
    const payload = {
      to: phoneNumbers,
      from: senderId,
      sms: message,
      type: "plain",
      channel: "generic",
      api_key: this.apiKey
    };

    const response = await this.client.post('/sms/send', payload);
    
    if (response.data.message === "Successfully Sent" || response.data.code === "ok") {
      return {
        provider: 'termii',
        messageId: response.data.message_id || `termii_${Date.now()}`,
        accepted: phoneNumbers.length,
        rejected: 0,
        status: 'queued'
      };
    } else {
      throw new ApiError(`Termii API error: ${response.data.message}`, 400);
    }
  }

  /**
   * Send with generic provider API (fallback implementation)
   * @private
   */
  async _sendWithGenericProvider(phoneNumbers, message, senderId) {
    const payload = {
      to: phoneNumbers.join(','),
      message: message,
      sender: senderId,
      api_key: this.apiKey
    };

    const response = await this.client.post('/send', payload);
    
    // Generic success handling - should be tailored to actual provider
    if (response.data.status === 'success' || response.data.code === 200) {
      return {
        provider: this.providerName,
        messageId: response.data.message_id || response.data.id || `sms_${Date.now()}`,
        accepted: phoneNumbers.length - (response.data.failed || 0),
        rejected: response.data.failed || 0,
        status: 'queued'
      };
    } else {
      throw new ApiError(`Provider API error: ${response.data.message || 'Unknown error'}`, 400);
    }
  }

  /**
   * Send SMS with backup provider
   * @private
   */
  async _sendWithBackupProvider(recipients, message, senderId) {
    // Format phone numbers
    const phoneNumbers = Array.isArray(recipients) 
      ? recipients 
      : recipients.split(/[,;]/).map(r => r.trim()).filter(Boolean);
      
    const formattedNumbers = this._formatPhoneNumbersForProvider(phoneNumbers);
    const finalSenderId = senderId || this.defaultSender;
    
    // Simple backup implementation - can be extended similar to primary providers
    const payload = {
      to: formattedNumbers.join(','),
      message: message,
      sender: finalSenderId,
      api_key: config.smsProvider.backup.apiKey
    };

    const response = await this.backupClient.post('/send', payload);
    
    if (response.data.status === 'success' || response.data.code === 200) {
      return {
        provider: `${config.smsProvider.backup.provider} (backup)`,
        messageId: response.data.message_id || `backup_${Date.now()}`,
        accepted: formattedNumbers.length,
        rejected: 0,
        status: 'queued'
      };
    } else {
      throw new ApiError(`Backup provider error: ${response.data.message}`, 400);
    }
  }

  /**
   * Get delivery status of a message
   * @param {string} messageId - Provider message ID
   * @returns {Promise<Object>} Status details
   */
  async getMessageStatus(messageId) {
    try {
      // In development mode, simulate status check
      if (config.env === 'development' && process.env.FORCE_REAL_SMS !== 'true') {
        logger.info('DEVELOPMENT MODE: Simulating SMS status check');
        return this._simulateGetStatus(messageId);
      }

      // Determine which provider to check with based on the message ID prefix
      const isBackupProvider = messageId.startsWith('backup_');
      const client = isBackupProvider ? this.backupClient : this.client;
      
      logger.debug('SMS Provider getMessageStatus request', { 
        messageId,
        provider: isBackupProvider ? config.smsProvider.backup.provider : this.providerName
      });
      
      // Different status checking implementation based on provider
      let statusUrl = '';
      let response;
      
      switch (this.providerName.toLowerCase()) {
        case 'smsprovider.com.ng':
          statusUrl = `/sms/status/${messageId}`;
          response = await client.get(statusUrl);
          
          return {
            messageId: messageId,
            status: this._mapProviderStatus(response.data.status),
            deliveredCount: parseInt(response.data.delivered || 0),
            sentCount: parseInt(response.data.sent || 0),
            failedCount: parseInt(response.data.failed || 0),
            timestamp: new Date().toISOString()
          };
          
        default:
          // Generic implementation
          statusUrl = `/status/${messageId}`;
          response = await client.get(statusUrl);
          
          return {
            messageId: messageId,
            status: this._mapProviderStatus(response.data.status),
            deliveredCount: parseInt(response.data.delivered || 0),
            sentCount: parseInt(response.data.sent || 0),
            failedCount: parseInt(response.data.failed || 0),
            timestamp: new Date().toISOString()
          };
      }
    } catch (error) {
      logger.error(`SMS Provider getMessageStatus error: ${error.message}`, {
        stack: error.stack,
        messageId
      });
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      // For status checks, we'll return a limited status rather than failing
      return {
        messageId,
        status: 'unknown',
        deliveredCount: 0,
        sentCount: 0,
        failedCount: 0,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Map provider-specific status to standardized status
   * @private
   */
  _mapProviderStatus(providerStatus) {
    // Lowercase for consistent comparison
    const status = (providerStatus || '').toLowerCase();
    
    // Map various provider statuses to standard statuses
    if (['delivered', 'completed', 'success'].includes(status)) {
      return 'delivered';
    } else if (['sent', 'queued', 'accepted', 'processing'].includes(status)) {
      return 'sent';
    } else if (['failed', 'rejected', 'error', 'expired'].includes(status)) {
      return 'failed';
    } else {
      return 'unknown';
    }
  }

  /**
   * Format phone numbers based on provider requirements
   * @private
   */
  _formatPhoneNumbersForProvider(phoneNumbers) {
    // Different providers may need different phone number formats
    switch (this.providerName.toLowerCase()) {
      case 'smsprovider.com.ng':
        // Ensure Nigerian numbers have the country code but no + prefix
        return phoneNumbers.map(number => {
          if (number.startsWith('+')) {
            return number.substring(1); // Remove + sign
          } else if (number.startsWith('234')) {
            return number; // Already in correct format
          } else if (number.startsWith('0')) {
            return `234${number.substring(1)}`; // Convert 0xxx to 234xxx
          } else {
            return number; // Return as is for international numbers
          }
        });
      
      case 'termii':
        // Termii needs numbers with + prefix
        return phoneNumbers.map(number => {
          if (number.startsWith('+')) {
            return number; // Already has + sign
          } else if (number.startsWith('234')) {
            return `+${number}`; // Add + to country code
          } else if (number.startsWith('0')) {
            return `+234${number.substring(1)}`; // Convert 0xxx to +234xxx
          } else {
            return `+${number}`; // Add + for international numbers
          }
        });
      
      default:
        // Default formatting - use standard E.164 format with + sign
        return phoneNumbers.map(number => {
          if (number.startsWith('+')) {
            return number; // Already has + sign
          } else if (number.startsWith('234')) {
            return `+${number}`; // Add + to country code
          } else if (number.startsWith('0')) {
            return `+234${number.substring(1)}`; // Convert 0xxx to +234xxx
          } else {
            return `+${number}`; // Add + for all other cases
          }
        });
    }
  }

  /**
   * Simulate sending SMS messages with random message ID and delivery stats
   * For development use only
   * @private
   */
  async _simulateSendSms(recipients, message, senderId) {
    // Add a slight delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Generate a random message ID
    const messageId = `dev_sms_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Simulate some failures (2% failure rate in development)
    const rejectedCount = Math.floor(recipients.length * 0.02);
    const acceptedCount = recipients.length - rejectedCount;
    
    // Log the simulated message
    logger.info('SIMULATED SMS', {
      to: recipients,
      message: message,
      sender: senderId,
      messageId
    });
    
    return {
      provider: `${this.providerName} (simulated)`,
      messageId,
      status: 'queued',
      accepted: acceptedCount,
      rejected: rejectedCount,
      totalRecipients: recipients.length,
      sender: senderId || this.defaultSender
    };
  }

  /**
   * Simulate getting message status with random delivery stats
   * For development use only
   * @private
   */
  async _simulateGetStatus(messageId) {
    // Add a slight delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // For simulated messages, we'll auto-improve status over time
    const messageAge = this._getMessageAgeInMinutes(messageId);
    
    let deliveryStatus;
    let deliveredCount = 0;
    let sentCount = 0;
    let failedCount = 0;
    
    // Simulate message progression based on age
    if (messageAge < 1) {
      deliveryStatus = 'sent';
      sentCount = 90;
      failedCount = 10;
    } else if (messageAge < 5) {
      deliveryStatus = 'delivered';
      deliveredCount = 80;
      sentCount = 10;
      failedCount = 10;
    } else {
      deliveryStatus = 'delivered';
      deliveredCount = 85;
      sentCount = 5;
      failedCount = 10;
    }
    
    return {
      messageId,
      status: deliveryStatus,
      deliveredCount,
      sentCount,
      failedCount,
      timestamp: new Date().toISOString(),
      simulated: true
    };
  }

  /**
   * Get age of message ID in minutes
   * @private
   */
  _getMessageAgeInMinutes(messageId) {
    // Extract timestamp from message ID format: sms_TIMESTAMP_RANDOM
    try {
      const parts = messageId.split('_');
      if (parts.length >= 2) {
        const timestamp = parseInt(parts[1], 10);
        if (!isNaN(timestamp)) {
          const ageInMs = Date.now() - timestamp;
          return Math.floor(ageInMs / (1000 * 60)); // Convert to minutes
        }
      }
    } catch (error) {
      // Ignore parsing errors
    }
    
    // Default if we can't parse: assume 2 minutes old
    return 2;
  }

  /**
   * Calculate estimated cost for SMS
   * @param {number} recipientCount - Number of recipients
   * @param {string} message - Message content
   * @param {boolean} isInternational - Whether the message is international
   * @returns {number} Estimated cost in Naira
   */
  calculateMessageCost(recipientCount, message, isInternational = false) {
    // Calculate SMS segments (160 chars per segment for standard SMS)
    const segmentLength = 160;
    const messageLength = message.length;
    const segments = Math.ceil(messageLength / segmentLength);
    
    // Cost per segment per recipient in kobo (100 kobo = 1 Naira)
    const costPerSegment = isInternational 
      ? config.smsProvider.pricing.internationalSms
      : config.smsProvider.pricing.localSms;
    
    // Total cost in kobo
    const totalCostKobo = segments * recipientCount * costPerSegment;
    
    // Convert to Naira and round to 2 decimal places
    return parseFloat((totalCostKobo / 100).toFixed(2));
  }

  /**
   * Check if a phone number is international (non-Nigerian)
   * @param {string} phoneNumber - Phone number to check
   * @returns {boolean} True if international, false if Nigerian
   */
  isInternationalNumber(phoneNumber) {
    // Standardize the number first
    const number = phoneNumber.trim();
    
    // Nigerian numbers start with +234, 234, or 0
    return !(
      number.startsWith('+234') || 
      number.startsWith('234') || 
      (number.startsWith('0') && number.length >= 10 && number.length <= 11)
    );
  }
}

// Export as singleton
module.exports = new SmsProviderService();