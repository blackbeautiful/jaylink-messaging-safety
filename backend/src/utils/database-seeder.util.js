const bcrypt = require('bcrypt');
const db = require('../models');
const config = require('../config/config');
const logger = require('../config/logger');

const User = db.User;
const ServiceCost = db.ServiceCost;
const SystemSetting = db.SystemSetting;

/**
 * Initialize database with default data
 */
const initializeDatabase = async () => {
  try {
    logger.info('Starting database initialization...');

    // Create admin user if not exists
    const adminExists = await User.findOne({
      where: { email: 'admin@jaylink.com' },
    });

    if (!adminExists) {
      logger.info('Creating admin user...');
      const salt = await bcrypt.genSalt(parseInt(config.auth.saltRounds, 10));
      const hashedPassword = await bcrypt.hash('admin123', salt);

      await User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@jaylink.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        balance: 1000.00, // Give admin some initial balance
      });
      logger.info('Admin user created successfully');
    } else {
      logger.info('Admin user already exists, skipping creation');
    }

    // Create service costs if not exists
    const servicesCostCount = await ServiceCost.count();
    
    if (servicesCostCount === 0) {
      logger.info('Creating default service costs...');
      await ServiceCost.bulkCreate([
        {
          name: 'SMS Message',
          description: 'Cost per SMS message',
          cost: 0.03,
          unit: 'per message',
          active: true,
        },
        {
          name: 'Voice Call',
          description: 'Cost per minute of voice call',
          cost: 0.10,
          unit: 'per minute',
          active: true,
        },
        {
          name: 'Text-to-Speech',
          description: 'Cost per text-to-speech request',
          cost: 0.05,
          unit: 'per request',
          active: true,
        },
        {
          name: 'Audio Message',
          description: 'Cost per audio message',
          cost: 0.05,
          unit: 'per message',
          active: true,
        },
        {
          name: 'Audio Storage',
          description: 'Cost for storing audio files',
          cost: 0.01,
          unit: 'per MB per month',
          active: true,
        },
      ]);
      logger.info('Default service costs created successfully');
    } else {
      logger.info('Service costs already exist, skipping creation');
    }

    // Create system settings if not exists
    const systemSettingsCount = await SystemSetting.count();
    
    if (systemSettingsCount === 0) {
      logger.info('Creating default system settings...');
      await SystemSetting.bulkCreate([
        {
          settingKey: 'minimumBalanceThreshold',
          settingValue: '10',
          description: 'Minimum balance threshold for alert in USD',
        },
        {
          settingKey: 'defaultMessageExpiry',
          settingValue: '7',
          description: 'Default message expiry in days',
        },
        {
          settingKey: 'maximumRecipientsPerBatch',
          settingValue: '1000',
          description: 'Maximum recipients per batch',
        },
        {
          settingKey: 'csvImportLimit',
          settingValue: '5000',
          description: 'Maximum contacts in CSV import',
        },
        {
          settingKey: 'maintenanceMode',
          settingValue: 'false',
          description: 'System maintenance mode',
        },
      ]);
      logger.info('Default system settings created successfully');
    } else {
      logger.info('System settings already exist, skipping creation');
    }

    logger.info('Database initialization completed successfully');
  } catch (error) {
    logger.error(`Database initialization error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

module.exports = initializeDatabase;