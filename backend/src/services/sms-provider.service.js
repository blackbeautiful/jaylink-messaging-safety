const axios = require('axios');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('../utils/api-error.util');

/**
 * SMS Provider Service - Handles API communication with SMS provider
 */
class SmsProviderService {
  constructor() {
    this.apiKey = config.smsProvider.apiKey;
    this.baseUrl = config.smsProvider.baseUrl;
    this.defaultSender = config.smsProvider.defaultSender;
    
    // Initialize the HTTP client
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      timeout: 10000 // 10s timeout
    });
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
      // Normalize recipients to array format
      const phoneNumbers = Array.isArray(recipients) 
        ? recipients 
        : recipients.split(/[,;]/).map(r => r.trim()).filter(Boolean);

      if (phoneNumbers.length === 0) {
        throw new ApiError('No valid recipients provided', 400);
      }

      // In a real-world scenario, this would hit the actual SMS provider API
      // For this implementation, we'll simulate a successful response
      
      // Log the request for debugging
      logger.debug('SMS Provider sendSms request', { 
        recipientCount: phoneNumbers.length,
        messageLength: message.length,
        senderId: senderId || this.defaultSender
      });

      // Implement retries with exponential backoff in production
      const response = await this._simulateSendSms(phoneNumbers, message, senderId);
      
      return {
        provider: 'mock-sms-provider',
        messageId: response.messageId,
        accepted: response.accepted,
        rejected: response.rejected,
        status: response.status
      };
    } catch (error) {
      logger.error(`SMS Provider sendSms error: ${error.message}`, { 
        stack: error.stack,
        recipients: recipients,
      });
      
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
   * Get delivery status of a message
   * @param {string} messageId - Provider message ID
   * @returns {Promise<Object>} Status details
   */
  async getMessageStatus(messageId) {
    try {
      // In a real implementation, this would query the SMS provider's API
      logger.debug('SMS Provider getMessageStatus request', { messageId });
      
      // Simulate provider response
      return await this._simulateGetStatus(messageId);
    } catch (error) {
      logger.error(`SMS Provider getMessageStatus error: ${error.message}`, {
        stack: error.stack,
        messageId
      });
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError('Failed to get message status', 500);
    }
  }

  /**
   * Simulate sending SMS messages with random message ID and delivery stats
   * @private
   */
  async _simulateSendSms(recipients, message, senderId) {
    // Add a slight delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    
    // Generate a random message ID
    const messageId = `sms_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    // Simulate some failures (5% failure rate)
    const rejectedCount = Math.floor(recipients.length * 0.05);
    const acceptedCount = recipients.length - rejectedCount;
    
    return {
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
   * @private
   */
  async _simulateGetStatus(messageId) {
    // Add a slight delay to simulate network request
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
    
    // Generate random delivery statistics
    const statuses = ['delivered', 'sent', 'failed'];
    const deliveryStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      messageId,
      status: deliveryStatus,
      deliveredCount: Math.floor(Math.random() * 100),
      sentCount: Math.floor(Math.random() * 100),
      failedCount: Math.floor(Math.random() * 10),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate estimated cost for SMS
   * @param {number} recipientCount - Number of recipients
   * @param {string} message - Message content
   * @returns {number} Estimated cost
   */
  calculateMessageCost(recipientCount, message) {
    // Calculate SMS segments (160 chars per segment for standard SMS)
    const segmentLength = 160;
    const messageLength = message.length;
    const segments = Math.ceil(messageLength / segmentLength);
    
    // Cost per segment per recipient
    const costPerSegment = 0.03; // $0.03 per segment
    
    // Total cost
    return (segments * recipientCount * costPerSegment);
  }
}

// Export as singleton
module.exports = new SmsProviderService();