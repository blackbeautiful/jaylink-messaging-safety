// src/routes/index.js
const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin');
const healthRoutes = require('./health.routes');

const router = express.Router();

// Health check routes
router.use('/health', healthRoutes);

// Auth routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Admin routes
router.use('/admin', adminRoutes);

module.exports = router;