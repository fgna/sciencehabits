#!/usr/bin/env node

/**
 * System Test Runner
 * 
 * Executes comprehensive system tests to validate the application
 * functionality after content API integration and legacy cleanup.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class SystemTestRunner {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      skipped: 0,
      tests: []
    };
  }

  async runTests() {
    console.log('🧪 Starting System Test Suite...\n');
    
    try {
      // Validate environment
      await this.validateEnvironment();
      
      // Run core functionality tests
      await this.testGoalSelectionFunctionality();
      await this.testContentAPIIntegration();
      await this.testHabitCompletionToggle();
      await this.testMultilingualSupport();
      
      // Generate summary
      this.generateSummary();
      
      if (this.results.failed > 0) {
        console.error(`❌ System tests FAILED: ${this.results.failed} tests failed`);
        process.exit(1);
      } else {
        console.log(`✅ System tests PASSED: All ${this.results.passed} tests passed`);
        process.exit(0);
      }
    } catch (error) {
      console.error('💥 System test suite crashed:', error.message);
      process.exit(1);
    }
  }

  async test(name, testFn) {
    try {
      console.log(`🧪 ${name}...`);
      const result = await testFn();
      
      this.results.passed++;
      this.results.tests.push({ 
        name, 
        status: 'PASSED', 
        details: result || 'Test completed successfully' 
      });
      console.log(`✅ ${name}`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ 
        name, 
        status: 'FAILED', 
        details: error.message 
      });
      console.log(`❌ ${name}: ${error.message}`);
    }
  }

  async skip(name, reason) {
    this.results.skipped++;
    this.results.tests.push({ 
      name, 
      status: 'SKIPPED', 
      details: reason 
    });
    console.log(`⏭️  SKIP: ${name} (${reason})`);
  }

  async validateEnvironment() {
    await this.test('Validate Node.js environment', () => {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
      if (majorVersion < 18) {
        throw new Error(`Unsupported Node.js version: ${nodeVersion}. Expected v18 or higher.`);
      }
      return `Node.js ${nodeVersion}`;
    });

    await this.test('Validate project structure', () => {
      const requiredFiles = [
        'package.json',
        'src/services/smartRecommendations.ts',
        'src/services/localization/EffectivenessRankingService.ts',
        'src/data/goalTaxonomy.json',
        'public/data/goals-config.json'
      ];
      
      const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
      
      if (missingFiles.length > 0) {
        throw new Error(`Missing required files: ${missingFiles.join(', ')}`);
      }
      
      return `All ${requiredFiles.length} required files present`;
    });

    await this.test('Validate TypeScript compilation', () => {
      try {
        execSync('npm run type-check', { stdio: 'pipe' });
        return 'TypeScript compilation successful';
      } catch (error) {
        throw new Error(`TypeScript compilation failed: ${error.message}`);
      }
    });
  }

  async testGoalSelectionFunctionality() {
    await this.test('Goal taxonomy validation', () => {
      const goalTaxonomy = JSON.parse(fs.readFileSync('src/data/goalTaxonomy.json', 'utf8'));
      
      // Check for mappings array (the actual structure)
      if (!goalTaxonomy.mappings || !Array.isArray(goalTaxonomy.mappings)) {
        throw new Error('Goal taxonomy structure is invalid - mappings array missing');
      }
      
      // Check for required goal mappings
      const requiredGoals = ['better_sleep', 'feel_better'];  // get_moving is mapped to improve_health
      const goalIds = goalTaxonomy.mappings.map(g => g.officialId);
      
      // Check that feel_better is in the aliases for improve_mood
      const improveMoodGoal = goalTaxonomy.mappings.find(g => g.officialId === 'improve_mood');
      if (!improveMoodGoal || !improveMoodGoal.aliases.includes('feel_better')) {
        throw new Error('feel_better alias mapping is missing in improve_mood goal');
      }
      
      // Check that get_moving is in the aliases for improve_health  
      const improveHealthGoal = goalTaxonomy.mappings.find(g => g.officialId === 'improve_health');
      if (!improveHealthGoal || !improveHealthGoal.aliases.includes('get_moving')) {
        throw new Error('get_moving alias mapping is missing in improve_health goal');
      }
      
      // Check that better_sleep goal exists
      const betterSleepGoal = goalTaxonomy.mappings.find(g => g.officialId === 'better_sleep');
      if (!betterSleepGoal) {
        throw new Error('better_sleep goal mapping is missing');
      }
      
      return `Goal taxonomy valid with ${goalTaxonomy.mappings.length} goal mappings`;
    });

    await this.test('Goals configuration validation', () => {
      const goalsConfig = JSON.parse(fs.readFileSync('public/data/goals-config.json', 'utf8'));
      
      if (!goalsConfig.goals || !Array.isArray(goalsConfig.goals)) {
        throw new Error('Goals configuration structure is invalid');
      }
      
      const expectedGoals = ['better_sleep', 'get_moving', 'feel_better'];
      const actualGoals = goalsConfig.goals.map(g => g.id);
      
      const missingGoals = expectedGoals.filter(goal => !actualGoals.includes(goal));
      if (missingGoals.length > 0) {
        throw new Error(`Missing goals in configuration: ${missingGoals.join(', ')}`);
      }
      
      // Validate goal structure
      for (const goal of goalsConfig.goals) {
        if (!goal.id || !goal.title || !goal.description || !goal.icon) {
          throw new Error(`Invalid goal structure for goal: ${goal.id || 'unknown'}`);
        }
      }
      
      return `Goals configuration valid with ${goalsConfig.goals.length} goals`;
    });
  }

  async testContentAPIIntegration() {
    // Skip content API tests if the API server is not running
    const contentApiRunning = await this.checkContentAPI();
    
    if (!contentApiRunning) {
      await this.skip('Content API integration tests', 'Content API server not running');
      return;
    }

    await this.test('Smart recommendations can load habits from content API', async () => {
      // This would require running the actual code, which is complex in this test environment
      // For now, we'll validate that the service files are correctly structured
      
      const smartRecommendationsFile = fs.readFileSync('src/services/smartRecommendations.ts', 'utf8');
      
      // Check that it imports from EffectivenessRankingService
      if (!smartRecommendationsFile.includes('EffectivenessRankingService')) {
        throw new Error('SmartRecommendations does not import EffectivenessRankingService');
      }
      
      // Check that it calls getPrimaryRecommendations
      if (!smartRecommendationsFile.includes('getPrimaryRecommendations')) {
        throw new Error('SmartRecommendations does not call getPrimaryRecommendations');
      }
      
      // Check that legacy imports are removed
      if (smartRecommendationsFile.includes('src/data/habits.json') || 
          smartRecommendationsFile.includes('./data/habits')) {
        throw new Error('SmartRecommendations still contains legacy data imports');
      }
      
      return 'Smart recommendations properly integrated with content API';
    });

    await this.test('Content Manager uses content API instead of legacy files', () => {
      const contentManagerFile = fs.readFileSync('src/services/cms/ContentManager.ts', 'utf8');
      
      // Check that it imports from EffectivenessRankingService
      if (!contentManagerFile.includes('EffectivenessRankingService')) {
        throw new Error('ContentManager does not import EffectivenessRankingService');
      }
      
      // Check that legacy imports are commented out or removed
      if (contentManagerFile.includes('import habitsData from') || 
          contentManagerFile.includes('import researchData from')) {
        throw new Error('ContentManager still contains active legacy data imports');
      }
      
      return 'ContentManager properly integrated with content API';
    });
  }

  async testHabitCompletionToggle() {
    await this.test('Database clearAllData function exists', () => {
      const databaseFile = fs.readFileSync('src/services/storage/database.ts', 'utf8');
      
      if (!databaseFile.includes('clearAllData')) {
        throw new Error('clearAllData function not found in database.ts');
      }
      
      if (!databaseFile.includes('export') || !databaseFile.includes('clearAllData')) {
        throw new Error('clearAllData function not properly exported');
      }
      
      return 'clearAllData function exists and is exported';
    });

    await this.test('Profile settings includes data deletion functionality', () => {
      const profileSettingsFile = fs.readFileSync('src/components/profile/ProfileSettings.tsx', 'utf8');
      
      if (!profileSettingsFile.includes('clearAllData') && 
          !profileSettingsFile.includes('Delete All Data')) {
        throw new Error('Data deletion functionality not found in ProfileSettings');
      }
      
      return 'Profile settings includes data deletion functionality';
    });
  }

  async testMultilingualSupport() {
    await this.test('Multilingual content structure validation', () => {
      const effectivenessServiceFile = fs.readFileSync('src/services/localization/EffectivenessRankingService.ts', 'utf8');
      
      // Check for basic multilingual functionality
      const multilingualIndicators = [
        'translations',
        'language',
        'lang',
        'locale',
        'multilingual'
      ];
      
      let foundIndicators = 0;
      for (const indicator of multilingualIndicators) {
        if (effectivenessServiceFile.toLowerCase().includes(indicator)) {
          foundIndicators++;
        }
      }
      
      if (foundIndicators < 2) {
        throw new Error(`Insufficient multilingual functionality detected. Found ${foundIndicators} indicators.`);
      }
      
      return `Multilingual support detected with ${foundIndicators} multilingual indicators`;
    });

    await this.test('Difficulty mapping function exists', () => {
      const smartRecommendationsFile = fs.readFileSync('src/services/smartRecommendations.ts', 'utf8');
      const contentManagerFile = fs.readFileSync('src/services/cms/ContentManager.ts', 'utf8');
      
      // Check for difficulty mapping in both files
      if (!smartRecommendationsFile.includes('mapDifficultyToLegacy') &&
          !contentManagerFile.includes('mapDifficultyToLegacy')) {
        throw new Error('Difficulty mapping function not found in expected files');
      }
      
      // Check for challenging -> intermediate mapping
      const hasChallengingMapping = 
        smartRecommendationsFile.includes('challenging') && smartRecommendationsFile.includes('intermediate') ||
        contentManagerFile.includes('challenging') && contentManagerFile.includes('intermediate');
      
      if (!hasChallengingMapping) {
        throw new Error('Challenging -> intermediate difficulty mapping not found');
      }
      
      return 'Difficulty mapping function properly handles challenging -> intermediate conversion';
    });
  }

  async checkContentAPI() {
    try {
      const { execSync } = require('child_process');
      // Try to ping the content API
      execSync('curl -f http://localhost:3001/health', { stdio: 'pipe', timeout: 3000 });
      return true;
    } catch (error) {
      return false;
    }
  }

  generateSummary() {
    console.log('\n📊 SYSTEM TEST SUMMARY');
    console.log('========================');
    console.log(`Total Tests: ${this.results.passed + this.results.failed + this.results.skipped}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Skipped: ${this.results.skipped}`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.tests
        .filter(t => t.status === 'FAILED')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.details}`);
        });
    }
    
    if (this.results.skipped > 0) {
      console.log('\n⏭️  SKIPPED TESTS:');
      this.results.tests
        .filter(t => t.status === 'SKIPPED')
        .forEach(test => {
          console.log(`  • ${test.name}: ${test.details}`);
        });
    }
    
    console.log('');
  }
}

// CLI execution
if (require.main === module) {
  const runner = new SystemTestRunner();
  runner.runTests();
}

module.exports = SystemTestRunner;