// backend/src/models/user.model.js
/**
 * User model
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} DataTypes - Sequelize data types
 * @returns {Object} User model
 */
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50],
      },
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 50],
      },
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    company: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user',
    },
    status: {
      type: DataTypes.ENUM('active', 'suspended', 'inactive'),
      defaultValue: 'active',
    },
    balance: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.00,
    },
    resetToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetTokenExpiry: {
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
    tableName: 'users',
    indexes: [
      {
        name: 'idx_email',
        fields: ['email'],
      },
      {
        name: 'idx_status',
        fields: ['status'],
      },
    ],
  });

  // Define associations - modified to handle missing models gracefully
  User.associate = (models) => {
    // Only add associations for models that exist
    if (models.Contact) {
      User.hasMany(models.Contact, {
        foreignKey: 'userId',
        as: 'contacts',
        onDelete: 'CASCADE',
      });
    }

    if (models.Group) {
      User.hasMany(models.Group, {
        foreignKey: 'userId',
        as: 'groups',
        onDelete: 'CASCADE',
      });
    }

    if (models.Message) {
      User.hasMany(models.Message, {
        foreignKey: 'userId',
        as: 'messages',
        onDelete: 'CASCADE',
      });
    }

    if (models.ScheduledMessage) {
      User.hasMany(models.ScheduledMessage, {
        foreignKey: 'userId',
        as: 'scheduledMessages',
        onDelete: 'CASCADE',
      });
    }

    if (models.AudioFile) {
      User.hasMany(models.AudioFile, {
        foreignKey: 'userId',
        as: 'audioFiles',
        onDelete: 'CASCADE',
      });
    }

    if (models.Transaction) {
      User.hasMany(models.Transaction, {
        foreignKey: 'userId',
        as: 'transactions',
        onDelete: 'CASCADE',
      });
    }

    if (models.Notification) {
      User.hasMany(models.Notification, {
        foreignKey: 'userId',
        as: 'notifications',
        onDelete: 'CASCADE',
      });
    }

    if (models.Setting) {
      User.hasMany(models.Setting, {
        foreignKey: 'userId',
        as: 'settings',
        onDelete: 'CASCADE',
      });
    }

    if (models.SupportTicket) {
      User.hasMany(models.SupportTicket, {
        foreignKey: 'userId',
        as: 'supportTickets',
        onDelete: 'CASCADE',
      });
    }

    if (models.UserSession) {
      User.hasMany(models.UserSession, {
        foreignKey: 'userId',
        as: 'sessions',
        onDelete: 'CASCADE',
      });
    }
  };

  return User;
};