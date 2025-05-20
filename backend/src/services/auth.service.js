const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const db = require('../models');
const config = require('../config/config');
const ApiError = require('../utils/api-error.util');
const logger = require('../config/logger');
const emailService = require('./email.service');
const notificationService = require('./notification.service');

const User = db.User;
const UserSession = db.UserSession;

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Object} User object and JWT token
 */
const register = async (userData) => {
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

    // Create new user
    const user = await User.create({
      ...userData,
      password: hashedPassword,
      role: 'user',
      status: 'active',
    });

    // Generate token
    const token = generateToken(user);

    // Create a session
    await createSession(user, token);

    // Return user and token (exclude password)
    const userResponse = user.toJSON();
    delete userResponse.password;

    // Send welcome email (don't await to prevent blocking)
    emailService.sendWelcomeEmail(user)
      .catch(err => logger.error(`Failed to send welcome email: ${err.message}`));

    // Create welcome notification
    notificationService.createNotification(
      user.id,
      'Welcome to JayLink',
      'Thank you for joining JayLink SMS. Start sending messages right away!',
      'info',
      {
        action: 'welcome',
        timestamp: new Date().toISOString()
      },
      false // Don't send email since we already sent welcome email
    ).catch(err => logger.error(`Failed to create welcome notification: ${err.message}`));

    return {
      user: userResponse,
      token,
    };
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    throw error;
  }
};

/**
 * Login a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} User object and JWT token
 */
const login = async (email, password) => {
  try {
    // Find user by email
    const user = await User.findOne({
      where: { 
        email,
        status: 'active' 
      },
    });

    if (!user) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Check if password matches
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new ApiError('Invalid email or password', 401);
    }

    // Generate token
    const token = generateToken(user);

    // Create a session
    await createSession(user, token);

    // Return user and token (exclude password)
    const userResponse = user.toJSON();
    delete userResponse.password;

    // Create login notification
    notificationService.createNotification(
      user.id,
      'New Login',
      'You have successfully logged in to your account.',
      'info',
      {
        action: 'login',
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1' // In a real app, get from request
      },
      false // Don't send email for routine logins
    ).catch(err => logger.error(`Failed to create login notification: ${err.message}`));

    return {
      user: userResponse,
      token,
    };
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    throw error;
  }
};

/**
 * Admin login
 * @param {string} username - Admin username
 * @param {string} password - Admin password
 * @returns {Object} Admin object and JWT token
 */
const adminLogin = async (username, password) => {
  try {
    // Find admin user
    const admin = await User.findOne({
      where: { 
        [Op.or]: [
          { email: username },
          { firstName: username }
        ],
        role: 'admin',
        status: 'active' 
      },
    });

    if (!admin) {
      throw new ApiError('Invalid admin credentials', 401);
    }

    // Check if password matches
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new ApiError('Invalid admin credentials', 401);
    }

    // Generate admin token
    const token = generateToken(admin, true);

    // Create a session
    await createSession(admin, token);

    // Return admin and token (exclude password)
    const adminResponse = admin.toJSON();
    delete adminResponse.password;

    // Create admin login notification
    notificationService.createNotification(
      admin.id,
      'Admin Login',
      'You have successfully logged in to your admin account.',
      'info',
      {
        action: 'admin-login',
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1' // In a real app, get from request
      },
      false // Don't send email for routine logins
    ).catch(err => logger.error(`Failed to create admin login notification: ${err.message}`));

    return {
      admin: adminResponse,
      token,
    };
  } catch (error) {
    logger.error(`Admin login error: ${error.message}`);
    throw error;
  }
};

/**
 * Get current user profile using JWT token
 * @param {string} userId - User ID from JWT token
 * @returns {Object} User object
 */
const getCurrentUser = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    return user;
  } catch (error) {
    logger.error(`Get current user error: ${error.message}`);
    throw error;
  }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {boolean} Success status
 */
const forgotPassword = async (email) => {
  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });

    if (!user) {
      // We don't want to reveal that the email doesn't exist
      // Just return success without sending email
      return true;
    }

    // Generate password reset token (expire in 1 hour)
    const resetToken = jwt.sign(
      { id: user.id, type: 'reset' },
      config.auth.jwtResetSecret,
      { expiresIn: '1h' }
    );

    // Update user with reset token
    await user.update({
      resetToken,
      resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour
    });

    // Send password reset email
    await emailService.sendPasswordResetEmail(user, resetToken);

    // Create notification
    notificationService.createNotification(
      user.id,
      'Password Reset Requested',
      'A password reset request was initiated for your account. If you did not request this, please contact support.',
      'warning',
      {
        action: 'password-reset-request',
        timestamp: new Date().toISOString()
      },
      false // Don't send email since we already sent reset email
    ).catch(err => logger.error(`Failed to create password reset notification: ${err.message}`));

    // For development, also log the token
    if (config.env === 'development') {
      logger.info(`Reset token for ${email}: ${resetToken}`);
    }

    return true;
  } catch (error) {
    logger.error(`Forgot password error: ${error.message}`);
    throw error;
  }
};

/**
 * Reset password using token
 * @param {string} token - Password reset token
 * @param {string} password - New password
 * @returns {boolean} Success status
 */
const resetPassword = async (token, password) => {
  try {
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, config.auth.jwtResetSecret);
    } catch (error) {
      throw new ApiError('Invalid or expired token', 400);
    }

    // Find user by id and token
    const user = await User.findOne({
      where: {
        id: decoded.id,
        resetToken: token,
        resetTokenExpiry: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      throw new ApiError('Invalid or expired token', 400);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(parseInt(config.auth.saltRounds, 10));
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user password and clear reset token
    await user.update({
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });

    // Send password change confirmation email
    emailService.sendPasswordChangedEmail(user)
      .catch(err => logger.error(`Failed to send password change email: ${err.message}`));

    // Create notification for password reset
    notificationService.createNotification(
      user.id,
      'Password Reset Complete',
      'Your password has been reset successfully. If you did not make this change, please contact support immediately.',
      'warning',
      {
        action: 'password-reset-complete',
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1' // In a real app, get from request
      },
      false // Don't send email since we already sent changed email
    ).catch(err => logger.error(`Failed to create password reset notification: ${err.message}`));

    return true;
  } catch (error) {
    logger.error(`Reset password error: ${error.message}`);
    throw error;
  }
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {boolean} Success status
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  try {
    // Find user
    const user = await User.findByPk(userId);

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new ApiError('Current password is incorrect', 400);
    }

    // Hash new password
    const salt = await bcrypt.genSalt(parseInt(config.auth.saltRounds, 10));
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await user.update({ password: hashedPassword });

    // Send password change confirmation email
    emailService.sendPasswordChangedEmail(user)
      .catch(err => logger.error(`Failed to send password change email: ${err.message}`));

    // Create notification for password change
    notificationService.createNotification(
      userId,
      'Password Changed', 
      'Your account password was changed successfully. If you did not make this change, please contact support immediately.',
      'warning',
      {
        action: 'password-changed',
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1' // In a real app, would get from request
      },
      false // Don't send another email since we already sent one
    ).catch(err => logger.error(`Failed to create password change notification: ${err.message}`));

    return true;
  } catch (error) {
    logger.error(`Change password error: ${error.message}`);
    throw error;
  }
};

/**
 * Generate JWT token
 * @param {Object} user - User object
 * @param {boolean} isAdmin - Is admin user
 * @returns {string} JWT token
 */
const generateToken = (user, isAdmin = false) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    isAdmin: isAdmin || user.role === 'admin',
  };

  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });
};

/**
 * Create user session
 * @param {Object} user - User object
 * @param {string} token - JWT token
 */
const createSession = async (user, token) => {
  // Session expiry should match token expiry
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 1); // Assuming 1 day expiry

  await UserSession.create({
    userId: user.id,
    token,
    ipAddress: '127.0.0.1', // In a real app, would get from request
    userAgent: 'API', // In a real app, would get from request
    expiresAt: expiryDate,
  });
};

/**
 * Validate token
 * @param {string} token - JWT token
 * @returns {Object} Decoded token payload
 */
const validateToken = (token) => {
  try {
    return jwt.verify(token, config.auth.jwtSecret);
  } catch (error) {
    throw new ApiError('Invalid or expired token', 401);
  }
};

/**
 * Logout user by invalidating session
 * @param {string} token - JWT token
 * @returns {boolean} Success status
 */
const logout = async (token) => {
  try {
    // Delete session for this token
    await UserSession.destroy({
      where: { token },
    });
    
    return true;
  } catch (error) {
    logger.error(`Logout error: ${error.message}`);
    throw error;
  }
};

module.exports = {
  register,
  login,
  adminLogin,
  getCurrentUser,
  forgotPassword,
  resetPassword,
  changePassword,
  validateToken,
  logout,
};