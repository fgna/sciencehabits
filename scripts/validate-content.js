#!/usr/bin/env node

/**
 * Pre-build Content Validation Script
 * 
 * This script validates all content before building the application.
 * Critical errors will fail the build, while inconsistencies are logged but allow the build to continue.
 */

const path = require('path');
const fs = require('fs').promises;
const { NodeAutoContentLoader } = require('./auto-content-loader.js');

// Simple validation implementation for Node.js environment
class SimpleContentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.inconsistencies = [];
  }

  async validateAllContent() {
    console.log('🔍 Starting content validation...');
    
    try {
      // Use auto content loader to discover and load all files
      const autoLoader = new NodeAutoContentLoader();
      const loadedContent = await autoLoader.loadAllContent();
      
      const habits = loadedContent.habits;
      const research = loadedContent.research;
      
      console.log(`📊 Loaded ${habits.length} habits, ${research.length} research articles`);
      
      // Run validations
      await this.validateCriticalRequirements(habits, research);
      await this.validateDataConsistency(habits, research);
      await this.validateContentQuality(habits, research);
      
      // Generate summary
      const summary = this.generateSummary(habits.length, research.length);
      
      return {
        success: this.errors.length === 0,
        summary,
        errors: this.errors,
        warnings: this.warnings,
        inconsistencies: this.inconsistencies
      };
      
    } catch (error) {
      console.error('💥 Validation crashed:', error.message);
      return {
        success: false,
        summary: null,
        errors: [{ type: 'SYSTEM_ERROR', message: error.message }],
        warnings: [],
        inconsistencies: []
      };
    }
  }

  async loadHabits() {
    const habits = [];
    const dataDir = path.join(__dirname, '../src/data');
    
    // Load main habits file
    try {
      const habitsPath = path.join(dataDir, 'habits.json');
      const habitsContent = await fs.readFile(habitsPath, 'utf8');
      const mainHabits = JSON.parse(habitsContent);
      habits.push(...mainHabits);
    } catch (error) {
      console.warn('⚠️ Could not load main habits.json:', error.message);
    }

    // Load enhanced habits file
    try {
      const enhancedPath = path.join(dataDir, 'enhanced_habits.json');
      const enhancedContent = await fs.readFile(enhancedPath, 'utf8');
      const enhancedData = JSON.parse(enhancedContent);
      // Handle both array format and object format with habits array
      const enhancedHabits = Array.isArray(enhancedData) ? enhancedData : (enhancedData.habits || []);
      habits.push(...enhancedHabits);
    } catch (error) {
      console.warn('⚠️ Could not load enhanced_habits.json:', error.message);
    }

    // Load habits from subdirectories
    try {
      const habitsDir = path.join(dataDir, 'habits');
      const files = await fs.readdir(habitsDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(habitsDir, file);
            const fileContent = await fs.readFile(filePath, 'utf8');
            const fileHabits = JSON.parse(fileContent);
            habits.push(...fileHabits);
          } catch (error) {
            console.warn(`⚠️ Could not load ${file}:`, error.message);
          }
        }
      }
    } catch (error) {
      // habits subdirectory doesn't exist, that's ok
    }

    return habits;
  }

  async loadResearch() {
    const research = [];
    const researchMap = new Map(); // For deduplication
    const dataDir = path.join(__dirname, '../src/data');
    
    // Load main research files
    const researchFiles = [
      'research.json',
      'research_articles.json',
      'enhanced_research.json'
    ];

    for (const filename of researchFiles) {
      try {
        const researchPath = path.join(dataDir, filename);
        const researchContent = await fs.readFile(researchPath, 'utf8');
        const researchData = JSON.parse(researchContent);
        // Handle both array format and object format with articles array
        const articles = Array.isArray(researchData) ? researchData : (researchData.articles || researchData.research || researchData.studies || []);
        
        // Add articles to map for deduplication
        articles.forEach(article => {
          if (article && article.id) {
            researchMap.set(article.id, article);
          }
        });
      } catch (error) {
        console.warn(`⚠️ Could not load ${filename}:`, error.message);
      }
    }

    // Load research from subdirectories
    try {
      const researchDir = path.join(dataDir, 'research');
      const files = await fs.readdir(researchDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const filePath = path.join(researchDir, file);
            const fileContent = await fs.readFile(filePath, 'utf8');
            const fileResearch = JSON.parse(fileContent);
            const articles = Array.isArray(fileResearch) ? fileResearch : (fileResearch.articles || fileResearch.research || fileResearch.studies || []);
            
            // Add articles to map for deduplication
            articles.forEach(article => {
              if (article && article.id) {
                researchMap.set(article.id, article);
              }
            });
          } catch (error) {
            console.warn(`⚠️ Could not load research/${file}:`, error.message);
          }
        }
      }
    } catch (error) {
      // research subdirectory doesn't exist, that's ok
    }

    // Convert map back to array
    return Array.from(researchMap.values());
  }

  async validateCriticalRequirements(habits, research) {
    // Check for required habit fields
    habits.forEach((habit, index) => {
      if (!habit.id || !habit.title || !habit.description) {
        this.errors.push({
          type: 'MISSING_REQUIRED_FIELDS',
          message: `Habit at index ${index} missing required fields (id, title, description)`,
          details: { habitId: habit.id || `index_${index}`, index }
        });
      }
    });

    // Check for duplicate habit IDs
    const habitIds = habits.map(h => h.id).filter(id => id);
    const duplicateHabitIds = habitIds.filter((id, index) => habitIds.indexOf(id) !== index);
    
    if (duplicateHabitIds.length > 0) {
      this.errors.push({
        type: 'DUPLICATE_IDS',
        message: `Duplicate habit IDs: ${[...new Set(duplicateHabitIds)].join(', ')}`,
        details: { duplicates: [...new Set(duplicateHabitIds)] }
      });
    }

    // Check for required research fields
    research.forEach((study, index) => {
      if (!study || typeof study !== 'object') {
        this.errors.push({
          type: 'MISSING_REQUIRED_FIELDS',
          message: `Research study at index ${index} is not a valid object`,
          details: { studyData: study, index }
        });
        return;
      }
      
      const missingFields = [];
      if (!study.id || study.id === '') missingFields.push('id');
      if (!study.title || study.title === '') missingFields.push('title');
      if (!study.summary || study.summary === '') missingFields.push('summary');
      
      if (missingFields.length > 0) {
        // For development, make this a warning instead of error to allow graceful degradation
        const isDevMode = process.env.NODE_ENV === 'development' || process.argv.includes('--allow-warnings');
        
        if (isDevMode) {
          this.inconsistencies.push({
            type: 'MISSING_REQUIRED_FIELDS',
            researchId: study.id || `index_${index}`,
            message: `Research study "${study.title || 'Unknown'}" missing required fields: ${missingFields.join(', ')}`,
            severity: 'high',
            impact: 'Research article will not display properly',
            suggestions: [`Add missing fields: ${missingFields.join(', ')}`],
            details: { missingFields, index, availableFields: Object.keys(study) }
          });
        } else {
          this.errors.push({
            type: 'MISSING_REQUIRED_FIELDS',
            message: `Research at index ${index} missing required fields: ${missingFields.join(', ')}`,
            details: { researchId: study.id || `index_${index}`, missingFields, index }
          });
        }
      }
    });

    // Check for duplicate research IDs
    const researchIds = research.map(r => r.id).filter(id => id);
    const duplicateResearchIds = researchIds.filter((id, index) => researchIds.indexOf(id) !== index);
    
    if (duplicateResearchIds.length > 0) {
      this.errors.push({
        type: 'DUPLICATE_IDS',
        message: `Duplicate research IDs: ${[...new Set(duplicateResearchIds)].join(', ')}`,
        details: { duplicates: [...new Set(duplicateResearchIds)] }
      });
    }
  }

  async validateDataConsistency(habits, research) {
    const researchIds = new Set(research.map(r => r.id));
    
    // Check for missing research references
    habits.forEach(habit => {
      if (habit.researchIds && Array.isArray(habit.researchIds)) {
        const missingIds = habit.researchIds.filter(id => !researchIds.has(id));
        
        if (missingIds.length > 0) {
          this.inconsistencies.push({
            type: 'MISSING_RESEARCH',
            habitId: habit.id,
            message: `Habit "${habit.title}" references non-existent research: ${missingIds.join(', ')}`,
            details: { missingIds, habitTitle: habit.title }
          });
        }
      }
    });

    // Check for orphaned research
    const linkedResearchIds = new Set();
    habits.forEach(habit => {
      if (habit.researchIds && Array.isArray(habit.researchIds)) {
        habit.researchIds.forEach(id => linkedResearchIds.add(id));
      }
    });

    research.forEach(study => {
      if (!linkedResearchIds.has(study.id)) {
        this.inconsistencies.push({
          type: 'ORPHANED_RESEARCH',
          researchId: study.id,
          message: `Research "${study.title}" is not linked to any habit`,
          details: { title: study.title }
        });
      }
    });

    // Validate goal tags
    const validGoalTags = [
      'reduce_stress', 'improve_sleep', 'boost_energy', 'enhance_focus',
      'build_confidence', 'improve_fitness', 'better_relationships',
      'increase_productivity', 'develop_mindfulness', 'learn_faster'
    ];

    habits.forEach(habit => {
      if (!habit.goalTags || !Array.isArray(habit.goalTags) || habit.goalTags.length === 0) {
        this.inconsistencies.push({
          type: 'MISSING_GOAL_TAGS',
          habitId: habit.id,
          message: `Habit "${habit.title}" has no goal tags`,
          details: { habitTitle: habit.title }
        });
        return;
      }

      const invalidTags = habit.goalTags.filter(tag => !validGoalTags.includes(tag));
      if (invalidTags.length > 0) {
        this.inconsistencies.push({
          type: 'INVALID_GOAL_TAGS',
          habitId: habit.id,
          message: `Habit "${habit.title}" has invalid goal tags: ${invalidTags.join(', ')}`,
          details: { habitTitle: habit.title, invalidTags }
        });
      }
    });
  }

  async validateContentQuality(habits, research) {
    // Check for habits without instructions
    habits.forEach(habit => {
      if (!habit.instructions || habit.instructions.trim().length < 10) {
        this.warnings.push({
          type: 'INCOMPLETE_INSTRUCTIONS',
          habitId: habit.id,
          message: `Habit "${habit.title}" has insufficient instructions`,
          details: { habitTitle: habit.title }
        });
      }
    });

    // Check for research quality issues
    research.forEach(study => {
      if (!study.summary || study.summary.trim().length < 50) {
        this.warnings.push({
          type: 'INSUFFICIENT_SUMMARY',
          researchId: study.id,
          message: `Research "${study.title}" has insufficient summary`,
          details: { title: study.title }
        });
      }

      if (study.year && study.year < 2015) {
        this.warnings.push({
          type: 'OUTDATED_RESEARCH',
          researchId: study.id,
          message: `Research "${study.title}" may be outdated (${study.year})`,
          details: { title: study.title, year: study.year }
        });
      }
    });
  }

  generateSummary(habitsCount, researchCount) {
    return {
      timestamp: new Date().toISOString(),
      totals: {
        habitsProcessed: habitsCount,
        researchProcessed: researchCount,
        criticalErrors: this.errors.length,
        inconsistencies: this.inconsistencies.length,
        warnings: this.warnings.length
      },
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.errors.length > 0) {
      recommendations.push('🚨 Fix critical errors before deployment');
    }

    const missingResearchCount = this.inconsistencies.filter(i => i.type === 'MISSING_RESEARCH').length;
    if (missingResearchCount > 0) {
      recommendations.push(`📚 Add research articles for ${missingResearchCount} habits`);
    }

    const orphanedResearchCount = this.inconsistencies.filter(i => i.type === 'ORPHANED_RESEARCH').length;
    if (orphanedResearchCount > 0) {
      recommendations.push(`🔗 Link ${orphanedResearchCount} orphaned research articles`);
    }

    if (this.warnings.length > 5) {
      recommendations.push('📝 Review content quality warnings');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Content validation passed with no major issues');
    }

    return recommendations;
  }
}

// Main execution
async function main() {
  const validator = new SimpleContentValidator();
  
  try {
    const result = await validator.validateAllContent();
    
    if (result.summary) {
      console.log('\n📊 Validation Summary:');
      console.log(`   Habits: ${result.summary.totals.habitsProcessed}`);
      console.log(`   Research: ${result.summary.totals.researchProcessed}`);
      console.log(`   Critical Errors: ${result.summary.totals.criticalErrors}`);
      console.log(`   Inconsistencies: ${result.summary.totals.inconsistencies}`);
      console.log(`   Warnings: ${result.summary.totals.warnings}`);
    }

    if (result.errors.length > 0) {
      console.error('\n❌ Critical Errors:');
      result.errors.forEach(error => {
        console.error(`   - ${error.message}`);
      });
      
      console.error('\n🚨 Build failed due to critical content errors');
      process.exit(1);
    }

    if (result.inconsistencies.length > 0) {
      console.warn(`\n⚠️ Found ${result.inconsistencies.length} data inconsistencies:`);
      result.inconsistencies.slice(0, 5).forEach(inconsistency => {
        console.warn(`   - ${inconsistency.message}`);
      });
      
      if (result.inconsistencies.length > 5) {
        console.warn(`   ... and ${result.inconsistencies.length - 5} more`);
      }
      
      console.warn('\n📝 App will continue with graceful degradation');
    }

    if (result.warnings.length > 0) {
      console.info(`\n💡 Found ${result.warnings.length} content quality warnings`);
    }

    if (result.summary && result.summary.recommendations) {
      console.log('\n🎯 Recommendations:');
      result.summary.recommendations.forEach(rec => {
        console.log(`   ${rec}`);
      });
    }

    console.log('\n✅ Content validation completed successfully');
    
  } catch (error) {
    console.error('💥 Content validation script failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { SimpleContentValidator };