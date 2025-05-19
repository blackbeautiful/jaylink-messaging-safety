const { exec } = require('child_process');
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
const backupFile = path.join(backupDir, `backup-${timestamp}.sql`);

// Create backup command
const command = `mysqldump -h ${config.db.host} -P ${config.db.port} -u ${config.db.user} -p${config.db.password} ${config.db.name} > ${backupFile}`;

logger.info(`Starting database backup to ${backupFile}`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    logger.error(`Backup failed: ${error.message}`);
    process.exit(1);
  }
  
  logger.info(`Database backup completed successfully: ${backupFile}`);
});