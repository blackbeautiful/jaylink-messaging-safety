const app = require('./app');
const db = require('./models');
const config = require('./config/config');
const logger = require('./config/logger');
const initializeDatabase = require('./utils/database-seeder.util');
const { startScheduledMessageProcessor } = require('./workers/scheduled-processor');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');

// Create required directories for application
const ensureDirectories = () => {
  const directories = [
    'logs',
    'uploads/audio',
    'uploads/csv',
    'src/templates/emails'
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        logger.info(`Created directory: ${dir}`);
      } catch (error) {
        logger.warn(`Failed to create directory ${dir}: ${error.message}`);
      }
    }
  });
};

// Initialize email templates
const initializeTemplates = () => {
  try {
    require('./templates');
    logger.info('Email templates initialized successfully');
  } catch (error) {
    logger.warn(`Email template initialization error: ${error.message}`);
    logger.warn('Continuing without email templates');
  }
};

// Set up global error handlers
const setupGlobalErrorHandlers = () => {
  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err);
    // Give the logger time to write before exiting
    setTimeout(() => process.exit(1), 1000);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Don't exit here as it's recoverable
  });
};

// Set up graceful shutdown handlers
const setupGracefulShutdown = (server) => {
  const gracefulShutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);
    let exitCode = 0;

    if (server) {
      await new Promise((resolve) => {
        server.close(() => {
          logger.info('HTTP server closed');
          resolve();
        });
      });
    }

    try {
      if (db.sequelize) {
        logger.info('Closing database connections...');
        await db.sequelize.close();
        logger.info('Database connections closed successfully');
      }
    } catch (error) {
      logger.error('Error during database shutdown:', error);
      exitCode = 1;
    }

    logger.info('Graceful shutdown completed');
    setTimeout(() => process.exit(exitCode), 500);
  };

  // Handle termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

// Advanced database management with schema verification
const setupDatabase = async () => {
  try {
    // First, check if we can connect to the database
    await db.sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Get all model names for verification
    const modelNames = Object.keys(db).filter(key => 
      key !== 'sequelize' && key !== 'Sequelize' && typeof db[key].tableName === 'string'
    );
    
    // Verify if all required tables exist
    const missingTables = [];
    for (const modelName of modelNames) {
      try {
        // Try a simple query on each model
        await db[modelName].findOne({
          attributes: [Object.keys(db[modelName].rawAttributes)[0]],
          limit: 1
        });
      } catch (error) {
        if (error.name === 'SequelizeDatabaseError' && 
            error.parent && 
            (error.parent.code === 'ER_NO_SUCH_TABLE' || error.message.includes("doesn't exist"))) {
          missingTables.push(modelName);
        } else if (!error.message.includes("Unknown column")) {
          // Rethrow if it's not just a missing column (which is handled by the sync)
          throw error;
        }
      }
    }

    // Check for schema changes on existing tables
    const tablesToUpdate = [];
    const existingTables = modelNames.filter(model => !missingTables.includes(model));
    
    // Skip full schema verification in production for safety unless forced
    const shouldVerifySchema = config.env !== 'production' || process.env.FORCE_SCHEMA_CHECK === 'true';
    
    if (shouldVerifySchema && existingTables.length > 0) {
      logger.info('Verifying database schema...');
      
      for (const modelName of existingTables) {
        try {
          // Try to access all defined columns in the model
          const model = db[modelName];
          const columnNames = Object.keys(model.rawAttributes)
            .filter(attr => !['createdAt', 'updatedAt'].includes(attr)); // Skip timestamps
            
          if (columnNames.length > 0) {
            const columnSelects = columnNames.map(col => `\`${col}\``).join(',');
            await db.sequelize.query(
              `SELECT ${columnSelects} FROM \`${model.tableName}\` LIMIT 0`,
              { type: db.sequelize.QueryTypes.SELECT }
            );
          }
        } catch (error) {
          if (error.name === 'SequelizeDatabaseError' && error.message.includes('Unknown column')) {
            tablesToUpdate.push(modelName);
          } else {
            throw error;
          }
        }
      }
    }

    // Handle database schema updates
    if (missingTables.length > 0 || tablesToUpdate.length > 0) {
      if (missingTables.length > 0) {
        logger.info(`Missing tables detected: ${missingTables.join(', ')}`);
      }
      
      if (tablesToUpdate.length > 0) {
        logger.info(`Tables requiring updates: ${tablesToUpdate.join(', ')}`);
      }

      // Confirm sync operation in production to prevent accidents
      if (config.env === 'production' && !process.env.ALLOW_DB_SYNC) {
        logger.warn('Database schema changes detected in production, but ALLOW_DB_SYNC not set. Skipping sync.');
        logger.warn('If you want to automatically update the schema in production, set ALLOW_DB_SYNC=true');
      } else {
        // Perform the sync - force:false prevents dropping tables
        logger.info('Updating database schema...');
        const syncOptions = { 
          force: false, 
          alter: true,
          // Only sync specific models that need updating if we have existing tables
          // This prevents unnecessarily locking all tables
          model: missingTables.length === 0 ? 
            tablesToUpdate.map(name => db[name]) : 
            undefined
        };
        
        await db.sequelize.sync(syncOptions);
        logger.info('Database schema updated successfully');

        // Initialize database with seed data if we had missing tables
        if (missingTables.length > 0) {
          logger.info('Initializing database with default data...');
          await initializeDatabase();
          logger.info('Database initialized successfully');
        }
      }
    } else {
      logger.info('All database tables exist and schema is up-to-date');
    }

    return true;
  } catch (error) {
    logger.error('Database setup error:', error);

    // Special handling for when the database doesn't exist
    if (error.name === 'SequelizeConnectionError' && 
        error.parent && 
        error.parent.code === 'ER_BAD_DB_ERROR') {
      
      logger.info('Database does not exist, attempting to create it...');
      
      try {
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
        
        return true;
      } catch (createError) {
        logger.error('Failed to create database:', createError);
        return false;
      }
    }
    
    // For other database errors, fail gracefully
    if (config.env === 'production') {
      logger.error('Database setup failed in production. Server will exit.');
      return false;
    } else {
      logger.warn('Database setup failed, but continuing in development mode. Some features may not work properly.');
      return true; // Allow server to start even with DB issues in dev
    }
  }
};

// Main server startup function
const startServer = async () => {
  let server;
  
  try {
    // Step 1: Setup directory structure
    ensureDirectories();
    
    // Step 2: Initialize templates
    initializeTemplates();
    
    // Step 3: Setup global error handlers
    setupGlobalErrorHandlers();
    
    // Step 4: Setup database and schema
    const dbSuccess = await setupDatabase();
    
    // Only continue starting services if database setup was successful
    if (dbSuccess) {
      // Step 5: Start background services
      if (config.env !== 'test') {
        startScheduledMessageProcessor();
        logger.info('Scheduled message processor started');
      }
      
      // Step 6: Start HTTP server
      server = app.listen(config.port, () => {
        logger.info(`Server started on port ${config.port} (${config.env})`);
        logger.info(`API URL: ${config.apiUrl}`);
        logger.info(`Frontend URL: ${config.frontendUrl}`);
      });
      
      // Step 7: Setup server error handling
      server.on('error', (err) => {
        logger.error('Server error:', err);
        
        // Handle specific errors
        if (err.code === 'EADDRINUSE') {
          logger.error(`Port ${config.port} is already in use. Trying again with a different port.`);
          setTimeout(() => {
            server.close();
            server.listen(0); // Let OS assign a random available port
          }, 1000);
        } else {
          process.exit(1);
        }
      });
      
      // Step 8: Setup graceful shutdown
      setupGracefulShutdown(server);
    } else if (config.env === 'production') {
      logger.error('Failed to set up database in production mode, exiting');
      process.exit(1);
    }
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();