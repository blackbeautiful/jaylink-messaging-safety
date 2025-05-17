// src/server.js
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
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  try {
    // Close database connection
    if (db.sequelize) {
      logger.info('Closing database connections...');
      await db.sequelize.close();
      logger.info('Database connections closed successfully');
    }
    logger.info('Server shutdown complete');
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
  } finally {
    process.exit(0);
  }
});

// Handle SIGINT signal (Ctrl+C)
process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  try {
    // Close database connection
    if (db.sequelize) {
      logger.info('Closing database connections...');
      await db.sequelize.close();
      logger.info('Database connections closed successfully');
    }
    logger.info('Server shutdown complete');
  } catch (error) {
    logger.error('Error during graceful shutdown:', error);
  } finally {
    process.exit(0);
  }
});

// Start server (improved with graceful shutdown and auto migration)
const startServer = async () => {
  let server;
  
  try {
    try {
      // Check if database exists and tables are created
      await db.sequelize.authenticate();
      logger.info('Database connection established successfully');
      
      // Check if tables exist by trying to query the User model
      try {
        await db.User.findOne();
        logger.info('Database tables already exist');
      } catch (error) {
        if (error.name === 'SequelizeDatabaseError' && error.parent && error.parent.code === 'ER_NO_SUCH_TABLE') {
          // Tables don't exist, force sync in all environments
          logger.info('Tables not found, creating database schema...');
          await db.sequelize.sync({ force: false });
          logger.info('Database tables created successfully');
          
          // Initialize database with default data after tables are created
          logger.info('Initializing database with default data...');
          await initializeDatabase();
          logger.info('Database initialized successfully');
        } else {
          // Some other database issue
          throw error;
        }
      }
    } catch (error) {
      logger.error('Database connection error:', error);
      
      // For MySQL "ER_BAD_DB_ERROR", try to create the database
      if (error.name === 'SequelizeConnectionError' && error.parent && error.parent.code === 'ER_BAD_DB_ERROR') {
        logger.info('Database does not exist, attempting to create it...');
        
        // Create a new Sequelize instance without specifying a database
        const { Sequelize } = require('sequelize');
        const tempSequelize = new Sequelize({
          host: config.db.host,
          port: config.db.port,
          username: config.db.user,
          password: config.db.password,
          dialect: 'mysql',
          logging: false,
        });
        
        try {
          // Create the database
          await tempSequelize.query(`CREATE DATABASE IF NOT EXISTS ${config.db.name};`);
          await tempSequelize.close();
          
          logger.info(`Database ${config.db.name} created successfully`);
          
          // Now sync with the newly created database
          await db.sequelize.sync({ force: false });
          logger.info('Database tables created successfully');
          
          // Initialize database with default data
          await initializeDatabase();
          logger.info('Database initialized successfully');
        } catch (createError) {
          logger.error('Failed to create database:', createError);
          throw createError;
        }
      } else {
        throw error; // Re-throw other errors
      }
    }

    // Start Express server
    server = app.listen(config.port, () => {
      logger.info(`Server started on port ${config.port} (${config.env})`);
      logger.info(`API URL: ${config.apiUrl}`);
      logger.info(`Frontend URL: ${config.frontendUrl}`);
    });

    // Handle server errors
    server.on('error', (err) => {
      logger.error('Server error:', err);
      process.exit(1);
    });

    // Add graceful shutdown to server for SIGTERM
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      
      if (server) {
        server.close(async () => {
          logger.info('Express server closed');
          
          try {
            // Close database connections
            if (db.sequelize) {
              logger.info('Closing database connections...');
              await db.sequelize.close();
              logger.info('Database connections closed successfully');
            }
          } catch (error) {
            logger.error('Error closing database:', error);
          } finally {
            process.exit(0);
          }
        });
      }
    });

    // Similar handler for SIGINT (Ctrl+C)
    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      
      if (server) {
        server.close(async () => {
          logger.info('Express server closed');
          
          try {
            // Close database connections
            if (db.sequelize) {
              logger.info('Closing database connections...');
              await db.sequelize.close();
              logger.info('Database connections closed successfully');
            }
          } catch (error) {
            logger.error('Error closing database:', error);
          } finally {
            process.exit(0);
          }
        });
      }
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();