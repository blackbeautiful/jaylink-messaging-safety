// backend/src/routes/sms.routes.js - Complete SMS routes with all operations
const express = require('express');
const smsController = require('../controllers/sms.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { csvUploadMiddleware } = require('../middleware/upload.middleware');
const validate = require('../middleware/validator.middleware');
const smsValidator = require('../validators/sms.validator');
const { rateLimit } = require('express-rate-limit');

const router = express.Router();

// =====================================
// RATE LIMITERS
// =====================================

const sendMessageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // 50 messages per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many messages sent, please try again later.',
    error: {
      code: 'MESSAGE_RATE_LIMIT',
      details: null,
    },
  },
});

const bulkMessageLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 bulk operations per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many bulk operations, please try again later.',
    error: {
      code: 'BULK_RATE_LIMIT',
      details: null,
    },
  },
});

const deleteOperationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 delete operations per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many delete operations, please try again later.',
    error: {
      code: 'DELETE_RATE_LIMIT',
      details: null,
    },
  },
});

const analyticsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 analytics requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many analytics requests, please try again later.',
    error: {
      code: 'ANALYTICS_RATE_LIMIT',
      details: null,
    },
  },
});

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
    error: {
      code: 'GENERAL_RATE_LIMIT',
      details: null,
    },
  },
});

// =====================================
// MIDDLEWARE HELPERS
// =====================================

// Middleware to handle "all" filter values for export and history
const handleFilterAllValues = (req, res, next) => {
  if (req.query.type === 'all') req.query.type = '';
  if (req.query.status === 'all') req.query.status = '';
  next();
};

// Middleware to add messageId from params to body for validation
const addMessageIdToBody = (req, res, next) => {
  req.body.messageId = req.params.messageId;
  next();
};

// =====================================
// CORE SMS OPERATIONS
// =====================================

/**
 * @route POST /api/sms/send
 * @desc Send single SMS message
 * @access Private
 */
router.post(
  '/send',
  authenticate,
  sendMessageLimiter,
  validate(smsValidator.sendSmsSchema),
  smsController.sendSMS
);

/**
 * @route POST /api/sms/bulk-send
 * @desc Send bulk SMS using CSV file
 * @access Private
 */
router.post(
  '/bulk-send',
  authenticate,
  bulkMessageLimiter,
  csvUploadMiddleware,
  validate(smsValidator.bulkSendSmsSchema),
  smsController.sendBulkSMS
);

/**
 * @route POST /api/sms/resend/:messageId
 * @desc Resend a failed message
 * @access Private
 */
router.post(
  '/resend/:messageId',
  authenticate,
  sendMessageLimiter,
  addMessageIdToBody,
  validate(smsValidator.resendMessageSchema),
  smsController.resendMessage
);

// =====================================
// MESSAGE HISTORY AND STATUS
// =====================================

/**
 * @route GET /api/sms/history
 * @desc Get message history with advanced search and filtering
 * @access Private
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 * @query {string} search - Search term for content, phone numbers, or sender ID
 * @query {string} type - Message type filter (sms, voice, audio)
 * @query {string} status - Status filter (queued, sent, delivered, failed)
 * @query {string} startDate - Start date filter (ISO format)
 * @query {string} endDate - End date filter (ISO format)
 */
router.get(
  '/history',
  authenticate,
  generalLimiter,
  handleFilterAllValues,
  validate(smsValidator.messageHistorySchema, 'query'),
  smsController.getMessageHistory
);

/**
 * @route GET /api/sms/status/:messageId
 * @desc Get specific message delivery status
 * @access Private
 */
router.get(
  '/status/:messageId',
  authenticate,
  generalLimiter,
  smsController.getMessageStatus
);

/**
 * @route GET /api/sms/export
 * @desc Export message history as CSV file
 * @access Private
 * @query {string} type - Message type filter (sms, voice, audio)
 * @query {string} status - Status filter (queued, sent, delivered, failed)
 * @query {string} startDate - Start date filter (ISO format)
 * @query {string} endDate - End date filter (ISO format)
 * @query {string} search - Search term filter
 */
router.get(
  '/export',
  authenticate,
  generalLimiter,
  handleFilterAllValues,
  validate(smsValidator.exportHistorySchema, 'query'),
  smsController.exportMessageHistory
);

// =====================================
// DELETE OPERATIONS
// =====================================

/**
 * @route DELETE /api/sms/delete/:messageId
 * @desc Delete a single message
 * @access Private
 */
router.delete(
  '/delete/:messageId',
  authenticate,
  deleteOperationLimiter,
  smsController.deleteMessage
);

/**
 * @route POST /api/sms/batch-delete
 * @desc Delete multiple messages in batch
 * @access Private
 * @body {string[]} messageIds - Array of message IDs to delete
 */
router.post(
  '/batch-delete',
  authenticate,
  deleteOperationLimiter,
  validate(smsValidator.batchDeleteSchema),
  smsController.batchDeleteMessages
);

// =====================================
// SCHEDULED MESSAGES
// =====================================

/**
 * @route GET /api/sms/scheduled
 * @desc Get all scheduled messages
 * @access Private
 * @query {number} page - Page number (default: 1)
 * @query {number} limit - Items per page (default: 20, max: 100)
 * @query {string} type - Message type filter (sms, voice, audio)
 */
router.get(
  '/scheduled',
  authenticate,
  generalLimiter,
  validate(smsValidator.scheduledMessagesSchema, 'query'),
  smsController.getScheduledMessages
);

/**
 * @route DELETE /api/sms/scheduled/:scheduledId
 * @desc Cancel a scheduled message
 * @access Private
 */
router.delete(
  '/scheduled/:scheduledId',
  authenticate,
  generalLimiter,
  smsController.cancelScheduledMessage
);

/**
 * @route POST /api/sms/scheduled/updates
 * @desc Get real-time updates for scheduled messages
 * @access Private
 * @body {string[]} messageIds - Array of scheduled message IDs to check
 */
router.post(
  '/scheduled/updates',
  authenticate,
  generalLimiter,
  validate(smsValidator.checkScheduledUpdatesSchema),
  smsController.getScheduledMessageUpdates
);

// =====================================
// ANALYTICS AND REPORTING
// =====================================

/**
 * @route GET /api/sms/analytics
 * @desc Get comprehensive message analytics for dashboard
 * @access Private
 * @query {string} timeRange - Time range for analytics (1d, 7d, 30d, 90d, 1y)
 * @query {string} groupBy - Group results by (day, week, month)
 */
router.get(
  '/analytics',
  authenticate,
  analyticsLimiter,
  validate(smsValidator.analyticsQuerySchema, 'query'),
  smsController.getMessageAnalytics
);

/**
 * @route GET /api/sms/stats
 * @desc Get quick SMS statistics for dashboard
 * @access Private
 * @query {string} period - Time period (today, yesterday, this_week, last_week, this_month, last_month)
 * @query {boolean} includeDetails - Include detailed breakdown
 */
router.get(
  '/stats',
  authenticate,
  analyticsLimiter,
  validate(smsValidator.messageStatsSchema, 'query'),
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { period = 'today', includeDetails = false } = req.query;
      
      // Calculate date range based on period
      let startDate, endDate = new Date();
      const now = new Date();
      
      switch (period) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'yesterday':
          const yesterday = new Date(now);
          yesterday.setDate(yesterday.getDate() - 1);
          startDate = new Date(yesterday.setHours(0, 0, 0, 0));
          endDate = new Date(yesterday.setHours(23, 59, 59, 999));
          break;
        case 'this_week':
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startDate = new Date(startOfWeek.setHours(0, 0, 0, 0));
          break;
        case 'last_week':
          const lastWeekStart = new Date(now);
          lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
          startDate = new Date(lastWeekStart.setHours(0, 0, 0, 0));
          const lastWeekEnd = new Date(lastWeekStart);
          lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);
          endDate = new Date(lastWeekEnd.setHours(23, 59, 59, 999));
          break;
        case 'this_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'last_month':
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
          break;
        default:
          startDate = new Date(now.setHours(0, 0, 0, 0));
          endDate = new Date(now.setHours(23, 59, 59, 999));
      }
      
      // Get database models
      const db = require('../models');
      const { Op } = require('sequelize');
      
      const whereCondition = { 
        userId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      };
      
      // Execute queries in parallel for better performance
      const [
        totalMessages, 
        deliveredMessages, 
        failedMessages, 
        queuedMessages,
        scheduledMessages,
        totalCost
      ] = await Promise.all([
        db.Message.count({ where: whereCondition }),
        db.Message.count({ where: { ...whereCondition, status: 'delivered' } }),
        db.Message.count({ where: { ...whereCondition, status: 'failed' } }),
        db.Message.count({ where: { ...whereCondition, status: 'queued' } }),
        db.ScheduledMessage.count({ 
          where: { 
            userId, 
            status: 'pending',
            scheduledAt: { [Op.gte]: new Date() }
          } 
        }),
        db.Message.sum('cost', { where: whereCondition }) || 0
      ]);
      
      let details = {};
      if (includeDetails === 'true' || includeDetails === true) {
        const [smsCount, voiceCount, audioCount, sentMessages] = await Promise.all([
          db.Message.count({ where: { ...whereCondition, type: 'sms' } }),
          db.Message.count({ where: { ...whereCondition, type: 'voice' } }),
          db.Message.count({ where: { ...whereCondition, type: 'audio' } }),
          db.Message.count({ where: { ...whereCondition, status: 'sent' } })
        ]);
        
        details = {
          messageTypes: {
            sms: smsCount,
            voice: voiceCount,
            audio: audioCount
          },
          statusBreakdown: {
            delivered: deliveredMessages,
            sent: sentMessages,
            queued: queuedMessages,
            failed: failedMessages
          },
          rates: {
            deliveryRate: totalMessages > 0 ? Math.round((deliveredMessages / totalMessages) * 100) : 0,
            failureRate: totalMessages > 0 ? Math.round((failedMessages / totalMessages) * 100) : 0,
            successRate: totalMessages > 0 ? Math.round(((deliveredMessages + sentMessages) / totalMessages) * 100) : 0
          }
        };
      }
      
      res.json({
        success: true,
        data: {
          period,
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          },
          summary: {
            totalMessages,
            deliveredMessages,
            failedMessages,
            queuedMessages,
            scheduledMessages,
            totalCost: parseFloat((totalCost || 0).toString()).toFixed(2),
            currency: 'NGN',
            currencySymbol: '₦'
          },
          ...details,
          timestamp: new Date().toISOString()
        },
        message: 'SMS statistics retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sms/usage-summary
 * @desc Get monthly usage summary with cost breakdown
 * @access Private
 */
router.get(
  '/usage-summary',
  authenticate,
  analyticsLimiter,
  async (req, res, next) => {
    try {
      const userId = req.user.id;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      const db = require('../models');
      const { Op } = require('sequelize');
      
      // Get comprehensive usage statistics for current month
      const [
        totalMessages,
        totalCost,
        messagesByType,
        messagesByStatus,
        dailyUsage
      ] = await Promise.all([
        db.Message.count({
          where: {
            userId,
            createdAt: { [Op.between]: [startOfMonth, endOfMonth] }
          }
        }),
        db.Message.sum('cost', {
          where: {
            userId,
            createdAt: { [Op.between]: [startOfMonth, endOfMonth] }
          }
        }) || 0,
        db.Message.findAll({
          attributes: [
            'type', 
            [db.sequelize.fn('COUNT', db.sequelize.col('type')), 'count'],
            [db.sequelize.fn('SUM', db.sequelize.col('cost')), 'totalCost']
          ],
          where: {
            userId,
            createdAt: { [Op.between]: [startOfMonth, endOfMonth] }
          },
          group: ['type'],
          raw: true
        }),
        db.Message.findAll({
          attributes: [
            'status', 
            [db.sequelize.fn('COUNT', db.sequelize.col('status')), 'count']
          ],
          where: {
            userId,
            createdAt: { [Op.between]: [startOfMonth, endOfMonth] }
          },
          group: ['status'],
          raw: true
        }),
        db.Message.findAll({
          attributes: [
            [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'date'],
            [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
            [db.sequelize.fn('SUM', db.sequelize.col('cost')), 'cost']
          ],
          where: {
            userId,
            createdAt: { [Op.between]: [startOfMonth, endOfMonth] }
          },
          group: [db.sequelize.fn('DATE', db.sequelize.col('createdAt'))],
          order: [[db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'ASC']],
          raw: true
        })
      ]);
      
      res.json({
        success: true,
        data: {
          period: {
            start: startOfMonth.toISOString(),
            end: endOfMonth.toISOString(),
            month: now.toLocaleString('default', { month: 'long', year: 'numeric' })
          },
          summary: {
            totalMessages: totalMessages || 0,
            totalCost: parseFloat((totalCost || 0).toString()).toFixed(2),
            currency: 'NGN',
            currencySymbol: '₦',
            averageCostPerMessage: totalMessages > 0 ? (parseFloat((totalCost || 0).toString()) / totalMessages).toFixed(4) : '0.0000'
          },
          breakdown: {
            byType: messagesByType.reduce((acc, item) => {
              acc[item.type] = {
                count: parseInt(item.count),
                cost: parseFloat((item.totalCost || 0).toString()).toFixed(2)
              };
              return acc;
            }, {}),
            byStatus: messagesByStatus.reduce((acc, item) => {
              acc[item.status] = parseInt(item.count);
              return acc;
            }, {}),
            dailyUsage: dailyUsage.map(item => ({
              date: item.date,
              messages: parseInt(item.count),
              cost: parseFloat((item.cost || 0).toString()).toFixed(2)
            }))
          },
          timestamp: new Date().toISOString()
        },
        message: 'Usage summary retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// =====================================
// COST ESTIMATION AND UTILITIES
// =====================================

/**
 * @route POST /api/sms/cost-estimate
 * @desc Calculate estimated cost for a message
 * @access Private
 * @body {string|string[]} recipients - Recipients (string or array)
 * @body {string} message - Message content
 * @body {boolean} isInternational - Whether message is international
 */
router.post(
  '/cost-estimate',
  authenticate,
  generalLimiter,
  validate(smsValidator.costEstimateSchema),
  async (req, res, next) => {
    try {
      const { recipients, message, isInternational = false } = req.body;
      
      // Parse recipients count
      let recipientCount = 0;
      let recipientList = [];
      
      if (Array.isArray(recipients)) {
        recipientList = recipients;
        recipientCount = recipients.length;
      } else if (typeof recipients === 'string') {
        recipientList = recipients.split(/[,;]/).map(r => r.trim()).filter(Boolean);
        recipientCount = recipientList.length;
      }
      
      // Validate we have recipients
      if (recipientCount === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid recipients found',
          error: { code: 'NO_RECIPIENTS' }
        });
      }
      
      // Calculate cost using SMS provider service
      const smsProviderService = require('../services/sms-provider.service');
      const cost = smsProviderService.calculateMessageCost(recipientCount, message, isInternational);
      const messageUnits = Math.ceil(message.length / 160);
      
      // Analyze phone numbers for international detection if not specified
      let internationalCount = 0;
      let localCount = 0;
      
      if (!isInternational) {
        recipientList.forEach(number => {
          if (smsProviderService.isInternationalNumber && smsProviderService.isInternationalNumber(number)) {
            internationalCount++;
          } else {
            localCount++;
          }
        });
      } else {
        internationalCount = recipientCount;
      }
      
      res.json({
        success: true,
        data: {
          recipientCount,
          messageLength: message.length,
          messageUnits,
          estimatedCost: cost,
          currency: 'NGN',
          currencySymbol: '₦',
          costPerUnit: recipientCount > 0 && messageUnits > 0 ? (cost / (recipientCount * messageUnits)).toFixed(4) : '0.0000',
          breakdown: {
            localRecipients: localCount,
            internationalRecipients: internationalCount,
            unitsPerMessage: messageUnits,
            charactersPerUnit: 160,
            totalUnits: recipientCount * messageUnits
          },
          analysis: {
            isLongMessage: message.length > 160,
            requiresMultipleUnits: messageUnits > 1,
            hasInternationalNumbers: internationalCount > 0,
            costEfficient: cost / recipientCount < 10 // Less than ₦10 per recipient
          }
        },
        message: 'Cost estimate calculated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sms/validate-numbers
 * @desc Validate and format phone numbers
 * @access Private
 * @body {string[]} phoneNumbers - Array of phone numbers to validate
 */
router.post(
  '/validate-numbers',
  authenticate,
  generalLimiter,
  validate(smsValidator.bulkPhoneNumbersSchema),
  async (req, res, next) => {
    try {
      const { phoneNumbers } = req.body;
      const { parsePhoneNumbers } = require('../utils/phone.util');
      
      // Validate and parse phone numbers
      const validNumbers = parsePhoneNumbers(phoneNumbers);
      const invalidNumbers = phoneNumbers.filter(num => !validNumbers.includes(num));
      
      // Analyze number types
      const smsProviderService = require('../services/sms-provider.service');
      let localNumbers = [];
      let internationalNumbers = [];
      
      validNumbers.forEach(number => {
        if (smsProviderService.isInternationalNumber && smsProviderService.isInternationalNumber(number)) {
          internationalNumbers.push(number);
        } else {
          localNumbers.push(number);
        }
      });
      
      res.json({
        success: true,
        data: {
          input: {
            total: phoneNumbers.length,
            provided: phoneNumbers
          },
          validation: {
            valid: validNumbers.length,
            invalid: invalidNumbers.length,
            validationRate: Math.round((validNumbers.length / phoneNumbers.length) * 100)
          },
          results: {
            validNumbers,
            invalidNumbers,
            localNumbers,
            internationalNumbers
          },
          summary: {
            totalValid: validNumbers.length,
            totalInvalid: invalidNumbers.length,
            localCount: localNumbers.length,
            internationalCount: internationalNumbers.length,
            costImplication: {
              estimatedLocalCost: localNumbers.length * 0.05, // Example rate
              estimatedInternationalCost: internationalNumbers.length * 0.15, // Example rate
              currency: 'NGN'
            }
          }
        },
        message: 'Phone number validation completed successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// =====================================
// TEMPLATES AND SENDER IDS
// =====================================

/**
 * @route GET /api/sms/templates
 * @desc Get user's message templates
 * @access Private
 */
router.get(
  '/templates',
  authenticate,
  generalLimiter,
  async (req, res, next) => {
    try {
      // Placeholder implementation - can be extended with actual database operations
      const templates = [
        {
          id: 1,
          name: "Welcome Message",
          content: "Welcome to JayLink SMS! We're excited to have you on board. For support, reply HELP.",
          category: "general",
          isActive: true,
          createdAt: new Date().toISOString(),
          usageCount: 0
        },
        {
          id: 2,
          name: "Appointment Reminder",
          content: "Hi {name}, this is a reminder for your appointment scheduled for {date} at {time}. Reply CONFIRM to confirm.",
          category: "reminder",
          isActive: true,
          createdAt: new Date().toISOString(),
          usageCount: 0
        },
        {
          id: 3,
          name: "Promotional Offer",
          content: "🎉 Special offer! Get 20% off your next purchase. Use code SAVE20. Valid until {expiry}. T&Cs apply.",
          category: "promotional",
          isActive: true,
          createdAt: new Date().toISOString(),
          usageCount: 0
        },
        {
          id: 4,
          name: "Payment Confirmation",
          content: "Payment of {amount} received successfully. Transaction ID: {transactionId}. Thank you!",
          category: "transactional",
          isActive: true,
          createdAt: new Date().toISOString(),
          usageCount: 0
        }
      ];
      
      res.json({
        success: true,
        data: {
          templates,
          total: templates.length,
          categories: ['general', 'promotional', 'transactional', 'reminder'],
          activeCount: templates.filter(t => t.isActive).length
        },
        message: 'Message templates retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sms/templates
 * @desc Create a new message template
 * @access Private
 * @body {string} name - Template name
 * @body {string} content - Template content with optional placeholders
 * @body {string} category - Template category
 * @body {boolean} isActive - Whether template is active
 */
router.post(
  '/templates',
  authenticate,
  generalLimiter,
  validate(smsValidator.templateSchema),
  async (req, res, next) => {
    try {
      const { name, content, category, isActive } = req.body;
      
      // Placeholder implementation - extend with actual database operations
      const template = {
        id: Date.now(), // Temporary ID generation
        name,
        content,
        category,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: req.user.id,
        usageCount: 0
      };
      
      res.json({
        success: true,
        data: { template },
        message: 'Message template created successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route GET /api/sms/sender-ids
 * @desc Get user's registered sender IDs
 * @access Private
 */
router.get(
  '/sender-ids',
  authenticate,
  generalLimiter,
  async (req, res, next) => {
    try {
      // Placeholder implementation - extend with actual database operations
      const senderIds = [
        {
          id: 1,
          senderId: 'JAYLINK',
          purpose: 'business',
          status: 'approved',
          createdAt: new Date().toISOString(),
          isDefault: true,
          usageCount: 0
        }
      ];
      
      res.json({
        success: true,
        data: {
          senderIds,
          total: senderIds.length,
          defaultSenderId: senderIds.find(s => s.isDefault)?.senderId || 'JAYLINK',
          approvedCount: senderIds.filter(s => s.status === 'approved').length,
          pendingCount: senderIds.filter(s => s.status === 'pending').length
        },
        message: 'Sender IDs retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sms/sender-ids
 * @desc Register a new sender ID
 * @access Private
 * @body {string} senderId - Sender ID (3-11 alphanumeric characters)
 * @body {string} purpose - Purpose (personal, business, promotional)
 */
router.post(
  '/sender-ids',
  authenticate,
  generalLimiter,
  validate(smsValidator.senderIdSchema),
  async (req, res, next) => {
    try {
      const { senderId, purpose } = req.body;
      
      // Placeholder implementation - extend with actual registration logic
      const newSenderId = {
        id: Date.now(),
        senderId: senderId.toUpperCase(),
        purpose,
        status: 'pending',
        createdAt: new Date().toISOString(),
        userId: req.user.id,
        isDefault: false,
        usageCount: 0,
        estimatedApprovalTime: '24-48 hours'
      };
      
      res.json({
        success: true,
        data: { senderId: newSenderId },
        message: 'Sender ID registration submitted successfully. It will be reviewed within 24-48 hours.'
      });
    } catch (error) {
      next(error);
    }
  }
);

// =====================================
// ADVANCED SCHEDULING FEATURES
// =====================================

/**
 * @route POST /api/sms/schedule-batch
 * @desc Schedule multiple messages for different times
 * @access Private
 * @body {Object[]} messages - Array of message objects with scheduling info
 */
router.post(
  '/schedule-batch',
  authenticate,
  sendMessageLimiter,
  async (req, res, next) => {
    try {
      const { messages } = req.body;
      
      // Validate that messages is an array
      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Messages array is required and cannot be empty',
          error: { code: 'INVALID_INPUT' }
        });
      }
      
      if (messages.length > 50) {
        return res.status(400).json({
          success: false,
          message: 'Cannot schedule more than 50 messages at once',
          error: { code: 'BATCH_LIMIT_EXCEEDED' }
        });
      }
      
      const results = [];
      let totalCost = 0;
      
      // Process each message in the batch
      for (let i = 0; i < messages.length; i++) {
        const message = messages[i];
        try {
          // Validate each message against sendSmsSchema
          const validation = smsValidator.sendSmsSchema.validate(message);
          if (validation.error) {
            results.push({
              index: i,
              success: false,
              error: validation.error.details[0].message,
              message: message
            });
            continue;
          }
          
          // Calculate cost for this message
          const smsProviderService = require('../services/sms-provider.service');
          const recipientCount = message.recipients.split(/[,;]/).filter(r => r.trim()).length;
          const messageCost = smsProviderService.calculateMessageCost(recipientCount, message.message);
          totalCost += messageCost;
          
          // Schedule the message (placeholder implementation)
          const scheduledMessageId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          results.push({
            index: i,
            success: true,
            messageId: scheduledMessageId,
            scheduledAt: message.scheduled,
            recipients: recipientCount,
            cost: messageCost,
            status: 'scheduled'
          });
        } catch (error) {
          results.push({
            index: i,
            success: false,
            error: error.message,
            message: message
          });
        }
      }
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.length - successCount;
      
      res.json({
        success: true,
        data: {
          results,
          summary: {
            total: messages.length,
            successful: successCount,
            failed: failureCount,
            totalEstimatedCost: totalCost.toFixed(2),
            currency: 'NGN',
            currencySymbol: '₦'
          }
        },
        message: `Batch scheduling completed: ${successCount} successful, ${failureCount} failed`
      });
    } catch (error) {
      next(error);
    }
  }
);

// =====================================
// HEALTH AND MONITORING
// =====================================

/**
 * @route GET /api/sms/health
 * @desc Comprehensive health check for SMS service
 * @access Private
 */
router.get(
  '/health',
  authenticate,
  smsController.healthCheck
);

/**
 * @route GET /api/sms/provider-status
 * @desc Get detailed SMS provider status and capabilities
 * @access Private
 */
router.get(
  '/provider-status',
  authenticate,
  generalLimiter,
  async (req, res, next) => {
    try {
      const smsProviderService = require('../services/sms-provider.service');
      
      // Check provider health
      let providerHealth = 'unknown';
      let lastError = null;
      
      try {
        providerHealth = await smsProviderService.healthCheck?.() || 'unknown';
      } catch (error) {
        providerHealth = 'error';
        lastError = error.message;
      }
      
      // Get provider configuration
      const config = require('../config/config');
      
      res.json({
        success: true,
        data: {
          provider: {
            name: smsProviderService.providerName || 'default',
            status: providerHealth,
            lastError,
            environment: config.env
          },
          capabilities: {
            sendSms: true,
            bulkSms: true,
            scheduledMessages: true,
            deliveryReports: true,
            internationalSms: true,
            voiceMessages: false, // Placeholder
            multimedia: false // Placeholder
          },
          limits: {
            maxRecipientsPerMessage: 1000,
            maxMessageLength: 1600,
            maxBulkMessages: 10000,
            rateLimit: '50 per minute'
          },
          pricing: {
            localSms: 'Dynamic',
            internationalSms: 'Dynamic',
            currency: 'NGN',
            currencySymbol: '₦'
          },
          features: {
            templates: true,
            senderIdRegistration: true,
            deliveryReports: true,
            webhooks: true,
            analytics: true
          },
          timestamp: new Date().toISOString()
        },
        message: 'SMS provider status retrieved successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

// =====================================
// WEBHOOK ENDPOINTS
// =====================================

/**
 * @route POST /api/sms/webhook/delivery
 * @desc Handle delivery status webhooks from SMS provider
 * @access Public (secured with webhook validation)
 */
router.post(
  '/webhook/delivery',
  // Note: In production, add webhook signature validation middleware
  async (req, res, next) => {
    try {
      const { messageId, status, timestamp, details } = req.body;
      
      // Log the webhook for debugging
      const logger = require('../config/logger');
      logger.info('SMS delivery webhook received', {
        messageId,
        status,
        timestamp,
        details,
        headers: req.headers,
        body: req.body
      });
      
      // In a full implementation, this would:
      // 1. Validate webhook signature for security
      // 2. Update message status in database
      // 3. Trigger real-time updates via WebSocket
      // 4. Send notifications if needed
      // 5. Update analytics data
      
      // Placeholder implementation
      if (messageId && status) {
        // Update message status in database
        const db = require('../models');
        
        try {
          const message = await db.Message.findOne({
            where: { messageId }
          });
          
          if (message && message.status !== status) {
            await message.update({ 
              status,
              updatedAt: new Date()
            });
            
            logger.info(`Message ${messageId} status updated to ${status}`);
            
            // Trigger WebSocket update if available
            const websocket = require('../utils/websocket.util');
            if (websocket.isInitialized()) {
              websocket.broadcast(`user:${message.userId}`, 'message_status_update', {
                messageId,
                status,
                timestamp: new Date().toISOString()
              });
            }
          }
        } catch (dbError) {
          logger.error('Database update error in webhook:', dbError);
        }
      }
      
      res.json({
        success: true,
        message: 'Webhook processed successfully',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route POST /api/sms/webhook/test
 * @desc Test webhook endpoint for development
 * @access Private
 */
router.post(
  '/webhook/test',
  authenticate,
  async (req, res, next) => {
    try {
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
          success: false,
          message: 'Test webhook only available in development mode',
          error: { code: 'FORBIDDEN' }
        });
      }
      
      const { messageId, status } = req.body;
      
      if (!messageId || !status) {
        return res.status(400).json({
          success: false,
          message: 'messageId and status are required',
          error: { code: 'MISSING_PARAMETERS' }
        });
      }
      
      // Simulate webhook call
      const webhookData = {
        messageId,
        status,
        timestamp: new Date().toISOString(),
        details: {
          provider: 'test',
          deliveredAt: new Date().toISOString(),
          cost: 0.05
        }
      };
      
      // Call the webhook handler
      req.body = webhookData;
      await router.stack.find(layer => 
        layer.route && layer.route.path === '/webhook/delivery'
      ).route.stack[0].handle(req, res, next);
      
    } catch (error) {
      next(error);
    }
  }
);

// =====================================
// REPORTING AND EXPORTS
// =====================================

/**
 * @route GET /api/sms/reports/:reportType
 * @desc Generate various SMS reports
 * @access Private
 * @param {string} reportType - Type of report (daily, weekly, monthly, custom)
 */
router.get(
  '/reports/:reportType',
  authenticate,
  analyticsLimiter,
  validate(smsValidator.dateRangeSchema, 'query'),
  async (req, res, next) => {
    try {
      const { reportType } = req.params;
      const { startDate, endDate } = req.query;
      const userId = req.user.id;
      
      if (!['daily', 'weekly', 'monthly', 'custom'].includes(reportType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid report type. Must be one of: daily, weekly, monthly, custom',
          error: { code: 'INVALID_REPORT_TYPE' }
        });
      }
      
      const db = require('../models');
      const { Op } = require('sequelize');
      
      // Calculate date range based on report type
      let reportStartDate, reportEndDate;
      const now = new Date();
      
      switch (reportType) {
        case 'daily':
          reportStartDate = new Date(now.setHours(0, 0, 0, 0));
          reportEndDate = new Date(now.setHours(23, 59, 59, 999));
          break;
        case 'weekly':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          reportStartDate = new Date(weekStart.setHours(0, 0, 0, 0));
          reportEndDate = new Date();
          break;
        case 'monthly':
          reportStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
          reportEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
          break;
        case 'custom':
          if (!startDate || !endDate) {
            return res.status(400).json({
              success: false,
              message: 'startDate and endDate are required for custom reports',
              error: { code: 'MISSING_DATE_RANGE' }
            });
          }
          reportStartDate = new Date(startDate);
          reportEndDate = new Date(endDate);
          break;
      }
      
      // Generate comprehensive report
      const [
        totalMessages,
        totalCost,
        messagesByStatus,
        messagesByType,
        topSenderIds,
        hourlyDistribution
      ] = await Promise.all([
        db.Message.count({
          where: {
            userId,
            createdAt: { [Op.between]: [reportStartDate, reportEndDate] }
          }
        }),
        db.Message.sum('cost', {
          where: {
            userId,
            createdAt: { [Op.between]: [reportStartDate, reportEndDate] }
          }
        }) || 0,
        db.Message.findAll({
          attributes: [
            'status',
            [db.sequelize.fn('COUNT', '*'), 'count'],
            [db.sequelize.fn('SUM', db.sequelize.col('cost')), 'totalCost']
          ],
          where: {
            userId,
            createdAt: { [Op.between]: [reportStartDate, reportEndDate] }
          },
          group: ['status'],
          raw: true
        }),
        db.Message.findAll({
          attributes: [
            'type',
            [db.sequelize.fn('COUNT', '*'), 'count'],
            [db.sequelize.fn('SUM', db.sequelize.col('cost')), 'totalCost']
          ],
          where: {
            userId,
            createdAt: { [Op.between]: [reportStartDate, reportEndDate] }
          },
          group: ['type'],
          raw: true
        }),
        db.Message.findAll({
          attributes: [
            'senderId',
            [db.sequelize.fn('COUNT', '*'), 'count']
          ],
          where: {
            userId,
            createdAt: { [Op.between]: [reportStartDate, reportEndDate] },
            senderId: { [Op.not]: null }
          },
          group: ['senderId'],
          order: [[db.sequelize.fn('COUNT', '*'), 'DESC']],
          limit: 10,
          raw: true
        }),
        db.Message.findAll({
          attributes: [
            [db.sequelize.fn('HOUR', db.sequelize.col('createdAt')), 'hour'],
            [db.sequelize.fn('COUNT', '*'), 'count']
          ],
          where: {
            userId,
            createdAt: { [Op.between]: [reportStartDate, reportEndDate] }
          },
          group: [db.sequelize.fn('HOUR', db.sequelize.col('createdAt'))],
          order: [[db.sequelize.fn('HOUR', db.sequelize.col('createdAt')), 'ASC']],
          raw: true
        })
      ]);
      
      res.json({
        success: true,
        data: {
          reportType,
          period: {
            startDate: reportStartDate.toISOString(),
            endDate: reportEndDate.toISOString(),
            duration: Math.ceil((reportEndDate - reportStartDate) / (1000 * 60 * 60 * 24)) + ' days'
          },
          summary: {
            totalMessages,
            totalCost: parseFloat(totalCost.toString()).toFixed(2),
            currency: 'NGN',
            currencySymbol: '₦',
            averageCostPerMessage: totalMessages > 0 ? (parseFloat(totalCost.toString()) / totalMessages).toFixed(4) : '0.0000'
          },
          breakdown: {
            byStatus: messagesByStatus.reduce((acc, item) => {
              acc[item.status] = {
                count: parseInt(item.count),
                cost: parseFloat((item.totalCost || 0).toString()).toFixed(2)
              };
              return acc;
            }, {}),
            byType: messagesByType.reduce((acc, item) => {
              acc[item.type] = {
                count: parseInt(item.count),
                cost: parseFloat((item.totalCost || 0).toString()).toFixed(2)
              };
              return acc;
            }, {}),
            topSenderIds: topSenderIds.map(item => ({
              senderId: item.senderId,
              count: parseInt(item.count)
            })),
            hourlyDistribution: hourlyDistribution.map(item => ({
              hour: parseInt(item.hour),
              count: parseInt(item.count)
            }))
          },
          generatedAt: new Date().toISOString()
        },
        message: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully`
      });
    } catch (error) {
      next(error);
    }
  }
);

// =====================================
// DEVELOPMENT AND TESTING ROUTES
// =====================================

if (process.env.NODE_ENV === 'development') {
  /**
   * @route GET /api/sms/test-error
   * @desc Test error handling (development only)
   * @access Private
   */
  router.get(
    '/test-error', 
    authenticate, 
    (req, res, next) => {
      const error = new Error('Test error for development');
      error.statusCode = 400;
      next(error);
    }
  );
  
  /**
   * @route POST /api/sms/simulate-send
   * @desc Simulate SMS sending without actual delivery (development only)
   * @access Private
   */
  router.post(
    '/simulate-send',
    authenticate,
    validate(smsValidator.sendSmsSchema),
    async (req, res, next) => {
      try {
        const { recipients, message, senderId } = req.body;
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const recipientCount = recipients.split(/[,;]/).filter(r => r.trim()).length;
        const smsProviderService = require('../services/sms-provider.service');
        const cost = smsProviderService.calculateMessageCost(recipientCount, message);
        
        res.json({
          success: true,
          data: {
            messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'simulated',
            recipients: recipientCount,
            cost,
            message: 'This is a simulated response for development testing',
            timestamp: new Date().toISOString()
          },
          message: 'SMS simulation completed successfully'
        });
      } catch (error) {
        next(error);
      }
    }
  );
}

// =====================================
// EXPORT ROUTER
// =====================================

module.exports = router;