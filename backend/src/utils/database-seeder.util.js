const bcrypt = require('bcrypt');
const db = require('../models');
const config = require('../config/config');
const logger = require('../config/logger');

/**
 * Initialize database with default data
 */
const initializeDatabase = async () => {
  try {
    logger.info('Starting database initialization...');

    // Check if default admin user exists
    const adminExists = await db.User.findOne({
      where: { email: 'admin@jaylink.com' }
    });

    if (!adminExists) {
      logger.info('Creating default admin user...');
      
      // Hash password
      const salt = await bcrypt.genSalt(parseInt(config.auth.saltRounds, 10));
      const hashedPassword = await bcrypt.hash('admin123', salt);
      
      // Create admin user
      await db.User.create({
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@jaylink.com',
        password: hashedPassword,
        role: 'admin',
        status: 'active',
        balance: 100.00, // Initial balance for testing
      });
      
      logger.info('Default admin user created successfully');
    } else {
      logger.info('Default admin user already exists, skipping creation');
    }

    // Initialize service costs if they don't exist
    const serviceCostsCount = await db.ServiceCost.count(); // Fixed variable name

    if (serviceCostsCount === 0) {
      logger.info('Initializing default service costs...');

      const defaultServiceCosts = [
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
          cost: 0.1,
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
          description: 'Cost per audio message delivery',
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
      ];

      await db.ServiceCost.bulkCreate(defaultServiceCosts);
      logger.info('Default service costs initialized successfully');
    } else {
      logger.info('Service costs already exist, skipping creation');
    }

    // Initialize system settings if they don't exist
    const systemSettingsCount = await db.SystemSetting.count();

    if (systemSettingsCount === 0) {
      logger.info('Initializing system settings...');
      
      const defaultSystemSettings = [
        {
          settingKey: 'minimumBalanceThreshold',
          settingValue: '10.00',
          description: 'Minimum balance threshold for alerts',
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
          description: 'Maximum contacts per CSV import',
        },
        {
          settingKey: 'maintenanceMode',
          settingValue: 'false',
          description: 'System maintenance mode',
        },
      ];
      
      await db.SystemSetting.bulkCreate(defaultSystemSettings);
      logger.info('System settings initialized successfully');
    } else {
      logger.info('System settings already exist, skipping creation');
    }

    // Create demo user for testing if it doesn't exist
    const demoUserExists = await db.User.findOne({
      where: { email: 'demo@jaylink.com' }
    });

    if (!demoUserExists && config.env === 'development') {
      logger.info('Creating demo user for testing...');
      
      // Hash password
      const salt = await bcrypt.genSalt(parseInt(config.auth.saltRounds, 10));
      const hashedPassword = await bcrypt.hash('@Demo123', salt);
      
      // Create demo user
      const demoUser = await db.User.create({
        firstName: 'Demo',
        lastName: 'User',
        email: 'demo@jaylink.com',
        password: hashedPassword,
        company: 'Demo Company',
        phone: '+1234567890',
        role: 'user',
        status: 'active',
        balance: 80.00, // Initial balance for testing
      });
      
      // Create demo contacts for testing
      if (demoUser) {
        const demoContacts = [
          {
            userId: demoUser.id,
            name: 'John Smith',
            phone: '+1 (555) 123-4567',
            email: 'john.smith@example.com',
          },
          {
            userId: demoUser.id,
            name: 'Sarah Johnson',
            phone: '+1 (555) 987-6543',
            email: 'sarah.j@example.com',
          },
          {
            userId: demoUser.id,
            name: 'Michael Brown',
            phone: '+1 (555) 456-7890',
            email: 'michael.b@example.com',
          },
          {
            userId: demoUser.id,
            name: 'Emily Davis',
            phone: '+1 (555) 321-7654',
            email: 'emily.d@example.com',
          },
          {
            userId: demoUser.id,
            name: 'David Wilson',
            phone: '+1 (555) 111-2222',
            email: 'david.w@example.com',
          },
        ];
        
        await db.Contact.bulkCreate(demoContacts);
        
        // Create demo groups
        const demoGroups = [
          {
            userId: demoUser.id,
            name: 'Customers',
            description: 'Regular customers',
          },
          {
            userId: demoUser.id,
            name: 'Employees',
            description: 'Company staff',
          },
          {
            userId: demoUser.id,
            name: 'Vendors',
            description: 'Service providers',
          },
        ];
        
        const createdGroups = await db.Group.bulkCreate(demoGroups);
        
        // Add contacts to groups for testing
        const groupContacts = [
          {
            groupId: createdGroups[0].id, // Customers group
            contactId: 1, // John Smith
          },
          {
            groupId: createdGroups[0].id, // Customers group
            contactId: 2, // Sarah Johnson
          },
          {
            groupId: createdGroups[1].id, // Employees group
            contactId: 3, // Michael Brown
          },
          {
            groupId: createdGroups[1].id, // Employees group
            contactId: 4, // Emily Davis
          },
          {
            groupId: createdGroups[2].id, // Vendors group
            contactId: 5, // David Wilson
          },
        ];
        
        await db.GroupContact.bulkCreate(groupContacts);
        
        logger.info('Demo user, contacts, and groups created successfully');
      }
    }

    logger.info('Database initialization completed successfully');
  } catch (error) {
    logger.error(`Database initialization error: ${error.message}`, { stack: error.stack });
    throw error;
  }
};

module.exports = initializeDatabase;