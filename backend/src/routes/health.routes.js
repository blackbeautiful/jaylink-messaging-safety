// src/routes/health.routes.js - Enhanced Health Routes
const express = require('express');
const db = require('../models');
const response = require('../utils/response.util');
const os = require('os');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const { optionalAuthenticate } = require('../middleware/auth.middleware');
const { collectAndProcessMetrics } = require('../utils/monitoring.util');
const { getDatabaseHealth } = require('../utils/database-setup.util');

const router = express.Router();

/**
 * @route GET /api/health
 * @desc Basic health check endpoint
 * @access Public
 */
router.get('/', async (req, res) => {
  const healthStatus = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: process.env.npm_package_version || '1.0.0',
    host: {
      name: os.hostname(),
      memory: {
        free: Math.round(os.freemem() / 1024 / 1024) + 'MB',
        total: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
        usedPercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100) + '%'
      },
      uptime: Math.round(os.uptime() / 60 / 60) + ' hours',
    },
    services: {
      database: 'unknown',
      redis: 'unknown',
      websocket: 'unknown'
    },
  };

  let hasIssues = false;

  // Check database connection
  try {
    if (db.sequelize) {
      await db.sequelize.authenticate();
      healthStatus.services.database = 'connected';
    } else {
      healthStatus.services.database = 'unavailable';
      hasIssues = true;
    }
  } catch (error) {
    healthStatus.services.database = 'disconnected';
    healthStatus.services.databaseError = error.message;
    hasIssues = true;
  }

  // Check Redis connection (if configured)
  try {
    if (global.redisClient) {
      const pingResult = await global.redisClient.ping();
      healthStatus.services.redis = pingResult === 'PONG' ? 'connected' : 'error';
    } else if (config.redis.enableMockInDev && config.env === 'development') {
      healthStatus.services.redis = 'mocked';
    } else {
      healthStatus.services.redis = 'not_configured';
    }
  } catch (error) {
    healthStatus.services.redis = 'disconnected';
    hasIssues = true;
  }

  // Check WebSocket status
  try {
    if (config.websocket.enabled) {
      // Assume websocket is working if enabled and no errors during startup
      healthStatus.services.websocket = global.websocketServer ? 'active' : 'inactive';
    } else {
      healthStatus.services.websocket = 'disabled';
    }
  } catch (error) {
    healthStatus.services.websocket = 'error';
    hasIssues = true;
  }

  // Check file system access
  try {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (fs.existsSync(uploadDir)) {
      fs.accessSync(uploadDir, fs.constants.R_OK | fs.constants.W_OK);
      healthStatus.services.fileSystem = 'accessible';
    } else {
      healthStatus.services.fileSystem = 'directory_missing';
      hasIssues = true;
    }
  } catch (error) {
    healthStatus.services.fileSystem = 'inaccessible';
    healthStatus.services.fileSystemError = error.message;
    hasIssues = true;
  }

  // Determine overall status
  if (hasIssues) {
    healthStatus.status = 'degraded';
  }

  // Check for critical memory usage
  const heapUsed = process.memoryUsage().heapUsed;
  const heapTotal = process.memoryUsage().heapTotal;
  const memoryUsagePercent = (heapUsed / heapTotal) * 100;
  
  if (memoryUsagePercent > 90) {
    healthStatus.status = 'critical';
    healthStatus.warnings = healthStatus.warnings || [];
    healthStatus.warnings.push('Critical memory usage detected');
  } else if (memoryUsagePercent > 75) {
    healthStatus.status = 'degraded';
    healthStatus.warnings = healthStatus.warnings || [];
    healthStatus.warnings.push('High memory usage detected');
  }

  // Set appropriate HTTP status code
  const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                    healthStatus.status === 'degraded' ? 200 : 503;

  return response.success(res, healthStatus, 'Health check completed', httpStatus);
});

/**
 * @route GET /api/health/detailed
 * @desc Detailed health check with comprehensive metrics
 * @access Public (with optional authentication for extended info)
 */
router.get('/detailed', optionalAuthenticate, async (req, res) => {
  try {
    const isAuthenticated = !!req.user;
    
    // Collect basic health metrics
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      authenticated: isAuthenticated,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        memory: {
          total: Math.round(os.totalmem() / 1024 / 1024),
          free: Math.round(os.freemem() / 1024 / 1024),
          used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
          usedPercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)
        },
        loadAverage: os.loadavg(),
        cpuCount: os.cpus().length
      },
      process: {
        pid: process.pid,
        memory: {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          usedPercent: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
        }
      },
      services: {},
      issues: []
    };

    // Enhanced database health check
    try {
      const dbHealth = await getDatabaseHealth();
      healthStatus.services.database = {
        status: dbHealth.database?.status || 'unknown',
        connectionTime: dbHealth.database?.details?.connectionTime,
        models: dbHealth.models?.details?.totalModels || 0,
        modelNames: isAuthenticated ? dbHealth.models?.details?.loadedModels : undefined
      };

      if (dbHealth.database?.status === 'error') {
        healthStatus.issues.push('Database connection failed');
        healthStatus.status = 'unhealthy';
      }
    } catch (error) {
      healthStatus.services.database = { status: 'error', error: error.message };
      healthStatus.issues.push('Database health check failed');
      healthStatus.status = 'degraded';
    }

    // Enhanced service checks (only for authenticated users)
    if (isAuthenticated) {
      // Check queue system
      try {
        if (global.queue) {
          const queueHealth = await checkQueueHealth();
          healthStatus.services.queue = queueHealth;
        } else {
          healthStatus.services.queue = { status: 'not_configured' };
        }
      } catch (error) {
        healthStatus.services.queue = { status: 'error', error: error.message };
        healthStatus.issues.push('Queue system check failed');
      }

      // Check background workers
      try {
        if (global.workers) {
          healthStatus.services.workers = {
            status: 'active',
            count: global.workers.length || 0
          };
        } else {
          healthStatus.services.workers = { status: 'inactive'};
        }
      } catch (error) {
        healthStatus.services.workers = { status: 'error', error: error.message };
        healthStatus.issues.push('Workers check failed');
      }

      // Check external services
      try {
        healthStatus.services.external = await checkExternalServices();
      } catch (error) {
        healthStatus.services.external = { status: 'error', error: error.message };
        healthStatus.issues.push('External services check failed');
      }

      // System metrics (only for authenticated users)
      if (config.monitoring?.enabled) {
        try {
          const metrics = await collectAndProcessMetrics();
          healthStatus.metrics = {
            collectionTime: metrics.collection?.duration,
            alerts: metrics.alerts?.length || 0,
            trends: metrics.trends ? {
              memoryUsage: metrics.trends.system?.memoryUsage,
              cpuUsage: metrics.trends.process?.cpu,
              databaseResponseTime: metrics.trends.database?.responseTime
            } : undefined
          };

          // Add alerts if any
          if (metrics.alerts && metrics.alerts.length > 0) {
            healthStatus.alerts = metrics.alerts.map(alert => ({
              level: alert.level,
              message: alert.message,
              value: alert.data?.current,
              threshold: alert.data?.threshold
            }));

            // Update status based on alerts
            const hasCritical = metrics.alerts.some(a => a.level === 'CRITICAL');
            const hasWarning = metrics.alerts.some(a => a.level === 'WARNING');
            
            if (hasCritical) {
              healthStatus.status = 'critical';
            } else if (hasWarning && healthStatus.status === 'healthy') {
              healthStatus.status = 'degraded';
            }
          }
        } catch (error) {
          healthStatus.issues.push('Metrics collection failed');
        }
      }
    }

    // Check critical thresholds
    const criticalChecks = performCriticalChecks(healthStatus);
    if (criticalChecks.length > 0) {
      healthStatus.issues.push(...criticalChecks);
      if (healthStatus.status === 'healthy') {
        healthStatus.status = 'degraded';
      }
    }

    // Feature flags (for authenticated users)
    if (isAuthenticated) {
      healthStatus.features = config.getFeatureFlags();
    }

    const httpStatus = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;

    return response.success(res, healthStatus, 'Detailed health check completed', httpStatus);

  } catch (error) {
    return response.error(
      res,
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      'Health check failed',
      500
    );
  }
});

/**
 * @route GET /api/health/database
 * @desc Database-specific health check
 * @access Public
 */
router.get('/database', async (req, res) => {
  try {
    const dbHealth = {
      status: 'unknown',
      timestamp: new Date().toISOString(),
      connection: {},
      models: {},
      performance: {}
    };

    // Test basic connection
    const connectionStart = Date.now();
    try {
      await db.sequelize.authenticate();
      const connectionTime = Date.now() - connectionStart;
      
      dbHealth.connection = {
        status: 'connected',
        responseTime: connectionTime,
        dialect: db.sequelize.options.dialect,
        host: db.sequelize.config.host,
        database: db.sequelize.config.database,
        timezone: db.sequelize.options.timezone
      };

      if (connectionTime > 1000) {
        dbHealth.status = 'slow';
        dbHealth.warnings = ['High database response time'];
      } else {
        dbHealth.status = 'healthy';
      }
    } catch (error) {
      dbHealth.connection = {
        status: 'error',
        error: error.message,
        code: error.original?.code
      };
      dbHealth.status = 'unhealthy';
    }

    // Check models (if connection is working)
    if (dbHealth.connection.status === 'connected') {
      try {
        const modelNames = Object.keys(db).filter(key => 
          key !== 'sequelize' && key !== 'Sequelize' && key !== 'isHealthy'
        );

        dbHealth.models = {
          total: modelNames.length,
          loaded: modelNames,
          status: modelNames.length > 0 ? 'loaded' : 'none'
        };

        // Test key models with record counts
        const keyModels = ['User', 'Message', 'Contact'];
        const modelCounts = {};
        
        for (const modelName of keyModels) {
          if (db[modelName]) {
            try {
              const count = await db[modelName].count();
              modelCounts[modelName] = count;
            } catch (error) {
              modelCounts[modelName] = { error: error.message };
            }
          }
        }
        
        dbHealth.models.counts = modelCounts;
      } catch (error) {
        dbHealth.models = {
          status: 'error',
          error: error.message
        };
      }

      // Performance metrics
      try {
        const perfStart = Date.now();
        await db.sequelize.query('SELECT 1 as test, NOW() as db_time');
        const queryTime = Date.now() - perfStart;
        
        dbHealth.performance = {
          simpleQueryTime: queryTime,
          status: queryTime < 100 ? 'fast' : queryTime < 500 ? 'normal' : 'slow'
        };
      } catch (error) {
        dbHealth.performance = {
          status: 'error',
          error: error.message
        };
      }
    }

    const httpStatus = dbHealth.status === 'healthy' ? 200 : 
                      dbHealth.status === 'slow' ? 200 : 503;

    return response.success(res, dbHealth, 'Database health check completed', httpStatus);

  } catch (error) {
    return response.error(
      res,
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      'Database health check failed',
      500
    );
  }
});

/**
 * @route GET /api/health/services
 * @desc Service-specific health checks
 * @access Authenticated users only
 */
router.get('/services', optionalAuthenticate, async (req, res) => {
  if (!req.user) {
    return response.error(
      res,
      { timestamp: new Date().toISOString() },
      'Authentication required for service health information',
      401
    );
  }

  try {
    const serviceHealth = {
      timestamp: new Date().toISOString(),
      services: {},
      overall: 'healthy',
      issues: []
    };

    // Check SMS provider
    try {
      serviceHealth.services.smsProvider = await checkSMSProvider();
    } catch (error) {
      serviceHealth.services.smsProvider = { status: 'error', error: error.message };
      serviceHealth.issues.push('SMS provider check failed');
    }

    // Check email service
    try {
      serviceHealth.services.email = await checkEmailService();
    } catch (error) {
      serviceHealth.services.email = { status: 'error', error: error.message };
      serviceHealth.issues.push('Email service check failed');
    }

    // Check payment gateway
    try {
      serviceHealth.services.payment = await checkPaymentGateway();
    } catch (error) {
      serviceHealth.services.payment = { status: 'error', error: error.message };
      serviceHealth.issues.push('Payment gateway check failed');
    }

    // Check Redis/Queue system
    try {
      serviceHealth.services.queue = await checkQueueHealth();
    } catch (error) {
      serviceHealth.services.queue = { status: 'error', error: error.message };
      serviceHealth.issues.push('Queue system check failed');
    }

    // Determine overall status
    const serviceStatuses = Object.values(serviceHealth.services).map(s => s.status);
    const hasErrors = serviceStatuses.includes('error');
    const hasWarnings = serviceStatuses.includes('warning') || serviceStatuses.includes('degraded');

    if (hasErrors) {
      serviceHealth.overall = 'degraded';
    } else if (hasWarnings) {
      serviceHealth.overall = 'warning';
    }

    const httpStatus = serviceHealth.overall === 'healthy' ? 200 : 200; // Always 200 for service checks

    return response.success(res, serviceHealth, 'Service health check completed', httpStatus);

  } catch (error) {
    return response.error(
      res,
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      'Service health check failed',
      500
    );
  }
});

/**
 * @route GET /api/health/system
 * @desc System metrics and performance
 * @access Authenticated users only
 */
router.get('/system', optionalAuthenticate, async (req, res) => {
  if (!req.user) {
    return response.error(
      res,
      { timestamp: new Date().toISOString() },
      'Authentication required for system health information',
      401
    );
  }

  try {
    const systemHealth = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: os.uptime(),
        loadAverage: os.loadavg(),
        memory: {
          total: os.totalmem(),
          free: os.freemem(),
          used: os.totalmem() - os.freemem(),
          usedPercent: ((os.totalmem() - os.freemem()) / os.totalmem()) * 100
        },
        cpu: {
          count: os.cpus().length,
          model: os.cpus()[0]?.model,
          loadPerCore: os.loadavg()[0] / os.cpus().length
        }
      },
      process: {
        uptime: process.uptime(),
        pid: process.pid,
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        versions: process.versions
      },
      disk: {},
      network: {},
      status: 'healthy',
      warnings: []
    };

    // Calculate memory percentages
    systemHealth.process.memory.usedPercent = 
      (systemHealth.process.memory.heapUsed / systemHealth.process.memory.heapTotal) * 100;

    // Check disk usage
    try {
      systemHealth.disk = await checkDiskUsage();
    } catch (error) {
      systemHealth.disk = { status: 'error', error: error.message };
      systemHealth.warnings.push('Disk usage check failed');
    }

    // Performance thresholds
    if (systemHealth.system.memory.usedPercent > 90) {
      systemHealth.status = 'critical';
      systemHealth.warnings.push('Critical system memory usage');
    } else if (systemHealth.system.memory.usedPercent > 80) {
      systemHealth.status = 'warning';
      systemHealth.warnings.push('High system memory usage');
    }

    if (systemHealth.process.memory.usedPercent > 90) {
      systemHealth.status = 'critical';
      systemHealth.warnings.push('Critical process memory usage');
    } else if (systemHealth.process.memory.usedPercent > 80) {
      if (systemHealth.status === 'healthy') {
        systemHealth.status = 'warning';
      }
      systemHealth.warnings.push('High process memory usage');
    }

    if (systemHealth.system.cpu.loadPerCore > 1.0) {
      systemHealth.status = 'warning';
      systemHealth.warnings.push('High CPU load detected');
    }

    return response.success(res, systemHealth, 'System health check completed');

  } catch (error) {
    return response.error(
      res,
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      'System health check failed',
      500
    );
  }
});

/**
 * @route GET /api/health/backup
 * @desc Backup system health check
 * @access Authenticated users only
 */
router.get('/backup', optionalAuthenticate, async (req, res) => {
  if (!req.user) {
    return response.error(
      res,
      { timestamp: new Date().toISOString() },
      'Authentication required for backup status information',
      401
    );
  }

  try {
    const backupHealth = await checkBackupHealth();
    return response.success(res, backupHealth, 'Backup health check completed');
  } catch (error) {
    return response.error(
      res,
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message
      },
      'Backup health check failed',
      500
    );
  }
});

// Helper Functions

/**
 * Perform critical system checks
 */
function performCriticalChecks(healthStatus) {
  const issues = [];

  // Memory checks
  if (healthStatus.process?.memory?.usedPercent > 95) {
    issues.push('Critical memory usage - system may become unstable');
  }

  // Disk space checks (if available)
  if (healthStatus.system?.disk?.usedPercent > 95) {
    issues.push('Critical disk usage - system may fail');
  }

  // Uptime checks
  if (healthStatus.uptime < 60) { // Less than 1 minute
    issues.push('System recently restarted');
  }

  return issues;
}

/**
 * Check SMS provider health
 */
async function checkSMSProvider() {
  try {
    // Basic configuration check
    if (!config.smsProvider.username || !config.smsProvider.password) {
      return {
        status: 'misconfigured',
        message: 'SMS provider credentials not configured'
      };
    }

    return {
      status: 'configured',
      provider: config.smsProvider.provider,
      hasBackup: config.smsProvider.backup.enabled,
      baseUrl: config.smsProvider.baseUrl
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Check email service health
 */
async function checkEmailService() {
  try {
    if (!config.email.host || !config.email.user) {
      return {
        status: 'misconfigured',
        message: 'Email service not configured'
      };
    }

    return {
      status: 'configured',
      host: config.email.host,
      port: config.email.port,
      from: config.email.from
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Check payment gateway health
 */
async function checkPaymentGateway() {
  try {
    if (!config.paymentGateway.secretKey || config.paymentGateway.secretKey === 'your_paystack_secret_key') {
      return {
        status: 'misconfigured',
        message: 'Payment gateway not configured'
      };
    }

    return {
      status: 'configured',
      provider: config.paymentGateway.provider,
      testMode: config.paymentGateway.testMode,
      channels: config.paymentGateway.channels
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Check queue system health
 */
async function checkQueueHealth() {
  try {
    if (global.queue) {
      // If using Bull/Redis queues
      const jobCounts = await global.queue.getJobCounts();
      return {
        status: 'active',
        waiting: jobCounts.waiting || 0,
        active: jobCounts.active || 0,
        completed: jobCounts.completed || 0,
        failed: jobCounts.failed || 0
      };
    } else if (config.redis.enableMockInDev && config.env === 'development') {
      return {
        status: 'mocked',
        message: 'Using mock queue in development'
      };
    } else {
      return {
        status: 'not_configured',
        message: 'Queue system not configured'
      };
    }
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Check external services connectivity
 */
async function checkExternalServices() {
  const services = {
    sms: await checkSMSProvider(),
    email: await checkEmailService(),
    payment: await checkPaymentGateway()
  };

  const statuses = Object.values(services).map(s => s.status);
  const overall = statuses.includes('error') ? 'error' : 
                 statuses.includes('misconfigured') ? 'warning' : 'healthy';

  return {
    status: overall,
    services
  };
}

/**
 * Check disk usage
 */
async function checkDiskUsage() {
  try {
    const checkPaths = [
      { path: '.', name: 'Application Root' },
      { path: './logs', name: 'Logs' },
      { path: './uploads', name: 'Uploads' }
    ];

    const diskInfo = {
      paths: [],
      status: 'healthy'
    };

    for (const pathInfo of checkPaths) {
      try {
        if (fs.existsSync(pathInfo.path)) {
          const stats = fs.statSync(pathInfo.path);
          diskInfo.paths.push({
            name: pathInfo.name,
            path: pathInfo.path,
            exists: true,
            size: stats.isDirectory() ? 'directory' : stats.size
          });
        } else {
          diskInfo.paths.push({
            name: pathInfo.name,
            path: pathInfo.path,
            exists: false
          });
        }
      } catch (error) {
        diskInfo.paths.push({
          name: pathInfo.name,
          path: pathInfo.path,
          error: error.message
        });
      }
    }

    return diskInfo;
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Check backup system health
 */
async function checkBackupHealth() {
  try {
    const backupDir = config.backup?.directory || 'backups/database';
    const backupHealth = {
      status: 'unknown',
      timestamp: new Date().toISOString(),
      configuration: {
        enabled: config.backup?.enabled || false,
        directory: backupDir,
        schedule: config.backup?.schedule || 'not_configured',
        maxBackups: config.backup?.maxBackups || 'not_configured'
      },
      lastBackup: null,
      backupCount: 0
    };

    if (!config.backup?.enabled) {
      backupHealth.status = 'disabled';
      backupHealth.message = 'Backup system is disabled';
      return backupHealth;
    }

    // Check if backup directory exists
    if (fs.existsSync(backupDir)) {
      const files = fs.readdirSync(backupDir);
      const backupFiles = files.filter(file => 
        file.endsWith('.sql') || file.endsWith('.sql.gz')
      );

      backupHealth.backupCount = backupFiles.length;

      if (backupFiles.length > 0) {
        // Get the most recent backup
        const sortedFiles = backupFiles
          .map(file => {
            const stats = fs.statSync(path.join(backupDir, file));
            return {
              name: file,
              date: stats.mtime,
              size: stats.size
            };
          })
          .sort((a, b) => b.date - a.date);

        backupHealth.lastBackup = {
          name: sortedFiles[0].name,
          date: sortedFiles[0].date,
          size: Math.round(sortedFiles[0].size / 1024) + 'KB',
          ageHours: Math.round((Date.now() - sortedFiles[0].date.getTime()) / (1000 * 60 * 60))
        };

        // Determine status based on backup age
        if (backupHealth.lastBackup.ageHours <= 24) {
          backupHealth.status = 'healthy';
          backupHealth.message = 'Recent backup available';
        } else if (backupHealth.lastBackup.ageHours <= 72) {
          backupHealth.status = 'warning';
          backupHealth.message = 'Backup is older than 24 hours';
        } else {
          backupHealth.status = 'critical';
          backupHealth.message = 'Backup is older than 72 hours';
        }
      } else {
        backupHealth.status = 'warning';
        backupHealth.message = 'No backup files found';
      }
    } else {
      backupHealth.status = 'error';
      backupHealth.message = 'Backup directory does not exist';
    }

    return backupHealth;
  } catch (error) {
    return {
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      message: 'Backup health check failed'
    };
  }
}

module.exports = router;