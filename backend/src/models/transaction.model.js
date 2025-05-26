// backend/src/models/transaction.model.js - SIMPLIFIED FOR MIGRATIONS
/**
 * Transaction model - Simplified version that works with migrations
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
      unique: true,
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
  }, {
    tableName: 'transactions',
    timestamps: true, // This enables createdAt and updatedAt
    
    // Remove complex indexes - let migrations handle them
    indexes: [
      {
        name: 'idx_user_id',
        fields: ['userId'],
      },
      {
        name: 'idx_transaction_id',
        fields: ['transactionId'],
        unique: true
      },
      {
        name: 'idx_created_at',
        fields: ['createdAt'],
      }
    ],
    
    // Basic validation only
    validate: {
      positiveAmount() {
        if (this.amount <= 0) {
          throw new Error('Transaction amount must be greater than zero');
        }
      }
    }
  });

  // Define associations
  Transaction.associate = (models) => {
    if (models.User) {
      Transaction.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      });
    }
  };

  // Add useful instance methods
  Transaction.prototype.toSafeJSON = function() {
    const transaction = this.toJSON();
    
    // Add formatted amounts
    transaction.formattedAmount = `₦${parseFloat(transaction.amount).toFixed(2)}`;
    transaction.formattedBalance = `₦${parseFloat(transaction.balanceAfter).toFixed(2)}`;
    
    return transaction;
  };

  // Add useful class methods
  Transaction.findByUserId = async function(userId, options = {}) {
    return this.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
      ...options
    });
  };
  
  Transaction.findByTransactionId = async function(transactionId) {
    return this.findOne({
      where: { transactionId }
    });
  };

  return Transaction;
};