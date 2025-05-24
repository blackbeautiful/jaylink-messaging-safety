'use strict';

const migrationLogger = require('../utils/migration-logger');

module.exports = {
  async up(queryInterface, Sequelize) {
    migrationLogger.log('Starting migration: fix-group-contacts-table');
    
    try {
      await queryInterface.sequelize.transaction(async (transaction) => {
        // Check if table exists
        const tableExists = await queryInterface.showAllTables()
          .then(tables => tables.includes('group_contacts'));
        
        if (!tableExists) {
          migrationLogger.log('Creating group_contacts table from scratch');
          
          // Create the table with proper structure
          await queryInterface.createTable('group_contacts', {
            groupId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              primaryKey: true,
              references: {
                model: 'groups',
                key: 'id',
              },
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE',
            },
            contactId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              primaryKey: true,
              references: {
                model: 'contacts',
                key: 'id',
              },
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE',
            },
            createdAt: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            }
          }, { 
            transaction,
            // Composite primary key
            uniqueKeys: {
              group_contact_unique: {
                fields: ['groupId', 'contactId']
              }
            }
          });
          
          migrationLogger.log('group_contacts table created successfully');
        } else {
          migrationLogger.log('group_contacts table exists, checking structure');
          
          // Get table description
          const tableDescription = await queryInterface.describeTable('group_contacts', { transaction });
          
          // Check if there's an auto-increment id column that shouldn't be there
          if (tableDescription.id && tableDescription.id.autoIncrement) {
            migrationLogger.log('Detected problematic auto-increment id column, recreating table');
            
            // Backup existing data
            const existingData = await queryInterface.sequelize.query(
              'SELECT groupId, contactId, createdAt FROM group_contacts',
              { 
                type: Sequelize.QueryTypes.SELECT,
                transaction 
              }
            );
            
            migrationLogger.log(`Backing up ${existingData.length} existing records`);
            
            // Drop the existing table
            await queryInterface.dropTable('group_contacts', { transaction });
            
            // Recreate with correct structure
            await queryInterface.createTable('group_contacts', {
              groupId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                references: {
                  model: 'groups',
                  key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
              },
              contactId: {
                type: Sequelize.INTEGER,
                allowNull: false,
                primaryKey: true,
                references: {
                  model: 'contacts',
                  key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
              },
              createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
              }
            }, { 
              transaction,
              uniqueKeys: {
                group_contact_unique: {
                  fields: ['groupId', 'contactId']
                }
              }
            });
            
            // Restore data if any existed
            if (existingData.length > 0) {
              migrationLogger.log(`Restoring ${existingData.length} records`);
              
              // Insert data back, avoiding duplicates
              const uniqueData = existingData.filter((item, index, self) => 
                index === self.findIndex(t => t.groupId === item.groupId && t.contactId === item.contactId)
              );
              
              if (uniqueData.length > 0) {
                await queryInterface.bulkInsert('group_contacts', uniqueData, { transaction });
                migrationLogger.log(`Successfully restored ${uniqueData.length} unique records`);
              }
            }
            
            migrationLogger.log('group_contacts table recreated successfully');
          } else {
            migrationLogger.log('group_contacts table structure is correct, no changes needed');
          }
        }
        
        // Ensure proper indexes exist
        try {
          // Add index on groupId if it doesn't exist
          await queryInterface.addIndex('group_contacts', ['groupId'], {
            name: 'idx_group_contacts_group_id',
            transaction
          });
        } catch (error) {
          if (!error.message.includes('already exists')) {
            migrationLogger.warn(`Could not add groupId index: ${error.message}`);
          }
        }
        
        try {
          // Add index on contactId if it doesn't exist
          await queryInterface.addIndex('group_contacts', ['contactId'], {
            name: 'idx_group_contacts_contact_id',
            transaction
          });
        } catch (error) {
          if (!error.message.includes('already exists')) {
            migrationLogger.warn(`Could not add contactId index: ${error.message}`);
          }
        }
      });
      
      migrationLogger.log('Migration completed successfully');
      return Promise.resolve();
    } catch (error) {
      migrationLogger.error(`Migration failed: ${error.message}`);
      return Promise.reject(error);
    }
  },

  async down(queryInterface, Sequelize) {
    migrationLogger.log('Rolling back migration: fix-group-contacts-table');
    
    try {
      // This is a destructive rollback - be careful in production
      await queryInterface.dropTable('group_contacts');
      migrationLogger.log('group_contacts table dropped successfully');
      return Promise.resolve();
    } catch (error) {
      migrationLogger.error(`Rollback failed: ${error.message}`);
      return Promise.reject(error);
    }
  }
};