const contactService = require('../services/contact.service');
const response = require('../utils/response.util');
const logger = require('../config/logger');

/**
 * Create a new contact
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const createContact = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const contactData = req.body;
    
    const contact = await contactService.createContact(userId, contactData);
    
    return response.success(res, { contact }, 'Contact created successfully', 201);
  } catch (error) {
    logger.error(`Create contact controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get all contacts for a user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getContacts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { search, page, limit } = req.query;
    
    const result = await contactService.getContacts(userId, { search, page, limit });
    
    return response.success(res, result, 'Contacts retrieved successfully');
  } catch (error) {
    logger.error(`Get contacts controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Get a contact by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const getContactById = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const contactId = req.params.id;
    
    const contact = await contactService.getContactById(userId, contactId);
    
    return response.success(res, { contact }, 'Contact retrieved successfully');
  } catch (error) {
    logger.error(`Get contact by ID controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Update a contact
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const updateContact = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const contactId = req.params.id;
    const contactData = req.body;
    
    const contact = await contactService.updateContact(userId, contactId, contactData);
    
    return response.success(res, { contact }, 'Contact updated successfully');
  } catch (error) {
    logger.error(`Update contact controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Delete a contact
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const deleteContact = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const contactId = req.params.id;
    
    await contactService.deleteContact(userId, contactId);
    
    return response.success(res, { success: true }, 'Contact deleted successfully');
  } catch (error) {
    logger.error(`Delete contact controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Import contacts from CSV
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const importContacts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const filePath = req.file.path;
    const { replaceAll } = req.body;
    
    const result = await contactService.importContactsFromCsv(userId, filePath, replaceAll === 'true');
    
    return response.success(res, result, 'Contacts imported successfully');
  } catch (error) {
    logger.error(`Import contacts controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

/**
 * Bulk delete contacts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const bulkDeleteContacts = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { contactIds } = req.body;
    
    const result = await contactService.bulkDeleteContacts(userId, contactIds);
    
    return response.success(res, result, 'Contacts deleted successfully');
  } catch (error) {
    logger.error(`Bulk delete contacts controller error: ${error.message}`, { stack: error.stack });
    next(error);
  }
};

module.exports = {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  importContacts,
  bulkDeleteContacts,
};