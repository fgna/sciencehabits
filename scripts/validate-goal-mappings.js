#!/usr/bin/env node

/**
 * CI/CD Goal Mapping Validation Script
 * 
 * Validates goal-to-habit mappings to prevent regressions in production.
 * Can be run in GitHub Actions, pre-commit hooks, or manually.
 */

const fs = require('fs');
const path = require('path');

// Exit codes
const EXIT_SUCCESS = 0;
const EXIT_VALIDATION_FAILED = 1;
const EXIT_CRITICAL_ERROR = 2;

class CIValidationRunner {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalGoals: 0,
      totalHabits: 0,
      mappedGoals: 0,
      unmappedGoals: 0,
      validationScore: 0
    };
  }

  async run() {
    console.log('🔍 Starting Goal-to-Habit Mapping Validation...\n');
    
    try {
      // Validate file structure
      await this.validateFileStructure();
      
      // Load and validate goal taxonomy
      const taxonomyData = await this.loadAndValidateTaxonomy();
      
      // Load and validate habits data
      const habitsData = await this.loadAndValidateHabits();
      
      // Cross-validate mappings
      await this.crossValidateMappings(taxonomyData, habitsData);
      
      // Calculate final score
      this.calculateValidationScore();
      
      // Generate report
      this.generateReport();
      
      // Determine exit code
      return this.determineExitCode();
      
    } catch (error) {
      console.error('❌ Critical error during validation:', error.message);
      return EXIT_CRITICAL_ERROR;
    }
  }

  async validateFileStructure() {
    console.log('📁 Validating file structure...');
    
    const requiredFiles = [
      'src/data/goalTaxonomy.json',
      'src/services/goalTaxonomy.ts',
      'src/services/smartRecommendations.ts',
      'src/services/contentValidator.ts',
      'public/data/goals.json'
    ];

    for (const filePath of requiredFiles) {
      if (!fs.existsSync(filePath)) {
        this.errors.push(`Missing required file: ${filePath}`);
      }
    }

    // Check for habit files
    const habitFiles = [
      'public/data/habits/nutrition-habits.json',
      'public/data/habits/mindfulness-habits.json'
    ];

    let habitFilesFound = 0;
    for (const filePath of habitFiles) {
      if (fs.existsSync(filePath)) {
        habitFilesFound++;
      }
    }

    if (habitFilesFound === 0) {
      this.errors.push('No habit files found in public/data/habits/');
    }

    console.log(`✅ File structure validation complete (${this.errors.length === 0 ? 'PASS' : 'FAIL'})\n`);
  }

  async loadAndValidateTaxonomy() {
    console.log('🗂️  Validating goal taxonomy...');
    
    let taxonomyData;
    try {
      const taxonomyFile = fs.readFileSync('src/data/goalTaxonomy.json', 'utf8');
      taxonomyData = JSON.parse(taxonomyFile);
    } catch (error) {
      this.errors.push(`Failed to load goal taxonomy: ${error.message}`);
      return null;
    }

    // Validate taxonomy structure
    if (!taxonomyData.mappings || !Array.isArray(taxonomyData.mappings)) {
      this.errors.push('Goal taxonomy missing mappings array');
    }

    if (!taxonomyData.categories || !Array.isArray(taxonomyData.categories)) {
      this.errors.push('Goal taxonomy missing categories array');
    }

    // Validate each mapping
    const goalIds = new Set();
    for (const mapping of taxonomyData.mappings || []) {
      if (!mapping.officialId) {
        this.errors.push('Goal mapping missing officialId');
        continue;
      }

      if (goalIds.has(mapping.officialId)) {
        this.errors.push(`Duplicate goal ID: ${mapping.officialId}`);
      }
      goalIds.add(mapping.officialId);

      if (!Array.isArray(mapping.aliases)) {
        this.warnings.push(`Goal ${mapping.officialId} missing aliases array`);
      }

      if (!Array.isArray(mapping.semanticTerms)) {
        this.warnings.push(`Goal ${mapping.officialId} missing semanticTerms array`);
      }

      if (!mapping.category) {
        this.errors.push(`Goal ${mapping.officialId} missing category`);
      }
    }

    this.stats.totalGoals = goalIds.size;
    console.log(`✅ Goal taxonomy validation complete (${this.stats.totalGoals} goals found)\n`);
    
    return taxonomyData;
  }

  async loadAndValidateHabits() {
    console.log('💪 Validating habits data...');
    
    const habitFiles = this.findHabitFiles();
    const allHabits = [];
    
    for (const filePath of habitFiles) {
      try {
        const habitFile = fs.readFileSync(filePath, 'utf8');
        const habits = JSON.parse(habitFile);
        
        if (!Array.isArray(habits)) {
          this.warnings.push(`Habit file ${filePath} is not an array`);
          continue;
        }

        for (const habit of habits) {
          if (!habit.id) {
            this.errors.push(`Habit in ${filePath} missing id`);
            continue;
          }

          if (!habit.goalTags || !Array.isArray(habit.goalTags)) {
            this.errors.push(`Habit ${habit.id} missing goalTags array`);
            continue;
          }

          if (habit.goalTags.length === 0) {
            this.warnings.push(`Habit ${habit.id} has no goal tags`);
          }

          allHabits.push({
            id: habit.id,
            title: habit.title,
            goalTags: habit.goalTags,
            source: filePath
          });
        }
      } catch (error) {
        this.errors.push(`Failed to load habit file ${filePath}: ${error.message}`);
      }
    }

    this.stats.totalHabits = allHabits.length;
    console.log(`✅ Habits validation complete (${this.stats.totalHabits} habits found)\n`);
    
    return allHabits;
  }

  async crossValidateMappings(taxonomyData, habitsData) {
    console.log('🔗 Cross-validating goal-to-habit mappings...');
    
    if (!taxonomyData || !habitsData) {
      this.errors.push('Cannot cross-validate: missing taxonomy or habits data');
      return;
    }

    // Create mapping lookup
    const goalMappings = new Map();
    const aliasToGoal = new Map();
    
    for (const mapping of taxonomyData.mappings) {
      goalMappings.set(mapping.officialId, mapping);
      
      // Map aliases
      aliasToGoal.set(mapping.officialId.toLowerCase(), mapping.officialId);
      for (const alias of mapping.aliases || []) {
        aliasToGoal.set(alias.toLowerCase(), mapping.officialId);
      }
    }

    // Check each habit's goal tags
    const unmappedTags = new Set();
    const mappedTags = new Set();
    
    for (const habit of habitsData) {
      for (const goalTag of habit.goalTags) {
        const normalizedTag = goalTag.toLowerCase();
        
        if (aliasToGoal.has(normalizedTag)) {
          mappedTags.add(goalTag);
        } else {
          unmappedTags.add(goalTag);
          this.warnings.push(`Unmapped goal tag "${goalTag}" in habit ${habit.id} (${habit.source})`);
        }
      }
    }

    this.stats.mappedGoals = mappedTags.size;
    this.stats.unmappedGoals = unmappedTags.size;

    // Check for onboarding goals coverage
    await this.validateOnboardingCoverage(goalMappings, habitsData);

    console.log(`✅ Cross-validation complete (${this.stats.mappedGoals} mapped, ${this.stats.unmappedGoals} unmapped)\n`);
  }

  async validateOnboardingCoverage(goalMappings, habitsData) {
    console.log('🎯 Validating onboarding goal coverage...');
    
    try {
      const goalsFile = fs.readFileSync('public/data/goals.json', 'utf8');
      const goalsData = JSON.parse(goalsFile);
      
      for (const goal of goalsData.goals || []) {
        const goalMapping = goalMappings.get(goal.id);
        if (!goalMapping) {
          this.errors.push(`Onboarding goal "${goal.id}" not found in taxonomy`);
          continue;
        }

        // Check if any habits exist for this goal
        const relatedHabits = habitsData.filter(habit => {
          return habit.goalTags.some(tag => {
            const normalizedTag = tag.toLowerCase();
            return normalizedTag === goal.id.toLowerCase() ||
                   goalMapping.aliases.some(alias => alias.toLowerCase() === normalizedTag);
          });
        });

        if (relatedHabits.length === 0) {
          this.errors.push(`No habits found for onboarding goal "${goal.id}" - this will cause "No habits found" error`);
        } else if (relatedHabits.length < 3) {
          this.warnings.push(`Only ${relatedHabits.length} habits found for goal "${goal.id}" - consider adding more`);
        }
      }
    } catch (error) {
      this.errors.push(`Failed to validate onboarding coverage: ${error.message}`);
    }
  }

  findHabitFiles() {
    const habitDir = 'public/data/habits';
    if (!fs.existsSync(habitDir)) {
      return [];
    }

    return fs.readdirSync(habitDir)
      .filter(file => file.endsWith('.json'))
      .map(file => path.join(habitDir, file));
  }

  calculateValidationScore() {
    let score = 100;
    
    // Deduct for errors
    score -= this.errors.length * 10;
    
    // Deduct for warnings
    score -= this.warnings.length * 2;
    
    // Bonus for good coverage
    if (this.stats.unmappedGoals === 0) {
      score += 10;
    }
    
    this.stats.validationScore = Math.max(0, Math.min(100, score));
  }

  generateReport() {
    console.log('📊 VALIDATION REPORT');
    console.log('==================');
    console.log(`Score: ${this.stats.validationScore}/100`);
    console.log(`Status: ${this.stats.validationScore >= 80 ? '✅ PASS' : '❌ FAIL'}`);
    console.log('');
    
    console.log('📈 Statistics:');
    console.log(`- Total Goals: ${this.stats.totalGoals}`);
    console.log(`- Total Habits: ${this.stats.totalHabits}`);
    console.log(`- Mapped Goal Tags: ${this.stats.mappedGoals}`);
    console.log(`- Unmapped Goal Tags: ${this.stats.unmappedGoals}`);
    console.log('');
    
    if (this.errors.length > 0) {
      console.log(`❌ Errors (${this.errors.length}):`);
      this.errors.forEach((error, i) => {
        console.log(`${i + 1}. ${error}`);
      });
      console.log('');
    }
    
    if (this.warnings.length > 0) {
      console.log(`⚠️  Warnings (${this.warnings.length}):`);
      this.warnings.forEach((warning, i) => {
        console.log(`${i + 1}. ${warning}`);
      });
      console.log('');
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('🎉 No issues found! Goal-to-habit mappings are perfect.');
    }
  }

  determineExitCode() {
    if (this.errors.length > 0) {
      console.log('💥 Validation FAILED - Fix errors before deploying');
      return EXIT_VALIDATION_FAILED;
    }
    
    if (this.stats.validationScore < 80) {
      console.log('📉 Validation score too low - Consider addressing warnings');
      return EXIT_VALIDATION_FAILED;
    }
    
    console.log('✅ Validation PASSED - Safe to deploy');
    return EXIT_SUCCESS;
  }
}

// Run validation if called directly
if (require.main === module) {
  const runner = new CIValidationRunner();
  runner.run().then(exitCode => {
    process.exit(exitCode);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(EXIT_CRITICAL_ERROR);
  });
}

module.exports = CIValidationRunner;