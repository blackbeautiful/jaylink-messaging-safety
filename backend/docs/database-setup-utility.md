# Database Setup Utility Documentation

## Overview

The Database Setup Utility is an enterprise-grade database management system designed for Node.js applications using Sequelize ORM. It provides automated database initialization, schema synchronization, index optimization, and comprehensive health monitoring.

## Features

### 🚀 **Core Capabilities**
- **Dynamic Model Detection**: Automatically discovers and validates Sequelize models
- **Intelligent Index Management**: Removes duplicate indexes and optimizes database performance
- **Schema Synchronization**: Handles database migrations and schema updates
- **Health Monitoring**: Real-time database status and performance metrics
- **Error Recovery**: Advanced error handling with graceful degradation
- **Environment Awareness**: Different behaviors for development, staging, and production

### 🛠️ **Advanced Features**
- **Aggressive Index Cleanup**: Automatically resolves MySQL's 64-index limit issues
- **Foreign Key Constraint Management**: Handles complex relationship dependencies
- **Migration Strategy Detection**: Supports both migration files and schema sync
- **Performance Monitoring**: Query latency and connection health tracking
- **Comprehensive Logging**: Detailed insights into all database operations

## Installation

### Prerequisites
- Node.js 16+ 
- MySQL 5.7+ or 8.0+
- Sequelize 6+

### Dependencies
```json
{
  "sequelize": "^6.x.x",
  "mysql2": "^3.x.x",
  "umzug": "^3.x.x" // Optional: for migration files
}
```

### Setup
1. Copy the `database-setup.util.js` file to your `src/utils/` directory
2. Ensure you have the `api-error.util.js` for error handling
3. Configure your database connection in your config files

## Configuration

### Database Configuration
```javascript
// config/database.js
module.exports = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'myapp_db',
  dialect: 'mysql',
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
  timezone: '+00:00'
};
```

### Environment Variables
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password  
DB_NAME=your_database

# Optional: Migration Strategy
USE_MIGRATION_FILES=false  # Set to true to use migration files
ALLOW_DB_SYNC=true         # Allow schema sync in production (not recommended)
```

## Usage

### Basic Integration

#### In your server startup (server.js):
```javascript
const { setupDatabase } = require('./src/utils/database-setup.util');

async function startServer() {
  try {
    // Setup database before starting server
    const dbSuccess = await setupDatabase();
    
    if (dbSuccess || process.env.NODE_ENV !== 'production') {
      // Continue with server startup
      app.listen(port);
    } else {
      logger.error('Database setup failed in production');
      process.exit(1);
    }
  } catch (error) {
    logger.error('Server startup failed:', error);
    process.exit(1);
  }
}
```

#### Standalone Usage:
```javascript
const { createDatabaseSetupManager } = require('./src/utils/database-setup.util');

async function initializeDatabase() {
  const manager = createDatabaseSetupManager();
  const result = await manager.setupDatabase();
  
  if (result.success) {
    console.log('✅ Database setup completed');
  } else {
    console.error('❌ Database setup failed');
  }
}
```

### Health Monitoring

```javascript
const { getDatabaseHealth } = require('./src/utils/database-setup.util');

// Get comprehensive health status
const health = await getDatabaseHealth();
console.log('Database Health:', health);

// Example health response:
{
  database: { 
    status: 'healthy', 
    details: { connectionTime: 45, version: '8.0.28' }
  },
  models: { 
    status: 'healthy', 
    details: { totalModels: 14, loadedModels: [...] }
  },
  indexes: { 
    status: 'healthy', 
    details: { totalIndexes: 63, duplicateIndexes: 0 }
  },
  performance: { 
    status: 'healthy', 
    details: { avgQueryTime: 23 }
  }
}
```

### Index Management

```javascript
const { optimizeTableIndexes, emergencyIndexCleanup } = require('./src/utils/database-setup.util');

// Optimize specific table
const result = await optimizeTableIndexes('users');
console.log(`Optimized ${result.removedIndexes} indexes`);

// Emergency cleanup for all tables
const totalCleaned = await emergencyIndexCleanup();
console.log(`Emergency cleanup removed ${totalCleaned} indexes`);
```

### Table Information

```javascript
const { getTableInfo } = require('./src/utils/database-setup.util');

// Get info for specific table
const userTableInfo = await getTableInfo('users');

// Get info for all tables
const allTables = await getTableInfo();
```

## API Reference

### Main Functions

#### `setupDatabase(): Promise<boolean>`
Main database setup function that orchestrates the entire initialization process.

**Returns**: Promise resolving to success status

#### `createDatabaseSetupManager(): DatabaseSetupManager`
Creates a new instance of the DatabaseSetupManager class.

**Returns**: DatabaseSetupManager instance

#### `getDatabaseHealth(): Promise<Object>`
Gets comprehensive database health status.

**Returns**: Promise resolving to health status object

### Utility Functions

#### `optimizeTableIndexes(tableName: string): Promise<Object>`
Optimizes indexes for a specific table.

**Parameters**:
- `tableName` (string): Name of the table to optimize

**Returns**: Promise resolving to optimization results

#### `emergencyIndexCleanup(): Promise<number>`
Performs emergency cleanup of excessive indexes across all tables.

**Returns**: Promise resolving to number of indexes removed

#### `getTableInfo(tableName?: string): Promise<Object>`
Gets detailed information about database tables.

**Parameters**:
- `tableName` (string, optional): Specific table name, or all tables if omitted

**Returns**: Promise resolving to table information

#### `fixSeedingConstraints(): Promise<boolean>`
Fixes foreign key constraint issues during data seeding.

**Returns**: Promise resolving to success status

## Configuration Options

### Migration Strategies

The utility automatically determines the best migration strategy:

1. **Migration Files** (`migration-files`)
   - Used in production when migration files are available
   - Provides version control for schema changes
   - Recommended for production environments

2. **Schema Sync** (`schema-sync`)
   - Used in development for rapid iteration
   - Automatically syncs model definitions with database
   - Not recommended for production

3. **Hybrid** (`hybrid`)
   - Combines migration files with schema sync
   - Used in development when migration files exist
   - Provides flexibility during development

### Environment-Specific Behavior

#### Development
- Aggressive index cleanup enabled
- Schema synchronization with `alter: true`
- Detailed debug logging
- Graceful error handling (continues on non-critical errors)

#### Production
- Conservative approach to schema changes
- Migration files preferred over schema sync
- Critical error handling (stops on important failures)
- Performance-optimized operations

#### Test
- Fast schema sync for speed
- Minimal logging
- In-memory operations where possible

## Troubleshooting

### Common Issues

#### 1. "Too Many Keys" Error
```
Error: ER_TOO_MANY_KEYS: Too many keys specified; max 64 keys allowed
```

**Solution**: The utility automatically handles this by removing duplicate indexes.

```javascript
// Manual fix if needed
const { emergencyIndexCleanup } = require('./src/utils/database-setup.util');
await emergencyIndexCleanup();
```

#### 2. Model Detection Issues
```
⚠️ No models detected for synchronization
```

**Solution**: Check your models/index.js file and ensure models are properly exported.

```javascript
// Verify models are loaded correctly
const db = require('./src/models');
console.log('Available models:', Object.keys(db));
```

#### 3. Foreign Key Constraint Errors
```
Cannot add or update a child row: a foreign key constraint fails
```

**Solution**: Use the constraint fixing utility.

```javascript
const { fixSeedingConstraints } = require('./src/utils/database-setup.util');
await fixSeedingConstraints();
```

#### 4. Connection Issues
```
ECONNREFUSED: Connection refused
```

**Solutions**:
- Verify database server is running
- Check host and port configuration
- Ensure firewall allows connections
- Verify credentials

### Debug Mode

Enable detailed logging for troubleshooting:

```javascript
// Set log level to debug
process.env.LOG_LEVEL = 'debug';

// Or in your logger configuration
logger.level = 'debug';
```

### Health Check Endpoint

Add a health check endpoint to your API:

```javascript
// routes/health.js
const { getDatabaseHealth } = require('../utils/database-setup.util');

router.get('/health/database', async (req, res) => {
  try {
    const health = await getDatabaseHealth();
    res.json({
      success: true,
      health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

## Performance Optimization

### Index Management Best Practices

1. **Regular Monitoring**
   ```javascript
   // Monitor index health regularly
   setInterval(async () => {
     const health = await getDatabaseHealth();
     if (health.indexes.status === 'warning') {
       logger.warn('Index optimization needed');
       await optimizeTableIndexes();
     }
   }, 24 * 60 * 60 * 1000); // Daily check
   ```

2. **Proactive Cleanup**
   ```javascript
   // Clean up indexes during low-traffic hours
   const schedule = require('node-cron');
   
   schedule.schedule('0 2 * * *', async () => {
     logger.info('Running scheduled index optimization');
     await emergencyIndexCleanup();
   });
   ```

### Query Performance

Monitor query performance using the built-in performance tracking:

```javascript
const manager = createDatabaseSetupManager();
const perfStats = await manager.getPerformanceStatistics();

if (perfStats.avgQueryTime > 100) {
  logger.warn('High average query time detected:', perfStats);
}
```

## Migration from Legacy Systems

### Upgrading from Old Database Setup

1. **Backup your current setup**
   ```bash
   cp src/utils/database-setup.util.js src/utils/database-setup.util.js.backup
   ```

2. **Replace with new utility**
   - Copy the new `database-setup.util.js`
   - Update any custom configurations

3. **Test in development**
   ```javascript
   // Run setup in development first
   const result = await setupDatabase();
   console.log('Setup result:', result);
   ```

4. **Verify model detection**
   ```javascript
   const manager = createDatabaseSetupManager();
   console.log('Models detected:', Object.keys(manager.models).length);
   ```

### Backward Compatibility

The utility maintains backward compatibility with existing function signatures:
- `setupDatabase()` - Main setup function
- `verifyDatabaseIntegrity()` - Now returns health status
- `cleanupExcessiveIndexes()` - Enhanced index cleanup

## Security Considerations

### Database Credentials
- Store credentials in environment variables
- Use connection pooling for production
- Enable SSL/TLS for remote connections

```javascript
// Secure configuration example
const config = {
  host: process.env.DB_HOST,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 20,
    min: 5,
    acquire: 30000,
    idle: 10000
  }
};
```

### Production Safeguards
- The utility automatically prevents destructive operations in production
- Schema sync with `force: true` is never allowed
- Comprehensive logging for audit trails

## Best Practices

### 1. Model Organization
```javascript
// Keep models organized and well-documented
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    // Model definition
  }, {
    tableName: 'users',
    indexes: [
      // Only define essential indexes
      { fields: ['email'], unique: true },
      { fields: ['status'] }
    ]
  });
  
  return User;
};
```

### 2. Error Handling
```javascript
// Always handle database setup errors appropriately
try {
  const success = await setupDatabase();
  if (!success && process.env.NODE_ENV === 'production') {
    logger.error('Critical database setup failure');
    process.exit(1);
  }
} catch (error) {
  logger.error('Database setup error:', error);
  // Handle based on environment
}
```

### 3. Monitoring
```javascript
// Implement comprehensive monitoring
const monitor = async () => {
  const health = await getDatabaseHealth();
  
  // Alert on issues
  if (health.database.status !== 'healthy') {
    await sendAlert('Database health issue detected', health);
  }
  
  // Log metrics
  logger.info('Database metrics:', {
    models: health.models.details.totalModels,
    indexes: health.indexes.details.totalIndexes,
    performance: health.performance.details.avgQueryTime
  });
};

setInterval(monitor, 5 * 60 * 1000); // Every 5 minutes
```

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Monitor index health and performance
2. **Monthly**: Review and optimize slow queries
3. **Quarterly**: Full database health assessment
4. **Annually**: Review and update migration strategies

### Logging and Monitoring

The utility provides comprehensive logging at different levels:
- **ERROR**: Critical failures that require immediate attention
- **WARN**: Issues that should be addressed but don't block operations
- **INFO**: Important operational information
- **DEBUG**: Detailed information for troubleshooting

### Version Compatibility

- **Node.js**: 16.x, 18.x, 20.x
- **Sequelize**: 6.x
- **MySQL**: 5.7, 8.0, 8.1
- **MariaDB**: 10.3+

## Contributing

When contributing to the database setup utility:

1. Follow existing code patterns and documentation
2. Add comprehensive tests for new features
3. Update documentation for any API changes
4. Consider backward compatibility
5. Test across different database versions

## License

This utility is designed to be reusable across projects. Ensure you comply with your organization's code sharing policies when reusing in different applications.