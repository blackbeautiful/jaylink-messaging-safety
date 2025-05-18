'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('scheduled_messages', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      type: {
        type: Sequelize.ENUM('sms', 'voice', 'audio'),
        allowNull: false,
        defaultValue: 'sms',
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      audioUrl: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      senderId: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      recipients: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'JSON array of recipient phone numbers',
      },
      recipientCount: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      scheduledAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('pending', 'processing', 'sent', 'cancelled', 'failed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      errorMessage: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW,
      },
    });

    await queryInterface.addIndex('scheduled_messages', ['userId'], { name: 'idx_user_id' });
    await queryInterface.addIndex('scheduled_messages', ['scheduledAt'], { name: 'idx_scheduled_at' });
    await queryInterface.addIndex('scheduled_messages', ['status'], { name: 'idx_status' });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('scheduled_messages');
  }
};