// config/config.js - Sequelize CLI configuration
const path = require('path');

// Load your app config
const appConfig = require('../src/config/config');

module.exports = {
  development: {
    username: appConfig.db.user,
    password: appConfig.db.password,
    database: appConfig.db.name,
    host: appConfig.db.host,
    port: appConfig.db.port,
    dialect: 'mysql',
    timezone: appConfig.db.timezone || '+00:00',
    logging: console.log,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      useUTC: false,
      dateStrings: true,
      typeCast: true
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  },
  test: {
    username: appConfig.db.user,
    password: appConfig.db.password,
    database: appConfig.db.name + '_test',
    host: appConfig.db.host,
    port: appConfig.db.port,
    dialect: 'mysql',
    timezone: appConfig.db.timezone || '+00:00',
    logging: false,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  },
  production: {
    username: appConfig.db.user,
    password: appConfig.db.password,
    database: appConfig.db.name,
    host: appConfig.db.host,
    port: appConfig.db.port,
    dialect: 'mysql',
    timezone: appConfig.db.timezone || '+00:00',
    logging: false,
    dialectOptions: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci',
      ssl: appConfig.env === 'production' ? {
        rejectUnauthorized: false
      } : false
    },
    define: {
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  }
};