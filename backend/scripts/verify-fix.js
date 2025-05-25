// scripts/verify-fix.js
/**
 * Quick verification script to test the model detection fix
 */

async function verifyFix() {
  console.log('🧪 Verifying Model Detection Fix');
  console.log('================================');

  try {
    // Test 1: Check what types of objects we have in db
    console.log('\n📦 Test 1: Analyzing db object structure...');
    const db = require('../src/models');

    console.log(`Total keys in db: ${Object.keys(db).length}`);

    const analysis = {};
    Object.keys(db).forEach((key) => {
      const item = db[key];
      const type = typeof item;

      if (key === 'sequelize' || key === 'Sequelize' || key === 'isHealthy') {
        analysis[key] = `${type} (utility)`;
      } else if (type === 'function') {
        // Check if it's a Sequelize model constructor
        const hasTableName = item.tableName ? ` -> ${item.tableName}` : '';
        const hasRawAttributes = !!item.rawAttributes;
        const hasMethods = !!(item.sync && item.findOne && item.create);

        analysis[
          key
        ] = `${type}${hasTableName} (rawAttributes: ${hasRawAttributes}, methods: ${hasMethods})`;
      } else {
        analysis[key] = `${type}`;
      }
    });

    console.log('\n📊 Object Analysis:');
    Object.entries(analysis).forEach(([key, info]) => {
      console.log(`   ${key}: ${info}`);
    });

    // Test 2: Test the updated database setup utility
    console.log('\n🛠️ Test 2: Testing updated database setup utility...');

    // Clear cache to get fresh instance
    const setupUtilPath = require.resolve('../src/utils/database-setup.util');
    delete require.cache[setupUtilPath];

    const { createDatabaseSetupManager } = require('../src/utils/database-setup.util');
    const manager = createDatabaseSetupManager();

    console.log(`\n✅ Results:`);
    console.log(`   Manager created: ✅`);
    console.log(`   Models detected: ${Object.keys(manager.models).length}`);

    if (Object.keys(manager.models).length > 0) {
      console.log('\n🎉 SUCCESS! Model detection is now working!');
      console.log('\n📋 Detected models:');
      Object.keys(manager.models).forEach((name) => {
        const model = manager.models[name];
        console.log(`   • ${name} -> ${model.tableName}`);
      });

      // Test 3: Quick health check
      console.log('\n🏥 Test 3: Quick health check...');
      try {
        const health = await manager.getHealthStatus();
        console.log(`   Database: ${health.database.status}`);
        console.log(
          `   Models: ${health.models.status} (${health.models.details.totalModels} detected)`
        );
        console.log(`   Performance: ${health.performance.status}`);

        console.log('\n🚀 All systems are working correctly!');
      } catch (healthError) {
        console.log(`   Health check failed: ${healthError.message}`);
      }
    } else {
      console.log('\n❌ STILL FAILING: No models detected');

      // Additional debugging
      console.log('\n🔍 Additional Debug Info:');
      console.log(`   DB keys: ${Object.keys(db).join(', ')}`);
      console.log(`   Manager sequelize: ${!!manager.sequelize}`);
      console.log(`   Manager queryInterface: ${!!manager.queryInterface}`);
    }
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    console.error('Stack trace:', error.stack);
  }

  console.log('\n🏁 Verification completed');
  console.log('================================');
}

// Manual model validation
function testModelValidation() {
  console.log('\n🔍 Manual Model Validation');
  console.log('---------------------------');

  const db = require('../src/models');

  // Test the User model specifically
  const User = db.User;
  if (User) {
    console.log(`\nUser model analysis:`);
    console.log(`   Type: ${typeof User}`);
    console.log(`   Name: ${User.name}`);
    console.log(`   Table: ${User.tableName}`);
    console.log(`   Has rawAttributes: ${!!User.rawAttributes}`);
    console.log(`   Has sync method: ${typeof User.sync === 'function'}`);
    console.log(`   Has findOne method: ${typeof User.findOne === 'function'}`);
    console.log(`   Has create method: ${typeof User.create === 'function'}`);
    console.log(
      `   Attributes count: ${User.rawAttributes ? Object.keys(User.rawAttributes).length : 0}`
    );
  }
}

// Run verification
if (require.main === module) {
  verifyFix()
    .then(() => {
      testModelValidation();
    })
    .catch(console.error);
}

module.exports = { verifyFix, testModelValidation };
