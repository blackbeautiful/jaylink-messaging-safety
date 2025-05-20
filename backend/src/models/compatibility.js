// backend/src/models/compatibility.js
/**
 * Compatibility layer for models and Sequelize
 * This helps avoid errors with missing models and different Sequelize versions
 */
const logger = require('../config/logger');

/**
 * Apply compatibility patches to models and Sequelize
 * @param {Object} db - Database object with models and Sequelize
 */
const applyCompatibilityPatches = (db) => {
  try {
    logger.info('Applying compatibility patches to models and Sequelize');
    
    // Ensure all required models exist
    const requiredModels = [
      'User', 'Contact', 'Group', 'GroupContact',
      'Message', 'ScheduledMessage', 'Transaction',
      'Notification', 'Setting', 'SystemSetting',
      'DeviceToken', 'ServiceCost'
    ];
    
    // Create empty models for any missing required models
    // This prevents errors when associations reference missing models
    requiredModels.forEach(modelName => {
      if (!db[modelName]) {
        logger.warn(`Creating stub model for missing model: ${modelName}`);
        
        // Create a minimal stub model that won't crash when referenced
        db[modelName] = {
          tableName: modelName.toLowerCase() + 's',
          rawAttributes: { id: { type: db.Sequelize.DataTypes.INTEGER } },
          
          // Stub methods that might be called
          findOne: async () => null,
          findAll: async () => [],
          findByPk: async () => null,
          count: async () => 0,
          
          // Prevent issues with associations
          belongsTo: () => {},
          hasMany: () => {},
          hasOne: () => {},
          belongsToMany: () => {}
        };
      }
    });
    
    // Check for and handle older Sequelize versions
    if (db.sequelize && !db.sequelize.beforeSync) {
      // Older Sequelize version - patch as needed
      logger.info('Detected older Sequelize version, applying compatibility patches');
    }
    
    // Fix Error: this.model.bulkBuild is not a function
    // This happens in some Sequelize versions when using Model.findOne()
    const modelsWithFindOneIssue = Object.keys(db).filter(key => 
      typeof db[key] === 'object' && 
      key !== 'sequelize' && 
      key !== 'Sequelize' && 
      typeof db[key].findOne === 'function' &&
      !db[key].bulkBuild
    );
    
    modelsWithFindOneIssue.forEach(modelName => {
      const model = db[modelName];
      
      // Add bulkBuild method if missing
      if (!model.bulkBuild && model.build) {
        model.bulkBuild = function(instances) {
          return Array.isArray(instances) 
            ? instances.map(instance => this.build(instance))
            : [];
        };
        
        logger.debug(`Added bulkBuild compatibility method to model: ${modelName}`);
      }
    });
    
    logger.info('Compatibility patches applied successfully');
  } catch (error) {
    logger.error(`Failed to apply compatibility patches: ${error.message}`, { stack: error.stack });
    // Continue anyway - not critical
  }
};

module.exports = {
  applyCompatibilityPatches
};