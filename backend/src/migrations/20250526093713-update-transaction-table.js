'use strict';

const logger = require('../config/logger');

module.exports = {
  async up(queryInterface, Sequelize) {
    const migrationName = 'update-transaction-table';
    logger.info(`[MIGRATION] Starting: ${migrationName}`);
    
    try {
      await queryInterface.sequelize.transaction(async (transaction) => {
        // 1. Check if transactions table exists
        const tableExists = await queryInterface.showAllTables()
          .then(tables => tables.includes('transactions'));
        
        if (!tableExists) {
          logger.info('[MIGRATION] Creating transactions table...');
          
          // Create the transactions table with all required fields
          await queryInterface.createTable('transactions', {
            id: {
              type: Sequelize.INTEGER,
              autoIncrement: true,
              primaryKey: true,
              allowNull: false
            },
            userId: {
              type: Sequelize.INTEGER,
              allowNull: false,
              references: {
                model: 'users',
                key: 'id'
              },
              onUpdate: 'CASCADE',
              onDelete: 'CASCADE'
            },
            transactionId: {
              type: Sequelize.STRING(50),
              allowNull: false,
              unique: true
            },
            type: {
              type: Sequelize.ENUM('credit', 'debit'),
              allowNull: false
            },
            amount: {
              type: Sequelize.DECIMAL(10, 2),
              allowNull: false
            },
            balanceAfter: {
              type: Sequelize.DECIMAL(10, 2),
              allowNull: false
            },
            service: {
              type: Sequelize.STRING(50),
              allowNull: true
            },
            status: {
              type: Sequelize.ENUM('completed', 'pending', 'failed'),
              allowNull: false,
              defaultValue: 'completed'
            },
            description: {
              type: Sequelize.TEXT,
              allowNull: true
            },
            createdAt: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updatedAt: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
          }, { transaction });
          
          logger.info('[MIGRATION] Transactions table created successfully');
        } else {
          logger.info('[MIGRATION] Transactions table exists, checking for missing columns...');
          
          // Get current table structure
          const tableDescription = await queryInterface.describeTable('transactions', { transaction });
          
          // Check and add missing columns
          const requiredColumns = {
            updatedAt: {
              type: Sequelize.DATE,
              allowNull: false,
              defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
            }
          };
          
          for (const [columnName, columnDefinition] of Object.entries(requiredColumns)) {
            if (!tableDescription[columnName]) {
              logger.info(`[MIGRATION] Adding missing column: ${columnName}`);
              await queryInterface.addColumn('transactions', columnName, columnDefinition, { transaction });
            }
          }
          
          // Update existing columns if needed
          if (tableDescription.transactionId && !tableDescription.transactionId.unique) {
            logger.info('[MIGRATION] Adding unique constraint to transactionId');
            try {
              await queryInterface.addConstraint('transactions', {
                fields: ['transactionId'],
                type: 'unique',
                name: 'unique_transaction_id'
              }, { transaction });
            } catch (error) {
              if (!error.message.includes('already exists')) {
                throw error;
              }
              logger.info('[MIGRATION] Unique constraint already exists');
            }
          }
        }
        
        // 2. Clean up duplicate indexes first
        logger.info('[MIGRATION] Cleaning up duplicate indexes...');
        const existingIndexes = await queryInterface.showIndex('transactions', { transaction });
        
        // Remove duplicate indexes but keep essential ones
        const indexesToKeep = ['PRIMARY', 'unique_transaction_id', 'idx_user_id', 'idx_created_at'];
        const duplicateIndexes = existingIndexes.filter(index => {
          const indexName = index.name || index.Key_name;
          return !indexesToKeep.includes(indexName) && 
                 !indexName.startsWith('transactions_') && // Keep auto-generated foreign key indexes
                 indexName !== 'transactionId'; // Remove old duplicate
        });
        
        for (const index of duplicateIndexes) {
          try {
            const indexName = index.name || index.Key_name;
            await queryInterface.removeIndex('transactions', indexName, { transaction });
            logger.info(`[MIGRATION] Removed duplicate index: ${indexName}`);
          } catch (error) {
            logger.warn(`[MIGRATION] Could not remove index ${index.name}: ${error.message}`);
          }
        }
        
        // 3. Create essential indexes (only if they don't exist)
        const requiredIndexes = [
          {
            name: 'idx_user_id',
            fields: ['userId']
          },
          {
            name: 'idx_transaction_id', 
            fields: ['transactionId'],
            unique: true
          },
          {
            name: 'idx_created_at',
            fields: ['createdAt']
          },
          {
            name: 'idx_type',
            fields: ['type']
          },
          {
            name: 'idx_status',
            fields: ['status']
          },
          {
            name: 'idx_service',
            fields: ['service']
          },
          {
            name: 'idx_user_created',
            fields: ['userId', 'createdAt']
          },
          {
            name: 'idx_user_type',
            fields: ['userId', 'type']
          },
          {
            name: 'idx_user_status',
            fields: ['userId', 'status']
          }
        ];
        
        // Get current indexes after cleanup
        const currentIndexes = await queryInterface.showIndex('transactions', { transaction });
        const currentIndexNames = currentIndexes.map(idx => idx.name || idx.Key_name);
        
        for (const indexDef of requiredIndexes) {
          if (!currentIndexNames.includes(indexDef.name)) {
            logger.info(`[MIGRATION] Creating index: ${indexDef.name}`);
            try {
              await queryInterface.addIndex('transactions', indexDef.fields, {
                name: indexDef.name,
                unique: indexDef.unique || false,
                transaction
              });
            } catch (error) {
              if (!error.message.includes('already exists')) {
                logger.warn(`[MIGRATION] Could not create index ${indexDef.name}: ${error.message}`);
              }
            }
          }
        }
        
        // 4. Ensure foreign key constraint exists
        logger.info('[MIGRATION] Checking foreign key constraints...');
        try {
          const foreignKeys = await queryInterface.sequelize.query(`
            SELECT CONSTRAINT_NAME 
            FROM information_schema.KEY_COLUMN_USAGE 
            WHERE TABLE_SCHEMA = DATABASE() 
              AND TABLE_NAME = 'transactions' 
              AND REFERENCED_TABLE_NAME = 'users'
          `, { 
            type: Sequelize.QueryTypes.SELECT,
            transaction 
          });
          
          if (foreignKeys.length === 0) {
            logger.info('[MIGRATION] Adding foreign key constraint for userId');
            await queryInterface.addConstraint('transactions', {
              fields: ['userId'],
              type: 'foreign key',
              name: 'fk_transactions_user_id',
              references: {
                table: 'users',
                field: 'id'
              },
              onDelete: 'CASCADE',
              onUpdate: 'CASCADE'
            }, { transaction });
          }
        } catch (error) {
          logger.warn(`[MIGRATION] Foreign key constraint check failed: ${error.message}`);
        }
        
        logger.info('[MIGRATION] Transaction table migration completed successfully');
      });
      
      return Promise.resolve();
    } catch (error) {
      logger.error(`[MIGRATION] Migration failed: ${error.message}`, {
        stack: error.stack?.substring(0, 1000)
      });
      return Promise.reject(error);
    }
  },

  async down(queryInterface, Sequelize) {
    logger.info('[MIGRATION] Rolling back: update-transaction-table');
    
    try {
      await queryInterface.sequelize.transaction(async (transaction) => {
        // Remove added indexes (keep original structure)
        const indexesToRemove = [
          'idx_status',
          'idx_service', 
          'idx_user_created',
          'idx_user_type',
          'idx_user_status'
        ];
        
        for (const indexName of indexesToRemove) {
          try {
            await queryInterface.removeIndex('transactions', indexName, { transaction });
            logger.info(`[MIGRATION] Removed index: ${indexName}`);
          } catch (error) {
            logger.warn(`[MIGRATION] Could not remove index ${indexName}: ${error.message}`);
          }
        }
        
        // Remove added columns
        try {
          const tableDescription = await queryInterface.describeTable('transactions', { transaction });
          if (tableDescription.updatedAt) {
            await queryInterface.removeColumn('transactions', 'updatedAt', { transaction });
            logger.info('[MIGRATION] Removed updatedAt column');
          }
        } catch (error) {
          logger.warn(`[MIGRATION] Could not remove updatedAt column: ${error.message}`);
        }
        
        // Remove unique constraint
        try {
          await queryInterface.removeConstraint('transactions', 'unique_transaction_id', { transaction });
          logger.info('[MIGRATION] Removed unique constraint');
        } catch (error) {
          logger.warn(`[MIGRATION] Could not remove unique constraint: ${error.message}`);
        }
        
        logger.info('[MIGRATION] Rollback completed');
      });
      
      return Promise.resolve();
    } catch (error) {
      logger.error(`[MIGRATION] Rollback failed: ${error.message}`);
      return Promise.reject(error);
    }
  }
};