// backend/src/utils/backup.util.js
/**
 * JayLink SMS Platform
 * Database backup utility integrated with monitoring
 * Fixed for Windows compatibility and improved error handling
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');
const logger = require('../config/logger');
const { promisify } = require('util');
const execPromise = promisify(exec);
const zlib = require('zlib');
const { pipeline } = require('stream');
const { promisify: utilPromisify } = require('util');
const pipelinePromise = utilPromisify(pipeline);

/**
 * Database backup manager
 * Integrated with the monitoring system for health checks and alerting
 * @module backup-util
 */

// Keep track of recent backups for monitoring
let lastBackupStatus = {
  timestamp: null,
  status: 'not_run',
  filePath: null,
  fileSize: null,
  duration: null,
  error: null,
};

/**
 * Initiate database backup
 * @param {boolean} manual - Whether backup was manually triggered
 * @returns {Promise<Object>} Backup result
 */
const backupDatabase = async (manual = false) => {
  const startTime = Date.now();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = config.backup?.directory || path.join(process.cwd(), 'backups');
  const dbConfig = config.db;

  // Ensure backup directory exists
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
    logger.info(`Created backup directory: ${backupDir}`);
  }

  // Determine backup filename
  const backupFileName = `${dbConfig.name}_${timestamp}.sql`;
  const backupFilePath = path.join(backupDir, backupFileName);

  logger.info(`Starting database backup to ${backupFilePath}`);

  try {
    // Check if mysqldump is available
    const mysqldumpPath = await findMysqldumpPath();
    if (!mysqldumpPath) {
      throw new Error(
        'mysqldump command not found. Please ensure MySQL client tools are installed and in PATH.'
      );
    }

    // Build mysqldump command with proper escaping
    const command = buildBackupCommand(dbConfig, backupFilePath, mysqldumpPath);

    // Execute the backup command
    logger.debug(`Executing backup command: ${command.replace(/(-p)[^\s]+/g, '$1****')}`); // Hide password in logs
    await execPromise(command);

    // Validate backup file
    if (!fs.existsSync(backupFilePath)) {
      throw new Error('Backup file was not created');
    }

    const fileStats = fs.statSync(backupFilePath);
    const fileSize = fileStats.size;

    if (fileSize === 0) {
      throw new Error('Backup file is empty');
    }

    // Validate backup content
    const isValidBackup = await validateBackupFile(backupFilePath);
    if (!isValidBackup) {
      throw new Error('Backup file appears to be corrupted or incomplete');
    }

    // Calculate duration in seconds
    const duration = (Date.now() - startTime) / 1000;

    // Compress the backup if configured
    let compressedFilePath = backupFilePath;
    if (config.backup?.compress !== false) {
      compressedFilePath = await compressBackup(backupFilePath);

      // Remove the original file if compression was successful
      if (fs.existsSync(compressedFilePath) && fs.existsSync(backupFilePath)) {
        fs.unlinkSync(backupFilePath);
      }
    }

    // Get final file stats
    const finalStats = fs.statSync(compressedFilePath);
    const finalSize = finalStats.size;

    // Update last backup status
    lastBackupStatus = {
      timestamp: new Date(),
      status: 'success',
      filePath: compressedFilePath,
      fileSize: finalSize,
      duration,
      error: null,
    };

    logger.info(
      `Database backup completed successfully in ${duration.toFixed(2)}s. File size: ${formatBytes(
        finalSize
      )}`
    );

    // Cleanup old backups if configured
    if (config.backup?.retention) {
      await cleanupOldBackups(backupDir, config.backup.retention);
    }

    // Return backup details
    return {
      status: 'success',
      timestamp: new Date(),
      filePath: compressedFilePath,
      fileSize: finalSize,
      duration,
      manual,
    };
  } catch (error) {
    logger.error('Database backup failed:', error);

    // Clean up failed backup file if it exists
    if (fs.existsSync(backupFilePath)) {
      try {
        fs.unlinkSync(backupFilePath);
      } catch (cleanupError) {
        logger.warn(`Failed to cleanup incomplete backup file: ${cleanupError.message}`);
      }
    }

    // Update last backup status with error
    lastBackupStatus = {
      timestamp: new Date(),
      status: 'error',
      filePath: null,
      fileSize: null,
      duration: (Date.now() - startTime) / 1000,
      error: error.message,
    };

    // Return error details
    return {
      status: 'error',
      timestamp: new Date(),
      error: error.message,
      duration: (Date.now() - startTime) / 1000,
      manual,
    };
  }
};

/**
 * Find mysqldump executable path
 * @returns {Promise<string|null>} Path to mysqldump or null if not found
 */
const findMysqldumpPath = async () => {
  const possiblePaths = [
    'mysqldump', // Default PATH
    '/usr/bin/mysqldump', // Linux
    '/usr/local/bin/mysqldump', // macOS
    'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe', // Windows MySQL 8.0
    'C:\\Program Files\\MySQL\\MySQL Server 5.7\\bin\\mysqldump.exe', // Windows MySQL 5.7
    'C:\\xampp\\mysql\\bin\\mysqldump.exe', // XAMPP
    'C:\\wamp64\\bin\\mysql\\mysql8.0.21\\bin\\mysqldump.exe', // WAMP
  ];

  for (const pathToCheck of possiblePaths) {
    try {
      await execPromise(`"${pathToCheck}" --version`);
      logger.debug(`Found mysqldump at: ${pathToCheck}`);
      return pathToCheck;
    } catch (error) {
      // Continue checking other paths
    }
  }

  // Try to find using which/where command
  try {
    const command = process.platform === 'win32' ? 'where mysqldump' : 'which mysqldump';
    const { stdout } = await execPromise(command);
    const foundPath = stdout.trim().split('\n')[0];
    if (foundPath) {
      logger.debug(`Found mysqldump via ${command}: ${foundPath}`);
      return foundPath;
    }
  } catch (error) {
    // Command failed
  }

  return null;
};

/**
 * Build backup command based on the database configuration and OS
 * @param {Object} dbConfig - Database configuration
 * @param {string} backupFilePath - Backup file path
 * @param {string} mysqldumpPath - Path to mysqldump executable
 * @returns {string} Backup command
 */
const buildBackupCommand = (dbConfig, backupFilePath, mysqldumpPath) => {
  let command;

  // Quote the mysqldump path to handle spaces
  const quotedMysqldumpPath = `"${mysqldumpPath}"`;

  if (process.platform === 'win32') {
    // Windows command format - use -p flag directly
    command = `${quotedMysqldumpPath} -h${dbConfig.host} -P${dbConfig.port || 3306} -u${
      dbConfig.user
    }`;

    if (dbConfig.password) {
      command += ` -p${dbConfig.password}`;
    }

    // Add database name
    command += ` ${dbConfig.name}`;

    // Add default options for better compatibility
    const defaultOptions = [
      '--single-transaction',
      '--routines',
      '--triggers',
      '--quick',
      '--lock-tables=false',
    ];

    // Add configured options
    const configuredOptions = config.backup?.options || [];
    const allOptions = [...defaultOptions, ...configuredOptions];

    if (allOptions.length > 0) {
      command += ` ${allOptions.join(' ')}`;
    }

    // Add output redirection with proper quoting
    command += ` > "${backupFilePath}"`;
  } else {
    // Unix/Linux format with MYSQL_PWD environment variable
    command = quotedMysqldumpPath;

    // Add connection parameters
    command += ` -h${dbConfig.host}`;
    command += ` -P${dbConfig.port || 3306}`;
    command += ` -u${dbConfig.user}`;

    // Add database name
    command += ` ${dbConfig.name}`;

    // Add default options for better compatibility
    const defaultOptions = [
      '--single-transaction',
      '--routines',
      '--triggers',
      '--quick',
      '--lock-tables=false',
    ];

    // Add configured options
    const configuredOptions = config.backup?.options || [];
    const allOptions = [...defaultOptions, ...configuredOptions];

    if (allOptions.length > 0) {
      command += ` ${allOptions.join(' ')}`;
    }

    // Add output redirection
    command += ` > "${backupFilePath}"`;

    // Prepend MYSQL_PWD if password is provided
    if (dbConfig.password) {
      command = `MYSQL_PWD="${dbConfig.password}" ${command}`;
    }
  }

  return command;
};

/**
 * Validate backup file content
 * @param {string} filePath - Path to backup file
 * @returns {Promise<boolean>} True if backup appears valid
 */
const validateBackupFile = async (filePath) => {
  try {
    // Read first few lines to check for SQL dump header
    const fileStream = fs.createReadStream(filePath, { encoding: 'utf8', start: 0, end: 1000 });
    let content = '';

    return new Promise((resolve) => {
      fileStream.on('data', (chunk) => {
        content += chunk;
      });

      fileStream.on('end', () => {
        // Check for mysqldump header indicators
        const hasHeader =
          content.includes('-- MySQL dump') ||
          content.includes('-- Dump completed') ||
          content.includes('CREATE TABLE') ||
          content.includes('INSERT INTO');
        resolve(hasHeader);
      });

      fileStream.on('error', () => {
        resolve(false);
      });
    });
  } catch (error) {
    logger.warn(`Failed to validate backup file: ${error.message}`);
    return false;
  }
};

/**
 * Compress a backup file using gzip
 * @param {string} filePath - Path to the backup file
 * @returns {Promise<string>} Path to the compressed file
 */
const compressBackup = async (filePath) => {
  const compressedPath = `${filePath}.gz`;
  logger.info(`Compressing backup file to ${compressedPath}`);

  try {
    // Create read and write streams
    const readStream = fs.createReadStream(filePath);
    const writeStream = fs.createWriteStream(compressedPath);

    // Compress using gzip
    await pipelinePromise(
      readStream,
      zlib.createGzip({ level: 6 }), // Good compression ratio
      writeStream
    );

    // Verify compressed file was created and has content
    if (fs.existsSync(compressedPath)) {
      const compressedStats = fs.statSync(compressedPath);
      if (compressedStats.size > 0) {
        const originalStats = fs.statSync(filePath);
        const compressionRatio = (
          ((originalStats.size - compressedStats.size) / originalStats.size) *
          100
        ).toFixed(1);
        logger.info(`Backup compression completed successfully. Saved ${compressionRatio}% space.`);
        return compressedPath;
      }
    }

    throw new Error('Compressed file was not created or is empty');
  } catch (error) {
    logger.error('Backup compression failed:', error);
    // Return original file path if compression fails
    return filePath;
  }
};

/**
 * Clean up old backup files based on retention policy
 * @param {string} backupDir - Backup directory
 * @param {number} daysToKeep - Number of days to keep backups
 * @returns {Promise<number>} Number of files deleted
 */
const cleanupOldBackups = async (backupDir, daysToKeep) => {
  try {
    logger.info(`Cleaning up backups older than ${daysToKeep} days`);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // List all files in the backup directory
    const files = fs.readdirSync(backupDir);
    let deletedCount = 0;
    let deletedSize = 0;

    for (const file of files) {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);

      // Check file age and type
      if (stats.isFile() && stats.mtime < cutoffDate) {
        // Only delete SQL and compressed SQL files
        if (file.endsWith('.sql') || file.endsWith('.sql.gz')) {
          const fileSize = stats.size;
          fs.unlinkSync(filePath);
          deletedCount++;
          deletedSize += fileSize;
          logger.debug(`Deleted old backup: ${file} (${formatBytes(fileSize)})`);
        }
      }
    }

    if (deletedCount > 0) {
      logger.info(
        `Cleanup completed. Deleted ${deletedCount} old backup files, freed ${formatBytes(
          deletedSize
        )}.`
      );
    } else {
      logger.info('Cleanup completed. No old backups found to delete.');
    }

    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up old backups:', error);
    return 0;
  }
};

/**
 * Get information about the last backup
 * @returns {Object} Last backup status
 */
const getLastBackupStatus = () => {
  return { ...lastBackupStatus };
};

/**
 * Schedule regular database backups
 * @returns {Function} Function to cancel the schedule
 */
const scheduleBackups = () => {
  // Don't schedule backups if disabled in config
  if (config.backup?.enabled === false) {
    logger.info('Automatic database backups are disabled in configuration');
    return () => {}; // Return empty function
  }

  // Parse backup schedule
  const backupInterval = parseInt(config.backup?.interval || '86400000', 10); // Default: 24 hours
  const backupTime = config.backup?.time || '01:00'; // Default: 1 AM

  logger.info(
    `Scheduling automatic database backups (interval: ${formatDuration(backupInterval)})`
  );

  let backupTimeout = null;

  const scheduleNextBackup = () => {
    let nextBackupTime;

    if (config.backup?.time) {
      // Schedule for specific time of day
      const [hour, minute] = backupTime.split(':').map(Number);
      nextBackupTime = new Date();
      nextBackupTime.setHours(hour, minute, 0, 0);

      // If the time has already passed today, schedule for tomorrow
      if (nextBackupTime <= new Date()) {
        nextBackupTime.setDate(nextBackupTime.getDate() + 1);
      }
    } else {
      // Schedule based on interval
      nextBackupTime = new Date();
      nextBackupTime.setTime(nextBackupTime.getTime() + backupInterval);
    }

    const timeUntilBackup = nextBackupTime.getTime() - Date.now();

    logger.info(
      `Next database backup scheduled at ${nextBackupTime.toLocaleString()} (in ${formatDuration(
        timeUntilBackup
      )})`
    );

    backupTimeout = setTimeout(async () => {
      logger.info('Executing scheduled database backup');

      try {
        await backupDatabase(false);
      } catch (error) {
        logger.error('Scheduled backup failed:', error);
      }

      // Schedule the next backup
      scheduleNextBackup();
    }, timeUntilBackup);
  };

  // Schedule the first backup
  scheduleNextBackup();

  // Return a function to cancel the schedule
  return () => {
    if (backupTimeout) {
      clearTimeout(backupTimeout);
      logger.info('Canceled scheduled database backups');
    }
  };
};

/**
 * Check backup health for monitoring
 * @returns {Object} Backup health status
 */
const checkBackupHealth = () => {
  try {
    const backupDir = config.backup?.directory || path.join(process.cwd(), 'backups');

    // Check if backup directory exists
    if (!fs.existsSync(backupDir)) {
      return {
        status: 'warning',
        message: 'Backup directory does not exist',
        lastBackup: lastBackupStatus,
      };
    }

    // Get list of backup files
    const files = fs
      .readdirSync(backupDir)
      .filter((file) => file.endsWith('.sql') || file.endsWith('.sql.gz'))
      .map((file) => {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          path: filePath,
          size: stats.size,
          date: stats.mtime,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort newest first

    // Check for recent backups
    const now = new Date();
    const backupFrequency = parseInt(config.backup?.interval || '86400000', 10);
    const expectedBackupInterval = backupFrequency * 1.5; // Allow 50% margin

    if (files.length === 0) {
      return {
        status: 'warning',
        message: 'No backup files found',
        files: [],
        lastBackup: lastBackupStatus,
      };
    }

    const lastBackupFile = files[0];
    const timeSinceLastBackup = now.getTime() - lastBackupFile.date.getTime();

    // If last backup is too old
    if (timeSinceLastBackup > expectedBackupInterval) {
      return {
        status: 'warning',
        message: `Last backup is ${formatDuration(
          timeSinceLastBackup
        )} old, exceeding expected interval of ${formatDuration(backupFrequency)}`,
        lastBackupFile,
        files: files.slice(0, 5), // Return latest 5 files
        lastBackup: lastBackupStatus,
      };
    }

    // If last backup attempt failed
    if (
      lastBackupStatus.status === 'error' &&
      lastBackupStatus.timestamp &&
      lastBackupFile.date < lastBackupStatus.timestamp
    ) {
      return {
        status: 'error',
        message: `Last backup attempt failed: ${lastBackupStatus.error}`,
        lastBackupFile,
        files: files.slice(0, 5),
        lastBackup: lastBackupStatus,
      };
    }

    // Everything looks good
    return {
      status: 'healthy',
      message: `Last backup is ${formatDuration(timeSinceLastBackup)} old`,
      lastBackupFile,
      files: files.slice(0, 5),
      lastBackup: lastBackupStatus,
    };
  } catch (error) {
    logger.error('Error checking backup health:', error);
    return {
      status: 'error',
      message: `Failed to check backup health: ${error.message}`,
      error: error.message,
      lastBackup: lastBackupStatus,
    };
  }
};

/**
 * Format file size in human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format duration in human-readable format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
const formatDuration = (ms) => {
  if (ms < 1000) return `${ms}ms`;

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
};

module.exports = {
  backupDatabase,
  getLastBackupStatus,
  scheduleBackups,
  checkBackupHealth,
  formatBytes,
  formatDuration,
};
