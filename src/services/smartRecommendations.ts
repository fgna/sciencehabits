/**
 * Smart Recommendation Engine
 * 
 * Intelligent habit recommendation system that uses goal taxonomy to provide
 * multi-tier matching (exact → alias → semantic → category fallback) with
 * confidence scoring and comprehensive logging.
 */

import goalTaxonomy, { ValidationResult } from './goalTaxonomy';
import { EffectivenessRankingService } from './localization/EffectivenessRankingService';
import { MultilingualHabit } from '../types/localization';

/**
 * Map content API difficulty values to legacy format
 */
function mapDifficultyToLegacy(difficulty: string): string {
  const difficultyMap: Record<string, string> = {
    'trivial': 'trivial',
    'easy': 'easy',
    'moderate': 'moderate',
    'challenging': 'intermediate', // Map challenging to intermediate
    'advanced': 'advanced',
    'beginner': 'beginner',
    'intermediate': 'intermediate'
  };
  
  return difficultyMap[difficulty] || 'beginner'; // Default fallback to beginner
}

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
  private readonly CACHE_DURATION = 0; // TEMPORARILY DISABLED: 5 * 60 * 1000; // 5 minutes

  constructor() {
    console.log('[SmartRecommendations] Engine initialized');
    // Clear cache on initialization to force fresh data load
    this.clearCache();
    // Force cache expiry to ensure fresh data
    this.cacheExpiry = 0;
  }

  /**
   * Get personalized habit recommendations based on user goals
   */
  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResult> {
    const startTime = performance.now();
    
    const {
      selectedGoals,
      userProfile = {},
      limit = 15, // TEMPORARILY INCREASED
      minConfidence = 0.0 // TEMPORARILY REMOVED FILTER
    } = request;

    console.log(`[SmartRecommendations] Processing request for goals: ${selectedGoals.join(', ')}`);

    // Load habits data
    const habits = await this.loadHabitsData();
    
    // Validate and map user goals
    const goalMappings = this.validateAndMapGoals(selectedGoals);
    const mappedGoals = goalMappings.filter(m => m.isValid).map(m => m.mappedGoalId!);
    const unmappedGoals = goalMappings.filter(m => !m.isValid).map(m => selectedGoals[goalMappings.indexOf(m)]);

    // Debug goal mapping
    console.log(`[SmartRecommendations] Goal mapping results:`);
    goalMappings.forEach((mapping, index) => {
      console.log(`  ${selectedGoals[index]} → ${mapping.isValid ? mapping.mappedGoalId : 'UNMAPPED'} (confidence: ${mapping.confidence})`);
    });
    console.log(`[SmartRecommendations] Mapped goals for recommendations: [${mappedGoals.join(', ')}]`);

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
      
      if (recommendation) { // TEMPORARILY REMOVED: && recommendation.confidence >= minConfidence
        recommendations.push(recommendation);
        console.log(`[SmartRecommendations] Added habit ${habit.id} with confidence ${recommendation.confidence}`);
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

    console.log(`[SmartRecommendations] Evaluating habit: ${habit.id}`);
    console.log(`[SmartRecommendations]   Habit goalTags: [${habit.goalTags.join(', ')}]`);
    console.log(`[SmartRecommendations]   Target goals: [${targetGoals.join(', ')}]`);

    // Check each habit goal tag against user's target goals
    for (const habitGoalTag of habit.goalTags) {
      const validation = goalTaxonomy.validateGoalTag(habitGoalTag);
      
      console.log(`[SmartRecommendations]     GoalTag "${habitGoalTag}" → ${validation.isValid ? validation.mappedGoalId : 'UNMAPPED'} (confidence: ${validation.confidence})`);
      
      if (validation.isValid && validation.mappedGoalId) {
        const mappedGoalId = validation.mappedGoalId;
        
        // Check if this mapped goal matches any of the user's target goals
        if (targetGoals.includes(mappedGoalId)) {
          console.log(`[SmartRecommendations]       ✅ MATCH! "${mappedGoalId}" is in target goals`);
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
        } else {
          console.log(`[SmartRecommendations]       ❌ No match: "${mappedGoalId}" not in target goals`);
        }
      }
    }

    // No goal matches found
    if (matchedGoals.length === 0) {
      console.log(`[SmartRecommendations]   Result: NO MATCHES for habit ${habit.id}`);
      return null;
    }

    console.log(`[SmartRecommendations]   Result: ${matchedGoals.length} matches for habit ${habit.id}: [${matchedGoals.join(', ')}]`);

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
        
        // TEMPORARILY REMOVED: if (confidence >= minConfidence) {
          fallbacks.push({
            habitId: habit.id,
            matchType: 'category',
            confidence,
            matchedGoals: [],
            goalMappings: []
          });
          console.log(`[SmartRecommendations] Added fallback habit ${habit.id} with confidence ${confidence}`);
        // }
      }
    }

    return fallbacks.slice(0, 3); // Limit fallbacks
  }

  /**
   * Load habits data with caching
   */
  private async loadHabitsData(): Promise<HabitData[]> {
    // Force fresh data load - disable cache for now to ensure new content is loaded
    console.log('[SmartRecommendations] Force loading fresh data from content API (cache disabled)');
    // Check cache
    // if (this.habitsCache && Date.now() < this.cacheExpiry) {
    //   return this.habitsCache;
    // }

    try {
      // Load directly from Content API (not through EffectivenessRankingService which expects different format)
      console.log('[SmartRecommendations] Loading habits directly from content API...');
      const contentApiBase = process.env.REACT_APP_CONTENT_API_URL || 'http://localhost:3002';
      console.log('[SmartRecommendations] Content API base URL:', contentApiBase);
      
      const response = await fetch(`${contentApiBase}/habits/multilingual-science-habits-en.json`);
      if (!response.ok) {
        throw new Error(`Content API error: ${response.status}`);
      }
      
      const rawHabits = await response.json();
      console.log('[SmartRecommendations] Raw habits from Content API:', rawHabits);
      console.log('[SmartRecommendations] API returned', rawHabits.length, 'habits total');
      
      // Convert Content API format to SmartRecommendations format
      const convertedHabits: HabitData[] = rawHabits.map((habit: any) => ({
        id: habit.id,
        title: habit.title,
        description: habit.description,
        category: habit.category,
        goalTags: habit.goalTags || [habit.category],
        lifestyleTags: ['general'], // Default lifestyle tags
        timeTags: ['flexible'], // Default time tags
        difficulty: mapDifficultyToLegacy(habit.difficulty),
        timeMinutes: habit.timeMinutes,
        effectivenessScore: habit.effectivenessScore,
        isCustom: false
      }));

      console.log(`[SmartRecommendations] Loaded ${convertedHabits.length} habits from content API`);
      console.log(`[SmartRecommendations] Goal categories found: ${[...new Set(convertedHabits.map(h => h.category))].join(', ')}`);
      
      // Debug: Show habit details for troubleshooting
      convertedHabits.forEach(habit => {
        console.log(`[SmartRecommendations] Habit: ${habit.id} | Category: ${habit.category} | GoalTags: [${habit.goalTags.join(', ')}]`);
      });

      // Cache the result
      this.habitsCache = convertedHabits;
      this.cacheExpiry = Date.now() + this.CACHE_DURATION;

      return convertedHabits;
    } catch (error) {
      console.error('[SmartRecommendations] CRITICAL ERROR: Failed to load habits from content API:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
      console.error('[SmartRecommendations] Error stack:', errorStack);
      
      // Do NOT fallback to old data - we want to use content API only
      console.error('[SmartRecommendations] No fallback - returning empty array to force debugging');
      throw new Error(`Content API failed: ${errorMessage}. Please check that sciencehabits-content-api is running on port 3002.`);
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