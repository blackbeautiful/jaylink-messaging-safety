// src/config/database.js
const config = require('./config');
const logger = require('./logger');

// Parse DATABASE_URL from Railway if available
const parseDatabaseUrl = (url) => {
  try {
    if (!url) return null;
    
    // Example format: mysql://username:password@host:port/database
    const matches = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!matches || matches.length !== 6) {
      logger.warn('Invalid DATABASE_URL format, using fallback configuration');
      return null;
    }
    
    return {
      username: matches[1],
      password: matches[2],
      host: matches[3],
      port: parseInt(matches[4], 10),
      database: matches[5],
    };
  } catch (error) {
    logger.warn(`Error parsing DATABASE_URL: ${error.message}`);
    return null;
  }
};

// Get database configuration from Railway URL or standard config
const getDbConfig = () => {
  // Check for Railway's DATABASE_URL
  if (config.db.url) {
    const parsedUrl = parseDatabaseUrl(config.db.url);
    if (parsedUrl) {
      logger.info('Using database configuration from DATABASE_URL');
      return {
        database: parsedUrl.database,
        username: parsedUrl.username,
        password: parsedUrl.password,
        host: parsedUrl.host,
        port: parsedUrl.port,
      };
    }
  }
  
  // Use standard configuration
  return {
    database: config.db.name,
    username: config.db.user,
    password: config.db.password,
    host: config.db.host,
    port: config.db.port,
  };
};

// Get database credentials
const dbConfig = getDbConfig();

/**
 * Database configuration for Sequelize
 */
module.exports = {
  database: dbConfig.database,
  username: dbConfig.username,
  password: dbConfig.password,
  host: dbConfig.host,
  port: dbConfig.port,
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
    // For SSL connections (common in cloud platforms)
    ssl: config.env === 'production' ? {
      require: true,
      rejectUnauthorized: false, // Allow self-signed certificates
    } : null,
  },
  define: {
    timestamps: true,
    underscored: false,
  },
  logging: config.env === 'development' ? (msg) => logger.debug(msg) : false,
};

// Log database connection config (without sensitive data)
logger.info(`Database Configuration: host=${dbConfig.host}, port=${dbConfig.port}, database=${dbConfig.database}`);