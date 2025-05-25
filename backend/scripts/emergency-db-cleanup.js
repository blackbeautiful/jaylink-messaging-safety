// scripts/emergency-db-cleanup.js
/**
 * Emergency Database Cleanup Script
 * Run this script to fix your current database index issues
 * 
 * Usage: node scripts/emergency-db-cleanup.js
 */

const db = require('../src/models');
const logger = require('../src/config/logger');

class EmergencyDatabaseCleaner {
  constructor() {
    this.sequelize = db.sequelize;
    this.queryInterface = this.sequelize.getQueryInterface();
    this.cleanupStats = {
      totalTablesProcessed: 0,
      totalIndexesRemoved: 0,
      duplicateIndexesRemoved: 0,
      errors: []
    };
  }

  /**
   * Main cleanup function
   */
  async performEmergencyCleanup() {
    logger.info('🚨 Starting Emergency Database Cleanup');
    logger.info('This will remove duplicate and excessive indexes from your database');
    
    try {
      // Step 1: Backup recommendations
      await this.displayBackupWarning();
      
      // Step 2: Analyze current state
      await this.analyzeCurrentState();
      
      // Step 3: Perform cleanup
      await this.cleanupAllTables();
      
      // Step 4: Verify results
      await this.verifyCleanupResults();
      
      // Step 5: Display summary
      this.displayCleanupSummary();
      
      logger.info('✅ Emergency cleanup completed successfully');
      return true;
      
    } catch (error) {
      logger.error('❌ Emergency cleanup failed:', error);
      return false;
    } finally {
      await this.sequelize.close();
    }
  }

  /**
   * Display backup warning
   */
  async displayBackupWarning() {
    logger.warn('⚠️  IMPORTANT: This script will modify your database structure');
    logger.warn('⚠️  Please ensure you have a database backup before proceeding');
    logger.warn('⚠️  Consider running: mysqldump -u username -p jaylink_db > backup.sql');
    
    // Wait 5 seconds to give user time to read the warning
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  /**
   * Analyze current database state
   */
  async analyzeCurrentState() {
    logger.info('🔍 Analyzing current database state...');
    
    try {
      const tables = await this.queryInterface.showAllTables();
      let totalIndexes = 0;
      const problematicTables = [];

      for (const tableName of tables) {
        try {
          const indexes = await this.queryInterface.showIndex(tableName);
          totalIndexes += indexes.length;
          
          if (indexes.length > 20) {
            problematicTables.push({
              table: tableName,
              indexCount: indexes.length,
              duplicates: this.findDuplicateIndexes(indexes)
            });
          }
        } catch (error) {
          logger.warn(`Failed to analyze table ${tableName}:`, error.message);
        }
      }

      logger.info(`📊 Analysis Results:`);
      logger.info(`   • Total tables: ${tables.length}`);
      logger.info(`   • Total indexes: ${totalIndexes}`);
      logger.info(`   • Problematic tables: ${problematicTables.length}`);
      
      if (problematicTables.length > 0) {
        logger.warn('⚠️  Tables with excessive indexes:');
        problematicTables.forEach(({ table, indexCount, duplicates }) => {
          logger.warn(`   • ${table}: ${indexCount} indexes (${duplicates.length} duplicates)`);
        });
      }

      return { totalIndexes, problematicTables };
    } catch (error) {
      logger.error('Failed to analyze database state:', error);
      throw error;
    }
  }

  /**
   * Find duplicate indexes in a table
   */
  findDuplicateIndexes(indexes) {
    const indexGroups = new Map();
    const duplicates = [];

    for (const index of indexes) {
      const indexName = index.name || index.Key_name;
      
      // Skip primary key
      if (indexName === 'PRIMARY') continue;

      // Create signature based on columns
      const columns = this.getIndexColumns(index);
      const signature = `${columns.join(',')}_${index.unique ? 'unique' : 'regular'}`;
      
      if (!indexGroups.has(signature)) {
        indexGroups.set(signature, []);
      }
      indexGroups.get(signature).push(indexName);
    }

    // Find groups with more than one index (duplicates)
    for (const [signature, indexNames] of indexGroups.entries()) {
      if (indexNames.length > 1) {
        // Keep the first one, mark others as duplicates
        duplicates.push(...indexNames.slice(1));
      }
    }

    return duplicates;
  }

  /**
   * Get columns from an index definition
   */
  getIndexColumns(index) {
    if (Array.isArray(index.fields)) {
      return index.fields.map(f => typeof f === 'string' ? f : f.attribute);
    }
    return index.Column_name ? [index.Column_name] : [];
  }

  /**
   * Clean up all tables
   */
  async cleanupAllTables() {
    logger.info('🧹 Starting comprehensive table cleanup...');
    
    const tables = await this.queryInterface.showAllTables();
    
    for (const tableName of tables) {
      try {
        await this.cleanupSingleTable(tableName);
        this.cleanupStats.totalTablesProcessed++;
      } catch (error) {
        logger.error(`Failed to cleanup table ${tableName}:`, error.message);
        this.cleanupStats.errors.push(`${tableName}: ${error.message}`);
      }
    }
  }

  /**
   * Clean up a single table
   */
  async cleanupSingleTable(tableName) {
    const indexes = await this.queryInterface.showIndex(tableName);
    
    if (indexes.length <= 10) {
      logger.debug(`✅ Table ${tableName} has reasonable number of indexes (${indexes.length})`);
      return;
    }

    logger.info(`🧹 Cleaning up table: ${tableName} (${indexes.length} indexes)`);

    // Find and remove duplicate indexes
    const duplicateIndexes = this.findDuplicateIndexes(indexes);
    
    for (const indexName of duplicateIndexes) {
      try {
        await this.queryInterface.removeIndex(tableName, indexName);
        this.cleanupStats.totalIndexesRemoved++;
        this.cleanupStats.duplicateIndexesRemoved++;
        logger.info(`   🗑️  Removed duplicate index: ${indexName}`);
      } catch (error) {
        logger.warn(`   ⚠️  Failed to remove index ${indexName}: ${error.message}`);
        this.cleanupStats.errors.push(`${tableName}.${indexName}: ${error.message}`);
      }
    }

    // Handle tables with still too many indexes after duplicate removal
    const remainingIndexes = await this.queryInterface.showIndex(tableName);
    if (remainingIndexes.length > 30) {
      await this.handleExcessiveIndexes(tableName, remainingIndexes);
    }
  }

  /**
   * Handle tables with excessive indexes even after duplicate removal
   */
  async handleExcessiveIndexes(tableName, indexes) {
    logger.warn(`⚠️  Table ${tableName} still has ${indexes.length} indexes after duplicate removal`);
    
    // Identify essential indexes to keep
    const essentialPatterns = ['PRIMARY', 'email', 'unique', 'id'];
    const nonEssentialIndexes = indexes.filter(index => {
      const indexName = (index.name || index.Key_name || '').toLowerCase();
      return !essentialPatterns.some(pattern => indexName.includes(pattern));
    });

    // Remove oldest/redundant non-essential indexes if there are too many
    if (nonEssentialIndexes.length > 20) {
      const indexesToRemove = nonEssentialIndexes.slice(15); // Keep first 15 non-essential
      
      logger.warn(`   🚨 Removing ${indexesToRemove.length} excessive indexes from ${tableName}`);
      
      for (const index of indexesToRemove) {
        try {
          const indexName = index.name || index.Key_name;
          await this.queryInterface.removeIndex(tableName, indexName);
          this.cleanupStats.totalIndexesRemoved++;
          logger.info(`   🗑️  Removed excessive index: ${indexName}`);
        } catch (error) {
          logger.warn(`   ⚠️  Failed to remove excessive index ${indexName}: ${error.message}`);
        }
      }
    }
  }

  /**
   * Verify cleanup results
   */
  async verifyCleanupResults() {
    logger.info('🔍 Verifying cleanup results...');
    
    try {
      const tables = await this.queryInterface.showAllTables();
      let totalIndexesAfter = 0;
      const stillProblematicTables = [];

      for (const tableName of tables) {
        try {
          const indexes = await this.queryInterface.showIndex(tableName);
          totalIndexesAfter += indexes.length;
          
          if (indexes.length > 40) {
            stillProblematicTables.push({
              table: tableName,
              indexCount: indexes.length
            });
          }
        } catch (error) {
          logger.warn(`Failed to verify table ${tableName}:`, error.message);
        }
      }

      logger.info(`📊 Cleanup Verification:`);
      logger.info(`   • Total indexes after cleanup: ${totalIndexesAfter}`);
      logger.info(`   • Tables still problematic: ${stillProblematicTables.length}`);
      
      if (stillProblematicTables.length > 0) {
        logger.warn('⚠️  Tables still requiring attention:');
        stillProblematicTables.forEach(({ table, indexCount }) => {
          logger.warn(`   • ${table}: ${indexCount} indexes`);
        });
      }

      return { totalIndexesAfter, stillProblematicTables };
    } catch (error) {
      logger.error('Failed to verify cleanup results:', error);
      throw error;
    }
  }

  /**
   * Display cleanup summary
   */
  displayCleanupSummary() {
    logger.info('📋 Emergency Cleanup Summary:');
    logger.info('========================================');
    logger.info(`✅ Tables processed: ${this.cleanupStats.totalTablesProcessed}`);
    logger.info(`🗑️  Total indexes removed: ${this.cleanupStats.totalIndexesRemoved}`);
    logger.info(`🔄 Duplicate indexes removed: ${this.cleanupStats.duplicateIndexesRemoved}`);
    logger.info(`❌ Errors encountered: ${this.cleanupStats.errors.length}`);
    
    if (this.cleanupStats.errors.length > 0) {
      logger.warn('⚠️  Errors during cleanup:');
      this.cleanupStats.errors.forEach(error => {
        logger.warn(`   • ${error}`);
      });
    }
    
    logger.info('========================================');
    
    // Recommendations
    logger.info('💡 Recommendations:');
    logger.info('   • Restart your application to see the effects');
    logger.info('   • Monitor application performance for any issues');
    logger.info('   • Consider reviewing your Sequelize model definitions');
    logger.info('   • Run the new database setup utility for ongoing maintenance');
  }
}

/**
 * Main execution function
 */
async function main() {
  const cleaner = new EmergencyDatabaseCleaner();
  
  try {
    const success = await cleaner.performEmergencyCleanup();
    process.exit(success ? 0 : 1);
  } catch (error) {
    logger.error('Emergency cleanup script failed:', error);
    process.exit(1);
  }
}

// Run the script if executed directly
if (require.main === module) {
  main();
}

module.exports = EmergencyDatabaseCleaner;