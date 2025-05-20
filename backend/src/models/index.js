// backend/src/models/index.js
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config/database');
const logger = require('../config/logger');
const { applyCompatibilityPatches } = require('./compatibility');

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

// Read all model files
fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf('.') !== 0 &&
      file !== path.basename(__filename) &&
      file !== 'compatibility.js' &&
      file.slice(-3) === '.js'
    );
  })
  .forEach((file) => {
    try {
      const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
      db[model.name] = model;
    } catch (error) {
      logger.error(`Error loading model from file ${file}: ${error.message}`);
      // Continue loading other models
    }
  });

// Apply compatibility patches to ensure models work correctly
applyCompatibilityPatches(db);

// Set up associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    try {
      db[modelName].associate(db);
    } catch (error) {
      logger.error(`Error setting up associations for model ${modelName}: ${error.message}`);
      // Continue with other models
    }
  }
});

// Add Sequelize and instance to db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Add helper function for healthy database check
db.isHealthy = async () => {
  try {
    await sequelize.authenticate();
    return true;
  } catch (error) {
    return false;
  }
};

module.exports = db;