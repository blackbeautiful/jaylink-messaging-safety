const { Op } = require('sequelize');
const db = require('../models');
const ApiError = require('../utils/api-error.util');
const logger = require('../config/logger');
const csvUtil = require('../utils/csv.util');

const Contact = db.Contact;
const User = db.User;

/**
 * Create a new contact
 * @param {number} userId - User ID
 * @param {Object} contactData - Contact data
 * @returns {Object} Created contact
 */
const createContact = async (userId, contactData) => {
  try {
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Check if phone number already exists for this user
    const existingContact = await Contact.findOne({
      where: {
        userId,
        phone: contactData.phone,
      },
    });

    if (existingContact) {
      throw new ApiError('A contact with this phone number already exists', 409);
    }

    // Create contact
    const contact = await Contact.create({
      ...contactData,
      userId,
    });

    return contact;
  } catch (error) {
    logger.error(`Create contact error: ${error.message}`, { stack: error.stack, userId, contactData });
    throw error;
  }
};

/**
 * Get contacts for a user with pagination and search
 * @param {number} userId - User ID
 * @param {Object} options - Query options
 * @returns {Object} Contacts data with pagination details
 */
const getContacts = async (userId, options = {}) => {
  const { search = '', page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  try {
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

    // Find contacts with pagination
    const { count, rows } = await Contact.findAndCountAll({
      where: {
        userId,
        ...searchCondition,
      },
      order: [['createdAt', 'DESC']],
      limit,
      offset,
    });

    // Calculate pagination details
    const totalPages = Math.ceil(count / limit);

    return {
      contacts: rows,
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
    logger.error(`Get contacts error: ${error.message}`, { stack: error.stack, userId, options });
    throw new ApiError('Failed to fetch contacts', 500);
  }
};

/**
 * Get a single contact by ID
 * @param {number} userId - User ID
 * @param {number} contactId - Contact ID
 * @returns {Object} Contact data
 */
const getContactById = async (userId, contactId) => {
  try {
    const contact = await Contact.findOne({
      where: {
        id: contactId,
        userId,
      },
    });

    if (!contact) {
      throw new ApiError('Contact not found', 404);
    }

    return contact;
  } catch (error) {
    logger.error(`Get contact by ID error: ${error.message}`, { stack: error.stack, userId, contactId });
    throw error;
  }
};

/**
 * Update a contact
 * @param {number} userId - User ID
 * @param {number} contactId - Contact ID
 * @param {Object} contactData - Contact data to update
 * @returns {Object} Updated contact
 */
const updateContact = async (userId, contactId, contactData) => {
  try {
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

    // Check if updated phone number already exists (but skip if it's the same as current)
    if (contactData.phone && contactData.phone !== contact.phone) {
      const existingContact = await Contact.findOne({
        where: {
          userId,
          phone: contactData.phone,
          id: { [Op.ne]: contactId }, // Not this contact
        },
      });

      if (existingContact) {
        throw new ApiError('A contact with this phone number already exists', 409);
      }
    }

    // Update contact
    await contact.update(contactData);

    return contact;
  } catch (error) {
    logger.error(`Update contact error: ${error.message}`, { stack: error.stack, userId, contactId, contactData });
    throw error;
  }
};

/**
 * Delete a contact
 * @param {number} userId - User ID
 * @param {number} contactId - Contact ID
 * @returns {boolean} Success status
 */
const deleteContact = async (userId, contactId) => {
  try {
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

    // Delete contact
    await contact.destroy();

    return true;
  } catch (error) {
    logger.error(`Delete contact error: ${error.message}`, { stack: error.stack, userId, contactId });
    throw error;
  }
};

/**
 * Import contacts from CSV file
 * @param {number} userId - User ID
 * @param {string} filePath - Path to the CSV file
 * @param {boolean} replaceAll - Whether to replace all existing contacts
 * @returns {Object} Import results
 */
const importContactsFromCsv = async (userId, filePath, replaceAll = false) => {
  try {
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Process CSV file
    const contacts = await csvUtil.processCsvFile(filePath);
    
    // Validate contacts
    const { validContacts, errors } = csvUtil.validateContacts(contacts);
    
    // If no valid contacts, throw error
    if (validContacts.length === 0) {
      throw new ApiError('No valid contacts found in the CSV file', 400);
    }

    // Start a transaction for batch operations
    const transaction = await db.sequelize.transaction();
    
    try {
      // If replaceAll is true, delete all existing contacts first
      if (replaceAll) {
        await Contact.destroy({
          where: { userId },
          transaction,
        });
      }

      // Prepare contacts for insert with userId
      const contactsToInsert = validContacts.map(contact => ({
        ...contact,
        userId,
      }));

      // Skip existing phone numbers if not replacing all
      let importedContacts;
      
      if (!replaceAll) {
        // Get existing phone numbers
        const existingPhones = (await Contact.findAll({
          attributes: ['phone'],
          where: { userId },
          transaction,
        })).map(c => c.phone);
        
        // Filter out contacts with existing phone numbers
        const newContacts = contactsToInsert.filter(contact => !existingPhones.includes(contact.phone));
        
        // Add skipped phones to errors
        const skippedContacts = contactsToInsert.filter(contact => existingPhones.includes(contact.phone));
        skippedContacts.forEach(contact => {
          errors.push({
            message: 'Contact with this phone number already exists',
            data: contact,
          });
        });
        
        // Bulk create new contacts
        importedContacts = await Contact.bulkCreate(newContacts, { transaction });
      } else {
        // Bulk create all contacts (since we've already deleted existing ones)
        importedContacts = await Contact.bulkCreate(contactsToInsert, { transaction });
      }

      // Commit transaction
      await transaction.commit();

      // Delete CSV file after processing
      await csvUtil.deleteCsvFile(filePath);

      return {
        imported: importedContacts.length,
        skipped: errors.length,
        total: validContacts.length + errors.length,
        errors: errors.length > 0 ? errors : null,
      };
    } catch (error) {
      // Rollback transaction on error
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    logger.error(`Import contacts error: ${error.message}`, { stack: error.stack, userId, filePath });
    
    // Attempt to delete CSV file on error to prevent clutter
    try {
      await csvUtil.deleteCsvFile(filePath);
    } catch (err) {
      logger.warn(`Failed to delete CSV file after import error: ${err.message}`);
    }
    
    throw error;
  }
};

/**
 * Get contact count for a user
 * @param {number} userId - User ID
 * @returns {number} Contact count
 */
const getContactCount = async (userId) => {
  try {
    return await Contact.count({
      where: { userId },
    });
  } catch (error) {
    logger.error(`Get contact count error: ${error.message}`, { stack: error.stack, userId });
    throw new ApiError('Failed to get contact count', 500);
  }
};

/**
 * Bulk delete contacts
 * @param {number} userId - User ID
 * @param {Array} contactIds - Array of contact IDs to delete
 * @returns {Object} Delete results
 */
const bulkDeleteContacts = async (userId, contactIds) => {
  try {
    // Delete contacts
    const deleteResult = await Contact.destroy({
      where: {
        id: { [Op.in]: contactIds },
        userId,
      },
    });

    return {
      deleted: deleteResult,
      total: contactIds.length,
    };
  } catch (error) {
    logger.error(`Bulk delete contacts error: ${error.message}`, { stack: error.stack, userId, contactIds });
    throw new ApiError('Failed to delete contacts', 500);
  }
};

module.exports = {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  importContactsFromCsv,
  getContactCount,
  bulkDeleteContacts,
};