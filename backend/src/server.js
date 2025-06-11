// backend/src/server.js - PRODUCTION OPTIMIZED VERSION
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
 * Production-optimized server state management
 */
const serverState = {
  server: null,
  databaseReady: false,
  websocketReady: false,
  workersReady: false,
  healthMonitoringActive: false,
  gracefulShutdownInitiated: false,
  startupTime: Date.now(),
  databaseIssues: [],
  isProduction: config.env === 'production',
  isRailway: !!(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.DATABASE_URL),
  retryCount: 0,
  maxRetries: 3
};

/**
 * Production-optimized server startup
 */
async function startServer() {
  let server;

  try {
    logger.info(`🚀 Starting JayLink SMS Platform (${config.env} environment)`);
    logger.info(`📊 Platform: ${process.platform} (${process.arch})`);
    logger.info(`🔧 Node.js: ${process.version}`);
    
    if (serverState.isRailway) {
      logger.info(`🚂 Railway deployment detected`);
    }

    // Step 1: Ensure required directories
    await ensureDirectoriesProduction();

    // Step 2: Initialize email templates (non-blocking)
    await initializeTemplatesSafely();

    // Step 3: Set up production-safe error handlers
    setupProductionErrorHandlers();

    // Step 4: Production-optimized database setup
    const dbSetupResult = await setupDatabaseProduction();
    
    // Step 5: Create HTTP server early
    server = http.createServer(app);
    serverState.server = server;

    // Step 6: Initialize WebSocket (with fallback)
    await initializeWebSocketSafely(server);

    // Step 7: Initialize subsystems (production-safe)
    await initializeSubsystemsProduction();

    // Step 8: Start health monitoring (if enabled)
    startHealthMonitoringProduction();

    // Step 9: Start HTTP server with retry logic
    await startHttpServerProduction(server);

    // Step 10: Setup graceful shutdown
    setupProductionGracefulShutdown(server);

    // Step 11: Log startup success
    logProductionStartupSuccess(server, dbSetupResult);

    // Step 12: Post-startup health check
    schedulePostStartupChecks();

    return server;

  } catch (error) {
    logger.error('❌ Critical server startup failure:', error);
    
    // Production retry logic
    if (serverState.isProduction && serverState.retryCount < serverState.maxRetries) {
      serverState.retryCount++;
      logger.warn(`⚠️  Retrying server startup (attempt ${serverState.retryCount}/${serverState.maxRetries})`);
      
      // Clean up before retry
      if (server) {
        try { server.close(); } catch (e) { /* ignore */ }
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 5000));
      return startServer();
    }
    
    // Cleanup and exit
    if (server) {
      try { server.close(); } catch (e) { /* ignore */ }
    }
    
    await gracefulExit(1);
  }
}

/**
 * Production-safe database setup
 */
async function setupDatabaseProduction() {
  logger.info('🔗 Starting production-safe database setup');

  const setupResult = {
    success: false,
    fullyHealthy: false,
    canContinue: false,
    issues: [],
    isProduction: serverState.isProduction
  };

  try {
    // Test connection first
    const connectionTest = await testDatabaseConnection();
    if (!connectionTest.success) {
      throw new Error(`Database connection failed: ${connectionTest.error}`);
    }

    // Attempt database setup
    const primaryResult = await setupDatabase();
    
    setupResult.success = primaryResult.success;
    setupResult.canContinue = primaryResult.shouldContinue;
    setupResult.fullyHealthy = primaryResult.fullyHealthy;
    setupResult.issues = [...(primaryResult.errors || []), ...(primaryResult.warnings || [])];

    if (primaryResult.success) {
      logger.info('✅ Database setup completed successfully');
      serverState.databaseReady = true;
    } else if (primaryResult.shouldContinue) {
      logger.warn('⚠️  Database setup completed with issues - continuing in degraded mode');
      serverState.databaseReady = false;
      serverState.databaseIssues = setupResult.issues;
    } else {
      throw new Error('Critical database setup failure');
    }

    return setupResult;

  } catch (error) {
    logger.error('❌ Database setup failed:', error.message);
    
    // In production, try emergency recovery
    if (serverState.isProduction) {
      logger.info('🚑 Attempting emergency database recovery');
      
      try {
        const recoveryResult = await performEmergencyRecovery();
        if (recoveryResult.success) {
          logger.info('✅ Emergency recovery successful');
          setupResult.success = true;
          setupResult.canContinue = true;
          setupResult.issues.push('Recovered from initial failure');
          serverState.databaseReady = true;
        } else {
          logger.warn('⚠️  Emergency recovery failed - continuing in minimal mode');
          setupResult.canContinue = true;
          setupResult.issues.push('Emergency recovery failed');
          serverState.databaseReady = false;
        }
      } catch (recoveryError) {
        logger.error('❌ Emergency recovery failed:', recoveryError.message);
        setupResult.canContinue = true;
        setupResult.issues.push(`Recovery failed: ${recoveryError.message}`);
        serverState.databaseReady = false;
      }
    } else {
      throw error;
    }

    return setupResult;
  }
}

/**
 * Test database connection with production handling
 */
async function testDatabaseConnection() {
  try {
    logger.info('🔍 Testing database connection...');
    
    // Use the database config test function
    const dbConfig = require('./config/database');
    const testResult = await dbConfig.testConnection();
    
    if (testResult.success) {
      logger.info(`✅ Database connection test passed (${testResult.connectionTime}ms)`);
    } else {
      logger.error(`❌ Database connection test failed: ${testResult.error}`);
    }
    
    return testResult;
  } catch (error) {
    logger.error('❌ Database connection test error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Production-safe directory creation
 */
async function ensureDirectoriesProduction() {
  logger.info('📁 Ensuring required directories exist');

  const directories = [
    'logs',
    'uploads/audio',
    'uploads/csv', 
    'uploads/photos',
    'uploads/temp',
    'backups/database'
  ];

  for (const dir of directories) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.debug(`📁 Created: ${dir}`);
      }
    } catch (error) {
      // In production, log but don't fail
      if (serverState.isProduction) {
        logger.warn(`Failed to create directory ${dir}: ${error.message}`);
      } else {
        throw error;
      }
    }
  }
}

/**
 * Production-safe template initialization
 */
async function initializeTemplatesSafely() {
  logger.info('📧 Initializing email templates');

  try {
    const templatesDir = path.join(__dirname, 'templates');
    if (fs.existsSync(templatesDir)) {
      require('./templates');
      logger.info('✅ Email templates initialized');
    } else {
      logger.warn('⚠️  Email templates directory not found - continuing without templates');
    }
  } catch (error) {
    logger.warn(`Email template initialization failed: ${error.message}`);
    // Continue in production
    if (!serverState.isProduction) {
      throw error;
    }
  }
}

/**
 * Production-optimized error handlers
 */
function setupProductionErrorHandlers() {
  logger.info('🛡️  Setting up production error handlers');

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('🚨 UNCAUGHT EXCEPTION:', {
      name: err.name,
      message: err.message,
      stack: serverState.isProduction ? err.stack?.substring(0, 500) : err.stack
    });

    // In production, try to continue for 5 seconds to allow logging
    if (serverState.isProduction) {
      setTimeout(() => {
        logger.error('🚨 Exiting due to uncaught exception');
        process.exit(1);
      }, 5000);
    } else {
      process.exit(1);
    }
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    const reasonStr = reason instanceof Error ? reason.message : String(reason);
    logger.error('🚨 UNHANDLED REJECTION:', {
      reason: reasonStr.substring(0, 200),
      location: promise.toString().substring(0, 100)
    });

    // In production, be more forgiving but log
    if (serverState.isProduction) {
      logger.warn('⚠️  Continuing after unhandled rejection in production');
    } else {
      setTimeout(() => process.exit(1), 1000);
    }
  });

  // Handle warnings (less verbose in production)
  process.on('warning', (warning) => {
    if (serverState.isProduction) {
      // Only log important warnings in production
      if (warning.name === 'MaxListenersExceededWarning' || 
          warning.name === 'TimeoutOverflowWarning') {
        logger.warn(`Node.js Warning: ${warning.name} - ${warning.message}`);
      }
    } else {
      logger.debug(`Node.js Warning: ${warning.name}`, { message: warning.message });
    }
  });
}

/**
 * Production-safe WebSocket initialization
 */
async function initializeWebSocketSafely(server) {
  if (config.websocket?.enabled === false) {
    logger.info('📋 WebSocket disabled in configuration');
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
    logger.info('✅ WebSocket server initialized');
  } catch (wsError) {
    logger.error('❌ WebSocket initialization failed:', wsError.message);
    
    // In production, continue without WebSocket
    if (serverState.isProduction) {
      logger.warn('⚠️  Continuing without WebSocket in production');
      serverState.websocketReady = false;
    } else {
      throw wsError;
    }
  }
}

/**
 * Production-safe subsystem initialization
 */
async function initializeSubsystemsProduction() {
  logger.info('🔧 Initializing subsystems (production-safe)');

  const subsystemResults = { workers: false };

  // Initialize workers with proper error handling
  if (config.env !== 'test') {
    try {
      logger.info('🔄 Initializing background workers...');
      
      // Initialize with production-safe options
      const workerOptions = {
        limitedMode: !serverState.databaseReady,
        skipDatabaseWorkers: !serverState.databaseReady,
        productionMode: serverState.isProduction
      };
      
      workers.initializeWorkers(workerOptions);
      subsystemResults.workers = true;
      serverState.workersReady = true;
      
      logger.info('✅ Background workers initialized');
    } catch (error) {
      logger.error('❌ Worker initialization failed:', error.message);
      
      // In production, continue without workers
      if (serverState.isProduction) {
        logger.warn('⚠️  Continuing without background workers in production');
        subsystemResults.workers = false;
      } else {
        throw error;
      }
    }
  } else {
    logger.info('📋 Test environment - skipping worker initialization');
    subsystemResults.workers = true;
  }

  logger.info('📊 Subsystem initialization results:', subsystemResults);
}

/**
 * Production-safe health monitoring
 */
function startHealthMonitoringProduction() {
  if (!config.monitoring?.enabled) {
    logger.info('📊 Health monitoring disabled');
    return;
  }

  try {
    logger.info('📊 Starting production health monitoring');
    
    // Use longer intervals in production
    const interval = serverState.isProduction ? 120000 : 60000; // 2 minutes vs 1 minute
    
    monitorSystemHealth(interval);
    serverState.healthMonitoringActive = true;
    
    logger.info(`✅ Health monitoring started (${interval}ms interval)`);
  } catch (error) {
    logger.error('❌ Health monitoring failed to start:', error.message);
    // Continue without monitoring
  }
}

/**
 * Production-optimized HTTP server startup
 */
function startHttpServerProduction(server) {
  return new Promise((resolve, reject) => {
    try {
      const port = normalizePort(config.port || 3000);

      server.listen(port, () => {
        const addr = server.address();
        const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        logger.info(`🌐 HTTP server listening on ${bind}`);
        resolve(server);
      });

      // Production-optimized error handling
      server.on('error', (error) => {
        handleServerErrorProduction(error, port, server, resolve, reject);
      });

      // Production connection handling
      server.on('connection', (socket) => {
        // Set production-appropriate timeouts
        const timeout = serverState.isProduction ? 300000 : 120000; // 5 minutes vs 2 minutes
        socket.setTimeout(timeout);
        
        socket.on('timeout', () => {
          logger.debug('Socket timeout - closing connection');
          socket.destroy();
        });
      });

      // Handle client errors gracefully
      server.on('clientError', (err, socket) => {
        logger.debug(`Client error: ${err.message}`);
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
 * Production-safe server error handling
 */
function handleServerErrorProduction(error, port, server, resolve, reject) {
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
      
      // In production on Railway, don't try alternative ports
      if (serverState.isProduction || serverState.isRailway) {
        reject(error);
      } else {
        // Development fallback
        const newPort = typeof port === 'number' ? port + 1 : 3001;
        logger.info(`🔄 Trying alternative port ${newPort}`);
        
        server.removeAllListeners('error');
        server.removeAllListeners('listening');
        
        server.listen(newPort);
        server.on('listening', () => {
          logger.info(`✅ Server listening on alternative port ${newPort}`);
          resolve(server);
        });
        server.on('error', reject);
      }
      break;

    default:
      reject(error);
  }
}

/**
 * Normalize port value
 */
function normalizePort(val) {
  const port = parseInt(val, 10);
  return isNaN(port) ? val : (port >= 0 ? port : false);
}

/**
 * Production-safe graceful shutdown
 */
function setupProductionGracefulShutdown(server) {
  const gracefulShutdown = async (signal) => {
    if (serverState.gracefulShutdownInitiated) {
      logger.warn('⚠️  Shutdown already in progress, forcing exit');
      process.exit(1);
    }

    serverState.gracefulShutdownInitiated = true;
    logger.info(`🔄 ${signal} received - starting graceful shutdown`);

    // Shorter timeout for production
    const shutdownTimeout = serverState.isProduction ? 15000 : 30000;
    
    const forceExit = setTimeout(() => {
      logger.error(`⏰ Shutdown timeout (${shutdownTimeout}ms) - forcing exit`);
      process.exit(1);
    }, shutdownTimeout);

    try {
      let exitCode = 0;

      // Stop accepting new connections
      if (server && serverState.server) {
        await new Promise((resolve) => {
          server.close((err) => {
            if (err) {
              logger.error('❌ Error closing HTTP server:', err.message);
              exitCode = 1;
            } else {
              logger.info('✅ HTTP server closed');
            }
            resolve();
          });
        });
      }

      // Close WebSocket server
      if (websocket.isInitialized && websocket.isInitialized() && serverState.websocketReady) {
        try {
          await websocket.close();
          logger.info('✅ WebSocket server closed');
        } catch (wsError) {
          logger.error('❌ WebSocket close error:', wsError.message);
          exitCode = 1;
        }
      }

      // Shutdown workers
      if (workers.shutdown && serverState.workersReady) {
        try {
          await workers.shutdown();
          logger.info('✅ Workers shut down');
        } catch (workerError) {
          logger.error('❌ Worker shutdown error:', workerError.message);
          exitCode = 1;
        }
      }

      // Close database connections
      if (db.sequelize && serverState.databaseReady) {
        try {
          await db.sequelize.close();
          logger.info('✅ Database connections closed');
        } catch (dbError) {
          logger.error('❌ Database close error:', dbError.message);
          exitCode = 1;
        }
      }

      clearTimeout(forceExit);
      logger.info('✅ Graceful shutdown completed');
      
      await gracefulExit(exitCode);

    } catch (error) {
      logger.error('❌ Shutdown error:', error.message);
      clearTimeout(forceExit);
      await gracefulExit(1);
    }
  };

  // Handle termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Production-specific signals
  if (serverState.isProduction) {
    process.on('SIGHUP', () => gracefulShutdown('SIGHUP'));
  }
}

/**
 * Log production startup success
 */
function logProductionStartupSuccess(server, dbSetupResult) {
  const addr = server.address();
  const port = typeof addr === 'string' ? addr : addr.port;
  const startupDuration = Date.now() - serverState.startupTime;

  logger.info('======================================================');
  logger.info('🚀 JayLink SMS Platform started successfully!');
  logger.info('======================================================');
  
  logger.info(`🌐 Environment: ${config.env}`);
  logger.info(`🔌 Server port: ${port}`);
  logger.info(`⏱️  Startup time: ${startupDuration}ms`);
  
  if (serverState.isRailway) {
    logger.info(`🚂 Railway deployment: Active`);
  }
  
  logger.info('📊 Service Status:');
  logger.info(`   • Database: ${serverState.databaseReady ? '✅ Ready' : '⚠️  Degraded'}`);
  logger.info(`   • WebSocket: ${serverState.websocketReady ? '✅ Ready' : '❌ Disabled'}`);
  logger.info(`   • Workers: ${serverState.workersReady ? '✅ Ready' : '⚠️  Limited'}`);
  logger.info(`   • Health Monitoring: ${serverState.healthMonitoringActive ? '✅ Active' : '❌ Disabled'}`);
  
  if (dbSetupResult.issues && dbSetupResult.issues.length > 0) {
    logger.warn('⚠️  Startup Issues:');
    dbSetupResult.issues.slice(0, 3).forEach(issue => {
      logger.warn(`   • ${issue}`);
    });
  }
  
  const memoryUsage = process.memoryUsage();
  logger.info('🧠 Memory Usage:');
  logger.info(`   • RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`);
  logger.info(`   • Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);
  
  logger.info('======================================================');
}

/**
 * Schedule post-startup health checks
 */
function schedulePostStartupChecks() {
  // Initial health check after 30 seconds
  setTimeout(async () => {
    try {
      logger.info('🔍 Running post-startup health check');
      
      const health = await getDatabaseHealth();
      if (health.database?.status === 'healthy') {
        logger.info('✅ Post-startup health check passed');
        if (!serverState.databaseReady) {
          logger.info('✅ Database health restored');
          serverState.databaseReady = true;
          serverState.databaseIssues = [];
        }
      } else {
        logger.warn('⚠️  Post-startup health check detected issues');
      }
    } catch (error) {
      logger.warn('⚠️  Post-startup health check failed:', error.message);
    }
  }, 30000);
}

/**
 * Enhanced graceful exit
 */
async function gracefulExit(code) {
  const exitMessage = code === 0 ? 
    '✅ Server shutdown completed successfully' : 
    `❌ Server shutdown with errors (code: ${code})`;
  
  logger.info(exitMessage);
  
  // Allow time for logs to flush
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  process.exit(code);
}

/**
 * Get current server status
 */
function getServerStatus() {
  return {
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: config.env,
    isProduction: serverState.isProduction,
    isRailway: serverState.isRailway,
    startupTime: serverState.startupTime,
    retryCount: serverState.retryCount,
    services: {
      database: serverState.databaseReady,
      websocket: serverState.websocketReady,
      workers: serverState.workersReady,
      healthMonitoringActive,
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
    // Check database health
    if (serverState.databaseReady) {
      healthResult.database = await getDatabaseHealth();
      
      if (healthResult.database.database?.status === 'error') {
        healthResult.status = 'unhealthy';
        healthResult.issues.push('Database connection failed');
      }
    } else {
      healthResult.status = 'degraded';
      healthResult.issues.push('Database running in degraded mode');
      healthResult.database = { 
        status: 'degraded', 
        issues: serverState.databaseIssues 
      };
    }

    // Check memory usage with production-appropriate thresholds
    const memUsage = process.memoryUsage();
    const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
    const memoryThreshold = serverState.isProduction ? 85 : 75; // Higher threshold for production
    
    if (heapUsedPercent > 95) {
      healthResult.status = 'critical';
      healthResult.issues.push('Critical memory usage detected');
    } else if (heapUsedPercent > memoryThreshold) {
      if (healthResult.status === 'healthy') {
        healthResult.status = 'degraded';
      }
      healthResult.issues.push(`High memory usage: ${heapUsedPercent.toFixed(1)}%`);
    }

    // Check uptime (production servers should have longer uptime)
    const minUptime = serverState.isProduction ? 300 : 60; // 5 minutes for production
    if (process.uptime() < minUptime) {
      if (healthResult.status === 'healthy') {
        healthResult.status = 'degraded';
      }
      healthResult.issues.push('Recently restarted server');
    }

  } catch (error) {
    healthResult.status = 'unhealthy';
    healthResult.issues.push(`Health check failed: ${error.message}`);
  }

  return healthResult;
}

/**
 * Production-safe error recovery
 */
async function attemptErrorRecovery(error) {
  logger.warn('🔧 Attempting error recovery:', error.message);
  
  const recoveryActions = [];
  
  try {
    // Database connection recovery
    if (error.message.includes('database') || error.message.includes('connection')) {
      recoveryActions.push('database-reconnect');
      
      try {
        await testDatabaseConnection();
        logger.info('✅ Database connection recovered');
        serverState.databaseReady = true;
        serverState.databaseIssues = [];
      } catch (dbError) {
        logger.warn('⚠️  Database recovery failed:', dbError.message);
        serverState.databaseReady = false;
        serverState.databaseIssues.push(dbError.message);
      }
    }
    
    // Memory cleanup recovery
    if (error.message.includes('memory') || error.message.includes('heap')) {
      recoveryActions.push('memory-cleanup');
      
      try {
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
          logger.info('✅ Forced garbage collection');
        }
        
        // Clear any large caches or temporary data
        // This would be application-specific
        
      } catch (gcError) {
        logger.warn('⚠️  Memory cleanup failed:', gcError.message);
      }
    }
    
    return {
      success: recoveryActions.length > 0,
      actions: recoveryActions,
      message: `Recovery attempted: ${recoveryActions.join(', ')}`
    };
    
  } catch (recoveryError) {
    logger.error('❌ Error recovery failed:', recoveryError.message);
    return {
      success: false,
      actions: recoveryActions,
      error: recoveryError.message
    };
  }
}

/**
 * Monitor server health in production
 */
function startProductionHealthMonitor() {
  if (!serverState.isProduction) return;
  
  // Monitor critical metrics every 5 minutes in production
  const healthCheckInterval = setInterval(async () => {
    try {
      const health = await performHealthCheck();
      
      if (health.status === 'critical') {
        logger.error('🚨 CRITICAL health status detected:', health.issues);
        
        // Attempt automatic recovery
        if (health.issues.some(issue => issue.includes('memory'))) {
          await attemptErrorRecovery(new Error('Critical memory usage'));
        }
        
        if (health.issues.some(issue => issue.includes('database'))) {
          await attemptErrorRecovery(new Error('Database connection issue'));
        }
      } else if (health.status === 'unhealthy') {
        logger.warn('⚠️  Unhealthy server status:', health.issues);
      }
      
    } catch (error) {
      logger.error('❌ Health monitoring error:', error.message);
    }
  }, 300000); // 5 minutes
  
  // Store interval for cleanup
  serverState.healthCheckInterval = healthCheckInterval;
}

/**
 * Production-specific configuration validation
 */
function validateProductionConfig() {
  if (!serverState.isProduction) return true;
  
  const requiredEnvVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
  ];
  
  // Add database URL requirement for Railway
  if (serverState.isRailway) {
    requiredEnvVars.push('DATABASE_URL');
  } else {
    requiredEnvVars.push('DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME');
  }
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error(`❌ Missing required environment variables for production: ${missingVars.join(', ')}`);
    return false;
  }
  
  // Validate JWT secrets are not default values
  if (process.env.JWT_SECRET === 'your_jwt_secret_key' || 
      process.env.JWT_SECRET === 'your_jwt_secret_key_jaylink_dev') {
    logger.error('❌ JWT_SECRET is using default value in production');
    return false;
  }
  
  logger.info('✅ Production configuration validated');
  return true;
}

/**
 * Export functions and start server if run directly
 */
module.exports = { 
  startServer,
  getServerStatus,
  performHealthCheck,
  attemptErrorRecovery,
  validateProductionConfig,
  serverState
};

// Auto-start server if this file is run directly
if (require.main === module) {
  // Validate production configuration first
  if (!validateProductionConfig()) {
    logger.error('❌ Production configuration validation failed');
    process.exit(1);
  }
  
  // Start the server
  startServer()
    .then((server) => {
      logger.info('🎯 Server startup completed successfully');
      
      // Start production health monitoring
      startProductionHealthMonitor();
      
      // Log startup metrics
      const startupTime = Date.now() - serverState.startupTime;
      logger.info(`📊 Startup completed in ${startupTime}ms`);
      
    })
    .catch((err) => {
      logger.error('❌ Server startup failed:', err.message);
      
      // In production, try one more time with minimal configuration
      if (serverState.isProduction && serverState.retryCount === 0) {
        logger.warn('⚠️  Attempting minimal startup mode');
        
        // Set minimal mode flags
        process.env.WEBSOCKET_ENABLED = 'false';
        process.env.MONITORING_ENABLED = 'false';
        process.env.PUSH_NOTIFICATIONS_ENABLED = 'false';
        
        // Retry with minimal configuration
        setTimeout(() => {
          startServer().catch(() => {
            logger.error('❌ Minimal startup mode also failed');
            process.exit(1);
          });
        }, 5000);
      } else {
        process.exit(1);
      }
    });
}