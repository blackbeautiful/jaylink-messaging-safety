// backend/src/models/device-token.model.js
module.exports = (sequelize, DataTypes) => {
    const DeviceToken = sequelize.define('DeviceToken', {
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
        type: DataTypes.STRING(512),
        allowNull: false,
        comment: 'FCM or other push notification token'
      },
      deviceType: {
        type: DataTypes.ENUM('android', 'ios', 'web', 'other'),
        allowNull: false,
        defaultValue: 'web',
      },
      deviceInfo: {
        type: DataTypes.JSON,
        allowNull: true,
        comment: 'Additional device information'
      },
      active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: 'Whether this token is still active'
      },
      lastUsed: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'Last time this token was used to send a notification'
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
      tableName: 'device_tokens',
      indexes: [
        {
          name: 'idx_user_id',
          fields: ['userId'],
        },
        {
          name: 'idx_token',
          fields: ['token'],
        },
        {
          name: 'idx_active',
          fields: ['active'],
        },
      ],
    });
  
    // Define associations
    DeviceToken.associate = (models) => {
      DeviceToken.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
      });
    };
  
    return DeviceToken;
  };