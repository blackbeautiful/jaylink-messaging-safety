const config = require('./config');

/**
 * Database configuration for Sequelize
 */
module.exports = {
  database: config.db.name,
  username: config.db.user,
  password: config.db.password,
  host: config.db.host,
  port: config.db.port,
  dialect: 'mysql',
  timezone: '+00:00', // UTC
  pool: {
    max: 20,
    min: 5,
    acquire: 30000, // 30 seconds
    idle: 10000, // 10 seconds
  },
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
  },
  define: {
    timestamps: true,
    underscored: false,
  },
  logging: config.env === 'development', // Only log SQL in development
};