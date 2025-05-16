const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const db = require('../models');
const config = require('../config/config');
const ApiError = require('../utils/api-error.util');
const logger = require('../config/logger');

const User = db.User;

/**
 * Get all users with pagination and filtering
 * @param {Object} filters - Filter and pagination options
 * @returns {Object} Users, total count, current page, total pages
 */
const getAllUsers = async (filters) => {
  try {
    const { search, role, status, page = 1, limit = 20 } = filters;
    const offset = (page - 1) * limit;
    
    // Build where clause based on filters
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search}%` } },
        { lastName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    if (status) {
      whereClause.status = status;
    }
    
    // Query database
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limit);
    
    return {
      users: rows,
      total: count,
      page: parseInt(page, 10),
      pages: totalPages,
    };
  } catch (error) {
    logger.error(`Get all users service error: ${error.message}`);
    throw error;
  }
};

/**
 * Get user by ID
 * @param {number} id - User ID
 * @returns {Object} User object
 */
const getUserById = async (id) => {
  try {
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
    });
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    return user;
  } catch (error) {
    logger.error(`Get user by ID service error: ${error.message}`);
    throw error;
  }
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Object} Created user
 */
const createUser = async (userData) => {
  try {
    // Check if email already exists
    const existingUser = await User.findOne({
      where: { email: userData.email },
    });
    
    if (existingUser) {
      throw new ApiError('Email already registered', 409);
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(parseInt(config.auth.saltRounds, 10));
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Create user
    const user = await User.create({
      ...userData,
      password: hashedPassword,
    });
    
    // Return user without sensitive data
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.resetToken;
    delete userResponse.resetTokenExpiry;
    
    return userResponse;
  } catch (error) {
    logger.error(`Create user service error: ${error.message}`);
    throw error;
  }
};

/**
 * Update user
 * @param {number} id - User ID
 * @param {Object} userData - User data to update
 * @returns {Object} Updated user
 */
const updateUser = async (id, userData) => {
  try {
    const user = await User.findByPk(id);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // If email is being updated, check if it already exists
    if (userData.email && userData.email !== user.email) {
      const existingUser = await User.findOne({
        where: { email: userData.email },
      });
      
      if (existingUser) {
        throw new ApiError('Email already in use', 409);
      }
    }
    
    // If password is being updated, hash it
    if (userData.password) {
      const salt = await bcrypt.genSalt(parseInt(config.auth.saltRounds, 10));
      userData.password = await bcrypt.hash(userData.password, salt);
    }
    
    // Update user
    await user.update(userData);
    
    // Return updated user without sensitive data
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.resetToken;
    delete userResponse.resetTokenExpiry;
    
    return userResponse;
  } catch (error) {
    logger.error(`Update user service error: ${error.message}`);
    throw error;
  }
};

/**
 * Delete user
 * @param {number} id - User ID
 * @returns {boolean} Success status
 */
const deleteUser = async (id) => {
  try {
    const user = await User.findByPk(id);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Check if trying to delete an admin user
    if (user.role === 'admin') {
      throw new ApiError('Cannot delete admin user', 403);
    }
    
    await user.destroy();
    
    return true;
  } catch (error) {
    logger.error(`Delete user service error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};