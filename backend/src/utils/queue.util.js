// backend/src/utils/queue.util.js
const logger = require('../config/logger');
const config = require('../config/config');

/**
 * Simple Queue wrapper around Bull queue
 * Handles background task processing
 */
class Queue {
  /**
   * Create a new queue
   * @param {string} name - Queue name
   * @param {Object} options - Queue options
   */
  constructor(name, options = {}) {
    this.name = name;
    
    try {
      // Dynamically import Bull to avoid startup errors if Redis is not available
      const Bull = this._getBullModule();
      
      if (!Bull) {
        logger.warn(`Queue "${name}" initialization skipped - Bull module not available`);
        this.isInitialized = false;
        return;
      }
      
      // Set up redis connection from config or use defaults
      const redisOptions = {
        host: config.redis?.host || 'localhost',
        port: config.redis?.port || 6379,
        password: config.redis?.password || undefined,
        tls: config.redis?.tls || undefined
      };
      
      // Create Bull queue
      this.queue = new Bull(name, {
        redis: redisOptions,
        defaultJobOptions: {
          attempts: options.attempts || 3,
          removeOnComplete: options.removeOnComplete || 100,
          removeOnFail: options.removeOnFail || 1000
        },
        ...options
      });
      
      // Set up default processors
      this._setupDefaultProcessors();
      
      this.isInitialized = true;
      logger.info(`Queue "${name}" initialized`);
    } catch (error) {
      logger.error(`Failed to initialize queue "${name}": ${error.message}`, { stack: error.stack });
      this.isInitialized = false;
      this.initError = error.message;
      
      // Create mock queue for development mode
      if (config.env === 'development') {
        this._setupMockQueue();
        logger.info(`Queue "${name}" initialized in mock mode (development)`);
      }
    }
  }
  
  /**
   * Get Bull module, handling potential import errors
   * @private
   */
  _getBullModule() {
    try {
      // Try to require Bull
      return require('bull');
    } catch (error) {
      logger.error(`Failed to load Bull module: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Set up mock queue for development mode
   * @private
   */
  _setupMockQueue() {
    this.mockMode = true;
    this.isInitialized = true;
    this.mockJobs = new Map();
    
    // Create mock queue object with same interface
    this.queue = {
      add: (jobName, data, options = {}) => {
        logger.debug(`MOCK QUEUE: Adding job "${jobName}" to queue "${this.name}"`, { data });
        const jobId = Date.now() + Math.random().toString(36).substring(2, 10);
        const job = { id: jobId, data, options, status: 'waiting' };
        this.mockJobs.set(jobId, job);
        
        // Auto-process job if not delayed
        if (!options.delay && !options.repeat) {
          setTimeout(() => {
            this._processJob(jobName, job);
          }, 100);
        }
        
        return Promise.resolve({ id: jobId });
      },
      
      process: (jobName, processor) => {
        this[`process_${jobName}`] = processor;
        logger.debug(`MOCK QUEUE: Registered processor for "${jobName}" in queue "${this.name}"`);
      },
      
      getWaitingCount: () => Promise.resolve(0),
      getActiveCount: () => Promise.resolve(0),
      getCompletedCount: () => Promise.resolve(0),
      getFailedCount: () => Promise.resolve(0),
      getDelayedCount: () => Promise.resolve(0)
    };
  }
  
  /**
   * Process a mock job
   * @private
   */
  _processJob(jobName, job) {
    if (this[`process_${jobName}`]) {
      job.status = 'active';
      
      Promise.resolve().then(async () => {
        try {
          const result = await this[`process_${jobName}`](job);
          job.status = 'completed';
          job.result = result;
          logger.debug(`MOCK QUEUE: Job "${jobName}" (${job.id}) completed in queue "${this.name}"`, { result });
        } catch (error) {
          job.status = 'failed';
          job.error = error.message;
          logger.debug(`MOCK QUEUE: Job "${jobName}" (${job.id}) failed in queue "${this.name}"`, { error: error.message });
        }
      });
    } else {
      logger.warn(`MOCK QUEUE: No processor found for job "${jobName}" in queue "${this.name}"`);
    }
  }
  
  /**
   * Add a job to the queue
   * @param {string} jobName - Job name
   * @param {Object} data - Job data
   * @param {Object} options - Job options
   * @returns {Promise<Job>} Created job
   */
  async add(jobName, data, options = {}) {
    if (!this.isInitialized) {
      logger.warn(`Queue "${this.name}" is not initialized, job "${jobName}" not added`);
      return Promise.resolve({ id: null, queued: false });
    }
    
    return this.queue.add(jobName, data, options);
  }
  
  /**
   * Register a processor for a job
   * @param {string} jobName - Job name
   * @param {Function} processor - Job processor function
   */
  process(jobName, processor) {
    if (!this.isInitialized) {
      logger.warn(`Queue "${this.name}" is not initialized, processor for "${jobName}" not registered`);
      return;
    }
    
    this.queue.process(jobName, processor);
  }
  
  /**
   * Get queue metrics
   * @returns {Promise<Object>} Queue metrics
   */
  async getMetrics() {
    if (!this.isInitialized) {
      return {
        queue: this.name,
        initialized: false,
        error: this.initError || 'Queue not initialized'
      };
    }
    
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.queue.getWaitingCount(),
        this.queue.getActiveCount(),
        this.queue.getCompletedCount(),
        this.queue.getFailedCount(),
        this.queue.getDelayedCount()
      ]);
      
      return {
        queue: this.name,
        initialized: true,
        mockMode: this.mockMode || false,
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed
      };
    } catch (error) {
      logger.error(`Failed to get metrics for queue "${this.name}": ${error.message}`);
      return {
        queue: this.name,
        initialized: true,
        error: error.message
      };
    }
  }
  
  /**
   * Set up default processors for known job types
   * @private
   */
  _setupDefaultProcessors() {
    if (!this.isInitialized) return;
    
    // Process push notifications
    if (this.name === 'pushNotifications') {
      this.process('sendPushNotification', async (job) => {
        try {
          const { userId, notificationId, title, message, type, deviceTokens, metadata } = job.data;
          
          if (!deviceTokens || deviceTokens.length === 0) {
            logger.warn(`No device tokens for user ${userId}, skipping push notification`);
            
            // Update notification status if possible
            try {
              const db = require('../models');
              await db.Notification.update(
                { pushStatus: 'not_applicable' },
                { where: { id: notificationId } }
              );
            } catch (dbError) {
              logger.error(`Failed to update notification status: ${dbError.message}`);
            }
            
            return { success: false, reason: 'No device tokens' };
          }
          
          // Mock result for development mode if real Firebase is not available
          if (this.mockMode) {
            logger.info(`MOCK PUSH: Sending to ${deviceTokens.length} devices: "${title}" - "${message}"`);
            
            // Simulate update to notification status
            try {
              const db = require('../models');
              await db.Notification.update(
                { pushStatus: 'sent' },
                { where: { id: notificationId } }
              );
            } catch (dbError) {
              logger.error(`Failed to update notification status: ${dbError.message}`);
            }
            
            return {
              success: true,
              mockMessage: `Push notification would be sent to ${deviceTokens.length} devices`,
              successCount: deviceTokens.length,
              failureCount: 0
            };
          }
          
          // Send push notification via Firebase
          const firebase = require('./firebase.util');
          if (!firebase.isInitialized()) {
            logger.error(`Firebase is not initialized, cannot send push notification`);
            
            // Update notification status if possible
            try {
              const db = require('../models');
              await db.Notification.update(
                { pushStatus: 'failed' },
                { where: { id: notificationId } }
              );
            } catch (dbError) {
              logger.error(`Failed to update notification status: ${dbError.message}`);
            }
            
            return { success: false, reason: 'Firebase not initialized' };
          }
          
          // Map notification types to Firebase notification icon
          const iconMap = {
            'info': 'info',
            'success': 'check_circle',
            'warning': 'warning',
            'error': 'error'
          };
          
          // Create notification payload
          const payload = {
            notification: {
              title,
              body: message,
              icon: iconMap[type] || 'notifications',
              clickAction: `${config.frontendUrl}/notifications`,
              badge: '1'
            },
            data: {
              notificationId: notificationId.toString(),
              type,
              timestamp: new Date().toISOString(),
              ...metadata
            }
          };
          
          // Send to all tokens
          const tokens = deviceTokens.map(dt => dt.token);
          const response = await firebase.messaging().sendMulticast({
            tokens,
            ...payload
          });
          
          logger.info(`Push notification sent to ${response.successCount} devices, failed: ${response.failureCount}`);
          
          // Update notification status based on result
          try {
            const db = require('../models');
            await db.Notification.update(
              { pushStatus: response.successCount > 0 ? 'sent' : 'failed' },
              { where: { id: notificationId } }
            );
            
            // Update device token last used timestamp if successful
            if (response.successCount > 0) {
              await db.DeviceToken.update(
                { lastUsed: new Date() },
                { where: { token: { [db.Sequelize.Op.in]: tokens } } }
              );
            }
          } catch (dbError) {
            logger.error(`Failed to update after push notification: ${dbError.message}`);
          }
          
          // Handle failures - we may need to clean up invalid tokens
          if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                failedTokens.push({
                  token: tokens[idx],
                  error: resp.error.code
                });
                
                // Log the failure
                logger.warn(`Failed to send to token: ${tokens[idx].substring(0, 10)}..., error: ${resp.error.code}`);
                
                // If token is invalid or unregistered, mark as inactive
                if (resp.error.code === 'messaging/invalid-registration-token' || 
                    resp.error.code === 'messaging/registration-token-not-registered') {
                  try {
                    const db = require('../models');
                    db.DeviceToken.update(
                      { active: false },
                      { where: { token: tokens[idx] } }
                    ).catch(err => logger.error(`Failed to deactivate token: ${err.message}`));
                  } catch (deactivateError) {
                    logger.error(`Failed to deactivate invalid token: ${deactivateError.message}`);
                  }
                }
              }
            });
          }
          
          return {
            success: response.successCount > 0,
            successCount: response.successCount,
            failureCount: response.failureCount
          };
        } catch (error) {
          logger.error(`Push notification job error: ${error.message}`, { error });
          
          // Update notification status to failed
          try {
            const db = require('../models');
            await db.Notification.update(
              { pushStatus: 'failed' },
              { where: { id: job.data.notificationId } }
            );
          } catch (updateError) {
            logger.error(`Failed to update notification status: ${updateError.message}`);
          }
          
          throw error;
        }
      });
    }
  }
}

module.exports = Queue;