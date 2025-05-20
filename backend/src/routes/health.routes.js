// src/routes/health.routes.js
const express = require('express');
const db = require('../models');
const response = require('../utils/response.util');
const os = require('os');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { optionalAuthenticate } = require('../middleware/auth.middleware');
const { collectAndProcessMetrics } = require('../utils/monitoring.util');
const { checkBackupHealth } = require('../utils/backup.util');

const router = express.Router();

/**
 * @route GET /api/health
 * @desc Health check endpoint with comprehensive system status
 * @access Public
 */
router.get('/', async (req, res) => {
  const healthStatus = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.env,
    host: {
      name: os.hostname(),
      memory: {
        free: Math.round(os.freemem() / 1024 / 1024) + 'MB',
        total: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
      },
      uptime: Math.round(os.uptime() / 60 / 60) + ' hours',
    },
    services: {
      database: 'unknown',
    },
  };

  // Check database connection
  try {
    await db.sequelize.authenticate();
    healthStatus.services.database = 'connected';
  } catch (error) {
    healthStatus.status = 'degraded';
    healthStatus.services.database = 'disconnected';
    healthStatus.services.databaseError = error.message;
  }

  // Check file system access (for uploads directory)
  try {
    const uploadDir = path.join(__dirname, '../../uploads');
    fs.accessSync(uploadDir, fs.constants.R_OK | fs.constants.W_OK);
    healthStatus.services.fileSystem = 'accessible';
  } catch (error) {
    healthStatus.status = 'degraded';
    healthStatus.services.fileSystem = 'inaccessible';
    healthStatus.services.fileSystemError = error.message;
  }

  // Set appropriate status code based on health status
  if (healthStatus.status === 'ok') {
    return response.success(res, healthStatus);
  } else {
    // Use 503 Service Unavailable for degraded status
    return response.error(res, healthStatus, 'Service partially degraded', 503);
  }
});

/**
 * @route GET /api/health/db
 * @desc Detailed database health check
 * @access Public
 */
router.get('/db', async (req, res) => {
  try {
    // Check basic connection
    await db.sequelize.authenticate();

    // Get database statistics if needed
    const dbInfo = {
      dialect: db.sequelize.options.dialect,
      host: db.sequelize.config.host,
      database: db.sequelize.config.database,
      // Don't include username/password for security
    };

    // Check if key tables exist by running simple count queries (optional)
    // This helps verify not just connection but data access
    // (Adjust table names to match your application's important tables)
    const tableStatus = {};
    try {
      const keyTables = ['users', 'messages']; // Replace with your key tables
      for (const table of keyTables) {
        if (db[table]) {
          const count = await db[table].count();
          tableStatus[table] = { status: 'ok', count };
        }
      }
    } catch (tableError) {
      tableStatus.error = tableError.message;
    }

    return response.success(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbInfo,
      tables: tableStatus,
    });
  } catch (error) {
    return response.error(
      res,
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      'Database connectivity issue',
      503
    );
  }
});

/**
 * @route GET /api/health/extended
 * @desc Extended health check with more detailed metrics
 * @access Authenticated users
 */
router.get('/extended', optionalAuthenticate, async (req, res) => {
  // If user is not authenticated, return limited info
  if (!req.user) {
    return response.error(
      res,
      {
        timestamp: new Date().toISOString(),
      },
      'Authentication required for extended health information',
      401
    );
  }
  
  try {
    // For authenticated users, provide more detailed metrics
    const metrics = await collectAndProcessMetrics();
    
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      system: {
        memory: {
          total: Math.round(metrics.system.totalMemory / 1024 / 1024) + 'MB',
          free: Math.round(metrics.system.freeMemory / 1024 / 1024) + 'MB',
          usedPercentage: ((metrics.system.totalMemory - metrics.system.freeMemory) / 
                          metrics.system.totalMemory * 100).toFixed(2) + '%'
        },
        loadAverage: metrics.system.loadAverage,
        platform: metrics.system.platform,
        cpuCount: metrics.system.cpuCount || os.cpus().length
      },
      process: {
        memory: {
          rss: Math.round(metrics.process.memoryUsage.rss / 1024 / 1024) + 'MB',
          heapTotal: Math.round(metrics.process.memoryUsage.heapTotal / 1024 / 1024) + 'MB',
          heapUsed: Math.round(metrics.process.memoryUsage.heapUsed / 1024 / 1024) + 'MB',
          usedPercentage: (metrics.process.memoryUsage.heapUsed / metrics.process.memoryUsage.heapTotal * 100).toFixed(2) + '%'
        },
        uptime: metrics.process.uptime
      },
      database: {
        status: metrics.database.status,
        responseTime: metrics.database.status === 'connected' ? 
          `${metrics.database.responseTime.toFixed(2)}ms` : 'N/A'
      }
    };
    
    // Check if there are any active alerts
    if (metrics.alerts && metrics.alerts.length > 0) {
      healthStatus.status = metrics.alerts.some(a => a.level === 'CRITICAL') ? 'critical' : 'warning';
      healthStatus.alerts = metrics.alerts.map(a => ({
        level: a.level,
        message: a.message
      }));
    }
    
    return response.success(res, healthStatus);
  } catch (error) {
    return response.error(
      res,
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      'Error retrieving extended health information',
      500
    );
  }
});

/**
 * @route GET /api/health/backup
 * @desc Check backup status
 * @access Authenticated users
 */
router.get('/backup', optionalAuthenticate, async (req, res) => {
  // If user is not authenticated, return limited info
  if (!req.user) {
    return response.error(
      res,
      {
        timestamp: new Date().toISOString(),
      },
      'Authentication required for backup status information',
      401
    );
  }
  
  try {
    // Get backup health status
    const backupHealth = checkBackupHealth();
    
    // Create response based on backup health
    const healthStatus = {
      status: backupHealth.status === 'healthy' ? 'ok' : backupHealth.status,
      timestamp: new Date().toISOString(),
      backup: {
        message: backupHealth.message,
        lastBackup: backupHealth.lastBackupFile ? {
          date: backupHealth.lastBackupFile.date,
          size: backupHealth.lastBackupFile.size,
          name: backupHealth.lastBackupFile.name
        } : null
      }
    };
    
    return response.success(res, healthStatus);
  } catch (error) {
    return response.error(
      res,
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      'Error retrieving backup status information',
      500
    );
  }
});

module.exports = router;