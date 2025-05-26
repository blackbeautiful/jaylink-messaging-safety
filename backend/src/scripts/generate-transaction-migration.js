// src/scripts/generate-transaction-migration.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Generate timestamp for the migration file
const timestamp = new Date().toISOString()
  .replace(/[-:]/g, '')
  .replace(/\..+/, '')
  .replace('T', '');

const migrationName = `${timestamp}-update-transaction-table.js`;
const migrationPath = path.join(__dirname, '../migrations', migrationName);

// Migration content (you can customize this)
const migrationContent = `// This file was generated automatically
// Run: npm run migrate to apply this migration

'use strict';

const logger = require('../config/logger');

module.exports = {
  async up(queryInterface, Sequelize) {
    const migrationName = 'update-transaction-table';
    logger.info(\`[MIGRATION] Starting: \${migrationName}\`);
    
    try {
      await queryInterface.sequelize.transaction(async (transaction) => {
        // Your migration logic here
        // This is a template - replace with actual migration from artifact
        
        logger.info('[MIGRATION] Transaction table migration completed successfully');
      });
      
      return Promise.resolve();
    } catch (error) {
      logger.error(\`[MIGRATION] Migration failed: \${error.message}\`, {
        stack: error.stack?.substring(0, 1000)
      });
      return Promise.reject(error);
    }
  },

  async down(queryInterface, Sequelize) {
    logger.info('[MIGRATION] Rolling back: update-transaction-table');
    
    try {
      await queryInterface.sequelize.transaction(async (transaction) => {
        // Your rollback logic here
        
        logger.info('[MIGRATION] Rollback completed');
      });
      
      return Promise.resolve();
    } catch (error) {
      logger.error(\`[MIGRATION] Rollback failed: \${error.message}\`);
      return Promise.reject(error);
    }
  }
};`;

// Ensure migrations directory exists
const migrationsDir = path.join(__dirname, '../migrations');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
  console.log('Created migrations directory');
}

// Write the migration file
fs.writeFileSync(migrationPath, migrationContent);
console.log(`✅ Migration file created: ${migrationName}`);
console.log(`📁 Location: ${migrationPath}`);
console.log('');
console.log('Next steps:');
console.log('1. Edit the migration file with your actual changes');
console.log('2. Run: npm run migrate:status to check pending migrations');
console.log('3. Run: npm run migrate to apply the migration');
console.log('4. Run: npm run migrate:undo to rollback if needed');

// Also create a backup script if it doesn't exist
const backupScriptPath = path.join(__dirname, 'backup-database.js');
if (!fs.existsSync(backupScriptPath)) {
  const backupScript = `const { exec } = require('child_process');
const config = require('../config/config');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs');

// Ensure backup directory exists
const backupDir = path.join(__dirname, '../../backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, \`backup-\${timestamp}.sql\`);

// Create backup command
const command = \`mysqldump -h \${config.db.host} -P \${config.db.port} -u \${config.db.user} -p\${config.db.password} \${config.db.name} > \${backupFile}\`;

logger.info(\`Starting database backup to \${backupFile}\`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    logger.error(\`Backup failed: \${error.message}\`);
    process.exit(1);
  }
  
  if (stderr && !stderr.includes('Warning')) {
    logger.error(\`Backup stderr: \${stderr}\`);
  }
  
  logger.info(\`Database backup completed successfully: \${backupFile}\`);
});`;

  fs.writeFileSync(backupScriptPath, backupScript);
  console.log('✅ Backup script created');
}