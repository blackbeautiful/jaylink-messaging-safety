// backend/src/models/index.js - FIXED VERSION
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config/database');
const logger = require('../config/logger');
const { applyCompatibilityPatches } = require('./compatibility');

const basename = path.basename(__filename);

// Initialize Sequelize with database config
const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: (msg) => logger.debug(msg),
    pool: config.pool,
    dialectOptions: config.dialectOptions,
    timezone: config.timezone,
  }
);

// Initialize db object
const db = {};

// Read and instantiate all model files
const modelFiles = fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file !== 'compatibility.js' &&
      file.slice(-3) === '.js'
    );
  });

logger.info(`📋 Loading ${modelFiles.length} model files...`);

// Load and instantiate each model
modelFiles.forEach((file) => {
  try {
    logger.debug(`Loading model file: ${file}`);
    
    // Require the model definition function
    const modelDefinition = require(path.join(__dirname, file));
    
    // Check if it's a function (model definition)
    if (typeof modelDefinition === 'function') {
      // Call the function to create the actual model
      const model = modelDefinition(sequelize, Sequelize.DataTypes);
      
      // Validate the created model
      if (model && model.name && model.tableName && typeof model.sync === 'function') {
        db[model.name] = model;
        logger.debug(`✅ Model loaded: ${model.name} -> ${model.tableName}`);
      } else {
        logger.warn(`⚠️  Invalid model from ${file}: missing required properties`);
      }
    } else {
      logger.warn(`⚠️  ${file} does not export a function`);
    }
  } catch (error) {
    logger.error(`❌ Error loading model from ${file}: ${error.message}`);
    // Continue loading other models
  }
});

logger.info(`✅ Successfully loaded ${Object.keys(db).length} models`);

// Apply compatibility patches to ensure models work correctly
applyCompatibilityPatches(db);

// Set up associations after all models are loaded
logger.info('🔗 Setting up model associations...');
let associationCount = 0;

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate && typeof db[modelName].associate === 'function') {
    try {
      db[modelName].associate(db);
      associationCount++;
      logger.debug(`✅ Associations set up for: ${modelName}`);
    } catch (error) {
      logger.error(`❌ Error setting up associations for ${modelName}: ${error.message}`);
    }
  }
});

logger.info(`✅ Associations set up for ${associationCount} models`);

// Add Sequelize and instance to db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Add helper function for healthy database check
db.isHealthy = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    logger.error('Database health check failed:', error);
    return false;
  }
};

// Log final summary
logger.info(`📊 Database models summary:`);
logger.info(`   • Models loaded: ${Object.keys(db).filter(key => 
    key !== 'sequelize' && key !== 'Sequelize' && key !== 'isHealthy'
  ).length}`);
logger.info(`   • Model names: ${Object.keys(db).filter(key => 
    key !== 'sequelize' && key !== 'Sequelize' && key !== 'isHealthy'
  ).join(', ')}`);

module.exports = db;