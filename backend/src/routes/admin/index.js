// src/routes/admin/index.js
const express = require('express');
const adminAuthRoutes = require('./auth.routes');
const adminUserRoutes = require('./user.routes');

const router = express.Router();

// Admin auth routes
router.use('/auth', adminAuthRoutes);

// Admin user management routes
router.use('/users', adminUserRoutes);

module.exports = router;