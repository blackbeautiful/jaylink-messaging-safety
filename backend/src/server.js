const app = require('./app');
const db = require('./models');
const config = require('./config/config');
const logger = require('./config/logger');
const initializeDatabase = require('./utils/database-seeder.util');
const path = require('path');
const fs = require('fs');

// Create necessary directories
try {
  // Create logs directory if it doesn't exist
  if (!fs.existsSync('logs')) {
    fs.mkdirSync('logs', { recursive: true });
    logger.info('Created logs directory');
  }
  
  // Create uploads directories if they don't exist
  if (!fs.existsSync('uploads/audio')) {
    fs.mkdirSync('uploads/audio', { recursive: true });
    logger.info('Created uploads/audio directory');
  }
  
  if (!fs.existsSync('uploads/csv')) {
    fs.mkdirSync('uploads/csv', { recursive: true });
    logger.info('Created uploads/csv directory');
  }
  
  // Create email templates directory if it doesn't exist
  if (!fs.existsSync('src/templates/emails')) {
    fs.mkdirSync('src/templates/emails', { recursive: true });
    logger.info('Created email templates directory');
  }
} catch (error) {
  logger.warn(`Error creating directories: ${error.message}`);
}

// Initialize templates
try {
  require('./templates');
  logger.info('Email templates initialized');
} catch (error) {
  logger.warn(`Error initializing templates: ${error.message}`);
  logger.warn('Continuing without email templates');
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle SIGTERM signal
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

// Handle SIGINT signal (Ctrl+C)
process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const startServer = async () => {
  try {
    // Sync database (in development only)
    if (config.env === 'development') {
      await db.sequelize.sync();
      logger.info('Database synchronized successfully');
      
      // Initialize database with default data
      await initializeDatabase();
    } else {
      // In production, just authenticate to check connection
      await db.sequelize.authenticate();
      logger.info('Database connection established successfully');
    }

    // Start Express server
    const server = app.listen(config.port, () => {
      logger.info(`Server started on port ${config.port} (${config.env})`);
      logger.info(`API URL: ${config.apiUrl}`);
      logger.info(`Frontend URL: ${config.frontendUrl}`);
    });

    // Handle server errors
    server.on('error', (err) => {
      logger.error('Server error:', err);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();