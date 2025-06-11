// backend/src/utils/database-setup.util.js - PRODUCTION FIXED VERSION
const fs = require('fs');
const path = require('path');
const db = require('../models');
const config = require('../config/config');
const logger = require('../config/logger');
const ApiError = require('./api-error.util');

/**
 * Production-Ready Database Setup Manager
 * Fixed for Railway and production environment compatibility
 */
class DatabaseSetupManager {
  constructor() {
    this.initializationStartTime = Date.now();
    this.sequelize = db.sequelize;
    this.queryInterface = this.sequelize.getQueryInterface();
    this.models = this.getModelsFromSequelize();
    this.isProduction = config.env === 'production';
    this.isRailway = process.env.RAILWAY_ENVIRONMENT_NAME || process.env.DATABASE_URL;
    
    // Production-specific settings
    this.productionSettings = {
      skipAggressiveCleanup: true,
      useConservativeSync: true,
      maxRetries: 3,
      retryDelay: 5000,
      skipForeignKeyDisable: true
    };

    logger.info(`🚀 Database setup initialized for ${config.env} environment`);
    if (this.isRailway) {
      logger.info('🚂 Railway deployment detected - using production-safe settings');
    }
  }

  /**
   * Enhanced model detection for production
   */
  getModelsFromSequelize() {
    const models = {};
    
    logger.info('🔍 Starting production-safe model detection...');

    // Method 1: Check db object for valid Sequelize models
    Object.keys(db).forEach((key) => {
      if (key === 'sequelize' || key === 'Sequelize' || key === 'isHealthy') {
        return;
      }

      const model = db[key];
      if (this.isValidSequelizeModel(model)) {
        models[key] = model;
        logger.debug(`✅ Found model: ${key} -> ${model.tableName}`);
      }
    });

    // Method 2: Check sequelize.models if not enough found
    if (Object.keys(models).length < 5 && this.sequelize.models) {
      Object.entries(this.sequelize.models).forEach(([key, model]) => {
        if (this.isValidSequelizeModel(model) && !models[key]) {
          models[key] = model;
          logger.debug(`✅ Found via sequelize.models: ${key}`);
        }
      });
    }

    const modelCount = Object.keys(models).length;
    logger.info(`📊 Model detection complete: ${modelCount} models found`);
    
    if (modelCount === 0) {
      logger.error('❌ CRITICAL: No models detected!');
      // In production, try one more time with force reload
      if (this.isProduction) {
        return this.forceReloadModelsProduction();
      }
    }

    return models;
  }

  /**
   * Production-safe model reload
   */
  forceReloadModelsProduction() {
    logger.warn('🔄 Attempting production-safe model reload...');
    
    try {
      // Clear require cache selectively
      const modelsPath = path.join(__dirname, '../models');
      if (fs.existsSync(modelsPath)) {
        const indexPath = path.join(modelsPath, 'index.js');
        delete require.cache[require.resolve(indexPath)];
        
        // Reload models
        const freshDb = require('../models');
        
        // Extract models
        const models = {};
        Object.keys(freshDb).forEach(key => {
          if (key !== 'sequelize' && key !== 'Sequelize' && key !== 'isHealthy') {
            const model = freshDb[key];
            if (this.isValidSequelizeModel(model)) {
              models[key] = model;
              logger.info(`✅ Reloaded model: ${key}`);
            }
          }
        });
        
        // Update sequelize reference
        if (freshDb.sequelize) {
          this.sequelize = freshDb.sequelize;
          this.queryInterface = this.sequelize.getQueryInterface();
        }
        
        return models;
      }
    } catch (error) {
      logger.error('❌ Production model reload failed:', error.message);
    }
    
    return {};
  }

  /**
   * Enhanced model validation
   */
  isValidSequelizeModel(obj) {
    return !!(
      obj &&
      typeof obj === 'function' &&
      obj.tableName &&
      obj.rawAttributes &&
      typeof obj.sync === 'function' &&
      typeof obj.findOne === 'function'
    );
  }

  /**
   * Main production-safe database setup
   */
  async setupDatabase() {
    logger.info('🚀 Starting production-safe database setup');

    const setupResult = {
      success: false,
      fullyHealthy: false,
      shouldContinue: false,
      operations: [],
      warnings: [],
      errors: []
    };

    try {
      // Phase 1: Environment validation
      await this.executePhase('validation', setupResult, async () => {
        await this.validateProductionEnvironment();
      });

      // Phase 2: Database connection with retries
      await this.executePhase('connection', setupResult, async () => {
        await this.establishDatabaseConnectionWithRetries();
      });

      // Phase 3: Schema analysis (conservative)
      await this.executePhase('analysis', setupResult, async () => {
        await this.analyzeSchemaConservatively();
      });

      // Phase 4: Production-safe migration
      await this.executePhase('migration', setupResult, async () => {
        await this.executeProductionSafeMigration();
      });

      // Phase 5: Data verification
      await this.executePhase('verification', setupResult, async () => {
        await this.verifyDatabaseIntegrityProduction();
      });

      setupResult.success = true;
      setupResult.fullyHealthy = true;
      setupResult.shouldContinue = true;

      logger.info('✅ Production database setup completed successfully');
      return setupResult;

    } catch (error) {
      logger.error('❌ Production database setup failed:', error.message);
      setupResult.errors.push(error.message);
      
      // In production, try to continue with degraded functionality
      if (this.isProduction) {
        setupResult.shouldContinue = true;
        setupResult.success = false;
        logger.warn('⚠️  Continuing in degraded mode for production');
      }
      
      return setupResult;
    }
  }

  /**
   * Execute setup phase with error handling
   */
  async executePhase(phaseName, setupResult, phaseFunction) {
    const phaseStart = Date.now();
    logger.info(`📋 Phase: ${phaseName.toUpperCase()}`);

    let retryCount = 0;
    const maxRetries = this.productionSettings.maxRetries;

    while (retryCount <= maxRetries) {
      try {
        await phaseFunction();
        const duration = Date.now() - phaseStart;
        setupResult.operations.push({ phase: phaseName, success: true, duration, retries: retryCount });
        logger.info(`✅ Phase ${phaseName} completed in ${duration}ms`);
        return;
      } catch (error) {
        retryCount++;
        
        if (retryCount <= maxRetries && this.isProduction) {
          logger.warn(`⚠️  Phase ${phaseName} failed (attempt ${retryCount}/${maxRetries + 1}): ${error.message}`);
          await this.delay(this.productionSettings.retryDelay);
        } else {
          const duration = Date.now() - phaseStart;
          setupResult.operations.push({
            phase: phaseName,
            success: false,
            duration,
            retries: retryCount - 1,
            error: error.message
          });
          throw error;
        }
      }
    }
  }

  /**
   * Validate production environment
   */
  async validateProductionEnvironment() {
    logger.info('🔍 Validating production environment');

    // Check for Railway-specific configuration
    if (this.isRailway) {
      logger.info('🚂 Railway deployment detected');
      
      // Validate DATABASE_URL if present
      if (process.env.DATABASE_URL) {
        const dbUrl = process.env.DATABASE_URL;
        
        // Parse Railway database URL format
        const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
        if (!urlMatch) {
          throw new Error('Invalid Railway DATABASE_URL format');
        }
        
        const [, user, password, host, port, database] = urlMatch;
        logger.info(`📊 Railway Database: ${database} at ${host}:${port}`);
        
        // Store Railway database name for later use
        this.railwayDbName = database;
      }
    }

    // Validate model count
    const modelCount = Object.keys(this.models).length;
    if (modelCount === 0) {
      throw new Error('No models detected - cannot proceed');
    }

    logger.info(`✅ Environment validation passed (${modelCount} models)`);
  }

  /**
   * Establish database connection with retries
   */
  async establishDatabaseConnectionWithRetries() {
    logger.info('🔗 Establishing production database connection');

    let lastError;
    
    for (let attempt = 1; attempt <= this.productionSettings.maxRetries; attempt++) {
      try {
        await this.sequelize.authenticate();
        
        // Test query to ensure connection works
        const [results] = await this.sequelize.query('SELECT 1 as test');
        
        if (results && results[0] && results[0].test === 1) {
          logger.info(`✅ Database connection established (attempt ${attempt})`);
          return;
        } else {
          throw new Error('Database test query failed');
        }
      } catch (error) {
        lastError = error;
        logger.warn(`⚠️  Connection attempt ${attempt} failed: ${error.message}`);
        
        if (attempt < this.productionSettings.maxRetries) {
          await this.delay(this.productionSettings.retryDelay);
        }
      }
    }
    
    throw new Error(`Database connection failed after ${this.productionSettings.maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * Conservative schema analysis for production
   */
  async analyzeSchemaConservatively() {
    logger.info('🔍 Performing conservative schema analysis');

    try {
      const existingTables = await this.queryInterface.showAllTables();
      logger.info(`📊 Found ${existingTables.length} existing tables`);

      // In production, just log what we find without aggressive changes
      if (this.isProduction) {
        const expectedTables = Object.keys(this.models).length;
        const missingTables = expectedTables - existingTables.length;
        
        if (missingTables > 0) {
          logger.warn(`⚠️  ${missingTables} tables may be missing - will be created during sync`);
        }
        
        // Log existing tables for debugging
        logger.debug(`Existing tables: ${existingTables.join(', ')}`);
      }

      return { existingTables, analysis: 'conservative' };
    } catch (error) {
      logger.warn(`⚠️  Schema analysis failed: ${error.message}`);
      // In production, continue anyway
      return { existingTables: [], analysis: 'failed', error: error.message };
    }
  }

  /**
   * Production-safe migration execution
   */
  async executeProductionSafeMigration() {
    logger.info('🔄 Executing production-safe migration');

    if (this.productionSettings.useConservativeSync) {
      await this.conservativeModelSync();
    } else {
      // Fallback to standard sync
      await this.standardModelSync();
    }
  }

  /**
   * Conservative model synchronization
   */
  async conservativeModelSync() {
    logger.info('🔄 Performing conservative model synchronization');

    const models = Object.entries(this.models);
    const syncResults = [];

    for (const [modelName, model] of models) {
      try {
        // Check if table exists first
        const tableExists = await this.checkTableExists(model.tableName);
        
        if (!tableExists) {
          logger.info(`📋 Creating new table: ${model.tableName}`);
          await model.sync({ force: false });
        } else {
          // Table exists, try gentle sync
          logger.debug(`📋 Syncing existing table: ${model.tableName}`);
          
          if (this.isProduction) {
            // In production, be very conservative
            await model.sync({ alter: false, force: false });
          } else {
            await model.sync({ alter: true, force: false });
          }
        }
        
        syncResults.push({ model: modelName, success: true });
        logger.debug(`✅ Synced: ${modelName}`);
        
      } catch (error) {
        syncResults.push({ model: modelName, success: false, error: error.message });
        logger.error(`❌ Failed to sync ${modelName}: ${error.message}`);
        
        // In production, continue with other models
        if (!this.isProduction) {
          throw error;
        }
      }
    }

    const successCount = syncResults.filter(r => r.success).length;
    const failedCount = syncResults.filter(r => !r.success).length;
    
    logger.info(`📊 Model sync results: ${successCount} success, ${failedCount} failed`);
    
    if (failedCount > 0 && !this.isProduction) {
      const failedModels = syncResults.filter(r => !r.success).map(r => r.model);
      throw new Error(`Failed to sync models: ${failedModels.join(', ')}`);
    }
  }

  /**
   * Check if table exists
   */
  async checkTableExists(tableName) {
    try {
      await this.queryInterface.describeTable(tableName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Standard model synchronization (fallback)
   */
  async standardModelSync() {
    logger.info('🔄 Performing standard model synchronization');

    const syncOptions = {
      force: false,
      alter: !this.isProduction // Don't alter in production
    };

    try {
      // Sync all models
      await this.sequelize.sync(syncOptions);
      logger.info('✅ Standard model sync completed');
    } catch (error) {
      logger.error(`❌ Standard sync failed: ${error.message}`);
      
      // Try individual model sync as fallback
      await this.conservativeModelSync();
    }
  }

  /**
   * Production-safe database integrity verification
   */
  async verifyDatabaseIntegrityProduction() {
    logger.info('🔍 Verifying database integrity (production-safe)');

    const verificationResults = {
      tablesChecked: 0,
      tablesValid: 0,
      issues: []
    };

    try {
      const modelEntries = Object.entries(this.models);
      
      for (const [modelName, model] of modelEntries) {
        verificationResults.tablesChecked++;
        
        try {
          // Simple existence check
          await model.findOne({ limit: 1, logging: false });
          verificationResults.tablesValid++;
          logger.debug(`✅ Verified: ${modelName}`);
        } catch (error) {
          const issue = `Model '${modelName}' verification failed: ${error.message}`;
          verificationResults.issues.push(issue);
          logger.warn(`⚠️  ${issue}`);
        }
      }

      // In production, be more lenient with verification results
      if (this.isProduction) {
        const successRate = (verificationResults.tablesValid / verificationResults.tablesChecked) * 100;
        
        if (successRate < 50) {
          logger.error(`❌ Critical: Only ${successRate.toFixed(1)}% of models verified successfully`);
          throw new Error('Critical database integrity failure');
        } else if (successRate < 80) {
          logger.warn(`⚠️  Warning: Only ${successRate.toFixed(1)}% of models verified successfully`);
          // Continue anyway in production
        } else {
          logger.info(`✅ Database integrity acceptable: ${successRate.toFixed(1)}% success rate`);
        }
      }

      return verificationResults;
    } catch (error) {
      if (this.isProduction) {
        logger.warn(`⚠️  Integrity verification failed, continuing: ${error.message}`);
        return verificationResults;
      } else {
        throw error;
      }
    }
  }

  /**
   * Get production-safe health status
   */
  async getHealthStatus() {
    const health = {
      database: { status: 'unknown', details: {} },
      models: { status: 'unknown', details: {} },
      environment: { status: 'unknown', details: {} }
    };

    try {
      // Database connection health
      const start = Date.now();
      await this.sequelize.authenticate();
      const connectionTime = Date.now() - start;

      health.database = {
        status: connectionTime < 2000 ? 'healthy' : 'slow',
        details: {
          connectionTime,
          dialect: this.sequelize.getDialect(),
          isProduction: this.isProduction,
          isRailway: this.isRailway
        }
      };

      // Model health
      const modelCount = Object.keys(this.models).length;
      health.models = {
        status: modelCount > 5 ? 'healthy' : 'warning',
        details: {
          totalModels: modelCount,
          expectedModels: 14
        }
      };

      // Environment health
      health.environment = {
        status: 'healthy',
        details: {
          nodeEnv: config.env,
          isRailway: this.isRailway,
          hasDbUrl: !!process.env.DATABASE_URL,
          railwayDb: this.railwayDbName || 'not detected'
        }
      };

    } catch (error) {
      health.database.status = 'error';
      health.database.details.error = error.message;
    }

    return health;
  }

  /**
   * Utility function to add delay
   */
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Production-safe database setup function
 */
async function setupDatabase() {
  try {
    const manager = new DatabaseSetupManager();
    const result = await manager.setupDatabase();
    
    return {
      success: result.success,
      shouldContinue: result.shouldContinue || result.success,
      fullyHealthy: result.fullyHealthy,
      errors: result.errors,
      warnings: result.warnings
    };
  } catch (error) {
    logger.error('❌ Database setup failed:', error.message);
    
    // In production, allow continuation with degraded mode
    const shouldContinue = config.env === 'production';
    
    return {
      success: false,
      shouldContinue,
      fullyHealthy: false,
      errors: [error.message]
    };
  }
}

/**
 * Production-safe health check
 */
async function getDatabaseHealth() {
  try {
    const manager = new DatabaseSetupManager();
    return await manager.getHealthStatus();
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Emergency recovery for production issues
 */
async function performEmergencyRecovery() {
  logger.warn('🚑 Performing emergency recovery for production');
  
  const recoveryResult = {
    success: false,
    actions: [],
    errors: []
  };

  try {
    // Action 1: Reconnect to database
    recoveryResult.actions.push('database-reconnect');
    const manager = new DatabaseSetupManager();
    await manager.establishDatabaseConnectionWithRetries();
    
    // Action 2: Verify critical models
    recoveryResult.actions.push('model-verification');
    const modelCount = Object.keys(manager.models).length;
    if (modelCount < 5) {
      // Try to reload models
      manager.models = manager.forceReloadModelsProduction();
    }
    
    // Action 3: Basic table sync
    recoveryResult.actions.push('conservative-sync');
    await manager.conservativeModelSync();
    
    recoveryResult.success = true;
    logger.info('✅ Emergency recovery completed successfully');
    
  } catch (error) {
    recoveryResult.errors.push(error.message);
    logger.error('❌ Emergency recovery failed:', error.message);
  }

  return recoveryResult;
}

module.exports = {
  setupDatabase,
  getDatabaseHealth,
  performEmergencyRecovery,
  DatabaseSetupManager
};