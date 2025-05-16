// src/routes/auth.routes.js
const express = require('express');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validator.middleware');
const authValidator = require('../validators/auth.validator');

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register new user
 * @access Public
 */
router.post(
  '/register',
  validate(authValidator.registerSchema),
  authController.register
);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  validate(authValidator.loginSchema),
  authController.login
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset
 * @access Public
 */
router.post(
  '/forgot-password',
  validate(authValidator.forgotPasswordSchema),
  authController.forgotPassword
);

/**
 * @route POST /api/auth/reset-password
 * @desc Reset password with token
 * @access Public
 */
router.post(
  '/reset-password',
  validate(authValidator.resetPasswordSchema),
  authController.resetPassword
);

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

/**
 * @route POST /api/auth/logout
 * @desc Logout user
 * @access Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

module.exports = router;