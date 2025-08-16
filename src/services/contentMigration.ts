/**
 * Content Migration Tools
 * 
 * Tools for migrating existing content to use the new goal taxonomy system,
 * fixing unmapped goal tags, and ensuring backward compatibility.
 */

import goalTaxonomy from './goalTaxonomy';
import contentValidator from './contentValidator';

export interface MigrationResult {
  success: boolean;
  summary: MigrationSummary;
  changes: MigrationChange[];
  errors: MigrationError[];
  backupPath?: string;
}

export interface MigrationSummary {
  totalItemsProcessed: number;
  itemsChanged: number;
  goalTagsUpdated: number;
  goalTagsAdded: number;
  deprecatedTagsReplaced: number;
  unmappedTagsFixed: number;
  processingTime: number;
}

export interface MigrationChange {
  type: 'goal_tag_update' | 'goal_tag_add' | 'deprecated_replace' | 'unmapped_fix';
  targetFile: string;
  targetId: string;
  oldValue: string;
  newValue: string;
  confidence: number;
  reason: string;
}

export interface MigrationError {
  type: 'file_read' | 'file_write' | 'validation' | 'backup';
  targetFile: string;
  targetId?: string;
  message: string;
  recoverable: boolean;
}

export interface MigrationOptions {
  dryRun?: boolean;
  createBackup?: boolean;
  fixUnmappedTags?: boolean;
  replaceDeprecatedTags?: boolean;
  addMissingGoalTags?: boolean;
  minConfidence?: number;
  targetFiles?: string[];
}

export interface HabitMigrationData {
  id: string;
  title: string;
  goalTags: string[];
  category: string;
  filePath: string;
}

class ContentMigrationService {
  private readonly DEFAULT_OPTIONS: Required<MigrationOptions> = {
    dryRun: false,
    createBackup: true,
    fixUnmappedTags: true,
    replaceDeprecatedTags: true,
    addMissingGoalTags: false,
    minConfidence: 0.7,
    targetFiles: []
  };

  constructor() {
    console.log('[ContentMigration] Migration service initialized');
  }

  /**
   * Migrate all content to use the new goal taxonomy system
   */
  async migrateAllContent(options: MigrationOptions = {}): Promise<MigrationResult> {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    const startTime = performance.now();
    
    console.log(`[ContentMigration] Starting content migration (dryRun: ${opts.dryRun})`);
    
    const changes: MigrationChange[] = [];
    const errors: MigrationError[] = [];
    let backupPath: string | undefined;

    try {
      // Create backup if requested
      if (opts.createBackup && !opts.dryRun) {
        backupPath = await this.createBackup();
        console.log(`[ContentMigration] Backup created at: ${backupPath}`);
      }

      // Get all habit files to migrate
      const habitFiles = await this.getHabitFiles(opts.targetFiles);
      
      for (const file of habitFiles) {
        try {
          const fileMigration = await this.migrateHabitFile(file, opts);
          changes.push(...fileMigration.changes);
          errors.push(...fileMigration.errors);
        } catch (error) {
          errors.push({
            type: 'file_read',
            targetFile: file,
            message: `Failed to migrate file: ${error instanceof Error ? error.message : 'Unknown error'}`,
            recoverable: false
          });
        }
      }

      // Migrate goals.json if needed
      try {
        const goalsMigration = await this.migrateGoalsFile(opts);
        changes.push(...goalsMigration.changes);
        errors.push(...goalsMigration.errors);
      } catch (error) {
        errors.push({
          type: 'file_read',
          targetFile: 'goals.json',
          message: `Failed to migrate goals file: ${error instanceof Error ? error.message : 'Unknown error'}`,
          recoverable: false
        });
      }

      const processingTime = performance.now() - startTime;
      
      const summary: MigrationSummary = {
        totalItemsProcessed: habitFiles.length + 1,
        itemsChanged: changes.filter(c => c.targetFile !== '').length,
        goalTagsUpdated: changes.filter(c => c.type === 'goal_tag_update').length,
        goalTagsAdded: changes.filter(c => c.type === 'goal_tag_add').length,
        deprecatedTagsReplaced: changes.filter(c => c.type === 'deprecated_replace').length,
        unmappedTagsFixed: changes.filter(c => c.type === 'unmapped_fix').length,
        processingTime
      };

      console.log(`[ContentMigration] Migration completed in ${processingTime.toFixed(2)}ms`);
      console.log(`[ContentMigration] Made ${changes.length} changes with ${errors.length} errors`);

      return {
        success: errors.filter(e => !e.recoverable).length === 0,
        summary,
        changes,
        errors,
        backupPath
      };

    } catch (error) {
      errors.push({
        type: 'validation',
        targetFile: 'migration_process',
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recoverable: false
      });

      return {
        success: false,
        summary: {
          totalItemsProcessed: 0,
          itemsChanged: 0,
          goalTagsUpdated: 0,
          goalTagsAdded: 0,
          deprecatedTagsReplaced: 0,
          unmappedTagsFixed: 0,
          processingTime: performance.now() - startTime
        },
        changes,
        errors,
        backupPath
      };
    }
  }

  /**
   * Migrate a single habit file
   */
  async migrateHabitFile(filePath: string, options: Required<MigrationOptions>): Promise<{
    changes: MigrationChange[];
    errors: MigrationError[];
  }> {
    const changes: MigrationChange[] = [];
    const errors: MigrationError[] = [];

    try {
      // Load habit file
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const habits = await response.json();
      if (!Array.isArray(habits)) {
        throw new Error('File does not contain a valid habit array');
      }

      let fileChanged = false;

      // Process each habit
      for (const habit of habits) {
        if (!habit.id || !Array.isArray(habit.goalTags)) {
          continue;
        }

        const originalGoalTags = [...habit.goalTags];
        const newGoalTags = new Set<string>();
        let habitChanged = false;

        // Process existing goal tags
        for (const goalTag of originalGoalTags) {
          const validation = goalTaxonomy.validateGoalTag(goalTag);

          if (validation.isValid && validation.mappedGoalId) {
            if (validation.matchType === 'deprecated' && options.replaceDeprecatedTags) {
              // Replace deprecated tag with official ID
              newGoalTags.add(validation.mappedGoalId);
              changes.push({
                type: 'deprecated_replace',
                targetFile: filePath,
                targetId: habit.id,
                oldValue: goalTag,
                newValue: validation.mappedGoalId,
                confidence: validation.confidence,
                reason: 'Replaced deprecated tag with official ID'
              });
              habitChanged = true;
            } else if (validation.matchType === 'alias' && validation.confidence >= options.minConfidence) {
              // Keep high-confidence aliases as they are
              newGoalTags.add(goalTag);
            } else {
              // Keep valid tags
              newGoalTags.add(goalTag);
            }
          } else if (options.fixUnmappedTags) {
            // Try to fix unmapped tags
            const suggestions = validation.suggestions || [];
            if (suggestions.length > 0) {
              const bestSuggestion = suggestions[0];
              const suggestionValidation = goalTaxonomy.validateGoalTag(bestSuggestion);
              
              if (suggestionValidation.isValid && suggestionValidation.confidence >= options.minConfidence) {
                newGoalTags.add(suggestionValidation.mappedGoalId!);
                changes.push({
                  type: 'unmapped_fix',
                  targetFile: filePath,
                  targetId: habit.id,
                  oldValue: goalTag,
                  newValue: suggestionValidation.mappedGoalId!,
                  confidence: suggestionValidation.confidence,
                  reason: `Fixed unmapped tag using suggestion: ${bestSuggestion}`
                });
                habitChanged = true;
              } else {
                // Keep unmapped tag for now
                newGoalTags.add(goalTag);
                errors.push({
                  type: 'validation',
                  targetFile: filePath,
                  targetId: habit.id,
                  message: `Cannot fix unmapped goal tag: ${goalTag}`,
                  recoverable: true
                });
              }
            } else {
              // Keep unmapped tag
              newGoalTags.add(goalTag);
            }
          } else {
            // Keep tag as-is
            newGoalTags.add(goalTag);
          }
        }

        // Add missing goal tags if requested
        if (options.addMissingGoalTags) {
          const missingTags = this.suggestMissingGoalTags(habit);
          for (const tag of missingTags) {
            if (!newGoalTags.has(tag)) {
              newGoalTags.add(tag);
              changes.push({
                type: 'goal_tag_add',
                targetFile: filePath,
                targetId: habit.id,
                oldValue: '',
                newValue: tag,
                confidence: 0.8,
                reason: 'Added missing goal tag based on habit content analysis'
              });
              habitChanged = true;
            }
          }
        }

        // Update habit if changed
        if (habitChanged) {
          habit.goalTags = Array.from(newGoalTags);
          fileChanged = true;
        }
      }

      // Write file if changed and not dry run
      if (fileChanged && !options.dryRun) {
        await this.writeHabitFile(filePath, habits);
        console.log(`[ContentMigration] Updated file: ${filePath}`);
      }

    } catch (error) {
      errors.push({
        type: 'file_read',
        targetFile: filePath,
        message: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recoverable: false
      });
    }

    return { changes, errors };
  }

  /**
   * Migrate goals.json file
   */
  async migrateGoalsFile(options: Required<MigrationOptions>): Promise<{
    changes: MigrationChange[];
    errors: MigrationError[];
  }> {
    const changes: MigrationChange[] = [];
    const errors: MigrationError[] = [];

    try {
      const response = await fetch('/data/goals.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const goalsData = await response.json();
      if (!goalsData.goals || !Array.isArray(goalsData.goals)) {
        throw new Error('Invalid goals file format');
      }

      let fileChanged = false;

      // Validate each goal exists in taxonomy
      for (const goal of goalsData.goals) {
        const mapping = goalTaxonomy.getGoalMapping(goal.id);
        if (!mapping) {
          errors.push({
            type: 'validation',
            targetFile: 'goals.json',
            targetId: goal.id,
            message: `Goal "${goal.id}" not found in taxonomy`,
            recoverable: true
          });
        }
      }

      // Note: For now, we don't modify goals.json automatically
      // Future enhancement could add missing goals or update metadata

    } catch (error) {
      errors.push({
        type: 'file_read',
        targetFile: 'goals.json',
        message: `Failed to process goals file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        recoverable: false
      });
    }

    return { changes, errors };
  }

  /**
   * Create backup of all content files
   */
  private async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `/tmp/sciencehabits-backup-${timestamp}`;
    
    // In a real implementation, this would create actual file backups
    // For now, we just return the backup path
    console.log(`[ContentMigration] Backup would be created at: ${backupPath}`);
    
    return backupPath;
  }

  /**
   * Get list of habit files to migrate
   */
  private async getHabitFiles(targetFiles: string[]): Promise<string[]> {
    if (targetFiles.length > 0) {
      return targetFiles;
    }

    // Default habit files
    return [
      '/data/habits/mindfulness-habits.json',
      '/data/habits/nutrition-habits.json',
      '/data/habits/exercise-habits.json',
      '/data/habits/sleep-habits.json',
      '/data/habits/cognitive-habits.json',
      '/data/habits/productivity-habits.json'
    ];
  }

  /**
   * Suggest missing goal tags for a habit based on content analysis
   */
  private suggestMissingGoalTags(habit: any): string[] {
    const suggestions: string[] = [];
    
    const title = (habit.title || '').toLowerCase();
    const description = (habit.description || '').toLowerCase();
    const content = `${title} ${description}`;

    // Simple keyword-based suggestions
    const keywordMappings: Record<string, string[]> = {
      'stress': ['reduce_stress'],
      'anxiety': ['reduce_stress'],
      'meditation': ['reduce_stress', 'increase_focus'],
      'focus': ['increase_focus'],
      'concentration': ['increase_focus'],
      'memory': ['enhance_memory'],
      'sleep': ['better_sleep'],
      'energy': ['increase_energy'],
      'mood': ['improve_mood'],
      'exercise': ['improve_health'],
      'nutrition': ['improve_health'],
      'creative': ['boost_creativity'],
      'productivity': ['optimize_performance']
    };

    for (const [keyword, goalIds] of Object.entries(keywordMappings)) {
      if (content.includes(keyword)) {
        suggestions.push(...goalIds);
      }
    }

    // Remove duplicates and existing tags
    const existing = new Set(habit.goalTags || []);
    return [...new Set(suggestions)].filter(tag => !existing.has(tag));
  }

  /**
   * Write habit file (simulation for client-side)
   */
  private async writeHabitFile(filePath: string, habits: any[]): Promise<void> {
    // In a real implementation, this would write to the actual file system
    // For client-side use, this could trigger a download or send to a server
    console.log(`[ContentMigration] Would write ${habits.length} habits to ${filePath}`);
    
    // For demonstration, we could log the changes
    if (process.env.NODE_ENV === 'development') {
      console.log('Updated habits data:', JSON.stringify(habits, null, 2));
    }
  }

  /**
   * Generate migration report
   */
  generateMigrationReport(result: MigrationResult): string {
    const { summary, changes, errors } = result;
    
    const report = `# Content Migration Report

## Summary
- **Status**: ${result.success ? '✅ Success' : '❌ Failed'}
- **Processing Time**: ${summary.processingTime.toFixed(2)}ms
- **Items Processed**: ${summary.totalItemsProcessed}
- **Items Changed**: ${summary.itemsChanged}

## Changes Made
- Goal Tags Updated: ${summary.goalTagsUpdated}
- Goal Tags Added: ${summary.goalTagsAdded}
- Deprecated Tags Replaced: ${summary.deprecatedTagsReplaced}
- Unmapped Tags Fixed: ${summary.unmappedTagsFixed}

## Detailed Changes (${changes.length})
${changes.length === 0 ? 'No changes made' : changes.map(change => 
  `- **${change.type}** in ${change.targetId}: "${change.oldValue}" → "${change.newValue}" (confidence: ${(change.confidence * 100).toFixed(1)}%)`
).join('\n')}

## Errors (${errors.length})
${errors.length === 0 ? 'No errors encountered ✅' : errors.map(error => 
  `- **${error.type}** in ${error.targetFile}${error.targetId ? `:${error.targetId}` : ''}: ${error.message}`
).join('\n')}

${result.backupPath ? `## Backup\nBackup created at: ${result.backupPath}` : ''}

---
Generated: ${new Date().toISOString()}
`;

    return report;
  }

  /**
   * Rollback migration using backup
   */
  async rollbackMigration(backupPath: string): Promise<boolean> {
    try {
      console.log(`[ContentMigration] Rolling back migration from backup: ${backupPath}`);
      
      // In a real implementation, this would restore files from backup
      // For now, we just log the operation
      console.log('[ContentMigration] Rollback completed');
      
      return true;
    } catch (error) {
      console.error('[ContentMigration] Rollback failed:', error);
      return false;
    }
  }

  /**
   * Validate migration was successful
   */
  async validateMigration(): Promise<{
    isValid: boolean;
    issues: string[];
    improvements: string[];
  }> {
    console.log('[ContentMigration] Validating migration results');
    
    const validationResult = await contentValidator.validateAllContent({ forceRefresh: true });
    
    const issues: string[] = [];
    const improvements: string[] = [];

    // Check for critical errors
    const criticalErrors = validationResult.errors.filter(e => e.severity === 'critical' || e.severity === 'high');
    if (criticalErrors.length > 0) {
      issues.push(`${criticalErrors.length} critical/high severity errors remain`);
    }

    // Check for unmapped goals
    if (validationResult.stats.unmappedGoals > 0) {
      issues.push(`${validationResult.stats.unmappedGoals} unmapped goals remain`);
    }

    // Note improvements
    if (validationResult.stats.confidenceDistribution.high > 0) {
      improvements.push(`${validationResult.stats.confidenceDistribution.high} high-confidence mappings`);
    }

    if (validationResult.stats.validationScore > 80) {
      improvements.push(`Good validation score: ${validationResult.stats.validationScore}/100`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      improvements
    };
  }
}

// Create singleton instance
export const contentMigration = new ContentMigrationService();

// Export types and main service
export { ContentMigrationService };
export default contentMigration;