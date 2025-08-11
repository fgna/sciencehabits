import { ValidationLogger } from './ValidationLogger';
import { 
  ValidationResult, 
  CriticalError, 
  DataInconsistency, 
  ContentWarning,
  HabitWithResearch,
  ValidationConfig 
} from '../../types/validation';

// Import existing types
import { Habit } from '../../types';

// Temporary interface for research studies
interface ResearchStudy {
  id: string;
  title: string;
  summary: string;
  year: number;
  authors?: string[];
  journal?: string;
  relatedHabits?: string[];
  category?: string;
  tags?: string[];
}

export class ContentValidator {
  private logger: ValidationLogger;
  private validGoalTags: string[];

  constructor(config?: Partial<ValidationConfig>) {
    this.logger = new ValidationLogger(config);
    this.validGoalTags = config?.validGoalTags || [
      'reduce_stress', 'improve_sleep', 'boost_energy', 'enhance_focus',
      'build_confidence', 'improve_fitness', 'better_relationships',
      'increase_productivity', 'develop_mindfulness', 'learn_faster'
    ];
  }

  async validateAllContent(habits: Habit[], research: ResearchStudy[]): Promise<ValidationResult> {
    console.log('🔍 Starting comprehensive content validation...');
    
    // Clear previous validation results
    this.logger.clearLogs();
    this.logger.setCounters(habits.length, research.length);

    try {
      // Step 1: Critical validation (must pass)
      console.log('⚡ Running critical validation checks...');
      const criticalErrors = await this.validateCriticalRequirements(habits, research);
      
      if (criticalErrors.length > 0) {
        const result = this.buildValidationResult(habits, research, false);
        console.error(`❌ Critical validation failed with ${criticalErrors.length} errors`);
        return result;
      }

      // Step 2: Data consistency validation (log but continue)
      console.log('🔗 Validating data consistency...');
      const enrichedHabits = await this.validateDataConsistency(habits, research);

      // Step 3: Content quality validation (warnings only)
      console.log('📝 Running content quality checks...');
      await this.validateContentQuality(habits, research);

      // Step 4: Generate reports
      console.log('📊 Generating validation reports...');
      await this.generateReports();

      const result = this.buildValidationResult(habits, research, true, enrichedHabits);
      console.log('✅ Content validation completed successfully');
      
      return result;

    } catch (error) {
      console.error('💥 Content validation crashed:', error);
      
      await this.logger.logCriticalError({
        type: 'VALIDATION_SYSTEM_ERROR',
        message: `Validation system crashed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'critical',
        blocksBuild: true,
        details: { error: error instanceof Error ? error.stack : error }
      });

      return this.buildValidationResult(habits, research, false);
    }
  }

  private async validateCriticalRequirements(habits: Habit[], research: ResearchStudy[]): Promise<CriticalError[]> {
    const errors: CriticalError[] = [];

    // Validate required habit fields
    habits.forEach((habit, index) => {
      const requiredFields = ['id', 'title', 'description', 'category'];
      const missingFields = requiredFields.filter(field => !habit[field as keyof Habit] || habit[field as keyof Habit] === '');
      
      if (missingFields.length > 0) {
        const error: CriticalError = {
          type: 'MISSING_REQUIRED_FIELDS',
          message: `Habit at index ${index} is missing required fields: ${missingFields.join(', ')}`,
          severity: 'critical',
          blocksBuild: true,
          sourceFile: 'habits data',
          details: { habitId: habit.id, missingFields, index }
        };
        errors.push(error);
        this.logger.logCriticalError(error);
      }
    });

    // Validate required research fields
    research.forEach((study, index) => {
      const requiredFields = ['id', 'title', 'summary'];
      const missingFields = requiredFields.filter(field => !study[field as keyof ResearchStudy] || study[field as keyof ResearchStudy] === '');
      
      if (missingFields.length > 0) {
        const error: CriticalError = {
          type: 'MISSING_REQUIRED_FIELDS',
          message: `Research study at index ${index} is missing required fields: ${missingFields.join(', ')}`,
          severity: 'critical',
          blocksBuild: true,
          sourceFile: 'research data',
          details: { researchId: study.id, missingFields, index }
        };
        errors.push(error);
        this.logger.logCriticalError(error);
      }
    });

    // Check for duplicate habit IDs
    const habitIds = habits.map(h => h.id);
    const duplicateHabitIds = habitIds.filter((id, index) => habitIds.indexOf(id) !== index);
    
    if (duplicateHabitIds.length > 0) {
      const error: CriticalError = {
        type: 'DUPLICATE_IDS',
        message: `Duplicate habit IDs found: ${duplicateHabitIds.join(', ')}`,
        severity: 'critical',
        blocksBuild: true,
        details: { duplicateIds: duplicateHabitIds, type: 'habit' }
      };
      errors.push(error);
      this.logger.logCriticalError(error);
    }

    // Check for duplicate research IDs
    const researchIds = research.map(r => r.id);
    const duplicateResearchIds = researchIds.filter((id, index) => researchIds.indexOf(id) !== index);
    
    if (duplicateResearchIds.length > 0) {
      const error: CriticalError = {
        type: 'DUPLICATE_IDS',
        message: `Duplicate research IDs found: ${duplicateResearchIds.join(', ')}`,
        severity: 'critical',
        blocksBuild: true,
        details: { duplicateIds: duplicateResearchIds, type: 'research' }
      };
      errors.push(error);
      this.logger.logCriticalError(error);
    }

    return errors;
  }

  private async validateDataConsistency(habits: Habit[], research: ResearchStudy[]): Promise<HabitWithResearch[]> {
    const enrichedHabits: HabitWithResearch[] = [];

    // Create research lookup map
    const researchMap = new Map(research.map(r => [r.id, r]));

    for (const habit of habits) {
      const enrichedHabit = this.enrichHabitWithResearch(habit, research, researchMap);
      enrichedHabits.push(enrichedHabit);

      // Log missing research inconsistencies
      if (enrichedHabit.missingResearchIds.length > 0) {
        await this.logger.logDataInconsistency({
          type: 'MISSING_RESEARCH',
          habitId: habit.id,
          message: `Habit "${habit.title}" references non-existent research`,
          severity: 'medium',
          impact: 'Habit will display without research evidence',
          suggestions: [
            `Add research articles with IDs: ${enrichedHabit.missingResearchIds.join(', ')}`,
            'Remove invalid researchIds from habit definition',
            'Use existing research from the same category'
          ],
          details: {
            habitTitle: habit.title,
            missingResearchIds: enrichedHabit.missingResearchIds,
            sourceFile: 'habits data'
          }
        });
      }
    }

    // Find orphaned research (not linked to any habit)
    const linkedResearchIds = new Set(
      habits.flatMap(h => h.researchIds || [])
    );

    const orphanedResearch = research.filter(study => 
      !linkedResearchIds.has(study.id) && 
      (!study.relatedHabits || study.relatedHabits.length === 0)
    );

    for (const study of orphanedResearch) {
      await this.logger.logDataInconsistency({
        type: 'ORPHANED_RESEARCH',
        researchId: study.id,
        message: `Research "${study.title}" is not linked to any habit`,
        severity: 'low',
        impact: 'Research not discoverable through habits',
        suggestions: [
          'Link to relevant habits via researchIds field',
          'Add relatedHabits field to research article',
          'Consider removing if not applicable to any habits'
        ],
        details: {
          title: study.title,
          category: study.category,
          tags: study.tags
        }
      });
    }

    // Validate goal tag consistency
    await this.validateGoalTagConsistency(habits);

    return enrichedHabits;
  }

  private enrichHabitWithResearch(
    habit: Habit, 
    allResearch: ResearchStudy[], 
    researchMap: Map<string, ResearchStudy>
  ): HabitWithResearch {
    const researchIds = habit.researchIds || [];
    const availableResearch: ResearchStudy[] = [];
    const missingResearchIds: string[] = [];

    for (const researchId of researchIds) {
      const research = researchMap.get(researchId);
      if (research) {
        availableResearch.push(research);
      } else {
        missingResearchIds.push(researchId);
      }
    }

    const hasCompleteResearch = missingResearchIds.length === 0;
    let validationStatus: 'complete' | 'partial' | 'missing_research';
    
    if (availableResearch.length === 0 && researchIds.length > 0) {
      validationStatus = 'missing_research';
    } else if (missingResearchIds.length > 0) {
      validationStatus = 'partial';
    } else {
      validationStatus = 'complete';
    }

    return {
      ...habit,
      availableResearch,
      missingResearchIds,
      hasCompleteResearch,
      validationStatus
    };
  }

  private async validateGoalTagConsistency(habits: Habit[]): Promise<void> {
    for (const habit of habits) {
      if (!habit.goalTags || habit.goalTags.length === 0) {
        await this.logger.logDataInconsistency({
          type: 'INVALID_GOAL_TAGS',
          habitId: habit.id,
          message: `Habit "${habit.title}" has no goal tags`,
          severity: 'medium',
          impact: 'Habit will not appear in goal-based recommendations',
          suggestions: [
            'Add appropriate goal tags from the valid set',
            'Ensure habit is properly categorized for user goals'
          ],
          details: {
            habitTitle: habit.title,
            validGoalTags: this.validGoalTags
          }
        });
        continue;
      }

      const invalidTags = habit.goalTags.filter(tag => !this.validGoalTags.includes(tag));
      
      if (invalidTags.length > 0) {
        await this.logger.logDataInconsistency({
          type: 'INVALID_GOAL_TAGS',
          habitId: habit.id,
          message: `Habit "${habit.title}" has invalid goal tags: ${invalidTags.join(', ')}`,
          severity: 'medium',
          impact: 'Incorrect habit recommendations for users',
          suggestions: [
            `Replace invalid tags: ${invalidTags.join(', ')}`,
            `Use valid tags: ${this.validGoalTags.join(', ')}`
          ],
          details: {
            habitTitle: habit.title,
            invalidTags,
            validGoalTags: this.validGoalTags
          }
        });
      }
    }
  }

  private async validateContentQuality(habits: Habit[], research: ResearchStudy[]): Promise<void> {
    // Check for habits without instructions
    for (const habit of habits) {
      if (!habit.instructions || habit.instructions.trim().length < 10) {
        await this.logger.logContentWarning({
          type: 'INCOMPLETE_DATA',
          category: 'incomplete_data',
          message: `Habit "${habit.title}" has insufficient instructions`,
          severity: 'low',
          details: {
            habitId: habit.id,
            currentInstructions: habit.instructions || 'none',
            recommendedMinLength: 10
          }
        });
      }
    }

    // Check for research without summaries or outdated studies
    for (const study of research) {
      if (!study.summary || study.summary.trim().length < 50) {
        await this.logger.logContentWarning({
          type: 'INCOMPLETE_DATA',
          category: 'content_quality',
          message: `Research "${study.title}" has insufficient summary`,
          severity: 'low',
          details: {
            researchId: study.id,
            currentSummaryLength: study.summary?.length || 0,
            recommendedMinLength: 50
          }
        });
      }

      if (study.year && study.year < 2015) {
        await this.logger.logContentWarning({
          type: 'OUTDATED_RESEARCH',
          category: 'content_quality',
          message: `Research "${study.title}" may be outdated (${study.year})`,
          severity: 'low',
          details: {
            researchId: study.id,
            year: study.year,
            recommendedMinYear: 2015
          }
        });
      }
    }
  }

  private async generateReports(): Promise<void> {
    await this.logger.generateValidationSummary();
    await this.logger.exportInconsistencyReport();
  }

  private buildValidationResult(
    habits: Habit[], 
    research: ResearchStudy[], 
    success: boolean,
    enrichedHabits?: HabitWithResearch[]
  ): ValidationResult {
    const results = this.logger.getValidationResults();
    
    return {
      success,
      timestamp: new Date().toISOString(),
      buildId: process.env.BUILD_ID || process.env.NODE_ENV || 'development',
      totals: results.totals,
      criticalErrors: results.criticalErrors,
      inconsistencies: results.inconsistencies,
      warnings: results.warnings,
      enrichedHabits,
      orphanedResearch: research
        .filter(r => !habits.some(h => h.researchIds?.includes(r.id)))
        .map(r => r.id)
    };
  }

  // Public method for testing and development
  getValidationConfig(): ValidationConfig {
    return {
      enableFileLogging: true,
      logDirectory: 'logs',
      failOnCriticalErrors: true,
      enableConsoleOutput: process.env.NODE_ENV === 'development',
      archiveLogs: true,
      maxLogFileSize: 10,
      validGoalTags: this.validGoalTags,
      requiredHabitFields: ['id', 'title', 'description', 'category'],
      requiredResearchFields: ['id', 'title', 'summary']
    };
  }
}