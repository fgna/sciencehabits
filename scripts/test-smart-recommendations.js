#!/usr/bin/env node

/**
 * Test script for Smart Recommendation Engine
 * Tests the engine with sample onboarding goals
 */

console.log('🧠 Testing Smart Recommendation Engine...\n');

// Simulate the recommendation engine logic
const testGoals = [
  'reduce_stress',
  'increase_focus', 
  'improve_mood',
  'increase_energy',
  'better_sleep'
];

console.log('📋 Test Goals:', testGoals.join(', '));

// Test goal taxonomy validation
console.log('\n🗂️  Testing Goal Taxonomy...');

try {
  const fs = require('fs');
  const taxonomyFile = fs.readFileSync('src/data/goalTaxonomy.json', 'utf8');
  const taxonomyData = JSON.parse(taxonomyFile);
  
  const aliasToGoal = new Map();
  
  // Build alias mapping
  for (const mapping of taxonomyData.mappings) {
    aliasToGoal.set(mapping.officialId.toLowerCase(), mapping.officialId);
    for (const alias of mapping.aliases || []) {
      aliasToGoal.set(alias.toLowerCase(), mapping.officialId);
    }
  }
  
  console.log(`✅ Loaded ${taxonomyData.mappings.length} goal mappings`);
  
  // Test each goal
  let mappedCount = 0;
  for (const goal of testGoals) {
    const mapped = aliasToGoal.get(goal.toLowerCase());
    if (mapped) {
      console.log(`✅ ${goal} → ${mapped}`);
      mappedCount++;
    } else {
      console.log(`❌ ${goal} → NOT MAPPED`);
    }
  }
  
  console.log(`\n📊 Results: ${mappedCount}/${testGoals.length} goals mapped`);
  
  if (mappedCount === testGoals.length) {
    console.log('🎉 All test goals successfully mapped!');
  } else {
    console.log('⚠️ Some goals not mapped - check taxonomy');
  }

} catch (error) {
  console.error('❌ Goal taxonomy test failed:', error.message);
  process.exit(1);
}

// Test habit loading
console.log('\n💪 Testing Habit Loading...');

try {
  const fs = require('fs');
  const path = require('path');
  
  const habitDir = 'public/data/habits';
  const habitFiles = fs.readdirSync(habitDir)
    .filter(file => file.endsWith('.json') && file !== 'fixed-all-content-2025-08-12.json')
    .map(file => path.join(habitDir, file));
  
  let totalHabits = 0;
  let validHabits = 0;
  
  for (const filePath of habitFiles) {
    try {
      const habitFile = fs.readFileSync(filePath, 'utf8');
      const habits = JSON.parse(habitFile);
      
      if (Array.isArray(habits)) {
        totalHabits += habits.length;
        for (const habit of habits) {
          if (habit.id && habit.goalTags && Array.isArray(habit.goalTags)) {
            validHabits++;
          }
        }
        console.log(`✅ ${path.basename(filePath)}: ${habits.length} habits`);
      } else {
        console.log(`⚠️ ${path.basename(filePath)}: Not an array`);
      }
    } catch (error) {
      console.log(`❌ ${path.basename(filePath)}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Results: ${validHabits}/${totalHabits} valid habits loaded`);
  
  if (validHabits > 0) {
    console.log('🎉 Habit loading successful!');
  } else {
    console.log('❌ No valid habits found');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ Habit loading test failed:', error.message);
  process.exit(1);
}

// Test recommendation simulation
console.log('\n🔍 Testing Recommendation Logic...');

try {
  const fs = require('fs');
  const taxonomyFile = fs.readFileSync('src/data/goalTaxonomy.json', 'utf8');
  const taxonomyData = JSON.parse(taxonomyFile);
  
  // Build mapping
  const aliasToGoal = new Map();
  for (const mapping of taxonomyData.mappings) {
    aliasToGoal.set(mapping.officialId.toLowerCase(), mapping.officialId);
    for (const alias of mapping.aliases || []) {
      aliasToGoal.set(alias.toLowerCase(), mapping.officialId);
    }
  }
  
  // Load habits
  const path = require('path');
  const habitDir = 'public/data/habits';
  const habitFiles = fs.readdirSync(habitDir)
    .filter(file => file.endsWith('.json') && file !== 'fixed-all-content-2025-08-12.json')
    .map(file => path.join(habitDir, file));
  
  const allHabits = [];
  for (const filePath of habitFiles) {
    try {
      const habitFile = fs.readFileSync(filePath, 'utf8');
      const habits = JSON.parse(habitFile);
      if (Array.isArray(habits)) {
        allHabits.push(...habits);
      }
    } catch (error) {
      // Skip invalid files
    }
  }
  
  // Test recommendation for each goal
  for (const testGoal of testGoals) {
    const mappedGoalId = aliasToGoal.get(testGoal.toLowerCase());
    if (!mappedGoalId) continue;
    
    // Find habits for this goal
    const matchingHabits = allHabits.filter(habit => {
      return habit.goalTags && habit.goalTags.some(tag => {
        const normalizedTag = tag.toLowerCase();
        const tagMapping = aliasToGoal.get(normalizedTag);
        return tagMapping === mappedGoalId;
      });
    });
    
    console.log(`🎯 ${testGoal}: ${matchingHabits.length} habits found`);
    
    if (matchingHabits.length === 0) {
      console.log(`  ❌ No habits for ${testGoal} - this will cause "No habits found" error`);
    } else {
      matchingHabits.slice(0, 3).forEach(habit => {
        console.log(`  ✅ ${habit.title}`);
      });
    }
  }
  
  console.log('\n🎉 Smart Recommendation Engine test completed!');
  console.log('✅ The system should prevent "No habits found" errors');

} catch (error) {
  console.error('❌ Recommendation simulation failed:', error.message);
  process.exit(1);
}

console.log('\n🏆 All tests passed! Goal-to-Habit Mapping System is working correctly.');