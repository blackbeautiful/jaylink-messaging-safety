/**
 * Message model
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} DataTypes - Sequelize data types
 * @returns {Object} Message model
 */
module.exports = (sequelize, DataTypes) => {
    const Message = sequelize.define('Message', {
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
      messageId: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      type: {
        type: DataTypes.ENUM('sms', 'voice', 'audio'),
        allowNull: false,
        defaultValue: 'sms',
      },
      content: {
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
      cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      status: {
        type: DataTypes.ENUM('queued', 'sent', 'delivered', 'failed'),
        allowNull: false,
        defaultValue: 'queued',
      },
      scheduled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      scheduledAt: {
        type: DataTypes.DATE,
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
      tableName: 'messages',
      indexes: [
        {
          name: 'idx_user_id',
          fields: ['userId'],
        },
        {
          name: 'idx_message_id',
          fields: ['messageId'],
        },
        {
          name: 'idx_status',
          fields: ['status'],
        },
        {
          name: 'idx_created_at',
          fields: ['createdAt'],
        },
        {
          name: 'idx_type',
          fields: ['type'],
        },
      ],
    });
  
    // Define associations
    Message.associate = (models) => {
      if (models.User) {
        Message.belongsTo(models.User, {
          foreignKey: 'userId',
          as: 'user',
          onDelete: 'CASCADE',
        });
      }
    };
  
    return Message;
  };