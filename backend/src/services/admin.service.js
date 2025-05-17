// src/services/admin.service.js
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');
const db = require('../models');
const config = require('../config/config');
const ApiError = require('../utils/api-error.util');
const logger = require('../config/logger');
const emailService = require('./email.service');
const passwordUtil = require('../utils/password.util');
const notificationService = require('./notification.service');

const User = db.User;
const Transaction = db.Transaction;
const UserSession = db.UserSession;
const Setting = db.Setting;
const Message = db.Message;
const SystemSetting = db.SystemSetting;

/**
 * Get all users with pagination and filtering
 * @param {Object} filters - Filter and pagination options
 * @returns {Object} Users, total count, current page, total pages
 */
const getAllUsers = async (filters) => {
  try {
    // Extract and validate filters with defaults
    const { 
      search = '', 
      role = '', 
      status = '', 
      page = 1, 
      limit = 20 
    } = filters;
    
    // Convert pagination parameters to integers with fallbacks
    const pageInt = parseInt(page, 10) || 1;
    const limitInt = parseInt(limit, 10) || 20;
    
    // Validate pagination parameters
    if (pageInt < 1) {
      throw new ApiError('Page number must be at least 1', 400);
    }
    
    if (limitInt < 1 || limitInt > 100) {
      throw new ApiError('Limit must be between 1 and 100', 400);
    }
    
    // Calculate offset for pagination
    const offset = (pageInt - 1) * limitInt;
    
    // Build where clause based on filters
    const whereClause = {};
    
    if (search && search.trim()) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${search.trim()}%` } },
        { lastName: { [Op.like]: `%${search.trim()}%` } },
        { email: { [Op.like]: `%${search.trim()}%` } },
        { company: { [Op.like]: `%${search.trim()}%` } },
      ];
    }
    
    if (role && role !== 'all') {
      whereClause.role = role;
    }
    
    if (status && status !== 'all') {
      whereClause.status = status;
    }
    
    logger.info(`Fetching users with filters: ${JSON.stringify({
      search: search || null,
      role: role || null,
      status: status || null,
      page: pageInt,
      limit: limitInt,
    })}`);
    
    // Query database with numeric pagination parameters
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
      limit: limitInt,
      offset: offset,
      order: [['createdAt', 'DESC']],
    });
    
    // Calculate total pages
    const totalPages = Math.ceil(count / limitInt);
    
    logger.info(`Retrieved ${rows.length} users (total: ${count})`);
    
    return {
      users: rows,
      total: count,
      page: pageInt,
      pages: totalPages,
    };
  } catch (error) {
    logger.error(`Get all users service error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Get user by ID
 * @param {number|string} id - User ID
 * @returns {Object} User object
 */
const getUserById = async (id) => {
  try {
    // Validate ID
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new ApiError('Invalid user ID format', 400);
    }
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
    });
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    return user;
  } catch (error) {
    logger.error(`Get user by ID service error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Get detailed user information including usage statistics
 * @param {number|string} id - User ID
 * @returns {Object} Detailed user information
 */
const getUserDetails = async (id) => {
  try {
    // Validate ID
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new ApiError('Invalid user ID format', 400);
    }
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
    });
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Get user's transaction history (last 5)
    const transactions = await Transaction.findAll({
      where: { userId: userId },
      limit: 5,
      order: [['createdAt', 'DESC']],
    });
    
    // Get user's message statistics
    const messageStats = await Message.findAll({
      attributes: [
        'type',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('cost')), 'totalCost'],
      ],
      where: { userId: userId },
      group: ['type'],
    });
    
    // Get user settings
    const userSettings = await Setting.findAll({
      where: { userId: userId },
      attributes: ['category', 'settings'],
    });
    
    // Format settings as an object by category
    const settings = userSettings.reduce((result, setting) => {
      result[setting.category] = setting.settings;
      return result;
    }, {});
    
    // Calculate total spent
    const totalSpent = await Transaction.sum('amount', {
      where: {
        userId: userId,
        type: 'debit',
      },
    }) || 0;
    
    // Calculate total deposits
    const totalDeposits = await Transaction.sum('amount', {
      where: {
        userId: userId,
        type: 'credit',
      },
    }) || 0;
    
    // Get first transaction date to calculate account lifetime
    const firstTransaction = await Transaction.findOne({
      where: { userId: userId },
      order: [['createdAt', 'ASC']],
      attributes: ['createdAt'],
    });
    
    return {
      user,
      transactions,
      messageStats,
      settings,
      financials: {
        totalSpent: parseFloat(totalSpent) || 0,
        totalDeposits: parseFloat(totalDeposits) || 0,
        currentBalance: parseFloat(user.balance) || 0,
        firstTransactionDate: firstTransaction?.createdAt || user.createdAt,
      },
    };
  } catch (error) {
    logger.error(`Get user details service error: ${error.message}`, { stack: error.stack });
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
    // Input validation - basic checks
    if (!userData.email || !userData.firstName || !userData.lastName) {
      throw new ApiError('Missing required user information', 400);
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({
      where: { email: userData.email.trim().toLowerCase() },
    });
    
    if (existingUser) {
      throw new ApiError('Email already registered', 409);
    }
    
    // Sanitize inputs
    const sanitizedUserData = {
      ...userData,
      email: userData.email.trim().toLowerCase(),
      firstName: userData.firstName.trim(),
      lastName: userData.lastName.trim(),
      company: userData.company ? userData.company.trim() : null,
      phone: userData.phone ? userData.phone.trim() : null,
      role: userData.role || 'user',
      status: userData.status || 'active',
      balance: parseFloat(userData.balance || 0),
    };
    
    // Hash password
    const salt = await bcrypt.genSalt(parseInt(config.auth.saltRounds, 10));
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    // Create user
    const user = await User.create({
      ...sanitizedUserData,
      password: hashedPassword,
    });
    
    // Return user without sensitive data
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.resetToken;
    delete userResponse.resetTokenExpiry;
    
    // Send welcome email if not admin
    if (userData.role !== 'admin') {
      emailService.sendWelcomeEmail(user)
        .catch(err => logger.error(`Failed to send welcome email: ${err.message}`));
    }
    
    // Log action
    logger.info(`Admin created new user: ${user.id} - ${user.email}`);
    
    return userResponse;
  } catch (error) {
    logger.error(`Create user service error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Update user
 * @param {number|string} id - User ID
 * @param {Object} userData - User data to update
 * @returns {Object} Updated user
 */
const updateUser = async (id, userData) => {
  try {
    // Validate ID
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new ApiError('Invalid user ID format', 400);
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Sanitize inputs
    const sanitizedUserData = { ...userData };
    
    // Trim string inputs
    ['email', 'firstName', 'lastName', 'company', 'phone'].forEach(field => {
      if (sanitizedUserData[field] !== undefined) {
        sanitizedUserData[field] = sanitizedUserData[field]?.trim() || null;
      }
    });
    
    // Convert numeric values
    if (sanitizedUserData.balance !== undefined) {
      sanitizedUserData.balance = parseFloat(sanitizedUserData.balance);
      if (isNaN(sanitizedUserData.balance)) {
        throw new ApiError('Invalid balance value', 400);
      }
    }
    
    // If email is being updated, check if it already exists
    if (sanitizedUserData.email && sanitizedUserData.email !== user.email) {
      const existingUser = await User.findOne({
        where: { 
          email: sanitizedUserData.email.toLowerCase(),
          id: { [Op.ne]: userId }
        },
      });
      
      if (existingUser) {
        throw new ApiError('Email already in use', 409);
      }
      
      // Convert email to lowercase
      sanitizedUserData.email = sanitizedUserData.email.toLowerCase();
    }
    
    // If password is being updated, hash it
    if (sanitizedUserData.password) {
      const salt = await bcrypt.genSalt(parseInt(config.auth.saltRounds, 10));
      sanitizedUserData.password = await bcrypt.hash(sanitizedUserData.password, salt);
    }
    
    // Check if status is changing to suspended or inactive
    if (sanitizedUserData.status && 
       (sanitizedUserData.status === 'suspended' || sanitizedUserData.status === 'inactive') && 
       user.status === 'active') {
      // Invalidate all sessions for this user
      await UserSession.destroy({
        where: { userId: userId }
      });
      
      // Send notification email about account status change
      emailService.sendAccountStatusEmail(user, sanitizedUserData.status)
        .catch(err => logger.error(`Failed to send account status email: ${err.message}`));
      
      // Create notification
      notificationService.createNotification(
        userId,
        'Account Status Changed',
        `Your account status has been changed to ${sanitizedUserData.status}.`,
        'warning'
      ).catch(err => logger.error(`Failed to create notification: ${err.message}`));
    }
    
    // Update user
    await user.update(sanitizedUserData);
    
    // Return updated user without sensitive data
    const userResponse = user.toJSON();
    delete userResponse.password;
    delete userResponse.resetToken;
    delete userResponse.resetTokenExpiry;
    
    // Log action
    logger.info(`Admin updated user: ${user.id} - ${user.email}`);
    
    return userResponse;
  } catch (error) {
    logger.error(`Update user service error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Delete user
 * @param {number|string} id - User ID
 * @returns {boolean} Success status
 */
const deleteUser = async (id) => {
  try {
    // Validate ID
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      throw new ApiError('Invalid user ID format', 400);
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Check if trying to delete an admin user
    if (user.role === 'admin') {
      throw new ApiError('Cannot delete admin user', 403);
    }
    
    // Store user email for logging
    const userEmail = user.email;
    
    // Use transaction to ensure all related data is cleaned up
    const t = await db.sequelize.transaction();
    
    try {
      // Delete user sessions
      await UserSession.destroy({
        where: { userId: userId },
        transaction: t,
      });
      
      // Delete user settings
      await Setting.destroy({
        where: { userId: userId },
        transaction: t,
      });
      
      // Delete user messages
      if (db.Message) {
        await Message.destroy({
          where: { userId: userId },
          transaction: t,
        });
      }
      
      // Delete user transactions
      await Transaction.destroy({
        where: { userId: userId },
        transaction: t,
      });
      
      // Delete user notifications
      if (db.Notification) {
        await db.Notification.destroy({
          where: { userId: userId },
          transaction: t,
        });
      }
      
      // Delete user contacts and groups if they exist
      if (db.Contact) {
        await db.Contact.destroy({
          where: { userId: userId },
          transaction: t,
        });
      }
      
      if (db.Group) {
        await db.Group.destroy({
          where: { userId: userId },
          transaction: t,
        });
      }
      
      // Finally delete the user
      await user.destroy({ transaction: t });
      
      // Commit transaction
      await t.commit();
      
      // Log action
      logger.info(`Admin deleted user: ${userId} - ${userEmail}`);
      
      return true;
    } catch (error) {
      // Rollback transaction
      await t.rollback();
      throw error;
    }
  } catch (error) {
    logger.error(`Delete user service error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Update user balance
 * @param {number|string} userId - User ID
 * @param {Object} balanceData - Balance update data
 * @returns {Object} Updated user balance
 */
const updateUserBalance = async (userId, balanceData) => {
  try {
    // Validate ID
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      throw new ApiError('Invalid user ID format', 400);
    }
    
    const { operation, amount, description } = balanceData;
    
    if (!['add', 'deduct'].includes(operation)) {
      throw new ApiError('Invalid operation. Use "add" or "deduct"', 400);
    }
    
    // Validate amount is a valid number
    const amountFloat = parseFloat(amount);
    if (isNaN(amountFloat) || amountFloat <= 0) {
      throw new ApiError('Amount must be a valid number greater than zero', 400);
    }
    
    // Get user
    const user = await User.findByPk(userIdInt);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Start transaction
    const t = await db.sequelize.transaction();
    
    try {
      // Update balance
      let newBalance;
      const currentBalance = parseFloat(user.balance) || 0;
      
      if (operation === 'add') {
        newBalance = currentBalance + amountFloat;
      } else {
        newBalance = currentBalance - amountFloat;
        if (newBalance < 0) {
          throw new ApiError('Insufficient balance', 400);
        }
      }
      
      // Update user balance
      await user.update({ balance: newBalance }, { transaction: t });
      
      // Create transaction record
      await Transaction.create({
        userId: userIdInt,
        transactionId: `ADM-${Date.now()}`,
        type: operation === 'add' ? 'credit' : 'debit',
        amount: amountFloat,
        balanceAfter: newBalance,
        service: 'admin-adjustment',
        status: 'completed',
        description: description || `Manual balance ${operation} by admin`,
      }, { transaction: t });
      
      // Commit transaction
      await t.commit();
      
      // Create notification
      notificationService.createNotification(
        userIdInt,
        'Balance Updated',
        `Your account balance has been ${operation === 'add' ? 'increased' : 'decreased'} by $${amountFloat.toFixed(2)} by an administrator.`,
        operation === 'add' ? 'success' : 'info'
      ).catch(err => logger.error(`Failed to create notification: ${err.message}`));
      
      // Log action
      logger.info(`Admin ${operation}ed balance for user ${userIdInt}: $${amountFloat.toFixed(2)}`);
      
      return {
        balance: newBalance,
        currency: 'USD',
        lastUpdated: new Date(),
      };
    } catch (error) {
      // Rollback transaction
      await t.rollback();
      throw error;
    }
  } catch (error) {
    logger.error(`Update user balance service error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Reset user password
 * @param {number|string} userId - User ID
 * @returns {Object} Password reset result
 */
const resetUserPassword = async (userId) => {
  try {
    // Validate ID
    const userIdInt = parseInt(userId, 10);
    if (isNaN(userIdInt)) {
      throw new ApiError('Invalid user ID format', 400);
    }
    
    const user = await User.findByPk(userIdInt);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Generate random password
    const newPassword = passwordUtil.generateRandomPassword(12);
    
    // Hash password
    const salt = await bcrypt.genSalt(parseInt(config.auth.saltRounds, 10));
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update user password
    await user.update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });
    
    // Invalidate all sessions for this user
    await UserSession.destroy({
      where: { userId: userIdInt }
    });
    
    // Send password reset email
    emailService.sendPasswordResetConfirmation(user, newPassword)
      .catch(err => logger.error(`Failed to send password reset email: ${err.message}`));
    
    // Create notification
    notificationService.createNotification(
      userIdInt,
      'Password Reset',
      'Your password has been reset by an administrator. Check your email for the new temporary password.',
      'warning'
    ).catch(err => logger.error(`Failed to create notification: ${err.message}`));
    
    // Log action
    logger.info(`Admin reset password for user: ${userIdInt} - ${user.email}`);
    
    return {
      success: true,
      message: 'Password has been reset and sent to user\'s email',
      tempPassword: config.env === 'development' ? newPassword : undefined,
    };
  } catch (error) {
    logger.error(`Reset user password service error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Get admin dashboard data
 * @returns {Object} Dashboard data
 */
const getDashboardData = async () => {
  try {
    // Get total user count
    const totalUsers = await User.count();
    
    // Get active user count
    const activeUsers = await User.count({
      where: { status: 'active' }
    });
    
    // Get today's registration count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const newUsersToday = await User.count({
      where: {
        createdAt: {
          [Op.gte]: today
        }
      }
    });
    
    // Get total transactions
    const totalTransactions = await Transaction.count();
    
    // Get today's transactions
    const transactionsToday = await Transaction.count({
      where: {
        createdAt: {
          [Op.gte]: today
        }
      }
    });
    
    // Calculate total revenue (sum of all credit transactions)
    const totalRevenue = await Transaction.sum('amount', {
      where: { type: 'credit' }
    }) || 0;
    
    // Calculate today's revenue
    const revenueToday = await Transaction.sum('amount', {
      where: {
        type: 'credit',
        createdAt: {
          [Op.gte]: today
        }
      }
    }) || 0;
    
    // Get system settings
    const systemSettings = await SystemSetting.findAll();
    
    // Format settings as key-value object
    const settings = systemSettings.reduce((result, setting) => {
      result[setting.settingKey] = setting.settingValue;
      return result;
    }, {});
    
    // Get recent users (last 5)
    const recentUsers = await User.findAll({
      attributes: { exclude: ['password', 'resetToken', 'resetTokenExpiry'] },
      limit: 5,
      order: [['createdAt', 'DESC']],
    });
    
    // Get recent transactions (last 5)
    const recentTransactions = await Transaction.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'email'],
        },
      ],
      limit: 5,
      order: [['createdAt', 'DESC']],
    });
    
    // Get message statistics by type
    const messageStats = await Message.findAll({
      attributes: [
        'type',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        [db.sequelize.fn('SUM', db.sequelize.col('cost')), 'totalCost'],
      ],
      group: ['type'],
    });
    
    return {
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          newToday: newUsersToday,
        },
        transactions: {
          total: totalTransactions,
          today: transactionsToday,
        },
        revenue: {
          total: parseFloat(totalRevenue) || 0,
          today: parseFloat(revenueToday) || 0,
        },
        messages: messageStats,
      },
      recentUsers,
      recentTransactions,
      settings,
    };
  } catch (error) {
    logger.error(`Get admin dashboard data service error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Get user activity metrics
 * @param {Object} options - Filter options
 * @returns {Object} User activity data
 */
const getUserActivityMetrics = async (options = {}) => {
  try {
    // Parse days to integer with validation
    const days = parseInt(options.days, 10) || 30;
    if (days < 1 || days > 365) {
      throw new ApiError('Days parameter must be between 1 and 365', 400);
    }
    
    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);
    
    // Get daily user registrations
    const dailyRegistrations = await User.findAll({
      attributes: [
        [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'date'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      group: [db.sequelize.fn('DATE', db.sequelize.col('createdAt'))],
      order: [[db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'ASC']],
    });
    
    // Get daily message counts
    const dailyMessages = await Message.findAll({
      attributes: [
        [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'date'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      group: [db.sequelize.fn('DATE', db.sequelize.col('createdAt'))],
      order: [[db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'ASC']],
    });
    
    // Get daily transaction amounts
    const dailyTransactions = await Transaction.findAll({
      attributes: [
        [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'date'],
        [db.sequelize.fn('SUM', db.sequelize.col('amount')), 'total'],
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
        'type',
      ],
      where: {
        createdAt: {
          [Op.gte]: startDate,
        },
      },
      group: [db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'type'],
      order: [[db.sequelize.fn('DATE', db.sequelize.col('createdAt')), 'ASC']],
    });
    
    // Get user distribution by status
    const userStatusDistribution = await User.findAll({
      attributes: [
        'status',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      ],
      group: ['status'],
    });
    
    // Get user distribution by role
    const userRoleDistribution = await User.findAll({
      attributes: [
        'role',
        [db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count'],
      ],
      group: ['role'],
    });
    
    return {
      dailyRegistrations,
      dailyMessages,
      dailyTransactions,
      userStatusDistribution,
      userRoleDistribution,
      period: {
        start: startDate,
        end: new Date(),
        days,
      },
    };
  } catch (error) {
    logger.error(`Get user activity metrics service error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Update system settings
 * @param {Object} settingsData - Settings to update
 * @returns {Object} Updated settings
 */
const updateSystemSettings = async (settingsData) => {
  try {
    // Validate input
    if (!settingsData || Object.keys(settingsData).length === 0) {
      throw new ApiError('No settings provided for update', 400);
    }
    
    const updates = [];
    
    // Start transaction
    const t = await db.sequelize.transaction();
    
    try {
      // Process each setting
      for (const [key, value] of Object.entries(settingsData)) {
        // Skip undefined and null values
        if (value === undefined || value === null) {
          continue;
        }
        
        // Convert value to string if it isn't already
        const stringValue = typeof value === 'string' ? value : String(value);
        
        // Find or create setting
        const [setting, created] = await SystemSetting.findOrCreate({
          where: { settingKey: key },
          defaults: {
            settingKey: key,
            settingValue: stringValue,
            description: `System setting for ${key}`,
          },
          transaction: t,
        });
        
        // If setting exists, update it
        if (!created) {
          await setting.update({
            settingValue: stringValue,
          }, { transaction: t });
        }
        
        updates.push({
          key,
          value: stringValue,
          created,
        });
      }
      
      if (updates.length === 0) {
        throw new ApiError('No valid settings provided for update', 400);
      }
      
      // Commit transaction
      await t.commit();
      
      // Log action
      logger.info(`Admin updated system settings: ${JSON.stringify(updates.map(u => u.key))}`);
      
      return {
        success: true,
        updates,
      };
    } catch (error) {
      // Rollback transaction
      await t.rollback();
      throw error;
    }
  } catch (error) {
    logger.error(`Update system settings service error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Get service costs
 * @returns {Array} Service costs
 */
const getServiceCosts = async () => {
  try {
    const serviceCosts = await db.ServiceCost.findAll({
      where: { active: true },
    });
    
    return serviceCosts;
  } catch (error) {
    logger.error(`Get service costs service error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

/**
 * Update service cost
 * @param {number|string} id - Service cost ID
 * @param {Object} data - Service cost data
 * @returns {Object} Updated service cost
 */
const updateServiceCost = async (id, data) => {
  try {
    // Validate ID
    const costId = parseInt(id, 10);
    if (isNaN(costId)) {
      throw new ApiError('Invalid service cost ID format', 400);
    }
    
    // Validate cost value if provided
   if (data.cost !== undefined) {
    const costValue = parseFloat(data.cost);
    if (isNaN(costValue) || costValue < 0) {
      throw new ApiError('Cost must be a non-negative number', 400);
    }
    data.cost = costValue;
  }
  
  const serviceCost = await db.ServiceCost.findByPk(costId);
  
  if (!serviceCost) {
    throw new ApiError('Service cost not found', 404);
  }
  
  await serviceCost.update(data);
  
  // Log action
  logger.info(`Admin updated service cost: ${costId} - ${serviceCost.name}`);
  
  return serviceCost;
} catch (error) {
  logger.error(`Update service cost service error: ${error.message}`, { stack: error.stack });
  throw error;
}
};

module.exports = {
getAllUsers,
getUserById,
getUserDetails,
createUser,
updateUser,
deleteUser,
updateUserBalance,
resetUserPassword,
getDashboardData,
getUserActivityMetrics,
updateSystemSettings,
getServiceCosts,
updateServiceCost,
};