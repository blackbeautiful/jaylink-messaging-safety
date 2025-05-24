// backend/src/models/group-contact.model.js - Fixed version
/**
 * Group-Contact junction model
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} DataTypes - Sequelize data types
 * @returns {Object} GroupContact model
 */
module.exports = (sequelize, DataTypes) => {
  const GroupContact = sequelize.define('GroupContact', {
    // Removed the explicit id field - let Sequelize handle it automatically
    groupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'groups',
        key: 'id',
      },
    },
    contactId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'contacts',
        key: 'id',
      },
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'group_contacts',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: 'idx_group_id',
        fields: ['groupId'],
      },
      {
        name: 'idx_contact_id',
        fields: ['contactId'],
      },
      {
        unique: true,
        fields: ['groupId', 'contactId'],
        name: 'unique_group_contact',
      },
    ],
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