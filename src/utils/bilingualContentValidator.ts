/**
 * Bilingual Content Validator
 * 
 * Validates bilingual habit content against JSON schema and
 * performs additional content quality checks.
 */

import { BilingualHabit, SupportedLanguage } from '../types/localization';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ContentStats;
}

export interface ValidationError {
  type: 'schema' | 'content' | 'research' | 'translation';
  field: string;
  message: string;
  habitId?: string;
  language?: SupportedLanguage;
}

export interface ValidationWarning {
  type: 'quality' | 'consistency' | 'formatting' | 'research';
  field: string;
  message: string;
  habitId?: string;
  language?: SupportedLanguage;
  suggestion?: string;
}

export interface ContentStats {
  totalHabits: number;
  languagesCovered: SupportedLanguage[];
  averageEffectivenessScore: number;
  researchSourcesCount: number;
  primaryRecommendationCount: number;
  difficultyDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
}

export class BilingualContentValidator {
  private static readonly REQUIRED_LANGUAGES: SupportedLanguage[] = ['en', 'de'];
  private static readonly VALID_GOAL_CATEGORIES = ['better_sleep', 'get_moving', 'feel_better'];
  private static readonly MAX_EFFECTIVENESS_SCORE = 10.0;
  private static readonly MIN_EFFECTIVENESS_SCORE = 1.0;

  /**
   * Validate a complete bilingual habits dataset
   */
  static validateHabitsCollection(habits: BilingualHabit[]): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Basic structure validation
    if (!Array.isArray(habits)) {
      errors.push({
        type: 'schema',
        field: 'habits',
        message: 'Habits must be an array'
      });
      return this.createFailureResult(errors, warnings, habits);
    }

    if (habits.length === 0) {
      errors.push({
        type: 'content',
        field: 'habits',
        message: 'Habits array cannot be empty'
      });
      return this.createFailureResult(errors, warnings, habits);
    }

    // Validate each habit
    habits.forEach(habit => {
      this.validateSingleHabit(habit, errors, warnings);
    });

    // Cross-habit validation
    this.validateHabitConsistency(habits, errors, warnings);

    const stats = this.generateContentStats(habits);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      stats
    };
  }

  /**
   * Validate a single habit
   */
  private static validateSingleHabit(
    habit: BilingualHabit, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    // Required fields validation
    if (!habit.id) {
      errors.push({
        type: 'schema',
        field: 'id',
        message: 'Habit ID is required',
        habitId: habit.id
      });
    } else {
      // ID format validation
      const idPattern = /^(sleep|move|feel)_\d{3}_[a-z_]+$/;
      if (!idPattern.test(habit.id)) {
        errors.push({
          type: 'schema',
          field: 'id',
          message: 'Habit ID must follow pattern: category_number_name',
          habitId: habit.id
        });
      }
    }

    // Goal category validation
    if (!this.VALID_GOAL_CATEGORIES.includes(habit.goalCategory)) {
      errors.push({
        type: 'schema',
        field: 'goalCategory',
        message: `Invalid goal category. Must be one of: ${this.VALID_GOAL_CATEGORIES.join(', ')}`,
        habitId: habit.id
      });
    }

    // Effectiveness score validation
    if (typeof habit.effectivenessScore !== 'number' ||
        habit.effectivenessScore < this.MIN_EFFECTIVENESS_SCORE ||
        habit.effectivenessScore > this.MAX_EFFECTIVENESS_SCORE) {
      errors.push({
        type: 'content',
        field: 'effectivenessScore',
        message: `Effectiveness score must be between ${this.MIN_EFFECTIVENESS_SCORE} and ${this.MAX_EFFECTIVENESS_SCORE}`,
        habitId: habit.id
      });
    }

    // Effectiveness rank validation
    if (typeof habit.effectivenessRank !== 'number' ||
        habit.effectivenessRank < 1 || 
        habit.effectivenessRank > 10) {
      errors.push({
        type: 'content',
        field: 'effectivenessRank',
        message: 'Effectiveness rank must be between 1 and 10',
        habitId: habit.id
      });
    }

    // Translations validation
    if (!habit.translations || typeof habit.translations !== 'object') {
      errors.push({
        type: 'schema',
        field: 'translations',
        message: 'Translations object is required',
        habitId: habit.id
      });
      return;
    }

    // Validate each required language
    this.REQUIRED_LANGUAGES.forEach(lang => {
      if (!habit.translations[lang]) {
        errors.push({
          type: 'translation',
          field: 'translations',
          message: `Missing translation for language: ${lang}`,
          habitId: habit.id,
          language: lang
        });
      } else {
        this.validateTranslation(habit.translations[lang], lang, habit.id, errors, warnings);
      }
    });

    // Content quality warnings
    this.checkContentQuality(habit, warnings);
  }

  /**
   * Validate a single translation
   */
  private static validateTranslation(
    translation: any,
    language: SupportedLanguage,
    habitId: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const requiredFields = [
      'title', 'description', 'researchSummary', 'researchSource',
      'whyItWorks', 'quickStart', 'timeToComplete', 'optimalTiming',
      'difficultyLevel', 'category', 'researchEffectiveness', 'progressionTips'
    ];

    requiredFields.forEach(field => {
      if (!translation[field] || typeof translation[field] !== 'string') {
        errors.push({
          type: 'translation',
          field,
          message: `Missing or invalid ${field} for ${language}`,
          habitId,
          language
        });
      }
    });

    // Content length validation
    if (translation.title && translation.title.length > 100) {
      warnings.push({
        type: 'quality',
        field: 'title',
        message: 'Title is quite long, consider shortening for better UX',
        habitId,
        language,
        suggestion: 'Keep titles under 80 characters'
      });
    }

    if (translation.description && translation.description.length > 300) {
      warnings.push({
        type: 'quality',
        field: 'description',
        message: 'Description is very long, may impact readability',
        habitId,
        language,
        suggestion: 'Keep descriptions under 250 characters'
      });
    }

    // Research validation
    if (translation.researchSummary && !translation.researchSummary.includes('participants')) {
      warnings.push({
        type: 'research',
        field: 'researchSummary',
        message: 'Research summary should mention participant count',
        habitId,
        language,
        suggestion: 'Include "X participants" or "X subjects" in research summary'
      });
    }

    if (translation.researchSource && !translation.researchSource.match(/\(\d{4}\)/)) {
      warnings.push({
        type: 'research',
        field: 'researchSource',
        message: 'Research source should include publication year in parentheses',
        habitId,
        language,
        suggestion: 'Format: Author, A. (YYYY). Title. Journal.'
      });
    }

    // Time format validation
    if (translation.timeToComplete && !translation.timeToComplete.match(/^\d+(-\d+)? (minutes?|hours?)( per day)?$/)) {
      warnings.push({
        type: 'formatting',
        field: 'timeToComplete',
        message: 'Time format should be standardized',
        habitId,
        language,
        suggestion: 'Use format: "X minutes" or "X-Y minutes per day"'
      });
    }

    // Difficulty level validation
    const validDifficultyLevels = ['beginner', 'intermediate', 'advanced'];
    if (translation.difficultyLevel && !validDifficultyLevels.includes(translation.difficultyLevel)) {
      errors.push({
        type: 'content',
        field: 'difficultyLevel',
        message: `Invalid difficulty level. Must be one of: ${validDifficultyLevels.join(', ')}`,
        habitId,
        language
      });
    }
  }

  /**
   * Validate consistency across habits
   */
  private static validateHabitConsistency(
    habits: BilingualHabit[],
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Check for duplicate IDs
    const ids = habits.map(h => h.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    duplicateIds.forEach(id => {
      errors.push({
        type: 'content',
        field: 'id',
        message: `Duplicate habit ID found: ${id}`,
        habitId: id
      });
    });

    // Check effectiveness ranking consistency within goal categories
    const categoryGroups = this.groupByCategory(habits);
    Object.entries(categoryGroups).forEach(([category, categoryHabits]) => {
      this.validateCategoryRanking(categoryHabits, category, errors, warnings);
    });

    // Check primary recommendation distribution
    const primaryRecommendations = habits.filter(h => h.isPrimaryRecommendation);
    if (primaryRecommendations.length === 0) {
      warnings.push({
        type: 'quality',
        field: 'isPrimaryRecommendation',
        message: 'No primary recommendations found',
        suggestion: 'Mark top 3 habits as primary recommendations'
      });
    } else if (primaryRecommendations.length > 9) {
      warnings.push({
        type: 'quality',
        field: 'isPrimaryRecommendation',
        message: 'Too many primary recommendations',
        suggestion: 'Limit primary recommendations to top 3 per category'
      });
    }
  }

  /**
   * Validate ranking within a category
   */
  private static validateCategoryRanking(
    habits: BilingualHabit[],
    category: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    const ranks = habits.map(h => h.effectivenessRank).sort((a, b) => a - b);
    const expectedRanks = Array.from({ length: habits.length }, (_, i) => i + 1);
    
    if (JSON.stringify(ranks) !== JSON.stringify(expectedRanks)) {
      warnings.push({
        type: 'consistency',
        field: 'effectivenessRank',
        message: `Ranking gaps or duplicates in category ${category}`,
        suggestion: 'Ensure ranks are sequential starting from 1'
      });
    }

    // Check if higher ranks have higher effectiveness scores
    const sortedByRank = habits.sort((a, b) => a.effectivenessRank - b.effectivenessRank);
    for (let i = 1; i < sortedByRank.length; i++) {
      if (sortedByRank[i].effectivenessScore > sortedByRank[i - 1].effectivenessScore) {
        warnings.push({
          type: 'consistency',
          field: 'effectivenessScore',
          message: `Lower ranked habit has higher effectiveness score in ${category}`,
          habitId: sortedByRank[i].id,
          suggestion: 'Ensure effectiveness scores align with rankings'
        });
      }
    }
  }

  /**
   * Check content quality
   */
  private static checkContentQuality(habit: BilingualHabit, warnings: ValidationWarning[]): void {
    // Check for research quantification
    Object.entries(habit.translations).forEach(([lang, translation]) => {
      if (!translation.researchEffectiveness.match(/\d+%/)) {
        warnings.push({
          type: 'quality',
          field: 'researchEffectiveness',
          message: 'Should include percentage improvement',
          habitId: habit.id,
          language: lang as SupportedLanguage,
          suggestion: 'Include quantified results like "increases X by Y%"'
        });
      }

      // Check for actionable quick start
      if (!translation.quickStart.toLowerCase().includes('start') && 
          !translation.quickStart.toLowerCase().includes('begin')) {
        warnings.push({
          type: 'quality',
          field: 'quickStart',
          message: 'Quick start should be more actionable',
          habitId: habit.id,
          language: lang as SupportedLanguage,
          suggestion: 'Use action verbs like "Start by...", "Begin with..."'
        });
      }
    });
  }

  /**
   * Group habits by category
   */
  private static groupByCategory(habits: BilingualHabit[]): Record<string, BilingualHabit[]> {
    return habits.reduce((groups, habit) => {
      const category = habit.goalCategory;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(habit);
      return groups;
    }, {} as Record<string, BilingualHabit[]>);
  }

  /**
   * Generate content statistics
   */
  private static generateContentStats(habits: BilingualHabit[]): ContentStats {
    const totalHabits = habits.length;
    const languagesCovered: SupportedLanguage[] = ['en', 'de'];
    
    const averageEffectivenessScore = habits.reduce((sum, h) => sum + h.effectivenessScore, 0) / totalHabits;
    
    const researchSources = new Set(habits.map(h => h.translations.en.researchSource));
    const researchSourcesCount = researchSources.size;
    
    const primaryRecommendationCount = habits.filter(h => h.isPrimaryRecommendation).length;
    
    const difficultyDistribution = habits.reduce((dist, h) => {
      const difficulty = h.translations.en.difficultyLevel;
      dist[difficulty] = (dist[difficulty] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);
    
    const categoryDistribution = habits.reduce((dist, h) => {
      const category = h.translations.en.category;
      dist[category] = (dist[category] || 0) + 1;
      return dist;
    }, {} as Record<string, number>);

    return {
      totalHabits,
      languagesCovered,
      averageEffectivenessScore: Math.round(averageEffectivenessScore * 10) / 10,
      researchSourcesCount,
      primaryRecommendationCount,
      difficultyDistribution,
      categoryDistribution
    };
  }

  /**
   * Create failure result
   */
  private static createFailureResult(
    errors: ValidationError[],
    warnings: ValidationWarning[],
    habits: BilingualHabit[]
  ): ValidationResult {
    return {
      isValid: false,
      errors,
      warnings,
      stats: this.generateContentStats(habits || [])
    };
  }

  /**
   * Validate all habit files
   */
  static async validateAllHabitFiles(): Promise<{
    betterSleep: ValidationResult;
    getMoving: ValidationResult;
    feelBetter: ValidationResult;
    overall: ValidationResult;
  }> {
    // NOTE: Content validation now uses content API instead of local files
    // This method is kept for backward compatibility but returns empty results
    console.warn('BilingualContentValidator: Using content API instead of local files');
    
    const emptyResult: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [{
        type: 'quality',
        field: 'validation',
        message: 'Content validation skipped - using content API',
        suggestion: 'Use EffectivenessRankingService.loadAllHabits() for content API validation'
      }],
      stats: {
        totalHabits: 0,
        languagesCovered: ['en', 'de'],
        averageEffectivenessScore: 0,
        researchSourcesCount: 0,
        primaryRecommendationCount: 0,
        difficultyDistribution: {},
        categoryDistribution: {}
      }
    };

    return {
      betterSleep: emptyResult,
      getMoving: emptyResult,
      feelBetter: emptyResult,
      overall: emptyResult
    };
  }
}