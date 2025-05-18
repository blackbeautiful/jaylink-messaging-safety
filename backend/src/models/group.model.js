// backend/src/models/group.model.js
/**
 * Group model
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} DataTypes - Sequelize data types
 * @returns {Object} Group model
 */
module.exports = (sequelize, DataTypes) => {
    const Group = sequelize.define('Group', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [2, 100],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }, {
      tableName: 'groups',
      indexes: [
        {
          name: 'idx_user_id',
          fields: ['userId'],
        },
      ],
    });
  
    // Define associations
    Group.associate = (models) => {
      if (models.User) {
        Group.belongsTo(models.User, {
          foreignKey: 'userId',
          as: 'user',
          onDelete: 'CASCADE',
        });
      }
      
      if (models.Contact) {
        Group.belongsToMany(models.Contact, {
          through: 'group_contacts',
          foreignKey: 'groupId',
          otherKey: 'contactId',
          as: 'contacts',
        });
      }
    };
  
    return Group;
  };