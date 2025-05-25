// scripts/check-database-config.js
/**
 * Database Configuration Checker
 * Validates database configuration and connection
 */

const path = require('path');

async function checkDatabaseConfig() {
  console.log('🔍 Checking Database Configuration');
  console.log('=================================');
  
  try {
    // Step 1: Check config files
    console.log('\n📋 Step 1: Checking configuration files...');
    
    const configPath = path.join(__dirname, '../src/config/database.js');
    console.log(`Config path: ${configPath}`);
    
    let config;
    try {
      config = require('../src/config/database');
      console.log('✅ Database config loaded successfully');
      
      console.log('\n📊 Configuration details:');
      console.log(`   • Host: ${config.host}`);
      console.log(`   • Port: ${config.port}`);
      console.log(`   • Database: ${config.database}`);
      console.log(`   • Username: ${config.username}`);
      console.log(`   • Dialect: ${config.dialect}`);
      console.log(`   • Timezone: ${config.timezone || 'not set'}`);
      
    } catch (error) {
      console.error(`❌ Failed to load database config: ${error.message}`);
      return;
    }
    
    // Step 2: Test Sequelize connection
    console.log('\n🔗 Step 2: Testing Sequelize connection...');
    
    const Sequelize = require('sequelize');
    const sequelize = new Sequelize(
      config.database,
      config.username,
      config.password,
      {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        logging: false,
        pool: config.pool,
        dialectOptions: config.dialectOptions,
        timezone: config.timezone,
      }
    );
    
    try {
      await sequelize.authenticate();
      console.log('✅ Database connection successful');
      
      // Test a simple query
      const [results] = await sequelize.query('SELECT VERSION() as version, DATABASE() as current_database');
      console.log(`✅ Database query successful:`);
      console.log(`   • MySQL Version: ${results[0].version}`);
      console.log(`   • Current Database: ${results[0].database}`);
      
    } catch (error) {
      console.error(`❌ Database connection failed: ${error.message}`);
      
      // Provide specific guidance based on error
      if (error.original?.code === 'ECONNREFUSED') {
        console.log('\n💡 Troubleshooting tips:');
        console.log('   • Make sure MySQL server is running');
        console.log('   • Check if the host and port are correct');
        console.log('   • Verify firewall settings');
      } else if (error.original?.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log('\n💡 Troubleshooting tips:');
        console.log('   • Check username and password');
        console.log('   • Verify user permissions');
        console.log('   • Ensure user has access to the database');
      }
      
      return;
    } finally {
      await sequelize.close();
    }
    
    // Step 3: Test models loading
    console.log('\n📦 Step 3: Testing models loading...');
    
    try {
      // Clear require cache to get fresh models
      const modelsIndexPath = path.join(__dirname, '../src/models/index.js');
      delete require.cache[require.resolve(modelsIndexPath)];
      
      const db = require('../src/models');
      
      console.log('✅ Models loaded successfully');
      
      // Count actual models (exclude utility functions)
      const modelNames = Object.keys(db).filter(key => 
        key !== 'sequelize' && 
        key !== 'Sequelize' && 
        key !== 'isHealthy' &&
        typeof db[key] === 'object' &&
        db[key].tableName &&
        typeof db[key].sync === 'function'
      );
      
      console.log(`📊 Models found: ${modelNames.length}`);
      if (modelNames.length > 0) {
        console.log('   Model details:');
        modelNames.forEach(name => {
          const model = db[name];
          console.log(`   • ${name} -> ${model.tableName} (${Object.keys(model.rawAttributes).length} attributes)`);
        });
      } else {
        console.log('❌ No valid models found!');
      }
      
      // Test database setup utility
      console.log('\n🛠️ Step 4: Testing database setup utility...');
      
      const { createDatabaseSetupManager } = require('../src/utils/database-setup.util');
      const manager = createDatabaseSetupManager();
      
      console.log(`Manager models detected: ${Object.keys(manager.models).length}`);
      
      if (Object.keys(manager.models).length > 0) {
        console.log('✅ Database setup utility working correctly!');
      } else {
        console.log('❌ Database setup utility still not detecting models');
      }
      
    } catch (error) {
      console.error(`❌ Models loading failed: ${error.message}`);
      console.error('Stack trace:', error.stack);
    }
    
  } catch (error) {
    console.error(`❌ Configuration check failed: ${error.message}`);
  }
  
  console.log('\n🏁 Configuration check completed');
  console.log('=================================');
}

// Run if executed directly
if (require.main === module) {
  checkDatabaseConfig().catch(console.error);
}

module.exports = { checkDatabaseConfig };