// backend/src/models/system-setting.model.js
/**
 * SystemSetting model
 * @param {Object} sequelize - Sequelize instance
 * @param {Object} DataTypes - Sequelize data types
 * @returns {Object} SystemSetting model
 */
module.exports = (sequelize, DataTypes) => {
  const SystemSetting = sequelize.define('SystemSetting', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    settingKey: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    settingValue: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    description: {
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
    tableName: 'system_settings',
    indexes: [
      {
        name: 'idx_setting_key',
        unique: true,
        fields: ['settingKey'],
      },
    ],
  });

  return SystemSetting;
};