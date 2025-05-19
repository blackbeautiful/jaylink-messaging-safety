// src/routes/health.routes.js (Improved)
const express = require('express');
const db = require('../models');
const response = require('../utils/response.util');
const os = require('os');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

const router = express.Router();

/**
 * @route GET /api/health
 * @desc Health check endpoint with comprehensive system status
 * @access Public
 */
router.get('/', async (req, res) => {
  const healthStatus = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: config.env,
    host: {
      name: os.hostname(),
      memory: {
        free: Math.round(os.freemem() / 1024 / 1024) + 'MB',
        total: Math.round(os.totalmem() / 1024 / 1024) + 'MB',
      },
      uptime: Math.round(os.uptime() / 60 / 60) + ' hours',
    },
    services: {
      database: 'unknown',
    },
  };

  // Check database connection
  try {
    await db.sequelize.authenticate();
    healthStatus.services.database = 'connected';
  } catch (error) {
    healthStatus.status = 'degraded';
    healthStatus.services.database = 'disconnected';
    healthStatus.services.databaseError = error.message;
  }

  // Check file system access (for uploads directory)
  try {
    const uploadDir = path.join(__dirname, '../../uploads');
    fs.accessSync(uploadDir, fs.constants.R_OK | fs.constants.W_OK);
    healthStatus.services.fileSystem = 'accessible';
  } catch (error) {
    healthStatus.status = 'degraded';
    healthStatus.services.fileSystem = 'inaccessible';
    healthStatus.services.fileSystemError = error.message;
  }

  // Optional: Check other external services that are critical
  // e.g., Redis, external APIs, etc.

  // Set appropriate status code based on health status
  if (healthStatus.status === 'ok') {
    return response.success(res, healthStatus);
  } else {
    // Use 503 Service Unavailable for degraded status
    return response.error(res, healthStatus, 'Service partially degraded', 503);
  }
});

/**
 * @route GET /api/health/db
 * @desc Detailed database health check
 * @access Public
 */
router.get('/db', async (req, res) => {
  try {
    // Check basic connection
    await db.sequelize.authenticate();

    // Get database statistics if needed
    const dbInfo = {
      dialect: db.sequelize.options.dialect,
      host: db.sequelize.config.host,
      database: db.sequelize.config.database,
      // Don't include username/password for security
    };

    // Check if key tables exist by running simple count queries (optional)
    // This helps verify not just connection but data access
    // (Adjust table names to match your application's important tables)
    const tableStatus = {};
    try {
      const keyTables = ['users', 'messages']; // Replace with your key tables
      for (const table of keyTables) {
        if (db[table]) {
          const count = await db[table].count();
          tableStatus[table] = { status: 'ok', count };
        }
      }
    } catch (tableError) {
      tableStatus.error = tableError.message;
    }

    return response.success(res, {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbInfo,
      tables: tableStatus,
    });
  } catch (error) {
    return response.error(
      res,
      {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      },
      'Database connectivity issue',
      503
    );
  }
});

module.exports = router;
