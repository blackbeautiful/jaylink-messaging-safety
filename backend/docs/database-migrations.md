# Database Migration Workflow for Node.js/Sequelize Applications

## Overview

This document outlines a professional migration workflow for Node.js applications using Sequelize ORM, focusing on production-grade database schema management practices.

## Table of Contents

- [Migration File Conventions](#migration-file-conventions)
- [Project Configuration](#project-configuration)
  - [Sequelize Configuration](#sequelize-configuration)
  - [Database Configuration](#database-configuration)
  - [Migration Logger](#migration-logger)
- [Migration Templates](#migration-templates)
  - [Create Table Migration](#create-table-migration)
  - [Modify Table Migration](#modify-table-migration)
- [Package Scripts](#package-scripts)
- [Database Backup Script](#database-backup-script)
- [Workflow for Adding New Models](#workflow-for-adding-new-models)
- [Production Deployment Workflow](#production-deployment-workflow)
- [Best Practices](#best-practices)

## Migration File Conventions

In Node.js with Sequelize, migrations use timestamp-based versioning:

```
20250519123045-create-user-table.js
```

The format is: `YYYYMMDDHHMMSS-descriptive-name.js`

Sequelize handles this automatically when you generate migrations:

```bash
npx sequelize-cli migration:generate --name create-new-model
```

## Project Configuration

### Sequelize Configuration

Create a `.sequelizerc` file in your project root:

```javascript
const path = require('path');

module.exports = {
  'config': path.resolve('src/config', 'database.js'),
  'models-path': path.resolve('src', 'models'),
  'seeders-path': path.resolve('src', 'seeders'),
  'migrations-path': path.resolve('src', 'migrations')
};
```

### Database Configuration

Create `src/config/database.js`:

```javascript
const config = require('./config');

module.exports = {
  development: {
    username: config.db.user,
    password: config.db.password,
    database: config.db.name,
    host: config.db.host,
    dialect: 'mysql',
    logging: console.log
  },
  test: {
    username: config.db.user,
    password: config.db.password,
    database: config.db.name,
    host: config.db.host,
    dialect: 'mysql',
    logging: false
  },
  production: {
    username: config.db.user,
    password: config.db.password,
    database: config.db.name,
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: false,
    dialectOptions: {
      ssl: {
        rejectUnauthorized: false
      }
    }
  }
};
```

### Migration Logger

Create `src/utils/migration-logger.js`:

```javascript
const logger = require('../config/logger');

// Custom logger for migrations
module.exports = {
  log: (msg) => logger.info(`[MIGRATION] ${msg}`),
  error: (msg) => logger.error(`[MIGRATION] ${msg}`),
  warn: (msg) => logger.warn(`[MIGRATION] ${msg}`)
};
```

## Migration Templates

### Create Table Migration

```javascript
'use strict';

const migrationLogger = require('../utils/migration-logger');

module.exports = {
  async up(queryInterface, Sequelize) {
    migrationLogger.log('Starting migration: create-new-model');
    
    try {
      // Start transaction for atomicity
      await queryInterface.sequelize.transaction(async (transaction) => {
        // Check if table already exists to make migration idempotent
        const tableExists = await queryInterface.showAllTables()
          .then(tables => tables.includes('new_models'));
        
        if (tableExists) {
          migrationLogger.warn('Table new_models already exists, skipping creation');
          return;
        }
        
        // Create the table
        await queryInterface.createTable('new_models', {
          id: {
            allowNull: false,
            autoIncrement: true,
            primaryKey: true,
            type: Sequelize.INTEGER
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false
          },
          // ... other fields
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE
          }
        }, { transaction });
        
        migrationLogger.log('Table new_models created successfully');
      });
      
      return Promise.resolve();
    } catch (error) {
      migrationLogger.error(`Migration failed: ${error.message}`);
      return Promise.reject(error);
    }
  },

  async down(queryInterface, Sequelize) {
    migrationLogger.log('Rolling back migration: create-new-model');
    
    try {
      await queryInterface.dropTable('new_models');
      migrationLogger.log('Table new_models dropped successfully');
      return Promise.resolve();
    } catch (error) {
      migrationLogger.error(`Rollback failed: ${error.message}`);
      return Promise.reject(error);
    }
  }
};
```

### Modify Table Migration

```javascript
'use strict';

const migrationLogger = require('../utils/migration-logger');

module.exports = {
  async up(queryInterface, Sequelize) {
    migrationLogger.log('Starting migration: add-status-to-users');
    
    try {
      await queryInterface.sequelize.transaction(async (transaction) => {
        // Check if column already exists
        const tableDescription = await queryInterface.describeTable('users', { transaction });
        
        if (tableDescription.status) {
          migrationLogger.warn('Column status already exists, skipping');
          return;
        }
        
        // Add column
        await queryInterface.addColumn('users', 'status', {
          type: Sequelize.ENUM('active', 'inactive', 'suspended'),
          defaultValue: 'active',
          allowNull: false
        }, { transaction });
        
        migrationLogger.log('Column status added successfully');
      });
      
      return Promise.resolve();
    } catch (error) {
      migrationLogger.error(`Migration failed: ${error.message}`);
      return Promise.reject(error);
    }
  },

  async down(queryInterface, Sequelize) {
    migrationLogger.log('Rolling back: add-status-to-users');
    
    try {
      await queryInterface.removeColumn('users', 'status');
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_users_status');
      migrationLogger.log('Column status removed successfully');
      return Promise.resolve();
    } catch (error) {
      migrationLogger.error(`Rollback failed: ${error.message}`);
      return Promise.reject(error);
    }
  }
};
```

## Package Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "migrate": "npx sequelize-cli db:migrate",
    "migrate:undo": "npx sequelize-cli db:migrate:undo",
    "migrate:undo:all": "npx sequelize-cli db:migrate:undo:all",
    "migrate:status": "npx sequelize-cli db:migrate:status",
    "migrate:generate": "npx sequelize-cli migration:generate --name",
    
    "migrate:production": "NODE_ENV=production npx sequelize-cli db:migrate",
    "migrate:test": "NODE_ENV=test npx sequelize-cli db:migrate",
    
    "db:backup": "node src/scripts/backup-database.js",
    
    "deploy": "pnpm run db:backup && pnpm run migrate:production && node src/server.js",
    "railway:deploy": "pnpm install && pnpm run migrate && node src/server.js"
  }
}
```

## Database Backup Script

Create `src/scripts/backup-database.js`:

```javascript
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
```

## Workflow for Adding New Models

With this setup, your workflow for adding new models will be:

1. Create your model using Sequelize define/init:
   ```javascript
   // In your models directory
   module.exports = (sequelize, DataTypes) => {
     const NewModel = sequelize.define('NewModel', {
       // attributes
     });
     return NewModel;
   };
   ```

2. Generate a migration file:
   ```bash
   pnpm run migrate:generate create-new-model
   ```

3. Edit the generated migration file with proper creation/rollback logic

4. Test the migration locally:
   ```bash
   pnpm run migrate
   ```

5. If successful, commit both the model and migration files

## Production Deployment Workflow

For Railway or similar platforms:

1. Set the start command to `pnpm run railway:deploy`

2. This will:
   - Install dependencies
   - Run pending migrations
   - Start the application server

3. For the first deployment with an existing app:
   - You may need to set `ALLOW_DB_SYNC=true` temporarily
   - After tables are created, migrate to the migration-based workflow
   - Remove the `ALLOW_DB_SYNC` environment variable

## Best Practices

### 1. Automation
- Migrations run automatically as part of CI/CD
- Use the same migration scripts in all environments

### 2. Separation of Concerns
- Migration scripts run before application code
- Application doesn't modify schema at runtime
- Disable `ALLOW_DB_SYNC` in production

### 3. Safety Mechanisms
- All migrations use transactions for atomicity
- Migrations are idempotent (can run multiple times safely)
- Check for existing tables/columns before creation
- Database backups before migrations

### 4. Monitoring
- Custom logging for migration events
- Track migration status with `migrate:status`

### 5. Rollback Plans
- Every migration has a `down` method
- Verify rollbacks work in development before deploying

### 6. Advanced Practices
- Keep migrations small and focused
- Test migrations in staging environments
- Make schema changes backward compatible when possible