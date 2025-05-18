'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Drop the old table if it exists
    await queryInterface.dropTable('group_contacts', { force: true });

    // Create the new table with the correct schema
    await queryInterface.createTable('group_contacts', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      groupId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'groups',
          key: 'id',
        },
      },
      contactId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'contacts',
          key: 'id',
        },
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('group_contacts', ['groupId'], { name: 'idx_group_id' });
    await queryInterface.addIndex('group_contacts', ['contactId'], { name: 'idx_contact_id' });
    await queryInterface.addIndex('group_contacts', ['groupId', 'contactId'], {
      name: 'unique_group_contact',
      unique: true,
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('group_contacts');
  },
};
