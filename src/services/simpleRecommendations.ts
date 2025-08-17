/**
 * Simple Recommendations Service
 * 
 * Uses pre-coded JSON files per goal to avoid cross-contamination
 * and provide predictable, curated recommendations.
 */

export interface SimpleRecommendation {
  habitId: string;
  priority: number;
  confidence: number;
  reason: string;
}

export interface SimpleRecommendationRequest {
  selectedGoals: string[];
  limit?: number;
  minConfidence?: number;
}

export interface SimpleRecommendationResult {
  recommendations: SimpleRecommendation[];
  totalMatched: number;
  warnings: string[];
  metadata: {
    processingTime: number;
    source: 'pre-coded';
  };
}

class SimpleRecommendationEngine {
  private recommendationsCache: Map<string, SimpleRecommendation[]> = new Map();
  private habitsCache: Map<string, any> = new Map();

  /**
   * Get recommendations using pre-coded lists
   */
  async getRecommendations(request: SimpleRecommendationRequest): Promise<SimpleRecommendationResult> {
    const startTime = performance.now();
    
    const {
      selectedGoals,
      limit = 10,
      minConfidence = 0.6
    } = request;

    console.log(`[SimpleRecommendations] Processing request for goals: ${selectedGoals.join(', ')}`);

    try {
      // Load habits data for full habit details
      await this.loadHabitsData();
      
      // Load recommendations for each goal
      const allRecommendations: SimpleRecommendation[] = [];
      const warnings: string[] = [];

      for (const goal of selectedGoals) {
        try {
          const goalRecommendations = await this.loadGoalRecommendations(goal);
          
          // Filter by confidence
          const filteredRecommendations = goalRecommendations.filter(
            rec => rec.confidence >= minConfidence
          );
          
          allRecommendations.push(...filteredRecommendations);
          console.log(`[SimpleRecommendations] Added ${filteredRecommendations.length} recommendations for ${goal}`);
          
        } catch (error) {
          console.warn(`[SimpleRecommendations] No recommendations found for goal: ${goal}`);
          warnings.push(`No recommendations available for goal: ${goal}`);
        }
      }

      // Sort by priority (lower number = higher priority) and confidence
      const sortedRecommendations = allRecommendations
        .sort((a, b) => {
          if (a.priority !== b.priority) {
            return a.priority - b.priority; // Lower priority number = higher importance
          }
          return b.confidence - a.confidence; // Higher confidence wins ties
        })
        .slice(0, limit);

      const processingTime = performance.now() - startTime;

      console.log(`[SimpleRecommendations] Returning ${sortedRecommendations.length} recommendations`);
      sortedRecommendations.forEach(rec => {
        console.log(`  ${rec.habitId} (priority: ${rec.priority}, confidence: ${rec.confidence})`);
      });

      return {
        recommendations: sortedRecommendations,
        totalMatched: allRecommendations.length,
        warnings,
        metadata: {
          processingTime,
          source: 'pre-coded'
        }
      };

    } catch (error) {
      console.error('[SimpleRecommendations] Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Load pre-coded recommendations for a specific goal
   */
  private async loadGoalRecommendations(goal: string): Promise<SimpleRecommendation[]> {
    if (this.recommendationsCache.has(goal)) {
      return this.recommendationsCache.get(goal)!;
    }

    try {
      const response = await fetch(`/data/recommendations/${goal}.json`);
      if (!response.ok) {
        throw new Error(`No recommendations file for goal: ${goal}`);
      }

      const recommendations = await response.json();
      this.recommendationsCache.set(goal, recommendations);
      
      console.log(`[SimpleRecommendations] Loaded ${recommendations.length} pre-coded recommendations for ${goal}`);
      return recommendations;
      
    } catch (error) {
      console.error(`[SimpleRecommendations] Failed to load recommendations for ${goal}:`, error);
      throw error;
    }
  }

  /**
   * Load habits data for full habit details
   */
  private async loadHabitsData(): Promise<void> {
    if (this.habitsCache.size > 0) {
      return; // Already loaded
    }

    try {
      const contentApiBase = process.env.REACT_APP_CONTENT_API_URL || 'http://localhost:3002';
      const response = await fetch(`${contentApiBase}/habits/multilingual-science-habits-en.json`);
      
      if (!response.ok) {
        throw new Error(`Content API error: ${response.status}`);
      }

      const habits = await response.json();
      
      // Cache habits by ID for quick lookup
      habits.forEach((habit: any) => {
        this.habitsCache.set(habit.id, habit);
      });

      console.log(`[SimpleRecommendations] Loaded ${habits.length} habits from Content API`);
      
    } catch (error) {
      console.error('[SimpleRecommendations] Failed to load habits data:', error);
      throw error;
    }
  }

  /**
   * Get full habit details by ID
   */
  async getHabitDetails(habitId: string): Promise<any | null> {
    await this.loadHabitsData();
    return this.habitsCache.get(habitId) || null;
  }

  /**
   * Get all available goals with pre-coded recommendations
   */
  getAvailableGoals(): string[] {
    return ['feel_better', 'get_moving', 'better_sleep'];
  }

  /**
   * Clear cache for testing
   */
  clearCache(): void {
    this.recommendationsCache.clear();
    this.habitsCache.clear();
    console.log('[SimpleRecommendations] Cache cleared');
  }
}

// Export singleton instance
const simpleRecommendations = new SimpleRecommendationEngine();
export default simpleRecommendations;