// backend/test/sms-integration.test.js - SMS Provider Integration Test
const axios = require('axios');
const config = require('../src/config/config');
const smsProviderService = require('../src/services/sms-provider.service');
const logger = require('../src/config/logger');

/**
 * SMS Integration Test Suite
 * Tests the SMS provider integration with both primary and backup providers
 */

// Test configuration
const TEST_CONFIG = {
  // Use test phone numbers that won't actually send SMS
  testNumbers: ['2348012345678', '2348087654321'],
  testMessage: 'Hello from JayLink SMS Platform - This is a test message',
  testSender: 'JAYLINK',

  // Test scenarios
  scenarios: [
    'single_recipient',
    'multiple_recipients',
    'international_number',
    'invalid_number',
    'long_message',
    'special_characters',
  ],
};

/**
 * Main test runner
 */
async function runSMSIntegrationTests() {
  console.log('🚀 Starting SMS Integration Tests...\n');

  // Check configuration first
  const configCheck = await testConfiguration();
  if (!configCheck.success) {
    console.error('❌ Configuration test failed:', configCheck.error);
    return;
  }

  console.log('✅ Configuration test passed\n');

  // Test provider connectivity
  const connectivityCheck = await testProviderConnectivity();
  if (!connectivityCheck.success) {
    console.error('❌ Connectivity test failed:', connectivityCheck.error);
    return;
  }

  console.log('✅ Provider connectivity test passed\n');

  // Run scenario tests
  const scenarioResults = await runScenarioTests();

  // Print summary
  printTestSummary(scenarioResults);
}

/**
 * Test SMS provider configuration
 */
async function testConfiguration() {
  try {
    console.log('🔧 Testing SMS Provider Configuration...');

    const checks = {
      'Primary Provider Name': config.smsProvider.provider,
      'Primary Provider Username': config.smsProvider.username ? '✓ Set' : '❌ Missing',
      'Primary Provider Password': config.smsProvider.password ? '✓ Set' : '❌ Missing',
      'Primary Provider Base URL': config.smsProvider.baseUrl,
      'Default Sender ID': config.smsProvider.defaultSender,
      'Backup Provider Enabled': config.smsProvider.backup.enabled ? 'Yes' : 'No',
      'Backup Provider API Key': config.smsProvider.backup.enabled
        ? config.smsProvider.backup.apiKey
          ? '✓ Set'
          : '❌ Missing'
        : 'N/A',
    };

    console.table(checks);

    // Check for critical missing configuration
    const criticalIssues = [];

    if (!config.smsProvider.username) {
      criticalIssues.push('SMS_PROVIDER_USERNAME is required for SMSProvider.com.ng');
    }

    if (!config.smsProvider.password) {
      criticalIssues.push('SMS_PROVIDER_PASSWORD is required for SMSProvider.com.ng');
    }

    if (config.smsProvider.backup.enabled && !config.smsProvider.backup.apiKey) {
      criticalIssues.push('TERMII_API_KEY is required when backup provider is enabled');
    }

    if (criticalIssues.length > 0) {
      return {
        success: false,
        error: 'Critical configuration issues: ' + criticalIssues.join(', '),
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Test provider connectivity and authentication
 */
async function testProviderConnectivity() {
  try {
    console.log('🌐 Testing Provider Connectivity...');

    // Test primary provider health
    const primaryHealth = await smsProviderService.healthCheck();
    console.log(`Primary Provider Health: ${primaryHealth}`);

    if (primaryHealth.includes('unhealthy') && config.env === 'production') {
      return {
        success: false,
        error: `Primary provider is unhealthy: ${primaryHealth}`,
      };
    }

    // Test backup provider if enabled
    if (config.smsProvider.backup.enabled) {
      try {
        // Test Termii connectivity by making a simple request
        const termiiClient = axios.create({
          baseURL: config.smsProvider.backup.baseUrl,
          timeout: 10000,
        });

        // This endpoint doesn't exist but will tell us if the base URL is reachable
        await termiiClient.get('/test', {
          validateStatus: () => true, // Accept any status code
        });

        console.log('Backup Provider (Termii): ✓ Reachable');
      } catch (error) {
        console.log(`Backup Provider (Termii): ⚠️ Warning - ${error.message}`);
      }
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Run all test scenarios
 */
async function runScenarioTests() {
  const results = [];

  for (const scenario of TEST_CONFIG.scenarios) {
    console.log(`\n📱 Testing Scenario: ${scenario.replace('_', ' ').toUpperCase()}`);

    const result = await runScenario(scenario);
    results.push({
      scenario,
      ...result,
    });

    // Add delay between tests to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return results;
}

/**
 * Run individual test scenario
 */
async function runScenario(scenario) {
  try {
    let testData;

    switch (scenario) {
      case 'single_recipient':
        testData = {
          recipients: [TEST_CONFIG.testNumbers[0]],
          message: TEST_CONFIG.testMessage,
          senderId: TEST_CONFIG.testSender,
        };
        break;

      case 'multiple_recipients':
        testData = {
          recipients: TEST_CONFIG.testNumbers,
          message: TEST_CONFIG.testMessage,
          senderId: TEST_CONFIG.testSender,
        };
        break;

      case 'international_number':
        testData = {
          recipients: ['+1234567890'], // US number
          message: TEST_CONFIG.testMessage,
          senderId: TEST_CONFIG.testSender,
        };
        break;

      case 'invalid_number':
        testData = {
          recipients: ['invalid_number'],
          message: TEST_CONFIG.testMessage,
          senderId: TEST_CONFIG.testSender,
        };
        break;

      case 'long_message':
        testData = {
          recipients: [TEST_CONFIG.testNumbers[0]],
          message:
            'This is a very long message that exceeds 160 characters to test SMS segmentation. '.repeat(
              5
            ),
          senderId: TEST_CONFIG.testSender,
        };
        break;

      case 'special_characters':
        testData = {
          recipients: [TEST_CONFIG.testNumbers[0]],
          message:
            'Special chars test: ; / ^ { } \\ [ ~ ] | € \' " ``` - These reduce SMS segment length to 70 chars',
          senderId: TEST_CONFIG.testSender,
        };
        break;

      default:
        throw new Error(`Unknown scenario: ${scenario}`);
    }

    console.log(`   Recipients: ${testData.recipients.join(', ')}`);
    console.log(`   Message Length: ${testData.message.length} characters`);
    console.log(`   Sender: ${testData.senderId}`);

    // Calculate cost
    const estimatedCost = smsProviderService.calculateMessageCost(
      testData.recipients.length,
      testData.message,
      scenario === 'international_number'
    );

    console.log(`   Estimated Cost: ₦${estimatedCost}`);

    // Send SMS (will be simulated in development mode)
    const startTime = Date.now();
    const result = await smsProviderService.sendSms(
      testData.recipients,
      testData.message,
      testData.senderId
    );
    const duration = Date.now() - startTime;

    console.log(`   Result: ${result.status} (${duration}ms)`);
    console.log(`   Message ID: ${result.messageId}`);
    console.log(`   Provider: ${result.provider}`);
    console.log(`   Accepted: ${result.accepted}, Rejected: ${result.rejected}`);

    // Test status checking (only for valid scenarios)
    if (scenario !== 'invalid_number' && result.messageId) {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const statusResult = await smsProviderService.getMessageStatus(result.messageId);
      console.log(`   Status Check: ${statusResult.status}`);
    }

    return {
      success: true,
      result,
      estimatedCost,
      duration,
    };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Print test summary
 */
function printTestSummary(results) {
  console.log('\n📊 TEST SUMMARY');
  console.log('================');

  const successful = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((successful / results.length) * 100).toFixed(1)}%`);

  console.log('\n📋 DETAILED RESULTS:');
  results.forEach((result) => {
    const status = result.success ? '✅' : '❌';
    const info = result.success ? `${result.duration}ms, ₦${result.estimatedCost}` : result.error;

    console.log(`${status} ${result.scenario.replace('_', ' ')}: ${info}`);
  });

  if (failed > 0) {
    console.log('\n⚠️  RECOMMENDATIONS:');

    results
      .filter((r) => !r.success)
      .forEach((result) => {
        console.log(`- Fix ${result.scenario}: ${result.error}`);
      });
  }

  console.log('\n🎉 SMS Integration Tests Completed!');
}

/**
 * Utility function to test SMS provider manually
 */
async function testManualSMS(phoneNumber, message) {
  try {
    console.log(`\n📲 Sending manual test SMS to ${phoneNumber}...`);

    const result = await smsProviderService.sendSms([phoneNumber], message, 'TEST');

    console.log('✅ SMS sent successfully!');
    console.log('Result:', result);

    return result;
  } catch (error) {
    console.error('❌ Failed to send SMS:', error.message);
    throw error;
  }
}

// Export functions for use in other files
module.exports = {
  runSMSIntegrationTests,
  testManualSMS,
  testConfiguration,
  testProviderConnectivity,
};

// Run tests if this file is executed directly
if (require.main === module) {
  runSMSIntegrationTests().catch(console.error);
}
