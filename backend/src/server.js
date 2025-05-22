/**
 * JayLink SMS Platform
 * Enterprise-grade server initialization with WebSocket support
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
const { setupDatabase } = require('./utils/database-setup.util');
const { monitorSystemHealth } = require('./utils/monitoring.util');

/**
 * Application startup sequence
 * Orchestrates the entire server startup process with enhanced WebSocket support
 */
async function startServer() {
  let server;

  try {
    // Step 1: Log startup initiation
    logger.info(`Starting JayLink SMS Platform server (${config.env} environment)`);
    logger.info(`Node.js version: ${process.version}`);
    logger.info(`Platform: ${process.platform} (${process.arch})`);

    // Step 2: Ensure required directories exist
    await ensureDirectories();

    // Step 3: Initialize email templates
    await initializeTemplates();

    // Step 4: Set up global error handlers
    setupGlobalErrorHandlers();

    // Step 5: Setup database and schema
    const dbSuccess = await setupDatabase();

    // Only continue starting services if database setup was successful
    if (dbSuccess) {
      // Step 6: Create HTTP server before initializing Express app
      // This allows WebSockets to share the same server
      server = http.createServer(app);

      // Step 7: Initialize WebSocket server with the HTTP server
      if (config.websocket?.enabled !== false) {
        try {
          websocket.initialize(server, {
            path: '/ws',
            pingInterval: config.websocket?.pingInterval || 30000,
            pingTimeout: config.websocket?.pingTimeout || 10000,
            maxPayload: config.websocket?.maxPayload || 100 * 1024, // 100KB max payload
          });
          logger.info('WebSocket server initialized successfully');
        } catch (wsError) {
          logger.error('WebSocket initialization failed:', wsError);
          logger.warn('Continuing without WebSocket support');
        }
      } else {
        logger.info('WebSocket support is disabled in configuration');
      }

      // Step 8: Initialize subsystems
      await initializeSubsystems();

      // Step 9: Start health monitoring
      startHealthMonitoring();

      // Step 10: Start HTTP server
      await startHttpServer(server);

      // Step 11: Set up graceful shutdown handlers
      setupGracefulShutdown(server);

      // Step 12: Log successful startup
      logSuccessfulStartup(server);
    } else if (config.env === 'production') {
      logger.error('Failed to set up database in production mode, exiting');
      await gracefulExit(1);
    }
  } catch (error) {
    logger.error('Fatal error during server startup:', error);
    await gracefulExit(1);
  }

  return server;
}

/**
 * Create required directories for application
 * @returns {Promise<void>}
 */
async function ensureDirectories() {
  logger.info('Ensuring required directories exist');

  const directories = [
    'logs',
    'uploads/audio',
    'uploads/csv',
    'uploads/photos',
    'uploads/temp',
    'src/templates/emails',
  ];

  for (const dir of directories) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      }
    } catch (error) {
      logger.warn(`Failed to create directory ${dir}: ${error.message}`);
    }
  }
}

/**
 * Initialize email templates
 * @returns {Promise<void>}
 */
async function initializeTemplates() {
  logger.info('Initializing email templates');

  try {
    // Check if templates directory exists
    const templatesDir = path.join(__dirname, 'templates');
    if (!fs.existsSync(templatesDir)) {
      logger.warn(`Email templates directory not found: ${templatesDir}`);
      return;
    }

    // Import templates module
    require('./templates');
    logger.info('Email templates initialized successfully');
  } catch (error) {
    logger.warn(`Email template initialization error: ${error.message}`);
    logger.warn('Continuing without email templates');
  }
}

/**
 * Set up global error handlers
 */
function setupGlobalErrorHandlers() {
  logger.info('Setting up global error handlers');

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
    logger.error(err.name, err.message);
    logger.error(err.stack);

    // Give the logger time to write before exiting
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('UNHANDLED REJECTION! 💥', {
      promise: promise.toString().substring(0, 100) + '...',
      reason: reason.toString().substring(0, 100) + '...',
    });
    logger.error(reason);

    // Don't exit for unhandled rejections - they're often recoverable
  });

  // Handle warning events
  process.on('warning', (warning) => {
    logger.warn(`Node.js Warning: ${warning.name}`, {
      message: warning.message,
      stack: warning.stack,
    });
  });
}

/**
 * Initialize subsystems
 * @returns {Promise<void>}
 */
async function initializeSubsystems() {
  logger.info('Initializing subsystems');

  try {
    // Skip worker initialization in test environment
    if (config.env !== 'test') {
      // Initialize background workers
      workers.initializeWorkers();
      logger.info('Background workers initialized successfully');
    } else {
      logger.info('Test environment detected, skipping worker initialization');
    }

    // Add additional subsystems initialization here as needed
  } catch (error) {
    logger.error('Error initializing subsystems:', error);
    if (config.env === 'production') {
      throw error; // Re-throw in production
    } else {
      logger.warn('Continuing despite subsystem initialization errors in development mode');
    }
  }
}

/**
 * Start system health monitoring
 */
function startHealthMonitoring() {
  if (config.monitoring?.enabled) {
    try {
      logger.info('Starting system health monitoring');
      monitorSystemHealth(config.monitoring.interval || 60000);
    } catch (error) {
      logger.error('Failed to start health monitoring:', error);
    }
  }
}

/**
 * Start HTTP server
 * @param {http.Server} server - HTTP server instance
 * @returns {Promise<http.Server>} The HTTP server instance
 */
function startHttpServer(server) {
  return new Promise((resolve, reject) => {
    try {
      // Get port from config, normalizing to number
      const port = normalizePort(config.port || 3000);

      // Configure server listening
      server.listen(port);

      // Handle server events
      server.on('error', (error) => {
        handleServerError(error, port, server);
        reject(error);
      });

      server.on('listening', () => {
        const addr = server.address();
        const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        logger.info(`HTTP server listening on ${bind}`);
        resolve(server);
      });
    } catch (error) {
      logger.error('Failed to start HTTP server:', error);
      reject(error);
    }
  });
}

/**
 * Normalize port into a number, string, or false
 * @param {number|string} val - Port value
 * @returns {number|string|false} Normalized port
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val; // Named pipe
  }

  if (port >= 0) {
    return port; // Port number
  }

  return false;
}

/**
 * Handle server error
 * @param {Error} error - Server error
 * @param {number|string} port - Port that was attempted
 * @param {http.Server} server - HTTP server instance
 */
function handleServerError(error, port, server) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

  // Handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(`${bind} is already in use`);
      // Try with a different port in development
      if (config.env !== 'production') {
        logger.info(`Attempting to use alternative port`);
        const newPort = typeof port === 'number' ? port + 1 : 0;
        server.listen(newPort);

        // Re-bind the listening event handler
        server.on('listening', () => {
          const addr = server.address();
          logger.info(`Server listening on port ${addr.port} instead`);
        });
      } else {
        process.exit(1);
      }
      break;
    default:
      throw error;
  }
}

/**
 * Set up graceful shutdown handlers
 * @param {http.Server} server - HTTP server instance
 */
function setupGracefulShutdown(server) {
  // Create a more robust shutdown handler
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully...`);
    let exitCode = 0;

    // Set a timeout to force exit if graceful shutdown takes too long
    const forceExitTimeout = setTimeout(() => {
      logger.error('Graceful shutdown timed out after 30 seconds, forcing exit');
      process.exit(1);
    }, 30000);

    try {
      // Step 1: Close the HTTP server first (stops accepting new connections)
      if (server) {
        await new Promise((resolve, reject) => {
          server.close((err) => {
            if (err) {
              logger.error('Error closing HTTP server:', err);
              reject(err);
            } else {
              logger.info('HTTP server closed, no longer accepting connections');
              resolve();
            }
          });
        });
      }

      // Step 2: Close WebSocket server (if exists)
      if (websocket.isInitialized()) {
        try {
          await websocket.close();
          logger.info('WebSocket server closed successfully');
        } catch (wsError) {
          logger.error('Error closing WebSocket server:', wsError);
          exitCode = 1;
        }
      }

      // Step 3: Shutdown workers
      if (workers.shutdown) {
        try {
          logger.info('Shutting down workers...');
          await workers.shutdown();
          logger.info('Workers shut down successfully');
        } catch (workerError) {
          logger.error('Error shutting down workers:', workerError);
          exitCode = 1;
        }
      }

      // Step 4: Close database connections
      if (db.sequelize) {
        try {
          logger.info('Closing database connections...');
          await db.sequelize.close();
          logger.info('Database connections closed successfully');
        } catch (dbError) {
          logger.error('Error closing database connections:', dbError);
          exitCode = 1;
        }
      }

      // Clear the force exit timeout
      clearTimeout(forceExitTimeout);

      logger.info('Graceful shutdown completed');
      await gracefulExit(exitCode);
    } catch (error) {
      logger.error('Error during graceful shutdown:', error);
      clearTimeout(forceExitTimeout);
      await gracefulExit(1);
    }
  };

  // Handle termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

/**
 * Log successful startup information
 * @param {http.Server} server - HTTP server instance
 */
function logSuccessfulStartup(server) {
  const addr = server.address();
  const port = typeof addr === 'string' ? addr : addr.port;

  logger.info('======================================================');
  logger.info(`🚀 JayLink SMS Platform started successfully!`);
  logger.info(`🌐 Environment: ${config.env}`);
  logger.info(`🔌 Server port: ${port}`);
  logger.info(`🌐 API URL: ${config.apiUrl}`);
  logger.info(`🖥️ Frontend URL: ${config.frontendUrl}`);
  logger.info(`📡 WebSocket: ${websocket.isInitialized() ? 'Enabled' : 'Disabled'}`);
  logger.info(`💰 Currency: ${config.currency.name} (${config.currency.code})`);

  // Log memory usage
  const memoryUsage = process.memoryUsage();
  logger.info(`🧠 Memory RSS: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`);
  logger.info(`🧠 Heap Total: ${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`);
  logger.info(`🧠 Heap Used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`);

  logger.info('======================================================');
}

/**
 * Graceful exit with a delay to allow logging to complete
 * @param {number} code - Exit code
 * @returns {Promise<void>}
 */
async function gracefulExit(code) {
  // Allow time for logs to be written
  await new Promise((resolve) => setTimeout(resolve, 500));
  process.exit(code);
}

// Export for testing purposes
module.exports = { startServer };

// Start the server if this file is run directly
if (require.main === module) {
  startServer().catch((err) => {
    logger.error('Failed to start server:', err);
    process.exit(1);
  });
}
