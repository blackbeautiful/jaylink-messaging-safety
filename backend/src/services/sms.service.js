// backend/src/services/sms.service.js
const { Op } = require('sequelize');
const fs = require('fs').promises;
const db = require('../models');
const ApiError = require('../utils/api-error.util');
const logger = require('../config/logger');
const smsProviderService = require('./sms-provider.service');
const balanceService = require('./balance.service');
const notificationService = require('./notification.service');
const csvUtil = require('../utils/csv.util');
const { generateUniqueId } = require('../utils/id.util');
const { parsePhoneNumbers } = require('../utils/phone.util');
const config = require('../config/config');

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

    // If scheduled for later, create scheduled message - FIXED
    if (scheduled) {
      let scheduledAt;
      
      // Handle different scheduled input formats
      if (typeof scheduled === 'string') {
        scheduledAt = new Date(scheduled);
      } else if (scheduled instanceof Date) {
        scheduledAt = scheduled;
      } else {
        throw new ApiError('Invalid scheduled date format', 400);
      }
      
      // Validate scheduled date (must be in the future) - with buffer
      const now = new Date();
      const minScheduleTime = new Date(now.getTime() + 60 * 1000); // 1 minute from now
      
      if (scheduledAt <= minScheduleTime) {
        throw new ApiError('Scheduled time must be at least 1 minute in the future', 400);
      }
      
      // Create scheduled message
      const scheduledMessage = await ScheduledMessage.create({
        userId,
        type: 'sms',
        message,
        senderId: senderId || null,
        recipients: JSON.stringify(phoneNumbers),
        recipientCount: phoneNumbers.length,
        scheduledAt,
        status: 'pending',
        cost, // Store expected cost
      });
      
      // Create notification for scheduled message
      notificationService.createNotification(
        userId,
        'Message Scheduled',
        `Your message to ${phoneNumbers.length} recipient(s) has been scheduled for ${scheduledAt.toLocaleString()}.`,
        'info',
        {
          action: 'message-scheduled',
          messageId: `scheduled_${scheduledMessage.id}`,
          recipientCount: phoneNumbers.length,
          scheduledAt: scheduledAt.toISOString(),
          recipientType,
          cost
        },
        false // Don't send email for routine operations
      ).catch(err => logger.error(`Failed to create scheduled message notification: ${err.message}`));
      
      return {
        messageId: `scheduled_${scheduledMessage.id}`,
        status: 'scheduled',
        recipients: phoneNumbers.length,
        cost,
        scheduledAt,
        recipientType,
        scheduledMessageId: scheduledMessage.id
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
    
    // Create notification for sent message
    notificationService.createNotification(
      userId,
      'Message Sent Successfully',
      `Your message has been sent to ${phoneNumbers.length} recipient(s).`,
      'success',
      {
        action: 'message-sent',
        messageId: messageRecord.messageId,
        recipientCount: phoneNumbers.length,
        cost: cost,
        recipientType,
        timestamp: new Date().toISOString()
      },
      false // Don't send email for routine operations
    ).catch(err => logger.error(`Failed to create message sent notification: ${err.message}`));
    
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
    
    // If scheduled for later, create scheduled message - FIXED
    if (scheduled) {
      let scheduledAt;
      
      // Handle different scheduled input formats
      if (typeof scheduled === 'string') {
        scheduledAt = new Date(scheduled);
      } else if (scheduled instanceof Date) {
        scheduledAt = scheduled;
      } else {
        throw new ApiError('Invalid scheduled date format', 400);
      }
      
      // Validate scheduled date (must be in the future) - with buffer
      const now = new Date();
      const minScheduleTime = new Date(now.getTime() + 60 * 1000); // 1 minute from now
      
      if (scheduledAt <= minScheduleTime) {
        throw new ApiError('Scheduled time must be at least 1 minute in the future', 400);
      }
      
      // Create scheduled message
      const scheduledMessage = await ScheduledMessage.create({
        userId,
        type: 'sms',
        message,
        senderId: senderId || null,
        recipients: JSON.stringify(phoneNumbers),
        recipientCount: phoneNumbers.length,
        scheduledAt,
        status: 'pending',
        cost, // Store expected cost
      });
      
      // Clean up the CSV file
      try {
        await fs.unlink(filePath);
      } catch (error) {
        logger.warn(`Failed to delete CSV file: ${error.message}`);
      }
      
      // Create notification for scheduled bulk message
      notificationService.createNotification(
        userId,
        'Bulk SMS Scheduled',
        `Your bulk SMS to ${phoneNumbers.length} recipient(s) has been scheduled for ${scheduledAt.toLocaleString()}.`,
        'info',
        {
          action: 'bulk-message-scheduled',
          messageId: `scheduled_${scheduledMessage.id}`,
          recipientCount: phoneNumbers.length,
          scheduledAt: scheduledAt.toISOString(),
          cost
        },
        false // Don't send email for routine operations
      ).catch(err => logger.error(`Failed to create scheduled bulk message notification: ${err.message}`));
      
      return {
        messageId: `scheduled_${scheduledMessage.id}`,
        status: 'scheduled',
        recipients: phoneNumbers.length,
        cost,
        scheduledAt,
        scheduledMessageId: scheduledMessage.id
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
        sentCount += batchResult.accepted || batch.length;
        failedCount += batchResult.rejected || 0;
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
    
    // Create campaign completion notification
    const notificationTitle = failedCount > 0 ? 'Bulk SMS Campaign Completed with Issues' : 'Bulk SMS Campaign Completed';
    const notificationType = failedCount > (phoneNumbers.length * 0.1) ? 'warning' : 'success'; // Warning if >10% failed
    
    notificationService.createNotification(
      userId,
      notificationTitle,
      `Your bulk SMS campaign to ${phoneNumbers.length} recipients has completed with ${sentCount} delivered and ${failedCount} failed messages.`,
      notificationType,
      {
        action: 'campaign-complete',
        campaignId: messageRecord.messageId,
        total: phoneNumbers.length,
        delivered: sentCount,
        failed: failedCount,
        cost: cost,
        timestamp: new Date().toISOString()
      },
      failedCount > (phoneNumbers.length * 0.1) // Send email only if more than 10% failed
    ).catch(err => logger.error(`Failed to create campaign completion notification: ${err.message}`));
    
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
          
          // If status changed to delivered or failed, create notification
          if (providerStatus.status === 'delivered' || providerStatus.status === 'failed') {
            const notificationType = providerStatus.status === 'delivered' ? 'success' : 'warning';
            const notificationTitle = providerStatus.status === 'delivered' ? 'Message Delivered' : 'Message Delivery Failed';
            
            notificationService.createNotification(
              userId,
              notificationTitle,
              `Your message to ${message.recipientCount} recipient(s) has been ${providerStatus.status}.`,
              notificationType,
              {
                action: 'message-status-update',
                messageId: message.messageId,
                previousStatus: message.status,
                newStatus: providerStatus.status,
                timestamp: new Date().toISOString()
              },
              providerStatus.status === 'failed' // Send email only for failed messages
            ).catch(err => logger.error(`Failed to create message status notification: ${err.message}`));
          }
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
    status = null,
    search = null,
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

    // Enhanced search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();

      // Check if search term looks like a phone number
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,}$/;
      const isPhoneSearch = phoneRegex.test(searchTerm.replace(/\s/g, ''));

      if (isPhoneSearch) {
        // Clean phone number for searching
        const cleanedPhone = searchTerm.replace(/[\s\-\(\)\+]/g, '');
        whereConditions[Op.or] = [
          // Search in recipients JSON field for phone numbers
          { recipients: { [Op.like]: `%${cleanedPhone}%` } },
          // Also search the original format
          { recipients: { [Op.like]: `%${searchTerm}%` } },
        ];
      } else {
        // General text search - Use LIKE instead of ILIKE for MySQL
        whereConditions[Op.or] = [
          // Search in message content (case-insensitive using LOWER)
          db.sequelize.where(
            db.sequelize.fn('LOWER', db.sequelize.col('content')),
            'LIKE',
            `%${searchTerm.toLowerCase()}%`
          ),
          // Search in sender ID (case-insensitive)
          db.sequelize.where(
            db.sequelize.fn('LOWER', db.sequelize.col('senderId')),
            'LIKE',
            `%${searchTerm.toLowerCase()}%`
          ),
          // Search in message ID (case-insensitive)
          db.sequelize.where(
            db.sequelize.fn('LOWER', db.sequelize.col('messageId')),
            'LIKE',
            `%${searchTerm.toLowerCase()}%`
          ),
          // Search in recipients for non-phone text
          { recipients: { [Op.like]: `%${searchTerm}%` } },
        ];
      }
    }

    // Query database with pagination
    const { count, rows } = await Message.findAndCountAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit, 10),
      offset,
    });

    // Parse recipients JSON to arrays and ensure cost is number
    const messages = rows.map((message) => {
      const msg = message.toJSON();
      try {
        msg.recipients = JSON.parse(msg.recipients);
      } catch (error) {
        msg.recipients = [];
        logger.warn(`Failed to parse recipients for message ${msg.id}: ${error.message}`);
      }

      // Ensure cost is a number
      msg.cost = typeof msg.cost === 'number' ? msg.cost : parseFloat(msg.cost) || 0;

      return msg;
    });

    // Calculate pagination details
    const totalPages = Math.ceil(count / limit);

    return {
      messages,
      pagination: {
        total: count,
        totalPages,
        currentPage: parseInt(page, 10),
        limit: parseInt(limit, 10),
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    logger.error(`Get enhanced message history error: ${error.message}`, {
      stack: error.stack,
      userId,
      options,
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
  const { page = 1, limit = 20, type = null, search = null } = options;
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
    
    // Add search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();
      whereConditions[Op.or] = [
        // Search in message content
        db.sequelize.where(
          db.sequelize.fn('LOWER', db.sequelize.col('message')),
          'LIKE',
          `%${searchTerm.toLowerCase()}%`
        ),
        // Search in sender ID
        db.sequelize.where(
          db.sequelize.fn('LOWER', db.sequelize.col('senderId')),
          'LIKE',
          `%${searchTerm.toLowerCase()}%`
        ),
        // Search in recipients
        { recipients: { [Op.like]: `%${searchTerm}%` } },
      ];
    }
    
    // Query database with pagination
    const { count, rows } = await ScheduledMessage.findAndCountAll({
      where: whereConditions,
      order: [['scheduledAt', 'ASC']],
      limit: parseInt(limit, 10),
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
      
      // Ensure cost is a number
      msg.cost = typeof msg.cost === 'number' ? msg.cost : parseFloat(msg.cost) || 0;
      
      return msg;
    });
    
    // Calculate pagination details
    const totalPages = Math.ceil(count / limit);
    
    return {
      messages,
      pagination: {
        total: count,
        totalPages,
        currentPage: parseInt(page, 10),
        limit: parseInt(limit, 10),
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
    const scheduledMessage = await ScheduledMessage.findOne({
      where: {
        id: scheduledId,
        userId,
        status: { [Op.notIn]: ['sent', 'cancelled', 'processing'] },
      },
    });
    
    if (!scheduledMessage) {
      throw new ApiError('Scheduled message not found or cannot be cancelled', 404);
    }
    
    // Check if the message is not too close to execution time
    const now = new Date();
    const scheduledAt = new Date(scheduledMessage.scheduledAt);
    const timeDiff = scheduledAt.getTime() - now.getTime();
    
    if (timeDiff < 60 * 1000) { // Less than 1 minute
      throw new ApiError('Cannot cancel message scheduled to send within 1 minute', 400);
    }
    
    await scheduledMessage.update({ 
      status: 'cancelled',
      cancelledAt: new Date()
    });
    
    // Send WebSocket notification
    try {
      const websocket = require('../utils/websocket.util');
      if (websocket.isInitialized()) {
        websocket.emit(`user:${userId}`, 'scheduled_update', {
          id: scheduledId,
          status: 'cancelled',
          timestamp: new Date().toISOString()
        });
      }
    } catch (wsError) {
      logger.error(`WebSocket notification error: ${wsError.message}`);
    }
    
    notificationService.createNotification(
      userId,
      'Scheduled Message Cancelled',
      `Your scheduled message to ${scheduledMessage.recipientCount} recipient(s) has been cancelled.`,
      'info',
      {
        action: 'scheduled-message-cancelled',
        scheduleId: scheduledId,
        recipientCount: scheduledMessage.recipientCount,
        scheduledAt: scheduledAt.toISOString(),
        timestamp: new Date().toISOString()
      },
      false
    ).catch(err => logger.error(`Failed to create cancelled message notification: ${err.message}`));
    
    return {
      success: true,
      message: 'Scheduled message cancelled successfully',
      scheduledMessage: {
        id: scheduledMessage.id,
        status: 'cancelled',
        scheduledAt: scheduledMessage.scheduledAt,
        recipientCount: scheduledMessage.recipientCount
      }
    };
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
  const t = await db.sequelize.transaction();
  
  try {
    // Find due messages with a small buffer to avoid race conditions
    const now = new Date();
    const bufferTime = new Date(now.getTime() + 30 * 1000); // 30 seconds buffer
    
    const dueMessages = await ScheduledMessage.findAll({
      where: {
        status: 'pending',
        scheduledAt: { 
          [Op.lte]: bufferTime,
          [Op.gte]: new Date(now.getTime() - 5 * 60 * 1000) // Not older than 5 minutes
        },
      },
      limit: 50, // Process in smaller batches
      transaction: t,
      order: [['scheduledAt', 'ASC']]
    });
    
    if (dueMessages.length === 0) {
      await t.commit();
      logger.debug('No scheduled messages due for processing');
      return { processed: 0, success: 0, failed: 0 };
    }
    
    logger.info(`Processing ${dueMessages.length} scheduled messages`);
    
    let successCount = 0;
    let failedCount = 0;
    
    for (const scheduledMessage of dueMessages) {
      try {
        // Mark as processing first to prevent duplicate processing
        await scheduledMessage.update({ status: 'processing' }, { transaction: t });
        
        const user = await User.findByPk(scheduledMessage.userId, { transaction: t });
        if (!user) {
          throw new Error('User not found');
        }
        
        let phoneNumbers = [];
        try {
          phoneNumbers = JSON.parse(scheduledMessage.recipients);
          if (!Array.isArray(phoneNumbers)) {
            throw new Error('Recipients is not an array');
          }
        } catch (error) {
          throw new Error(`Failed to parse recipients: ${error.message}`);
        }
        
        // Recalculate cost to ensure accuracy
        const cost = smsProviderService.calculateMessageCost(
          scheduledMessage.recipientCount || phoneNumbers.length,
          scheduledMessage.message
        );
        
        // Check user balance
        const currentBalance = await balanceService.getUserBalance(user.id);
        if (currentBalance < cost) {
          throw new Error('Insufficient balance');
        }
        
        const messageId = generateUniqueId(`${scheduledMessage.type}_scheduled`);
        
        let providerResult;
        if (scheduledMessage.type === 'sms') {
          providerResult = await smsProviderService.sendSms(
            phoneNumbers,
            scheduledMessage.message,
            scheduledMessage.senderId
          );
        } else if (scheduledMessage.type === 'voice') {
          // Implement voice call logic when available
          throw new Error('Voice messages not yet implemented');
        } else if (scheduledMessage.type === 'audio') {
          // Implement audio message logic when available
          throw new Error('Audio messages not yet implemented');
        }
        
        // Deduct balance
        await balanceService.deductBalance(
          user.id,
          cost,
          `scheduled_${scheduledMessage.type}`,
          `Scheduled ${scheduledMessage.type.toUpperCase()} to ${phoneNumbers.length} recipient(s)`,
          { transaction: t }
        );
        
        // Create message record
        await Message.create({
          userId: user.id,
          messageId,
          type: scheduledMessage.type,
          content: scheduledMessage.message,
          audioUrl: scheduledMessage.audioUrl,
          senderId: scheduledMessage.senderId,
          recipients: JSON.stringify(phoneNumbers),
          recipientCount: phoneNumbers.length,
          cost,
          status: 'sent',
          scheduled: true,
          scheduledAt: scheduledMessage.scheduledAt,
        }, { transaction: t });
        
        // Mark scheduled message as sent
        await scheduledMessage.update({ 
          status: 'sent',
          processedAt: new Date()
        }, { transaction: t });
        
        // Send WebSocket notification (outside transaction)
        process.nextTick(() => {
          try {
            const websocket = require('../utils/websocket.util');
            if (websocket.isInitialized()) {
              websocket.emit(`user:${user.id}`, 'scheduled_update', {
                id: scheduledMessage.id,
                status: 'sent',
                recipientCount: phoneNumbers.length,
                messageId: messageId,
                timestamp: new Date().toISOString()
              });
            }
          } catch (wsError) {
            logger.error(`WebSocket notification error: ${wsError.message}`);
          }
        });
        
        // Create success notification (outside transaction)
        process.nextTick(() => {
          notificationService.createNotification(
            user.id,
            'Scheduled Message Sent',
            `Your scheduled message to ${phoneNumbers.length} recipient(s) has been sent successfully.`,
            'success',
            {
              action: 'scheduled-message-sent',
              messageId: messageId,
              originalScheduleId: scheduledMessage.id,
              recipientCount: phoneNumbers.length,
              cost: cost,
              timestamp: new Date().toISOString()
            },
            false
          ).catch(err => logger.error(`Notification error: ${err.message}`));
        });
        
        successCount++;
        logger.info(`Successfully processed scheduled message ${scheduledMessage.id}`);
        
      } catch (error) {
        logger.error(`Failed to process scheduled message ${scheduledMessage.id}: ${error.message}`, {
          stack: error.stack,
          messageId: scheduledMessage.id
        });
        
        // Mark as failed
        await scheduledMessage.update({ 
          status: 'failed',
          errorMessage: error.message,
          processedAt: new Date()
        }, { transaction: t });
        
        // Send WebSocket notification for failure (outside transaction)
        process.nextTick(() => {
          try {
            const websocket = require('../utils/websocket.util');
            if (websocket.isInitialized()) {
              websocket.emit(`user:${scheduledMessage.userId}`, 'scheduled_update', {
                id: scheduledMessage.id,
                status: 'failed',
                recipientCount: scheduledMessage.recipientCount,
                errorMessage: error.message,
                timestamp: new Date().toISOString()
              });
            }
          } catch (wsError) {
            logger.error(`WebSocket failure notification error: ${wsError.message}`);
          }
        });
        
        // Create failure notification (outside transaction)
        process.nextTick(() => {
          notificationService.createNotification(
            scheduledMessage.userId,
            'Scheduled Message Failed',
            `Your scheduled message could not be sent: ${error.message}`,
            'error',
            {
              action: 'scheduled-message-failed',
              scheduleId: scheduledMessage.id,
              recipientCount: scheduledMessage.recipientCount,
              error: error.message,
              timestamp: new Date().toISOString()
            },
            true // Send email for failures
          ).catch(err => logger.error(`Notification error: ${err.message}`));
        });
        
        failedCount++;
      }
    }
    
    await t.commit();
    
    const result = {
      processed: dueMessages.length,
      success: successCount,
      failed: failedCount
    };
    
    if (result.processed > 0) {
      logger.info(`Scheduled message processing completed: ${successCount} success, ${failedCount} failed`);
    }
    
    return result;
    
  } catch (error) {
    await t.rollback();
    logger.error(`Process scheduled messages error: ${error.message}`, { 
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Delete a single message
 * @param {number} userId - User ID
 * @param {string} messageId - Message ID to delete
 * @returns {Object} Deletion result
 */
const deleteMessage = async (userId, messageId) => {
  try {
    // Validate user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Normalize message ID to number for database query
    const normalizedMessageId = typeof messageId === 'string' ? parseInt(messageId, 10) : messageId;
    
    if (isNaN(normalizedMessageId) || normalizedMessageId <= 0) {
      throw new ApiError('Invalid message ID format', 400);
    }

    // Find the message
    const message = await Message.findOne({
      where: {
        userId,
        id: normalizedMessageId, // Using database ID, not messageId field
      },
    });

    if (!message) {
      throw new ApiError('Message not found', 404);
    }

    // Check if message can be deleted (not currently being processed)
    if (message.status === 'processing') {
      throw new ApiError('Cannot delete message that is currently being processed', 400);
    }

    // Store message details for response
    const messageDetails = {
      id: message.id,
      messageId: message.messageId,
      type: message.type,
      recipientCount: message.recipientCount,
      cost: message.cost,
      status: message.status,
      createdAt: message.createdAt
    };

    // Delete the message
    await message.destroy();

    // Create notification for single delete
    notificationService.createNotification(
      userId,
      'Message Deleted',
      `Successfully deleted ${message.type.toUpperCase()} message to ${message.recipientCount} recipient(s).`,
      'info',
      {
        action: 'message-deleted',
        messageId: message.messageId,
        originalId: message.id,
        type: message.type,
        recipientCount: message.recipientCount,
        cost: message.cost,
        timestamp: new Date().toISOString()
      },
      false // Don't send email for routine operations
    ).catch(err => logger.error(`Failed to create delete notification: ${err.message}`));

    logger.info(`Message deleted successfully`, { 
      userId, 
      requestedMessageId: messageId,
      normalizedMessageId,
      actualMessageId: message.messageId,
      messageType: message.type,
      recipientCount: message.recipientCount
    });

    return {
      messageId: normalizedMessageId,
      originalMessageId: message.messageId,
      deleted: true,
      details: messageDetails
    };
  } catch (error) {
    logger.error(`Delete message error: ${error.message}`, { 
      stack: error.stack, 
      userId,
      messageId,
      errorType: error.constructor.name
    });
    throw error;
  }
};

/**
 * Delete multiple messages (batch delete) - FIXED to handle both string and number IDs
 * @param {number} userId - User ID
 * @param {Array} messageIds - Array of message IDs to delete (can be strings or numbers)
 * @returns {Object} Batch deletion result
 */
const batchDeleteMessages = async (userId, messageIds) => {
  const t = await db.sequelize.transaction();
  
  try {
    // Validate user
    const user = await User.findByPk(userId, { transaction: t });
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Normalize message IDs to ensure they're all numbers for database queries
    const normalizedMessageIds = messageIds.map(id => {
      // Convert to number if it's a string that represents a number
      const numId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      // Validate that it's a valid number
      if (isNaN(numId) || numId <= 0) {
        throw new ApiError(`Invalid message ID: ${id}`, 400);
      }
      
      return numId;
    });

    logger.debug('Batch delete request', {
      userId,
      originalIds: messageIds,
      normalizedIds: normalizedMessageIds,
      count: normalizedMessageIds.length
    });

    // Find all messages that belong to the user
    const messages = await Message.findAll({
      where: {
        userId,
        id: { [Op.in]: normalizedMessageIds },
      },
      transaction: t
    });

    if (messages.length === 0) {
      await t.rollback();
      throw new ApiError('No messages found to delete', 404);
    }

    // Check for messages that weren't found
    const foundIds = messages.map(msg => msg.id);
    const notFoundIds = normalizedMessageIds.filter(id => !foundIds.includes(id));

    // Check if any messages are currently being processed
    const processingMessages = messages.filter(msg => msg.status === 'processing');
    if (processingMessages.length > 0) {
      await t.rollback();
      throw new ApiError(
        `Cannot delete ${processingMessages.length} message(s) that are currently being processed`,
        400
      );
    }

    // Delete all found messages
    const deleteResult = await Message.destroy({
      where: {
        userId,
        id: { [Op.in]: foundIds },
      },
      transaction: t
    });

    await t.commit();

    // Create notification for successful batch delete
    if (messages.length > 0) {
      notificationService.createNotification(
        userId,
        'Messages Deleted',
        `Successfully deleted ${messages.length} message(s) from your history.`,
        'info',
        {
          action: 'batch-delete-completed',
          deletedCount: messages.length,
          requestedCount: messageIds.length,
          notFoundCount: notFoundIds.length,
          timestamp: new Date().toISOString()
        },
        false // Don't send email for routine operations
      ).catch(err => logger.error(`Failed to create batch delete notification: ${err.message}`));
    }

    logger.info(`Batch delete completed successfully`, { 
      userId, 
      requestedCount: messageIds.length,
      foundCount: messages.length,
      deletedCount: deleteResult,
      notFoundCount: notFoundIds.length
    });

    return {
      requested: messageIds.length,
      found: messages.length,
      deletedCount: deleteResult,
      notFound: notFoundIds.length,
      notFoundIds: notFoundIds,
      deletedMessages: messages.map(msg => ({
        id: msg.id,
        messageId: msg.messageId,
        type: msg.type,
        recipientCount: msg.recipientCount,
        cost: msg.cost
      })),
      summary: {
        totalCostDeleted: messages.reduce((sum, msg) => sum + (msg.cost || 0), 0),
        messageTypes: messages.reduce((acc, msg) => {
          acc[msg.type] = (acc[msg.type] || 0) + 1;
          return acc;
        }, {}),
        totalRecipients: messages.reduce((sum, msg) => sum + (msg.recipientCount || 0), 0)
      }
    };
  } catch (error) {
    await t.rollback();
    logger.error(`Batch delete messages error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      messageIds: messageIds,
      errorType: error.constructor.name
    });
    throw error;
  }
};

/**
 * Export message history as CSV
 * @param {number} userId - User ID
 * @param {Object} options - Export options
 * @returns {string} CSV data
 */
const exportMessageHistory = async (userId, options = {}) => {
  try {
    const { 
      startDate = null, 
      endDate = null, 
      type = null, 
      status = null,
      search = null
    } = options;
    
    // Validate user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Build where conditions (reuse logic from getMessageHistory)
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

    // Add search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();
      
      // Check if search term looks like a phone number
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{7,}$/;
      const isPhoneSearch = phoneRegex.test(searchTerm.replace(/\s/g, ''));
      
      if (isPhoneSearch) {
        // Clean phone number for searching
        const cleanedPhone = searchTerm.replace(/[\s\-\(\)\+]/g, '');
        whereConditions[Op.or] = [
          // Search in recipients JSON field for phone numbers
          { recipients: { [Op.like]: `%${cleanedPhone}%` } },
          // Also search the original format
          { recipients: { [Op.like]: `%${searchTerm}%` } },
        ];
      } else {
        // General text search - Use LIKE instead of ILIKE for MySQL
        whereConditions[Op.or] = [
          // Search in message content (case-insensitive using LOWER)
          db.sequelize.where(
            db.sequelize.fn('LOWER', db.sequelize.col('content')),
            'LIKE',
            `%${searchTerm.toLowerCase()}%`
          ),
          // Search in sender ID (case-insensitive)
          db.sequelize.where(
            db.sequelize.fn('LOWER', db.sequelize.col('senderId')),
            'LIKE',
            `%${searchTerm.toLowerCase()}%`
          ),
          // Search in message ID (case-insensitive)
          db.sequelize.where(
            db.sequelize.fn('LOWER', db.sequelize.col('messageId')),
            'LIKE',
            `%${searchTerm.toLowerCase()}%`
          ),
          // Search in recipients for non-phone text
          { recipients: { [Op.like]: `%${searchTerm}%` } },
        ];
      }
    }
    
    // Query all messages without pagination for export
    const messages = await Message.findAll({
      where: whereConditions,
      order: [['createdAt', 'DESC']],
      limit: 10000, // Reasonable limit for export
    });
    
    // Convert to CSV format
    const csvHeaders = [
      'Date',
      'Message ID',
      'Type',
      'Content',
      'Sender ID',
      'Recipients',
      'Recipient Count',
      'Status',
      'Cost',
      'Scheduled',
      'Scheduled At',
    ];
    
    const csvRows = messages.map(message => {
      let recipients = [];
      try {
        recipients = JSON.parse(message.recipients || '[]');
      } catch (error) {
        recipients = [];
      }
      
      return [
        new Date(message.createdAt).toISOString(),
        message.messageId,
        message.type,
        `"${(message.content || '').replace(/"/g, '""')}"`, // Escape quotes
        message.senderId || '',
        `"${recipients.join(', ')}"`,
        message.recipientCount,
        message.status,
        message.cost || 0,
        message.scheduled ? 'Yes' : 'No',
        message.scheduledAt ? new Date(message.scheduledAt).toISOString() : '',
      ];
    });
    
    // Combine headers and rows
    const csvData = [csvHeaders, ...csvRows]
      .map(row => row.join(','))
      .join('\n');
    
    logger.info(`Message history exported`, { 
      userId, 
      exportedCount: messages.length,
      filters: options
    });
    
    return csvData;
  } catch (error) {
    logger.error(`Export message history error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      options
    });
    throw error;
  }
};

/**
 * Resend a failed message
 * @param {number} userId - User ID
 * @param {string} messageId - Message ID to resend
 * @returns {Object} Resend result
 */
const resendMessage = async (userId, messageId) => {
  try {
    // Validate user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Find the message
    const message = await Message.findOne({
      where: {
        userId,
        id: messageId,
      },
    });

    if (!message) {
      throw new ApiError('Message not found', 404);
    }

    // Check if message can be resent (only failed messages)
    if (message.status !== 'failed') {
      throw new ApiError('Only failed messages can be resent', 400);
    }

    // Parse recipients
    let phoneNumbers = [];
    try {
      phoneNumbers = JSON.parse(message.recipients);
    } catch (error) {
      throw new ApiError('Invalid recipients data', 400);
    }

    // Check user balance
    const cost = smsProviderService.calculateMessageCost(phoneNumbers.length, message.content);
    const userBalance = await balanceService.getUserBalance(userId);
    
    if (userBalance < cost) {
      throw new ApiError('Insufficient balance to resend message', 400);
    }

    // Generate new message ID for tracking
    const newMessageId = generateUniqueId('sms_resend');

    // Resend using provider
    const smsResult = await smsProviderService.sendSms(
      phoneNumbers, 
      message.content, 
      message.senderId
    );

    // Deduct balance
    await balanceService.deductBalance(
      userId, 
      cost, 
      'sms_resend', 
      `Resent message to ${phoneNumbers.length} recipient(s)`
    );

    // Update original message status to indicate it was resent
    await message.update({
      status: 'resent',
      updatedAt: new Date(),
    });

    // Create new message record for the resend
    const newMessage = await Message.create({
      userId,
      messageId: newMessageId,
      type: message.type,
      content: message.content,
      senderId: message.senderId,
      recipients: message.recipients,
      recipientCount: message.recipientCount,
      cost,
      status: 'sent',
      scheduled: false,
      originalMessageId: message.messageId, // Reference to original
    });

    // Create notification
    notificationService.createNotification(
      userId,
      'Message Resent Successfully',
      `Your message has been resent to ${phoneNumbers.length} recipient(s).`,
      'success',
      {
        action: 'message-resent',
        originalMessageId: message.messageId,
        newMessageId: newMessageId,
        recipientCount: phoneNumbers.length,
        cost: cost,
        timestamp: new Date().toISOString()
      },
      false
    ).catch(err => logger.error(`Failed to create resend notification: ${err.message}`));

    return {
      originalMessageId: message.messageId,
      newMessageId: newMessageId,
      status: 'sent',
      recipients: phoneNumbers.length,
      cost,
      providerMessageId: smsResult.messageId,
    };
  } catch (error) {
    logger.error(`Resend message error: ${error.message}`, { 
      stack: error.stack, 
      userId, 
      messageId
    });
    throw error;
  }
};

/**
 * Health check for SMS service
 * @returns {Object} Health status
 */
const healthCheck = async () => {
  try {
    // Check database connection
    await db.sequelize.authenticate();
    
    // Check if we can query messages table
    const messageCount = await Message.count({ limit: 1 });
    
    // Check SMS provider status (if available)
    let providerStatus = 'unknown';
    try {
      providerStatus = await smsProviderService.healthCheck();
    } catch (error) {
      logger.warn(`SMS provider health check failed: ${error.message}`);
      providerStatus = 'degraded';
    }
    
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      messagesTable: 'accessible',
      smsProvider: providerStatus,
      version: '1.0.0',
    };
  } catch (error) {
    logger.error(`SMS service health check error: ${error.message}`, { 
      stack: error.stack
    });
    
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      version: '1.0.0',
    };
  }
};
      
/**
 * Get updates for scheduled messages
 * @param {number} userId - User ID
 * @param {Array} messageIds - Array of scheduled message IDs to check
 * @returns {Array} Array of updated message status information
 */
const getScheduledMessageUpdates = async (userId, messageIds) => {
  try {
    // Find all provided scheduled messages that belong to this user
    // and have been updated (sent, failed, or cancelled)
    const updatedMessages = await ScheduledMessage.findAll({
      where: {
        userId,
        id: { [Op.in]: messageIds },
        status: { [Op.in]: ['sent', 'failed', 'cancelled'] }
      },
      attributes: ['id', 'status', 'recipientCount', 'errorMessage', 'processedAt', 'cancelledAt']
    });
    
    if (!updatedMessages || updatedMessages.length === 0) {
      return [];
    }
    
    // Format the updates
    const updates = updatedMessages.map(message => {
      const update = {
        id: message.id,
        status: message.status,
        recipientCount: message.recipientCount,
        timestamp: new Date().toISOString()
      };
      
      // Add error message if failed
      if (message.status === 'failed' && message.errorMessage) {
        update.errorMessage = message.errorMessage;
      }
      
      // Add processed/cancelled timestamp
      if (message.processedAt) {
        update.processedAt = message.processedAt.toISOString();
      }
      if (message.cancelledAt) {
        update.cancelledAt = message.cancelledAt.toISOString();
      }
      
      return update;
    });
    
    return updates;
  } catch (error) {
    logger.error(`Get scheduled message updates error: ${error.message}`, {
      stack: error.stack,
      userId,
      messageIds
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
  getScheduledMessageUpdates,
  getMessageAnalytics,
  processScheduledMessages,
  getGroupPhoneNumbers,
  processRecipients,
  
  // New exports
  deleteMessage,
  batchDeleteMessages,
  exportMessageHistory,
  resendMessage,
  healthCheck,
};