// backend/src/utils/monitoring.util.js
const os = require('os');
const v8 = require('v8');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const logger = require('../config/logger');
const db = require('../models');

/**
 * Enterprise-grade system health monitoring utility
 * Provides comprehensive system health metrics and alerts
 * @module monitoring-util
 */

// Keep track of previous metrics for trend analysis
let previousMetrics = null;
let alertsTriggered = {};
let monitoringInterval = null;

/**
 * Start the system health monitoring process
 * @param {number} interval - Monitoring interval in milliseconds
 * @returns {Object} Monitoring controller object
 */
const monitorSystemHealth = (interval = 60000) => {
  logger.info(`Starting system health monitoring (interval: ${interval}ms)`);
  
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
  }
  
  // Initial health check
  collectAndProcessMetrics();
  
  // Schedule regular health checks
  monitoringInterval = setInterval(collectAndProcessMetrics, interval);
  
  return {
    interval,
    stop: () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
        monitoringInterval = null;
        logger.info('System health monitoring stopped');
      }
    },
    getLastMetrics: () => previousMetrics,
    runImmediateCheck: collectAndProcessMetrics
  };
};

/**
 * Collect and process system health metrics
 * @returns {Promise<Object>} Collected metrics
 */
const collectAndProcessMetrics = async () => {
  try {
    // Get start time to measure collection duration
    const startTime = process.hrtime();
    
    // Collect metrics from various subsystems
    const metrics = {
      timestamp: new Date(),
      system: collectSystemMetrics(),
      process: collectProcessMetrics(),
      memory: collectMemoryMetrics(),
      disk: await collectDiskMetrics(),
      database: await collectDatabaseMetrics(),
      application: await collectApplicationMetrics()
    };
    
    // Calculate collection duration
    const [seconds, nanoseconds] = process.hrtime(startTime);
    metrics.collection = {
      duration: seconds * 1000 + nanoseconds / 1000000, // in milliseconds
    };
    
    // Calculate trend data if we have previous metrics
    if (previousMetrics) {
      calculateTrends(metrics, previousMetrics);
    }
    
    // Store current metrics for next comparison
    previousMetrics = metrics;
    
    // Check for alerts
    const alerts = checkAlerts(metrics);
    
    // Log health status
    logHealthStatus(metrics, alerts);
    
    // Take action on critical alerts if configured
    if (alerts.length > 0 && config.monitoring?.alertActions) {
      handleAlerts(alerts, metrics);
    }
    
    return metrics;
  } catch (error) {
    logger.error('Error collecting health metrics:', error);
    return null;
  }
};

/**
 * Collect system-level metrics
 * @returns {Object} System metrics
 */
const collectSystemMetrics = () => {
  return {
    uptime: os.uptime(),
    loadAverage: os.loadavg(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
    cpuCount: os.cpus().length,
    cpuModel: os.cpus()[0]?.model || 'Unknown CPU',
    platform: os.platform(),
    arch: os.arch(),
    release: os.release(),
    hostname: os.hostname()
  };
};

/**
 * Collect process-specific metrics
 * @returns {Object} Process metrics
 */
const collectProcessMetrics = () => {
  const memoryUsage = process.memoryUsage();
  const cpuUsage = process.cpuUsage();
  
  return {
    uptime: process.uptime(),
    pid: process.pid,
    memoryUsage: {
      rss: memoryUsage.rss,
      heapTotal: memoryUsage.heapTotal,
      heapUsed: memoryUsage.heapUsed,
      external: memoryUsage.external,
      arrayBuffers: memoryUsage.arrayBuffers || 0
    },
    cpuUsage: {
      user: cpuUsage.user,
      system: cpuUsage.system
    },
    resourceUsage: process.resourceUsage ? process.resourceUsage() : null,
    versions: process.versions,
    nodeEnv: process.env.NODE_ENV
  };
};

/**
 * Collect detailed memory metrics including garbage collection info
 * @returns {Object} Memory metrics
 */
const collectMemoryMetrics = () => {
  const heapStats = v8.getHeapStatistics();
  const heapSpaceStats = v8.getHeapSpaceStatistics();
  
  return {
    heapStatistics: {
      totalHeapSize: heapStats.total_heap_size,
      totalHeapSizeExecutable: heapStats.total_heap_size_executable,
      totalPhysicalSize: heapStats.total_physical_size,
      totalAvailableSize: heapStats.total_available_size,
      usedHeapSize: heapStats.used_heap_size,
      heapSizeLimit: heapStats.heap_size_limit,
      mallocedMemory: heapStats.malloced_memory,
      peakMallocedMemory: heapStats.peak_malloced_memory,
      doesZapGarbage: heapStats.does_zap_garbage
    },
    heapSpaceStatistics: heapSpaceStats.map(space => ({
      spaceName: space.space_name,
      spaceSize: space.space_size,
      spaceUsedSize: space.space_used_size,
      spaceAvailableSize: space.space_available_size,
      physicalSpaceSize: space.physical_space_size
    })),
    memoryUsagePercentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
  };
};

/**
 * Collect disk usage metrics
 * @returns {Promise<Object>} Disk metrics
 */
const collectDiskMetrics = async () => {
  // Define directories to check
  const dirsToCheck = [
    { path: '.', name: 'Application Root' },
    { path: './logs', name: 'Logs Directory' },
    { path: './uploads', name: 'Uploads Directory' }
  ];
  
  try {
    const diskMetrics = {
      volumes: []
    };
    
    // Check if we can use the disk-space module
    let diskSpace;
    try {
      diskSpace = require('diskspace');
    } catch (err) {
      // disk-space module not available, using simpler approach
      return await collectBasicDiskMetrics(dirsToCheck);
    }
    
    // Use disk-space for more detailed metrics
    const checkDiskSpace = () => {
      return new Promise((resolve, reject) => {
        const drive = os.platform() === 'win32' ? 'C:' : '/';
        diskSpace.check(drive, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    };
    
    const diskInfo = await checkDiskSpace();
    
    diskMetrics.volumes.push({
      mount: os.platform() === 'win32' ? 'C:' : '/',
      total: diskInfo.total,
      used: diskInfo.used,
      free: diskInfo.free,
      usedPercentage: Math.round((diskInfo.used / diskInfo.total) * 100)
    });
    
    // Also add directory sizes
    diskMetrics.directories = await collectDirectorySizes(dirsToCheck);
    
    return diskMetrics;
  } catch (error) {
    logger.warn('Error collecting disk metrics, falling back to basic checks:', error);
    return await collectBasicDiskMetrics(dirsToCheck);
  }
};

/**
 * Collect basic disk metrics as a fallback
 * @param {Array} dirsToCheck - Directories to check
 * @returns {Promise<Object>} Basic disk metrics
 */
const collectBasicDiskMetrics = async (dirsToCheck) => {
  try {
    const diskMetrics = {
      directories: await collectDirectorySizes(dirsToCheck)
    };
    
    return diskMetrics;
  } catch (error) {
    logger.error('Error collecting basic disk metrics:', error);
    return { error: error.message };
  }
};

/**
 * Collect directory sizes
 * @param {Array} directories - Directories to check
 * @returns {Promise<Array>} Directory size information
 */
const collectDirectorySizes = async (directories) => {
  const results = [];
  
  for (const dir of directories) {
    try {
      if (fs.existsSync(dir.path)) {
        const stats = await getDirSize(dir.path);
        results.push({
          name: dir.name,
          path: path.resolve(dir.path),
          size: stats.size,
          files: stats.files
        });
      }
    } catch (error) {
      results.push({
        name: dir.name,
        path: path.resolve(dir.path),
        error: error.message
      });
    }
  }
  
  return results;
};

/**
 * Get directory size recursively
 * @param {string} dirPath - Directory path
 * @returns {Promise<Object>} Size information
 */
const getDirSize = (dirPath) => {
  return new Promise((resolve, reject) => {
    let totalSize = 0;
    let totalFiles = 0;
    
    try {
      if (!fs.existsSync(dirPath)) {
        return resolve({ size: 0, files: 0 });
      }
      
      const stats = fs.statSync(dirPath);
      if (!stats.isDirectory()) {
        return resolve({ size: stats.size, files: 1 });
      }
      
      const files = fs.readdirSync(dirPath);
      
      const detailsPromises = files.map(file => {
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          return getDirSize(filePath);
        } else {
          totalSize += stats.size;
          totalFiles += 1;
          return Promise.resolve({ size: stats.size, files: 1 });
        }
      });
      
      Promise.all(detailsPromises)
        .then(details => {
          const result = details.reduce((acc, detail) => {
            return {
              size: acc.size + detail.size,
              files: acc.files + detail.files
            };
          }, { size: 0, files: 0 });
          
          resolve(result);
        })
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Collect database health metrics
 * @returns {Promise<Object>} Database metrics
 */
const collectDatabaseMetrics = async () => {
  try {
    if (!db.sequelize) {
      return { status: 'unavailable', reason: 'No sequelize instance' };
    }
    
    // Start time for measuring query duration
    const startTime = process.hrtime();
    
    // Check database connection
    await db.sequelize.authenticate();
    
    // Get query execution time
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const queryTime = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds
    
    // Fetch basic table stats
    const databaseStats = {
      status: 'connected',
      responseTime: queryTime,
      tables: {}
    };
    
    // Get list of models
    const models = Object.keys(db).filter(key => key !== 'sequelize' && key !== 'Sequelize');
    
    // Collect record counts for important tables
    const countPromises = models.map(async (modelName) => {
      try {
        const model = db[modelName];
        if (model && typeof model.count === 'function') {
          const count = await model.count();
          return { name: modelName, count };
        }
        return null;
      } catch (error) {
        logger.warn(`Error counting records for ${modelName}:`, error);
        return { name: modelName, error: error.message };
      }
    });
    
    const results = (await Promise.all(countPromises)).filter(Boolean);
    
    // Organize table stats
    results.forEach(result => {
      if (result) {
        databaseStats.tables[result.name] = {
          records: result.count,
          error: result.error
        };
      }
    });
    
    // Check for any active transactions if possible
    try {
      const transactions = await db.sequelize.query(
        "SELECT * FROM information_schema.innodb_trx WHERE trx_mysql_thread_id != CONNECTION_ID()",
        { type: db.sequelize.QueryTypes.SELECT }
      );
      
      databaseStats.activeTransactions = transactions.length;
      
      // If there are long-running transactions, include details
      const longRunningTransactions = transactions.filter(trx => {
        const startTime = new Date(trx.trx_started);
        const durationMs = Date.now() - startTime.getTime();
        return durationMs > 30000; // Transactions running longer than 30 seconds
      });
      
      if (longRunningTransactions.length > 0) {
        databaseStats.longRunningTransactions = longRunningTransactions.map(trx => ({
          id: trx.trx_id,
          started: trx.trx_started,
          state: trx.trx_state,
          query: trx.trx_query?.substring(0, 100)
        }));
      }
    } catch (error) {
      logger.debug('Could not fetch transaction information:', error);
      // Not critical, so just log at debug level
    }
    
    return databaseStats;
  } catch (error) {
    logger.warn('Database health check failed:', error);
    return {
      status: 'error',
      error: error.message,
      code: error.original?.code || 'UNKNOWN'
    };
  }
};

/**
 * Collect application-specific metrics
 * @returns {Promise<Object>} Application metrics
 */
const collectApplicationMetrics = async () => {
  try {
    // Application uptime
    const appUptime = process.uptime();
    
    // Basic app metrics
    const appMetrics = {
      uptime: appUptime,
      uptimeFormatted: formatUptime(appUptime),
      environment: process.env.NODE_ENV || 'development',
      startTime: new Date(Date.now() - (appUptime * 1000)).toISOString()
    };
    
    // Active connections if we have access to the server
    if (global.httpServer) {
      appMetrics.connections = {
        active: await getActiveConnections(global.httpServer)
      };
    }
    
    // Queue metrics if we're using a queue system
    if (global.queue) {
      try {
        appMetrics.queue = await getQueueMetrics();
      } catch (queueError) {
        logger.debug('Could not fetch queue metrics:', queueError);
      }
    }
    
    // Recent error count from logs
    try {
      appMetrics.errors = await getRecentErrorCount();
    } catch (logError) {
      logger.debug('Could not analyze error logs:', logError);
    }
    
    // Open file descriptors as a system resource metric
    if (process.platform !== 'win32') {
      try {
        const { stdout } = await execPromise(`lsof -p ${process.pid} | wc -l`);
        appMetrics.openFileDescriptors = parseInt(stdout.trim(), 10);
      } catch (error) {
        logger.debug('Could not get open file descriptor count:', error);
      }
    }
    
    return appMetrics;
  } catch (error) {
    logger.warn('Error collecting application metrics:', error);
    return { error: error.message };
  }
};

/**
 * Get active connections from HTTP server
 * @param {http.Server} server - HTTP server instance
 * @returns {Promise<number>} Number of active connections
 */
const getActiveConnections = (server) => {
  return new Promise((resolve) => {
    if (!server) {
      return resolve(0);
    }
    
    server.getConnections((err, count) => {
      if (err) {
        logger.debug('Error getting connection count:', err);
        resolve(0);
      } else {
        resolve(count);
      }
    });
  });
};

/**
 * Get metrics from queue system
 * @returns {Promise<Object>} Queue metrics
 */
const getQueueMetrics = async () => {
  // This is a placeholder - implement based on your queue system
  // For example, if using Bull:
  if (global.queue && global.queue.getJobCounts) {
    const counts = await global.queue.getJobCounts();
    return counts;
  }
  
  return { status: 'unavailable', reason: 'Queue metrics not implemented' };
};

/**
 * Get recent error count from log files
 * @returns {Promise<Object>} Error metrics
 */
const getRecentErrorCount = async () => {
  const logFile = path.join(process.cwd(), 'logs', 'error.log');
  if (!fs.existsSync(logFile)) {
    return { lastHour: 0, total: 0 };
  }
  
  // Read last 50KB of log file for efficiency
  const stats = fs.statSync(logFile);
  const bufferSize = Math.min(50 * 1024, stats.size);
  const buffer = Buffer.alloc(bufferSize);
  
  const fileDescriptor = fs.openSync(logFile, 'r');
  fs.readSync(fileDescriptor, buffer, 0, bufferSize, stats.size - bufferSize);
  fs.closeSync(fileDescriptor);
  
  const data = buffer.toString();
  const lines = data.split('\n').filter(Boolean);
  
  // Count errors in the last hour
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  let lastHourCount = 0;
  
  lines.forEach(line => {
    try {
      const logEntry = JSON.parse(line);
      const timestamp = new Date(logEntry.timestamp || logEntry.time || 0).getTime();
      
      if (timestamp >= oneHourAgo && (logEntry.level === 'error' || logEntry.level === 'fatal')) {
        lastHourCount++;
      }
    } catch (e) {
      // Skip lines that can't be parsed as JSON
    }
  });
  
  return {
    lastHour: lastHourCount,
    total: lines.filter(line => {
      try {
        const logEntry = JSON.parse(line);
        return logEntry.level === 'error' || logEntry.level === 'fatal';
      } catch (e) {
        return false;
      }
    }).length
  };
};

/**
 * Calculate trends between current and previous metrics
 * @param {Object} current - Current metrics
 * @param {Object} previous - Previous metrics
 */
const calculateTrends = (current, previous) => {
  // Calculate time difference in seconds
  const timeDiff = (current.timestamp - previous.timestamp) / 1000;
  
  if (timeDiff <= 0) return;
  
  current.trends = {
    system: {
      memoryUsage: calculatePercentageChange(
        (previous.system.totalMemory - previous.system.freeMemory) / previous.system.totalMemory,
        (current.system.totalMemory - current.system.freeMemory) / current.system.totalMemory
      )
    },
    process: {
      memory: calculatePercentageChange(
        previous.process.memoryUsage.heapUsed,
        current.process.memoryUsage.heapUsed
      ),
      cpu: {
        user: (current.process.cpuUsage.user - previous.process.cpuUsage.user) / 1000 / timeDiff,
        system: (current.process.cpuUsage.system - previous.process.cpuUsage.system) / 1000 / timeDiff
      }
    }
  };
  
  // Database response time trend if available
  if (current.database?.responseTime && previous.database?.responseTime) {
    current.trends.database = {
      responseTime: calculatePercentageChange(
        previous.database.responseTime,
        current.database.responseTime
      )
    };
  }
};

/**
 * Calculate percentage change between two values
 * @param {number} previous - Previous value
 * @param {number} current - Current value
 * @returns {number} Percentage change
 */
const calculatePercentageChange = (previous, current) => {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
};

/**
 * Check metrics against thresholds for alerts
 * @param {Object} metrics - Current system metrics
 * @returns {Array} Alert objects
 */
const checkAlerts = (metrics) => {
  const alerts = [];
  const thresholds = config.monitoring?.thresholds || getDefaultThresholds();
  
  // Check system memory usage
  const systemMemoryUsed = metrics.system.totalMemory - metrics.system.freeMemory;
  const systemMemoryUsedPercent = (systemMemoryUsed / metrics.system.totalMemory) * 100;
  
  if (systemMemoryUsedPercent > thresholds.system.memory.critical) {
    pushAlert(alerts, 'CRITICAL', 'System memory usage critical', {
      current: systemMemoryUsedPercent,
      threshold: thresholds.system.memory.critical,
      unit: '%'
    });
  } else if (systemMemoryUsedPercent > thresholds.system.memory.warning) {
    pushAlert(alerts, 'WARNING', 'System memory usage high', {
      current: systemMemoryUsedPercent,
      threshold: thresholds.system.memory.warning,
      unit: '%'
    });
  }
  
  // Check process memory usage
  const processMemoryUsedPercent = metrics.memory.memoryUsagePercentage;
  
  if (processMemoryUsedPercent > thresholds.process.memory.critical) {
    pushAlert(alerts, 'CRITICAL', 'Process memory usage critical', {
      current: processMemoryUsedPercent,
      threshold: thresholds.process.memory.critical,
      unit: '%'
    });
  } else if (processMemoryUsedPercent > thresholds.process.memory.warning) {
    pushAlert(alerts, 'WARNING', 'Process memory usage high', {
      current: processMemoryUsedPercent,
      threshold: thresholds.process.memory.warning,
      unit: '%'
    });
  }
  
  // Check CPU load
  const cpuLoad = metrics.system.loadAverage[0] / metrics.system.cpuCount;
  
  if (cpuLoad > thresholds.system.cpu.critical) {
    pushAlert(alerts, 'CRITICAL', 'CPU load critical', {
      current: cpuLoad,
      threshold: thresholds.system.cpu.critical,
      unit: 'load per core'
    });
  } else if (cpuLoad > thresholds.system.cpu.warning) {
    pushAlert(alerts, 'WARNING', 'CPU load high', {
      current: cpuLoad,
      threshold: thresholds.system.cpu.warning,
      unit: 'load per core'
    });
  }
  
  // Check database response time if available
  if (metrics.database?.responseTime) {
    if (metrics.database.responseTime > thresholds.database.responseTime.critical) {
      pushAlert(alerts, 'CRITICAL', 'Database response time critical', {
        current: metrics.database.responseTime,
        threshold: thresholds.database.responseTime.critical,
        unit: 'ms'
      });
    } else if (metrics.database.responseTime > thresholds.database.responseTime.warning) {
      pushAlert(alerts, 'WARNING', 'Database response time high', {
        current: metrics.database.responseTime,
        threshold: thresholds.database.responseTime.warning,
        unit: 'ms'
      });
    }
  }
  
  // Check disk space if available
  if (metrics.disk?.volumes && metrics.disk.volumes.length > 0) {
    metrics.disk.volumes.forEach(volume => {
      const usedPercentage = volume.usedPercentage || 
        ((volume.used / volume.total) * 100);
      
      if (usedPercentage > thresholds.disk.usage.critical) {
        pushAlert(alerts, 'CRITICAL', `Disk usage critical on ${volume.mount}`, {
          current: usedPercentage,
          threshold: thresholds.disk.usage.critical,
          unit: '%'
        });
      } else if (usedPercentage > thresholds.disk.usage.warning) {
        pushAlert(alerts, 'WARNING', `Disk usage high on ${volume.mount}`, {
          current: usedPercentage,
          threshold: thresholds.disk.usage.warning,
          unit: '%'
        });
      }
    });
  }
  
  // Check error rate if available
  if (metrics.application?.errors?.lastHour) {
    if (metrics.application.errors.lastHour > thresholds.application.errors.critical) {
      pushAlert(alerts, 'CRITICAL', 'High error rate in the last hour', {
        current: metrics.application.errors.lastHour,
        threshold: thresholds.application.errors.critical,
        unit: 'errors'
      });
    } else if (metrics.application.errors.lastHour > thresholds.application.errors.warning) {
      pushAlert(alerts, 'WARNING', 'Elevated error rate in the last hour', {
        current: metrics.application.errors.lastHour,
        threshold: thresholds.application.errors.warning,
        unit: 'errors'
      });
    }
  }
  
  // Check process uptime
  if (metrics.process.uptime < thresholds.application.minUptime) {
    pushAlert(alerts, 'WARNING', 'Process recently restarted', {
      current: metrics.process.uptime,
      threshold: thresholds.application.minUptime,
      unit: 'seconds'
    });
  }
  
  return alerts;
};

/**
 * Get default threshold values
 * @returns {Object} Default thresholds
 */
const getDefaultThresholds = () => {
  return {
    system: {
      memory: {
        warning: 80,
        critical: 90
      },
      cpu: {
        warning: 0.8,
        critical: 0.9
      }
    },
    process: {
      memory: {
        warning: 80,
        critical: 90
      }
    },
    disk: {
      usage: {
        warning: 80,
        critical: 90
      }
    },
    database: {
      responseTime: {
        warning: 500,
        critical: 2000
      }
    },
    application: {
      errors: {
        warning: 10,
        critical: 50
      },
      minUptime: 300 // 5 minutes
    }
  };
};

/**
 * Push an alert to the alerts array with rate limiting
 * @param {Array} alerts - Alerts array
 * @param {string} level - Alert level (WARNING, CRITICAL)
 * @param {string} message - Alert message
 * @param {Object} data - Additional alert data
 */
const pushAlert = (alerts, level, message, data) => {
  const now = Date.now();
  const alertKey = `${level}:${message}`;
  
  // Check if this alert was recently triggered (rate limiting)
  if (
    alertsTriggered[alertKey] && 
    now - alertsTriggered[alertKey] < (config.monitoring?.alertCooldown || 300000) // 5 minutes default
  ) {
    return;
  }
  
  // Add the alert
  alerts.push({
    level,
    message,
    timestamp: now,
    data
  });
  
  // Update the last triggered time
  alertsTriggered[alertKey] = now;
};

/**
 * Handle alerts by taking appropriate actions
 * @param {Array} alerts - Active alerts
 * @param {Object} metrics - System metrics
 */
const handleAlerts = async (alerts, metrics) => {
  try {
    const criticalAlerts = alerts.filter(alert => alert.level === 'CRITICAL');
    
    if (criticalAlerts.length > 0) {
      // Log critical alerts
      logger.error(`CRITICAL ALERTS (${criticalAlerts.length}):`, 
        criticalAlerts.map(a => a.message).join(', '));
      
      // Execute alert actions based on configuration
      if (config.monitoring?.alertActions) {
        if (config.monitoring.alertActions.includes('notification')) {
          await sendAlertNotification(criticalAlerts, metrics);
        }
        
        if (config.monitoring.alertActions.includes('restart') && 
            criticalAlerts.some(isMemoryRelatedAlert)) {
          // Only restart for memory-related critical issues
          if (config.env !== 'production' || config.monitoring.allowProductionRestart) {
            logger.warn('Initiating application restart due to critical memory issues');
            // Signal for graceful restart
            process.emit('SIGUSR2');
          } else {
            logger.warn('Auto-restart prevented in production (set allowProductionRestart to enable)');
          }
        }
        
        if (config.monitoring.alertActions.includes('log') || !config.monitoring.alertActions.length) {
          logExtendedMetrics(metrics);
        }
      }
    } else {
      // Log warning alerts
      const warningAlerts = alerts.filter(alert => alert.level === 'WARNING');
      if (warningAlerts.length > 0) {
        logger.warn(`WARNING ALERTS (${warningAlerts.length}):`, 
          warningAlerts.map(a => a.message).join(', '));
      }
    }
  } catch (error) {
    logger.error('Error handling alerts:', error);
  }
};

/**
 * Check if an alert is memory-related
 * @param {Object} alert - Alert object
 * @returns {boolean} True if memory-related
 */
const isMemoryRelatedAlert = (alert) => {
  return alert.message.includes('memory') || 
         (alert.data && alert.data.unit === '%' && 
          (alert.message.includes('Process') || alert.message.includes('System')));
};

/**
 * Send alert notifications via configured channels
 * @param {Array} alerts - Active alerts
 * @param {Object} metrics - System metrics
 * @returns {Promise<void>}
 */
const sendAlertNotification = async (alerts, metrics) => {
  try {
    // Simple summary of the alert situation
    const summary = `${alerts.length} critical alert(s) on ${os.hostname()} (${metrics.system.platform})`;
    const details = alerts.map(a => `${a.message}: ${a.data.current}${a.data.unit} (threshold: ${a.data.threshold}${a.data.unit})`).join('\n');
    
    // Add basic system info
    const systemInfo = [
      `Environment: ${config.env}`,
      `Node.js: ${process.version}`,
      `Uptime: ${formatUptime(metrics.application.uptime)}`,
      `Memory: ${formatBytes(metrics.process.memoryUsage.heapUsed)} / ${formatBytes(metrics.process.memoryUsage.heapTotal)}`,
      `CPU Load: ${metrics.system.loadAverage[0].toFixed(2)}, ${metrics.system.loadAverage[1].toFixed(2)}, ${metrics.system.loadAverage[2].toFixed(2)}`
    ].join('\n');
    
    const message = `${summary}\n\nALERTS:\n${details}\n\nSYSTEM INFO:\n${systemInfo}`;
    
    // Send via configured notification channels
    if (config.monitoring?.notifications?.email) {
      await sendEmailAlert(summary, message);
    }
    
    if (config.monitoring?.notifications?.slack) {
      await sendSlackAlert(summary, message);
    }
    
    if (config.monitoring?.notifications?.webhook) {
      await sendWebhookAlert(summary, message, metrics, alerts);
    }
    
    logger.info('Alert notifications sent successfully');
  } catch (error) {
    logger.error('Failed to send alert notifications:', error);
  }
};

/**
 * Send email alert
 * @param {string} subject - Alert subject
 * @param {string} message - Alert message
 * @returns {Promise<void>}
 */
const sendEmailAlert = async (subject, message) => {
  try {
    const emailConfig = config.monitoring?.notifications?.email;
    if (!emailConfig || !emailConfig.to) {
      return;
    }
    
    // Try to use the application's email service if available
    if (global.emailService && typeof global.emailService.sendEmail === 'function') {
      await global.emailService.sendEmail({
        to: emailConfig.to,
        subject: `[${config.env.toUpperCase()}] ${subject}`,
        text: message
      });
      return;
    }
    
    // Fallback to simple nodemailer if installed
    try {
      const nodemailer = require('nodemailer');
      
      // Create a transporter using SMTP settings
      const transporter = nodemailer.createTransport({
        host: emailConfig.smtp.host || 'localhost',
        port: emailConfig.smtp.port || 25,
        secure: emailConfig.smtp.secure || false,
        auth: emailConfig.smtp.auth ? {
          user: emailConfig.smtp.auth.user,
          pass: emailConfig.smtp.auth.pass
        } : undefined
      });
      
      // Send email
      await transporter.sendMail({
        from: emailConfig.from || 'monitoring@jaylink.com',
        to: emailConfig.to,
        subject: `[${config.env.toUpperCase()}] ${subject}`,
        text: message
      });
    } catch (error) {
      logger.warn('Nodemailer not available or email sending failed:', error);
    }
  } catch (error) {
    logger.error('Failed to send email alert:', error);
  }
};

/**
 * Send Slack alert
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @returns {Promise<void>}
 */
const sendSlackAlert = async (title, message) => {
  try {
    const slackConfig = config.monitoring?.notifications?.slack;
    if (!slackConfig || !slackConfig.webhookUrl) {
      return;
    }
    
    const payload = {
      text: `[${config.env.toUpperCase()}] ${title}`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*[${config.env.toUpperCase()}] ${title}*`
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '```' + message + '```'
          }
        }
      ]
    };
    
    // Send Slack webhook notification
    const https = require('https');
    const url = new URL(slackConfig.webhookUrl);
    
    await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: url.hostname,
        port: 443,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }, (res) => {
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to send Slack alert: HTTP ${res.statusCode}`));
        } else {
          resolve();
        }
      });
      
      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  } catch (error) {
    logger.error('Failed to send Slack alert:', error);
  }
};

/**
 * Send webhook alert
 * @param {string} title - Alert title
 * @param {string} message - Alert message
 * @param {Object} metrics - System metrics
 * @param {Array} alerts - Alert objects
 * @returns {Promise<void>}
 */
const sendWebhookAlert = async (title, message, metrics, alerts) => {
  try {
    const webhookConfig = config.monitoring?.notifications?.webhook;
    if (!webhookConfig || !webhookConfig.url) {
      return;
    }
    
    // Prepare webhook payload
    const payload = {
      title: `[${config.env.toUpperCase()}] ${title}`,
      message: message,
      timestamp: new Date().toISOString(),
      hostname: os.hostname(),
      environment: config.env,
      alerts: alerts,
      metrics: {
        system: {
          uptime: metrics.system.uptime,
          loadAverage: metrics.system.loadAverage,
          memory: {
            total: metrics.system.totalMemory,
            free: metrics.system.freeMemory,
            used: metrics.system.totalMemory - metrics.system.freeMemory,
            usedPercentage: ((metrics.system.totalMemory - metrics.system.freeMemory) / metrics.system.totalMemory) * 100
          }
        },
        process: {
          uptime: metrics.process.uptime,
          memory: metrics.process.memoryUsage
        }
      }
    };
    
    // Send webhook notification
    const https = require('https');
    const http = require('http');
    const url = new URL(webhookConfig.url);
    const protocol = url.protocol === 'https:' ? https : http;
    
    await new Promise((resolve, reject) => {
      const req = protocol.request({
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(webhookConfig.headers || {})
        }
      }, (res) => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`Failed to send webhook alert: HTTP ${res.statusCode}`));
        } else {
          resolve();
        }
      });
      
      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  } catch (error) {
    logger.error('Failed to send webhook alert:', error);
  }
};

/**
 * Log health status summary
 * @param {Object} metrics - System metrics
 * @param {Array} alerts - Active alerts
 */
const logHealthStatus = (metrics, alerts) => {
  // Determine log level based on alerts
  const hasCritical = alerts.some(alert => alert.level === 'CRITICAL');
  const hasWarning = alerts.some(alert => alert.level === 'WARNING');
  
  const logLevel = hasCritical ? 'error' : (hasWarning ? 'warn' : 'info');
  
  // Create a summary log message
  const summary = {
    timestamp: metrics.timestamp,
    status: hasCritical ? 'CRITICAL' : (hasWarning ? 'WARNING' : 'HEALTHY'),
    system: {
      loadAverage: metrics.system.loadAverage[0].toFixed(2),
      memoryUsed: `${((metrics.system.totalMemory - metrics.system.freeMemory) / metrics.system.totalMemory * 100).toFixed(2)}%`
    },
    process: {
      uptime: formatUptime(metrics.process.uptime),
      memoryUsed: `${(metrics.process.memoryUsage.heapUsed / metrics.process.memoryUsage.heapTotal * 100).toFixed(2)}% (${formatBytes(metrics.process.memoryUsage.heapUsed)})`
    },
    database: metrics.database.status === 'connected' 
      ? `Connected (${metrics.database.responseTime.toFixed(2)}ms)` 
      : `Error: ${metrics.database.error || 'Unknown error'}`
  };
  
  // Add alert count if any
  if (alerts.length > 0) {
    summary.alerts = `${alerts.length} (${alerts.filter(a => a.level === 'CRITICAL').length} critical, ${alerts.filter(a => a.level === 'WARNING').length} warning)`;
  }
  
  // Log the summary
  logger[logLevel]('Health check summary:', summary);
  
  // If there are alerts, log them in detail
  if (alerts.length > 0) {
    logger[logLevel]('Active alerts:', 
      alerts.map(a => `[${a.level}] ${a.message}: ${a.data.current}${a.data.unit} (threshold: ${a.data.threshold}${a.data.unit})`).join(', ')
    );
  }
  
  // For critical alerts, log extended metrics
  if (hasCritical && config.monitoring?.extendedLogging) {
    logExtendedMetrics(metrics);
  }
  
  // Write metrics to file if configured
  if (config.monitoring?.metricsFile) {
    writeMetricsToFile(metrics, alerts);
  }
};

/**
 * Log extended metrics for debugging
 * @param {Object} metrics - System metrics
 */
const logExtendedMetrics = (metrics) => {
  try {
    // Create a clean object with the most relevant metrics
    const relevantMetrics = {
      timestamp: metrics.timestamp,
      system: {
        uptime: metrics.system.uptime,
        loadAverage: metrics.system.loadAverage,
        totalMemory: formatBytes(metrics.system.totalMemory),
        freeMemory: formatBytes(metrics.system.freeMemory),
        usedMemoryPercentage: ((metrics.system.totalMemory - metrics.system.freeMemory) / metrics.system.totalMemory * 100).toFixed(2)
      },
      process: {
        uptime: metrics.process.uptime,
        memory: {
          rss: formatBytes(metrics.process.memoryUsage.rss),
          heapTotal: formatBytes(metrics.process.memoryUsage.heapTotal),
          heapUsed: formatBytes(metrics.process.memoryUsage.heapUsed),
          external: formatBytes(metrics.process.memoryUsage.external),
          usedPercentage: (metrics.process.memoryUsage.heapUsed / metrics.process.memoryUsage.heapTotal * 100).toFixed(2)
        },
        cpuUsage: {
          user: metrics.process.cpuUsage.user,
          system: metrics.process.cpuUsage.system
        }
      },
      database: {
        status: metrics.database.status,
        responseTime: metrics.database.responseTime,
        tables: metrics.database.tables
      }
    };
    
    // If there are disk metrics, include them
    if (metrics.disk?.volumes) {
      relevantMetrics.disk = {
        volumes: metrics.disk.volumes.map(vol => ({
          mount: vol.mount,
          total: formatBytes(vol.total),
          used: formatBytes(vol.used),
          free: formatBytes(vol.free),
          usedPercentage: vol.usedPercentage.toFixed(2)
        }))
      };
    }
    
    // If there are trends, include key ones
    if (metrics.trends) {
      relevantMetrics.trends = {
        system: {
          memoryUsage: `${metrics.trends.system.memoryUsage.toFixed(2)}%`
        },
        process: {
          memory: `${metrics.trends.process.memory.toFixed(2)}%`,
          cpu: {
            user: metrics.trends.process.cpu.user.toFixed(2),
            system: metrics.trends.process.cpu.system.toFixed(2)
          }
        }
      };
      
      if (metrics.trends.database) {
        relevantMetrics.trends.database = {
          responseTime: `${metrics.trends.database.responseTime.toFixed(2)}%`
        };
      }
    }
    
    // Log as a structured object
    logger.error('Extended metrics (debug info):', JSON.stringify(relevantMetrics, null, 2));
  } catch (error) {
    logger.error('Error logging extended metrics:', error);
  }
};

/**
 * Write metrics to a file for external monitoring
 * @param {Object} metrics - System metrics
 * @param {Array} alerts - Active alerts
 */
const writeMetricsToFile = (metrics, alerts) => {
  try {
    // Create a simplified metrics object for the file
    const simplifiedMetrics = {
      timestamp: metrics.timestamp,
      status: alerts.length > 0 ? (
        alerts.some(a => a.level === 'CRITICAL') ? 'CRITICAL' : 'WARNING'
      ) : 'HEALTHY',
      system: {
        loadAverage: metrics.system.loadAverage[0],
        memoryUsedPercent: ((metrics.system.totalMemory - metrics.system.freeMemory) / metrics.system.totalMemory * 100)
      },
      process: {
        uptime: metrics.process.uptime,
        memoryUsedPercent: (metrics.process.memoryUsage.heapUsed / metrics.process.memoryUsage.heapTotal * 100)
      },
      database: {
        status: metrics.database.status,
        responseTime: metrics.database.responseTime
      },
      alerts: alerts.map(a => ({
        level: a.level,
        message: a.message,
        value: a.data.current,
        threshold: a.data.threshold,
        unit: a.data.unit
      }))
    };
    
    // Write to the metrics file
    fs.writeFileSync(
      config.monitoring.metricsFile,
      JSON.stringify(simplifiedMetrics, null, 2)
    );
  } catch (error) {
    logger.warn('Failed to write metrics to file:', error);
  }
};

/**
 * Format uptime in a human-readable format
 * @param {number} uptime - Uptime in seconds
 * @returns {string} Formatted uptime
 */
const formatUptime = (uptime) => {
  const days = Math.floor(uptime / 86400);
  const hours = Math.floor((uptime % 86400) / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = Math.floor(uptime % 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
};

/**
 * Format bytes in a human-readable format
 * @param {number} bytes - Size in bytes
 * @returns {string} Formatted size
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Execute a command and return output as a promise
 * @param {string} command - Command to execute
 * @returns {Promise<{stdout, stderr}>} Command output
 */
const execPromise = (command) => {
  return new Promise((resolve, reject) => {
    require('child_process').exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

// Export the module
module.exports = {
  monitorSystemHealth,
  collectAndProcessMetrics,
  getDefaultThresholds,
  formatBytes,
  formatUptime
};