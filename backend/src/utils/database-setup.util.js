// backend/src/utils/database-setup.util.js
const fs = require('fs');
const path = require('path');
const db = require('../models');
const config = require('../config/config');
const logger = require('../config/logger');
const initializeDatabase = require('./database-seeder.util');

/**
 * Enterprise-grade database setup and migration management system with index optimization
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
    
    // Step 4: Clean up excessive indexes before migrations
    await cleanupExcessiveIndexes();
    
    // Step 5: Execute pending migrations based on environment
    await executeMigrations();
    
    // Step 6: Seed initial data if necessary
    await seedInitialData();
    
    // Step 7: Verify database integrity
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
 * Clean up excessive indexes before schema synchronization
 * @returns {Promise<void>}
 */
const cleanupExcessiveIndexes = async () => {
  logger.info('Checking and cleaning up excessive indexes');
  
  try {
    const queryInterface = db.sequelize.getQueryInterface();
    const existingTables = await queryInterface.showAllTables();
    
    if (!existingTables.includes('users')) {
      logger.info('Users table does not exist yet, skipping index cleanup');
      return;
    }
    
    // Get current indexes on users table
    const indexes = await queryInterface.showIndex('users');
    logger.info(`Found ${indexes.length} indexes on users table`);
    
    // MySQL limit is 64 indexes per table
    const MAX_INDEXES = 60; // Leave some buffer
    
    if (indexes.length >= MAX_INDEXES) {
      logger.warn(`Users table has ${indexes.length} indexes, approaching MySQL limit of 64`);
      await optimizeUserTableIndexes(queryInterface, indexes);
    }
    
    // Check other critical tables
    const criticalTables = ['messages', 'transactions', 'contacts', 'settings', 'groups', 'notifications'];
    for (const tableName of criticalTables) {
      if (existingTables.includes(tableName)) {
        const tableIndexes = await queryInterface.showIndex(tableName);
        if (tableIndexes.length >= MAX_INDEXES) {
          logger.warn(`Table ${tableName} has ${tableIndexes.length} indexes, optimizing...`);
          await optimizeTableIndexes(queryInterface, tableName, tableIndexes);
        }
      }
    }
    
  } catch (error) {
    logger.error('Error during index cleanup:', error);
    // Don't throw here - continue with setup
    logger.warn('Index cleanup failed, but continuing with database setup');
  }
};

/**
 * Optimize indexes on users table
 * @param {Object} queryInterface - Sequelize query interface
 * @param {Array} currentIndexes - Current indexes on the table
 * @returns {Promise<void>}
 */
const optimizeUserTableIndexes = async (queryInterface, currentIndexes) => {
  logger.info('Optimizing users table indexes');
  
  try {
    // Define essential indexes we want to keep
    const essentialIndexes = [
      'PRIMARY', // Primary key
      'email', // Unique constraint on email
      'users_email_unique', // Alternative unique constraint name
    ];
    
    // Define indexes we want to remove (redundant or unnecessary ones)
    const indexesToRemove = currentIndexes.filter(index => {
      const indexName = index.name || index.Key_name;
      
      // Keep essential indexes
      if (essentialIndexes.some(essential => indexName.toLowerCase().includes(essential.toLowerCase()))) {
        return false;
      }
      
      // Remove individual status/role indexes if we have composite ones
      if (indexName.includes('status') && !indexName.includes('role')) {
        return true;
      }
      
      if (indexName.includes('role') && !indexName.includes('status')) {
        return true;
      }
      
      // Remove redundant createdAt indexes
      if (indexName.includes('created') && currentIndexes.some(idx => 
        (idx.name || idx.Key_name).includes('created') && 
        (idx.name || idx.Key_name) !== indexName
      )) {
        return true;
      }
      
      return false;
    });
    
    // Remove redundant indexes
    for (const index of indexesToRemove) {
      const indexName = index.name || index.Key_name;
      try {
        await queryInterface.removeIndex('users', indexName);
        logger.info(`Removed redundant index: ${indexName}`);
      } catch (error) {
        logger.warn(`Failed to remove index ${indexName}:`, error.message);
      }
    }
    
    // Ensure we have the essential composite index
    const hasCompositeIndex = currentIndexes.some(index => {
      const indexName = (index.name || index.Key_name).toLowerCase();
      return indexName.includes('status') && indexName.includes('role');
    });
    
    if (!hasCompositeIndex) {
      try {
        await queryInterface.addIndex('users', ['status', 'role'], {
          name: 'idx_user_status_role'
        });
        logger.info('Added essential composite index: idx_user_status_role');
      } catch (error) {
        logger.warn('Failed to add composite index:', error.message);
      }
    }
    
  } catch (error) {
    logger.error('Error optimizing users table indexes:', error);
  }
};

/**
 * Generic table index optimization
 * @param {Object} queryInterface - Sequelize query interface
 * @param {string} tableName - Name of the table
 * @param {Array} currentIndexes - Current indexes on the table
 * @returns {Promise<void>}
 */
const optimizeTableIndexes = async (queryInterface, tableName, currentIndexes) => {
  logger.info(`Optimizing indexes for table: ${tableName}`);
  
  try {
    // Remove duplicate and redundant indexes
    const indexNames = new Set();
    const duplicateIndexes = [];
    
    for (const index of currentIndexes) {
      const indexName = index.name || index.Key_name;
      const columnNames = Array.isArray(index.fields) ? 
        index.fields.join(',') : 
        (index.Column_name || '');
      
      const indexKey = `${columnNames}`;
      
      if (indexNames.has(indexKey) && !indexName.includes('PRIMARY')) {
        duplicateIndexes.push(indexName);
      } else {
        indexNames.add(indexKey);
      }
    }
    
    // Remove duplicate indexes
    for (const indexName of duplicateIndexes) {
      try {
        await queryInterface.removeIndex(tableName, indexName);
        logger.info(`Removed duplicate index: ${indexName} from ${tableName}`);
      } catch (error) {
        logger.warn(`Failed to remove duplicate index ${indexName}:`, error.message);
      }
    }
    
  } catch (error) {
    logger.error(`Error optimizing indexes for ${tableName}:`, error);
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
 * Synchronize database schema using Sequelize with enhanced error handling
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
      
      // Sync models one by one to handle index errors gracefully
      await syncModelsIndividually();
      
      logger.info('Database schema synchronized successfully');
    } catch (error) {
      logger.error('Schema sync error:', error);
      
      // Handle specific index errors
      if (error.original?.code === 'ER_TOO_MANY_KEYS') {
        logger.error('Too many indexes error detected. Attempting to resolve...');
        await handleTooManyKeysError(error);
      } else {
        // In development, warn but continue; in production, this is an error
        if (config.env === 'production') {
          throw new Error(`Schema synchronization error: ${error.message}`);
        } else {
          logger.warn('Schema synchronization encountered errors but will continue');
        }
      }
    }
  } else {
    logger.info('Schema synchronization skipped (alter: false)');
  }
};

/**
 * Sync models individually to handle errors gracefully
 * @returns {Promise<void>}
 */
const syncModelsIndividually = async () => {
  const modelNames = Object.keys(db).filter(key => 
    key !== 'sequelize' && key !== 'Sequelize' && typeof db[key].sync === 'function'
  );
  
  logger.info(`Syncing ${modelNames.length} models individually`);
  
  for (const modelName of modelNames) {
    try {
      logger.debug(`Syncing model: ${modelName}`);
      await db[modelName].sync({ alter: true });
      logger.debug(`Successfully synced model: ${modelName}`);
    } catch (error) {
      logger.error(`Error syncing model ${modelName}:`, error);
      
      if (error.original?.code === 'ER_TOO_MANY_KEYS') {
        logger.warn(`Model ${modelName} has too many indexes. Attempting to fix...`);
        await handleModelIndexError(modelName, error);
      } else {
        // Log error but continue with other models
        logger.warn(`Continuing with other models despite error in ${modelName}`);
      }
    }
  }
};

/**
 * Handle "too many keys" error by optimizing indexes
 * @param {Error} error - The original error
 * @returns {Promise<void>}
 */
const handleTooManyKeysError = async (error) => {
  logger.info('Attempting to resolve "too many keys" error');
  
  try {
    // Extract table name from error if possible
    const sql = error.sql || '';
    const tableMatch = sql.match(/ALTER TABLE `(\w+)`/);
    const tableName = tableMatch ? tableMatch[1] : 'users'; // Default to users table
    
    logger.info(`Optimizing indexes for table: ${tableName}`);
    
    const queryInterface = db.sequelize.getQueryInterface();
    const indexes = await queryInterface.showIndex(tableName);
    
    if (tableName === 'users') {
      await optimizeUserTableIndexes(queryInterface, indexes);
    } else {
      await optimizeTableIndexes(queryInterface, tableName, indexes);
    }
    
    // Try to sync the specific model again
    if (db[tableName.charAt(0).toUpperCase() + tableName.slice(1)]) {
      await db[tableName.charAt(0).toUpperCase() + tableName.slice(1)].sync({ alter: true });
      logger.info(`Successfully synced ${tableName} after index optimization`);
    }
    
  } catch (retryError) {
    logger.error('Failed to resolve "too many keys" error:', retryError);
    throw retryError;
  }
};

/**
 * Handle index error for a specific model
 * @param {string} modelName - Name of the model
 * @param {Error} error - The original error
 * @returns {Promise<void>}
 */
const handleModelIndexError = async (modelName, error) => {
  try {
    const tableName = db[modelName].tableName || modelName.toLowerCase() + 's';
    const queryInterface = db.sequelize.getQueryInterface();
    const indexes = await queryInterface.showIndex(tableName);
    
    // Remove redundant indexes
    await optimizeTableIndexes(queryInterface, tableName, indexes);
    
    // Retry syncing the model
    await db[modelName].sync({ alter: true });
    logger.info(`Successfully synced ${modelName} after index optimization`);
    
  } catch (retryError) {
    logger.error(`Failed to fix index error for ${modelName}:`, retryError);
    // Don't throw - continue with other models
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

/**
 * Utility function to get index information for debugging
 * @param {string} tableName - Name of the table
 * @returns {Promise<Array>} Array of index information
 */
const getTableIndexInfo = async (tableName) => {
  try {
    const queryInterface = db.sequelize.getQueryInterface();
    const indexes = await queryInterface.showIndex(tableName);
    
    logger.info(`Index information for table ${tableName}:`);
    logger.info(`Total indexes: ${indexes.length}`);
    
    indexes.forEach((index, i) => {
      logger.info(`${i + 1}. ${index.name || index.Key_name}: ${index.fields || index.Column_name}`);
    });
    
    return indexes;
  } catch (error) {
    logger.error(`Failed to get index info for ${tableName}:`, error);
    return [];
  }
};

module.exports = {
  setupDatabase,
  validateDatabaseConfig,
  executeMigrations,
  syncDatabaseSchema,
  verifyDatabaseIntegrity,
  cleanupExcessiveIndexes,
  getTableIndexInfo
};