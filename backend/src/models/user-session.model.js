/**
 * UserSession model
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} DataTypes - Sequelize data types
 * @returns {Object} UserSession model
 */
module.exports = (sequelize, DataTypes) => {
    const UserSession = sequelize.define('UserSession', {
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
      token: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      ipAddress: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    }, {
      tableName: 'user_sessions',
      timestamps: true,
      updatedAt: false,
      indexes: [
        {
          name: 'idx_user_id',
          fields: ['userId'],
        },
        {
          name: 'idx_token',
          fields: ['token'],
        },
      ],
    });
  
    // Define associations
    UserSession.associate = (models) => {
      UserSession.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
      });
    };
  
    return UserSession;
  };