// backend/src/config/database.js
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

// Smart timezone detection and configuration
const getTimezoneConfig = () => {
  try {
    // Priority order:
    // 1. Explicit config override
    // 2. Environment variable
    // 3. System timezone detection
    // 4. Default to Nigeria timezone (WAT - UTC+1)

    // Check for explicit timezone configuration
    if (config.db && config.db.timezone) {
      logger.info(`Using configured timezone: ${config.db.timezone}`);
      return config.db.timezone;
    }

    // Check environment variable
    const envTimezone = process.env.DB_TIMEZONE || process.env.TZ;
    if (envTimezone) {
      logger.info(`Using environment timezone: ${envTimezone}`);
      return convertToMysqlTimezone(envTimezone);
    }

    // Detect system timezone
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (systemTimezone) {
      const mysqlTimezone = convertToMysqlTimezone(systemTimezone);
      logger.info(`Detected system timezone: ${systemTimezone} -> ${mysqlTimezone}`);
      return mysqlTimezone;
    }

    // Default to Nigeria timezone (West Africa Time - UTC+1)
    logger.info('Using default Nigeria timezone: +01:00');
    return '+01:00';
  } catch (error) {
    logger.warn(`Error detecting timezone: ${error.message}, falling back to Nigeria timezone`);
    return '+01:00';
  }
};

// Convert timezone identifiers to MySQL format
const convertToMysqlTimezone = (timezone) => {
  // Common timezone mappings
  const timezoneMap = {
    // Africa
    'Africa/Lagos': '+01:00', // Nigeria, West Africa Time
    'Africa/Abuja': '+01:00', // Nigeria alternative
    'Africa/Cairo': '+02:00', // Egypt
    'Africa/Johannesburg': '+02:00', // South Africa
    'Africa/Nairobi': '+03:00', // Kenya
    'Africa/Casablanca': '+01:00', // Morocco
    'Africa/Algiers': '+01:00', // Algeria

    // Europe
    'Europe/London': '+00:00', // UK (GMT)
    'Europe/Paris': '+01:00', // France (CET)
    'Europe/Berlin': '+01:00', // Germany (CET)
    'Europe/Rome': '+01:00', // Italy (CET)
    'Europe/Madrid': '+01:00', // Spain (CET)
    'Europe/Amsterdam': '+01:00', // Netherlands (CET)
    'Europe/Stockholm': '+01:00', // Sweden (CET)
    'Europe/Moscow': '+03:00', // Russia (MSK)

    // Americas
    'America/New_York': '-05:00', // US Eastern Time
    'America/Chicago': '-06:00', // US Central Time
    'America/Denver': '-07:00', // US Mountain Time
    'America/Los_Angeles': '-08:00', // US Pacific Time
    'America/Toronto': '-05:00', // Canada Eastern
    'America/Vancouver': '-08:00', // Canada Pacific
    'America/Sao_Paulo': '-03:00', // Brazil
    'America/Argentina/Buenos_Aires': '-03:00', // Argentina

    // Asia
    'Asia/Dubai': '+04:00', // UAE
    'Asia/Kolkata': '+05:30', // India
    'Asia/Shanghai': '+08:00', // China
    'Asia/Tokyo': '+09:00', // Japan
    'Asia/Seoul': '+09:00', // South Korea
    'Asia/Bangkok': '+07:00', // Thailand
    'Asia/Singapore': '+08:00', // Singapore
    'Asia/Manila': '+08:00', // Philippines
    'Asia/Jakarta': '+07:00', // Indonesia

    // Australia
    'Australia/Sydney': '+10:00', // Australia Eastern
    'Australia/Melbourne': '+10:00', // Australia Eastern
    'Australia/Perth': '+08:00', // Australia Western

    // UTC variants
    UTC: '+00:00',
    GMT: '+00:00',
  };

  // Check if it's already in MySQL format (±HH:MM)
  if (/^[+-]\d{2}:\d{2}$/.test(timezone)) {
    return timezone;
  }

  // Check timezone map
  if (timezoneMap[timezone]) {
    return timezoneMap[timezone];
  }

  // Try to extract offset from timezone using Date API
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
    return '+01:00'; // Default to Nigeria timezone
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
const dbTimezone = getTimezoneConfig();

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
  timezone: dbTimezone,
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
  // Add these connection handling options
  retry: {
    match: [
      /SequelizeConnectionError/,
      /SequelizeConnectionRefusedError/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
      /Connection terminated unexpectedly/
    ],
    max: 5, // Maximum retry attempts
    backoffBase: 1000, // Initial delay in ms
    backoffExponent: 1.5 // Exponential backoff
  }
};

// Log database connection config (without sensitive data)
logger.info(
  `Database Configuration: host=${dbConfig.host}, port=${dbConfig.port}, database=${dbConfig.database}, timezone=${dbTimezone}`
);

// Helper function to get current database time (useful for debugging)
const getCurrentDbTime = () => {
  const now = new Date();
  const offset =
    dbTimezone === '+01:00' ? 1 : dbTimezone === '+00:00' ? 0 : parseInt(dbTimezone.split(':')[0]);

  const dbTime = new Date(now.getTime() + offset * 60 * 60 * 1000);
  return dbTime.toISOString();
};

// Export helper functions
module.exports.getCurrentDbTime = getCurrentDbTime;
module.exports.getTimezoneConfig = getTimezoneConfig;
module.exports.convertToMysqlTimezone = convertToMysqlTimezone;
