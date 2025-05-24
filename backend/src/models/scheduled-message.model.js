// backend/src/models/scheduled-message.model.js - Enhanced model for better processing
module.exports = (sequelize, DataTypes) => {
  const ScheduledMessage = sequelize.define('ScheduledMessage', {
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
    type: {
      type: DataTypes.ENUM('sms', 'voice', 'audio'),
      allowNull: false,
      defaultValue: 'sms',
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Message content for SMS and voice messages',
    },
    audioUrl: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Audio file URL for audio messages',
    },
    senderId: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Sender ID or caller ID',
    },
    recipients: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'JSON array of recipient phone numbers',
    },
    recipientCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    scheduledAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: 'When the message should be sent',
    },
    status: {
      type: DataTypes.ENUM('pending', 'processing', 'sent', 'failed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.00,
      comment: 'Expected cost of the message',
    },
    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Error message if processing failed',
    },
    processedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the message was actually processed',
    },
    cancelledAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When the message was cancelled',
    },
    retryCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of times processing was attempted',
    },
    maxRetries: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
      comment: 'Maximum number of retry attempts',
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
    tableName: 'scheduled_messages',
    indexes: [
      {
        name: 'idx_scheduled_user_id',
        fields: ['userId'],
      },
      {
        name: 'idx_scheduled_status',
        fields: ['status'],
      },
      {
        name: 'idx_scheduled_at',
        fields: ['scheduledAt'],
      },
      {
        name: 'idx_scheduled_processing', // Composite index for processing queries
        fields: ['status', 'scheduledAt'],
      },
      {
        name: 'idx_scheduled_type',
        fields: ['type'],
      },
      {
        name: 'idx_scheduled_created_at',
        fields: ['createdAt'],
      },
    ],
  });

  // Define associations
  ScheduledMessage.associate = (models) => {
    if (models.User) {
      ScheduledMessage.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
      });
    }
  };

  return ScheduledMessage;
};