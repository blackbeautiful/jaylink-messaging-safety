// backend/src/models/setting.model.js
/**
 * Setting model
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} DataTypes - Sequelize data types
 * @returns {Object} Setting model
 */
module.exports = (sequelize, DataTypes) => {
    const Setting = sequelize.define('Setting', {
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
      category: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      settings: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: {},
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
      tableName: 'settings',
      indexes: [
        {
          name: 'idx_user_id',
          fields: ['userId'],
        },
        {
          name: 'unique_user_category',
          unique: true,
          fields: ['userId', 'category'],
        },
      ],
    });
  
    // Define associations
    Setting.associate = (models) => {
      Setting.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user',
        onDelete: 'CASCADE',
      });
    };
  
    return Setting;
  };