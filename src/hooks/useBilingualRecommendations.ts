/**
 * React Hook for Bilingual Habit Recommendations
 * 
 * Provides easy access to personalized habit recommendations
 * with full localization support and effectiveness ranking.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  EffectivenessRankingService, 
  RecommendationRequest, 
  RecommendationResponse,
  GoalCategoryRanking 
} from '../services/localization/EffectivenessRankingService';
import { BilingualHabit, SupportedLanguage } from '../types/localization';
import { useLanguage } from './useLanguage';

export interface UseRecommendationsOptions {
  autoLoad?: boolean; // Automatically load recommendations on mount
  defaultRequest?: Partial<RecommendationRequest>;
}

export interface UseRecommendationsReturn {
  // Recommendation data
  recommendations: RecommendationResponse | null;
  isLoading: boolean;
  error: string | null;

  // Methods
  getRecommendations: (request: RecommendationRequest) => Promise<void>;
  refreshRecommendations: () => Promise<void>;
  clearRecommendations: () => void;

  // Category rankings
  categoryRankings: GoalCategoryRanking[];
  loadCategoryRankings: () => Promise<void>;

  // Global data
  topHabits: BilingualHabit[];
  primaryRecommendations: BilingualHabit[];
  systemStats: any;
}

export const useBilingualRecommendations = (
  options: UseRecommendationsOptions = {}
): UseRecommendationsReturn => {
  const { currentLanguage } = useLanguage();
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<RecommendationRequest | null>(null);
  
  // Category and global data
  const [categoryRankings, setCategoryRankings] = useState<GoalCategoryRanking[]>([]);
  const [topHabits, setTopHabits] = useState<BilingualHabit[]>([]);
  const [primaryRecommendations, setPrimaryRecommendations] = useState<BilingualHabit[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);

  /**
   * Get personalized recommendations
   */
  const getRecommendations = useCallback(async (request: RecommendationRequest) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Ensure language is set
      const requestWithLanguage = {
        ...request,
        language: request.language || currentLanguage
      };
      
      const result = await EffectivenessRankingService.getPersonalizedRecommendations(requestWithLanguage);
      setRecommendations(result);
      setLastRequest(requestWithLanguage);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(errorMessage);
      console.error('Recommendation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage]);

  /**
   * Refresh current recommendations
   */
  const refreshRecommendations = useCallback(async () => {
    if (lastRequest) {
      await getRecommendations(lastRequest);
    }
  }, [lastRequest, getRecommendations]);

  /**
   * Clear current recommendations
   */
  const clearRecommendations = useCallback(() => {
    setRecommendations(null);
    setLastRequest(null);
    setError(null);
  }, []);

  /**
   * Load category rankings for all goal categories
   */
  const loadCategoryRankings = useCallback(async () => {
    try {
      const categories: ('better_sleep' | 'get_moving' | 'feel_better')[] = [
        'better_sleep', 'get_moving', 'feel_better'
      ];
      
      const rankings = await Promise.all(
        categories.map(category => 
          EffectivenessRankingService.getGoalCategoryRanking(category)
        )
      );
      
      setCategoryRankings(rankings);
    } catch (err) {
      console.error('Failed to load category rankings:', err);
    }
  }, []);

  /**
   * Load global habit data
   */
  const loadGlobalData = useCallback(async () => {
    try {
      // Cast to bilingual language type (only EN/DE supported for bilingual content)
      const bilingualLanguage = (currentLanguage === 'de' ? 'de' : 'en') as 'en' | 'de';
      
      const [topHabitsData, primaryRecs, stats] = await Promise.all([
        EffectivenessRankingService.getGlobalRankings(bilingualLanguage, 10),
        EffectivenessRankingService.getPrimaryRecommendations(bilingualLanguage),
        EffectivenessRankingService.getRankingSystemStats()
      ]);
      
      setTopHabits(topHabitsData);
      setPrimaryRecommendations(primaryRecs);
      setSystemStats(stats);
    } catch (err) {
      console.error('Failed to load global data:', err);
    }
  }, [currentLanguage]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (options.autoLoad && options.defaultRequest) {
      const defaultRequest: RecommendationRequest = {
        goalCategories: ['better_sleep', 'get_moving', 'feel_better'],
        language: (currentLanguage === 'de' ? 'de' : 'en') as 'en' | 'de',
        userLevel: 'beginner',
        ...options.defaultRequest
      };
      
      getRecommendations(defaultRequest);
    }
  }, [options.autoLoad, options.defaultRequest, currentLanguage, getRecommendations]);

  // Load category rankings and global data on mount
  useEffect(() => {
    loadCategoryRankings();
    loadGlobalData();
  }, [loadCategoryRankings, loadGlobalData]);

  // Refresh global data when language changes
  useEffect(() => {
    loadGlobalData();
  }, [currentLanguage, loadGlobalData]);

  return {
    // Recommendation data
    recommendations,
    isLoading,
    error,

    // Methods
    getRecommendations,
    refreshRecommendations,
    clearRecommendations,

    // Category rankings
    categoryRankings,
    loadCategoryRankings,

    // Global data
    topHabits,
    primaryRecommendations,
    systemStats
  };
};

/**
 * Simplified hook for getting quick recommendations
 */
export const useQuickRecommendations = (
  goalCategories: ('better_sleep' | 'get_moving' | 'feel_better')[],
  userLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner'
) => {
  const { currentLanguage } = useLanguage();
  const [recommendations, setRecommendations] = useState<BilingualHabit[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadQuickRecommendations = async () => {
      setIsLoading(true);
      try {
        const request: RecommendationRequest = {
          goalCategories,
          language: (currentLanguage === 'de' ? 'de' : 'en') as 'en' | 'de',
          userLevel
        };
        
        const result = await EffectivenessRankingService.getPersonalizedRecommendations(request);
        setRecommendations(result.primaryRecommendations);
      } catch (error) {
        console.error('Failed to load quick recommendations:', error);
        setRecommendations([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadQuickRecommendations();
  }, [goalCategories, currentLanguage, userLevel]);

  return { recommendations, isLoading };
};

/**
 * Hook for getting category-specific recommendations
 */
export const useCategoryRecommendations = (
  goalCategory: 'better_sleep' | 'get_moving' | 'feel_better',
  count: number = 3
) => {
  const { currentLanguage } = useLanguage();
  const [ranking, setRanking] = useState<GoalCategoryRanking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCategoryRanking = async () => {
      setIsLoading(true);
      try {
        const result = await EffectivenessRankingService.getGoalCategoryRanking(goalCategory);
        setRanking(result);
      } catch (error) {
        console.error('Failed to load category ranking:', error);
        setRanking(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadCategoryRanking();
  }, [goalCategory]);

  return {
    ranking,
    habits: ranking?.topThreeHabits.slice(0, count) || [],
    isLoading,
    averageEffectiveness: ranking?.averageEffectiveness || 0,
    researchStrength: ranking?.researchStrength || 'medium'
  };
};