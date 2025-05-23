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
  
  logger.info('Queue "pushNotifications" initialized');
  logger.info('Queue "smsMessages" initialized');
  logger.info('Queue "scheduledMessages" initialized');
  logger.info('Queue "systemMaintenance" initialized');
} catch (error) {
  logger.error(`Failed to initialize queues: ${error.message}`, { stack: error.stack });
}

// Store worker references for graceful shutdown
let monitoringWorker = null;
let backupScheduler = null;
let scheduledMessageInterval = null;

/**
 * Initialize all worker processes
 */
const initializeWorkers = () => {
  logger.info('Initializing background workers...');
  
  try {
    // Initialize Firebase for push notifications if enabled
    if (config.notifications?.pushEnabled) {
      try {
        const firebaseInitialized = firebase.initialize();
        if (!firebaseInitialized && config.env === 'production') {
          logger.warn('Firebase initialization failed in production - push notifications will not work');
        }
      } catch (firebaseError) {
        logger.error(`Firebase initialization error: ${firebaseError.message}`);
        if (config.env === 'development') {
          logger.info('Development mode: Using mock Firebase implementation');
        }
      }
    }
    
    // Make sure queues are initialized
    if (!pushQueue || !smsQueue || !scheduledQueue || !maintenanceQueue) {
      logger.warn('One or more queues failed to initialize - some background tasks will not work');
      
      // Try to re-initialize
      try {
        if (!pushQueue) {
          pushQueue = new Queue('pushNotifications');
          logger.info('Queue "pushNotifications" re-initialized');
        }
        if (!smsQueue) {
          smsQueue = new Queue('smsMessages');
          logger.info('Queue "smsMessages" re-initialized');
        }
        if (!scheduledQueue) {
          scheduledQueue = new Queue('scheduledMessages');
          logger.info('Queue "scheduledMessages" re-initialized');
        }
        if (!maintenanceQueue) {
          maintenanceQueue = new Queue('systemMaintenance');
          logger.info('Queue "systemMaintenance" re-initialized');
        }
      } catch (queueError) {
        logger.error(`Failed to re-initialize queues: ${queueError.message}`);
      }
    }
    
    // Set up maintenance tasks if queue is available
    if (maintenanceQueue && maintenanceQueue.isInitialized) {
      setupMaintenanceTasks();
    } else {
      logger.warn('Maintenance queue not available, some maintenance tasks will not run');
    }
    
    // Set up scheduled message processor if queue is available
    if (scheduledQueue && scheduledQueue.isInitialized) {
      setupScheduledMessageProcessor();
    } else {
      logger.warn('Scheduled queue not available, using fallback processor');
      setupFallbackScheduledProcessor();
    }
    
    // Initialize system monitoring worker
    if (config.monitoring?.enabled) {
      try {
        logger.info('Initializing system monitoring worker');
        monitoringWorker = initMonitoringWorker();
      } catch (monitoringError) {
        logger.error(`Failed to initialize monitoring worker: ${monitoringError.message}`);
      }
    }
    
    // Initialize database backup scheduler
    if (config.backup?.enabled !== false) {
      try {
        logger.info('Initializing database backup scheduler');
        backupScheduler = scheduleBackups();
      } catch (backupError) {
        logger.error(`Failed to initialize backup scheduler: ${backupError.message}`);
      }
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
      removeOnComplete: 5,
      removeOnFail: 10
    });
    
    // Process cleanup job
    maintenanceQueue.process('cleanupOldNotifications', async (job) => {
      logger.info('Running old notification cleanup job');
      try {
        // Check if notification service is available
        if (!notificationService || !notificationService.cleanupOldNotifications) {
          logger.warn('Notification service not available for cleanup');
          return { success: false, reason: 'Service not available' };
        }
        
        const result = await notificationService.cleanupOldNotifications();
        logger.info(`Cleaned up ${result.deletedCount || 0} old notifications`);
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
        removeOnComplete: 3,
        removeOnFail: 5
      });
      
      // Process database backup job
      maintenanceQueue.process('databaseBackup', async (job) => {
        logger.info('Running scheduled database backup job');
        try {
          const result = await backupDatabase(false);
          if (result.status === 'success') {
            logger.info(`Database backup completed: ${result.filePath}`);
          } else {
            logger.error(`Database backup failed: ${result.error}`);
            throw new Error(result.error);
          }
          return result;
        } catch (error) {
          logger.error(`Database backup error: ${error.message}`);
          throw error; // Let Bull handle retries
        }
      });
    }
    
    // Set up system health check job
    maintenanceQueue.queue.add('systemHealthCheck', {}, {
      repeat: {
        cron: '*/15 * * * *', // Run every 15 minutes
      },
      removeOnComplete: 10,
      removeOnFail: 5
    });
    
    // Process system health check job
    maintenanceQueue.process('systemHealthCheck', async (job) => {
      logger.debug('Running system health check job');
      try {
        const healthData = {
          timestamp: new Date(),
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          cpu: process.cpuUsage()
        };
        
        // Log health data if memory usage is high
        const memoryUsageMB = healthData.memory.heapUsed / 1024 / 1024;
        if (memoryUsageMB > 500) { // Alert if using more than 500MB
          logger.warn(`High memory usage detected: ${memoryUsageMB.toFixed(2)}MB`);
        }
        
        return healthData;
      } catch (error) {
        logger.error(`System health check error: ${error.message}`);
        return { error: error.message };
      }
    });
    
    logger.info('Maintenance tasks scheduled successfully');
  } catch (error) {
    logger.error(`Failed to set up maintenance tasks: ${error.message}`);
  }
};

/**
 * Set up scheduled message processor using queue
 */
const setupScheduledMessageProcessor = () => {
  try {
    // Set up recurring job to process scheduled messages
    scheduledQueue.queue.add('processScheduledMessages', {}, {
      repeat: {
        every: 60 * 1000, // Run every minute
      },
      removeOnComplete: 5,
      removeOnFail: 10
    });
    
    // Process scheduled messages job
    scheduledQueue.process('processScheduledMessages', async (job) => {
      logger.debug('Running scheduled message processor job');
      try {
        // Check if SMS service is available
        if (!smsService || !smsService.processScheduledMessages) {
          logger.debug('SMS service not available for scheduled message processing');
          return { processed: 0, success: 0, failed: 0 };
        }
        
        const result = await smsService.processScheduledMessages();
        
        if (result.processed > 0) {
          logger.info(`Processed ${result.processed} scheduled messages. Success: ${result.success}, Failed: ${result.failed}`);
        } else {
          logger.debug('No scheduled messages to process');
        }
        
        return result;
      } catch (error) {
        logger.error(`Scheduled message processor error: ${error.message}`);
        // Don't throw here to prevent constant retries for systemic issues
        return { processed: 0, success: 0, failed: 0, error: error.message };
      }
    });
    
    logger.info('Scheduled message processor initialized successfully');
  } catch (error) {
    logger.error(`Failed to set up scheduled message processor: ${error.message}`);
  }
};

/**
 * Set up fallback scheduled message processor using interval
 */
const setupFallbackScheduledProcessor = () => {
  logger.info('Setting up fallback scheduled message processor');
  
  const processScheduledMessages = async () => {
    try {
      if (!smsService || !smsService.processScheduledMessages) {
        return;
      }
      
      const result = await smsService.processScheduledMessages();
      
      if (result.processed > 0) {
        logger.info(`Processed ${result.processed} scheduled messages. Success: ${result.success}, Failed: ${result.failed}`);
      }
    } catch (error) {
      logger.error(`Fallback scheduled message processor error: ${error.message}`);
    }
  };
  
  // Initial run after a short delay
  setTimeout(processScheduledMessages, 5000);
  
  // Set up regular interval
  scheduledMessageInterval = setInterval(processScheduledMessages, 60000); // Every minute
  
  logger.info('Fallback scheduled message processor initialized');
};

/**
 * Start the scheduled message processor
 * @param {number} interval - Processing interval in milliseconds (default: 1 minute)
 */
const startScheduledMessageProcessor = (interval = 60000) => {
  logger.info(`Starting scheduled message processor with ${interval}ms interval`);
  
  // If queue is available, use it
  if (scheduledQueue && scheduledQueue.isInitialized) {
    setupScheduledMessageProcessor();
    return;
  }
  
  // Otherwise use fallback interval-based approach
  const processScheduledMessages = async () => {
    try {
      if (!smsService || !smsService.processScheduledMessages) {
        logger.debug('SMS service not available for scheduled message processing');
        return;
      }
      
      const result = await smsService.processScheduledMessages();
      
      if (result.processed > 0) {
        logger.info(`Processed ${result.processed} scheduled messages. Success: ${result.success}, Failed: ${result.failed}`);
      }
    } catch (error) {
      logger.error(`Error processing scheduled messages: ${error.message}`);
    }
  };
  
  // Initial run after a short delay
  setTimeout(processScheduledMessages, 5000);
  
  // Set up regular interval
  if (scheduledMessageInterval) {
    clearInterval(scheduledMessageInterval);
  }
  scheduledMessageInterval = setInterval(processScheduledMessages, interval);
  
  logger.info('Scheduled message processor started successfully');
};

/**
 * Get worker status and metrics
 * @returns {Promise<Object>} Worker status information
 */
const getWorkerStatus = async () => {
  const status = {
    timestamp: new Date().toISOString(),
    queues: {
      pushNotifications: null,
      smsMessages: null,
      scheduledMessages: null,
      systemMaintenance: null
    },
    workers: {
      monitoring: monitoringWorker ? 'running' : 'stopped',
      backup: backupScheduler ? 'scheduled' : 'not_scheduled',
      scheduledProcessor: scheduledMessageInterval ? 'running' : 'stopped'
    },
    services: {
      firebase: firebase.isInitialized ? firebase.isInitialized() : false,
      smsService: !!(smsService && smsService.processScheduledMessages),
      notificationService: !!(notificationService && notificationService.cleanupOldNotifications)
    }
  };
  
  // Get queue metrics
  const queues = [
    { name: 'pushNotifications', instance: pushQueue },
    { name: 'smsMessages', instance: smsQueue },
    { name: 'scheduledMessages', instance: scheduledQueue },
    { name: 'systemMaintenance', instance: maintenanceQueue }
  ];
  
  for (const { name, instance } of queues) {
    try {
      if (instance && instance.isInitialized) {
        status.queues[name] = await instance.getMetrics();
      } else {
        status.queues[name] = {
          initialized: false,
          error: 'Queue not initialized'
        };
      }
    } catch (error) {
      status.queues[name] = {
        initialized: false,
        error: error.message
      };
    }
  }
  
  return status;
};

/**
 * Health check for all workers
 * @returns {Promise<Object>} Health check results
 */
const healthCheck = async () => {
  try {
    const status = await getWorkerStatus();
    const issues = [];
    
    // Check queue health
    for (const [queueName, queueStatus] of Object.entries(status.queues)) {
      if (!queueStatus || !queueStatus.initialized) {
        issues.push(`Queue ${queueName} is not initialized`);
      }
    }
    
    // Check critical services
    if (!status.services.smsService) {
      issues.push('SMS service is not available');
    }
    
    if (config.notifications?.pushEnabled && !status.services.firebase) {
      issues.push('Firebase service is not available (push notifications disabled)');
    }
    
    return {
      status: issues.length === 0 ? 'healthy' : 'degraded',
      issues,
      timestamp: new Date().toISOString(),
      details: status
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Restart a specific worker or queue
 * @param {string} workerName - Name of the worker to restart
 * @returns {Promise<boolean>} Success status
 */
const restartWorker = async (workerName) => {
  try {
    logger.info(`Restarting worker: ${workerName}`);
    
    switch (workerName) {
      case 'scheduledProcessor':
        if (scheduledMessageInterval) {
          clearInterval(scheduledMessageInterval);
          scheduledMessageInterval = null;
        }
        startScheduledMessageProcessor();
        break;
        
      case 'pushQueue':
        if (pushQueue) {
          await pushQueue.queue.close();
        }
        pushQueue = new Queue('pushNotifications');
        logger.info('Push notifications queue restarted');
        break;
        
      case 'smsQueue':
        if (smsQueue) {
          await smsQueue.queue.close();
        }
        smsQueue = new Queue('smsMessages');
        logger.info('SMS messages queue restarted');
        break;
        
      case 'scheduledQueue':
        if (scheduledQueue) {
          await scheduledQueue.queue.close();
        }
        scheduledQueue = new Queue('scheduledMessages');
        setupScheduledMessageProcessor();
        logger.info('Scheduled messages queue restarted');
        break;
        
      case 'maintenanceQueue':
        if (maintenanceQueue) {
          await maintenanceQueue.queue.close();
        }
        maintenanceQueue = new Queue('systemMaintenance');
        setupMaintenanceTasks();
        logger.info('System maintenance queue restarted');
        break;
        
      default:
        logger.warn(`Unknown worker name: ${workerName}`);
        return false;
    }
    
    logger.info(`Worker ${workerName} restarted successfully`);
    return true;
  } catch (error) {
    logger.error(`Failed to restart worker ${workerName}: ${error.message}`);
    return false;
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
  
  // Stop scheduled message processor interval
  if (scheduledMessageInterval) {
    try {
      clearInterval(scheduledMessageInterval);
      scheduledMessageInterval = null;
      logger.info('Scheduled message processor interval stopped');
    } catch (error) {
      logger.error('Error stopping scheduled message processor:', error);
    }
  }
  
  // Close queues
  const queuesToClose = [
    { name: 'pushNotifications', instance: pushQueue },
    { name: 'smsMessages', instance: smsQueue },
    { name: 'scheduledMessages', instance: scheduledQueue },
    { name: 'systemMaintenance', instance: maintenanceQueue }
  ];
  
  for (const { name, instance } of queuesToClose) {
    try {
      if (instance && instance.queue && instance.queue.close) {
        await instance.queue.close();
        logger.info(`Closed ${name} queue`);
      }
    } catch (error) {
      logger.error(`Error closing queue ${name}:`, error);
    }
  }
  
  // Reset queue references
  pushQueue = null;
  smsQueue = null;
  scheduledQueue = null;
  maintenanceQueue = null;
  
  logger.info('All workers shut down successfully');
};

/**
 * Emergency shutdown for critical errors
 * @returns {Promise<void>}
 */
const emergencyShutdown = async () => {
  logger.warn('Emergency shutdown initiated');
  
  try {
    // Force close all queues without waiting
    const forceClosePromises = [];
    
    if (pushQueue && pushQueue.queue) {
      forceClosePromises.push(pushQueue.queue.close());
    }
    if (smsQueue && smsQueue.queue) {
      forceClosePromises.push(smsQueue.queue.close());
    }
    if (scheduledQueue && scheduledQueue.queue) {
      forceClosePromises.push(scheduledQueue.queue.close());
    }
    if (maintenanceQueue && maintenanceQueue.queue) {
      forceClosePromises.push(maintenanceQueue.queue.close());
    }
    
    // Wait for all queues to close with timeout
    await Promise.race([
      Promise.all(forceClosePromises),
      new Promise(resolve => setTimeout(resolve, 5000)) // 5 second timeout
    ]);
    
    // Clear intervals
    if (scheduledMessageInterval) {
      clearInterval(scheduledMessageInterval);
    }
    
    // Stop monitoring worker
    if (monitoringWorker && monitoringWorker.stop) {
      monitoringWorker.stop();
    }
    
    // Cancel backup scheduler
    if (backupScheduler) {
      backupScheduler();
    }
    
    logger.info('Emergency shutdown completed');
  } catch (error) {
    logger.error('Error during emergency shutdown:', error);
  }
};

module.exports = {
  initializeWorkers,
  startScheduledMessageProcessor,
  getWorkerStatus,
  healthCheck,
  restartWorker,
  shutdown,
  emergencyShutdown,
  // Export queue instances for direct access if needed
  get pushQueue() { return pushQueue; },
  get smsQueue() { return smsQueue; },
  get scheduledQueue() { return scheduledQueue; },
  get maintenanceQueue() { return maintenanceQueue; }
};