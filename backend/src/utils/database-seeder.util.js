// backend/src/utils/database-seeder.util.js
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
    const servicesCostCount = await ServiceCost.count();

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

      await ServiceCost.bulkCreate(defaultServiceCosts);
      logger.info('Default service costs initialized successfully');
    } else {
      logger.info('Service costs already exist, skipping creation');
    }

    // Initialize system settings if they don't exist
    const systemSettings = await db.Setting.findOne({
      where: { userId: null, category: 'system' }
    });

    if (!systemSettings) {
      logger.info('Initializing system settings...');
      
      await db.Setting.create({
        userId: null,
        category: 'system',
        settings: {
          minimumBalanceThreshold: 10.00,
          defaultMessageExpiry: 7, // days
          maximumRecipientsPerBatch: 1000,
          csvImportLimit: 5000,
          maintenanceMode: false,
        },
      });
      
      logger.info('System settings initialized successfully');
    }

    // Create demo user for testing if it doesn't exist
    const demoUserExists = await db.User.findOne({
      where: { email: 'demo@jaylink.com' }
    });

    if (!demoUserExists && config.env === 'development') {
      logger.info('Creating demo user for testing...');
      
      // Hash password
      const salt = await bcrypt.genSalt(parseInt(config.auth.saltRounds, 10));
      const hashedPassword = await bcrypt.hash('demo123', salt);
      
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
        balance: 50.00, // Initial balance for testing
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