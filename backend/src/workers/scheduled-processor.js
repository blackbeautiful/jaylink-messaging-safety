// backend/src/workers/scheduled-processor.js
/**
 * Scheduled messages processor
 */
const logger = require('../config/logger');
const smsService = require('../services/sms.service');

// Keep track of whether the processor is already running
let isProcessing = false;

/**
 * Process scheduled messages that are due
 */
const processScheduledMessages = async () => {
  // Prevent concurrent processing
  if (isProcessing) {
    logger.debug('Scheduled message processor already running, skipping...');
    return;
  }
  
  try {
    isProcessing = true;
    logger.debug('Starting scheduled message processor...');
    
    // Process due messages
    const result = await smsService.processScheduledMessages();
    
    if (result.processed > 0) {
      logger.info(`Processed ${result.processed} scheduled messages. Success: ${result.success}, Failed: ${result.failed}`);
    } else {
      logger.debug('No scheduled messages to process');
    }
  } catch (error) {
    logger.error(`Error processing scheduled messages: ${error.message}`, { stack: error.stack });
  } finally {
    isProcessing = false;
  }
};

/**
 * Start the scheduled message processor
 * @param {number} interval - Processing interval in milliseconds (default: 1 minute)
 */
const startScheduledMessageProcessor = (interval = 60000) => {
  logger.info(`Starting scheduled message processor with ${interval}ms interval`);
  
  // Initial run after a short delay
  setTimeout(processScheduledMessages, 5000);
  
  // Set up regular interval
  setInterval(processScheduledMessages, interval);
};

module.exports = {
  processScheduledMessages,
  startScheduledMessageProcessor,
};