const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const config = require('../config/database');
const logger = require('../config/logger');

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
      file.slice(-3) === '.js'
    );
  })
  .forEach((file) => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// Set up associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

// Add Sequelize and instance to db
db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;