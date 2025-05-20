// backend/src/workers/index.js
const logger = require('../config/logger');
const Queue = require('../utils/queue.util');
const smsService = require('../services/sms.service');
const notificationService = require('../services/notification.service');
const firebase = require('../utils/firebase.util');
const config = require('../config/config');
const { initMonitoringWorker, stopMonitoringWorker } = require('./monitoring.worker');
const { backupDatabase, scheduleBackups } = require('../utils/backup.util');

// Queues (initialize with error handling)
let pushQueue, smsQueue, scheduledQueue, maintenanceQueue;

try {
  pushQueue = new Queue('pushNotifications');
  smsQueue = new Queue('smsMessages');
  scheduledQueue = new Queue('scheduledMessages');
  maintenanceQueue = new Queue('systemMaintenance');
} catch (error) {
  logger.error(`Failed to initialize queues: ${error.message}`, { stack: error.stack });
}

// Store worker references for graceful shutdown
let monitoringWorker = null;
let backupScheduler = null;

/**
 * Initialize all worker processes
 */
const initializeWorkers = () => {
  logger.info('Initializing background workers...');
  
  try {
    // Initialize Firebase for push notifications if enabled
    if (config.notifications?.pushEnabled) {
      const firebaseInitialized = firebase.initialize();
      if (!firebaseInitialized && config.env === 'production') {
        logger.warn('Firebase initialization failed in production - push notifications will not work');
      }
    }
    
    // Make sure queues are initialized
    if (!pushQueue || !smsQueue || !scheduledQueue || !maintenanceQueue) {
      logger.warn('One or more queues failed to initialize - some background tasks will not work');
      
      // Try to re-initialize
      try {
        if (!pushQueue) pushQueue = new Queue('pushNotifications');
        if (!smsQueue) smsQueue = new Queue('smsMessages');
        if (!scheduledQueue) scheduledQueue = new Queue('scheduledMessages');
        if (!maintenanceQueue) maintenanceQueue = new Queue('systemMaintenance');
      } catch (queueError) {
        logger.error(`Failed to re-initialize queues: ${queueError.message}`);
      }
    }
    
    // Set up maintenance tasks if queue is available
    if (maintenanceQueue) {
      setupMaintenanceTasks();
    }
    
    // Set up scheduled message processor if queue is available
    if (scheduledQueue) {
      setupScheduledMessageProcessor();
    }
    
    // Initialize system monitoring worker
    if (config.monitoring?.enabled) {
      logger.info('Initializing system monitoring worker');
      monitoringWorker = initMonitoringWorker();
    }
    
    // Initialize database backup scheduler
    if (config.backup?.enabled !== false) {
      logger.info('Initializing database backup scheduler');
      backupScheduler = scheduleBackups();
    }
    
    logger.info('Background workers initialized successfully');
  } catch (error) {
    logger.error(`Worker initialization error: ${error.message}`, { stack: error.stack });
    logger.warn('Continuing without some background workers');
  }
};

/**
 * Set up maintenance tasks
 */
const setupMaintenanceTasks = () => {
  try {
    // Set up recurring job to clean up old notifications
    maintenanceQueue.queue.add('cleanupOldNotifications', {}, {
      repeat: {
        cron: '0 2 * * *', // Run at 2 AM every day
      },
      removeOnComplete: true
    });
    
    // Process cleanup job
    maintenanceQueue.process('cleanupOldNotifications', async (job) => {
      logger.info('Running old notification cleanup job');
      try {
        const result = await notificationService.cleanupOldNotifications();
        return result;
      } catch (error) {
        logger.error(`Notification cleanup error: ${error.message}`);
        throw error; // Let Bull handle retries
      }
    });
    
    // Set up database backup job
    if (config.backup?.enabled !== false) {
      maintenanceQueue.queue.add('databaseBackup', {}, {
        repeat: {
          cron: config.backup?.cronSchedule || '0 1 * * *', // Run at 1 AM every day by default
        },
        removeOnComplete: true
      });
      
      // Process database backup job
      maintenanceQueue.process('databaseBackup', async (job) => {
        logger.info('Running scheduled database backup job');
        try {
          const result = await backupDatabase(false);
          return result;
        } catch (error) {
          logger.error(`Database backup error: ${error.message}`);
          throw error; // Let Bull handle retries
        }
      });
    }
    
    logger.info('Maintenance tasks scheduled successfully');
  } catch (error) {
    logger.error(`Failed to set up maintenance tasks: ${error.message}`);
  }
};

/**
 * Set up scheduled message processor
 */
const setupScheduledMessageProcessor = () => {
  try {
    // Set up recurring job to process scheduled messages
    scheduledQueue.queue.add('processScheduledMessages', {}, {
      repeat: {
        every: 60 * 1000, // Run every minute
      },
      removeOnComplete: true
    });
    
    // Process scheduled messages job
    scheduledQueue.process('processScheduledMessages', async (job) => {
      logger.debug('Running scheduled message processor job');
      try {
        const result = await smsService.processScheduledMessages();
        return result;
      } catch (error) {
        logger.error(`Scheduled message processor error: ${error.message}`);
        throw error; // Let Bull handle retries
      }
    });
    
    logger.info('Scheduled message processor initialized successfully');
  } catch (error) {
    logger.error(`Failed to set up scheduled message processor: ${error.message}`);
  }
};

/**
 * Start the scheduled message processor
 * @param {number} interval - Processing interval in milliseconds (default: 1 minute)
 */
const startScheduledMessageProcessor = (interval = 60000) => {
  logger.info(`Starting scheduled message processor with ${interval}ms interval`);
  
  // Initial run after a short delay
  setTimeout(async () => {
    try {
      await smsService.processScheduledMessages();
    } catch (error) {
      logger.error(`Error in initial scheduled message processing: ${error.message}`);
    }
  }, 5000);
  
  // Using queue for regular processing instead of setInterval
  if (scheduledQueue) {
    setupScheduledMessageProcessor();
  } else {
    // Fallback to traditional interval if queue failed
    logger.warn('Queue system unavailable, using fallback interval for scheduled messages');
    setInterval(async () => {
      try {
        await smsService.processScheduledMessages();
      } catch (error) {
        logger.error(`Error processing scheduled messages: ${error.message}`);
      }
    }, interval);
  }
};

/**
 * Shutdown all workers gracefully
 * @returns {Promise<void>}
 */
const shutdown = async () => {
  logger.info('Shutting down workers gracefully');
  
  // Stop monitoring worker
  if (monitoringWorker && monitoringWorker.stop) {
    try {
      monitoringWorker.stop();
      logger.info('Monitoring worker stopped');
    } catch (error) {
      logger.error('Error stopping monitoring worker:', error);
    }
  }
  
  // Cancel backup scheduler
  if (backupScheduler) {
    try {
      backupScheduler();
      logger.info('Backup scheduler stopped');
    } catch (error) {
      logger.error('Error stopping backup scheduler:', error);
    }
  }
  
  // Close queues
  const queuesToClose = [pushQueue, smsQueue, scheduledQueue, maintenanceQueue].filter(Boolean);
  
  for (const queue of queuesToClose) {
    try {
      if (queue.queue && queue.queue.close) {
        await queue.queue.close();
        logger.info(`Closed ${queue.queue.name} queue`);
      }
    } catch (error) {
      logger.error(`Error closing queue ${queue?.queue?.name}:`, error);
    }
  }
  
  logger.info('All workers shut down successfully');
};

module.exports = {
  initializeWorkers,
  startScheduledMessageProcessor,
  pushQueue,
  smsQueue,
  scheduledQueue,
  maintenanceQueue,
  shutdown
};