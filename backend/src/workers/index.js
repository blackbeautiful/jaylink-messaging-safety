// backend/src/workers/index.js - Fixed worker initialization
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
let scheduledProcessorInterval = null;

/**
 * Initialize all worker processes
 */
const initializeWorkers = (options = {}) => {
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
    
    // DISABLED: Set up scheduled message processor until database is fixed
    if (!options.limitedMode) {
      logger.info('🔧 Scheduled message processor disabled until database issues are resolved');
      // setupScheduledMessageProcessor();
    } else {
      logger.info('🔧 Running in limited mode - scheduled message processor disabled');
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
    
    logger.info('Background workers initialized successfully (scheduled messages disabled)');
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
 * Set up scheduled message processor - TEMPORARILY DISABLED
 */
const setupScheduledMessageProcessor = () => {
  logger.warn('⚠️  Scheduled message processor is temporarily disabled due to database issues');
  logger.warn('⚠️  Enable it after fixing the scheduled_messages table');
  
  // Commented out until database is fixed
  /*
  try {
    // Use both queue-based and interval-based processing for reliability
    
    // Queue-based processing (primary)
    if (scheduledQueue) {
      // Set up recurring job to process scheduled messages
      scheduledQueue.queue.add('processScheduledMessages', {}, {
        repeat: {
          every: 30 * 1000, // Run every 30 seconds
        },
        removeOnComplete: 5, // Keep last 5 completed jobs
        removeOnFail: 10,    // Keep last 10 failed jobs
      });
      
      // Process scheduled messages job
      scheduledQueue.process('processScheduledMessages', async (job) => {
        logger.debug('Running scheduled message processor job (queue-based)');
        try {
          const result = await smsService.processScheduledMessages();
          if (result.processed > 0) {
            logger.info(`Queue processor: ${result.processed} messages processed (${result.success} success, ${result.failed} failed)`);
          }
          return result;
        } catch (error) {
          logger.error(`Scheduled message processor error (queue-based): ${error.message}`);
          throw error; // Let Bull handle retries
        }
      });
      
      logger.info('Queue-based scheduled message processor initialized');
    }
    
    // Interval-based processing (fallback)
    const processingInterval = 45 * 1000; // 45 seconds (offset from queue)
    scheduledProcessorInterval = setInterval(async () => {
      try {
        logger.debug('Running scheduled message processor (interval-based)');
        const result = await smsService.processScheduledMessages();
        if (result.processed > 0) {
          logger.info(`Interval processor: ${result.processed} messages processed (${result.success} success, ${result.failed} failed)`);
        }
      } catch (error) {
        logger.error(`Scheduled message processor error (interval-based): ${error.message}`);
      }
    }, processingInterval);
    
    logger.info('Interval-based scheduled message processor initialized');
    
    // Initial run after a short delay
    setTimeout(async () => {
      try {
        logger.info('Running initial scheduled message processing');
        const result = await smsService.processScheduledMessages();
        logger.info(`Initial processing: ${result.processed} messages processed (${result.success} success, ${result.failed} failed)`);
      } catch (error) {
        logger.error(`Error in initial scheduled message processing: ${error.message}`);
      }
    }, 10000); // 10 seconds delay
    
    logger.info('Scheduled message processor initialized successfully');
  } catch (error) {
    logger.error(`Failed to set up scheduled message processor: ${error.message}`);
  }
  */
};

/**
 * Start the scheduled message processor - ENHANCED
 * @param {number} interval - Processing interval in milliseconds (default: 30 seconds)
 */
const startScheduledMessageProcessor = (interval = 30000) => {
  logger.warn('⚠️  Scheduled message processor is disabled until database issues are resolved');
  return;
  
  // Commented out until database is fixed
  /*
  logger.info(`Starting scheduled message processor with ${interval}ms interval`);
  
  // Clear any existing interval
  if (scheduledProcessorInterval) {
    clearInterval(scheduledProcessorInterval);
  }
  
  // Initial run after a short delay
  setTimeout(async () => {
    try {
      logger.info('Running startup scheduled message processing');
      const result = await smsService.processScheduledMessages();
      if (result.processed > 0) {
        logger.info(`Startup processing: ${result.processed} messages processed (${result.success} success, ${result.failed} failed)`);
      }
    } catch (error) {
      logger.error(`Error in startup scheduled message processing: ${error.message}`);
    }
  }, 5000);
  
  // Set up regular processing
  if (scheduledQueue) {
    // Use queue-based processing
    setupScheduledMessageProcessor();
  } else {
    // Fallback to traditional interval if queue failed
    logger.warn('Queue system unavailable, using fallback interval for scheduled messages');
    scheduledProcessorInterval = setInterval(async () => {
      try {
        const result = await smsService.processScheduledMessages();
        if (result.processed > 0) {
          logger.info(`Fallback processor: ${result.processed} messages processed`);
        }
      } catch (error) {
        logger.error(`Error processing scheduled messages: ${error.message}`);
      }
    }, interval);
  }
  */
};

/**
 * Enhanced shutdown function
 */
const shutdown = async () => {
  logger.info('Shutting down workers gracefully');
  
  const shutdownPromises = [];
  
  // Stop scheduled message processor interval
  if (scheduledProcessorInterval) {
    clearInterval(scheduledProcessorInterval);
    scheduledProcessorInterval = null;
    logger.info('Scheduled message processor interval stopped');
  }
  
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
  
  // Close queues gracefully
  const queuesToClose = [
    { queue: pushQueue, name: 'pushNotifications' },
    { queue: smsQueue, name: 'smsMessages' },
    { queue: scheduledQueue, name: 'scheduledMessages' },
    { queue: maintenanceQueue, name: 'systemMaintenance' }
  ].filter(item => item.queue);
  
  for (const { queue, name } of queuesToClose) {
    try {
      if (queue.queue && queue.queue.close) {
        shutdownPromises.push(
          queue.queue.close().then(() => {
            logger.info(`Closed ${name} queue`);
          }).catch(error => {
            logger.error(`Error closing ${name} queue:`, error);
          })
        );
      }
    } catch (error) {
      logger.error(`Error preparing to close ${name} queue:`, error);
    }
  }
  
  // Wait for all shutdown operations to complete (with timeout)
  try {
    await Promise.race([
      Promise.all(shutdownPromises),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Shutdown timeout')), 15000)
      )
    ]);
    logger.info('All workers shut down successfully');
  } catch (error) {
    logger.error('Error during worker shutdown:', error);
    logger.info('Forcing worker shutdown due to timeout or error');
  }
};

/**
 * Health check for workers
 */
const getWorkerHealth = () => {
  const health = {
    scheduledProcessor: {
      queueBased: 'disabled', // scheduledQueue && scheduledQueue.queue ? 'active' : 'inactive',
      intervalBased: 'disabled', // scheduledProcessorInterval ? 'active' : 'inactive',
      status: 'disabled_until_database_fixed'
    },
    queues: {
      pushNotifications: pushQueue && pushQueue.queue ? 'active' : 'inactive',
      smsMessages: smsQueue && smsQueue.queue ? 'active' : 'inactive',
      scheduledMessages: scheduledQueue && scheduledQueue.queue ? 'active' : 'inactive',
      systemMaintenance: maintenanceQueue && maintenanceQueue.queue ? 'active' : 'inactive',
    },
    monitoring: monitoringWorker ? 'active' : 'inactive',
    backup: backupScheduler ? 'active' : 'inactive',
  };
  
  return health;
};

/**
 * Force process scheduled messages (for manual triggers) - DISABLED
 */
const forceProcessScheduledMessages = async () => {
  logger.warn('⚠️  Scheduled message processing is disabled until database issues are resolved');
  return { processed: 0, success: 0, failed: 0, error: 'Disabled until database is fixed' };
  
  // Commented out until database is fixed
  /*
  try {
    logger.info('Manually triggering scheduled message processing');
    const result = await smsService.processScheduledMessages();
    logger.info(`Manual processing completed: ${result.processed} messages processed (${result.success} success, ${result.failed} failed)`);
    return result;
  } catch (error) {
    logger.error(`Manual scheduled message processing error: ${error.message}`);
    throw error;
  }
  */
};

/**
 * Get queue statistics
 */
const getQueueStats = async () => {
  const stats = {};
  
  const queues = [
    { queue: pushQueue, name: 'pushNotifications' },
    { queue: smsQueue, name: 'smsMessages' },
    { queue: scheduledQueue, name: 'scheduledMessages' },
    { queue: maintenanceQueue, name: 'systemMaintenance' }
  ];
  
  for (const { queue, name } of queues) {
    try {
      if (queue && queue.queue) {
        const [waiting, active, completed, failed] = await Promise.all([
          queue.queue.getWaiting(),
          queue.queue.getActive(),
          queue.queue.getCompleted(),
          queue.queue.getFailed()
        ]);
        
        stats[name] = {
          waiting: waiting.length,
          active: active.length,
          completed: completed.length,
          failed: failed.length,
          status: name === 'scheduledMessages' ? 'disabled' : 'healthy'
        };
      } else {
        stats[name] = {
          waiting: 0,
          active: 0,
          completed: 0,
          failed: 0,
          status: name === 'scheduledMessages' ? 'disabled' : 'inactive'
        };
      }
    } catch (error) {
      logger.error(`Error getting stats for ${name} queue:`, error);
      stats[name] = {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        status: 'error',
        error: error.message
      };
    }
  }
  
  return stats;
};

/**
 * Clean up failed jobs in queues
 */
const cleanupFailedJobs = async () => {
  const results = {};
  
  const queues = [
    { queue: pushQueue, name: 'pushNotifications' },
    { queue: smsQueue, name: 'smsMessages' },
    { queue: scheduledQueue, name: 'scheduledMessages' },
    { queue: maintenanceQueue, name: 'systemMaintenance' }
  ];
  
  for (const { queue, name } of queues) {
    try {
      if (queue && queue.queue) {
        const failedJobs = await queue.queue.getFailed();
        
        // Clean up jobs older than 24 hours
        const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
        let cleanedCount = 0;
        
        for (const job of failedJobs) {
          if (job.timestamp < twentyFourHoursAgo) {
            await job.remove();
            cleanedCount++;
          }
        }
        
        results[name] = {
          totalFailed: failedJobs.length,
          cleaned: cleanedCount,
          remaining: failedJobs.length - cleanedCount
        };
        
        if (cleanedCount > 0) {
          logger.info(`Cleaned ${cleanedCount} old failed jobs from ${name} queue`);
        }
      }
    } catch (error) {
      logger.error(`Error cleaning failed jobs from ${name} queue:`, error);
      results[name] = {
        error: error.message
      };
    }
  }
  
  return results;
};

/**
 * Pause/Resume queue processing
 */
const pauseQueue = async (queueName) => {
  const queueMap = {
    pushNotifications: pushQueue,
    smsMessages: smsQueue,
    scheduledMessages: scheduledQueue,
    systemMaintenance: maintenanceQueue
  };
  
  const queue = queueMap[queueName];
  if (queue && queue.queue) {
    await queue.queue.pause();
    logger.info(`Paused ${queueName} queue`);
    return { success: true, message: `${queueName} queue paused` };
  } else {
    throw new Error(`Queue ${queueName} not found or inactive`);
  }
};

const resumeQueue = async (queueName) => {
  const queueMap = {
    pushNotifications: pushQueue,
    smsMessages: smsQueue,
    scheduledMessages: scheduledQueue,
    systemMaintenance: maintenanceQueue
  };
  
  const queue = queueMap[queueName];
  if (queue && queue.queue) {
    await queue.queue.resume();
    logger.info(`Resumed ${queueName} queue`);
    return { success: true, message: `${queueName} queue resumed` };
  } else {
    throw new Error(`Queue ${queueName} not found or inactive`);
  }
};

module.exports = {
  initializeWorkers,
  startScheduledMessageProcessor,
  shutdown,
  
  // Queue references
  pushQueue,
  smsQueue,
  scheduledQueue,
  maintenanceQueue,
  
  // Enhanced functionality
  getWorkerHealth,
  forceProcessScheduledMessages,
  getQueueStats,
  cleanupFailedJobs,
  pauseQueue,
  resumeQueue,
};
