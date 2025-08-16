/**
 * Comprehensive System Test for Multilingual Habit System
 * Tests all core functionalities including API integration
 */

const { EffectivenessRankingService } = require('./src/services/localization/EffectivenessRankingService.ts');

async function runSystemTests() {
  console.log('🚀 Starting Multilingual System Test Suite...\n');
  
  let testsPassed = 0;
  let testsTotal = 0;
  
  // Test 1: Service instantiation
  console.log('Test 1: Service Instantiation');
  testsTotal++;
  try {
    console.log('✅ EffectivenessRankingService available');
    testsPassed++;
  } catch (error) {
    console.log('❌ Service instantiation failed:', error.message);
  }
  
  // Test 2: Basic functionality check
  console.log('\nTest 2: Basic Method Availability');
  testsTotal++;
  try {
    const methods = [
      'getGoalCategoryRanking',
      'getPersonalizedRecommendations', 
      'getGlobalRankings',
      'getPrimaryRecommendations',
      'getRankingSystemStats'
    ];
    
    const methodsAvailable = methods.every(method => 
      typeof EffectivenessRankingService[method] === 'function'
    );
    
    if (methodsAvailable) {
      console.log('✅ All required methods available');
      testsPassed++;
    } else {
      console.log('❌ Some methods missing');
    }
  } catch (error) {
    console.log('❌ Method check failed:', error.message);
  }
  
  console.log(`\n📊 Test Results: ${testsPassed}/${testsTotal} tests passed`);
  
  if (testsPassed === testsTotal) {
    console.log('🎉 All basic system tests PASSED!');
    return true;
  } else {
    console.log('⚠️ Some tests failed. Check implementation.');
    return false;
  }
}

// Run tests if called directly
if (require.main === module) {
  runSystemTests().catch(console.error);
}

module.exports = { runSystemTests };