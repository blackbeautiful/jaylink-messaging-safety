// src/controllers/admin/user.controller.js - Enhanced implementation with better error handling
const adminService = require('../../services/admin.service');
const response = require('../../utils/response.util');
const logger = require('../../config/logger');
const ApiError = require('../../utils/api-error.util');

/**
 * Get all users
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { search, role, status, page, limit } = req.query;
    
    // Log request info
    logger.info(`Admin requesting users list - filters: ${JSON.stringify({
      search, role, status, page, limit
    })}`);
    
    const users = await adminService.getAllUsers({ search, role, status, page, limit });
    
    return response.success(res, users, 'Users retrieved successfully');
  } catch (error) {
    logger.error(`Get all users controller error: ${error.message}`, { 
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip
    });
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
    
    if (!id) {
      throw new ApiError('User ID is required', 400);
    }
    
    const user = await adminService.getUserById(id);
    
    return response.success(res, { user }, 'User retrieved successfully');
  } catch (error) {
    logger.error(`Get user by ID controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.params.id,
      url: req.url
    });
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
    
    if (!userData || Object.keys(userData).length === 0) {
      throw new ApiError('User data is required', 400);
    }
    
    const user = await adminService.createUser(userData);
    
    return response.success(res, { user }, 'User created successfully', 201);
  } catch (error) {
    logger.error(`Create user controller error: ${error.message}`, { 
      stack: error.stack,
      userData: JSON.stringify({
        ...req.body,
        password: req.body.password ? '[REDACTED]' : undefined
      })
    });
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
    
    if (!id) {
      throw new ApiError('User ID is required', 400);
    }
    
    if (!userData || Object.keys(userData).length === 0) {
      throw new ApiError('Update data is required', 400);
    }
    
    const user = await adminService.updateUser(id, userData);
    
    return response.success(res, { user }, 'User updated successfully');
  } catch (error) {
    logger.error(`Update user controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.params.id,
      userData: JSON.stringify({
        ...req.body,
        password: req.body.password ? '[REDACTED]' : undefined
      })
    });
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
    
    if (!id) {
      throw new ApiError('User ID is required', 400);
    }
    
    await adminService.deleteUser(id);
    
    return response.success(res, { success: true }, 'User deleted successfully');
  } catch (error) {
    logger.error(`Delete user controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.params.id
    });
    next(error);
  }
};

/**
 * Update user balance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateUserBalance = async (req, res, next) => {
  try {
    const { id } = req.params;
    const balanceData = req.body;
    
    if (!id) {
      throw new ApiError('User ID is required', 400);
    }
    
    if (!balanceData || !balanceData.operation || balanceData.amount === undefined) {
      throw new ApiError('Balance operation and amount are required', 400);
    }
    
    const result = await adminService.updateUserBalance(id, balanceData);
    
    return response.success(res, result, 'User balance updated successfully');
  } catch (error) {
    logger.error(`Update user balance controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.params.id,
      operation: req.body.operation,
      amount: req.body.amount
    });
    next(error);
  }
};

/**
 * Reset user password
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const resetUserPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      throw new ApiError('User ID is required', 400);
    }
    
    const result = await adminService.resetUserPassword(id);
    
    return response.success(res, result, 'User password reset successfully');
  } catch (error) {
    logger.error(`Reset user password controller error: ${error.message}`, { 
      stack: error.stack,
      userId: req.params.id
    });
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateUserBalance,
  resetUserPassword,
};