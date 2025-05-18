// backend/src/controllers/group.controller.js
const groupService = require('../services/group.service');
const response = require('../utils/response.util');
const logger = require('../config/logger');

/**
 * Create a new group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupData = req.body;
    
    const group = await groupService.createGroup(userId, groupData);
    
    return response.success(res, { group }, 'Group created successfully', 201);
  } catch (error) {
    logger.error(`Create group controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get all groups for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getGroups = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search, page, limit } = req.query;
    
    const result = await groupService.getGroups(userId, { search, page, limit });
    
    return response.success(res, result, 'Groups retrieved successfully');
  } catch (error) {
    logger.error(`Get groups controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get a group by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getGroupById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.id;
    
    const group = await groupService.getGroupById(userId, groupId);
    
    return response.success(res, { group }, 'Group retrieved successfully');
  } catch (error) {
    logger.error(`Get group by ID controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Update a group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.id;
    const groupData = req.body;
    
    const group = await groupService.updateGroup(userId, groupId, groupData);
    
    return response.success(res, { group }, 'Group updated successfully');
  } catch (error) {
    logger.error(`Update group controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Delete a group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.id;
    
    await groupService.deleteGroup(userId, groupId);
    
    return response.success(res, { success: true }, 'Group deleted successfully');
  } catch (error) {
    logger.error(`Delete group controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Add contacts to a group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const addContactsToGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.id;
    const { contactIds } = req.body;
    
    const result = await groupService.addContactsToGroup(userId, groupId, contactIds);
    
    return response.success(res, result, 'Contacts added to group successfully');
  } catch (error) {
    logger.error(`Add contacts to group controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Remove a contact from a group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const removeContactFromGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.id;
    const contactId = req.params.contactId;
    
    await groupService.removeContactFromGroup(userId, groupId, contactId);
    
    return response.success(res, { success: true }, 'Contact removed from group successfully');
  } catch (error) {
    logger.error(`Remove contact from group controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get contacts in a group
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getContactsInGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupId = req.params.id;
    const { page, limit, search } = req.query;
    
    const result = await groupService.getContactsInGroup(userId, groupId, { page, limit, search });
    
    return response.success(res, result, 'Group contacts retrieved successfully');
  } catch (error) {
    logger.error(`Get contacts in group controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

module.exports = {
  createGroup,
  getGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  addContactsToGroup,
  removeContactFromGroup,
  getContactsInGroup,
};