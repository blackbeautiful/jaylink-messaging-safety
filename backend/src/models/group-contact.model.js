// backend/src/models/group-contact.model.js - Fixed version without auto ID
/**
 * Group-Contact junction model for many-to-many relationship
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} DataTypes - Sequelize data types
 * @returns {Object} GroupContact model
 */
module.exports = (sequelize, DataTypes) => {
  const GroupContact = sequelize.define('GroupContact', {
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true, // Part of composite primary key
      references: {
        model: 'groups',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    contactId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true, // Part of composite primary key
      references: {
        model: 'contacts',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      allowNull: false,
    },
  }, {
    tableName: 'group_contacts',
    timestamps: true,
    updatedAt: false, // Only track creation time
    // Composite primary key
    indexes: [
      {
        unique: true,
        fields: ['groupId', 'contactId'],
        name: 'group_contact_unique',
      },
      {
        fields: ['groupId'],
        name: 'idx_group_contacts_group_id',
      },
      {
        fields: ['contactId'],
        name: 'idx_group_contacts_contact_id',
      },
    ],
    // Disable auto ID generation
    id: false,
  });

  // Define associations
  GroupContact.associate = (models) => {
    if (models.Group) {
      GroupContact.belongsTo(models.Group, {
        foreignKey: 'groupId',
        as: 'group',
        onDelete: 'CASCADE',
      });
    }
    
    if (models.Contact) {
      GroupContact.belongsTo(models.Contact, {
        foreignKey: 'contactId',
        as: 'contact',
        onDelete: 'CASCADE',
      });
    }
  };

  return GroupContact;
};