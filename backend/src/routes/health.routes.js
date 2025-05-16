// src/routes/health.routes.js
const express = require('express');
const db = require('../models');
const response = require('../utils/response.util');

const router = express.Router();

/**
 * @route GET /api/health
 * @desc Health check endpoint
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    // Check database connection
    await db.sequelize.authenticate();
    
    return response.success(res, {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'connected',
    });
  } catch (error) {
    return response.success(res, {
      status: 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

module.exports = router;