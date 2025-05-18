const express = require('express');
const contactController = require('../controllers/contact.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { csvUploadMiddleware } = require('../middleware/upload.middleware');
const validate = require('../middleware/validator.middleware');
const contactValidator = require('../validators/contact.validator');

const router = express.Router();

/**
 * @route POST /api/contacts
 * @desc Create a new contact
 * @access Private
 */
router.post(
  '/',
  authenticate,
  validate(contactValidator.contactSchema),
  contactController.createContact
);

/**
 * @route GET /api/contacts
 * @desc Get all contacts for a user
 * @access Private
 */
router.get(
  '/',
  authenticate,
  validate(contactValidator.listContactsSchema, 'query'),
  contactController.getContacts
);

/**
 * @route GET /api/contacts/:id
 * @desc Get a contact by ID
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  contactController.getContactById
);

/**
 * @route PUT /api/contacts/:id
 * @desc Update a contact
 * @access Private
 */
router.put(
  '/:id',
  authenticate,
  validate(contactValidator.contactSchema),
  contactController.updateContact
);

/**
 * @route DELETE /api/contacts/:id
 * @desc Delete a contact
 * @access Private
 */
router.delete(
  '/:id',
  authenticate,
  contactController.deleteContact
);

/**
 * @route POST /api/contacts/import
 * @desc Import contacts from CSV
 * @access Private
 */
router.post(
  '/import',
  authenticate,
  csvUploadMiddleware,
  validate(contactValidator.importContactsSchema, 'body'),
  contactController.importContacts
);

/**
 * @route POST /api/contacts/bulk-delete
 * @desc Bulk delete contacts
 * @access Private
 */
router.post(
  '/bulk-delete',
  authenticate,
  validate(contactValidator.bulkDeleteContactsSchema),
  contactController.bulkDeleteContacts
);

module.exports = router;