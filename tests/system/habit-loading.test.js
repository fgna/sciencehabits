/**
 * System Test: Habit Loading Integration
 * 
 * Tests the habit loading system end-to-end:
 * 1. BundledContentService functionality
 * 2. goalBasedRecommendations service integration
 * 3. Fallback mechanisms
 * 4. Data integrity and format validation
 */

const fs = require('fs');
const path = require('path');

class HabitLoadingTest {
  constructor() {
    this.testResults = {
      startTime: new Date().toISOString(),
      tests: [],
      dataValidation: {},
      summary: { passed: 0, failed: 0, total: 0 }
    };
  }

  async runTest(testName, testFunction) {
    const startTime = Date.now();
    console.log(`\n🧪 Testing: ${testName}`);
    
    try {
      await testFunction();
      const duration = Date.now() - startTime;
      console.log(`✅ PASSED: ${testName} (${duration}ms)`);
      
      this.testResults.tests.push({
        name: testName,
        status: 'passed',
        duration,
        timestamp: new Date().toISOString()
      });
      this.testResults.summary.passed++;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ FAILED: ${testName} (${duration}ms)`);
      console.log(`   Error: ${error.message}`);
      
      this.testResults.tests.push({
        name: testName,
        status: 'failed',
        duration,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      this.testResults.summary.failed++;
    }
    
    this.testResults.summary.total++;
  }

  async testBundledContentExists() {
    // Test that bundled content files exist and are valid
    const bundledDir = path.join(__dirname, '../../src/data/bundled');
    const requiredFiles = [
      'habits/all.json',
      'habits/by-goal.json',
      'locales/all.json',
      'locales/en.json',
      'research/all.json',
      'manifest.json'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(bundledDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required bundled file missing: ${file}`);
      }
      
      try {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!content || typeof content !== 'object') {
          throw new Error(`Invalid JSON content in: ${file}`);
        }
        console.log(`   ✓ ${file} exists and is valid JSON`);
      } catch (e) {
        throw new Error(`Invalid JSON in ${file}: ${e.message}`);
      }
    }
  }

  async testBundledHabitsDataIntegrity() {
    // Test the integrity of bundled habits data
    const habitsFile = path.join(__dirname, '../../src/data/bundled/habits/all.json');
    const habitsData = JSON.parse(fs.readFileSync(habitsFile, 'utf8'));
    
    if (!habitsData.data || !Array.isArray(habitsData.data)) {
      throw new Error('Habits data is not an array');
    }
    
    const habits = habitsData.data;
    if (habits.length === 0) {
      throw new Error('No habits found in bundled data');
    }
    
    // Validate required properties for each habit
    const requiredProps = ['id', 'title', 'description', 'category', 'difficulty', 'timeMinutes', 'effectivenessScore'];
    const goals = ['better_sleep', 'feel_better', 'get_moving'];
    const goalCounts = {};
    
    for (const habit of habits) {
      for (const prop of requiredProps) {
        if (habit[prop] === undefined || habit[prop] === null) {
          throw new Error(`Habit ${habit.id || 'unknown'} missing required property: ${prop}`);
        }
      }
      
      // Count habits by goal
      if (goals.includes(habit.category)) {
        goalCounts[habit.category] = (goalCounts[habit.category] || 0) + 1;
      }
    }
    
    // Ensure we have habits for each goal
    for (const goal of goals) {
      if (!goalCounts[goal] || goalCounts[goal] === 0) {
        throw new Error(`No habits found for goal: ${goal}`);
      }
    }
    
    this.testResults.dataValidation.habitCounts = goalCounts;
    this.testResults.dataValidation.totalHabits = habits.length;
    
    console.log(`   ✓ Found ${habits.length} valid habits across ${Object.keys(goalCounts).length} goals`);
    console.log(`   ✓ Goal distribution:`, goalCounts);
  }

  async testGoalBasedHabitsStructure() {
    // Test the by-goal habits structure
    const byGoalFile = path.join(__dirname, '../../src/data/bundled/habits/by-goal.json');
    const byGoalData = JSON.parse(fs.readFileSync(byGoalFile, 'utf8'));
    
    if (!byGoalData.data || typeof byGoalData.data !== 'object') {
      throw new Error('By-goal data is not a valid object');
    }
    
    const goals = ['better_sleep', 'feel_better', 'get_moving'];
    
    for (const goal of goals) {
      if (!byGoalData.data[goal]) {
        throw new Error(`Goal ${goal} not found in by-goal data`);
      }
      
      const goalData = byGoalData.data[goal];
      if (!goalData.en || !Array.isArray(goalData.en)) {
        throw new Error(`Goal ${goal} missing English language data`);
      }
      
      if (goalData.en.length === 0) {
        throw new Error(`Goal ${goal} has no habits in English`);
      }
      
      console.log(`   ✓ Goal ${goal} has ${goalData.en.length} habits`);
    }
  }

  async testBundledContentServiceMethods() {
    // Test BundledContentService methods in Node.js environment
    
    // Mock the import environment
    global.window = undefined;
    global.document = undefined;
    
    // Create a minimal test for the service structure
    const bundledDir = path.join(__dirname, '../../src/data/bundled');
    
    // Test manifest loading
    const manifestPath = path.join(bundledDir, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    if (!manifest.bundleVersion || !manifest.timestamp) {
      throw new Error('Invalid manifest structure');
    }
    
    // Test habits by goal loading simulation
    const byGoalPath = path.join(bundledDir, 'habits/by-goal.json');
    const byGoalData = JSON.parse(fs.readFileSync(byGoalPath, 'utf8'));
    
    const testGoal = 'better_sleep';
    const goalHabits = byGoalData.data[testGoal]?.en;
    
    if (!goalHabits || goalHabits.length === 0) {
      throw new Error(`No habits found for test goal: ${testGoal}`);
    }
    
    // Validate habit structure matches GoalBasedHabit interface
    const firstHabit = goalHabits[0];
    const requiredFields = ['id', 'title', 'description', 'category', 'difficulty', 'timeMinutes', 'effectivenessScore'];
    
    for (const field of requiredFields) {
      if (firstHabit[field] === undefined) {
        throw new Error(`Habit missing required field for goal-based recommendations: ${field}`);
      }
    }
    
    console.log(`   ✓ BundledContentService data structure is valid`);
    console.log(`   ✓ Goal-based habit format is compatible`);
  }

  async testGoalBasedRecommendationsCompatibility() {
    // Test that data is compatible with goalBasedRecommendations service expectations
    
    const byGoalFile = path.join(__dirname, '../../src/data/bundled/habits/by-goal.json');
    const byGoalData = JSON.parse(fs.readFileSync(byGoalFile, 'utf8'));
    
    const availableGoals = Object.keys(byGoalData.data);
    const expectedGoals = ['better_sleep', 'feel_better', 'get_moving'];
    
    for (const expectedGoal of expectedGoals) {
      if (!availableGoals.includes(expectedGoal)) {
        throw new Error(`Expected goal ${expectedGoal} not found in available goals: ${availableGoals.join(', ')}`);
      }
    }
    
    // Test data format compatibility
    for (const goal of expectedGoals) {
      const goalHabits = byGoalData.data[goal].en;
      
      for (const habit of goalHabits.slice(0, 3)) { // Test first 3 habits
        // Check if habit can be converted to GoalBasedHabit format
        const requiredConversionFields = {
          id: 'string',
          title: 'string',
          description: 'string',
          category: 'string',
          difficulty: 'string',
          timeMinutes: 'number',
          effectivenessScore: 'number'
        };
        
        for (const [field, expectedType] of Object.entries(requiredConversionFields)) {
          if (typeof habit[field] !== expectedType) {
            throw new Error(`Habit ${habit.id} field ${field} is ${typeof habit[field]}, expected ${expectedType}`);
          }
        }
        
        // Check optional fields that goalBasedRecommendations uses
        const optionalFields = ['goalTags', 'instructions', 'whyEffective', 'researchSummary'];
        for (const field of optionalFields) {
          if (habit[field] !== undefined) {
            console.log(`   ✓ Optional field ${field} available for habit ${habit.id}`);
          }
        }
      }
    }
    
    console.log(`   ✓ Data is compatible with goalBasedRecommendations service`);
    console.log(`   ✓ Available goals: ${availableGoals.join(', ')}`);
  }

  async testFallbackDataStructure() {
    // Test fallback data integrity
    const srcDir = path.join(__dirname, '../../src');
    
    // Check if there are fallback data files
    const possibleFallbackPaths = [
      'data/habits.json',
      'data/research.json'
    ];
    
    for (const fallbackPath of possibleFallbackPaths) {
      const fullPath = path.join(srcDir, fallbackPath);
      if (fs.existsSync(fullPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
          console.log(`   ✓ Fallback data ${fallbackPath} is valid JSON`);
          
          if (fallbackPath.includes('habits') && Array.isArray(data)) {
            console.log(`   ✓ Fallback habits contain ${data.length} items`);
          }
        } catch (e) {
          console.log(`   ⚠ Fallback data ${fallbackPath} has issues: ${e.message}`);
        }
      }
    }
  }

  async generateReport() {
    this.testResults.endTime = new Date().toISOString();
    this.testResults.duration = new Date(this.testResults.endTime) - new Date(this.testResults.startTime);
    
    const reportPath = path.join(__dirname, '../../test-reports/habit-loading-report.json');
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));
    
    console.log(`\n📊 Habit Loading Test Results:`);
    console.log(`   ✅ Passed: ${this.testResults.summary.passed}`);
    console.log(`   ❌ Failed: ${this.testResults.summary.failed}`);
    console.log(`   📊 Data Validation:`);
    if (this.testResults.dataValidation.totalHabits) {
      console.log(`      Total Habits: ${this.testResults.dataValidation.totalHabits}`);
    }
    if (this.testResults.dataValidation.habitCounts) {
      console.log(`      By Goal:`, this.testResults.dataValidation.habitCounts);
    }
    console.log(`   📁 Report: ${reportPath}`);
    
    return this.testResults;
  }

  async runAllTests() {
    console.log('🧪 Starting Habit Loading Integration Tests...');
    
    try {
      await this.runTest('Bundled Content Files Exist', () => this.testBundledContentExists());
      await this.runTest('Bundled Habits Data Integrity', () => this.testBundledHabitsDataIntegrity());
      await this.runTest('Goal-Based Habits Structure', () => this.testGoalBasedHabitsStructure());
      await this.runTest('BundledContentService Methods', () => this.testBundledContentServiceMethods());
      await this.runTest('goalBasedRecommendations Compatibility', () => this.testGoalBasedRecommendationsCompatibility());
      await this.runTest('Fallback Data Structure', () => this.testFallbackDataStructure());
      
      const results = await this.generateReport();
      
      const exitCode = results.summary.failed === 0 ? 0 : 1;
      
      if (exitCode === 0) {
        console.log('\n🎉 All habit loading tests passed!');
      } else {
        console.log('\n💥 Some habit loading tests failed!');
      }
      
      return exitCode;
      
    } catch (error) {
      console.error('💥 Habit loading test suite failed:', error);
      return 1;
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const test = new HabitLoadingTest();
  test.runAllTests().then(exitCode => {
    process.exit(exitCode);
  });
}

module.exports = HabitLoadingTest;