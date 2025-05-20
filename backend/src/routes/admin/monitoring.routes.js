// backend/src/routes/admin/monitoring.routes.js
/**
 * JayLink SMS Platform
 * System Monitoring Routes
 */

const express = require('express');
const monitoringController = require('../../controllers/admin/monitoring.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');

const router = express.Router();

/**
 * @route GET /api/admin/monitoring/health
 * @desc Get current system health metrics
 * @access Admin
 */
router.get('/health', authenticate, authorizeAdmin, monitoringController.getSystemHealth);

/**
 * @route GET /api/admin/monitoring/history
 * @desc Get historical system health metrics
 * @access Admin
 */
router.get('/history', authenticate, authorizeAdmin, monitoringController.getHealthHistory);

/**
 * @route GET /api/admin/monitoring/thresholds
 * @desc Get alert thresholds
 * @access Admin
 */
router.get('/thresholds', authenticate, authorizeAdmin, monitoringController.getAlertThresholds);

/**
 * @route PUT /api/admin/monitoring/thresholds
 * @desc Update alert thresholds
 * @access Admin
 */
router.put('/thresholds', authenticate, authorizeAdmin, monitoringController.updateAlertThresholds);

/**
 * @route GET /api/admin/monitoring/backups
 * @desc Get backup status and history
 * @access Admin
 */
router.get('/backups', authenticate, authorizeAdmin, monitoringController.getBackupStatus);

/**
 * @route POST /api/admin/monitoring/backups
 * @desc Trigger a manual backup
 * @access Admin
 */
router.post('/backups', authenticate, authorizeAdmin, monitoringController.triggerBackup);

/**
 * @route POST /api/admin/monitoring/analyze
 * @desc Run an immediate system analysis
 * @access Admin
 */
router.post('/analyze', authenticate, authorizeAdmin, monitoringController.runSystemAnalysis);

module.exports = router;