const logger = require('../config/logger');

// Custom logger for migrations
module.exports = {
  log: (msg) => logger.info(`[MIGRATION] ${msg}`),
  error: (msg) => logger.error(`[MIGRATION] ${msg}`),
  warn: (msg) => logger.warn(`[MIGRATION] ${msg}`)
};