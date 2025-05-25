// scripts/diagnose-models.js
/**
 * Model Detection Diagnostic Script
 * Run this to troubleshoot model detection issues
 * 
 * Usage: node scripts/diagnose-models.js
 */

const path = require('path');
const fs = require('fs');

// Diagnostic function
async function diagnoseModels() {
  console.log('🔍 Starting Model Detection Diagnostics');
  console.log('=====================================');
  
  try {
    // Step 1: Check models directory
    console.log('\n📁 Step 1: Checking models directory...');
    const modelsPath = path.join(__dirname, '../src/models');
    console.log(`Models path: ${modelsPath}`);
    
    if (!fs.existsSync(modelsPath)) {
      console.error(`❌ Models directory not found: ${modelsPath}`);
      return;
    }
    
    const modelFiles = fs.readdirSync(modelsPath)
      .filter(file => file.endsWith('.js'));
    
    console.log(`✅ Found ${modelFiles.length} JavaScript files:`);
    modelFiles.forEach(file => console.log(`   • ${file}`));
    
    // Step 2: Test model loading
    console.log('\n🔄 Step 2: Testing model loading...');
    
    try {
      // Test requiring the models/index.js
      console.log('Loading models/index.js...');
      const db = require('../src/models');
      
      console.log('✅ Models index loaded successfully');
      console.log(`Available keys in db object: ${Object.keys(db).length}`);
      
      // Analyze db object
      const dbKeys = Object.keys(db);
      console.log('\n📊 Database object analysis:');
      
      const modelLikeKeys = [];
      const nonModelKeys = [];
      
      dbKeys.forEach(key => {
        const item = db[key];
        
        if (key === 'sequelize' || key === 'Sequelize') {
          nonModelKeys.push(`${key} (Sequelize instance)`);
        } else if (typeof item === 'object' && item !== null) {
          if (item.tableName && typeof item.sync === 'function') {
            modelLikeKeys.push(`${key} -> ${item.tableName} ✅`);
          } else if (item.tableName) {
            modelLikeKeys.push(`${key} -> ${item.tableName} ⚠️ (no sync method)`);
          } else {
            nonModelKeys.push(`${key} (object without tableName)`);
          }
        } else {
          nonModelKeys.push(`${key} (${typeof item})`);
        }
      });
      
      console.log('\n🎯 Model-like objects:');
      if (modelLikeKeys.length > 0) {
        modelLikeKeys.forEach(item => console.log(`   • ${item}`));
      } else {
        console.log('   ❌ No model-like objects found!');
      }
      
      console.log('\n📦 Other objects:');
      nonModelKeys.forEach(item => console.log(`   • ${item}`));
      
      // Step 3: Test individual model files
      console.log('\n🔍 Step 3: Testing individual model files...');
      
      const Sequelize = require('sequelize');
      const config = require('../src/config/database');
      
      const sequelize = new Sequelize(
        config.database,
        config.username,
        config.password,
        {
          host: config.host,
          port: config.port,
          dialect: config.dialect,
          logging: false, // Disable logging for this test
        }
      );
      
      const testModels = {};
      
      for (const file of modelFiles) {
        if (file === 'index.js' || file === 'compatibility.js') continue;
        
        try {
          const modelPath = path.join(modelsPath, file);
          const modelDefinition = require(modelPath);
          
          if (typeof modelDefinition === 'function') {
            const model = modelDefinition(sequelize, Sequelize.DataTypes);
            
            if (model && model.tableName) {
              testModels[model.name || path.basename(file, '.js')] = model;
              console.log(`   ✅ ${file} -> ${model.name} (${model.tableName})`);
            } else {
              console.log(`   ❌ ${file} -> Invalid model definition`);
            }
          } else {
            console.log(`   ❌ ${file} -> Not a function export`);
          }
        } catch (error) {
          console.log(`   ❌ ${file} -> Error: ${error.message}`);
        }
      }
      
      console.log(`\n✅ Successfully loaded ${Object.keys(testModels).length} models individually`);
      
      // Step 4: Test database connection
      console.log('\n🔗 Step 4: Testing database connection...');
      
      try {
        await db.sequelize.authenticate();
        console.log('✅ Database connection successful');
        
        // Test a simple query
        const result = await db.sequelize.query('SELECT 1 as test');
        console.log('✅ Database query test successful');
        
      } catch (error) {
        console.log(`❌ Database connection failed: ${error.message}`);
      }
      
      // Step 5: Test database setup utility
      console.log('\n🛠️ Step 5: Testing database setup utility...');
      
      try {
        const { createDatabaseSetupManager } = require('../src/utils/database-setup.util');
        const manager = createDatabaseSetupManager();
        
        console.log(`Manager created successfully`);
        console.log(`Models detected by manager: ${Object.keys(manager.models).length}`);
        
        if (Object.keys(manager.models).length > 0) {
          console.log('✅ Database setup utility can detect models!');
          console.log('Models found:');
          Object.keys(manager.models).forEach(key => {
            console.log(`   • ${key} -> ${manager.models[key].tableName}`);
          });
        } else {
          console.log('❌ Database setup utility cannot detect models');
        }
        
      } catch (error) {
        console.log(`❌ Database setup utility test failed: ${error.message}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to load models: ${error.message}`);
      console.error('Stack trace:', error.stack);
    }
    
  } catch (error) {
    console.error(`❌ Diagnostic failed: ${error.message}`);
  }
  
  console.log('\n🏁 Diagnostics completed');
  console.log('=====================================');
}

// Helper function to check model structure
function analyzeModelStructure(model, name) {
  console.log(`\n🔍 Analyzing model: ${name}`);
  
  const analysis = {
    hasTableName: !!model.tableName,
    hasRawAttributes: !!model.rawAttributes,
    hasSyncMethod: typeof model.sync === 'function',
    hasFindOneMethod: typeof model.findOne === 'function',
    hasCreateMethod: typeof model.create === 'function',
    attributeCount: model.rawAttributes ? Object.keys(model.rawAttributes).length : 0,
    associations: model.associations ? Object.keys(model.associations).length : 0
  };
  
  console.log('   Properties:');
  Object.entries(analysis).forEach(([key, value]) => {
    const status = typeof value === 'boolean' ? (value ? '✅' : '❌') : `(${value})`;
    console.log(`   • ${key}: ${status}`);
  });
  
  return analysis;
}

// Run diagnostics if this file is executed directly
if (require.main === module) {
  diagnoseModels().catch(console.error);
}

module.exports = { diagnoseModels, analyzeModelStructure };