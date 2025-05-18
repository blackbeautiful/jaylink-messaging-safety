// backend/src/models/scheduled-message.model.js
/**
 * Scheduled Message model
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} DataTypes - Sequelize data types
 * @returns {Object} ScheduledMessage model
 */
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
      },
      audioUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      senderId: {
        type: DataTypes.STRING(20),
        allowNull: true,
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
      },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'sent', 'cancelled', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      errorMessage: {
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
      tableName: 'scheduled_messages',
      indexes: [
        {
          name: 'idx_user_id',
          fields: ['userId'],
        },
        {
          name: 'idx_scheduled_at',
          fields: ['scheduledAt'],
        },
        {
          name: 'idx_status',
          fields: ['status'],
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