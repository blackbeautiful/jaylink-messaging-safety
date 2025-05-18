const { Op } = require('sequelize');
const db = require('../models');
const ApiError = require('../utils/api-error.util');
const logger = require('../config/logger');

const Group = db.Group;
const Contact = db.Contact;
const GroupContact = db.GroupContact;
const User = db.User;

/**
 * Create a new group
 * @param {number} userId - User ID
 * @param {Object} groupData - Group data
 * @returns {Object} Created group
 */
const createGroup = async (userId, groupData) => {
  try {
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Check if group name already exists for this user
    const existingGroup = await Group.findOne({
      where: {
        userId,
        name: groupData.name,
      },
    });

    if (existingGroup) {
      throw new ApiError('A group with this name already exists', 409);
    }

    // Create group
    const group = await Group.create({
      ...groupData,
      userId,
    });

    return group;
  } catch (error) {
    logger.error(`Create group error: ${error.message}`, { stack: error.stack, userId, groupData });
    throw error;
  }
};

/**
 * Get groups for a user with pagination and search
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Groups data with pagination details
 */
const getGroups = async (userId, options = {}) => {
  const { search = '', page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  try {
    // Build search condition
    const searchCondition = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { description: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    // Find groups with pagination
    const { count, rows } = await Group.findAndCountAll({
      where: {
        userId,
        ...searchCondition,
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    // Get contact counts for each group
    const groupIds = rows.map(group => group.id);
    
    // Count contacts in each group
    const contactCounts = await GroupContact.findAll({
      attributes: [
        'groupId',
        [db.sequelize.fn('COUNT', db.sequelize.col('contactId')), 'contactCount']
      ],
      where: {
        groupId: { [Op.in]: groupIds }
      },
      group: ['groupId'],
      raw: true
    });
    
    // Create a map of groupId -> contactCount
    const contactCountMap = contactCounts.reduce((map, item) => {
      map[item.groupId] = parseInt(item.contactCount, 10);
      return map;
    }, {});
    
    // Add contact count to each group
    const groupsWithContactCount = rows.map(group => {
      const plainGroup = group.toJSON();
      return {
        ...plainGroup,
        contactCount: contactCountMap[group.id] || 0
      };
    });

    // Calculate pagination details
    const totalPages = Math.ceil(count / limit);

    return {
      groups: groupsWithContactCount,
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    logger.error(`Get groups error: ${error.message}`, { stack: error.stack, userId, options });
    throw new ApiError('Failed to fetch groups', 500);
  }
};

/**
 * Get a single group by ID
 * @param {number} userId - User ID
 * @param {number} groupId - Group ID
 * @returns {Object} Group data
 */
const getGroupById = async (userId, groupId) => {
  try {
    const group = await Group.findOne({
      where: {
        id: groupId,
        userId,
      },
    });

    if (!group) {
      throw new ApiError('Group not found', 404);
    }

    // Get contact count for the group
    const contactCount = await GroupContact.count({
      where: { groupId }
    });

    const groupData = group.toJSON();
    return {
      ...groupData,
      contactCount
    };
  } catch (error) {
    logger.error(`Get group by ID error: ${error.message}`, { stack: error.stack, userId, groupId });
    throw error;
  }
};

/**
 * Update a group
 * @param {number} userId - User ID
 * @param {number} groupId - Group ID
 * @param {Object} groupData - Group data to update
 * @returns {Object} Updated group
 */
const updateGroup = async (userId, groupId, groupData) => {
  try {
    // Find group
    const group = await Group.findOne({
      where: {
        id: groupId,
        userId,
      },
    });

    if (!group) {
      throw new ApiError('Group not found', 404);
    }

    // Check if updated group name already exists (but skip if it's the same as current)
    if (groupData.name && groupData.name !== group.name) {
      const existingGroup = await Group.findOne({
        where: {
          userId,
          name: groupData.name,
          id: { [Op.ne]: groupId }, // Not this group
        },
      });

      if (existingGroup) {
        throw new ApiError('A group with this name already exists', 409);
      }
    }

    // Update group
    await group.update(groupData);

    // Get contact count for the group
    const contactCount = await GroupContact.count({
      where: { groupId }
    });

    const updatedGroup = group.toJSON();
    return {
      ...updatedGroup,
      contactCount
    };
  } catch (error) {
    logger.error(`Update group error: ${error.message}`, { stack: error.stack, userId, groupId, groupData });
    throw error;
  }
};

/**
 * Delete a group
 * @param {number} userId - User ID
 * @param {number} groupId - Group ID
 * @returns {boolean} Success status
 */
const deleteGroup = async (userId, groupId) => {
  try {
    // Find group
    const group = await Group.findOne({
      where: {
        id: groupId,
        userId,
      },
    });

    if (!group) {
      throw new ApiError('Group not found', 404);
    }

    // Delete group (associated GroupContacts will be deleted by CASCADE)
    await group.destroy();

    return true;
  } catch (error) {
    logger.error(`Delete group error: ${error.message}`, { stack: error.stack, userId, groupId });
    throw error;
  }
};

/**
 * Add contacts to a group
 * @param {number} userId - User ID
 * @param {number} groupId - Group ID
 * @param {Array} contactIds - Array of contact IDs to add
 * @returns {Object} Result with added contacts count
 */
const addContactsToGroup = async (userId, groupId, contactIds) => {
  try {
    // Find group
    const group = await Group.findOne({
      where: {
        id: groupId,
        userId,
      },
    });

    if (!group) {
      throw new ApiError('Group not found', 404);
    }

    // Verify all contacts belong to the user
    const contacts = await Contact.findAll({
      where: {
        id: { [Op.in]: contactIds },
        userId,
      },
    });

    if (contacts.length !== contactIds.length) {
      throw new ApiError('One or more contacts not found', 404);
    }

    // Get existing group-contact associations to avoid duplicates
    const existingAssociations = await GroupContact.findAll({
      where: {
        groupId,
        contactId: { [Op.in]: contactIds },
      },
      attributes: ['contactId'],
    });

    const existingContactIds = existingAssociations.map(assoc => assoc.contactId);
    const newContactIds = contactIds.filter(id => !existingContactIds.includes(id));

    // Create new associations
    if (newContactIds.length > 0) {
      const associations = newContactIds.map(contactId => ({
        groupId,
        contactId,
      }));

      await GroupContact.bulkCreate(associations);
    }

    return {
      group: group.toJSON(),
      added: newContactIds.length,
      alreadyInGroup: existingContactIds.length,
      total: contactIds.length,
    };
  } catch (error) {
    logger.error(`Add contacts to group error: ${error.message}`, { stack: error.stack, userId, groupId, contactIds });
    throw error;
  }
};

/**
 * Remove a contact from a group
 * @param {number} userId - User ID
 * @param {number} groupId - Group ID
 * @param {number} contactId - Contact ID to remove
 * @returns {boolean} Success status
 */
const removeContactFromGroup = async (userId, groupId, contactId) => {
  try {
    // Find group
    const group = await Group.findOne({
      where: {
        id: groupId,
        userId,
      },
    });

    if (!group) {
      throw new ApiError('Group not found', 404);
    }

    // Find contact
    const contact = await Contact.findOne({
      where: {
        id: contactId,
        userId,
      },
    });

    if (!contact) {
      throw new ApiError('Contact not found', 404);
    }

    // Delete association
    const deleted = await GroupContact.destroy({
      where: {
        groupId,
        contactId,
      },
    });

    if (deleted === 0) {
      throw new ApiError('Contact is not in this group', 404);
    }

    return true;
  } catch (error) {
    logger.error(`Remove contact from group error: ${error.message}`, { stack: error.stack, userId, groupId, contactId });
    throw error;
  }
};

/**
 * Get contacts in a group with pagination
 * @param {number} userId - User ID
 * @param {number} groupId - Group ID
 * @param {Object} options - Query options
 * @returns {Object} Contacts in group with pagination details
 */
const getContactsInGroup = async (userId, groupId, options = {}) => {
  const { page = 1, limit = 20, search = '' } = options;
  const offset = (page - 1) * limit;

  try {
    // Find group
    const group = await Group.findOne({
      where: {
        id: groupId,
        userId,
      },
    });

    if (!group) {
      throw new ApiError('Group not found', 404);
    }

    // Build search condition
    const searchCondition = search
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
            { email: { [Op.like]: `%${search}%` } },
          ],
        }
      : {};

    // Find contacts in group with pagination
    const { count, rows } = await Contact.findAndCountAll({
      include: [
        {
          model: Group,
          as: 'groups',
          where: { id: groupId },
          through: { attributes: [] },
          required: true,
        },
      ],
      where: {
        userId,
        ...searchCondition,
      },
      distinct: true,
      order: [['name', 'ASC']],
      limit,
      offset,
    });

    // Calculate pagination details
    const totalPages = Math.ceil(count / limit);

    return {
      contacts: rows,
      group: group.toJSON(),
      pagination: {
        total: count,
        totalPages,
        currentPage: page,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    logger.error(`Get contacts in group error: ${error.message}`, { stack: error.stack, userId, groupId, options });
    throw error;
  }
};

/**
 * Get group count for a user
 * @param {number} userId - User ID
 * @returns {number} Group count
 */
const getGroupCount = async (userId) => {
  try {
    return await Group.count({
      where: { userId },
    });
  } catch (error) {
    logger.error(`Get group count error: ${error.message}`, { stack: error.stack, userId });
    throw new ApiError('Failed to get group count', 500);
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
  getGroupCount,
};