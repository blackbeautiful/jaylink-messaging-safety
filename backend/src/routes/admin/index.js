// backend/src/routes/admin/index.js
const express = require('express');
const adminAuthRoutes = require('./auth.routes');
const adminUserRoutes = require('./user.routes');
const adminMonitoringRoutes = require('./monitoring.routes');

const router = express.Router();

// Admin auth routes
router.use('/auth', adminAuthRoutes);

// Admin user management routes
router.use('/users', adminUserRoutes);

// Admin monitoring routes
router.use('/monitoring', adminMonitoringRoutes);

module.exports = router;