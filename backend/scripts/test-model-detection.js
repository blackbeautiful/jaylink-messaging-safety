// scripts/test-model-detection.js
/**
 * Test Model Detection Script
 * Quick test to verify model detection is working
 */

async function testModelDetection() {
    console.log('🧪 Testing Model Detection');
    console.log('==========================');
    
    try {
      // Test 1: Load models directly
      console.log('\n📦 Test 1: Loading models directly...');
      const db = require('../src/models');
      
      console.log(`Available keys: ${Object.keys(db).length}`);
      
      // Filter to get actual models
      const modelKeys = Object.keys(db).filter(key => 
        key !== 'sequelize' && 
        key !== 'Sequelize' && 
        key !== 'isHealthy' &&
        db[key] &&
        typeof db[key] === 'object' &&
        db[key].tableName &&
        typeof db[key].sync === 'function'
      );
      
      console.log(`✅ Direct models found: ${modelKeys.length}`);
      console.log('Models:', modelKeys.join(', '));
      
      // Test 2: Test database setup utility
      console.log('\n🛠️ Test 2: Testing database setup utility...');
      
      // Clear the require cache to get fresh instance
      const setupUtilPath = require.resolve('../src/utils/database-setup.util');
      delete require.cache[setupUtilPath];
      
      const { createDatabaseSetupManager } = require('../src/utils/database-setup.util');
      const manager = createDatabaseSetupManager();
      
      console.log(`Manager models detected: ${Object.keys(manager.models).length}`);
      
      if (Object.keys(manager.models).length > 0) {
        console.log('✅ SUCCESS: Database setup utility can now detect models!');
        
        console.log('\n📋 Detected models:');
        Object.keys(manager.models).forEach(name => {
          const model = manager.models[name];
          console.log(`   • ${name} -> ${model.tableName}`);
        });
        
        // Test 3: Try health check
        console.log('\n🏥 Test 3: Testing health check...');
        const health = await manager.getHealthStatus();
        console.log(`Database health: ${health.database.status}`);
        console.log(`Models health: ${health.models.status} (${health.models.details.totalModels} models)`);
        
      } else {
        console.log('❌ FAIL: Database setup utility still cannot detect models');
        
        // Debug information
        console.log('\n🔍 Debug Information:');
        console.log('DB object structure:');
        Object.keys(db).forEach(key => {
          const item = db[key];
          if (key !== 'sequelize' && key !== 'Sequelize') {
            console.log(`   ${key}: ${typeof item} ${item?.tableName ? `-> ${item.tableName}` : ''}`);
          }
        });
      }
      
    } catch (error) {
      console.error('❌ Test failed:', error.message);
      console.error('Stack trace:', error.stack);
    }
    
    console.log('\n🏁 Test completed');
    console.log('==========================');
  }
  
  // Quick manual validation function
  function validateModel(model, name) {
    const checks = {
      isObject: typeof model === 'object' && model !== null,
      hasTableName: !!(model && model.tableName),
      hasRawAttributes: !!(model && model.rawAttributes),
      hasSyncMethod: !!(model && typeof model.sync === 'function'),
      hasFindOneMethod: !!(model && typeof model.findOne === 'function'),
      hasCreateMethod: !!(model && typeof model.create === 'function')
    };
    
    const valid = Object.values(checks).every(Boolean);
    
    console.log(`\n🔍 Model Validation: ${name}`);
    Object.entries(checks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });
    console.log(`   Overall: ${valid ? '✅ VALID' : '❌ INVALID'}`);
    
    return valid;
  }
  
  // Run test if executed directly
  if (require.main === module) {
    testModelDetection().catch(console.error);
  }
  
  module.exports = { testModelDetection, validateModel };