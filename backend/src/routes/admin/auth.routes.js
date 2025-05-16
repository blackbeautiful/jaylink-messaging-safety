const express = require('express');
const adminAuthController = require('../../controllers/admin/auth.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validator.middleware');
const authValidator = require('../../validators/auth.validator');

const router = express.Router();

/**
 * @route POST /api/admin/auth/login
 * @desc Admin login
 * @access Public
 */
router.post(
  '/login',
  validate(authValidator.adminLoginSchema),
  adminAuthController.login
);

/**
 * @route GET /api/admin/auth/me
 * @desc Get current admin profile
 * @access Admin
 */
router.get(
  '/me',
  authenticate,
  authorizeAdmin,
  adminAuthController.getCurrentAdmin
);

/**
 * @route POST /api/admin/auth/logout
 * @desc Logout admin
 * @access Admin
 */
router.post(
  '/logout',
  authenticate,
  authorizeAdmin,
  adminAuthController.logout
);

module.exports = router;