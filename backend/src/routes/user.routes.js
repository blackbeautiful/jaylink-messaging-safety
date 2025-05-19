// backend/src/routes/user.routes.js 
const express = require('express');
const userController = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validator.middleware');
const userValidator = require('../validators/user.validator');

const router = express.Router();

/**
 * @route GET /api/users/profile
 * @desc Get user profile
 * @access Private
 */
router.get(
  '/profile',
  authenticate,
  userController.getProfile
);

/**
 * @route GET /api/users/profile-settings
 * @desc Get user profile with settings
 * @access Private
 */
router.get(
  '/profile-settings',
  authenticate,
  userController.getProfileWithSettings
);

/**
 * @route PUT /api/users/profile
 * @desc Update user profile
 * @access Private
 */
router.put(
  '/profile',
  authenticate,
  validate(userValidator.updateProfileSchema),
  userController.updateProfile
);

/**
 * @route PUT /api/users/password
 * @desc Change user password
 * @access Private
 */
router.put(
  '/password',
  authenticate,
  validate(userValidator.changePasswordSchema),
  userController.changePassword
);

/**
 * @route GET /api/users/settings
 * @desc Get user settings
 * @access Private
 */
router.get(
  '/settings',
  authenticate,
  userController.getSettings
);

/**
 * @route PUT /api/users/settings
 * @desc Update user settings
 * @access Private
 */
router.put(
  '/settings',
  authenticate,
  validate(userValidator.updateSettingsSchema),
  userController.updateSettings
);

module.exports = router;