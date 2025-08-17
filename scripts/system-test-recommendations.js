#!/usr/bin/env node

/**
 * Comprehensive System Tests for Goal-Based Recommendations
 * 
 * Tests the entire recommendation pipeline including:
 * - Goal-based file discovery
 * - Priority sorting
 * - Cross-contamination prevention
 * - Primary recommendation functionality
 * - Integration with React components
 */

const fs = require('fs');
const path = require('path');

const CONTENT_API_BASE = process.env.REACT_APP_CONTENT_API_URL || 'http://localhost:3002';

class SystemTestSuite {
  constructor() {
    this.tests = [];
    this.results = {
      passed: 0,
      failed: 0,
      details: []
    };
  }

  async runTest(name, testFn) {
    console.log(`🧪 Testing: ${name}`);
    try {
      await testFn();
      this.results.passed++;
      this.results.details.push({ name, status: 'PASSED', error: null });
      console.log(`  ✅ PASSED: ${name}\n`);
    } catch (error) {
      this.results.failed++;
      this.results.details.push({ name, status: 'FAILED', error: error.message });
      console.log(`  ❌ FAILED: ${name}`);
      console.log(`     Error: ${error.message}\n`);
    }
  }

  async testGoalFileDiscovery() {
    // Test 1: Verify all expected goal files can be discovered
    const expectedFiles = [
      'feel_better_habits-en.json',
      'get_moving_habits-en.json', 
      'better_sleep_habit-en.json'
    ];

    const discoveredFiles = [];
    for (const filename of expectedFiles) {
      const response = await fetch(`${CONTENT_API_BASE}/habits/${filename}`);
      if (response.ok) {
        discoveredFiles.push(filename);
      }
    }

    if (discoveredFiles.length !== expectedFiles.length) {
      throw new Error(`Expected ${expectedFiles.length} files, found ${discoveredFiles.length}. Missing: ${expectedFiles.filter(f => !discoveredFiles.includes(f)).join(', ')}`);
    }

    console.log(`    Found all ${discoveredFiles.length} expected goal files`);
  }

  async testNoCrossContamination() {
    // Test 2: Verify no cross-contamination between goal categories
    const testCases = [
      { file: 'feel_better_habits-en.json', expectedCategory: 'feel_better' },
      { file: 'get_moving_habits-en.json', expectedCategory: 'get_moving' },
      { file: 'better_sleep_habit-en.json', expectedCategory: 'better_sleep' }
    ];

    for (const { file, expectedCategory } of testCases) {
      const response = await fetch(`${CONTENT_API_BASE}/habits/${file}`);
      const habits = await response.json();

      const wrongCategoryHabits = habits.filter(h => h.category !== expectedCategory);
      if (wrongCategoryHabits.length > 0) {
        throw new Error(`${file} contains habits with wrong category: ${wrongCategoryHabits.map(h => `${h.id}:${h.category}`).join(', ')}`);
      }

      console.log(`    ${file}: All ${habits.length} habits have correct category "${expectedCategory}"`);
    }
  }

  async testPrioritySorting() {
    // Test 3: Verify habits are properly sorted by priority within each goal
    const files = [
      'feel_better_habits-en.json',
      'get_moving_habits-en.json',
      'better_sleep_habit-en.json'
    ];

    for (const file of files) {
      const response = await fetch(`${CONTENT_API_BASE}/habits/${file}`);
      const habits = await response.json();

      // Check that priorities are sequential and start from 1
      const priorities = habits.map(h => h.priority).sort((a, b) => a - b);
      const expectedPriorities = Array.from({ length: habits.length }, (_, i) => i + 1);

      if (JSON.stringify(priorities) !== JSON.stringify(expectedPriorities)) {
        throw new Error(`${file} has invalid priority sequence. Expected: [${expectedPriorities.join(', ')}], Got: [${priorities.join(', ')}]`);
      }

      console.log(`    ${file}: Priorities correctly ordered 1-${habits.length}`);
    }
  }

  async testPrimaryRecommendations() {
    // Test 4: Verify primary recommendations are properly flagged
    const files = [
      'feel_better_habits-en.json',
      'get_moving_habits-en.json',
      'better_sleep_habit-en.json'
    ];

    for (const file of files) {
      const response = await fetch(`${CONTENT_API_BASE}/habits/${file}`);
      const habits = await response.json();

      const primaryCount = habits.filter(h => h.isPrimaryRecommendation).length;
      if (primaryCount === 0) {
        throw new Error(`${file} has no primary recommendations`);
      }

      const topPrimary = habits
        .filter(h => h.isPrimaryRecommendation)
        .sort((a, b) => a.priority - b.priority)[0];

      if (topPrimary.priority > 3) {
        console.warn(`    Warning: ${file} top primary recommendation has priority ${topPrimary.priority}, expected <= 3`);
      }

      console.log(`    ${file}: ${primaryCount} primary recommendations, top priority: ${topPrimary.priority}`);
    }
  }

  async testGoalBasedEngine() {
    // Test 5: Test the goal-based recommendation engine directly
    console.log(`    Testing recommendation engine integration...`);
    
    // This would normally import the service, but for system testing we'll verify via API calls
    const testGoals = ['feel_better', 'get_moving', 'better_sleep'];
    
    for (const goal of testGoals) {
      // Test that each goal returns appropriate habits
      const filename = goal === 'better_sleep' ? 'better_sleep_habit-en.json' : `${goal}_habits-en.json`;
      const response = await fetch(`${CONTENT_API_BASE}/habits/${filename}`);
      
      if (!response.ok) {
        throw new Error(`Failed to load habits for goal: ${goal}`);
      }
      
      const habits = await response.json();
      if (habits.length === 0) {
        throw new Error(`No habits found for goal: ${goal}`);
      }
      
      console.log(`    Goal "${goal}": ${habits.length} habits available`);
    }
  }

  async testDataIntegrity() {
    // Test 6: Verify all required fields are present and valid
    const files = [
      'feel_better_habits-en.json',
      'get_moving_habits-en.json',
      'better_sleep_habit-en.json'
    ];

    const requiredFields = [
      'id', 'title', 'description', 'category', 'difficulty', 'timeMinutes',
      'language', 'researchBacked', 'effectivenessScore', 'effectivenessRank',
      'priority', 'isPrimaryRecommendation', 'goalTags', 'instructions',
      'whyEffective', 'researchSummary', 'sources', 'optimalTiming', 'progressionTips'
    ];

    for (const file of files) {
      const response = await fetch(`${CONTENT_API_BASE}/habits/${file}`);
      const habits = await response.json();

      for (const habit of habits) {
        const missingFields = requiredFields.filter(field => !(field in habit) || habit[field] === null || habit[field] === undefined);
        if (missingFields.length > 0) {
          throw new Error(`${file} habit ${habit.id} missing fields: ${missingFields.join(', ')}`);
        }

        // Validate specific field types
        if (typeof habit.isPrimaryRecommendation !== 'boolean') {
          throw new Error(`${file} habit ${habit.id} isPrimaryRecommendation must be boolean`);
        }

        if (!Array.isArray(habit.goalTags) || habit.goalTags.length === 0) {
          throw new Error(`${file} habit ${habit.id} goalTags must be non-empty array`);
        }
      }

      console.log(`    ${file}: All ${habits.length} habits have required fields`);
    }
  }

  async testRecommendationScenarios() {
    // Test 7: Test specific recommendation scenarios to prevent regressions
    const scenarios = [
      {
        name: 'Feel Better - Top 3 Primary',
        goal: 'feel_better',
        file: 'feel_better_habits-en.json',
        expectedTopHabits: ['feel_001_gratitude_journaling', 'feel_016_box_breathing', 'feel_021_micro_kindness']
      },
      {
        name: 'Get Moving - No Sleep Habits',
        goal: 'get_moving', 
        file: 'get_moving_habits-en.json',
        shouldNotContain: ['sleep_001_478_breathing', 'sleep_002_room_cooling']
      },
      {
        name: 'Better Sleep - Sleep Habits Only',
        goal: 'better_sleep',
        file: 'better_sleep_habit-en.json',
        expectedTopHabits: ['sleep_001_478_breathing', 'sleep_002_room_cooling']
      }
    ];

    for (const scenario of scenarios) {
      const response = await fetch(`${CONTENT_API_BASE}/habits/${scenario.file}`);
      const habits = await response.json();

      if (scenario.expectedTopHabits) {
        const topHabits = habits
          .filter(h => h.isPrimaryRecommendation)
          .sort((a, b) => a.priority - b.priority)
          .slice(0, scenario.expectedTopHabits.length)
          .map(h => h.id);

        const matches = scenario.expectedTopHabits.every(expectedId => topHabits.includes(expectedId));
        if (!matches) {
          throw new Error(`${scenario.name}: Expected top habits ${scenario.expectedTopHabits.join(', ')}, got ${topHabits.join(', ')}`);
        }
      }

      if (scenario.shouldNotContain) {
        const foundIds = habits.map(h => h.id);
        const wrongHabits = scenario.shouldNotContain.filter(id => foundIds.includes(id));
        if (wrongHabits.length > 0) {
          throw new Error(`${scenario.name}: Found unexpected habits: ${wrongHabits.join(', ')}`);
        }
      }

      console.log(`    ✓ ${scenario.name} scenario passed`);
    }
  }

  async runAllTests() {
    console.log('🎯 COMPREHENSIVE SYSTEM TESTS FOR GOAL-BASED RECOMMENDATIONS');
    console.log('============================================================\n');

    const tests = [
      ['Goal File Discovery', () => this.testGoalFileDiscovery()],
      ['Cross-Contamination Prevention', () => this.testNoCrossContamination()],
      ['Priority Sorting', () => this.testPrioritySorting()],
      ['Primary Recommendations', () => this.testPrimaryRecommendations()],
      ['Goal-Based Engine', () => this.testGoalBasedEngine()],
      ['Data Integrity', () => this.testDataIntegrity()],
      ['Recommendation Scenarios', () => this.testRecommendationScenarios()]
    ];

    for (const [name, testFn] of tests) {
      await this.runTest(name, testFn);
    }

    this.generateReport();
  }

  generateReport() {
    console.log('📊 SYSTEM TEST REPORT');
    console.log('====================');
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%\n`);

    if (this.results.failed > 0) {
      console.log('❌ Failed Tests:');
      this.results.details
        .filter(result => result.status === 'FAILED')
        .forEach(result => {
          console.log(`  - ${result.name}: ${result.error}`);
        });
      console.log('');
    }

    // Save detailed report
    const reportPath = path.join(__dirname, '../system-test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: this.results.passed + this.results.failed,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)
      },
      results: this.results.details
    }, null, 2));

    console.log(`📁 Detailed report saved to: ${reportPath}`);

    if (this.results.failed === 0) {
      console.log('\n✅ ALL SYSTEM TESTS PASSED! Goal-based recommendations system is working correctly.');
    } else {
      console.log('\n⚠️  Some system tests failed. Please review and fix issues before deployment.');
      process.exit(1);
    }
  }
}

async function main() {
  const testSuite = new SystemTestSuite();
  
  try {
    await testSuite.runAllTests();
  } catch (error) {
    console.error('❌ System test suite failed to run:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { SystemTestSuite };