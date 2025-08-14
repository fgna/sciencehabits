import { Habit, ResearchArticle } from '../types';
import {
  ValidationResult,
  ValidationError,
  ValidationWarning,
  HabitValidationSchema,
  ResearchValidationSchema
} from '../types/content';

export class ContentValidator {
  private habitSchema: HabitValidationSchema;
  private researchSchema: ResearchValidationSchema;

  constructor() {
    this.habitSchema = {
      requiredFields: ['id', 'title', 'description', 'timeMinutes', 'category', 'goalTags', 'instructions', 'difficulty'],
      allowedCategories: ['stress', 'sleep', 'exercise', 'nutrition', 'productivity', 'mindfulness', 'tier1_foundation', 'tier2_optimization', 'tier3_microhabits'],
      allowedTimeMinutes: [1, 2, 3, 5, 10, 15, 20, 25, 30, 45, 60],
      allowedDifficulties: ['trivial', 'easy', 'moderate', 'beginner', 'intermediate', 'advanced']
    };

    this.researchSchema = {
      requiredFields: ['id', 'title', 'category', 'tags', 'readingTime', 'difficulty', 'studyDetails', 'content'],
      allowedCategories: ['nutritional_supplementation', 'cognitive_enhancement', 'mood_enhancement', 'sleep_optimization', 'stress_management', 'exercise_performance'],
      allowedDifficulties: ['beginner', 'intermediate', 'advanced'],
      allowedEvidenceLevels: ['very_high', 'high', 'moderate_to_high', 'moderate', 'low']
    };
  }

  /**
   * Validate all content - habits and research articles
   */
  async validateAll(habits: Habit[], research: ResearchArticle[]): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const startTime = performance.now();

    // Validate individual habits
    for (const habit of habits) {
      const habitValidation = this.validateHabit(habit);
      errors.push(...habitValidation.errors);
      warnings.push(...habitValidation.warnings);
    }

    // Validate individual research articles
    for (const article of research) {
      const articleValidation = this.validateResearchArticle(article);
      errors.push(...articleValidation.errors);
      warnings.push(...articleValidation.warnings);
    }

    // Cross-reference validation
    const crossRefValidation = this.validateCrossReferences(habits, research);
    errors.push(...crossRefValidation.errors);
    warnings.push(...crossRefValidation.warnings);

    // Check for duplicates
    const duplicateValidation = this.validateDuplicates(habits, research);
    errors.push(...duplicateValidation.errors);
    warnings.push(...duplicateValidation.warnings);

    const processingTime = performance.now() - startTime;

    return {
      isValid: errors.filter(e => e.severity === 'critical').length === 0,
      errors,
      warnings,
      summary: {
        totalHabits: habits.length,
        totalResearch: research.length,
        filesLoaded: [], // Will be populated by ContentLoader
        duplicatesFound: duplicateValidation.duplicatesCount || 0,
        processingTime
      }
    };
  }

  /**
   * Validate a single habit
   */
  private validateHabit(habit: Habit): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    for (const field of this.habitSchema.requiredFields) {
      if (!habit[field] && habit[field] !== 0) {
        errors.push({
          type: 'error',
          severity: 'critical',
          message: `Missing required field: ${field}`,
          file: 'unknown',
          itemId: habit.id || 'unknown',
          field
        });
      }
    }

    // Validate ID format
    if (habit.id && !/^[a-zA-Z0-9_-]+$/.test(habit.id)) {
      errors.push({
        type: 'error',
        severity: 'high',
        message: 'Habit ID contains invalid characters (use only letters, numbers, hyphens, underscores)',
        file: 'unknown',
        itemId: habit.id,
        field: 'id'
      });
    }

    // Validate time minutes
    if (habit.timeMinutes && !this.habitSchema.allowedTimeMinutes.includes(habit.timeMinutes)) {
      warnings.push({
        type: 'warning',
        message: `Unusual time duration: ${habit.timeMinutes} minutes. Consider using standard durations.`,
        file: 'unknown',
        itemId: habit.id,
        field: 'timeMinutes',
        suggestion: `Use one of: ${this.habitSchema.allowedTimeMinutes.join(', ')}`
      });
    }

    // Validate difficulty
    if (habit.difficulty && !this.habitSchema.allowedDifficulties.includes(habit.difficulty)) {
      errors.push({
        type: 'error',
        severity: 'medium',
        message: `Invalid difficulty level: ${habit.difficulty}`,
        file: 'unknown',
        itemId: habit.id,
        field: 'difficulty',
        details: { allowedValues: this.habitSchema.allowedDifficulties }
      });
    }

    // Validate goal tags
    if (habit.goalTags && habit.goalTags.length === 0) {
      warnings.push({
        type: 'warning',
        message: 'Habit has no goal tags - it won\'t appear in personalized recommendations',
        file: 'unknown',
        itemId: habit.id,
        field: 'goalTags',
        suggestion: 'Add at least one goal tag to make this habit discoverable'
      });
    }

    // Check for research references
    if (!habit.researchIds || habit.researchIds.length === 0) {
      warnings.push({
        type: 'warning',
        message: 'Habit has no research references',
        file: 'unknown',
        itemId: habit.id,
        field: 'researchIds',
        suggestion: 'Add research IDs to support evidence-based recommendations'
      });
    }

    // Validate instructions length
    if (habit.instructions && habit.instructions.length < 20) {
      warnings.push({
        type: 'warning',
        message: 'Instructions seem very short - consider adding more detail',
        file: 'unknown',
        itemId: habit.id,
        field: 'instructions',
        suggestion: 'Provide step-by-step instructions for better user experience'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate a single research article
   */
  private validateResearchArticle(article: ResearchArticle): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Check required fields
    for (const field of this.researchSchema.requiredFields) {
      if (!article[field] && article[field] !== 0) {
        errors.push({
          type: 'error',
          severity: 'critical',
          message: `Missing required field: ${field}`,
          file: 'unknown',
          itemId: article.id || 'unknown',
          field
        });
      }
    }

    // Validate ID format
    if (article.id && !/^[a-zA-Z0-9_-]+$/.test(article.id)) {
      errors.push({
        type: 'error',
        severity: 'high',
        message: 'Article ID contains invalid characters',
        file: 'unknown',
        itemId: article.id,
        field: 'id'
      });
    }

    // Validate difficulty
    if (article.difficulty && !this.researchSchema.allowedDifficulties.includes(article.difficulty)) {
      errors.push({
        type: 'error',
        severity: 'medium',
        message: `Invalid difficulty level: ${article.difficulty}`,
        file: 'unknown',
        itemId: article.id,
        field: 'difficulty'
      });
    }

    // Validate study details
    if (article.studyDetails) {
      if (!article.studyDetails.sampleSize || article.studyDetails.sampleSize < 1) {
        warnings.push({
          type: 'warning',
          message: 'Study sample size is missing or invalid',
          file: 'unknown',
          itemId: article.id,
          field: 'studyDetails.sampleSize'
        });
      }

      if (!article.studyDetails.year || article.studyDetails.year < 1900 || article.studyDetails.year > new Date().getFullYear()) {
        warnings.push({
          type: 'warning',
          message: 'Study year is missing or seems invalid',
          file: 'unknown',
          itemId: article.id,
          field: 'studyDetails.year'
        });
      }
    }

    // Validate content length
    if (article.content && article.content.length < 100) {
      warnings.push({
        type: 'warning',
        message: 'Article content seems very short',
        file: 'unknown',
        itemId: article.id,
        field: 'content',
        suggestion: 'Consider adding more detailed content for better user value'
      });
    }

    // Check for key takeaways
    if (!article.keyTakeaways || article.keyTakeaways.length === 0) {
      warnings.push({
        type: 'warning',
        message: 'Article has no key takeaways',
        file: 'unknown',
        itemId: article.id,
        field: 'keyTakeaways',
        suggestion: 'Add key takeaways to help users quickly understand the main points'
      });
    }

    return { errors, warnings };
  }

  /**
   * Validate cross-references between habits and research
   */
  private validateCrossReferences(habits: Habit[], research: ResearchArticle[]): { errors: ValidationError[], warnings: ValidationWarning[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const researchIds = new Set(research.map(r => r.id));
    const habitIds = new Set(habits.map(h => h.id));

    // Check habit research references
    for (const habit of habits) {
      if (habit.researchIds) {
        for (const researchId of habit.researchIds) {
          if (!researchIds.has(researchId)) {
            errors.push({
              type: 'error',
              severity: 'medium',
              message: `Habit references unknown research ID: ${researchId}`,
              file: 'unknown',
              itemId: habit.id,
              field: 'researchIds',
              details: { invalidReference: researchId }
            });
          }
        }
      }
    }

    // Check research habit references
    for (const article of research) {
      if (article.relatedHabits) {
        for (const habitId of article.relatedHabits) {
          if (!habitIds.has(habitId)) {
            warnings.push({
              type: 'warning',
              message: `Research article references unknown habit ID: ${habitId}`,
              file: 'unknown',
              itemId: article.id,
              field: 'relatedHabits',
              suggestion: 'Remove invalid reference or add the corresponding habit'
            });
          }
        }
      }
    }

    return { errors, warnings };
  }

  /**
   * Check for duplicate IDs
   */
  private validateDuplicates(habits: Habit[], research: ResearchArticle[]): { errors: ValidationError[], warnings: ValidationWarning[], duplicatesCount: number } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    let duplicatesCount = 0;

    // Check habit ID duplicates
    const habitIds = new Map<string, string[]>();
    for (const habit of habits) {
      if (habit.id) {
        if (!habitIds.has(habit.id)) {
          habitIds.set(habit.id, []);
        }
        habitIds.get(habit.id)!.push(habit.title || 'Unknown');
      }
    }

    for (const [id, titles] of Array.from(habitIds.entries())) {
      if (titles.length > 1) {
        duplicatesCount++;
        errors.push({
          type: 'error',
          severity: 'critical',
          message: `Duplicate habit ID: ${id} (found in ${titles.length} habits)`,
          file: 'multiple',
          itemId: id,
          details: { duplicateItems: titles }
        });
      }
    }

    // Check research ID duplicates
    const researchIds = new Map<string, string[]>();
    for (const article of research) {
      if (article.id) {
        if (!researchIds.has(article.id)) {
          researchIds.set(article.id, []);
        }
        researchIds.get(article.id)!.push(article.title || 'Unknown');
      }
    }

    for (const [id, titles] of Array.from(researchIds.entries())) {
      if (titles.length > 1) {
        duplicatesCount++;
        errors.push({
          type: 'error',
          severity: 'critical',
          message: `Duplicate research ID: ${id} (found in ${titles.length} articles)`,
          file: 'multiple',
          itemId: id,
          details: { duplicateItems: titles }
        });
      }
    }

    return { errors, warnings, duplicatesCount };
  }
}