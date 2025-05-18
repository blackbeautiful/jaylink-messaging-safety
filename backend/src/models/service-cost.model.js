// backend/src/models/service-cost.model.js
/**
 * ServiceCost model
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} DataTypes - Sequelize data types
 * @returns {Object} ServiceCost model
 */
module.exports = (sequelize, DataTypes) => {
  const ServiceCost = sequelize.define('ServiceCost', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true, // Added unique constraint
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    cost: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
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
    tableName: 'service_costs',
    indexes: [
      {
        name: 'idx_active',
        fields: ['active'],
      },
      {
        name: 'idx_name',
        fields: ['name'],
      },
    ],
  });

  return ServiceCost;
};