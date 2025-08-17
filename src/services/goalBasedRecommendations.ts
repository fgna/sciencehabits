/**
 * Goal-Based Recommendations Service
 * 
 * Uses goal-specific JSON files with priority and isPrimaryRecommendation tags
 * to provide curated, predictable recommendations without cross-contamination.
 * 
 * In production, falls back to BundledContentService when content API is unavailable.
 */

import { bundledContentService } from './BundledContentService';

export interface GoalBasedHabit {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  timeMinutes: number;
  language: string;
  researchBacked: boolean;
  effectivenessScore: number;
  effectivenessRank: number;
  priority: number;
  isPrimaryRecommendation: boolean;
  recommendedForYou?: boolean;
  goalTags: string[];
  instructions: string[];
  whyEffective: string;
  researchSummary: string;
  sources: string[];
  optimalTiming: string;
  progressionTips: string[];
}

export interface GoalRecommendationRequest {
  selectedGoals: string[];
  language?: string;
  limit?: number;
  primaryOnly?: boolean;
}

export interface GoalRecommendationResult {
  recommendations: GoalBasedHabit[];
  totalMatched: number;
  warnings: string[];
  metadata: {
    processingTime: number;
    source: 'goal-specific-files';
    filesLoaded: string[];
  };
}

class GoalBasedRecommendationEngine {
  private availableFiles: Map<string, string[]> = new Map(); // goal -> available language files
  private habitsCache: Map<string, GoalBasedHabit[]> = new Map(); // "goal-lang" -> habits
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    console.log('[GoalBasedRecommendations] Engine initialized');
  }

  /**
   * Get recommendations using goal-specific files
   */
  async getRecommendations(request: GoalRecommendationRequest): Promise<GoalRecommendationResult> {
    const startTime = performance.now();
    
    const {
      selectedGoals,
      language = 'en',
      limit = 20,
      primaryOnly = false
    } = request;

    console.log(`[GoalBasedRecommendations] Processing request for goals: ${selectedGoals.join(', ')}, language: ${language}`);

    try {
      // Discover available files
      await this.discoverAvailableFiles();

      const allRecommendations: GoalBasedHabit[] = [];
      const warnings: string[] = [];
      const filesLoaded: string[] = [];

      for (const goal of selectedGoals) {
        try {
          const goalHabits = await this.loadGoalHabits(goal, language);
          
          // Filter by primary recommendation if requested
          let filteredHabits = goalHabits;
          if (primaryOnly) {
            filteredHabits = goalHabits.filter(habit => habit.isPrimaryRecommendation);
          }

          allRecommendations.push(...filteredHabits);
          filesLoaded.push(`${goal}_habits-${language}.json`);
          
          console.log(`[GoalBasedRecommendations] Added ${filteredHabits.length} habits for ${goal} (${primaryOnly ? 'primary only' : 'all'})`);
          
        } catch (error) {
          console.warn(`[GoalBasedRecommendations] Failed to load habits for goal: ${goal}`, error);
          warnings.push(`Failed to load habits for goal: ${goal}`);
        }
      }

      // Sort by priority (lower number = higher priority)
      const sortedRecommendations = allRecommendations
        .sort((a, b) => {
          // Primary recommendations come first
          if (a.isPrimaryRecommendation !== b.isPrimaryRecommendation) {
            return a.isPrimaryRecommendation ? -1 : 1;
          }
          // Then sort by priority (lower number = higher priority)
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          // Finally by effectiveness score (higher = better)
          return b.effectivenessScore - a.effectivenessScore;
        })
        .slice(0, limit);

      const processingTime = performance.now() - startTime;

      console.log(`[GoalBasedRecommendations] Returning ${sortedRecommendations.length} recommendations`);
      sortedRecommendations.forEach(rec => {
        console.log(`  ${rec.id} (priority: ${rec.priority}, primary: ${rec.isPrimaryRecommendation}, effectiveness: ${rec.effectivenessScore})`);
      });

      return {
        recommendations: sortedRecommendations,
        totalMatched: allRecommendations.length,
        warnings,
        metadata: {
          processingTime,
          source: 'goal-specific-files',
          filesLoaded
        }
      };

    } catch (error) {
      console.error('[GoalBasedRecommendations] Error getting recommendations:', error);
      throw error;
    }
  }

  /**
   * Discover available goal-specific files dynamically
   */
  private async discoverAvailableFiles(): Promise<void> {
    if (this.availableFiles.size > 0) {
      return; // Already discovered
    }

    // Use local content files in public/content-api instead of external API
    const goalPatterns = [
      { goal: 'feel_better', patterns: ['feel_better_habits-{lang}.json'] },
      { goal: 'get_moving', patterns: ['get_moving_habits-{lang}.json'] },
      { goal: 'better_sleep', patterns: ['better_sleep_habit-{lang}.json', 'better_sleep_habits-{lang}.json'] }
    ];
    const commonLanguages = ['en']; // Start with English only for MVP
    
    for (const { goal, patterns } of goalPatterns) {
      const availableLanguages: string[] = [];
      let workingPattern: string | null = null;
      
      for (const pattern of patterns) {
        for (const lang of commonLanguages) {
          try {
            const filename = pattern.replace('{lang}', lang);
            const response = await fetch(`/content-api/habits/${filename}`);
            
            if (response.ok) {
              availableLanguages.push(lang);
              workingPattern = pattern;
              console.log(`[GoalBasedRecommendations] Discovered local file: ${filename}`);
            }
          } catch (error) {
            // File doesn't exist, skip silently
          }
        }
        
        // If we found files with this pattern, don't try other patterns
        if (availableLanguages.length > 0) {
          break;
        }
      }
      
      if (availableLanguages.length > 0) {
        this.availableFiles.set(goal, availableLanguages);
        // Store the working pattern for this goal
        this.availableFiles.set(`${goal}_pattern`, [workingPattern!]);
      }
    }

    console.log(`[GoalBasedRecommendations] Discovered local files for goals:`, 
      Array.from(this.availableFiles.keys()).filter(k => !k.endsWith('_pattern')));

    // If no local files found, fallback to BundledContentService
    if (this.availableFiles.size === 0) {
      console.log('[GoalBasedRecommendations] No local files found, falling back to BundledContentService...');
      try {
        const availableGoalsResult = await bundledContentService.getAvailableGoals();
        
        if (availableGoalsResult.success && availableGoalsResult.data.length > 0) {
          for (const goal of availableGoalsResult.data) {
            this.availableFiles.set(goal, ['en']); // Default to English for bundled content
            this.availableFiles.set(`${goal}_pattern`, [`${goal}_habits-{lang}.json`]);
          }
          console.log('[GoalBasedRecommendations] Discovered goals from BundledContentService:', availableGoalsResult.data);
        }
      } catch (bundledError) {
        console.error('[GoalBasedRecommendations] BundledContentService also failed:', bundledError);
      }
    }
  }

  /**
   * Load habits for a specific goal and language
   */
  private async loadGoalHabits(goal: string, language: string): Promise<GoalBasedHabit[]> {
    const cacheKey = `${goal}-${language}`;
    
    // Check cache
    if (this.habitsCache.has(cacheKey) && Date.now() < this.cacheExpiry) {
      return this.habitsCache.get(cacheKey)!;
    }

    try {
      // First, try local content files
      const availableLanguages = this.availableFiles.get(goal);
      if (availableLanguages && availableLanguages.includes(language)) {
        // Get the discovered pattern for this goal
        const patternArray = this.availableFiles.get(`${goal}_pattern`);
        const pattern = patternArray ? patternArray[0] : `${goal}_habits-{lang}.json`;
        const filename = pattern.replace('{lang}', language);
        
        const response = await fetch(`/content-api/habits/${filename}`);
        
        if (response.ok) {
          const habits: GoalBasedHabit[] = await response.json();
          
          // Cache the results
          this.habitsCache.set(cacheKey, habits);
          this.cacheExpiry = Date.now() + this.CACHE_DURATION;
          
          console.log(`[GoalBasedRecommendations] Loaded ${habits.length} habits from local content: ${filename}`);
          return habits;
        }
      }
      
      // Fallback to BundledContentService
      console.log(`[GoalBasedRecommendations] Content API unavailable, using BundledContentService for goal: ${goal}`);
      const bundledResult = await bundledContentService.getHabitsByGoal(goal);
      
      if (bundledResult.success && bundledResult.data.length > 0) {
        // Convert BundledHabit to GoalBasedHabit format
        const habits: GoalBasedHabit[] = bundledResult.data.map(bundledHabit => ({
          id: bundledHabit.id,
          title: bundledHabit.title,
          description: bundledHabit.description,
          category: bundledHabit.category,
          difficulty: bundledHabit.difficulty,
          timeMinutes: bundledHabit.timeMinutes,
          language: bundledHabit.language || language,
          researchBacked: bundledHabit.researchBacked || false,
          effectivenessScore: bundledHabit.effectivenessScore,
          effectivenessRank: bundledHabit.effectivenessRank || 1,
          priority: bundledHabit.priority || 1,
          isPrimaryRecommendation: bundledHabit.isPrimaryRecommendation || false,
          recommendedForYou: bundledHabit.recommendedForYou,
          goalTags: bundledHabit.goalTags,
          instructions: Array.isArray(bundledHabit.instructions) ? bundledHabit.instructions : [bundledHabit.instructions || bundledHabit.description],
          whyEffective: bundledHabit.whyEffective || bundledHabit.description,
          researchSummary: bundledHabit.researchSummary || 'Research-backed habit for optimal results.',
          sources: bundledHabit.sources || [],
          optimalTiming: bundledHabit.optimalTiming || 'Any time that works for you',
          progressionTips: bundledHabit.progressionTips || ['Start small and build consistency', 'Track your progress daily']
        }));
        
        // Cache the results
        this.habitsCache.set(cacheKey, habits);
        this.cacheExpiry = Date.now() + this.CACHE_DURATION;
        
        console.log(`[GoalBasedRecommendations] Loaded ${habits.length} habits from BundledContentService for goal: ${goal}`);
        return habits;
      }
      
      // If both methods fail, return empty array
      console.warn(`[GoalBasedRecommendations] No habits found for goal: ${goal}, language: ${language}`);
      return [];
      
    } catch (error) {
      console.error(`[GoalBasedRecommendations] Failed to load ${goal}-${language}:`, error);
      throw error;
    }
  }

  /**
   * Get available goals
   */
  async getAvailableGoals(): Promise<string[]> {
    await this.discoverAvailableFiles();
    return Array.from(this.availableFiles.keys());
  }

  /**
   * Get available languages for a goal
   */
  async getAvailableLanguages(goal: string): Promise<string[]> {
    await this.discoverAvailableFiles();
    return this.availableFiles.get(goal) || [];
  }

  /**
   * Clear cache for testing
   */
  clearCache(): void {
    this.habitsCache.clear();
    this.availableFiles.clear();
    this.cacheExpiry = 0;
    console.log('[GoalBasedRecommendations] Cache cleared');
  }
}

// Export singleton instance
const goalBasedRecommendations = new GoalBasedRecommendationEngine();
export default goalBasedRecommendations;