/**
 * JayLink SMS Platform - Enhanced Server Startup
 * Improved error handling and graceful degradation
 */
const path = require('path');
const fs = require('fs');
const http = require('http');
const db = require('./models');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');
const workers = require('./workers');
const websocket = require('./utils/websocket.util');
const { setupDatabase, getDatabaseHealth, performEmergencyRecovery } = require('./utils/database-setup.util');
const { monitorSystemHealth } = require('./utils/monitoring.util');

/**
 * Application state management
 */
const serverState = {
  server: null,
  databaseReady: false,
  websocketReady: false,
  workersReady: false,
  healthMonitoringActive: false,
  gracefulShutdownInitiated: false,
  startupTime: Date.now(),
  databaseIssues: []
};

/**
 * Enhanced server startup with better error handling
 */
async function startServer() {
  let server;

  try {
    logger.info(`Starting JayLink SMS Platform server (${config.env} environment)`);
    logger.info(`Node.js version: ${process.version}`);
    logger.info(`Platform: ${process.platform} (${process.arch})`);

    // Step 1: Ensure required directories
    await ensureDirectories();

    // Step 2: Initialize email templates
    await initializeTemplates();

    // Step 3: Set up global error handlers
    setupGlobalErrorHandlers();

    // Step 4: Enhanced database setup with better error handling
    const dbSetupResult = await setupDatabaseWithResilience();
    
    // Step 5: Create and configure HTTP server
    server = http.createServer(app);
    serverState.server = server;

    // Step 6: Initialize WebSocket (non-blocking)
    await initializeWebSocketServer(server);

    // Step 7: Initialize subsystems with fallback
    await initializeSubsystemsWithFallback();

    // Step 8: Start health monitoring if enabled
    startHealthMonitoring();

    // Step 9: Start HTTP server
    await startHttpServer(server);

    // Step 10: Setup graceful shutdown
    setupGracefulShutdown(server);

    // Step 11: Log startup success
    logSuccessfulStartup(server, dbSetupResult);

    // Step 12: Schedule post-startup recovery if needed
    if (!dbSetupResult.fullyHealthy) {
      schedulePostStartupRecovery();
    }

    return server;

  } catch (error) {
    logger.error('❌ Fatal error during server startup:', error);
    
    // Attempt graceful cleanup
    if (server) {
      try {
        server.close();
      } catch (closeError) {
        logger.error('Error closing server during cleanup:', closeError);
      }
    }
    
    await gracefulExit(1);
  }
}

/**
 * Enhanced database setup with comprehensive error handling
 */
async function setupDatabaseWithResilience() {
  logger.info('🔗 Starting resilient database setup');

  const setupResult = {
    success: false,
    fullyHealthy: false,
    canContinue: false,
    issues: [],
    recoveryAttempted: false,
    degradedMode: false
  };

  try {
    // Attempt primary database setup
    logger.info('🔄 Attempting primary database setup...');
    const primaryResult = await setupDatabase();
    
    setupResult.success = primaryResult.success;
    setupResult.canContinue = primaryResult.shouldContinue;
    setupResult.fullyHealthy = primaryResult.success && primaryResult.fullyHealthy;
    
    if (primaryResult.errors) {
      setupResult.issues.push(...primaryResult.errors);
    }
    if (primaryResult.warnings) {
      setupResult.issues.push(...primaryResult.warnings);
    }

    if (primaryResult.success) {
      logger.info('✅ Primary database setup completed successfully');
      serverState.databaseReady = true;
      return setupResult;
    }

    // Primary setup failed - attempt recovery
    logger.warn('⚠️  Primary database setup failed, attempting recovery...');
    
    if (config.env === 'production') {
      // In production, be more cautious with recovery
      if (primaryResult.shouldContinue) {
        logger.warn('🔧 Production mode: continuing with limited database functionality');
        setupResult.canContinue = true;
        setupResult.degradedMode = true;
        serverState.databaseReady = false;
        serverState.databaseIssues = setupResult.issues;
        return setupResult;
      } else {
        throw new Error('Critical database failure in production - cannot continue');
      }
    }

    // Development mode - attempt emergency recovery
    logger.info('🚑 Development mode: attempting emergency database recovery');
    const recoveryResult = await attemptDatabaseRecovery();
    
    setupResult.recoveryAttempted = true;
    
    if (recoveryResult.success) {
      logger.info('✅ Emergency database recovery successful');
      setupResult.success = true;
      setupResult.canContinue = true;
      setupResult.issues.push('Database recovered after initial failure');
      serverState.databaseReady = true;
    } else {
      logger.warn('⚠️  Emergency recovery failed, continuing with limited functionality');
      setupResult.canContinue = true;
      setupResult.degradedMode = true;
      setupResult.issues.push('Database recovery failed - running in degraded mode');
      serverState.databaseReady = false;
      serverState.databaseIssues = setupResult.issues;
    }

    return setupResult;

  } catch (error) {
    setupResult.issues.push(error.message);
    
    if (config.env === 'production') {
      logger.error('❌ Critical database error in production:', error);
      throw error;
    } else {
      logger.warn('⚠️  Database error in development, attempting to continue:', error);
      setupResult.canContinue = true;
      setupResult.degradedMode = true;
      serverState.databaseReady = false;
      serverState.databaseIssues = setupResult.issues;
      return setupResult;
    }
  }
}

/**
 * Attempt database recovery with comprehensive error handling
 */
async function attemptDatabaseRecovery() {
  try {
    logger.info('🚑 Starting comprehensive database recovery process');
    
    const recoveryResult = await performEmergencyRecovery();
    
    if (recoveryResult.success) {
      logger.info('✅ Database recovery completed successfully');
      logger.info('🔧 Recovery actions taken:', recoveryResult.actions);
    } else {
      logger.warn('⚠️  Database recovery completed with issues');
      logger.warn('🔧 Recovery actions taken:', recoveryResult.actions);
      logger.warn('❌ Recovery errors:', recoveryResult.errors);
    }
    
    return recoveryResult;
  } catch (error) {
    logger.error('❌ Database recovery attempt failed:', error);
    return { 
      success: false, 
      actions: [], 
      errors: [error.message] 
    };
  }
}

/**
 * Initialize WebSocket server with enhanced error handling
 */
async function initializeWebSocketServer(server) {
  if (config.websocket?.enabled === false) {
    logger.info('📋 WebSocket support is disabled in configuration');
    return;
  }

  try {
    logger.info('🔌 Initializing WebSocket server...');
    
    websocket.initialize(server, {
      path: '/ws',
      pingInterval: config.websocket?.pingInterval || 30000,
      pingTimeout: config.websocket?.pingTimeout || 10000,
      maxPayload: config.websocket?.maxPayload || 100 * 1024
    });
    
    serverState.websocketReady = true;
    logger.info('✅ WebSocket server initialized successfully');
  } catch (wsError) {
    logger.error('❌ WebSocket initialization failed:', wsError.message);
    logger.warn('⚠️  Continuing without WebSocket support');
    serverState.websocketReady = false;
  }
}

/**
 * Initialize subsystems with comprehensive fallback handling
 */
async function initializeSubsystemsWithFallback() {
  logger.info('🔧 Initializing subsystems with fallback handling');

  const subsystemResults = {
    workers: false,
    other: false
  };

  // Initialize workers with proper error handling
  if (config.env !== 'test') {
    try {
      logger.info('🔄 Initializing background workers...');
      
      // Check if database is ready before initializing workers
      if (serverState.databaseReady) {
        workers.initializeWorkers();
        subsystemResults.workers = true;
        serverState.workersReady = true;
        logger.info('✅ Background workers initialized successfully');
      } else {
        logger.warn('⚠️  Database not ready, initializing workers in limited mode');
        // Initialize workers in limited mode without database-dependent features
        try {
          workers.initializeWorkers({ limitedMode: true });
          subsystemResults.workers = true;
          serverState.workersReady = true;
          logger.info('✅ Background workers initialized in limited mode');
        } catch (limitedError) {
          logger.error('❌ Failed to initialize workers even in limited mode:', limitedError.message);
          subsystemResults.workers = false;
        }
      }
    } catch (error) {
      logger.error('❌ Worker initialization failed:', error.message);
      subsystemResults.workers = false;
      
      if (config.env === 'production') {
        logger.warn('⚠️  Production server continuing without workers - some features may be limited');
      } else {
        logger.warn('⚠️  Development server continuing without workers');
      }
    }
  } else {
    logger.info('📋 Test environment detected, skipping worker initialization');
    subsystemResults.workers = true; // Consider skipped as successful in test
  }

  // Initialize other subsystems here as needed
  // Each should have individual error handling
  
  logger.info('📊 Subsystem initialization completed:', subsystemResults);
}

/**
 * Start health monitoring with enhanced configuration
 */
function startHealthMonitoring() {
  if (!config.monitoring?.enabled) {
    logger.info('📊 Health monitoring is disabled');
    return;
  }

  try {
    logger.info('📊 Starting enhanced system health monitoring');
    
    // Start system monitoring
    monitorSystemHealth(config.monitoring.interval || 60000);
    
    // Start database-specific monitoring
    startDatabaseHealthMonitoring();
    
    serverState.healthMonitoringActive = true;
    logger.info('✅ Health monitoring started successfully');
  } catch (error) {
    logger.error('❌ Failed to start health monitoring:', error.message);
    // Continue without monitoring - not critical
  }
}

/**
 * Enhanced database health monitoring
 */
function startDatabaseHealthMonitoring() {
  const dbHealthInterval = config.monitoring?.databaseInterval || 300000; // 5 minutes default

  setInterval(async () => {
    try {
      // Only monitor if database was initially ready
      if (!serverState.databaseReady && serverState.databaseIssues.length === 0) {
        return;
      }

      const healthStatus = await getDatabaseHealth();
      
      if (healthStatus.database?.status === 'error') {
        logger.warn('⚠️  Database health check detected issues:', {
          status: healthStatus.database?.status,
          error: healthStatus.database?.details?.error
        });

        // If database was previously working, attempt recovery
        if (serverState.databaseReady) {
          logger.info('🔧 Database was previously working, attempting automatic recovery');
          const recoveryResult = await attemptDatabaseRecovery();
          
          if (recoveryResult.success) {
            logger.info('✅ Automatic database recovery successful');
            serverState.databaseReady = true;
            serverState.databaseIssues = [];
          } else {
            logger.warn('⚠️  Automatic database recovery failed');
            serverState.databaseReady = false;
            serverState.databaseIssues = recoveryResult.errors || [];
          }
        }
      } else if (healthStatus.database?.status === 'healthy' && !serverState.databaseReady) {
        logger.info('✅ Database health restored');
        serverState.databaseReady = true;
        serverState.databaseIssues = [];
      }
    } catch (error) {
      logger.debug('Database health monitoring error:', error.message);
    }
  }, dbHealthInterval);
}

/**
 * Schedule post-startup recovery for persistent database issues
 */
function schedulePostStartupRecovery() {
  logger.info('⏰ Scheduling post-startup database health recovery');

  // Initial recovery attempt after 30 seconds
  setTimeout(async () => {
    try {
      logger.info('🔍 Performing scheduled post-startup database health check');
      
      const healthStatus = await getDatabaseHealth();
      
      if (healthStatus.database?.status === 'error' || healthStatus.models?.status === 'error') {
        logger.warn('⚠️  Post-startup health check detected database issues');
        
        const recoveryResult = await attemptDatabaseRecovery();
        if (recoveryResult.success) {
          logger.info('✅ Post-startup database recovery successful');
          serverState.databaseReady = true;
          serverState.databaseIssues = [];
        } else {
          logger.warn('⚠️  Post-startup database recovery failed');
          serverState.databaseIssues = recoveryResult.errors || [];
        }
      } else {
        logger.info('✅ Post-startup database health check passed');
        serverState.databaseReady = true;
        serverState.databaseIssues = [];
      }
    } catch (error) {
      logger.warn('⚠️  Post-startup health check failed:', error.message);
    }
  }, 30000);

  // Additional periodic checks for the first hour
  const healthCheckInterval = setInterval(async () => {
    try {
      if (serverState.databaseReady) {
        logger.info('✅ Database health fully restored - stopping additional checks');
        clearInterval(healthCheckInterval);
        return;
      }

      const healthStatus = await getDatabaseHealth();
      
      if (healthStatus.database?.status === 'healthy' && 
          healthStatus.models?.status === 'healthy') {
        logger.info('✅ Database health fully restored during periodic check');
        clearInterval(healthCheckInterval);
        serverState.databaseReady = true;
        serverState.databaseIssues = [];
      }
    } catch (error) {
      logger.debug('Scheduled health check error:', error.message);
    }
  }, 300000); // 5 minutes

  // Stop additional checks after 1 hour
  setTimeout(() => {
    clearInterval(healthCheckInterval);
    logger.info('⏰ Stopped additional database health checks after 1 hour');
  }, 3600000);
}

/**
 * Create required directories
 */
async function ensureDirectories() {
  logger.info('📁 Ensuring required directories exist');

  const directories = [
    'logs',
    'uploads/audio',
    'uploads/csv',
    'uploads/photos',
    'uploads/temp',
    'src/templates/emails',
    'backups/database'
  ];

  for (const dir of directories) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.debug(`📁 Created directory: ${dir}`);
      }
    } catch (error) {
      logger.warn(`Failed to create directory ${dir}: ${error.message}`);
    }
  }
}

/**
 * Initialize email templates with error handling
 * @returns {Promise<void>}
 */
async function initializeTemplates() {
  logger.info('📧 Initializing email templates');

  try {
    const templatesDir = path.join(__dirname, 'templates');
    if (!fs.existsSync(templatesDir)) {
      logger.warn(`Email templates directory not found: ${templatesDir}`);
      return;
    }

    require('./templates');
    logger.info('✅ Email templates initialized successfully');
  } catch (error) {
    logger.warn(`Email template initialization error: ${error.message}`);
    logger.warn('⚠️  Continuing without email templates');
  }
}

/**
 * Set up comprehensive global error handlers
 */
function setupGlobalErrorHandlers() {
  logger.info('🛡️  Setting up global error handlers');

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('🚨 UNCAUGHT EXCEPTION! Shutting down...', {
      name: err.name,
      message: err.message,
      stack: err.stack?.substring(0, 1000) + '...'
    });

    // Give logging time to complete
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    const reasonStr = reason instanceof Error ? reason.message : String(reason);
    logger.error('🚨 UNHANDLED REJECTION!', {
      promise: promise.toString().substring(0, 200) + '...',
      reason: reasonStr.substring(0, 200) + '...'
    });

    // In production, exit on unhandled rejections
    if (config.env === 'production') {
      logger.error('🚨 Unhandled rejection in production - shutting down');
      setTimeout(() => {
        process.exit(1);
      }, 1000);
    }
  });

  // Handle warnings
  process.on('warning', (warning) => {
    if (warning.name === 'MaxListenersExceededWarning' || 
        warning.name === 'DeprecationWarning') {
      logger.debug(`Node.js Warning: ${warning.name}`, {
        message: warning.message
      });
    } else {
      logger.warn(`Node.js Warning: ${warning.name}`, {
        message: warning.message,
        stack: warning.stack?.substring(0, 500)
      });
    }
  });
}

/**
 * Start HTTP server with enhanced error handling
 */
function startHttpServer(server) {
  return new Promise((resolve, reject) => {
    try {
      const port = normalizePort(config.port || 3000);

      server.listen(port, () => {
        const addr = server.address();
        const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        logger.info(`🌐 HTTP server listening on ${bind}`);
        resolve(server);
      });

      // Enhanced error handling
      server.on('error', (error) => {
        handleServerError(error, port, server, resolve, reject);
      });

      // Handle connections
      server.on('connection', (socket) => {
        socket.setTimeout(config.server?.socketTimeout || 120000);
      });

      // Handle client errors
      server.on('clientError', (err, socket) => {
        logger.debug('Client error:', err.message);
        if (!socket.destroyed) {
          socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
        }
      });

    } catch (error) {
      logger.error('❌ Failed to start HTTP server:', error.message);
      reject(error);
    }
  });
}

/**
 * Normalize port value
 */
function normalizePort(val) {
  const port = parseInt(val, 10);
  return isNaN(port) ? val : (port >= 0 ? port : false);
}

/**
 * Enhanced server error handling
 */
function handleServerError(error, port, server, resolve, reject) {
  if (error.syscall !== 'listen') {
    reject(error);
    return;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  switch (error.code) {
    case 'EACCES':
      logger.error(`❌ ${bind} requires elevated privileges`);
      reject(error);
      break;

    case 'EADDRINUSE':
      logger.error(`❌ ${bind} is already in use`);
      
      if (config.env !== 'production') {
        logger.info('🔄 Attempting to use alternative port in development');
        const newPort = typeof port === 'number' ? port + 1 : 3001;
        
        server.removeAllListeners('error');
        server.removeAllListeners('listening');
        
        server.listen(newPort);
        
        server.on('listening', () => {
          const addr = server.address();
          logger.info(`✅ Server listening on alternative port ${addr.port}`);
          resolve(server);
        });
        
        server.on('error', (retryError) => {
          logger.error('❌ Failed to bind to alternative port:', retryError.message);
          reject(retryError);
        });
      } else {
        reject(error);
      }
      break;

    default:
      reject(error);
  }
}

/**
 * Set up graceful shutdown handlers
 */
function setupGracefulShutdown(server) {
  const gracefulShutdown = async (signal) => {
    if (serverState.gracefulShutdownInitiated) {
      logger.warn('⚠️  Graceful shutdown already in progress, forcing exit');
      process.exit(1);
    }

    serverState.gracefulShutdownInitiated = true;
    logger.info(`🔄 ${signal} received, initiating graceful shutdown...`);

    let exitCode = 0;
    const shutdownSteps = [];

    const forceExitTimeout = setTimeout(() => {
      logger.error('⏰ Graceful shutdown timed out after 30 seconds, forcing exit');
      process.exit(1);
    }, 30000);

    try {
      // Close HTTP server
      if (server && serverState.server) {
        await new Promise((resolve, reject) => {
          server.close((err) => {
            if (err) {
              logger.error('❌ Error closing HTTP server:', err.message);
              exitCode = 1;
              reject(err);
            } else {
              logger.info('✅ HTTP server closed');
              shutdownSteps.push('HTTP server closed');
              resolve();
            }
          });
        });
      }

      // Close WebSocket server
      if (websocket.isInitialized && websocket.isInitialized() && serverState.websocketReady) {
        try {
          await websocket.close();
          logger.info('✅ WebSocket server closed');
          shutdownSteps.push('WebSocket server closed');
        } catch (wsError) {
          logger.error('❌ Error closing WebSocket server:', wsError.message);
          exitCode = 1;
        }
      }

      // Shutdown workers
      if (workers.shutdown && serverState.workersReady) {
        try {
          logger.info('🔄 Shutting down background workers...');
          await workers.shutdown();
          logger.info('✅ Background workers shut down');
          shutdownSteps.push('Background workers stopped');
        } catch (workerError) {
          logger.error('❌ Error shutting down workers:', workerError.message);
          exitCode = 1;
        }
      }

      // Close database connections
      if (db.sequelize && serverState.databaseReady) {
        try {
          logger.info('🔄 Closing database connections...');
          await db.sequelize.close();
          logger.info('✅ Database connections closed');
          shutdownSteps.push('Database connections closed');
        } catch (dbError) {
          logger.error('❌ Error closing database connections:', dbError.message);
          exitCode = 1;
        }
      }

      clearTimeout(forceExitTimeout);

      logger.info('✅ Graceful shutdown completed successfully');
      logger.info('📋 Shutdown steps completed:', shutdownSteps);
      
      await gracefulExit(exitCode);

    } catch (error) {
      logger.error('❌ Error during graceful shutdown:', error.message);
      clearTimeout(forceExitTimeout);
      await gracefulExit(1);
    }
  };

  // Handle termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  if (config.env === 'production') {
    process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));
    process.on('SIGQUIT', () => gracefulShutdown('SIGQUIT'));
  }
}

/**
 * Log successful startup with comprehensive status
 */
function logSuccessfulStartup(server, dbSetupResult) {
  const addr = server.address();
  const port = typeof addr === 'string' ? addr : addr.port;
  const startupDuration = Date.now() - serverState.startupTime;

  logger.info('======================================================');
  logger.info('🚀 JayLink SMS Platform started successfully!');
  logger.info('======================================================');
  
  // Basic info
  logger.info(`🌐 Environment: ${config.env}`);
  logger.info(`🔌 Server port: ${port}`);
  logger.info(`🌐 API URL: ${config.apiUrl || `http://localhost:${port}`}`);
  logger.info(`🖥️  Frontend URL: ${config.frontendUrl || 'http://localhost:8080'}`);
  logger.info(`⏱️  Startup time: ${startupDuration}ms`);
  
  // Service statuses
  logger.info('📊 Service Status:');
  logger.info(`   • Database: ${serverState.databaseReady ? '✅ Ready' : '⚠️  Limited'}`);
  logger.info(`   • WebSocket: ${serverState.websocketReady ? '✅ Ready' : '❌ Disabled'}`);
  logger.info(`   • Workers: ${serverState.workersReady ? '✅ Ready' : '⚠️  Limited'}`);
  logger.info(`   • Health Monitoring: ${serverState.healthMonitoringActive ? '✅ Active' : '❌ Disabled'}`);
  
  // Database issues if any
  if (!dbSetupResult.fullyHealthy && dbSetupResult.issues && dbSetupResult.issues.length > 0) {
    logger.info('⚠️  Database Issues:');
    dbSetupResult.issues.forEach(issue => {
      logger.info(`   • ${issue}`);
    });
  }
  
  // System resources
  const memoryUsage = process.memoryUsage();
  logger.info('🧠 Memory Usage:');
  logger.info(`   • RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`);
  logger.info(`   • Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);
  logger.info(`   • Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
  
  // Configuration
  logger.info(`💰 Currency: ${config.currency?.name || 'Naira'} (${config.currency?.code || 'NGN'})`);
  
  if (config.env === 'development') {
    logger.info('🔧 Development Features:');
    logger.info(`   • Auto-recovery: ${config.autoRecovery?.enabled ? 'Enabled' : 'Disabled'}`);
    logger.info('   • Hot reload: Available');
  }
  
  logger.info('======================================================');
  
  // Recommendations
  if (!dbSetupResult.fullyHealthy || serverState.databaseIssues.length > 0) {
    logger.warn('💡 Recommendations:');
    logger.warn('   • Monitor database health via /api/health endpoint');
    logger.warn('   • Check database logs for any ongoing issues');
    if (dbSetupResult.recoveryAttempted) {
      logger.warn('   • Database recovery was attempted - verify all features work correctly');
    }
  }
}

/**
 * Enhanced graceful exit
 */
async function gracefulExit(code) {
  if (code === 0) {
    logger.info('🎯 Server shutdown completed successfully');
  } else {
    logger.error(`❌ Server shutdown completed with errors (exit code: ${code})`);
  }

  // Allow time for logs to flush
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  process.exit(code);
}

/**
 * Get current server status
 */
function getServerStatus() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    version: process.version,
    environment: config.env,
    startupTime: serverState.startupTime,
    services: {
      database: serverState.databaseReady,
      websocket: serverState.websocketReady,
      workers: serverState.workersReady,
      healthMonitoring: serverState.healthMonitoringActive,
    },
    databaseIssues: serverState.databaseIssues,
    gracefulShutdownInitiated: serverState.gracefulShutdownInitiated,
  };
}

/**
 * Perform comprehensive health check
 */
async function performHealthCheck() {
  const healthResult = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    server: getServerStatus(),
    database: null,
    issues: []
  };

  try {
    // Check database health if it was initially ready
    if (serverState.databaseReady) {
      healthResult.database = await getDatabaseHealth();
      
      if (healthResult.database.database?.status === 'error') {
        healthResult.status = 'unhealthy';
        healthResult.issues.push('Database connection failed');
      }
    } else if (serverState.databaseIssues.length > 0) {
      healthResult.status = 'degraded';
      healthResult.issues.push('Database running in degraded mode');
      healthResult.database = { 
        status: 'degraded', 
        issues: serverState.databaseIssues 
      };
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    
    if (heapUsedPercent > 90) {
      healthResult.status = 'critical';
      healthResult.issues.push('Critical memory usage detected');
    } else if (heapUsedPercent > 75) {
      if (healthResult.status === 'healthy') {
        healthResult.status = 'degraded';
      }
      healthResult.issues.push('High memory usage detected');
    }

  } catch (error) {
    healthResult.status = 'unhealthy';
    healthResult.issues.push(`Health check failed: ${error.message}`);
  }

  return healthResult;
}

// Export functions
module.exports = { 
  startServer,
  getServerStatus,
  performHealthCheck,
  serverState
};

// Start server if this file is run directly
if (require.main === module) {
  startServer().catch((err) => {
    logger.error('❌ Failed to start server:', err.message);
    process.exit(1);
  });
}