// backend/scripts/sync-all-tables.js
require('dotenv').config();
const db = require('../src/models');
const logger = require('../src/config/logger');

async function syncAllTables() {
  try {
    logger.info('Starting database sync for all tables...');
    
    // Make sure we have a database connection
    await db.sequelize.authenticate();
    logger.info('Database connection established');
    
    // Sync all models to create tables
    await db.sequelize.sync({ force: false, alter: true });
    logger.info('All database tables synchronized successfully');
    
    process.exit(0);
  } catch (error) {
    logger.error('Error synchronizing database tables:', error);
    process.exit(1);
  }
}

// Run the sync function
syncAllTables();