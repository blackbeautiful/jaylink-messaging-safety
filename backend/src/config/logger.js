const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;
const path = require('path');
const fs = require('fs');
const config = require('./config');

// Create logs directory if it doesn't exist
const logDir = path.dirname(config.logging.file);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Custom log format
const customFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  
  // Add error stack trace if available
  if (stack) {
    log = `${log}\n${stack}`;
  }
  
  // Add metadata if available
  if (Object.keys(metadata).length > 0) {
    log = `${log}\n${JSON.stringify(metadata, null, 2)}`;
  }
  
  return log;
});

// Create logger
const logger = createLogger({
  level: config.logging.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    customFormat
  ),
  transports: [
    // Console transport for all environments
    new transports.Console({
      format: combine(
        colorize(),
        customFormat
      ),
    }),
    // File transport
    new transports.File({
      filename: config.logging.file,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
    // Error file transport
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true,
    }),
  ],
  // Don't exit on error
  exitOnError: false,
});

// Add daily rotation in production
if (config.env === 'production') {
  const { DailyRotateFile } = require('winston-daily-rotate-file');
  
  logger.add(new DailyRotateFile({
    filename: path.join(logDir, 'application-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
  }));
}

// Export as singleton
module.exports = logger;