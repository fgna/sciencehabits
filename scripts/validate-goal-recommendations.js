#!/usr/bin/env node

/**
 * Goal-Based Recommendations Validation Script
 * 
 * Validates that goal-specific JSON files are properly formatted,
 * contain required fields, and maintain data integrity.
 */

// Using built-in fetch (Node.js 18+)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONTENT_API_BASE = process.env.REACT_APP_CONTENT_API_URL || 'http://localhost:3002';
const VALIDATION_RULES = {
  requiredFields: [
    'id', 'title', 'description', 'category', 'difficulty', 'timeMinutes',
    'language', 'researchBacked', 'effectivenessScore', 'effectivenessRank',
    'priority', 'isPrimaryRecommendation', 'goalTags', 'instructions',
    'whyEffective', 'researchSummary', 'sources', 'optimalTiming', 'progressionTips'
  ],
  validDifficulties: ['beginner', 'intermediate', 'advanced', 'easy', 'moderate', 'challenging'],
  validCategories: ['feel_better', 'get_moving', 'better_sleep'],
  maxTimeMinutes: 60,
  minEffectivenessScore: 0,
  maxEffectivenessScore: 10
};

class ValidationError extends Error {
  constructor(message, category = 'validation') {
    super(message);
    this.category = category;
  }
}

async function discoverGoalFiles() {
  console.log('🔍 Discovering goal-specific files...');
  
  const goalPatterns = [
    { goal: 'feel_better', patterns: ['feel_better_habits-{lang}.json'] },
    { goal: 'get_moving', patterns: ['get_moving_habits-{lang}.json'] },
    { goal: 'better_sleep', patterns: ['better_sleep_habit-{lang}.json', 'better_sleep_habits-{lang}.json'] }
  ];
  const languages = ['en', 'de', 'fr', 'es'];
  
  const discoveredFiles = [];
  
  for (const { goal, patterns } of goalPatterns) {
    for (const pattern of patterns) {
      for (const lang of languages) {
        const filename = pattern.replace('{lang}', lang);
        try {
          const response = await fetch(`${CONTENT_API_BASE}/habits/${filename}`);
          if (response.ok) {
            discoveredFiles.push({ goal, language: lang, filename, pattern });
            console.log(`  ✅ Found: ${filename}`);
          }
        } catch (error) {
          // File doesn't exist, continue
        }
      }
    }
  }
  
  if (discoveredFiles.length === 0) {
    throw new ValidationError('No goal-specific files discovered', 'discovery');
  }
  
  console.log(`📁 Discovered ${discoveredFiles.length} files\n`);
  return discoveredFiles;
}

async function validateHabitStructure(habit, filename) {
  const errors = [];
  
  // Check required fields
  for (const field of VALIDATION_RULES.requiredFields) {
    if (!(field in habit) || habit[field] === null || habit[field] === undefined) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Validate specific field values
  if (habit.difficulty && !VALIDATION_RULES.validDifficulties.includes(habit.difficulty)) {
    errors.push(`Invalid difficulty: ${habit.difficulty}`);
  }
  
  if (habit.category && !VALIDATION_RULES.validCategories.includes(habit.category)) {
    errors.push(`Invalid category: ${habit.category}`);
  }
  
  if (habit.timeMinutes && (habit.timeMinutes < 1 || habit.timeMinutes > VALIDATION_RULES.maxTimeMinutes)) {
    errors.push(`Invalid timeMinutes: ${habit.timeMinutes} (should be 1-${VALIDATION_RULES.maxTimeMinutes})`);
  }
  
  if (habit.effectivenessScore && (habit.effectivenessScore < VALIDATION_RULES.minEffectivenessScore || habit.effectivenessScore > VALIDATION_RULES.maxEffectivenessScore)) {
    errors.push(`Invalid effectivenessScore: ${habit.effectivenessScore} (should be ${VALIDATION_RULES.minEffectivenessScore}-${VALIDATION_RULES.maxEffectivenessScore})`);
  }
  
  if (habit.priority && (habit.priority < 1 || habit.priority > 100)) {
    errors.push(`Invalid priority: ${habit.priority} (should be 1-100)`);
  }
  
  if (typeof habit.isPrimaryRecommendation !== 'boolean') {
    errors.push(`isPrimaryRecommendation must be boolean, got: ${typeof habit.isPrimaryRecommendation}`);
  }
  
  if (!Array.isArray(habit.goalTags) || habit.goalTags.length === 0) {
    errors.push('goalTags must be a non-empty array');
  }
  
  if (!Array.isArray(habit.instructions) || habit.instructions.length === 0) {
    errors.push('instructions must be a non-empty array');
  }
  
  if (!Array.isArray(habit.sources) || habit.sources.length === 0) {
    errors.push('sources must be a non-empty array');
  }
  
  if (!Array.isArray(habit.progressionTips) || habit.progressionTips.length === 0) {
    errors.push('progressionTips must be a non-empty array');
  }
  
  if (errors.length > 0) {
    throw new ValidationError(`Habit ${habit.id} in ${filename}:\n  ${errors.join('\n  ')}`);
  }
}

async function validateGoalFile(fileInfo) {
  console.log(`📋 Validating ${fileInfo.filename}...`);
  
  try {
    const response = await fetch(`${CONTENT_API_BASE}/habits/${fileInfo.filename}`);
    if (!response.ok) {
      throw new ValidationError(`Failed to fetch ${fileInfo.filename}: ${response.status}`);
    }
    
    const habits = await response.json();
    
    if (!Array.isArray(habits)) {
      throw new ValidationError(`${fileInfo.filename} must contain an array of habits`);
    }
    
    if (habits.length === 0) {
      throw new ValidationError(`${fileInfo.filename} cannot be empty`);
    }
    
    // Validate each habit
    for (const habit of habits) {
      await validateHabitStructure(habit, fileInfo.filename);
    }
    
    // Validate business rules
    const priorities = habits.map(h => h.priority).sort((a, b) => a - b);
    const uniquePriorities = [...new Set(priorities)];
    if (priorities.length !== uniquePriorities.length) {
      throw new ValidationError(`${fileInfo.filename} has duplicate priorities: ${priorities.join(', ')}`);
    }
    
    const primaryCount = habits.filter(h => h.isPrimaryRecommendation).length;
    if (primaryCount === 0) {
      console.warn(`  ⚠️  ${fileInfo.filename} has no primary recommendations`);
    }
    
    // Validate category consistency
    const expectedCategory = fileInfo.goal;
    const invalidCategories = habits.filter(h => h.category !== expectedCategory);
    if (invalidCategories.length > 0) {
      throw new ValidationError(`${fileInfo.filename} contains habits with wrong category. Expected: ${expectedCategory}, Found: ${invalidCategories.map(h => `${h.id}:${h.category}`).join(', ')}`);
    }
    
    console.log(`  ✅ ${habits.length} habits validated`);
    console.log(`  📊 Priorities: ${priorities[0]}-${priorities[priorities.length - 1]}`);
    console.log(`  🎯 Primary recommendations: ${primaryCount}`);
    
    return {
      file: fileInfo.filename,
      goal: fileInfo.goal,
      language: fileInfo.language,
      habitCount: habits.length,
      primaryCount,
      priorityRange: [priorities[0], priorities[priorities.length - 1]],
      habits: habits.map(h => ({
        id: h.id,
        title: h.title,
        priority: h.priority,
        isPrimary: h.isPrimaryRecommendation,
        effectiveness: h.effectivenessScore
      }))
    };
    
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    throw new ValidationError(`Failed to validate ${fileInfo.filename}: ${error.message}`);
  }
}

async function validateCrossFileConsistency(validatedFiles) {
  console.log('\n🔄 Validating cross-file consistency...');
  
  // Check for duplicate habit IDs across files
  const allHabitIds = new Set();
  const duplicates = [];
  
  for (const file of validatedFiles) {
    for (const habit of file.habits) {
      if (allHabitIds.has(habit.id)) {
        duplicates.push(habit.id);
      } else {
        allHabitIds.add(habit.id);
      }
    }
  }
  
  if (duplicates.length > 0) {
    throw new ValidationError(`Duplicate habit IDs found across files: ${duplicates.join(', ')}`);
  }
  
  // Check goal coverage
  const goalCoverage = {};
  for (const file of validatedFiles) {
    if (!goalCoverage[file.goal]) {
      goalCoverage[file.goal] = [];
    }
    goalCoverage[file.goal].push(file.language);
  }
  
  console.log('  📊 Goal coverage:');
  for (const [goal, languages] of Object.entries(goalCoverage)) {
    console.log(`    ${goal}: ${languages.join(', ')}`);
  }
  
  console.log('  ✅ Cross-file consistency validated\n');
}

async function validateTypeScriptCompilation() {
  console.log('🔧 Validating TypeScript compilation...');
  
  try {
    // Run TypeScript compiler check without emitting files
    execSync('npx tsc --noEmit', { 
      stdio: 'pipe',
      cwd: path.join(__dirname, '..')
    });
    
    console.log('  ✅ TypeScript compilation successful\n');
    return true;
  } catch (error) {
    console.error('  ❌ TypeScript compilation failed:');
    console.error(error.stdout.toString());
    console.error(error.stderr.toString());
    console.log('');
    return false;
  }
}

async function generateValidationReport(validatedFiles) {
  console.log('📊 VALIDATION REPORT');
  console.log('==================');
  
  const totalHabits = validatedFiles.reduce((sum, file) => sum + file.habitCount, 0);
  const totalPrimary = validatedFiles.reduce((sum, file) => sum + file.primaryCount, 0);
  
  console.log(`Total files validated: ${validatedFiles.length}`);
  console.log(`Total habits: ${totalHabits}`);
  console.log(`Total primary recommendations: ${totalPrimary}`);
  
  console.log('\nFiles by goal:');
  const byGoal = {};
  for (const file of validatedFiles) {
    if (!byGoal[file.goal]) byGoal[file.goal] = [];
    byGoal[file.goal].push(file);
  }
  
  for (const [goal, files] of Object.entries(byGoal)) {
    console.log(`  ${goal}: ${files.length} files, ${files.reduce((sum, f) => sum + f.habitCount, 0)} habits`);
    for (const file of files) {
      console.log(`    ${file.file}: ${file.habitCount} habits (${file.primaryCount} primary)`);
    }
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, '../validation-report.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles: validatedFiles.length,
      totalHabits,
      totalPrimary,
      goalCoverage: byGoal
    },
    files: validatedFiles
  }, null, 2));
  
  console.log(`\n📁 Detailed report saved to: ${reportPath}`);
}

async function main() {
  console.log('🎯 Goal-Based Recommendations Validation');
  console.log('========================================\n');
  
  let exitCode = 0;
  let tsCompilationSuccess = true;
  
  try {
    // First, validate TypeScript compilation
    tsCompilationSuccess = await validateTypeScriptCompilation();
    if (!tsCompilationSuccess) {
      console.error('❌ TypeScript compilation failed - this must be fixed before proceeding');
      exitCode = 1;
    }

    // Discover files
    const discoveredFiles = await discoverGoalFiles();
    
    // Validate each file
    const validatedFiles = [];
    for (const fileInfo of discoveredFiles) {
      try {
        const result = await validateGoalFile(fileInfo);
        validatedFiles.push(result);
      } catch (error) {
        console.error(`❌ ${error.message}\n`);
        exitCode = 1;
      }
    }
    
    if (validatedFiles.length === 0) {
      console.error('❌ No files passed validation');
      process.exit(1);
    }
    
    // Cross-file validation
    await validateCrossFileConsistency(validatedFiles);
    
    // Generate report
    await generateValidationReport(validatedFiles);
    
    if (exitCode === 0) {
      console.log('\n✅ All validations passed!');
      console.log('   - TypeScript compilation successful');
      console.log('   - Goal-based recommendations validated');
      console.log('   - Cross-file consistency verified');
    } else {
      console.log('\n⚠️  Some validations failed:');
      if (!tsCompilationSuccess) {
        console.log('   - TypeScript compilation errors detected');
      }
      console.log('   Please fix errors before deployment');
    }
    
  } catch (error) {
    console.error(`\n❌ Validation failed: ${error.message}`);
    if (error.category === 'discovery') {
      console.error('Make sure the Content API is running on port 3002');
    }
    process.exit(1);
  }
  
  process.exit(exitCode);
}

if (require.main === module) {
  main();
}

module.exports = { main, validateGoalFile, validateHabitStructure };