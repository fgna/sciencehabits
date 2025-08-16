/**
 * Smart Recommendation Engine
 * 
 * Intelligent habit recommendation system that uses goal taxonomy to provide
 * multi-tier matching (exact → alias → semantic → category fallback) with
 * confidence scoring and comprehensive logging.
 */

import goalTaxonomy, { ValidationResult } from './goalTaxonomy';

export interface HabitRecommendation {
  habitId: string;
  matchType: 'exact' | 'alias' | 'semantic' | 'category' | 'fallback';
  confidence: number;
  matchedGoals: string[];
  goalMappings: {
    goalId: string;
    matchType: string;
    confidence: number;
  }[];
}

export interface RecommendationRequest {
  selectedGoals: string[];
  userProfile?: {
    lifestyleTags?: string[];
    timeTags?: string[];
    difficulty?: 'easy' | 'moderate' | 'hard';
    tier?: 'free' | 'premium';
  };
  limit?: number;
  minConfidence?: number;
}

export interface RecommendationResult {
  recommendations: HabitRecommendation[];
  totalMatched: number;
  goalsMapped: Record<string, string[]>; // goal ID -> habit IDs
  unmappedGoals: string[];
  warnings: string[];
  metadata: {
    processingTime: number;
    fallbacksUsed: number;
    averageConfidence: number;
  };
}

export interface HabitData {
  id: string;
  title: string;
  description: string;
  category: string;
  goalTags: string[];
  lifestyleTags?: string[];
  timeTags?: string[];
  difficulty?: string;
  tier?: string;
  isCustom?: boolean;
}

class SmartRecommendationEngine {
  private habitsCache: HabitData[] | null = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    console.log('[SmartRecommendations] Engine initialized');
  }

  /**
   * Get personalized habit recommendations based on user goals
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResult> {
    const startTime = performance.now();
    
    const {
      selectedGoals,
      userProfile = {},
      limit = 10,
      minConfidence = 0.3
    } = request;

    console.log(`[SmartRecommendations] Processing request for goals: ${selectedGoals.join(', ')}`);

    // Load habits data
    const habits = await this.loadHabitsData();
    
    // Validate and map user goals
    const goalMappings = this.validateAndMapGoals(selectedGoals);
    const mappedGoals = goalMappings.filter(m => m.isValid).map(m => m.mappedGoalId!);
    const unmappedGoals = goalMappings.filter(m => !m.isValid).map(m => selectedGoals[goalMappings.indexOf(m)]);

    // Generate recommendations using multi-tier matching
    const recommendations = this.generateRecommendations(habits, mappedGoals, userProfile, minConfidence);
    
    // Sort by confidence and apply limit
    const sortedRecommendations = recommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, limit);

    // Build goal mapping summary
    const goalsMapped: Record<string, string[]> = {};
    sortedRecommendations.forEach(rec => {
      rec.matchedGoals.forEach(goalId => {
        if (!goalsMapped[goalId]) {
          goalsMapped[goalId] = [];
        }
        if (!goalsMapped[goalId].includes(rec.habitId)) {
          goalsMapped[goalId].push(rec.habitId);
        }
      });
    });

    // Generate warnings for low-confidence matches
    const warnings: string[] = [];
    if (unmappedGoals.length > 0) {
      warnings.push(`Could not map ${unmappedGoals.length} goals: ${unmappedGoals.join(', ')}`);
    }
    
    const lowConfidenceCount = sortedRecommendations.filter(r => r.confidence < 0.5).length;
    if (lowConfidenceCount > 0) {
      warnings.push(`${lowConfidenceCount} recommendations have low confidence (<50%)`);
    }

    const processingTime = performance.now() - startTime;
    const fallbacksUsed = sortedRecommendations.filter(r => r.matchType === 'category' || r.matchType === 'fallback').length;
    const averageConfidence = sortedRecommendations.length > 0 
      ? sortedRecommendations.reduce((sum, r) => sum + r.confidence, 0) / sortedRecommendations.length 
      : 0;

    const result: RecommendationResult = {
      recommendations: sortedRecommendations,
      totalMatched: sortedRecommendations.length,
      goalsMapped,
      unmappedGoals,
      warnings,
      metadata: {
        processingTime,
        fallbacksUsed,
        averageConfidence
      }
    };

    console.log(`[SmartRecommendations] Generated ${result.totalMatched} recommendations in ${processingTime.toFixed(2)}ms`);
    console.log(`[SmartRecommendations] Average confidence: ${(averageConfidence * 100).toFixed(1)}%`);

    return result;
  }

  /**
   * Validate user goals and map them to official goal IDs
   */
  private validateAndMapGoals(userGoals: string[]): ValidationResult[] {
    return userGoals.map(goal => goalTaxonomy.validateGoalTag(goal));
  }

  /**
   * Generate habit recommendations using multi-tier matching strategy
   */
  private generateRecommendations(
    habits: HabitData[],
    mappedGoals: string[],
    userProfile: any,
    minConfidence: number
  ): HabitRecommendation[] {
    const recommendations: HabitRecommendation[] = [];

    for (const habit of habits) {
      const recommendation = this.evaluateHabit(habit, mappedGoals, userProfile);
      
      if (recommendation && recommendation.confidence >= minConfidence) {
        recommendations.push(recommendation);
      }
    }

    // If we don't have enough recommendations, use category fallback
    if (recommendations.length < 5 && mappedGoals.length > 0) {
      const fallbackRecs = this.generateCategoryFallbacks(habits, mappedGoals, userProfile, minConfidence);
      recommendations.push(...fallbackRecs);
    }

    return recommendations;
  }

  /**
   * Evaluate a single habit for recommendation
   */
  private evaluateHabit(
    habit: HabitData,
    targetGoals: string[],
    userProfile: any
  ): HabitRecommendation | null {
    const matchedGoals: string[] = [];
    const goalMappings: { goalId: string; matchType: string; confidence: number }[] = [];
    let maxConfidence = 0;
    let bestMatchType: 'exact' | 'alias' | 'semantic' | 'category' = 'category';

    // Check each habit goal tag against user's target goals
    for (const habitGoalTag of habit.goalTags) {
      const validation = goalTaxonomy.validateGoalTag(habitGoalTag);
      
      if (validation.isValid && validation.mappedGoalId) {
        const mappedGoalId = validation.mappedGoalId;
        
        // Check if this mapped goal matches any of the user's target goals
        if (targetGoals.includes(mappedGoalId)) {
          matchedGoals.push(mappedGoalId);
          goalMappings.push({
            goalId: mappedGoalId,
            matchType: validation.matchType,
            confidence: validation.confidence
          });

          if (validation.confidence > maxConfidence) {
            maxConfidence = validation.confidence;
            bestMatchType = validation.matchType as 'exact' | 'alias' | 'semantic' | 'category';
          }
        }
      }
    }

    // No goal matches found
    if (matchedGoals.length === 0) {
      return null;
    }

    // Apply user profile filters and boost confidence
    let finalConfidence = maxConfidence;
    
    // Lifestyle compatibility boost
    if (userProfile.lifestyleTags && habit.lifestyleTags) {
      const commonLifestyle = habit.lifestyleTags.filter(tag => 
        userProfile.lifestyleTags.includes(tag)
      );
      if (commonLifestyle.length > 0) {
        finalConfidence += 0.1 * (commonLifestyle.length / habit.lifestyleTags.length);
      }
    }

    // Time preference boost
    if (userProfile.timeTags && habit.timeTags) {
      const commonTime = habit.timeTags.filter(tag => 
        userProfile.timeTags.includes(tag)
      );
      if (commonTime.length > 0) {
        finalConfidence += 0.05 * (commonTime.length / habit.timeTags.length);
      }
    }

    // Difficulty preference
    if (userProfile.difficulty && habit.difficulty === userProfile.difficulty) {
      finalConfidence += 0.05;
    }

    // Tier compatibility
    if (userProfile.tier === 'free' && habit.tier === 'premium') {
      finalConfidence -= 0.1; // Penalize premium habits for free users
    }

    // Multiple goal match bonus
    if (matchedGoals.length > 1) {
      finalConfidence += 0.1 * (matchedGoals.length - 1);
    }

    // Cap confidence at 1.0
    finalConfidence = Math.min(finalConfidence, 1.0);

    return {
      habitId: habit.id,
      matchType: bestMatchType,
      confidence: finalConfidence,
      matchedGoals: [...new Set(matchedGoals)], // Remove duplicates
      goalMappings
    };
  }

  /**
   * Generate category-based fallback recommendations
   */
  private generateCategoryFallbacks(
    habits: HabitData[],
    targetGoals: string[],
    userProfile: any,
    minConfidence: number
  ): HabitRecommendation[] {
    const fallbacks: HabitRecommendation[] = [];
    
    // Get categories for target goals
    const targetCategories = new Set<string>();
    targetGoals.forEach(goalId => {
      const mapping = goalTaxonomy.getGoalMapping(goalId);
      if (mapping) {
        targetCategories.add(mapping.category);
      }
    });

    // Find habits in same categories
    for (const habit of habits) {
      // Skip if already recommended
      if (fallbacks.some(f => f.habitId === habit.id)) {
        continue;
      }

      // Check if habit's goals belong to target categories
      const habitCategories = new Set<string>();
      habit.goalTags.forEach(tag => {
        const validation = goalTaxonomy.validateGoalTag(tag);
        if (validation.isValid && validation.mappedGoalId) {
          const mapping = goalTaxonomy.getGoalMapping(validation.mappedGoalId);
          if (mapping) {
            habitCategories.add(mapping.category);
          }
        }
      });

      // Check for category overlap
      const categoryOverlap = [...targetCategories].filter(cat => habitCategories.has(cat));
      if (categoryOverlap.length > 0) {
        const confidence = 0.4 * (categoryOverlap.length / targetCategories.size);
        
        if (confidence >= minConfidence) {
          fallbacks.push({
            habitId: habit.id,
            matchType: 'category',
            confidence,
            matchedGoals: [],
            goalMappings: []
          });
        }
      }
    }

    return fallbacks.slice(0, 3); // Limit fallbacks
  }

  /**
   * Load habits data with caching
   */
  private async loadHabitsData(): Promise<HabitData[]> {
    // Check cache
    if (this.habitsCache && Date.now() < this.cacheExpiry) {
      return this.habitsCache;
    }

    try {
      // Load from multiple sources and combine
      const habitSources = [
        '/data/habits/mindfulness-habits.json',
        '/data/habits/nutrition-habits.json',
        '/data/habits/exercise-habits.json',
        '/data/habits/sleep-habits.json',
        '/data/habits/cognitive-habits.json',
        '/data/habits/productivity-habits.json'
      ];

      const habitArrays = await Promise.allSettled(
        habitSources.map(async (source) => {
          try {
            const response = await fetch(source);
            if (!response.ok) {
              console.warn(`[SmartRecommendations] Failed to load ${source}: ${response.status}`);
              return [];
            }
            return await response.json();
          } catch (error) {
            console.warn(`[SmartRecommendations] Error loading ${source}:`, error);
            return [];
          }
        })
      );

      // Combine all habits
      const allHabits: HabitData[] = [];
      habitArrays.forEach((result) => {
        if (result.status === 'fulfilled' && Array.isArray(result.value)) {
          allHabits.push(...result.value);
        }
      });

      console.log(`[SmartRecommendations] Loaded ${allHabits.length} habits from ${habitSources.length} sources`);

      // Cache the result
      this.habitsCache = allHabits;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return allHabits;
    } catch (error) {
      console.error('[SmartRecommendations] Failed to load habits data:', error);
      return [];
    }
  }

  /**
   * Clear habits cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.habitsCache = null;
    this.cacheExpiry = 0;
    console.log('[SmartRecommendations] Cache cleared');
  }

  /**
   * Get recommendation statistics
   */
  async getRecommendationStats(): Promise<{
    totalHabits: number;
    habitsByCategory: Record<string, number>;
    goalTagDistribution: Record<string, number>;
    averageGoalsPerHabit: number;
  }> {
    const habits = await this.loadHabitsData();
    
    const stats = {
      totalHabits: habits.length,
      habitsByCategory: {} as Record<string, number>,
      goalTagDistribution: {} as Record<string, number>,
      averageGoalsPerHabit: 0
    };

    let totalGoalTags = 0;

    habits.forEach(habit => {
      // Count by category
      stats.habitsByCategory[habit.category] = (stats.habitsByCategory[habit.category] || 0) + 1;
      
      // Count goal tags
      totalGoalTags += habit.goalTags.length;
      habit.goalTags.forEach(tag => {
        const validation = goalTaxonomy.validateGoalTag(tag);
        const goalId = validation.mappedGoalId || tag;
        stats.goalTagDistribution[goalId] = (stats.goalTagDistribution[goalId] || 0) + 1;
      });
    });

    stats.averageGoalsPerHabit = habits.length > 0 ? totalGoalTags / habits.length : 0;

    return stats;
  }

  /**
   * Validate recommendation engine health
   */
  async validateEngineHealth(): Promise<{
    isHealthy: boolean;
    issues: string[];
    habitsLoaded: number;
    taxonomyStats: any;
  }> {
    const issues: string[] = [];
    
    // Check habits loading
    const habits = await this.loadHabitsData();
    if (habits.length === 0) {
      issues.push('No habits data loaded');
    }

    // Check taxonomy
    const taxonomyValidation = goalTaxonomy.validateTaxonomy();
    if (!taxonomyValidation.isValid) {
      issues.push(...taxonomyValidation.errors);
    }

    // Check for unmappable goal tags in habits
    const unmappableGoalTags = new Set<string>();
    habits.forEach(habit => {
      habit.goalTags.forEach(tag => {
        const validation = goalTaxonomy.validateGoalTag(tag);
        if (!validation.isValid) {
          unmappableGoalTags.add(tag);
        }
      });
    });

    if (unmappableGoalTags.size > 0) {
      issues.push(`Found ${unmappableGoalTags.size} unmappable goal tags in habits: ${Array.from(unmappableGoalTags).slice(0, 5).join(', ')}${unmappableGoalTags.size > 5 ? '...' : ''}`);
    }

    return {
      isHealthy: issues.length === 0,
      issues,
      habitsLoaded: habits.length,
      taxonomyStats: goalTaxonomy.getStats()
    };
  }
}

// Create singleton instance
export const smartRecommendations = new SmartRecommendationEngine();

// Export types and main service
export { SmartRecommendationEngine };
export default smartRecommendations;