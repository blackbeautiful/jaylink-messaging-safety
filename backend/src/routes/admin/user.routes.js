// backend/src/routes/admin/user.routes.js
const express = require('express');
const adminUserController = require('../../controllers/admin/user.controller');
const { authenticate, authorizeAdmin } = require('../../middleware/auth.middleware');
const validate = require('../../middleware/validator.middleware');
const adminValidator = require('../../validators/admin.validator');

const router = express.Router();

// All routes require authentication and admin authorization
router.use(authenticate, authorizeAdmin);

/**
 * @route GET /api/admin/users
 * @desc Get all users
 * @access Admin
 */
router.get(
  '/',
  adminUserController.getAllUsers
);

/**
 * @route GET /api/admin/users/:id
 * @desc Get user by ID
 * @access Admin
 */
router.get(
  '/:id',
  adminUserController.getUserById
);

/**
 * @route POST /api/admin/users
 * @desc Create new user
 * @access Admin
 */
router.post(
  '/',
  validate(adminValidator.createUserSchema),
  adminUserController.createUser
);

/**
 * @route PUT /api/admin/users/:id
 * @desc Update user
 * @access Admin
 */
router.put(
  '/:id',
  validate(adminValidator.updateUserSchema),
  adminUserController.updateUser
);

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete user
 * @access Admin
 */
router.delete(
  '/:id',
  adminUserController.deleteUser
);

/**
 * @route PUT /api/admin/users/:id/balance
 * @desc Update user balance
 * @access Admin
 */
router.put(
  '/:id/balance',
  validate(adminValidator.updateBalanceSchema),
  adminUserController.updateUserBalance
);

/**
 * @route POST /api/admin/users/:id/reset-password
 * @desc Reset user password
 * @access Admin
 */
router.post(
  '/:id/reset-password',
  adminUserController.resetUserPassword
);

module.exports = router;