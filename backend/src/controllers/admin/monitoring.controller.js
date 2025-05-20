// backend/src/controllers/admin/monitoring.controller.js
/**
 * JayLink SMS Platform
 * Monitoring controller for admin dashboard
 */

const { collectAndProcessMetrics, getDefaultThresholds, formatBytes, formatUptime } = require('../../utils/monitoring.util');
const { backupDatabase, checkBackupHealth } = require('../../utils/backup.util');
const config = require('../../config/config');
const logger = require('../../config/logger');
const db = require('../../models');
const fs = require('fs');
const path = require('path');

/**
 * Get current system health status
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getSystemHealth = async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access monitoring data'
      });
    }
    
    // Collect current metrics
    const metrics = await collectAndProcessMetrics();
    
    // Format metrics for API response
    const formattedMetrics = formatMetricsForResponse(metrics);
    
    return res.status(200).json({
      status: 'success',
      data: formattedMetrics
    });
  } catch (error) {
    logger.error('Error in getSystemHealth controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve system health data',
      error: config.env === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get historical health metrics
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getHealthHistory = async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access monitoring data'
      });
    }
    
    // Parse query parameters
    const limit = parseInt(req.query.limit || '24', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    
    // Load historical metrics from database or log files
    const history = await loadHealthHistory(limit, offset);
    
    return res.status(200).json({
      status: 'success',
      data: {
        history,
        pagination: {
          limit,
          offset,
          total: await getHistoryCount()
        }
      }
    });
  } catch (error) {
    logger.error('Error in getHealthHistory controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve health history data',
      error: config.env === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get current alert thresholds
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {void}
 */
const getAlertThresholds = (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access threshold settings'
      });
    }
    
    // Get current thresholds
    const thresholds = config.monitoring?.thresholds || getDefaultThresholds();
    
    return res.status(200).json({
      status: 'success',
      data: thresholds
    });
  } catch (error) {
    logger.error('Error in getAlertThresholds controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve alert thresholds',
      error: config.env === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update alert thresholds
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const updateAlertThresholds = async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to modify threshold settings'
      });
    }
    
    // Validate input
    const newThresholds = req.body;
    if (!newThresholds || typeof newThresholds !== 'object') {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid threshold data provided'
      });
    }
    
    // Update thresholds in database or settings
    await updateThresholdsInSettings(newThresholds);
    
    // Update in-memory config
    config.monitoring = {
      ...config.monitoring,
      thresholds: newThresholds
    };
    
    return res.status(200).json({
      status: 'success',
      message: 'Alert thresholds updated successfully',
      data: newThresholds
    });
  } catch (error) {
    logger.error('Error in updateAlertThresholds controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update alert thresholds',
      error: config.env === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get backup status and history
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const getBackupStatus = async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to access backup information'
      });
    }
    
    // Get backup health status
    const backupHealth = checkBackupHealth();
    
    return res.status(200).json({
      status: 'success',
      data: backupHealth
    });
  } catch (error) {
    logger.error('Error in getBackupStatus controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve backup status',
      error: config.env === 'development' ? error.message : undefined
    });
  }
};

/**
 * Trigger a manual backup
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const triggerBackup = async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to trigger backups'
      });
    }
    
    // Start the backup process
    logger.info(`Manual backup triggered by admin: ${req.user.id} (${req.user.email})`);
    
    const backupResult = await backupDatabase(true);
    
    if (backupResult.status === 'error') {
      return res.status(500).json({
        status: 'error',
        message: `Backup failed: ${backupResult.error}`
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Backup completed successfully',
      data: backupResult
    });
  } catch (error) {
    logger.error('Error in triggerBackup controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to trigger backup',
      error: config.env === 'development' ? error.message : undefined
    });
  }
};

/**
 * Run immediate system analysis
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @returns {Promise<void>}
 */
const runSystemAnalysis = async (req, res) => {
  try {
    // Check if user has admin privileges
    if (!req.user.isAdmin) {
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to run system analysis'
      });
    }
    
    logger.info(`Manual system analysis triggered by admin: ${req.user.id} (${req.user.email})`);
    
    // Collect comprehensive metrics
    const metrics = await collectAndProcessMetrics();
    
    // Format metrics for API response with extended information
    const formattedMetrics = formatMetricsForResponse(metrics, true);
    
    // If we have a SystemMetric model, store these metrics
    if (db.SystemMetric) {
      await db.SystemMetric.createFromMetrics(metrics);
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'System analysis completed successfully',
      data: formattedMetrics
    });
  } catch (error) {
    logger.error('Error in runSystemAnalysis controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to run system analysis',
      error: config.env === 'development' ? error.message : undefined
    });
  }
};

/**
 * Format metrics for API response
 * @param {Object} metrics - Raw system metrics
 * @param {boolean} extended - Whether to include extended metrics
 * @returns {Object} Formatted metrics
 */
const formatMetricsForResponse = (metrics, extended = false) => {
  // Create a clean, human-readable representation of the metrics
  const formattedMetrics = {
    timestamp: metrics.timestamp,
    system: {
      uptime: formatUptime(metrics.system.uptime),
      loadAverage: metrics.system.loadAverage,
      memory: {
        total: formatBytes(metrics.system.totalMemory),
        free: formatBytes(metrics.system.freeMemory),
        used: formatBytes(metrics.system.totalMemory - metrics.system.freeMemory),
        usedPercentage: ((metrics.system.totalMemory - metrics.system.freeMemory) / metrics.system.totalMemory * 100).toFixed(2)
      },
      platform: metrics.system.platform,
      hostname: metrics.system.hostname
    },
    process: {
      uptime: formatUptime(metrics.process.uptime),
      pid: metrics.process.pid,
      memory: {
        rss: formatBytes(metrics.process.memoryUsage.rss),
        heapTotal: formatBytes(metrics.process.memoryUsage.heapTotal),
        heapUsed: formatBytes(metrics.process.memoryUsage.heapUsed),
        external: formatBytes(metrics.process.memoryUsage.external),
        usedPercentage: (metrics.process.memoryUsage.heapUsed / metrics.process.memoryUsage.heapTotal * 100).toFixed(2)
      },
      nodeVersion: metrics.process.versions.node
    },
    database: {
      status: metrics.database.status,
      responseTime: metrics.database.status === 'connected' ? 
        `${metrics.database.responseTime.toFixed(2)}ms` : 'N/A',
      tables: Object.keys(metrics.database.tables || {}).map(table => ({
        name: table,
        records: metrics.database.tables[table].records,
        error: metrics.database.tables[table].error
      }))
    },
    application: {
      environment: metrics.application.environment,
      startTime: metrics.application.startTime,
      errors: metrics.application.errors
    }
  };
  
  // Include disk information if available
  if (metrics.disk?.volumes && metrics.disk.volumes.length > 0) {
    formattedMetrics.disk = {
      volumes: metrics.disk.volumes.map(volume => ({
        mount: volume.mount,
        total: formatBytes(volume.total),
        used: formatBytes(volume.used),
        free: formatBytes(volume.free),
        usedPercentage: volume.usedPercentage.toFixed(2)
      }))
    };
  }
  
  // Include active alerts if any
  if (metrics.alerts && metrics.alerts.length > 0) {
    formattedMetrics.alerts = metrics.alerts.map(alert => ({
      level: alert.level,
      message: alert.message,
      timestamp: alert.timestamp,
      value: alert.data.current,
      threshold: alert.data.threshold,
      unit: alert.data.unit
    }));
  }
  
  // Include extended information if requested
  if (extended) {
    // Include additional system information
    if (metrics.system) {
      formattedMetrics.system.cpuInfo = metrics.system.cpus ? {
        count: metrics.system.cpus.length,
        model: metrics.system.cpus[0]?.model || 'Unknown CPU'
      } : undefined;
      
      formattedMetrics.system.release = metrics.system.release;
      formattedMetrics.system.arch = metrics.system.arch;
    }
    
    // Include detailed memory metrics
    if (metrics.memory) {
      formattedMetrics.memory = {
        heapStatistics: {
          totalHeapSize: formatBytes(metrics.memory.heapStatistics?.totalHeapSize),
          usedHeapSize: formatBytes(metrics.memory.heapStatistics?.usedHeapSize),
          heapSizeLimit: formatBytes(metrics.memory.heapStatistics?.heapSizeLimit),
          usedPercentage: ((metrics.memory.heapStatistics?.usedHeapSize / metrics.memory.heapStatistics?.heapSizeLimit) * 100).toFixed(2)
        }
      };
    }
    
    // Include trend data if available
    if (metrics.trends) {
      formattedMetrics.trends = {
        system: metrics.trends.system,
        process: metrics.trends.process,
        database: metrics.trends.database
      };
    }
    
    // Include backup status
    formattedMetrics.backup = checkBackupHealth();
  }
  
  return formattedMetrics;
};

/**
 * Load historical health metrics
 * @param {number} limit - Maximum number of records to return
 * @param {number} offset - Number of records to skip
 * @returns {Promise<Array>} Historical metrics
 */
const loadHealthHistory = async (limit, offset) => {
  try {
    // If we have a SystemMetric model, use it to fetch history
    if (db.SystemMetric) {
      const metrics = await db.SystemMetric.findAll({
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });
      
      return metrics.map(metric => metric.toJSON());
    }
    
    // Otherwise, try to read from metrics log file
    const metricsFile = config.monitoring?.metricsFile || './logs/metrics.json';
    const metricsDir = path.dirname(metricsFile);
    const metricsBaseName = path.basename(metricsFile, path.extname(metricsFile));
    const metricsExt = path.extname(metricsFile);
    
    // Look for rotated log files like metrics.1.json, metrics.2.json, etc.
    const logFiles = fs.readdirSync(metricsDir)
      .filter(file => 
        file.startsWith(metricsBaseName) && 
        file.endsWith(metricsExt) &&
        /\.\d+$/.test(file.replace(metricsExt, ''))
      )
      .sort((a, b) => {
        const numA = parseInt(a.replace(metricsBaseName + '.', '').replace(metricsExt, ''), 10);
        const numB = parseInt(b.replace(metricsBaseName + '.', '').replace(metricsExt, ''), 10);
        return numA - numB; // Ascending order by rotation number
      });
    
    // Add the current metrics file as the most recent
    if (fs.existsSync(metricsFile)) {
      logFiles.unshift(path.basename(metricsFile));
    }
    
    // Load and parse metrics from files
    const history = [];
    let remainingLimit = limit;
    let currentOffset = offset;
    
    for (const file of logFiles) {
      if (remainingLimit <= 0) break;
      
      const filePath = path.join(metricsDir, file);
      if (!fs.existsSync(filePath)) continue;
      
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileMetrics = JSON.parse(fileContent);
        
        // If it's an array, take the needed slice
        if (Array.isArray(fileMetrics)) {
          if (currentOffset >= fileMetrics.length) {
            // Skip this file completely
            currentOffset -= fileMetrics.length;
            continue;
          }
          
          const metricsSlice = fileMetrics
            .slice(currentOffset, currentOffset + remainingLimit);
          
          history.push(...metricsSlice);
          remainingLimit -= metricsSlice.length;
          currentOffset = 0; // Reset offset for subsequent files
        } else {
          // If it's a single object, add it if we're past the offset
          if (currentOffset > 0) {
            currentOffset--;
            continue;
          }
          
          history.push(fileMetrics);
          remainingLimit--;
        }
      } catch (error) {
        logger.warn(`Error reading metrics from ${file}:`, error);
        continue;
      }
    }
    
    return history;
  } catch (error) {
    logger.error('Error loading health history:', error);
    return [];
  }
};

/**
 * Get total count of historical metrics
 * @returns {Promise<number>} Total count
 */
const getHistoryCount = async () => {
  try {
    // If we have a SystemMetric model, use it to get count
    if (db.SystemMetric) {
      return await db.SystemMetric.count();
    }
    
    // Otherwise, estimate from metrics log files
    // This is an approximation and might not be accurate
    const metricsFile = config.monitoring?.metricsFile || './logs/metrics.json';
    const metricsDir = path.dirname(metricsFile);
    const metricsBaseName = path.basename(metricsFile, path.extname(metricsFile));
    const metricsExt = path.extname(metricsFile);
    
    // Count entries in all metrics files
    let totalCount = 0;
    
    // Look for rotated log files
    const logFiles = fs.readdirSync(metricsDir)
      .filter(file => 
        file.startsWith(metricsBaseName) && 
        file.endsWith(metricsExt)
      );
    
    for (const file of logFiles) {
      const filePath = path.join(metricsDir, file);
      if (!fs.existsSync(filePath)) continue;
      
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const fileMetrics = JSON.parse(fileContent);
        
        if (Array.isArray(fileMetrics)) {
          totalCount += fileMetrics.length;
        } else {
          totalCount += 1;
        }
      } catch (error) {
        // Ignore parsing errors
        continue;
      }
    }
    
    return totalCount;
  } catch (error) {
    logger.error('Error getting history count:', error);
    return 0;
  }
};

/**
 * Update thresholds in the database or settings file
 * @param {Object} thresholds - New threshold values
 * @returns {Promise<void>}
 */
const updateThresholdsInSettings = async (thresholds) => {
  try {
    // If we have a SystemSetting model, update thresholds there
    if (db.SystemSetting) {
      await db.SystemSetting.upsert({
        key: 'monitoring.thresholds',
        value: JSON.stringify(thresholds),
        updatedAt: new Date()
      });
      return;
    }
    
    // Otherwise, try to update the config file directly
    // This is generally not recommended but provided as a fallback
    const configFilePath = path.join(__dirname, '..', '..', 'config', 'monitoring-config.js');
    
    if (!fs.existsSync(configFilePath)) {
      throw new Error('Monitoring config file not found');
    }
    
    // Read the current config file
    let configContent = fs.readFileSync(configFilePath, 'utf8');
    
    // Update the thresholds part - WARNING: This is a simplistic approach and might fail
    // A better approach would be to use a dedicated config storage mechanism
    const thresholdsMatch = configContent.match(/thresholds:\s*{[^}]*}/s);
    if (!thresholdsMatch) {
      throw new Error('Could not find thresholds in config file');
    }
    
    // Create new thresholds content
    const newThresholdsContent = `thresholds: ${JSON.stringify(thresholds, null, 2)}`;
    
    // Replace the thresholds section
    configContent = configContent.replace(thresholdsMatch[0], newThresholdsContent);
    
    // Write the updated config back
    fs.writeFileSync(configFilePath, configContent, 'utf8');
    
    // Note: This approach requires restarting the server to take effect
    logger.warn('Updated thresholds in configuration file. Server restart required for changes to take effect.');
  } catch (error) {
    logger.error('Error updating thresholds in settings:', error);
    throw error;
  }
};

module.exports = {
  getSystemHealth,
  getHealthHistory,
  getAlertThresholds,
  updateAlertThresholds,
  getBackupStatus,
  triggerBackup,
  runSystemAnalysis
};