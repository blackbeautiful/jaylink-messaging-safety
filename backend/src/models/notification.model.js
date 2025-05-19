// backend/src/models/notification.model.js
module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('info', 'success', 'warning', 'error'),
      defaultValue: 'info',
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON string of additional notification metadata',
      get() {
        const rawValue = this.getDataValue('metadata');
        if (rawValue) {
          try {
            return JSON.parse(rawValue);
          } catch (e) {
            return {};
          }
        }
        return {};
      },
      set(value) {
        if (value) {
          this.setDataValue('metadata', JSON.stringify(value));
        } else {
          this.setDataValue('metadata', null);
        }
      }
    },
    pushStatus: {
      type: DataTypes.ENUM('pending', 'sent', 'failed', 'not_applicable'),
      defaultValue: 'not_applicable',
      comment: 'Status of push notification delivery'
    },
    emailStatus: {
      type: DataTypes.ENUM('pending', 'sent', 'failed', 'not_applicable'),
      defaultValue: 'not_applicable',
      comment: 'Status of email notification delivery'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'notifications',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: 'idx_user_id',
        fields: ['userId'],
      },
      {
        name: 'idx_read',
        fields: ['read'],
      },
      {
        name: 'idx_type',
        fields: ['type'],
      },
      {
        name: 'idx_created_at',
        fields: ['createdAt'],
      },
    ],
  });

  // Define associations
  Notification.associate = (models) => {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
    });
  };

  return Notification;
};