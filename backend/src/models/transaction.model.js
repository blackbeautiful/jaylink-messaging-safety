// backend/src/models/transaction.model.js
/**
 * Transaction model
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} DataTypes - Sequelize data types
 * @returns {Object} Transaction model
 */
module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
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
    transactionId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true, // Added unique constraint for transaction ID
    },
    type: {
      type: DataTypes.ENUM('credit', 'debit'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    balanceAfter: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    service: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('completed', 'pending', 'failed'),
      allowNull: false,
      defaultValue: 'completed',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'transactions',
    timestamps: true,
    updatedAt: false,
    indexes: [
      {
        name: 'idx_user_id',
        fields: ['userId'],
      },
      {
        name: 'idx_transaction_id',
        fields: ['transactionId'],
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
  Transaction.associate = (models) => {
    if (models.User) {
      Transaction.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
      });
    }
  };

  return Transaction;
};