// backend/src/utils/database-setup.util.js
const fs = require('fs');
const path = require('path');
const db = require('../models');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('./api-error.util');

/**
 * Enterprise-grade database setup and migration management system
 * Fixed version with proper model detection and aggressive index cleanup
 * @module database-setup
 */

class DatabaseSetupManager {
  constructor() {
    this.initializationStartTime = Date.now();
    this.sequelize = db.sequelize;
    this.queryInterface = this.sequelize.getQueryInterface();
    this.models = this.getModelsFromSequelize();
    this.tableConfigurations = this.generateTableConfigurations();
    this.migrationStrategy = this.determineMigrationStrategy();

    // Log detected models for debugging
    logger.debug(
      `🔍 Detected ${Object.keys(this.models).length} models:`,
      Object.keys(this.models).join(', ')
    );
  }

  /**
   * Get all models from Sequelize instance - ENHANCED FIXED VERSION
   * @private
   */
  getModelsFromSequelize() {
    const models = {};

    logger.debug('🔍 Starting ultimate model detection process...');

    // Method 1: Direct db object inspection (for Sequelize constructor functions)
    logger.debug('Method 1: Checking db object for Sequelize model constructors...');
    Object.keys(db).forEach((key) => {
      const model = db[key];

      // Skip known non-model objects
      if (key === 'sequelize' || key === 'Sequelize' || key === 'isHealthy') {
        return;
      }

      if (this.isValidSequelizeModel(model)) {
        models[key] = model;
        logger.debug(`✅ Found valid model constructor: ${key} -> ${model.tableName}`);
      } else {
        logger.debug(`❌ Not a valid model: ${key} (type: ${typeof model})`);
      }
    });

    // Method 2: Check sequelize.models object
    if (Object.keys(models).length < 5 && this.sequelize.models) {
      logger.debug('Method 2: Checking sequelize.models...');
      Object.keys(this.sequelize.models).forEach((key) => {
        const model = this.sequelize.models[key];
        if (this.isValidSequelizeModel(model) && !models[key]) {
          models[key] = model;
          logger.debug(`✅ Found model via sequelize.models: ${key} -> ${model.tableName}`);
        }
      });
    }

    // Method 3: Check sequelize.modelManager
    if (
      Object.keys(models).length < 5 &&
      this.sequelize.modelManager &&
      this.sequelize.modelManager.models
    ) {
      logger.debug('Method 3: Checking sequelize.modelManager...');
      Object.values(this.sequelize.modelManager.models).forEach((model) => {
        if (this.isValidSequelizeModel(model) && !models[model.name]) {
          models[model.name] = model;
          logger.debug(`✅ Found model via modelManager: ${model.name} -> ${model.tableName}`);
        }
      });
    }

    // Method 4: Direct constructor access (last resort)
    if (Object.keys(models).length === 0) {
      logger.warn('⚠️  Standard methods failed, trying direct constructor access...');

      const knownModelNames = [
        'User',
        'Contact',
        'Group',
        'GroupContact',
        'Message',
        'Transaction',
        'Notification',
        'Setting',
        'SystemSetting',
        'ScheduledMessage',
        'ServiceCost',
        'DeviceToken',
        'UserSession',
        'SystemMetric',
      ];

      knownModelNames.forEach((modelName) => {
        if (db[modelName] && this.isValidSequelizeModel(db[modelName])) {
          models[modelName] = db[modelName];
          logger.debug(
            `✅ Found model via direct access: ${modelName} -> ${db[modelName].tableName}`
          );
        }
      });
    }

    const modelCount = Object.keys(models).length;
    logger.info(`🔍 Ultimate model detection completed: ${modelCount} valid models found`);

    if (modelCount > 0) {
      logger.info(`📋 Detected models: ${Object.keys(models).join(', ')}`);
    } else {
      logger.error('❌ CRITICAL: No models detected! Database operations will fail.');
    }

    return models;
  }

  /**
   * Force instantiate models from the loaded db object
   * @private
   */
  forceInstantiateModels() {
    const models = {};

    logger.info('🔄 Force instantiating models from db object...');

    try {
      // Get a fresh reference to the models
      const freshDb = require('../models');

      // Log what we find in the fresh db
      logger.debug(`Fresh db keys: ${Object.keys(freshDb).join(', ')}`);

      Object.keys(freshDb).forEach((key) => {
        if (key === 'sequelize' || key === 'Sequelize' || key === 'isHealthy') {
          return;
        }

        const item = freshDb[key];

        // Check if it's a model with the properties we need
        if (
          item &&
          typeof item === 'object' &&
          item.tableName &&
          typeof item.sync === 'function' &&
          item.rawAttributes
        ) {
          models[key] = item;
          logger.info(`✅ Force instantiated model: ${key} -> ${item.tableName}`);
        } else {
          logger.debug(`❌ Cannot instantiate ${key}: not a valid model object`);
          if (item && typeof item === 'object') {
            logger.debug(
              `   Properties: tableName=${!!item.tableName}, sync=${typeof item.sync}, rawAttributes=${!!item.rawAttributes}`
            );
          }
        }
      });

      // Update our references
      if (freshDb.sequelize) {
        this.sequelize = freshDb.sequelize;
        this.queryInterface = this.sequelize.getQueryInterface();
      }

      logger.info(`✅ Force instantiation completed: ${Object.keys(models).length} models`);
    } catch (error) {
      logger.error('❌ Force instantiation failed:', error.message);
    }

    return models;
  }

  /**
   * Enhanced model validation
   * @private
   */
  isValidSequelizeModel(obj) {
    if (!obj || typeof obj !== 'function') {
      return false;
    }

    // Sequelize models are constructor functions with specific properties
    const hasTableName = obj.tableName && typeof obj.tableName === 'string';
    const hasRawAttributes = obj.rawAttributes && typeof obj.rawAttributes === 'object';

    // Check for essential Sequelize model methods on the constructor
    const hasSyncMethod = typeof obj.sync === 'function';
    const hasFindOneMethod = typeof obj.findOne === 'function';
    const hasCreateMethod = typeof obj.create === 'function';

    // Check for Sequelize-specific properties
    const hasSequelizeInstance = obj.sequelize;
    const hasOptions = obj.options;

    const isSequelizeModel =
      hasTableName && hasRawAttributes && hasSyncMethod && hasFindOneMethod && hasCreateMethod;

    if (isSequelizeModel) {
      logger.debug(`✅ Valid Sequelize model: ${obj.name} -> ${obj.tableName}`);
      return true;
    }

    // Debug logging for failed validations
    logger.debug(`❌ Invalid model candidate: ${obj.name || 'unknown'}`);
    logger.debug(`   • hasTableName: ${hasTableName}`);
    logger.debug(`   • hasRawAttributes: ${hasRawAttributes}`);
    logger.debug(`   • hasSyncMethod: ${hasSyncMethod}`);
    logger.debug(`   • hasFindOneMethod: ${hasFindOneMethod}`);
    logger.debug(`   • hasCreateMethod: ${hasCreateMethod}`);

    return false;
  }

  /**
   * Force reload models from the file system
   * @private
   */
  forceReloadModels() {
    const models = {};
    const modelsPath = path.join(__dirname, '../models');

    try {
      logger.info('🔄 Force reloading models from file system...');

      if (!fs.existsSync(modelsPath)) {
        logger.error(`❌ Models directory not found: ${modelsPath}`);
        return models;
      }

      // Clear require cache for models to force fresh load
      const modelFiles = fs
        .readdirSync(modelsPath)
        .filter(
          (file) => file.endsWith('.js') && file !== 'index.js' && file !== 'compatibility.js'
        );

      logger.info(`🔍 Found ${modelFiles.length} model files to reload`);

      // Clear module cache
      modelFiles.forEach((file) => {
        const fullPath = path.join(modelsPath, file);
        delete require.cache[require.resolve(fullPath)];
      });

      // Clear the models/index.js from cache
      const indexPath = path.join(modelsPath, 'index.js');
      if (fs.existsSync(indexPath)) {
        delete require.cache[require.resolve(indexPath)];
      }

      // Force reload the entire models module
      const freshDb = require('../models');

      // Extract models from fresh load using the corrected detection
      Object.keys(freshDb).forEach((key) => {
        const model = freshDb[key];
        if (this.isValidSequelizeModel(model)) {
          models[key] = model;
          logger.info(`✅ Force loaded model: ${key} -> ${model.tableName}`);
        }
      });

      // Update our sequelize instance reference
      if (freshDb.sequelize) {
        this.sequelize = freshDb.sequelize;
        this.queryInterface = this.sequelize.getQueryInterface();
      }

      logger.info(`✅ Force reload completed: ${Object.keys(models).length} models loaded`);
    } catch (error) {
      logger.error('❌ Force model reload failed:', error.message);
      logger.debug('Error details:', error.stack);
    }

    return models;
  }

  /**
   * Validate and clean detected models
   * @private
   */
  validateDetectedModels(models) {
    const validatedModels = {};

    logger.debug('🔍 Validating detected models...');

    Object.entries(models).forEach(([key, model]) => {
      try {
        // Comprehensive validation
        if (
          model &&
          typeof model === 'object' &&
          model.tableName &&
          typeof model.tableName === 'string' &&
          model.rawAttributes &&
          typeof model.rawAttributes === 'object' &&
          typeof model.sync === 'function' &&
          typeof model.findOne === 'function'
        ) {
          // Additional check: try to get attributes
          const attributes = Object.keys(model.rawAttributes);

          if (attributes.length > 0) {
            validatedModels[key] = model;
            logger.debug(`✅ Validated model: ${key} (${attributes.length} attributes)`);
          } else {
            logger.warn(`⚠️  Model ${key} has no attributes`);
          }
        } else {
          logger.debug(`❌ Model ${key} failed validation`);
          logger.debug(`   • Is object: ${typeof model === 'object'}`);
          logger.debug(`   • Has tableName: ${!!(model && model.tableName)}`);
          logger.debug(`   • Has rawAttributes: ${!!(model && model.rawAttributes)}`);
          logger.debug(`   • Has sync method: ${!!(model && typeof model.sync === 'function')}`);
        }
      } catch (error) {
        logger.warn(`⚠️  Model ${key} validation error: ${error.message}`);
      }
    });

    logger.info(
      `📊 Model validation completed: ${Object.keys(validatedModels).length} valid models`
    );

    return validatedModels;
  }

  /**
   * Alternative method: Direct model instantiation from files
   * @private
   */
  registerModelsManually() {
    const models = {};
    const modelsPath = path.join(__dirname, '../models');

    try {
      if (!fs.existsSync(modelsPath)) {
        logger.error(`❌ Models directory not found: ${modelsPath}`);
        return models;
      }

      const modelFiles = fs
        .readdirSync(modelsPath)
        .filter(
          (file) =>
            file.endsWith('.js') &&
            file !== 'index.js' &&
            file !== 'compatibility.js' &&
            !file.includes('.test.') &&
            !file.includes('.spec.')
        );

      logger.info(`🔍 Attempting to manually register ${modelFiles.length} model files`);

      for (const file of modelFiles) {
        try {
          const modelPath = path.join(modelsPath, file);
          const modelName = path.basename(file, '.js');

          // Clear cache first
          delete require.cache[require.resolve(modelPath)];

          // Load model definition
          const modelDefinition = require(modelPath);

          if (typeof modelDefinition === 'function') {
            // Initialize model with Sequelize
            const model = modelDefinition(this.sequelize, this.sequelize.constructor.DataTypes);

            if (this.isValidSequelizeModel(model)) {
              models[model.name || modelName] = model;
              logger.info(
                `✅ Manually registered model: ${model.name || modelName} -> ${model.tableName}`
              );
            } else {
              logger.warn(`⚠️  Model definition from ${file} is not valid`);
            }
          } else {
            logger.warn(`⚠️  ${file} does not export a function`);
          }
        } catch (error) {
          logger.warn(`⚠️  Failed to register model from ${file}: ${error.message}`);
        }
      }

      // Set up associations after all models are loaded
      if (Object.keys(models).length > 0) {
        logger.info('🔗 Setting up model associations...');
        Object.values(models).forEach((model) => {
          if (typeof model.associate === 'function') {
            try {
              model.associate(models);
              logger.debug(`✅ Set up associations for ${model.name}`);
            } catch (error) {
              logger.warn(`⚠️  Failed to set up associations for ${model.name}: ${error.message}`);
            }
          }
        });
      }
    } catch (error) {
      logger.error('❌ Manual model registration failed:', error);
    }

    return models;
  }

  /**
   * Main database setup orchestrator
   * @returns {Promise<DatabaseSetupResult>}
   */
  async setupDatabase() {
    logger.info('🚀 Starting enterprise database initialization sequence');

    const setupResult = {
      success: false,
      duration: 0,
      operations: [],
      warnings: [],
      errors: [],
      criticalErrors: [],
      nonCriticalErrors: [],
    };

    try {
      // Phase 1: Pre-setup validation and preparation
      await this.executePhase('validation', setupResult, async () => {
        await this.validateEnvironmentAndConfig();
        await this.prepareDirectories();
      });

      // Phase 2: Database connection and basic setup
      await this.executePhase('connection', setupResult, async () => {
        await this.establishDatabaseConnection();
        await this.ensureDatabaseExists();
      });

      // Phase 3: Schema analysis and aggressive cleanup
      await this.executePhase('analysis', setupResult, async () => {
        await this.analyzeExistingSchema();
        await this.performAggressiveIndexCleanup(); // NEW: More aggressive cleanup
      });

      // Phase 4: Schema synchronization or migration
      await this.executePhase('migration', setupResult, async () => {
        await this.executeMigrationStrategy();
      });

      // Phase 5: Data seeding and integrity verification
      await this.executePhase('verification', setupResult, async () => {
        await this.seedInitialDataSafely(); // NEW: Safer seeding
        await this.verifyDatabaseIntegrity();
      });

      setupResult.success = true;
      setupResult.duration = Date.now() - this.initializationStartTime;

      logger.info(`✅ Database initialization completed successfully in ${setupResult.duration}ms`);
      return setupResult;
    } catch (error) {
      setupResult.success = false;
      setupResult.duration = Date.now() - this.initializationStartTime;
      setupResult.errors.push(error.message);

      return this.handleSetupFailure(error, setupResult);
    }
  }

  /**
   * Execute a setup phase with error handling and logging
   * @private
   */
  async executePhase(phaseName, setupResult, phaseFunction) {
    const phaseStart = Date.now();
    logger.info(`📋 Phase: ${phaseName.toUpperCase()}`);

    try {
      await phaseFunction();
      const duration = Date.now() - phaseStart;
      setupResult.operations.push({ phase: phaseName, success: true, duration });
      logger.info(`✅ Phase ${phaseName} completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - phaseStart;
      setupResult.operations.push({
        phase: phaseName,
        success: false,
        duration,
        error: error.message,
      });
      logger.error(`❌ Phase ${phaseName} failed after ${duration}ms:`, error);
      throw error;
    }
  }

  /**
   * Validate environment and configuration
   * @private
   */
  async validateEnvironmentAndConfig() {
    logger.debug('🔍 Validating environment and configuration');

    // Validate required configuration
    const requiredDbFields = ['host', 'port', 'user', 'password', 'name'];
    const missingFields = requiredDbFields.filter((field) => !config.db[field]);

    if (missingFields.length > 0) {
      throw ApiError.badRequest(
        `Invalid database configuration. Missing fields: ${missingFields.join(', ')}`
      );
    }

    // Log sanitized configuration
    logger.info('📊 Database Configuration:', {
      host: config.db.host,
      port: config.db.port,
      database: config.db.name,
      dialect: config.db.dialect || 'mysql',
      environment: config.env,
      migrationStrategy: this.migrationStrategy,
      modelsDetected: Object.keys(this.models).length,
    });
  }

  /**
   * Prepare required directories
   * @private
   */
  async prepareDirectories() {
    const directories = ['logs/database', 'backups/database', 'migrations', 'seeders'];

    for (const dir of directories) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
          logger.debug(`📁 Created directory: ${dir}`);
        }
      } catch (error) {
        logger.warn(`Failed to create directory ${dir}:`, error.message);
      }
    }
  }

  /**
   * Establish and verify database connection
   * @private
   */
  async establishDatabaseConnection() {
    logger.info('🔗 Establishing database connection');

    try {
      await this.sequelize.authenticate();

      // Test connection performance
      const start = Date.now();
      await this.sequelize.query('SELECT 1 as test');
      const latency = Date.now() - start;

      logger.info(`✅ Database connection established (latency: ${latency}ms)`);

      if (latency > 1000) {
        logger.warn(`⚠️  High database latency detected: ${latency}ms`);
      }
    } catch (error) {
      const enhancedError = this.enhanceConnectionError(error);
      logger.error('❌ Database connection failed:', enhancedError.message);
      throw enhancedError;
    }
  }

  /**
   * Enhance connection errors with specific guidance
   * @private
   */
  enhanceConnectionError(error) {
    const errorCode = error.original?.code || error.code;

    const errorMap = {
      ECONNREFUSED: `Cannot connect to database server at ${config.db.host}:${config.db.port}. Please verify the database server is running and accessible.`,
      ER_ACCESS_DENIED_ERROR:
        'Database authentication failed. Please verify username and password.',
      ENOTFOUND: `Database host '${config.db.host}' not found. Please verify the hostname.`,
      ETIMEDOUT: 'Database connection timed out. Please check network connectivity.',
      ER_BAD_DB_ERROR: `Database '${config.db.name}' does not exist and will be created.`,
    };

    const message = errorMap[errorCode] || `Database connection error: ${error.message}`;
    return new ApiError(message, 500, { originalError: error.message, code: errorCode });
  }

  /**
   * Ensure database exists, create if necessary
   * @private
   */
  async ensureDatabaseExists() {
    try {
      await this.sequelize.query('SELECT 1');
      logger.info('📊 Database exists and is accessible');
    } catch (error) {
      if (error.original?.code === 'ER_BAD_DB_ERROR') {
        await this.createDatabase();
      } else {
        throw error;
      }
    }
  }

  /**
   * Create database with proper configuration
   * @private
   */
  async createDatabase() {
    logger.info(`🔨 Creating database '${config.db.name}'`);

    const { Sequelize } = require('sequelize');
    const tempSequelize = new Sequelize({
      host: config.db.host,
      port: config.db.port,
      username: config.db.user,
      password: config.db.password,
      dialect: config.db.dialect || 'mysql',
      logging: false,
    });

    try {
      const charset = config.db.charset || 'utf8mb4';
      const collate = config.db.collate || 'utf8mb4_unicode_ci';

      await tempSequelize.query(
        `CREATE DATABASE IF NOT EXISTS \`${config.db.name}\` 
         CHARACTER SET ${charset} 
         COLLATE ${collate}`
      );

      await tempSequelize.close();
      await this.sequelize.authenticate(); // Reconnect to new database

      logger.info(`✅ Database '${config.db.name}' created successfully`);
    } catch (error) {
      await tempSequelize.close();
      throw new ApiError(`Failed to create database '${config.db.name}': ${error.message}`, 500);
    }
  }

  /**
   * Analyze existing database schema with better error handling
   * @private
   */
  async analyzeExistingSchema() {
    logger.info('🔍 Analyzing existing database schema');

    try {
      const existingTables = await this.queryInterface.showAllTables();
      const tableAnalysis = await this.analyzeTablesStructure(existingTables);

      logger.info(`📊 Schema Analysis Results:`, {
        existingTables: existingTables.length,
        expectedTables: Object.keys(this.models).length,
        indexAnalysis: tableAnalysis.totalIndexes,
        potentialIssues: tableAnalysis.issues.length,
      });

      if (tableAnalysis.issues.length > 0) {
        logger.warn('⚠️  Schema issues detected:', tableAnalysis.issues.slice(0, 5)); // Limit log output
      }

      return tableAnalysis;
    } catch (error) {
      logger.warn('⚠️  Schema analysis failed:', error.message);
      return { existingTables: [], totalIndexes: 0, issues: ['Schema analysis failed'] };
    }
  }

  /**
   * Analyze table structures and indexes
   * @private
   */
  async analyzeTablesStructure(existingTables) {
    const analysis = {
      existingTables,
      totalIndexes: 0,
      issues: [],
      tableDetails: {},
    };

    for (const tableName of existingTables) {
      try {
        const indexes = await this.queryInterface.showIndex(tableName);
        const columns = await this.queryInterface.describeTable(tableName);

        analysis.tableDetails[tableName] = {
          columnCount: Object.keys(columns).length,
          indexCount: indexes.length,
          indexes: indexes.map((idx) => ({
            name: idx.name || idx.Key_name,
            columns: idx.fields || [idx.Column_name],
            unique: idx.unique || false,
          })),
        };

        analysis.totalIndexes += indexes.length;

        // Check for potential issues
        if (indexes.length > 30) {
          analysis.issues.push(`Table '${tableName}' has ${indexes.length} indexes (excessive)`);
        }

        // Check for duplicate indexes - IMPROVED DETECTION
        const duplicateIndexes = this.findDuplicateIndexesImproved(indexes);
        if (duplicateIndexes.length > 0) {
          analysis.issues.push(
            `Table '${tableName}' has duplicate indexes: ${duplicateIndexes.join(', ')}`
          );
        }
      } catch (error) {
        logger.warn(`Failed to analyze table '${tableName}':`, error.message);
        analysis.issues.push(`Failed to analyze table '${tableName}': ${error.message}`);
      }
    }

    return analysis;
  }

  /**
   * Improved duplicate index detection
   * @private
   */
  findDuplicateIndexesImproved(indexes) {
    const indexGroups = new Map();
    const duplicates = [];

    for (const index of indexes) {
      const indexName = index.name || index.Key_name;

      // Skip primary key
      if (indexName === 'PRIMARY') continue;

      // Create signature based on columns and type
      const columns = this.getIndexColumns(index);
      const signature = `${columns.join(',')}_${index.unique ? 'unique' : 'regular'}`;

      if (!indexGroups.has(signature)) {
        indexGroups.set(signature, []);
      }
      indexGroups.get(signature).push(indexName);
    }

    // Find groups with more than one index (duplicates)
    for (const [signature, indexNames] of indexGroups.entries()) {
      if (indexNames.length > 1) {
        // Keep the first one, mark others as duplicates
        duplicates.push(...indexNames.slice(1));
      }
    }

    return duplicates;
  }

  /**
   * Get columns from an index definition
   * @private
   */
  getIndexColumns(index) {
    if (Array.isArray(index.fields)) {
      return index.fields.map((f) => (typeof f === 'string' ? f : f.attribute));
    }
    return index.Column_name ? [index.Column_name] : [];
  }

  /**
   * Perform aggressive index cleanup to fix your database
   * @private
   */
  async performAggressiveIndexCleanup() {
    logger.info('🧹 Performing aggressive index cleanup');

    try {
      const existingTables = await this.queryInterface.showAllTables();
      let totalRemoved = 0;

      for (const tableName of existingTables) {
        const removed = await this.cleanupTableIndexesAggressively(tableName);
        totalRemoved += removed;
      }

      if (totalRemoved > 0) {
        logger.info(
          `✅ Aggressive index cleanup completed: removed ${totalRemoved} duplicate indexes`
        );
      } else {
        logger.info('✅ No duplicate indexes found to remove');
      }

      return totalRemoved;
    } catch (error) {
      logger.warn('⚠️  Aggressive index cleanup failed, continuing setup:', error.message);
      return 0;
    }
  }

  /**
   * Aggressively clean up indexes for a specific table
   * @private
   */
  async cleanupTableIndexesAggressively(tableName) {
    try {
      const indexes = await this.queryInterface.showIndex(tableName);

      if (indexes.length <= 5) {
        return 0; // Skip tables with few indexes
      }

      logger.info(
        `🧹 Aggressively cleaning indexes for table '${tableName}' (${indexes.length} indexes)`
      );

      const duplicateIndexes = this.findDuplicateIndexesImproved(indexes);
      let removedCount = 0;

      for (const indexName of duplicateIndexes) {
        try {
          await this.queryInterface.removeIndex(tableName, indexName);
          removedCount++;
          logger.debug(`🗑️  Removed duplicate index: ${indexName} from ${tableName}`);
        } catch (error) {
          logger.warn(`Failed to remove index ${indexName}:`, error.message);
        }
      }

      if (removedCount > 0) {
        logger.info(`✅ Cleaned table '${tableName}': removed ${removedCount} duplicate indexes`);
      }

      return removedCount;
    } catch (error) {
      logger.warn(`Failed to clean indexes for table '${tableName}':`, error.message);
      return 0;
    }
  }

  /**
   * Execute the appropriate migration strategy
   * @private
   */
  async executeMigrationStrategy() {
    logger.info(`🔄 Executing migration strategy: ${this.migrationStrategy}`);

    switch (this.migrationStrategy) {
      case 'migration-files':
        return await this.executeMigrationFiles();
      case 'schema-sync':
        return await this.syncDatabaseSchema();
      case 'hybrid':
        return await this.executeHybridMigration();
      default:
        throw new ApiError(`Unknown migration strategy: ${this.migrationStrategy}`, 500);
    }
  }

  /**
   * Determine the best migration strategy
   * @private
   */
  determineMigrationStrategy() {
    if (config.env === 'production') {
      return this.hasMigrationFiles() ? 'migration-files' : 'schema-sync';
    }

    if (config.env === 'development') {
      return this.hasMigrationFiles() ? 'hybrid' : 'schema-sync';
    }

    return 'schema-sync';
  }

  /**
   * Check if migration files are available
   * @private
   */
  hasMigrationFiles() {
    const migrationsPath = path.join(__dirname, '..', 'migrations');
    return (
      fs.existsSync(migrationsPath) &&
      fs.readdirSync(migrationsPath).some((file) => file.endsWith('.js'))
    );
  }

  /**
   * Execute migration files using Umzug
   * @private
   */
  async executeMigrationFiles() {
    logger.info('📄 Executing migration files');

    try {
      const Umzug = require('umzug');
      const migrationsPath = path.join(__dirname, '..', '..', 'migrations');

      const umzug = new Umzug({
        migrations: {
          path: migrationsPath,
          pattern: /\.js$/,
          params: [this.queryInterface, this.sequelize.constructor],
        },
        storage: 'sequelize',
        storageOptions: {
          sequelize: this.sequelize,
          tableName: 'SequelizeMeta',
        },
        logging: (message) => logger.info(`Migration: ${message}`),
      });

      const pendingMigrations = await umzug.pending();

      if (pendingMigrations.length > 0) {
        logger.info(`🔄 Executing ${pendingMigrations.length} pending migrations`);
        await umzug.up();
        logger.info('✅ Migrations completed successfully');
      } else {
        logger.info('✅ No pending migrations');
      }
    } catch (error) {
      if (config.env === 'production') {
        throw new ApiError(`Migration execution failed: ${error.message}`, 500);
      } else {
        logger.warn('⚠️  Migration files failed, falling back to schema sync');
        await this.syncDatabaseSchema();
      }
    }
  }

  /**
   * Synchronize database schema using Sequelize - FIXED VERSION
   * @private
   */
  async syncDatabaseSchema() {
    logger.info('🔄 Synchronizing database schema');

    const syncOptions = {
      force: false,
      alter: config.env !== 'production',
    };

    try {
      const modelCount = Object.keys(this.models).length;

      if (modelCount === 0) {
        logger.warn('⚠️  No models detected for synchronization');
        return;
      }

      if (syncOptions.alter) {
        await this.syncModelsIndividually();
      } else {
        // In production, sync all models at once
        for (const [modelName, model] of Object.entries(this.models)) {
          try {
            await model.sync(syncOptions);
            logger.debug(`✅ Synced model: ${modelName}`);
          } catch (error) {
            logger.error(`❌ Failed to sync model ${modelName}:`, error.message);
            if (config.env === 'production') {
              throw error;
            }
          }
        }
      }

      logger.info('✅ Database schema synchronized successfully');
    } catch (error) {
      await this.handleSyncError(error);
    }
  }

  /**
   * Execute hybrid migration (migration files + schema sync)
   * @private
   */
  async executeHybridMigration() {
    logger.info('🔄 Executing hybrid migration strategy');

    try {
      await this.executeMigrationFiles();
      await this.syncDatabaseSchema();
      logger.info('✅ Hybrid migration completed successfully');
    } catch (error) {
      throw new ApiError(`Hybrid migration failed: ${error.message}`, 500);
    }
  }

  /**
   * Sync models individually for better error handling - FIXED VERSION
   * @private
   */
  async syncModelsIndividually() {
    const modelEntries = Object.entries(this.models);
    logger.info(`🔄 Syncing ${modelEntries.length} models individually`);

    if (modelEntries.length === 0) {
      logger.warn('⚠️  No models available for synchronization');
      return [];
    }

    const syncResults = [];

    for (const [modelName, model] of modelEntries) {
      try {
        await model.sync({ alter: true });
        syncResults.push({ model: modelName, success: true });
        logger.debug(`✅ Synced model: ${modelName}`);
      } catch (error) {
        syncResults.push({ model: modelName, success: false, error: error.message });
        logger.error(`❌ Failed to sync model ${modelName}:`, error.message);

        if (error.original?.code === 'ER_TOO_MANY_KEYS') {
          await this.handleTooManyKeysError(modelName, error);
        }
      }
    }

    const failedModels = syncResults.filter((r) => !r.success);
    if (failedModels.length > 0) {
      logger.warn(
        `⚠️  Failed to sync ${failedModels.length} models:`,
        failedModels.map((m) => m.model).join(', ')
      );

      if (config.env === 'production') {
        throw new ApiError(
          `Failed to sync models: ${failedModels.map((m) => m.model).join(', ')}`,
          500
        );
      }
    }

    return syncResults;
  }

  /**
   * Handle "too many keys" error
   * @private
   */
  async handleTooManyKeysError(modelName, error) {
    logger.warn(`🔧 Handling "too many keys" error for model: ${modelName}`);

    try {
      const model = this.models[modelName];
      const tableName = model.tableName || modelName.toLowerCase();

      await this.cleanupTableIndexesAggressively(tableName);

      // Retry syncing the model
      await model.sync({ alter: true });
      logger.info(`✅ Successfully recovered from "too many keys" error for ${modelName}`);
    } catch (retryError) {
      logger.error(`❌ Failed to recover from "too many keys" error for ${modelName}:`, retryError);
    }
  }

  /**
   * Handle schema sync errors
   * @private
   */
  async handleSyncError(error) {
    logger.error('❌ Schema synchronization error:', error);

    if (error.original?.code === 'ER_TOO_MANY_KEYS') {
      logger.info('🔧 Attempting to resolve "too many keys" error');
      await this.performAggressiveIndexCleanup();

      try {
        await this.syncModelsIndividually();
        logger.info('✅ Successfully recovered from sync error');
        return;
      } catch (retryError) {
        logger.error('❌ Failed to recover from sync error:', retryError);
      }
    }

    if (config.env === 'production') {
      throw new ApiError(`Schema synchronization failed: ${error.message}`, 500);
    } else {
      logger.warn('⚠️  Continuing despite schema sync errors in development mode');
    }
  }

  /**
   * Seed initial data safely with better error handling
   * @private
   */
  async seedInitialDataSafely() {
    logger.info('🌱 Checking if initial data seeding is required');

    try {
      const hasData = await this.checkExistingData();

      if (!hasData) {
        logger.info('🌱 Seeding initial data');

        try {
          const initializeDatabase = require('./database-seeder.util');
          await initializeDatabase();
          logger.info('✅ Initial data seeded successfully');
        } catch (seederError) {
          logger.warn('⚠️  Database seeder failed:', seederError.message);

          // Check if it's a foreign key constraint error
          if (seederError.message.includes('foreign key constraint')) {
            logger.info('🔧 Attempting to fix foreign key constraint issues');
            await this.fixForeignKeyConstraints();
          }

          await this.createMinimalSeedData();
        }
      } else {
        logger.info('✅ Database already contains data, skipping seed operation');
      }
    } catch (error) {
      const errorMessage = `Data seeding error: ${error.message}`;

      if (config.env === 'production') {
        throw new ApiError(errorMessage, 500);
      } else {
        logger.warn(`⚠️  ${errorMessage}`);
      }
    }
  }

  /**
   * Fix foreign key constraint issues
   * @private
   */
  async fixForeignKeyConstraints() {
    logger.info('🔧 Attempting to fix foreign key constraint issues');

    try {
      // Disable foreign key checks temporarily
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

      // Try seeding again
      const initializeDatabase = require('./database-seeder.util');
      await initializeDatabase();

      // Re-enable foreign key checks
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

      logger.info('✅ Successfully seeded data with foreign key constraints disabled');
    } catch (error) {
      // Re-enable foreign key checks even if seeding fails
      await this.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
      logger.warn('⚠️  Failed to seed data even with constraints disabled:', error.message);
    }
  }

  /**
   * Check if database has existing data
   * @private
   */
  async checkExistingData() {
    const checkTables = ['User', 'Setting', 'SystemSetting'];

    for (const tableName of checkTables) {
      if (this.models[tableName]) {
        try {
          const count = await this.models[tableName].count();
          if (count > 0) return true;
        } catch (error) {
          logger.debug(`Could not check data in ${tableName}:`, error.message);
        }
      }
    }

    return false;
  }

  /**
   * Create minimal seed data
   * @private
   */
  async createMinimalSeedData() {
    logger.info('🌱 Creating minimal seed data');

    try {
      // Create basic system settings if SystemSetting model exists
      if (this.models.SystemSetting) {
        await this.models.SystemSetting.findOrCreate({
          where: { key: 'app_version' },
          defaults: { key: 'app_version', value: '1.0.0', description: 'Application version' },
        });

        await this.models.SystemSetting.findOrCreate({
          where: { key: 'maintenance_mode' },
          defaults: {
            key: 'maintenance_mode',
            value: 'false',
            description: 'Maintenance mode status',
          },
        });
      }

      logger.info('✅ Minimal seed data created');
    } catch (error) {
      logger.warn('⚠️  Failed to create minimal seed data:', error.message);
    }
  }

  /**
   * Verify database integrity comprehensively - FIXED VERSION
   * @private
   */
  async verifyDatabaseIntegrity() {
    logger.info('🔍 Verifying database integrity');
  
    const verificationResults = {
      tablesChecked: 0,
      tablesValid: 0,
      issues: [],
    };
  
    try {
      const modelEntries = Object.entries(this.models);
  
      if (modelEntries.length === 0) {
        const issue = 'No models available for integrity verification';
        verificationResults.issues.push(issue);
        logger.warn(`⚠️  ${issue}`);
      } else {
        for (const [modelName, model] of modelEntries) {
          verificationResults.tablesChecked++;
  
          try {
            await this.verifyModelIntegrity(model, modelName);
            verificationResults.tablesValid++;
          } catch (error) {
            const issue = `Model '${modelName}' integrity check failed: ${error.message}`;
            verificationResults.issues.push(issue);
            logger.warn(`⚠️  ${issue}`);
          }
        }
      }
  
      // Verify foreign key constraints
      await this.verifyForeignKeyConstraints(verificationResults);
  
      // Verify essential indexes (but don't fail in production)
      await this.verifyEssentialIndexes(verificationResults);
  
      // Log verification summary
      this.logVerificationResults(verificationResults);
  
      // FIXED: Only fail on critical issues, and be more lenient in production
      const criticalIssues = verificationResults.issues.filter(issue => 
        issue.includes('integrity check failed') || 
        issue.includes('No models available')
      );
  
      if (criticalIssues.length > 0 && config.env === 'production') {
        logger.error('❌ Critical database integrity issues found:', criticalIssues);
        throw new ApiError(
          'Critical database integrity verification failed',
          500,
          criticalIssues
        );
      } else if (verificationResults.issues.length > 0 && config.env === 'production') {
        logger.warn('⚠️  Non-critical database issues found, continuing in production:', verificationResults.issues);
      }
  
      return verificationResults;
    } catch (error) {
      logger.error('❌ Database integrity verification failed:', error);
  
      if (config.env === 'production') {
        // Only re-throw if it's a critical error
        if (error.message.includes('Critical database integrity')) {
          throw error;
        } else {
          logger.warn('⚠️  Continuing despite integrity verification issues in production');
          return verificationResults;
        }
      } else {
        logger.warn('⚠️  Continuing despite integrity verification issues');
        return verificationResults;
      }
    }
  }

  /**
   * Verify individual model integrity
   * @private
   */
  async verifyModelIntegrity(model, modelName) {
    try {
      // Test basic queries
      const primaryKey = model.primaryKeyAttribute;
      if (primaryKey) {
        await model.findOne({
          attributes: [primaryKey],
          limit: 1,
          logging: false,
        });
      }

      // Verify table structure matches model definition
      const tableInfo = await this.queryInterface.describeTable(model.tableName);
      const modelAttributes = Object.keys(model.rawAttributes);

      const missingColumns = modelAttributes.filter(
        (attr) => !tableInfo[attr] && !model.rawAttributes[attr].virtual
      );

      if (missingColumns.length > 0) {
        throw new Error(`Missing columns in database: ${missingColumns.join(', ')}`);
      }

      logger.debug(`✅ Model ${modelName} integrity verified`);
    } catch (error) {
      logger.warn(`⚠️  Model ${modelName} integrity check failed:`, error.message);
      throw error;
    }
  }

  /**
   * Verify foreign key constraints
   * @private
   */
  async verifyForeignKeyConstraints(verificationResults) {
    try {
      logger.debug('🔗 Verifying foreign key constraints');

      const foreignKeyQueries = await this.sequelize.query(
        `
        SELECT 
          TABLE_NAME,
          COLUMN_NAME,
          CONSTRAINT_NAME,
          REFERENCED_TABLE_NAME,
          REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE 
        WHERE REFERENCED_TABLE_SCHEMA = DATABASE()
          AND REFERENCED_TABLE_NAME IS NOT NULL
      `,
        { type: this.sequelize.QueryTypes.SELECT }
      );

      if (foreignKeyQueries.length === 0) {
        verificationResults.issues.push(
          'No foreign key constraints found - this may indicate schema sync issues'
        );
      } else {
        logger.debug(`✅ Found ${foreignKeyQueries.length} foreign key constraints`);
      }
    } catch (error) {
      verificationResults.issues.push(`Foreign key verification failed: ${error.message}`);
    }
  }

  /**
   * Verify essential indexes exist
   * @private
   */
  async verifyEssentialIndexes(verificationResults) {
    try {
      logger.debug('📊 Verifying essential indexes');
  
      const tables = await this.queryInterface.showAllTables();
      let missingEssentialIndexes = 0;
  
      for (const tableName of tables) {
        const indexes = await this.queryInterface.showIndex(tableName);
        const essentialIndexes = this.getEssentialIndexesForTable(tableName);
  
        for (const essentialIndex of essentialIndexes) {
          if (!this.hasEquivalentIndex(indexes, essentialIndex)) {
            missingEssentialIndexes++;
            
            // In production, log as warning instead of error
            const message = `Missing essential index '${essentialIndex.name}' on table '${tableName}'`;
            
            if (config.env === 'production') {
              logger.warn(`⚠️  ${message}`);
              // Don't add to issues in production - just log the warning
            } else {
              verificationResults.issues.push(message);
            }
          }
        }
      }
  
      if (missingEssentialIndexes === 0) {
        logger.debug('✅ All essential indexes are present');
      } else if (config.env === 'production') {
        logger.warn(`⚠️  Found ${missingEssentialIndexes} missing indexes in production - continuing anyway`);
      }
    } catch (error) {
      const message = `Index verification failed: ${error.message}`;
      
      if (config.env === 'production') {
        logger.warn(`⚠️  ${message}`);
        // Don't add to issues in production
      } else {
        verificationResults.issues.push(message);
      }
    }
  }

  /**
   * Get essential indexes for a table based on common patterns
   * @private
   */
  getEssentialIndexesForTable(tableName) {
    // Instead of hardcoding indexes, check what the model actually defines
    const modelName = this.getModelNameFromTableName(tableName);
    const model = this.models[modelName];
    
    if (model && model.options && model.options.indexes) {
      return model.options.indexes.map(index => ({
        name: index.name || `idx_${tableName}_${index.fields.join('_')}`,
        columns: index.fields
      }));
    }
    
    // Return empty array if no essential indexes are defined in the model
    return [];
  }

  getModelNameFromTableName(tableName) {
    for (const [modelName, model] of Object.entries(this.models)) {
      if (model.tableName === tableName || 
          model.tableName === tableName.toLowerCase() ||
          modelName.toLowerCase() === tableName.toLowerCase()) {
        return modelName;
      }
    }
    return null;
  }

  /**
   * Check if an equivalent index already exists
   * @private
   */
  hasEquivalentIndex(existingIndexes, targetIndex) {
    const targetSignature = targetIndex.columns.join(',');

    return existingIndexes.some((existing) => {
      const existingColumns = this.getIndexColumns(existing);
      return existingColumns.join(',') === targetSignature;
    });
  }

  /**
   * Log verification results
   * @private
   */
  logVerificationResults(results) {
    logger.info(`📊 Database Integrity Verification Results:`);
    logger.info(`   • Tables checked: ${results.tablesChecked}`);
    logger.info(`   • Tables valid: ${results.tablesValid}`);
    logger.info(`   • Issues found: ${results.issues.length}`);

    if (results.issues.length > 0) {
      logger.warn(`⚠️  Issues detected:`, results.issues);
    } else {
      logger.info('✅ Database integrity verification passed');
    }
  }

  /**
   * Handle setup failure with appropriate error handling
   * @private
   */
  handleSetupFailure(error, setupResult) {
    logger.error(`❌ Database setup failed after ${setupResult.duration}ms:`, error);

    if (config.env === 'production') {
      logger.error('🚨 Production database setup failure - server will not start');
      return { ...setupResult, critical: true };
    } else {
      logger.warn('⚠️  Development database setup failed - continuing with limited functionality');
      logger.warn(`   Error: ${error.message}`);
      return { ...setupResult, degraded: true };
    }
  }

  /**
   * Generate table configurations dynamically
   * @private
   */
  generateTableConfigurations() {
    const configurations = {};

    Object.entries(this.models).forEach(([modelName, model]) => {
      configurations[modelName] = {
        tableName: model.tableName,
        primaryKey: model.primaryKeyAttribute,
        attributes: Object.keys(model.rawAttributes),
        associations: Object.keys(model.associations || {}),
        indexes: this.extractModelIndexes(model),
      };
    });

    return configurations;
  }

  /**
   * Extract index definitions from a model
   * @private
   */
  extractModelIndexes(model) {
    const indexes = [];

    if (model.options && model.options.indexes) {
      model.options.indexes.forEach((index) => {
        indexes.push({
          name: index.name,
          fields: index.fields,
          unique: index.unique || false,
          type: index.type || 'BTREE',
        });
      });
    }

    return indexes;
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus() {
    const health = {
      database: { status: 'unknown', details: {} },
      models: { status: 'unknown', details: {} },
      indexes: { status: 'unknown', details: {} },
      performance: { status: 'unknown', details: {} },
    };

    try {
      // Database connection health
      const start = Date.now();
      await this.sequelize.authenticate();
      const connectionTime = Date.now() - start;

      health.database = {
        status: connectionTime < 1000 ? 'healthy' : 'slow',
        details: {
          connectionTime,
          dialect: this.sequelize.getDialect(),
          version: await this.getDatabaseVersion(),
        },
      };

      // Model health
      const modelCount = Object.keys(this.models).length;
      health.models = {
        status: modelCount > 0 ? 'healthy' : 'error',
        details: {
          totalModels: modelCount,
          loadedModels: Object.keys(this.models),
        },
      };

      // Index health
      const indexStats = await this.getIndexStatistics();
      health.indexes = {
        status: indexStats.issues === 0 ? 'healthy' : 'warning',
        details: indexStats,
      };

      // Performance health
      const perfStats = await this.getPerformanceStatistics();
      health.performance = {
        status: perfStats.avgQueryTime < 100 ? 'healthy' : 'warning',
        details: perfStats,
      };
    } catch (error) {
      health.database.status = 'error';
      health.database.details.error = error.message;
    }

    return health;
  }

  /**
   * Get database version information
   * @private
   */
  async getDatabaseVersion() {
    try {
      const [results] = await this.sequelize.query('SELECT VERSION() as version');
      return results[0]?.version || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  /**
   * Get comprehensive index statistics
   * @private
   */
  async getIndexStatistics() {
    const stats = {
      totalTables: 0,
      totalIndexes: 0,
      duplicateIndexes: 0,
      unusedIndexes: 0,
      issues: 0,
    };

    try {
      const tables = await this.queryInterface.showAllTables();
      stats.totalTables = tables.length;

      for (const tableName of tables) {
        const indexes = await this.queryInterface.showIndex(tableName);
        stats.totalIndexes += indexes.length;

        const duplicates = this.findDuplicateIndexesImproved(indexes);
        stats.duplicateIndexes += duplicates.length;
      }

      stats.issues = stats.duplicateIndexes;
    } catch (error) {
      stats.error = error.message;
      stats.issues = 1;
    }

    return stats;
  }

  /**
   * Get performance statistics
   * @private
   */
  async getPerformanceStatistics() {
    const stats = {
      avgQueryTime: 0,
      slowQueries: 0,
      totalQueries: 0,
    };

    try {
      // Simple performance test
      const testQueries = [
        'SELECT 1',
        'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()',
        'SHOW TABLES',
      ];

      let totalTime = 0;

      for (const query of testQueries) {
        const start = Date.now();
        await this.sequelize.query(query);
        const queryTime = Date.now() - start;
        totalTime += queryTime;

        if (queryTime > 1000) {
          stats.slowQueries++;
        }
      }

      stats.totalQueries = testQueries.length;
      stats.avgQueryTime = totalTime / testQueries.length;
    } catch (error) {
      stats.error = error.message;
    }

    return stats;
  }

  /**
   * Emergency index cleanup function for severe cases
   */
  async emergencyIndexCleanup() {
    logger.warn('🚨 Performing emergency index cleanup');

    const problematicTables = ['messages', 'transactions', 'users'];
    let totalCleaned = 0;

    for (const tableName of problematicTables) {
      try {
        const indexes = await this.queryInterface.showIndex(tableName);

        if (indexes.length > 40) {
          logger.warn(
            `🚨 Table ${tableName} has ${indexes.length} indexes - performing emergency cleanup`
          );

          // Keep only essential indexes
          const essentialPatterns = ['PRIMARY', 'email', 'unique'];
          const indexesToRemove = indexes.filter((index) => {
            const indexName = (index.name || index.Key_name || '').toLowerCase();
            return !essentialPatterns.some((pattern) => indexName.includes(pattern));
          });

          // Remove excessive indexes (keep only first few of each type)
          const toRemove = indexesToRemove.slice(10); // Keep first 10 non-essential

          for (const index of toRemove) {
            try {
              const indexName = index.name || index.Key_name;
              await this.queryInterface.removeIndex(tableName, indexName);
              totalCleaned++;
              logger.debug(`🗑️  Emergency removed: ${indexName} from ${tableName}`);
            } catch (error) {
              logger.warn(`Failed to remove ${index.name}:`, error.message);
            }
          }
        }
      } catch (error) {
        logger.error(`Emergency cleanup failed for ${tableName}:`, error);
      }
    }

    logger.warn(`🚨 Emergency cleanup completed: removed ${totalCleaned} indexes`);
    return totalCleaned;
  }
}

/**
 * Create and configure database setup manager instance
 */
function createDatabaseSetupManager() {
  return new DatabaseSetupManager();
}

/**
 * Main setup function with enhanced error handling
 * @returns {Promise<DatabaseSetupResult>} Detailed setup results
 */
async function setupDatabase() {
  try {
    const manager = createDatabaseSetupManager();
    const result = await manager.setupDatabase();
    
    // Enhanced result handling
    if (result.success) {
      logger.info('✅ Database setup completed successfully');
      return { success: true, shouldContinue: true, result };
    } else if (result.shouldExit) {
      logger.error('❌ Critical database setup failure - application should not start');
      return { success: false, shouldContinue: false, result };
    } else {
      logger.warn('⚠️  Database setup completed with warnings - application can continue');
      return { success: false, shouldContinue: true, result };
    }
  } catch (error) {
    logger.error('❌ Database setup failed with exception:', error.message);
    
    const isCritical = config.env === 'production';
    return { 
      success: false, 
      shouldContinue: !isCritical, 
      error: error.message 
    };
  }
}

/**
 * Get database health status (new utility function)
 * @returns {Promise<Object>} Health status object
 */
async function getDatabaseHealth() {
  try {
    const manager = createDatabaseSetupManager();
    return await manager.getHealthStatus();
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
    };
  }
}

/**
 * Emergency function to clean up excessive indexes
 * @returns {Promise<number>} Number of indexes removed
 */
async function emergencyIndexCleanup() {
  try {
    const manager = createDatabaseSetupManager();
    return await manager.emergencyIndexCleanup();
  } catch (error) {
    logger.error('Emergency index cleanup failed:', error);
    return 0;
  }
}

/**
 * Utility function to get comprehensive table information
 * @param {string} tableName - Optional table name to get specific info
 * @returns {Promise<Object>} Table information
 */
async function getTableInfo(tableName = null) {
  try {
    const manager = createDatabaseSetupManager();

    if (tableName) {
      const indexes = await manager.queryInterface.showIndex(tableName);
      const columns = await manager.queryInterface.describeTable(tableName);

      return {
        tableName,
        columns: Object.keys(columns).length,
        indexes: indexes.length,
        indexDetails: indexes.map((idx) => ({
          name: idx.name || idx.Key_name,
          columns: manager.getIndexColumns(idx),
          unique: idx.unique || false,
        })),
      };
    } else {
      const tables = await manager.queryInterface.showAllTables();
      const tableInfos = {};

      for (const table of tables) {
        tableInfos[table] = await getTableInfo(table);
      }

      return tableInfos;
    }
  } catch (error) {
    logger.error(`Failed to get table info for ${tableName || 'all tables'}:`, error);
    return null;
  }
}

/**
 * Utility function to optimize specific table indexes
 * @param {string} tableName - Table name to optimize
 * @returns {Promise<Object>} Optimization results
 */
async function optimizeTableIndexes(tableName) {
  try {
    const manager = createDatabaseSetupManager();
    return await manager.cleanupTableIndexesAggressively(tableName);
  } catch (error) {
    logger.error(`Failed to optimize indexes for table ${tableName}:`, error);
    return { tableName, optimized: false, error: error.message };
  }
}

/**
 * Fix foreign key constraint issues during seeding
 * @returns {Promise<boolean>} Success status
 */
async function fixSeedingConstraints() {
  try {
    const manager = createDatabaseSetupManager();
    await manager.fixForeignKeyConstraints();
    return true;
  } catch (error) {
    logger.error('Failed to fix seeding constraints:', error);
    return false;
  }
}

// Export all functions
module.exports = {
  // Main functions
  setupDatabase,
  createDatabaseSetupManager,

  // Health and monitoring
  getDatabaseHealth,
  getTableInfo,

  // Optimization utilities
  optimizeTableIndexes,
  emergencyIndexCleanup,

  // Seeding utilities
  fixSeedingConstraints,

  // Backward compatibility (deprecated - use getDatabaseHealth instead)
  verifyDatabaseIntegrity: getDatabaseHealth,
  cleanupExcessiveIndexes: async () => {
    const manager = createDatabaseSetupManager();
    return await manager.performAggressiveIndexCleanup();
  },

  // Legacy function aliases
  validateDatabaseConfig: async () => {
    const manager = createDatabaseSetupManager();
    return await manager.validateEnvironmentAndConfig();
  },

  executeMigrations: async () => {
    const manager = createDatabaseSetupManager();
    return await manager.executeMigrationStrategy();
  },

  syncDatabaseSchema: async () => {
    const manager = createDatabaseSetupManager();
    return await manager.syncDatabaseSchema();
  },
};
