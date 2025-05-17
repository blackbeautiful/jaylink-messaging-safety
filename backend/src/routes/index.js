// src/routes/index.js
const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const healthRoutes = require('./health.routes');
const adminRoutes = require('./admin');
const balanceRoutes = require('./balance.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/health', healthRoutes);
router.use('/admin', adminRoutes);
router.use('/balance', balanceRoutes);

module.exports = router;