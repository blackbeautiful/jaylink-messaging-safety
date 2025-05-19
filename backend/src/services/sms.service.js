// backend/src/services/sms.service.js
const { Op } = require('sequelize');
const fs = require('fs').promises;
const db = require('../models');
const ApiError = require('../utils/api-error.util');
const logger = require('../config/logger');
const smsProviderService = require('./sms-provider.service');
const balanceService = require('./balance.service');
const csvUtil = require('../utils/csv.util');
const { generateUniqueId } = require('../utils/id.util');
const { parsePhoneNumbers } = require('../utils/phone.util');

const Message = db.Message;
const ScheduledMessage = db.ScheduledMessage;
const User = db.User;
const Contact = db.Contact;
const Group = db.Group;
const GroupContact = db.GroupContact;

/**
 * Send an SMS message to one or more recipients
 * @param {number} userId - User ID
 * @param {Object} messageData - Message data
 * @returns {Object} Message result with status and costs
 */
const sendSMS = async (userId, messageData) => {
  const { recipients, message, senderId, scheduled } = messageData;
  
  try {
    // Validate user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Process recipients based on format (direct, group, or contacts)
    let phoneNumbers = [];
    let recipientType = 'direct';
    
    if (typeof recipients === 'string' && recipients.startsWith('group_')) {
      // Handle group recipients
      const groupId = recipients.split('_')[1];
      phoneNumbers = await getGroupPhoneNumbers(userId, groupId);
      recipientType = 'group';
    } else {
      // Handle direct recipients or contact selection
      phoneNumbers = await processRecipients(userId, recipients);
      recipientType = 'direct';
    }
    
    // Ensure we have valid recipients
    if (phoneNumbers.length === 0) {
      throw new ApiError('No valid recipients provided', 400);
    }
    
    // Calculate message cost
    const cost = smsProviderService.calculateMessageCost(phoneNumbers.length, message);
    
    // Check if user has sufficient balance
    const userBalance = await balanceService.getUserBalance(userId);
    
    if (userBalance < cost) {
      throw new ApiError('Insufficient balance to send message', 400);
    }

    // If scheduled for later, create scheduled message
    if (scheduled) {
      const scheduledAt = new Date(scheduled);
      
      // Validate scheduled date (must be in the future)
      if (scheduledAt <= new Date()) {
        throw new ApiError('Scheduled time must be in the future', 400);
      }
      
      // Create scheduled message
      const scheduledMessage = await ScheduledMessage.create({
        userId,
        type: 'sms',
        message,
        senderId,
        recipients: JSON.stringify(phoneNumbers),
        recipientCount: phoneNumbers.length,
        scheduledAt,
        status: 'pending',
      });
      
      return {
        messageId: `scheduled_${scheduledMessage.id}`,
        status: 'scheduled',
        recipients: phoneNumbers.length,
        cost,
        scheduledAt,
        recipientType
      };
    }
    
    // Generate a unique message ID
    const messageId = generateUniqueId('sms');
    
    // Send the message using the SMS provider
    const smsResult = await smsProviderService.sendSms(phoneNumbers, message, senderId);
    
    // Deduct from user's balance
    await balanceService.deductBalance(userId, cost, 'sms', `SMS message to ${phoneNumbers.length} recipient(s)`);
    
    // Record the message in the database
    const messageRecord = await Message.create({
      userId,
      messageId,
      type: 'sms',
      content: message,
      senderId,
      recipients: JSON.stringify(phoneNumbers),
      recipientCount: phoneNumbers.length,
      cost,
      status: 'sent',
      scheduled: false,
    });
    
    return {
      messageId: messageRecord.messageId,
      status: 'sent',
      recipients: phoneNumbers.length,
      cost,
      providerMessageId: smsResult.messageId,
      recipientType
    };
  } catch (error) {
    logger.error(`Send SMS error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      messageData
    });
    throw error;
  }
};

/**
 * Send SMS messages in bulk using a CSV file
 * @param {number} userId - User ID
 * @param {string} filePath - Path to CSV file with phone numbers
 * @param {Object} messageData - Message data
 * @returns {Object} Bulk message result
 */
const sendBulkSMS = async (userId, filePath, messageData) => {
  const { message, senderId, scheduled } = messageData;
  
  try {
    // Validate user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Process CSV file to extract phone numbers
    const phoneNumbers = await processCsvPhoneNumbers(filePath);
    
    // Ensure we have valid recipients
    if (phoneNumbers.length === 0) {
      throw new ApiError('No valid phone numbers found in the CSV file', 400);
    }
    
    // Calculate total cost
    const cost = smsProviderService.calculateMessageCost(phoneNumbers.length, message);
    
    // Check if user has sufficient balance
    const userBalance = await balanceService.getUserBalance(userId);
    
    if (userBalance < cost) {
      throw new ApiError('Insufficient balance to send bulk message', 400);
    }
    
    // If scheduled for later, create scheduled message
    if (scheduled) {
      const scheduledAt = new Date(scheduled);
      
      // Validate scheduled date (must be in the future)
      if (scheduledAt <= new Date()) {
        throw new ApiError('Scheduled time must be in the future', 400);
      }
      
      // Create scheduled message
      const scheduledMessage = await ScheduledMessage.create({
        userId,
        type: 'sms',
        message,
        senderId,
        recipients: JSON.stringify(phoneNumbers),
        recipientCount: phoneNumbers.length,
        scheduledAt,
        status: 'pending',
      });
      
      return {
        messageId: `scheduled_${scheduledMessage.id}`,
        status: 'scheduled',
        recipients: phoneNumbers.length,
        cost,
        scheduledAt
      };
    }
    
    // Generate a unique message ID
    const messageId = generateUniqueId('sms_bulk');
    
    // Process in batches of 100 numbers for better performance with provider
    const batchSize = 100;
    let sentCount = 0;
    let failedCount = 0;
    
    for (let i = 0; i < phoneNumbers.length; i += batchSize) {
      const batch = phoneNumbers.slice(i, i + batchSize);
      try {
        // Send batch using the SMS provider
        const batchResult = await smsProviderService.sendSms(batch, message, senderId);
        sentCount += batchResult.accepted;
        failedCount += batchResult.rejected;
      } catch (error) {
        logger.error(`Batch sending error (batch ${i / batchSize + 1}): ${error.message}`);
        failedCount += batch.length;
      }
    }
    
    // Deduct from user's balance
    await balanceService.deductBalance(userId, cost, 'sms_bulk', `Bulk SMS to ${phoneNumbers.length} recipient(s)`);
    
    // Record the message in the database
    const messageRecord = await Message.create({
      userId,
      messageId,
      type: 'sms',
      content: message,
      senderId,
      recipients: JSON.stringify(phoneNumbers),
      recipientCount: phoneNumbers.length,
      cost,
      status: 'sent',
      scheduled: false,
    });
    
    // Clean up the CSV file
    try {
      await fs.unlink(filePath);
    } catch (error) {
      logger.warn(`Failed to delete CSV file: ${error.message}`);
    }
    
    return {
      messageId: messageRecord.messageId,
      status: 'sent',
      recipients: phoneNumbers.length,
      sentCount,
      failedCount,
      cost
    };
  } catch (error) {
    logger.error(`Send bulk SMS error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      messageData
    });
    
    // Attempt to delete CSV file on error to prevent clutter
    try {
      await fs.unlink(filePath);
    } catch (err) {
      logger.warn(`Failed to delete CSV file after error: ${err.message}`);
    }
    
    throw error;
  }
};

/**
 * Get the status of a message
 * @param {number} userId - User ID
 * @param {string} messageId - Message ID
 * @returns {Object} Message status
 */
const getMessageStatus = async (userId, messageId) => {
  try {
    // Find the message in the database
    const message = await Message.findOne({
      where: {
        userId,
        messageId,
      },
    });
    
    if (!message) {
      throw new ApiError('Message not found', 404);
    }
    
    // If message is scheduled, return scheduled status
    if (message.scheduled) {
      return {
        messageId: message.messageId,
        status: 'scheduled',
        scheduledAt: message.scheduledAt,
        recipients: message.recipientCount,
        cost: message.cost,
      };
    }
    
    // If message was recently sent, check provider status
    const sentRecently = message.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    
    if (sentRecently && message.status !== 'delivered' && message.status !== 'failed') {
      try {
        // Check with the provider for updated status
        const providerStatus = await smsProviderService.getMessageStatus(message.messageId);
        
        // Update message status if it has changed
        if (providerStatus.status !== message.status) {
          await message.update({ status: providerStatus.status });
        }
        
        return {
          messageId: message.messageId,
          status: providerStatus.status,
          recipients: message.recipientCount,
          cost: message.cost,
          sent: providerStatus.sentCount || message.recipientCount,
          delivered: providerStatus.deliveredCount || 0,
          failed: providerStatus.failedCount || 0,
        };
      } catch (error) {
        logger.error(`Error checking message status with provider: ${error.message}`);
        // Fall back to database status if provider check fails
      }
    }
    
    // Return status from database
    return {
      messageId: message.messageId,
      status: message.status,
      recipients: message.recipientCount,
      cost: message.cost,
      createdAt: message.createdAt,
    };
  } catch (error) {
    logger.error(`Get message status error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      messageId
    });
    throw error;
  }
};

/**
 * Get message history for a user
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Messages with pagination
 */
const getMessageHistory = async (userId, options = {}) => {
  const { 
    page = 1, 
    limit = 20, 
    startDate = null, 
    endDate = null, 
    type = null, 
    status = null 
  } = options;
  
  const offset = (page - 1) * limit;
  
  try {
    // Build where conditions
    const whereConditions = { userId };
    
    // Add date range if provided
    if (startDate && endDate) {
      whereConditions.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereConditions.createdAt = {
        [Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereConditions.createdAt = {
        [Op.lte]: new Date(endDate),
      };
    }
    
    // Add message type filter if provided
    if (type) {
      whereConditions.type = type;
    }
    
    // Add status filter if provided
    if (status) {
      whereConditions.status = status;
    }
    
    // Query database with pagination
    const { count, rows } = await Message.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });
    
    // Parse recipients JSON to arrays
    const messages = rows.map(message => {
      const msg = message.toJSON();
      try {
        msg.recipients = JSON.parse(msg.recipients);
      } catch (error) {
        msg.recipients = [];
        logger.warn(`Failed to parse recipients for message ${msg.id}: ${error.message}`);
      }
      return msg;
    });
    
    // Calculate pagination details
    const totalPages = Math.ceil(count / limit);
    
    return {
      messages,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    logger.error(`Get message history error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      options
    });
    throw error;
  }
};

/**
 * Get all scheduled messages for a user
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Scheduled messages with pagination
 */
const getScheduledMessages = async (userId, options = {}) => {
  const { page = 1, limit = 20, type = null } = options;
  const offset = (page - 1) * limit;
  
  try {
    // Build where conditions
    const whereConditions = { 
      userId,
      status: { [Op.notIn]: ['sent', 'cancelled'] },
      scheduledAt: { [Op.gt]: new Date() }
    };
    
    // Add message type filter if provided
    if (type) {
      whereConditions.type = type;
    }
    
    // Query database with pagination
    const { count, rows } = await ScheduledMessage.findAndCountAll({
      where: whereConditions,
      order: [['scheduledAt', 'ASC']],
      limit,
      offset,
    });
    
    // Parse recipients JSON to arrays
    const messages = rows.map(message => {
      const msg = message.toJSON();
      try {
        msg.recipients = JSON.parse(msg.recipients);
      } catch (error) {
        msg.recipients = [];
        logger.warn(`Failed to parse recipients for scheduled message ${msg.id}: ${error.message}`);
      }
      return msg;
    });
    
    // Calculate pagination details
    const totalPages = Math.ceil(count / limit);
    
    return {
      messages,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    logger.error(`Get scheduled messages error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      options
    });
    throw error;
  }
};

/**
 * Cancel a scheduled message
 * @param {number} userId - User ID
 * @param {number} scheduledId - Scheduled message ID
 * @returns {boolean} Success status
 */
const cancelScheduledMessage = async (userId, scheduledId) => {
  try {
    // Find the scheduled message
    const scheduledMessage = await ScheduledMessage.findOne({
      where: {
        id: scheduledId,
        userId,
        status: { [Op.notIn]: ['sent', 'cancelled'] },
      },
    });
    
    if (!scheduledMessage) {
      throw new ApiError('Scheduled message not found or already processed', 404);
    }
    
    // Update status to cancelled
    await scheduledMessage.update({ status: 'cancelled' });
    
    return true;
  } catch (error) {
    logger.error(`Cancel scheduled message error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      scheduledId
    });
    throw error;
  }
};

/**
 * Get message analytics for dashboard
 * @param {number} userId - User ID
 * @returns {Object} Message statistics
 */
const getMessageAnalytics = async (userId) => {
  try {
    // Get total message count
    const totalCount = await Message.count({
      where: { userId }
    });
    
    // Get counts by status
    const deliveredCount = await Message.count({
      where: {
        userId,
        status: 'delivered'
      }
    });
    
    const failedCount = await Message.count({
      where: {
        userId,
        status: 'failed'
      }
    });
    
    // Get counts by type
    const smsByType = await Message.count({
      where: {
        userId,
        type: 'sms'
      }
    });
    
    const voiceByType = await Message.count({
      where: {
        userId,
        type: 'voice'
      }
    });
    
    const audioByType = await Message.count({
      where: {
        userId,
        type: 'audio'
      }
    });
    
    // Get scheduled count
    const scheduledCount = await ScheduledMessage.count({
      where: {
        userId,
        status: 'pending'
      }
    });
    
    // Calculate delivery rate
    const deliveryRate = totalCount > 0 
      ? (deliveredCount / totalCount) * 100 
      : 0;
    
    // Get recent messages
    const recentMessages = await Message.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      limit: 5,
    });
    
    return {
      totalCount,
      deliveredCount,
      failedCount,
      deliveryRate: parseFloat(deliveryRate.toFixed(2)),
      types: {
        sms: smsByType,
        voice: voiceByType,
        audio: audioByType
      },
      scheduledCount,
      recentMessages: recentMessages.map(msg => {
        const message = msg.toJSON();
        try {
          message.recipients = JSON.parse(message.recipients);
        } catch (error) {
          message.recipients = [];
        }
        return message;
      })
    };
  } catch (error) {
    logger.error(`Get message analytics error: ${error.message}`, { 
      stack: error.stack, 
      userId
    });
    throw error;
  }
};

/**
 * Process recipients from various formats (direct string, array, group, etc.)
 * @param {number} userId - User ID
 * @param {string|Array} recipients - Recipients in various formats
 * @returns {Array} Array of normalized phone numbers
 */
const processRecipients = async (userId, recipients) => {
  // If recipients is already an array, just normalize and return
  if (Array.isArray(recipients)) {
    return parsePhoneNumbers(recipients);
  }
  
  // If it's a comma-separated string, split and normalize
  if (typeof recipients === 'string' && !recipients.startsWith('group_')) {
    const phoneArray = recipients.split(/[,;]/).map(r => r.trim()).filter(Boolean);
    return parsePhoneNumbers(phoneArray);
  }
  
  // Handle empty recipient string
  return [];
};

/**
 * Get phone numbers for all contacts in a group
 * @param {number} userId - User ID
 * @param {number} groupId - Group ID
 * @returns {Array} Array of phone numbers
 */
const getGroupPhoneNumbers = async (userId, groupId) => {
  try {
    // Verify the group belongs to the user
    const group = await Group.findOne({
      where: {
        id: groupId,
        userId
      }
    });
    
    if (!group) {
      throw new ApiError('Group not found', 404);
    }
    
    // Get all contacts in the group
    const contacts = await Contact.findAll({
      include: [
        {
          model: Group,
          as: 'groups',
          where: { id: groupId },
          through: { attributes: [] },
        }
      ],
      where: {
        userId
      },
      attributes: ['phone']
    });
    
    // Extract and normalize phone numbers
    const phoneNumbers = contacts.map(contact => contact.phone);
    return parsePhoneNumbers(phoneNumbers);
  } catch (error) {
    logger.error(`Get group phone numbers error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      groupId
    });
    throw error;
  }
};

/**
 * Process CSV file to extract valid phone numbers
 * @param {string} filePath - Path to the CSV file
 * @returns {Array} Array of valid phone numbers
 */
const processCsvPhoneNumbers = async (filePath) => {
  try {
    // Parse CSV file
    const rows = await csvUtil.processCsvFile(filePath);
    
    // Extract phone numbers from rows
    let phoneNumbers = [];
    
    // Check for phone column
    if (rows.length > 0) {
      // Check various possible column names for phone numbers
      const possiblePhoneColumns = ['phone', 'mobile', 'cell', 'telephone', 'contact', 'number', 'phone_number'];
      
      // Find matching column
      let phoneColumn = null;
      for (const column of possiblePhoneColumns) {
        if (rows[0].hasOwnProperty(column)) {
          phoneColumn = column;
          break;
        }
      }
      
      // If no column headers match, check if the first value of each row looks like a phone number
      if (!phoneColumn && Object.keys(rows[0]).length === 1) {
        const firstKey = Object.keys(rows[0])[0];
        const firstValue = rows[0][firstKey];
        
        if (typeof firstValue === 'string' && /^[+\d()\-\s]{7,}$/.test(firstValue)) {
          phoneColumn = firstKey;
        }
      }
      
      // Extract phone numbers from the identified column
      if (phoneColumn) {
        phoneNumbers = rows.map(row => row[phoneColumn]).filter(Boolean);
      } else {
        // Fallback: treat each row as a phone number (for simple CSV files)
        phoneNumbers = Object.values(rows).flat().filter(Boolean);
      }
    }
    
    // Parse and validate phone numbers
    return parsePhoneNumbers(phoneNumbers);
  } catch (error) {
    logger.error(`Process CSV phone numbers error: ${error.message}`, { 
      stack: error.stack, 
      filePath
    });
    throw error;
  }
};

/**
 * Process scheduled messages that are due
 * @returns {Object} Processing results
 */
const processScheduledMessages = async () => {
  try {
    // Find scheduled messages that are due
    const dueMessages = await ScheduledMessage.findAll({
      where: {
        status: 'pending',
        scheduledAt: { [Op.lte]: new Date() },
      },
      limit: 100, // Process in batches for better performance
    });
    
    if (dueMessages.length === 0) {
      return { processed: 0, success: 0, failed: 0 };
    }
    
    logger.info(`Processing ${dueMessages.length} scheduled messages`);
    
    let successCount = 0;
    let failedCount = 0;
    
    // Process each message
    for (const scheduledMessage of dueMessages) {
      try {
        // Update status to processing
        await scheduledMessage.update({ status: 'processing' });
        
        // Get user and check balance
        const user = await User.findByPk(scheduledMessage.userId);
        
        if (!user) {
          throw new Error('User not found');
        }
        
        // Parse recipients
        let phoneNumbers = [];
        try {
          phoneNumbers = JSON.parse(scheduledMessage.recipients);
        } catch (error) {
          throw new Error(`Failed to parse recipients: ${error.message}`);
        }
        
        // Calculate cost
        const cost = smsProviderService.calculateMessageCost(
          scheduledMessage.recipientCount,
          scheduledMessage.message
        );
        
        // Check balance
        if (user.balance < cost) {
          throw new Error('Insufficient balance');
        }
        
        // Generate message ID
        const messageId = generateUniqueId(`${scheduledMessage.type}_scheduled`);
        
        // Send message based on type
        let providerResult;
        if (scheduledMessage.type === 'sms') {
          providerResult = await smsProviderService.sendSms(
            phoneNumbers,
            scheduledMessage.message,
            scheduledMessage.senderId
          );
        } else {
          // Implement voice and audio handling here when needed
          throw new Error(`Unsupported message type: ${scheduledMessage.type}`);
        }
        
        // Deduct balance
        await balanceService.deductBalance(
          user.id,
          cost,
          `scheduled_${scheduledMessage.type}`,
          `Scheduled ${scheduledMessage.type.toUpperCase()} to ${phoneNumbers.length} recipient(s)`
        );
        
        // Record message in history
        await Message.create({
          userId: user.id,
          messageId,
          type: scheduledMessage.type,
          content: scheduledMessage.message,
          audioUrl: scheduledMessage.audioUrl,
          senderId: scheduledMessage.senderId,
          recipients: scheduledMessage.recipients,
          recipientCount: scheduledMessage.recipientCount,
          cost,
          status: 'sent',
          scheduled: true,
          scheduledAt: scheduledMessage.scheduledAt,
        });
        
        // Update scheduled message as sent
        await scheduledMessage.update({ status: 'sent' });
        
        successCount++;
      } catch (error) {
        logger.error(`Failed to process scheduled message ${scheduledMessage.id}: ${error.message}`);
        
        // Update scheduled message as failed
        await scheduledMessage.update({ 
          status: 'failed',
          errorMessage: error.message
        });
        
        failedCount++;
      }
    }
    
    return {
      processed: dueMessages.length,
      success: successCount,
      failed: failedCount
    };
  } catch (error) {
    logger.error(`Process scheduled messages error: ${error.message}`, { 
      stack: error.stack
    });
    throw error;
  }
};

module.exports = {
  sendSMS,
  sendBulkSMS,
  getMessageStatus,
  getMessageHistory,
  getScheduledMessages,
  cancelScheduledMessage,
  getMessageAnalytics,
  processScheduledMessages,
  getGroupPhoneNumbers,
  processRecipients,
};