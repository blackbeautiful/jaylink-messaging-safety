// backend/src/workers/monitoring.worker.js
/**
 * JayLink SMS Platform
 * Monitoring background worker
 */

const { collectAndProcessMetrics } = require('../utils/monitoring.util');
const { checkBackupHealth } = require('../utils/backup.util');
const db = require('../models');
const config = require('../config/config');
const logger = require('../config/logger');

// Store references to intervals for cleanup
let monitoringInterval = null;
let backupCheckInterval = null;
let metricsStorageInterval = null;

/**
 * Initialize the monitoring worker
 * @returns {Object} Worker control object
 */
const initMonitoringWorker = () => {
  logger.info('Initializing monitoring worker');
  
  // Only start if monitoring is enabled
  if (!config.monitoring?.enabled) {
    logger.info('Monitoring is disabled in configuration, worker not started');
    return {
      stop: () => {}
    };
  }
  
  try {
    // Start collecting metrics at configured interval
    const metricInterval = config.monitoring?.interval || 60000; // Default: 1 minute
    logger.info(`Starting metrics collection every ${metricInterval}ms`);
    
    monitoringInterval = setInterval(async () => {
      try {
        await collectAndProcessMetrics();
      } catch (error) {
        logger.error('Error collecting metrics in worker:', error);
      }
    }, metricInterval);
    
    // Store metrics in database at a less frequent interval
    if (db.SystemMetric && config.monitoring?.storeMetrics !== false) {
      const storageInterval = config.monitoring?.storageInterval || 900000; // Default: 15 minutes
      logger.info(`Starting metrics storage every ${storageInterval}ms`);
      
      metricsStorageInterval = setInterval(async () => {
        try {
          // Collect metrics
          const metrics = await collectAndProcessMetrics();
          
          // Store in database
          await db.SystemMetric.createFromMetrics(metrics);
          
          // Clean up old metrics
          const retentionDays = config.monitoring?.retentionDays || 30;
          await db.SystemMetric.cleanupOldMetrics(retentionDays);
        } catch (error) {
          logger.error('Error storing metrics in database:', error);
        }
      }, storageInterval);
    }
    
    // Check backup health regularly
    if (config.backup?.enabled !== false) {
      const backupCheckInterval = config.backup?.healthCheckInterval || 3600000; // Default: 1 hour
      logger.info(`Starting backup health checks every ${backupCheckInterval}ms`);
      
      backupCheckInterval = setInterval(async () => {
        try {
          const backupHealth = checkBackupHealth();
          
          // Log warning or error if backup health is not good
          if (backupHealth.status === 'warning') {
            logger.warn(`Backup health warning: ${backupHealth.message}`);
          } else if (backupHealth.status === 'error') {
            logger.error(`Backup health error: ${backupHealth.message}`);
          }
          
          // Store backup health in monitoring system
          storeBackupHealthMetric(backupHealth);
        } catch (error) {
          logger.error('Error checking backup health:', error);
        }
      }, backupCheckInterval);
    }
    
    logger.info('Monitoring worker initialized successfully');
    
    // Return control methods
    return {
      stop: stopMonitoringWorker,
      runNow: async () => {
        logger.info('Running immediate metrics collection');
        try {
          const metrics = await collectAndProcessMetrics();
          return metrics;
        } catch (error) {
          logger.error('Error in immediate metrics collection:', error);
          throw error;
        }
      },
      checkBackupHealth
    };
  } catch (error) {
    logger.error('Error initializing monitoring worker:', error);
    // Clean up any intervals that might have been created
    stopMonitoringWorker();
    
    // Return dummy control object
    return {
      stop: () => {},
      runNow: async () => { throw new Error('Monitoring worker failed to initialize'); }
    };
  }
};

/**
 * Stop the monitoring worker
 */
const stopMonitoringWorker = () => {
  logger.info('Stopping monitoring worker');
  
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
  }
  
  if (backupCheckInterval) {
    clearInterval(backupCheckInterval);
    backupCheckInterval = null;
  }
  
  if (metricsStorageInterval) {
    clearInterval(metricsStorageInterval);
    metricsStorageInterval = null;
  }
  
  logger.info('Monitoring worker stopped');
};

/**
 * Store backup health metric in our monitoring system
 * @param {Object} backupHealth - Backup health status
 */
const storeBackupHealthMetric = async (backupHealth) => {
  try {
    // If we have the custom metrics model, store there
    if (db.CustomMetric) {
      await db.CustomMetric.create({
        name: 'backup_health',
        value: backupHealth.status === 'healthy' ? 1 : 0,
        metadata: JSON.stringify(backupHealth)
      });
    }
    
    // Update system settings with backup health
    if (db.SystemSetting) {
      await db.SystemSetting.upsert({
        key: 'backup.health',
        value: JSON.stringify({
          status: backupHealth.status,
          message: backupHealth.message,
          lastBackupTime: backupHealth.lastBackupFile?.date,
          lastBackupSize: backupHealth.lastBackupFile?.size
        }),
        updatedAt: new Date()
      });
    }
  } catch (error) {
    logger.error('Error storing backup health metric:', error);
  }
};

module.exports = {
  initMonitoringWorker,
  stopMonitoringWorker
};