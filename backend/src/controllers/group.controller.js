// backend/src/controllers/group.controller.js - Fixed version with proper contact handling
const groupService = require('../services/group.service');
const response = require('../utils/response.util');
const logger = require('../config/logger');

/**
 * Create a new group with optional contacts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createGroup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const groupData = req.body;
    
    // Log the incoming data for debugging
    logger.info('Creating group with data:', { userId, groupData });
    
    // Validate required fields
    if (!groupData.name || !groupData.name.trim()) {
      return response.error(res, 'Group name is required', 400);
    }
    
    // Prepare group data
    const processedGroupData = {
      name: groupData.name.trim(),
      description: groupData.description ? groupData.description.trim() : undefined,
      contactIds: Array.isArray(groupData.contactIds) ? groupData.contactIds : undefined
    };
    
    // Log processed data
    logger.info('Processed group data:', { processedGroupData });
    
    const group = await groupService.createGroup(userId, processedGroupData);
    
    return response.success(res, { group }, 'Group created successfully', 201);
  } catch (error) {
    logger.error(`Create group controller error: ${error.message}`, { 
      stack: error.stack, 
      userId: req.user?.id,
      body: req.body 
    });
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
    const { search, page = 1, limit = 20 } = req.query;
    
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    
    const result = await groupService.getGroups(userId, { 
      search: search ? search.trim() : '', 
      page: pageNum, 
      limit: limitNum 
    });
    
    return response.success(res, result, 'Groups retrieved successfully');
  } catch (error) {
    logger.error(`Get groups controller error: ${error.message}`, { 
      stack: error.stack, 
      userId: req.user?.id,
      query: req.query 
    });
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
    
    // Validate group ID
    if (!groupId || isNaN(groupId)) {
      return response.error(res, 'Invalid group ID', 400);
    }
    
    const group = await groupService.getGroupById(userId, parseInt(groupId));
    
    return response.success(res, { group }, 'Group retrieved successfully');
  } catch (error) {
    logger.error(`Get group by ID controller error: ${error.message}`, { 
      stack: error.stack, 
      userId: req.user?.id,
      groupId: req.params.id 
    });
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
    
    // Log the incoming data for debugging
    logger.info('Updating group with data:', { userId, groupId, groupData });
    
    // Validate group ID
    if (!groupId || isNaN(groupId)) {
      return response.error(res, 'Invalid group ID', 400);
    }
    
    // Validate required fields
    if (!groupData.name || !groupData.name.trim()) {
      return response.error(res, 'Group name is required', 400);
    }
    
    // Prepare update data
    const updateData = {
      name: groupData.name.trim(),
      description: groupData.description ? groupData.description.trim() : undefined
    };
    
    // Add contact IDs if provided
    if (Array.isArray(groupData.contactIds)) {
      // Validate contact IDs
      const validContactIds = groupData.contactIds
        .filter(id => !isNaN(id) && parseInt(id) > 0)
        .map(id => parseInt(id));
      
      updateData.contactIds = validContactIds;
      logger.info('Valid contact IDs for update:', { validContactIds });
    }
    
    const group = await groupService.updateGroup(userId, parseInt(groupId), updateData);
    
    return response.success(res, { group }, 'Group updated successfully');
  } catch (error) {
    logger.error(`Update group controller error: ${error.message}`, { 
      stack: error.stack, 
      userId: req.user?.id,
      groupId: req.params.id,
      body: req.body 
    });
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
    
    // Validate group ID
    if (!groupId || isNaN(groupId)) {
      return response.error(res, 'Invalid group ID', 400);
    }
    
    await groupService.deleteGroup(userId, parseInt(groupId));
    
    return response.success(res, { success: true }, 'Group deleted successfully');
  } catch (error) {
    logger.error(`Delete group controller error: ${error.message}`, { 
      stack: error.stack, 
      userId: req.user?.id,
      groupId: req.params.id 
    });
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
    
    // Validate group ID
    if (!groupId || isNaN(groupId)) {
      return response.error(res, 'Invalid group ID', 400);
    }
    
    // Validate contact IDs
    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return response.error(res, 'Contact IDs array is required and cannot be empty', 400);
    }
    
    const validContactIds = contactIds
      .filter(id => !isNaN(id) && parseInt(id) > 0)
      .map(id => parseInt(id));
    
    if (validContactIds.length === 0) {
      return response.error(res, 'No valid contact IDs provided', 400);
    }
    
    const result = await groupService.addContactsToGroup(userId, parseInt(groupId), validContactIds);
    
    return response.success(res, result, 'Contacts added to group successfully');
  } catch (error) {
    logger.error(`Add contacts to group controller error: ${error.message}`, { 
      stack: error.stack, 
      userId: req.user?.id,
      groupId: req.params.id,
      body: req.body 
    });
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
    
    // Validate IDs
    if (!groupId || isNaN(groupId)) {
      return response.error(res, 'Invalid group ID', 400);
    }
    
    if (!contactId || isNaN(contactId)) {
      return response.error(res, 'Invalid contact ID', 400);
    }
    
    await groupService.removeContactFromGroup(userId, parseInt(groupId), parseInt(contactId));
    
    return response.success(res, { success: true }, 'Contact removed from group successfully');
  } catch (error) {
    logger.error(`Remove contact from group controller error: ${error.message}`, { 
      stack: error.stack, 
      userId: req.user?.id,
      groupId: req.params.id,
      contactId: req.params.contactId 
    });
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
    const { page = 1, limit = 20, search } = req.query;
    
    // Validate group ID
    if (!groupId || isNaN(groupId)) {
      return response.error(res, 'Invalid group ID', 400);
    }
    
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    
    const result = await groupService.getContactsInGroup(userId, parseInt(groupId), { 
      page: pageNum, 
      limit: limitNum, 
      search: search ? search.trim() : '' 
    });
    
    return response.success(res, result, 'Group contacts retrieved successfully');
  } catch (error) {
    logger.error(`Get contacts in group controller error: ${error.message}`, { 
      stack: error.stack, 
      userId: req.user?.id,
      groupId: req.params.id,
      query: req.query 
    });
    next(error);
  }
};

/**
 * Get group statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getGroupStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    const totalGroups = await groupService.getGroupCount(userId);
    
    // Get additional stats if needed
    const stats = {
      totalGroups,
      // Add more stats here as needed
    };
    
    return response.success(res, { stats }, 'Group statistics retrieved successfully');
  } catch (error) {
    logger.error(`Get group stats controller error: ${error.message}`, { 
      stack: error.stack, 
      userId: req.user?.id 
    });
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
  getGroupStats,
};