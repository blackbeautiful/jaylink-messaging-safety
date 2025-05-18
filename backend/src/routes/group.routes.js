const express = require('express');
const groupController = require('../controllers/group.controller');
const { authenticate } = require('../middleware/auth.middleware');
const validate = require('../middleware/validator.middleware');
const groupValidator = require('../validators/group.validator');

const router = express.Router();

/**
 * @route POST /api/groups
 * @desc Create a new group
 * @access Private
 */
router.post(
  '/',
  authenticate,
  validate(groupValidator.groupSchema),
  groupController.createGroup
);

/**
 * @route GET /api/groups
 * @desc Get all groups for a user
 * @access Private
 */
router.get(
  '/',
  authenticate,
  validate(groupValidator.listGroupsSchema, 'query'),
  groupController.getGroups
);

/**
 * @route GET /api/groups/:id
 * @desc Get a group by ID
 * @access Private
 */
router.get(
  '/:id',
  authenticate,
  groupController.getGroupById
);

/**
 * @route PUT /api/groups/:id
 * @desc Update a group
 * @access Private
 */
router.put(
  '/:id',
  authenticate,
  validate(groupValidator.groupSchema),
  groupController.updateGroup
);

/**
 * @route DELETE /api/groups/:id
 * @desc Delete a group
 * @access Private
 */
router.delete(
  '/:id',
  authenticate,
  groupController.deleteGroup
);

/**
 * @route POST /api/groups/:id/contacts
 * @desc Add contacts to a group
 * @access Private
 */
router.post(
  '/:id/contacts',
  authenticate,
  validate(groupValidator.addContactsToGroupSchema),
  groupController.addContactsToGroup
);

/**
 * @route DELETE /api/groups/:id/contacts/:contactId
 * @desc Remove a contact from a group
 * @access Private
 */
router.delete(
  '/:id/contacts/:contactId',
  authenticate,
  groupController.removeContactFromGroup
);

/**
 * @route GET /api/groups/:id/contacts
 * @desc Get contacts in a group
 * @access Private
 */
router.get(
  '/:id/contacts',
  authenticate,
  validate(groupValidator.listGroupsSchema, 'query'),
  groupController.getContactsInGroup
);

module.exports = router;