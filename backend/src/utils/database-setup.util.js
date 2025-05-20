// backend/src/utils/database-setup.util.js
const fs = require('fs');
const path = require('path');
const db = require('../models');
const config = require('../config/config');
const logger = require('../config/logger');
const initializeDatabase = require('./database-seeder.util');

/**
 * Enterprise-grade database setup and migration management system
 * @module database-setup
 */

/**
 * Main database setup function
 * Orchestrates the entire database initialization process
 * @returns {Promise<boolean>} Success status
 */
const setupDatabase = async () => {
  logger.info('Starting database initialization sequence');
  
  try {
    // Step 1: Validate database configuration
    validateDatabaseConfig();
    
    // Step 2: Establish connection to the database
    await establishDatabaseConnection();
    
    // Step 3: Check database existence and create if necessary
    const dbExists = await checkDatabaseExists();
    if (!dbExists) {
      await createDatabase();
    }
    
    // Step 4: Execute pending migrations based on environment
    await executeMigrations();
    
    // Step 5: Seed initial data if necessary
    await seedInitialData();
    
    // Step 6: Verify database integrity
    await verifyDatabaseIntegrity();
    
    logger.info('Database initialization completed successfully');
    return true;
  } catch (error) {
    return handleDatabaseSetupError(error);
  }
};

/**
 * Validate database configuration
 * @throws {Error} If configuration is invalid
 */
const validateDatabaseConfig = () => {
  logger.debug('Validating database configuration');
  
  const requiredConfigFields = ['host', 'port', 'user', 'password', 'name'];
  const missingFields = requiredConfigFields.filter(field => !config.db[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Invalid database configuration. Missing fields: ${missingFields.join(', ')}`);
  }
  
  // Log database configuration (omitting sensitive info)
  logger.info('Database Configuration:', {
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    dialect: 'mysql',
    // Omit password for security
  });
};

/**
 * Establish connection to the database
 * @returns {Promise<void>}
 * @throws {Error} If connection fails
 */
const establishDatabaseConnection = async () => {
  logger.info('Establishing database connection');
  
  try {
    // Check if we can connect to the database server
    await db.sequelize.authenticate();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    
    // Provide more specific error messages based on error type
    if (error.original?.code === 'ECONNREFUSED') {
      throw new Error(`Could not connect to database server at ${config.db.host}:${config.db.port}. Is the database server running?`);
    } else if (error.original?.code === 'ER_ACCESS_DENIED_ERROR') {
      throw new Error('Database access denied. Please check your username and password.');
    } else if (error.original?.code === 'ER_BAD_DB_ERROR') {
      // This is handled in createDatabase, so we'll just pass it through
      throw error;
    } else {
      throw new Error(`Database connection error: ${error.message}`);
    }
  }
};

/**
 * Check if the database exists
 * @returns {Promise<boolean>} True if database exists
 */
const checkDatabaseExists = async () => {
  try {
    // A simple query will tell us if the database exists
    await db.sequelize.query('SELECT 1+1 AS result');
    return true;
  } catch (error) {
    if (error.original?.code === 'ER_BAD_DB_ERROR') {
      logger.warn(`Database '${config.db.name}' does not exist`);
      return false;
    }
    
    // For other errors, re-throw
    throw error;
  }
};

/**
 * Create the database if it doesn't exist
 * @returns {Promise<void>}
 */
const createDatabase = async () => {
  logger.info(`Creating database '${config.db.name}'`);
  
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
    
    // Create the database with proper character set
    const charset = config.db.charset || 'utf8mb4';
    const collate = config.db.collate || 'utf8mb4_unicode_ci';
    await tempSequelize.query(
      `CREATE DATABASE IF NOT EXISTS \`${config.db.name}\` CHARACTER SET ${charset} COLLATE ${collate};`
    );
    await tempSequelize.close();
    
    logger.info(`Database '${config.db.name}' created successfully`);
    
    // Reconnect to the newly created database
    await db.sequelize.authenticate();
  } catch (error) {
    logger.error('Failed to create database:', error);
    throw new Error(`Could not create database '${config.db.name}': ${error.message}`);
  }
};

/**
 * Execute database migrations based on environment
 * @returns {Promise<void>}
 */
const executeMigrations = async () => {
  // Determine migration strategy based on environment and configuration
  const shouldUseMigrationFiles = config.env === 'production' || process.env.USE_MIGRATION_FILES === 'true';
  
  if (shouldUseMigrationFiles) {
    await executeMigrationFiles();
  } else {
    await syncDatabaseSchema();
  }
};

/**
 * Execute migration files using Sequelize migrations
 * @returns {Promise<void>}
 */
const executeMigrationFiles = async () => {
  logger.info('Executing migration files');
  
  try {
    // Check if sequelize-cli is available and migration files exist
    const migrationsPath = path.join(__dirname, '..', '..', 'migrations');
    
    if (!fs.existsSync(migrationsPath)) {
      logger.warn('Migrations directory not found, falling back to schema sync');
      return await syncDatabaseSchema();
    }
    
    // Read migration files
    const migrationFiles = fs.readdirSync(migrationsPath)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    if (migrationFiles.length === 0) {
      logger.warn('No migration files found, falling back to schema sync');
      return await syncDatabaseSchema();
    }
    
    // Use Sequelize migrations
    // First check if Umzug is available
    let umzug;
    try {
      const Umzug = require('umzug');
      umzug = new Umzug({
        migrations: {
          path: migrationsPath,
          pattern: /\.js$/,
          params: [db.sequelize.getQueryInterface(), db.Sequelize]
        },
        storage: 'sequelize',
        storageOptions: {
          sequelize: db.sequelize
        }
      });
    } catch (error) {
      logger.warn('Umzug not available, falling back to schema sync', error);
      return await syncDatabaseSchema();
    }
    
    // Run pending migrations
    const pending = await umzug.pending();
    if (pending.length > 0) {
      logger.info(`Executing ${pending.length} pending migrations`);
      await umzug.up();
      logger.info('Migrations completed successfully');
    } else {
      logger.info('No pending migrations');
    }
  } catch (error) {
    logger.error('Migration error:', error);
    logger.warn('Migration files execution failed, falling back to schema sync');
    
    // Fall back to schema sync in development, but in production we should fail
    if (config.env === 'production') {
      throw new Error(`Migration error: ${error.message}`);
    } else {
      await syncDatabaseSchema();
    }
  }
};

/**
 * Synchronize database schema using Sequelize
 * @returns {Promise<void>}
 */
const syncDatabaseSchema = async () => {
  // Determine sync options based on environment
  const syncOptions = {
    force: false, // Never drop tables in this approach
    alter: config.env !== 'production' || process.env.ALLOW_DB_SYNC === 'true'
  };
  
  if (syncOptions.alter) {
    logger.info('Performing schema synchronization (alter: true)');
    
    try {
      // First, check which tables already exist
      const queryInterface = db.sequelize.getQueryInterface();
      const existingTables = await queryInterface.showAllTables();
      
      if (existingTables.length === 0) {
        logger.info('No existing tables found, creating initial schema');
      } else {
        logger.info(`Found ${existingTables.length} existing tables, updating schema as needed`);
      }
      
      // Sync all models
      await db.sequelize.sync(syncOptions);
      logger.info('Database schema synchronized successfully');
    } catch (error) {
      logger.error('Schema sync error:', error);
      
      // In development, warn but continue; in production, this is an error
      if (config.env === 'production') {
        throw new Error(`Schema synchronization error: ${error.message}`);
      } else {
        logger.warn('Schema synchronization encountered errors but will continue');
      }
    }
  } else {
    logger.info('Schema synchronization skipped (alter: false)');
  }
};

/**
 * Seed initial data if database is empty
 * @returns {Promise<void>}
 */
const seedInitialData = async () => {
  try {
    // Check if we need to seed data by checking for users
    const userCount = await db.User.count();
    
    if (userCount === 0) {
      logger.info('No users found, seeding initial data');
      await initializeDatabase();
      logger.info('Initial data seeded successfully');
    } else {
      logger.info(`Database already contains ${userCount} users, skipping seed operation`);
    }
  } catch (error) {
    logger.error('Data seeding error:', error);
    
    // In development, warn but continue; in production, this is an error
    if (config.env === 'production') {
      throw new Error(`Data seeding error: ${error.message}`);
    } else {
      logger.warn('Data seeding encountered errors but will continue');
    }
  }
};

/**
 * Verify database integrity by checking critical tables
 * @returns {Promise<void>}
 */
const verifyDatabaseIntegrity = async () => {
  logger.info('Verifying database integrity');
  
  const criticalTables = ['User', 'Transaction', 'Setting', 'SystemSetting'];
  const results = await Promise.all(
    criticalTables.map(async tableName => {
      try {
        if (!db[tableName]) {
          return { table: tableName, status: 'missing', error: 'Model not defined' };
        }
        
        // Try a simple query to check table existence and structure
        await db[tableName].findOne({
          attributes: [Object.keys(db[tableName].rawAttributes)[0]],
          limit: 1
        });
        
        return { table: tableName, status: 'ok' };
      } catch (error) {
        return { 
          table: tableName, 
          status: 'error',
          error: error.message
        };
      }
    })
  );
  
  // Check results
  const failedTables = results.filter(result => result.status !== 'ok');
  if (failedTables.length > 0) {
    logger.warn(`Database integrity check found issues with ${failedTables.length} tables:`, 
      failedTables.map(t => `${t.table}: ${t.error}`).join(', '));
    
    // In production, this is a critical error
    if (config.env === 'production') {
      throw new Error('Database integrity check failed. Some critical tables have issues.');
    }
  } else {
    logger.info('Database integrity verified successfully');
  }
};

/**
 * Handle database setup errors based on environment
 * @param {Error} error - The error that occurred
 * @returns {boolean} Success status
 */
const handleDatabaseSetupError = (error) => {
  logger.error('Database setup error:', error);
  
  // In production, database issues are critical
  if (config.env === 'production') {
    logger.error('Database setup failed in production environment. Server will exit.');
    return false;
  } else {
    logger.warn('Database setup encountered errors in development mode.');
    logger.warn('Continuing with limited functionality. Some features may not work properly.');
    logger.warn(`Error details: ${error.message}`);
    return true; // Allow server to start in development mode
  }
};

module.exports = {
  setupDatabase,
  validateDatabaseConfig,
  executeMigrations,
  syncDatabaseSchema,
  verifyDatabaseIntegrity
};