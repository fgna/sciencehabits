/**
 * Content Validation System
 * 
 * Comprehensive validation system for goal-to-habit mappings that prevents
 * regressions and ensures content integrity across the application.
 */

import goalTaxonomy, { ValidationResult } from './goalTaxonomy';

export interface ContentValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  stats: ValidationStats;
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  type: 'unmapped_goal' | 'invalid_goal_tag' | 'missing_habit' | 'broken_reference' | 'data_format';
  severity: 'critical' | 'high' | 'medium' | 'low';
  source: string;
  itemId: string;
  message: string;
  suggestion?: string;
}

export interface ValidationWarning {
  type: 'low_confidence' | 'deprecated_tag' | 'duplicate_mapping' | 'performance' | 'accessibility';
  source: string;
  itemId: string;
  message: string;
  suggestion?: string;
}

export interface ValidationSuggestion {
  type: 'goal_mapping' | 'habit_optimization' | 'content_improvement';
  targetId: string;
  suggestion: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'easy' | 'moderate' | 'hard';
}

export interface ValidationStats {
  totalHabits: number;
  totalGoals: number;
  mappedGoals: number;
  unmappedGoals: number;
  confidenceDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  validationScore: number; // 0-100
  lastValidation: Date;
}

export interface HabitValidationData {
  id: string;
  title: string;
  goalTags: string[];
  category: string;
  source: string;
}

export interface GoalValidationData {
  id: string;
  title: string;
  category: string;
  source: string;
}

class ContentValidationSystem {
  private validationCache: Map<string, ContentValidationResult> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  constructor() {
    console.log('[ContentValidator] Validation system initialized');
  }

  /**
   * Validate all content in the system
   */
  async validateAllContent(options: {
    includeHabits?: boolean;
    includeGoals?: boolean;
    includeOnboarding?: boolean;
    forceRefresh?: boolean;
  } = {}): Promise<ContentValidationResult> {
    const {
      includeHabits = true,
      includeGoals = true,
      includeOnboarding = true,
      forceRefresh = false
    } = options;

    const cacheKey = `all_${includeHabits}_${includeGoals}_${includeOnboarding}`;
    
    if (!forceRefresh && this.validationCache.has(cacheKey)) {
      const cached = this.validationCache.get(cacheKey)!;
      const age = Date.now() - cached.stats.lastValidation.getTime();
      if (age < this.CACHE_DURATION) {
        console.log('[ContentValidator] Returning cached validation result');
        return cached;
      }
    }

    console.log('[ContentValidator] Starting comprehensive content validation');
    const startTime = performance.now();

    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    // Validate taxonomy first
    const taxonomyValidation = goalTaxonomy.validateTaxonomy();
    if (!taxonomyValidation.isValid) {
      taxonomyValidation.errors.forEach(error => {
        errors.push({
          type: 'data_format',
          severity: 'critical',
          source: 'taxonomy',
          itemId: 'goal_taxonomy',
          message: error
        });
      });
    }

    taxonomyValidation.warnings.forEach(warning => {
      warnings.push({
        type: 'duplicate_mapping',
        source: 'taxonomy',
        itemId: 'goal_taxonomy',
        message: warning
      });
    });

    // Validate habits if requested
    if (includeHabits) {
      const habitValidation = await this.validateHabits();
      errors.push(...habitValidation.errors);
      warnings.push(...habitValidation.warnings);
      suggestions.push(...habitValidation.suggestions);
    }

    // Validate goals if requested
    if (includeGoals) {
      const goalValidation = await this.validateGoals();
      errors.push(...goalValidation.errors);
      warnings.push(...goalValidation.warnings);
      suggestions.push(...goalValidation.suggestions);
    }

    // Validate onboarding flow if requested
    if (includeOnboarding) {
      const onboardingValidation = await this.validateOnboardingFlow();
      errors.push(...onboardingValidation.errors);
      warnings.push(...onboardingValidation.warnings);
      suggestions.push(...onboardingValidation.suggestions);
    }

    // Generate statistics
    const stats = await this.generateValidationStats();
    stats.validationScore = this.calculateValidationScore(errors, warnings);
    stats.lastValidation = new Date();

    const result: ContentValidationResult = {
      isValid: errors.filter(e => e.severity === 'critical' || e.severity === 'high').length === 0,
      errors,
      warnings,
      stats,
      suggestions
    };

    // Cache result
    this.validationCache.set(cacheKey, result);

    const processingTime = performance.now() - startTime;
    console.log(`[ContentValidator] Validation completed in ${processingTime.toFixed(2)}ms`);
    console.log(`[ContentValidator] Found ${errors.length} errors, ${warnings.length} warnings`);
    console.log(`[ContentValidator] Validation score: ${stats.validationScore}/100`);

    return result;
  }

  /**
   * Validate habit content and goal mappings
   */
  private async validateHabits(): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      const habits = await this.loadHabitsData();
      
      for (const habit of habits) {
        // Validate goal tags
        for (const goalTag of habit.goalTags) {
          const validation = goalTaxonomy.validateGoalTag(goalTag);
          
          if (!validation.isValid) {
            errors.push({
              type: 'unmapped_goal',
              severity: 'high',
              source: habit.source,
              itemId: habit.id,
              message: `Habit "${habit.title}" has unmappable goal tag: "${goalTag}"`,
              suggestion: validation.suggestions?.[0] ? `Consider using: ${validation.suggestions[0]}` : undefined
            });
          } else if (validation.matchType === 'deprecated') {
            warnings.push({
              type: 'deprecated_tag',
              source: habit.source,
              itemId: habit.id,
              message: `Habit "${habit.title}" uses deprecated goal tag: "${goalTag}"`,
              suggestion: `Update to official goal ID: ${validation.mappedGoalId}`
            });
          } else if (validation.confidence < 0.7) {
            warnings.push({
              type: 'low_confidence',
              source: habit.source,
              itemId: habit.id,
              message: `Low confidence match for goal tag "${goalTag}" in habit "${habit.title}" (${(validation.confidence * 100).toFixed(1)}%)`
            });
          }
        }

        // Check for missing goal tags
        if (habit.goalTags.length === 0) {
          errors.push({
            type: 'missing_habit',
            severity: 'medium',
            source: habit.source,
            itemId: habit.id,
            message: `Habit "${habit.title}" has no goal tags`,
            suggestion: 'Add at least one goal tag to enable recommendations'
          });
        }

        // Suggest goal tag improvements
        if (habit.goalTags.length < 2) {
          suggestions.push({
            type: 'habit_optimization',
            targetId: habit.id,
            suggestion: `Consider adding more goal tags to habit "${habit.title}" to improve discoverability`,
            impact: 'medium',
            effort: 'easy'
          });
        }
      }

      console.log(`[ContentValidator] Validated ${habits.length} habits`);
    } catch (error) {
      errors.push({
        type: 'data_format',
        severity: 'critical',
        source: 'habits',
        itemId: 'habit_loading',
        message: `Failed to load habits data: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return { errors, warnings, suggestions };
  }

  /**
   * Validate goal definitions and consistency
   */
  private async validateGoals(): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      const goals = await this.loadGoalsData();
      const taxonomyGoals = goalTaxonomy.getAllCategories();
      
      // Check for goals missing from taxonomy
      for (const goal of goals) {
        const mapping = goalTaxonomy.getGoalMapping(goal.id);
        if (!mapping) {
          errors.push({
            type: 'unmapped_goal',
            severity: 'high',
            source: goal.source,
            itemId: goal.id,
            message: `Goal "${goal.title}" (${goal.id}) not found in taxonomy`,
            suggestion: 'Add goal mapping to goal taxonomy system'
          });
        }
      }

      // Check for taxonomy goals not in main goals file
      const goalIds = new Set(goals.map(g => g.id));
      const taxonomyStats = goalTaxonomy.getStats();
      
      if (taxonomyStats.totalMappings > goalIds.size) {
        warnings.push({
          type: 'duplicate_mapping',
          source: 'goals',
          itemId: 'goal_consistency',
          message: `Taxonomy has ${taxonomyStats.totalMappings} mappings but only ${goalIds.size} goals in main file`
        });
      }

      console.log(`[ContentValidator] Validated ${goals.length} goals`);
    } catch (error) {
      errors.push({
        type: 'data_format',
        severity: 'critical',
        source: 'goals',
        itemId: 'goal_loading',
        message: `Failed to load goals data: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return { errors, warnings, suggestions };
  }

  /**
   * Validate onboarding flow and goal-to-habit mappings
   */
  private async validateOnboardingFlow(): Promise<{
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions: ValidationSuggestion[];
  }> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: ValidationSuggestion[] = [];

    try {
      // Simulate onboarding with all possible goals
      const goals = await this.loadGoalsData();
      
      for (const goal of goals) {
        // Test recommendation engine with this goal
        try {
          const { smartRecommendations } = await import('./smartRecommendations');
          const recommendations = await smartRecommendations.getRecommendations({
            selectedGoals: [goal.id],
            limit: 5,
            minConfidence: 0.3
          });

          if (recommendations.recommendations.length === 0) {
            errors.push({
              type: 'missing_habit',
              severity: 'high',
              source: 'onboarding',
              itemId: goal.id,
              message: `No habits found for goal "${goal.title}" during onboarding flow`,
              suggestion: 'Add habits with this goal tag or improve goal mapping'
            });
          } else if (recommendations.recommendations.length < 3) {
            warnings.push({
              type: 'low_confidence',
              source: 'onboarding',
              itemId: goal.id,
              message: `Only ${recommendations.recommendations.length} habits found for goal "${goal.title}"`
            });
          }

          // Check for low confidence recommendations
          const lowConfidenceCount = recommendations.recommendations.filter(r => r.confidence < 0.5).length;
          if (lowConfidenceCount > 0) {
            warnings.push({
              type: 'low_confidence',
              source: 'onboarding',
              itemId: goal.id,
              message: `${lowConfidenceCount} low-confidence recommendations for goal "${goal.title}"`
            });
          }

        } catch (error) {
          errors.push({
            type: 'broken_reference',
            severity: 'medium',
            source: 'onboarding',
            itemId: goal.id,
            message: `Failed to test recommendations for goal "${goal.title}": ${error instanceof Error ? error.message : 'Unknown error'}`
          });
        }
      }

      console.log(`[ContentValidator] Validated onboarding flow for ${goals.length} goals`);
    } catch (error) {
      errors.push({
        type: 'data_format',
        severity: 'critical',
        source: 'onboarding',
        itemId: 'onboarding_validation',
        message: `Failed to validate onboarding flow: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    }

    return { errors, warnings, suggestions };
  }

  /**
   * Generate comprehensive validation statistics
   */
  private async generateValidationStats(): Promise<ValidationStats> {
    const habits = await this.loadHabitsData();
    const goals = await this.loadGoalsData();
    const taxonomyStats = goalTaxonomy.getStats();
    
    // Analyze confidence distribution
    const confidenceDistribution: Record<string, number> = {
      'high': 0,    // >= 0.8
      'medium': 0,  // 0.5-0.8
      'low': 0,     // 0.3-0.5
      'very_low': 0 // < 0.3
    };

    const categoryDistribution: Record<string, number> = {};
    let mappedGoalsCount = 0;

    for (const habit of habits) {
      for (const goalTag of habit.goalTags) {
        const validation = goalTaxonomy.validateGoalTag(goalTag);
        
        if (validation.isValid) {
          mappedGoalsCount++;
          
          // Update confidence distribution
          if (validation.confidence >= 0.8) {
            confidenceDistribution.high++;
          } else if (validation.confidence >= 0.5) {
            confidenceDistribution.medium++;
          } else if (validation.confidence >= 0.3) {
            confidenceDistribution.low++;
          } else {
            confidenceDistribution.very_low++;
          }

          // Update category distribution
          if (validation.mappedGoalId) {
            const mapping = goalTaxonomy.getGoalMapping(validation.mappedGoalId);
            if (mapping) {
              categoryDistribution[mapping.category] = (categoryDistribution[mapping.category] || 0) + 1;
            }
          }
        }
      }
    }

    const totalGoalTags = habits.reduce((sum, h) => sum + h.goalTags.length, 0);

    return {
      totalHabits: habits.length,
      totalGoals: goals.length,
      mappedGoals: mappedGoalsCount,
      unmappedGoals: totalGoalTags - mappedGoalsCount,
      confidenceDistribution,
      categoryDistribution,
      validationScore: 0, // Will be calculated by caller
      lastValidation: new Date()
    };
  }

  /**
   * Calculate overall validation score (0-100)
   */
  private calculateValidationScore(errors: ValidationError[], warnings: ValidationWarning[]): number {
    let score = 100;

    // Deduct points for errors
    errors.forEach(error => {
      switch (error.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });

    // Deduct points for warnings
    warnings.forEach(warning => {
      score -= 1;
    });

    return Math.max(0, score);
  }

  /**
   * Load habits data from all sources
   */
  private async loadHabitsData(): Promise<HabitValidationData[]> {
    const habitSources = [
      { path: '/data/habits/mindfulness-habits.json', name: 'mindfulness' },
      { path: '/data/habits/nutrition-habits.json', name: 'nutrition' },
      { path: '/data/habits/exercise-habits.json', name: 'exercise' },
      { path: '/data/habits/sleep-habits.json', name: 'sleep' },
      { path: '/data/habits/cognitive-habits.json', name: 'cognitive' },
      { path: '/data/habits/productivity-habits.json', name: 'productivity' }
    ];

    const allHabits: HabitValidationData[] = [];

    for (const source of habitSources) {
      try {
        const response = await fetch(source.path);
        if (response.ok) {
          const habits = await response.json();
          if (Array.isArray(habits)) {
            habits.forEach(habit => {
              allHabits.push({
                id: habit.id,
                title: habit.title,
                goalTags: habit.goalTags || [],
                category: habit.category,
                source: source.name
              });
            });
          }
        }
      } catch (error) {
        console.warn(`[ContentValidator] Failed to load ${source.path}:`, error);
      }
    }

    return allHabits;
  }

  /**
   * Load goals data
   */
  private async loadGoalsData(): Promise<GoalValidationData[]> {
    try {
      const response = await fetch('/data/goals.json');
      if (response.ok) {
        const data = await response.json();
        if (data.goals && Array.isArray(data.goals)) {
          return data.goals.map((goal: any) => ({
            id: goal.id,
            title: goal.title,
            category: goal.category,
            source: 'goals'
          }));
        }
      }
    } catch (error) {
      console.warn('[ContentValidator] Failed to load goals data:', error);
    }

    return [];
  }

  /**
   * Clear validation cache
   */
  clearCache(): void {
    this.validationCache.clear();
    console.log('[ContentValidator] Validation cache cleared');
  }

  /**
   * Get validation report in markdown format
   */
  async generateReport(validationResult?: ContentValidationResult): Promise<string> {
    const result = validationResult || await this.validateAllContent();
    
    const report = `# Content Validation Report

Generated: ${result.stats.lastValidation.toISOString()}
Validation Score: **${result.stats.validationScore}/100** ${result.isValid ? '✅' : '❌'}

## Summary Statistics
- Total Habits: ${result.stats.totalHabits}
- Total Goals: ${result.stats.totalGoals}
- Mapped Goals: ${result.stats.mappedGoals}
- Unmapped Goals: ${result.stats.unmappedGoals}

## Confidence Distribution
- High (≥80%): ${result.stats.confidenceDistribution.high || 0}
- Medium (50-80%): ${result.stats.confidenceDistribution.medium || 0}
- Low (30-50%): ${result.stats.confidenceDistribution.low || 0}
- Very Low (<30%): ${result.stats.confidenceDistribution.very_low || 0}

## Issues Found

### Errors (${result.errors.length})
${result.errors.length === 0 ? 'None found ✅' : result.errors.map(error => 
  `- **${error.severity.toUpperCase()}**: ${error.message} (${error.source}:${error.itemId})`
).join('\n')}

### Warnings (${result.warnings.length})
${result.warnings.length === 0 ? 'None found ✅' : result.warnings.map(warning => 
  `- ${warning.message} (${warning.source}:${warning.itemId})`
).join('\n')}

## Improvement Suggestions (${result.suggestions.length})
${result.suggestions.length === 0 ? 'None available' : result.suggestions.map(suggestion => 
  `- **${suggestion.impact.toUpperCase()} IMPACT** (${suggestion.effort} effort): ${suggestion.suggestion}`
).join('\n')}

## Category Distribution
${Object.entries(result.stats.categoryDistribution).map(([category, count]) => 
  `- ${category}: ${count}`
).join('\n')}
`;

    return report;
  }
}

// Create singleton instance
export const contentValidator = new ContentValidationSystem();

// Export types and main service
export { ContentValidationSystem };
export default contentValidator;