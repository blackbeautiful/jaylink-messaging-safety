const adminService = require('../../services/admin.service');
const response = require('../../utils/response.util');
const logger = require('../../config/logger');

/**
 * Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = req.query;
    const users = await adminService.getAllUsers({ search, role, status, page, limit });
    
    return response.success(res, users, 'Users retrieved successfully');
  } catch (error) {
    logger.error(`Get all users controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get user by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const user = await adminService.getUserById(id);
    
    return response.success(res, { user }, 'User retrieved successfully');
  } catch (error) {
    logger.error(`Get user by ID controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Create new user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createUser = async (req, res, next) => {
  try {
    const userData = req.body;
    const user = await adminService.createUser(userData);
    
    return response.success(res, { user }, 'User created successfully', 201);
  } catch (error) {
    logger.error(`Create user controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Update user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    const user = await adminService.updateUser(id, userData);
    
    return response.success(res, { user }, 'User updated successfully');
  } catch (error) {
    logger.error(`Update user controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Delete user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    await adminService.deleteUser(id);
    
    return response.success(res, { success: true }, 'User deleted successfully');
  } catch (error) {
    logger.error(`Delete user controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};