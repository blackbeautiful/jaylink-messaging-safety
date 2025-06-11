// backend/src/config/database.js - PRODUCTION FIXED VERSION
const config = require('./config');
const logger = require('./logger');

/**
 * Parse Railway/Production DATABASE_URL
 */
const parseDatabaseUrl = (url) => {
  try {
    if (!url) return null;
    
    logger.debug('Parsing DATABASE_URL for production');
    
    // Railway format: mysql://username:password@host:port/database
    const matches = url.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!matches || matches.length !== 6) {
      logger.error('Invalid DATABASE_URL format detected');
      return null;
    }
    
    const parsed = {
      username: matches[1],
      password: matches[2],
      host: matches[3],
      port: parseInt(matches[4], 10),
      database: matches[5]
    };
    
    logger.info(`✅ Parsed DATABASE_URL: ${parsed.database} at ${parsed.host}:${parsed.port}`);
    return parsed;
  } catch (error) {
    logger.error(`Error parsing DATABASE_URL: ${error.message}`);
    return null;
  }
};

/**
 * Get production-safe timezone configuration
 */
const getTimezoneConfig = () => {
  try {
    // In production, be more conservative with timezone detection
    const isProduction = config.env === 'production';
    
    // Priority order for production:
    // 1. Explicit DB_TIMEZONE env var
    // 2. Default to UTC for production consistency
    // 3. App timezone as fallback
    
    if (process.env.DB_TIMEZONE) {
      const timezone = convertToMysqlTimezone(process.env.DB_TIMEZONE);
      logger.info(`Using explicit DB timezone: ${timezone}`);
      return timezone;
    }
    
    if (isProduction) {
      // Default to UTC in production for consistency
      logger.info('Using UTC timezone for production consistency');
      return 'UTC';
    }
    
    // Development fallback
    const appTimezone = process.env.APP_TIMEZONE || 'Africa/Lagos';
    const mysqlTimezone = convertToMysqlTimezone(appTimezone);
    logger.info(`Using app timezone: ${appTimezone} -> ${mysqlTimezone}`);
    return mysqlTimezone;
    
  } catch (error) {
    logger.warn(`Error detecting timezone: ${error.message}, using UTC`);
    return '+00:00'; // Safe fallback
  }
};

/**
 * Convert timezone to MySQL format with production safety
 */
const convertToMysqlTimezone = (timezone) => {
  // Production-safe timezone mappings
  const timezoneMap = {
    // Standard zones
    'UTC': '+00:00',
    'GMT': '+00:00',
    
    // Africa
    'Africa/Lagos': '+01:00',
    'Africa/Abuja': '+01:00',
    'Africa/Cairo': '+02:00',
    'Africa/Johannesburg': '+02:00',
    'Africa/Nairobi': '+03:00',
    
    // Europe
    'Europe/London': '+00:00',
    'Europe/Paris': '+01:00',
    'Europe/Berlin': '+01:00',
    'Europe/Rome': '+01:00',
    
    // Americas
    'America/New_York': '-05:00',
    'America/Chicago': '-06:00',
    'America/Los_Angeles': '-08:00',
    
    // Asia
    'Asia/Dubai': '+04:00',
    'Asia/Kolkata': '+05:30',
    'Asia/Shanghai': '+08:00',
    'Asia/Tokyo': '+09:00'
  };

  // Already in MySQL format
  if (/^[+-]\d{2}:\d{2}$/.test(timezone)) {
    return timezone;
  }

  // Check mapping table
  if (timezoneMap[timezone]) {
    return timezoneMap[timezone];
  }

  // Fallback to UTC for unknown timezones in production
  if (config.env === 'production') {
    logger.warn(`Unknown timezone '${timezone}' in production, using UTC`);
    return '+00:00';
  }

  // Development fallback - try to calculate offset
  try {
    const now = new Date();
    const utc = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    const targetTime = new Date(utc.toLocaleString('en-US', { timeZone: timezone }));
    const offset = (targetTime.getTime() - utc.getTime()) / (1000 * 60 * 60);

    const hours = Math.floor(Math.abs(offset));
    const minutes = Math.floor((Math.abs(offset) - hours) * 60);
    const sign = offset >= 0 ? '+' : '-';

    return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (error) {
    logger.warn(`Could not convert timezone ${timezone}: ${error.message}`);
    return '+00:00'; // Safe fallback
  }
};

/**
 * Get database configuration with production handling
 */
const getDbConfig = () => {
  const isProduction = config.env === 'production';
  const hasRailwayUrl = !!process.env.DATABASE_URL;
  
  logger.info(`Getting DB config for ${config.env} environment`);
  
  // Railway/Production URL takes precedence
  if (hasRailwayUrl) {
    const parsedUrl = parseDatabaseUrl(process.env.DATABASE_URL);
    if (parsedUrl) {
      logger.info('✅ Using DATABASE_URL configuration');
      return {
        database: parsedUrl.database,
        username: parsedUrl.username,
        password: parsedUrl.password,
        host: parsedUrl.host,
        port: parsedUrl.port,
        source: 'DATABASE_URL'
      };
    } else {
      logger.error('❌ Failed to parse DATABASE_URL, falling back to environment variables');
    }
  }
  
  // Fallback to individual environment variables
  const fallbackConfig = {
    database: config.db.name || process.env.DB_NAME || 'jaylink_db',
    username: config.db.user || process.env.DB_USER || 'jaylink_user',
    password: config.db.password || process.env.DB_PASSWORD,
    host: config.db.host || process.env.DB_HOST || 'localhost',
    port: config.db.port || parseInt(process.env.DB_PORT, 10) || 3306,
    source: 'environment_variables'
  };
  
  // Validate required fields for production
  if (isProduction) {
    const requiredFields = ['database', 'username', 'password', 'host'];
    const missingFields = requiredFields.filter(field => !fallbackConfig[field]);
    
    if (missingFields.length > 0) {
      throw new Error(`Missing required database config for production: ${missingFields.join(', ')}`);
    }
  }
  
  logger.info(`✅ Using ${fallbackConfig.source} configuration: ${fallbackConfig.database} at ${fallbackConfig.host}:${fallbackConfig.port}`);
  return fallbackConfig;
};

// Get database credentials
const dbConfig = getDbConfig();
const dbTimezone = getTimezoneConfig();

/**
 * Production-safe Sequelize configuration
 */
const sequelizeConfig = {
  database: dbConfig.database,
  username: dbConfig.username,
  password: dbConfig.password,
  host: dbConfig.host,
  port: dbConfig.port,
  dialect: 'mysql',
  timezone: dbTimezone,
  
  // Production-optimized pool settings
  pool: {
    max: config.env === 'production' ? 15 : 10,
    min: config.env === 'production' ? 3 : 2,
    acquire: 60000, // 60 seconds
    idle: 30000,    // 30 seconds
    evict: 5000     // 5 seconds
  },
  
  // Production-safe dialect options
  dialectOptions: {
    dateStrings: true,
    typeCast: true,
    
    // Production SSL settings
    ssl: config.env === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    
    // Connection timeout settings
    connectTimeout: 60000,
    acquireTimeout: 60000,
    timeout: 60000,
    
    // Character set
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  
  // Model defaults
  define: {
    timestamps: true,
    underscored: false,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  
  // Logging configuration
  logging: config.env === 'development' ? (msg) => logger.debug(msg) : false,
  
  // Production-safe retry and reconnection settings
  retry: {
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
      /Connection terminated unexpectedly/,
      /Connection lost/,
      /PROTOCOL_CONNECTION_LOST/,
      /ECONNRESET/,
      /ETIMEDOUT/
    ],
    max: config.env === 'production' ? 5 : 3,
    backoffBase: 3000,
    backoffExponent: 1.5
  },
  
  // Query options
  query: {
    timeout: config.env === 'production' ? 30000 : 15000
  },
  
  // Production-specific options
  benchmark: config.env === 'development',
  standardConformingStrings: false,
  
  // Disable sync in production for safety
  sync: {
    force: false,
    alter: config.env !== 'production'
  },
  
  // Hook configuration for production safety
  hooks: {
    beforeSync: (options) => {
      if (config.env === 'production' && (options.force || options.alter)) {
        logger.warn('⚠️  Dangerous sync operation blocked in production');
        options.force = false;
        options.alter = false;
      }
    }
  }
};

/**
 * Production health check function
 */
const healthCheck = async () => {
  try {
    const { Sequelize } = require('sequelize');
    const testSequelize = new Sequelize(sequelizeConfig);
    
    await testSequelize.authenticate();
    await testSequelize.query('SELECT 1 as health_check');
    await testSequelize.close();
    
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'error', 
      error: error.message, 
      timestamp: new Date().toISOString() 
    };
  }
};

/**
 * Get current database time for debugging
 */
const getCurrentDbTime = () => {
  const now = new Date();
  
  // Parse timezone offset
  let offsetHours = 0;
  if (dbTimezone !== '+00:00') {
    const match = dbTimezone.match(/^([+-])(\d{2}):(\d{2})$/);
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      offsetHours = sign * (parseInt(match[2], 10) + parseInt(match[3], 10) / 60);
    }
  }
  
  const dbTime = new Date(now.getTime() + offsetHours * 60 * 60 * 1000);
  return dbTime.toISOString();
};

/**
 * Production-safe connection test
 */
const testConnection = async () => {
  const startTime = Date.now();
  const testResult = {
    success: false,
    connectionTime: 0,
    error: null,
    config: {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      timezone: dbTimezone,
      source: dbConfig.source
    }
  };
  
  try {
    const { Sequelize } = require('sequelize');
    const testSequelize = new Sequelize(sequelizeConfig);
    
    // Test authentication
    await testSequelize.authenticate();
    
    try {
      // Test query execution
      // Update the test query to use parameterized style:
      const [results] = await testSequelize.query('SELECT VERSION() as `version`, NOW() as `server_time`');
      
      testResult.connectionTime = Date.now() - startTime;
      testResult.success = true;
      testResult.serverInfo = {
        version: results[0]?.version || 'Unknown',
        serverTime: results[0]?.server_time || 'Unknown'
      };
    } catch (queryError) {
      logger.error('Test query failed:', queryError);
      // Fallback to simpler query
      const [simpleResults] = await testSequelize.query('SELECT 1 as test_value');
      testResult.serverInfo = {
        version: 'Unknown',
        serverTime: 'Unknown',
        testQueryPassed: !!simpleResults
      };
    }
    
    await testSequelize.close();
    
    logger.info(`✅ Database connection test passed in ${testResult.connectionTime}ms`);
    
  } catch (error) {
    testResult.connectionTime = Date.now() - startTime;
    testResult.error = error.message;
    testResult.errorCode = error.original?.code || error.code || 'UNKNOWN';
    
    logger.error(`❌ Database connection test failed: ${error.message}`);
  }
  
  return testResult;
};

/**
 * Export configuration and utilities
 */
module.exports = sequelizeConfig;

// Export helper functions as properties
module.exports.getCurrentDbTime = getCurrentDbTime;
module.exports.getTimezoneConfig = getTimezoneConfig;
module.exports.convertToMysqlTimezone = convertToMysqlTimezone;
module.exports.healthCheck = healthCheck;
module.exports.testConnection = testConnection;
module.exports.dbConfig = dbConfig;
module.exports.isProduction = config.env === 'production';
module.exports.isRailway = !!process.env.DATABASE_URL;

// Log final configuration (without sensitive data)
logger.info(`📊 Database configuration loaded:`);
logger.info(`   • Environment: ${config.env}`);
logger.info(`   • Host: ${dbConfig.host}:${dbConfig.port}`);
logger.info(`   • Database: ${dbConfig.database}`);
logger.info(`   • Timezone: ${dbTimezone}`);
logger.info(`   • Source: ${dbConfig.source}`);
logger.info(`   • SSL: ${sequelizeConfig.dialectOptions.ssl ? 'Enabled' : 'Disabled'}`);

if (config.env === 'production') {
  logger.info(`   • Production optimizations: Enabled`);
  logger.info(`   • Pool max: ${sequelizeConfig.pool.max}`);
  logger.info(`   • Connection timeout: ${sequelizeConfig.dialectOptions.connectTimeout}ms`);
}