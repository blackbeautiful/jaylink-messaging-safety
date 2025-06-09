'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🚀 Starting base tables migration...');

      // Create groups table first (referenced by group_contacts)
      const groupsExists = await queryInterface.showAllTables()
        .then(tables => tables.includes('groups'));
      
      if (!groupsExists) {
        console.log('📋 Creating groups table...');
        await queryInterface.createTable('groups', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          name: {
            type: Sequelize.STRING(100),
            allowNull: false
          },
          description: {
            type: Sequelize.TEXT,
            allowNull: true
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          contactCount: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
            field: 'contact_count'
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            field: 'created_at',
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            field: 'updated_at',
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
          }
        }, { transaction });

        // Add indexes for groups table
        await queryInterface.addIndex('groups', ['user_id'], {
          name: 'idx_groups_user_id',
          transaction
        });

        await queryInterface.addIndex('groups', ['name'], {
          name: 'idx_groups_name',
          transaction
        });

        console.log('✅ Groups table created with indexes');
      } else {
        console.log('⏭️  Groups table already exists, skipping...');
      }

      // Create scheduled_messages table
      const scheduledExists = await queryInterface.showAllTables()
        .then(tables => tables.includes('scheduled_messages'));
      
      if (!scheduledExists) {
        console.log('📋 Creating scheduled_messages table...');
        await queryInterface.createTable('scheduled_messages', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'user_id',
            references: {
              model: 'users',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          type: {
            type: Sequelize.ENUM('sms', 'voice', 'audio'),
            allowNull: false,
            defaultValue: 'sms'
          },
          message: {
            type: Sequelize.TEXT,
            allowNull: false
          },
          audioUrl: {
            type: Sequelize.STRING,
            allowNull: true,
            field: 'audio_url'
          },
          recipients: {
            type: Sequelize.JSON,
            allowNull: false,
            comment: 'Array of phone numbers'
          },
          recipientCount: {
            type: Sequelize.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'recipient_count'
          },
          senderId: {
            type: Sequelize.STRING(11),
            allowNull: true,
            field: 'sender_id'
          },
          scheduledAt: {
            type: Sequelize.DATE,
            allowNull: false,
            field: 'scheduled_at'
          },
          status: {
            type: Sequelize.ENUM('pending', 'processing', 'sent', 'failed', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending'
          },
          messageId: {
            type: Sequelize.STRING,
            allowNull: true,
            field: 'message_id',
            comment: 'SMS provider message ID after sending'
          },
          cost: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true,
            defaultValue: 0.00
          },
          processedAt: {
            type: Sequelize.DATE,
            allowNull: true,
            field: 'processed_at'
          },
          sentAt: {
            type: Sequelize.DATE,
            allowNull: true,
            field: 'sent_at'
          },
          failedAt: {
            type: Sequelize.DATE,
            allowNull: true,
            field: 'failed_at'
          },
          cancelledAt: {
            type: Sequelize.DATE,
            allowNull: true,
            field: 'cancelled_at'
          },
          errorMessage: {
            type: Sequelize.TEXT,
            allowNull: true,
            field: 'error_message'
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            field: 'created_at',
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            field: 'updated_at',
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
          }
        }, { transaction });

        // Add indexes for scheduled_messages table
        await queryInterface.addIndex('scheduled_messages', ['user_id'], {
          name: 'idx_scheduled_messages_user_id',
          transaction
        });

        await queryInterface.addIndex('scheduled_messages', ['status'], {
          name: 'idx_scheduled_messages_status',
          transaction
        });

        await queryInterface.addIndex('scheduled_messages', ['scheduled_at'], {
          name: 'idx_scheduled_messages_scheduled_at',
          transaction
        });

        await queryInterface.addIndex('scheduled_messages', ['status', 'scheduled_at'], {
          name: 'idx_scheduled_messages_status_date',
          transaction
        });

        await queryInterface.addIndex('scheduled_messages', ['type'], {
          name: 'idx_scheduled_messages_type',
          transaction
        });

        console.log('✅ Scheduled_messages table created with indexes');
      } else {
        console.log('⏭️  Scheduled_messages table already exists, skipping...');
      }

      // Create group_contacts table (if it doesn't exist)
      const groupContactsExists = await queryInterface.showAllTables()
        .then(tables => tables.includes('group_contacts'));
      
      if (!groupContactsExists) {
        console.log('📋 Creating group_contacts table...');
        await queryInterface.createTable('group_contacts', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          groupId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'group_id',
            references: {
              model: 'groups',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          contactId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            field: 'contact_id',
            references: {
              model: 'contacts',
              key: 'id'
            },
            onUpdate: 'CASCADE',
            onDelete: 'CASCADE'
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
            field: 'created_at',
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
            field: 'updated_at',
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
          }
        }, { transaction });

        // Add unique constraint to prevent duplicate group-contact relationships
        await queryInterface.addIndex('group_contacts', ['group_id', 'contact_id'], {
          unique: true,
          name: 'unique_group_contact',
          transaction
        });

        // Add individual indexes
        await queryInterface.addIndex('group_contacts', ['group_id'], {
          name: 'idx_group_contacts_group_id',
          transaction
        });

        await queryInterface.addIndex('group_contacts', ['contact_id'], {
          name: 'idx_group_contacts_contact_id',
          transaction
        });

        console.log('✅ Group_contacts table created with indexes');
      } else {
        console.log('⏭️  Group_contacts table already exists, skipping...');
      }

      await transaction.commit();
      console.log('🎉 Base tables migration completed successfully!');

    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error.message);
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      console.log('🔄 Rolling back base tables migration...');

      // Drop tables in reverse order (due to foreign key dependencies)
      const tablesToDrop = ['group_contacts', 'scheduled_messages', 'groups'];
      
      for (const tableName of tablesToDrop) {
        const tableExists = await queryInterface.showAllTables()
          .then(tables => tables.includes(tableName));
        
        if (tableExists) {
          await queryInterface.dropTable(tableName, { transaction });
          console.log(`✅ Dropped table: ${tableName}`);
        }
      }

      await transaction.commit();
      console.log('✅ Base tables migration rollback completed');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Rollback failed:', error.message);
      throw error;
    }
  }
};