/**
 * Contact model
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} DataTypes - Sequelize data types
 * @returns {Object} Contact model
 */
module.exports = (sequelize, DataTypes) => {
    const Contact = sequelize.define('Contact', {
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
      phone: {
        type: DataTypes.STRING(20),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
          isEmail: true,
        },
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
      tableName: 'contacts',
      indexes: [
        {
          name: 'idx_user_id',
          fields: ['userId'],
        },
        {
          name: 'idx_phone',
          fields: ['phone'],
        },
      ],
    });
  
    // Define associations
    Contact.associate = (models) => {
      if (models.User) {
        Contact.belongsTo(models.User, {
          foreignKey: 'userId',
          as: 'user',
          onDelete: 'CASCADE',
        });
      }
      
      if (models.Group) {
        Contact.belongsToMany(models.Group, {
          through: 'group_contacts',
          foreignKey: 'contactId',
          otherKey: 'groupId',
          as: 'groups',
        });
      }
    };
  
    return Contact;
  };