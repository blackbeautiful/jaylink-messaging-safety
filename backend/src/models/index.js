// backend/src/models/index.js - PRODUCTION OPTIMIZED VERSION
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config/database');
const logger = require('../config/logger');

const basename = path.basename(__filename);
const isProduction = process.env.NODE_ENV === 'production';
const isRailway = !!(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.DATABASE_URL);

// Production-safe Sequelize initialization
let sequelize;
try {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
      ...config,
      // Production-specific overrides
      logging: isProduction ? false : (msg) => logger.debug(msg),
      pool: {
        ...config.pool,
        // More conservative pool settings for production
        max: isProduction ? 15 : config.pool?.max || 10,
        min: isProduction ? 3 : config.pool?.min || 2,
        acquire: isProduction ? 60000 : config.pool?.acquire || 30000,
        idle: isProduction ? 30000 : config.pool?.idle || 10000
      },
      // Production retry configuration
      retry: {
        ...config.retry,
        max: isProduction ? 5 : config.retry?.max || 3
      }
    }
  );
  
  logger.info(`📊 Sequelize initialized for ${isProduction ? 'production' : 'development'}`);
  if (isRailway) {
    logger.info('🚂 Railway deployment detected');
  }
} catch (error) {
  logger.error('❌ Sequelize initialization failed:', error.message);
  throw error;
}

// Initialize db object
const db = {};

/**
 * Production-safe model loading
 */
function loadModelsProduction() {
  const models = {};
  
  try {
    // Get model files
    const modelFiles = fs.readdirSync(__dirname)
      .filter((file) => {
        return (
          file.indexOf('.') !== 0 &&
          file !== basename &&
          file !== 'compatibility.js' &&
          file.slice(-3) === '.js' &&
          !file.includes('.test.') &&
          !file.includes('.spec.')
        );
      });

    logger.info(`📋 Loading ${modelFiles.length} model files...`);

    // Load each model with error handling
    const loadResults = [];
    
    modelFiles.forEach((file) => {
      try {
        logger.debug(`Loading model: ${file}`);
        
        const modelPath = path.join(__dirname, file);
        const modelDefinition = require(modelPath);
        
        if (typeof modelDefinition === 'function') {
          const model = modelDefinition(sequelize, Sequelize.DataTypes);
          
          if (model && model.name && model.tableName && typeof model.sync === 'function') {
            models[model.name] = model;
            loadResults.push({ file, model: model.name, success: true });
            logger.debug(`✅ Loaded: ${model.name} -> ${model.tableName}`);
          } else {
            loadResults.push({ file, success: false, error: 'Invalid model structure' });
            logger.warn(`⚠️  Invalid model from ${file}`);
          }
        } else {
          loadResults.push({ file, success: false, error: 'Not a function export' });
          logger.warn(`⚠️  ${file} does not export a function`);
        }
      } catch (error) {
        loadResults.push({ file, success: false, error: error.message });
        logger.error(`❌ Error loading ${file}: ${error.message}`);
        
        // In production, continue loading other models
        if (!isProduction) {
          throw error;
        }
      }
    });

    const successCount = loadResults.filter(r => r.success).length;
    const failedCount = loadResults.filter(r => !r.success).length;
    
    logger.info(`📊 Model loading results: ${successCount} success, ${failedCount} failed`);
    
    if (failedCount > 0) {
      const failedFiles = loadResults.filter(r => !r.success).map(r => r.file);
      if (isProduction) {
        logger.warn(`⚠️  Failed to load models in production: ${failedFiles.join(', ')}`);
      } else {
        logger.error(`❌ Failed to load models: ${failedFiles.join(', ')}`);
      }
    }

    return models;
  } catch (error) {
    logger.error('❌ Model loading process failed:', error.message);
    
    if (isProduction) {
      logger.warn('⚠️  Continuing with partial model loading in production');
      return models; // Return whatever models were loaded
    } else {
      throw error;
    }
  }
}

/**
 * Apply compatibility patches for production
 */
function applyProductionCompatibility(models) {
  try {
    logger.info('🔧 Applying production compatibility patches');
    
    // Apply existing compatibility patches
    if (fs.existsSync(path.join(__dirname, 'compatibility.js'))) {
      const { applyCompatibilityPatches } = require('./compatibility');
      applyCompatibilityPatches({ ...models, sequelize, Sequelize });
    }
    
    // Additional production-specific patches
    Object.keys(models).forEach(modelName => {
      const model = models[modelName];
      
      // Ensure all models have required methods
      if (!model.findOneProduction) {
        model.findOneProduction = async function(options = {}) {
          try {
            return await this.findOne({
              ...options,
              timeout: isProduction ? 30000 : 15000 // Longer timeout in production
            });
          } catch (error) {
            logger.error(`Model ${modelName} findOne error:`, error.message);
            throw error;
          }
        };
      }
      
      // Add production-safe sync method
      if (!model.syncSafe) {
        model.syncSafe = async function(options = {}) {
          try {
            const syncOptions = {
              ...options,
              force: false, // Never force in production
              alter: isProduction ? false : options.alter // No alter in production
            };
            
            return await this.sync(syncOptions);
          } catch (error) {
            logger.error(`Model ${modelName} sync error:`, error.message);
            
            if (isProduction) {
              logger.warn(`⚠️  Continuing despite sync error for ${modelName} in production`);
              return null;
            } else {
              throw error;
            }
          }
        };
      }
    });
    
    logger.info('✅ Production compatibility patches applied');
  } catch (error) {
    logger.error('❌ Failed to apply compatibility patches:', error.message);
    
    if (!isProduction) {
      throw error;
    }
  }
}

/**
 * Set up model associations with production safety
 */
function setupAssociationsProduction(models) {
  logger.info('🔗 Setting up model associations...');
  
  const associationResults = [];
  
  Object.keys(models).forEach((modelName) => {
    const model = models[modelName];
    
    if (model.associate && typeof model.associate === 'function') {
      try {
        model.associate(models);
        associationResults.push({ model: modelName, success: true });
        logger.debug(`✅ Associations set up: ${modelName}`);
      } catch (error) {
        associationResults.push({ model: modelName, success: false, error: error.message });
        logger.error(`❌ Association error for ${modelName}: ${error.message}`);
        
        // In production, continue with other associations
        if (!isProduction) {
          throw error;
        }
      }
    }
  });

  const successCount = associationResults.filter(r => r.success).length;
  const failedCount = associationResults.filter(r => !r.success).length;
  
  logger.info(`📊 Association results: ${successCount} success, ${failedCount} failed`);
  
  if (failedCount > 0 && !isProduction) {
    const failedModels = associationResults.filter(r => !r.success).map(r => r.model);
    throw new Error(`Failed to set up associations for: ${failedModels.join(', ')}`);
  }
}

/**
 * Production-safe database health check
 */
async function createHealthChecker() {
  return {
    isHealthy: async () => {
      try {
        // Simple connection test with timeout
        const timeout = isProduction ? 10000 : 5000;
        
        const testPromise = sequelize.authenticate();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), timeout)
        );
        
        await Promise.race([testPromise, timeoutPromise]);
        
        // Additional query test
        await sequelize.query('SELECT 1 as health', { 
          type: sequelize.QueryTypes.SELECT,
          timeout: timeout / 2
        });
        
        return true;
      } catch (error) {
        logger.warn('Database health check failed:', error.message);
        return false;
      }
    },
    
    getConnectionInfo: () => ({
      database: config.database,
      host: config.host,
      port: config.port,
      dialect: config.dialect,
      isProduction,
      isRailway
    })
  };
}

// Main initialization process
async function initializeDatabase() {
  try {
    logger.info('🚀 Starting database initialization...');
    
    // Load models
    const models = loadModelsProduction();
    
    // Add models to db object
    Object.assign(db, models);
    
    // Apply compatibility patches
    applyProductionCompatibility(models);
    
    // Set up associations
    setupAssociationsProduction(models);
    
    // Add Sequelize instances
    db.sequelize = sequelize;
    db.Sequelize = Sequelize;
    
    // Add health checker
    const healthChecker = await createHealthChecker();
    db.isHealthy = healthChecker.isHealthy;
    db.getConnectionInfo = healthChecker.getConnectionInfo;
    
    // Test initial connection
    try {
      await sequelize.authenticate();
      logger.info('✅ Initial database connection successful');
    } catch (connectionError) {
      logger.error('❌ Initial database connection failed:', connectionError.message);
      
      if (isProduction) {
        logger.warn('⚠️  Continuing with database connection issues in production');
      } else {
        throw connectionError;
      }
    }
    
    // Log final summary
    const loadedModels = Object.keys(models);
    logger.info(`📊 Database initialization summary:`);
    logger.info(`   • Environment: ${isProduction ? 'production' : 'development'}`);
    logger.info(`   • Models loaded: ${loadedModels.length}`);
    logger.info(`   • Model names: ${loadedModels.join(', ')}`);
    logger.info(`   • Database: ${config.database}`);
    logger.info(`   • Host: ${config.host}:${config.port}`);
    
    if (isRailway) {
      logger.info(`   • Railway deployment: Active`);
    }
    
    return db;
    
  } catch (error) {
    logger.error('❌ Database initialization failed:', error.message);
    
    if (isProduction) {
      logger.warn('⚠️  Creating minimal database object for production');
      
      // Create minimal db object to prevent crashes
      db.sequelize = sequelize;
      db.Sequelize = Sequelize;
      db.isHealthy = async () => false;
      db.getConnectionInfo = () => ({ error: error.message });
      
      return db;
    } else {
      throw error;
    }
  }
}

// Initialize synchronously but handle errors gracefully
try {
  // Load models immediately
  const models = loadModelsProduction();
  Object.assign(db, models);
  
  // Apply compatibility
  applyProductionCompatibility(models);
  
  // Set up associations
  setupAssociationsProduction(models);
  
  // Add Sequelize instances
  db.sequelize = sequelize;
  db.Sequelize = Sequelize;
  
  // Add simple health check
  db.isHealthy = async () => {
    try {
      await sequelize.authenticate();
      return true;
    } catch (error) {
      logger.debug('Health check failed:', error.message);
      return false;
    }
  };
  
  logger.info('✅ Models initialized successfully');
  
} catch (error) {
  logger.error('❌ Model initialization failed:', error.message);
  
  // Ensure db has minimum required structure
  db.sequelize = sequelize;
  db.Sequelize = Sequelize;
  db.isHealthy = async () => false;
  
  if (!isProduction) {
    throw error;
  }
}

module.exports = db;