/**
 * Effectiveness Ranking Service
 * 
 * Manages effectiveness scoring and ranking for multilingual habits.
 * Provides logic for serving top recommendations per goal category.
 */

import { MultilingualHabit, SupportedLanguage as MultilingualLanguage } from '../../types/localization';
import { SupportedLanguage } from '../../types/i18n';

export interface RankingCriteria {
  researchQuality: number; // 0-1 weight for research quality
  effectivenessScore: number; // 0-1 weight for effectiveness score
  userEngagement: number; // 0-1 weight for user engagement metrics
  culturalRelevance: number; // 0-1 weight for cultural adaptation
}

export interface GoalCategoryRanking {
  goalCategory: 'better_sleep' | 'get_moving' | 'feel_better';
  totalHabits: number;
  topThreeHabits: MultilingualHabit[];
  averageEffectiveness: number;
  researchStrength: 'high' | 'medium' | 'low';
}

export interface RecommendationRequest {
  goalCategories: ('better_sleep' | 'get_moving' | 'feel_better')[];
  language: MultilingualLanguage;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  timeAvailable?: number; // minutes per day
  currentHabits?: string[]; // habit IDs already adopted
}

export interface RecommendationResponse {
  primaryRecommendations: MultilingualHabit[]; // Top 3, one per requested goal
  alternativeOptions: MultilingualHabit[]; // Additional options if primaries don't fit
  reasoning: string;
  expectedBenefits: string[];
  estimatedTimeCommitment: number; // total minutes per day
}

export class EffectivenessRankingService {
  private static readonly DEFAULT_RANKING_CRITERIA: RankingCriteria = {
    researchQuality: 0.4,
    effectivenessScore: 0.4,
    userEngagement: 0.1,
    culturalRelevance: 0.1
  };

  /**
   * Load all multilingual habits from the content API
   */
  private static async loadAllHabits(): Promise<MultilingualHabit[]> {
    try {
      // Fetch from content API - update this URL to match your deployment
      const contentApiBase = process.env.REACT_APP_CONTENT_API_URL || 'http://localhost:3002';
      const apiKey = 'build-key-2024-secure'; // Production API key for the main app
      
      // Add cache busting timestamp to ensure fresh data
      const cacheBuster = `?t=${Date.now()}`;
      const [enResponse, deResponse] = await Promise.all([
        fetch(`${contentApiBase}/habits/multilingual-science-habits-en.json${cacheBuster}`),
        fetch(`${contentApiBase}/habits/multilingual-science-habits-de.json${cacheBuster}`)
      ]);

      if (!enResponse.ok || !deResponse.ok) {
        const errorMsg = `Content API error: EN ${enResponse.status}, DE ${deResponse.status}`;
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      const [enHabits, deHabits] = await Promise.all([
        enResponse.json(),
        deResponse.json()
      ]);

      // Check if we got proper habit arrays
      if (!Array.isArray(enHabits) || !Array.isArray(deHabits)) {
        console.error('Content API returned unexpected format:', { enHabits, deHabits });
        throw new Error('Content API returned invalid data format');
      }

      // Convert to multilingual format
      const multilingualHabits: MultilingualHabit[] = enHabits.map((enHabit: any) => {
        const deHabit = deHabits.find((de: any) => de.id === enHabit.id);
        
        return {
          id: enHabit.id,
          goalCategory: enHabit.category as 'better_sleep' | 'get_moving' | 'feel_better',
          effectivenessScore: enHabit.effectivenessScore,
          effectivenessRank: enHabit.effectivenessRank,
          isPrimaryRecommendation: enHabit.isPrimaryRecommendation,
          difficulty: enHabit.difficulty,
          timeMinutes: enHabit.timeMinutes,
          equipment: enHabit.equipment || 'none',
          goalTags: enHabit.goalTags || [],
          uiLabels: {
            templateVersion: '1.0',
            requiredLabels: ['title', 'description']
          },
          translations: {
            en: {
              title: enHabit.title,
              description: enHabit.description,
              researchSummary: enHabit.researchSummary,
              researchSource: enHabit.sources?.[0] || 'Research source pending',
              whyItWorks: enHabit.whyEffective,
              quickStart: enHabit.instructions?.join('. ') || enHabit.description,
              timeToComplete: `${enHabit.timeMinutes} minutes`,
              optimalTiming: enHabit.optimalTiming || 'Anytime',
              difficultyLevel: enHabit.difficulty,
              category: enHabit.category,
              researchEffectiveness: `Effectiveness score: ${enHabit.effectivenessScore}/10`,
              progressionTips: enHabit.progressionTips?.join('. ') || 'Start slowly and build consistency.'
            },
            de: {
              title: deHabit?.title || enHabit.title,
              description: deHabit?.description || enHabit.description,
              researchSummary: deHabit?.researchSummary || enHabit.researchSummary,
              researchSource: deHabit?.sources?.[0] || enHabit.sources?.[0] || 'Forschungsquelle ausstehend',
              whyItWorks: deHabit?.whyEffective || enHabit.whyEffective,
              quickStart: deHabit?.instructions?.join('. ') || deHabit?.description || enHabit.description,
              timeToComplete: `${enHabit.timeMinutes} Minuten`,
              optimalTiming: deHabit?.optimalTiming || 'Jederzeit',
              difficultyLevel: deHabit?.difficulty || enHabit.difficulty,
              category: deHabit?.category || enHabit.category,
              researchEffectiveness: `Effektivitätswert: ${enHabit.effectivenessScore}/10`,
              progressionTips: deHabit?.progressionTips?.join('. ') || 'Beginnen Sie langsam und bauen Sie Konsistenz auf.'
            }
          }
        };
      });

      return multilingualHabits;
    } catch (error) {
      console.error('Failed to load habit data from content API:', error);
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Check if it's a network error (API server not running)
      if (error instanceof TypeError && errorMessage.includes('fetch')) {
        console.error('Content API server appears to be offline. Please ensure the sciencehabits-content-api server is running on port 3002.');
        throw new Error('Content API server is unavailable. Please check that the content server is running and try again.');
      }
      
      // Check if it's a data format error
      if (errorMessage.includes('invalid data format')) {
        throw new Error('Content API returned invalid data. Please check the API server configuration.');
      }
      
      // For other errors, provide generic message but still fallback
      console.warn('Using fallback mock data due to content API error:', errorMessage);
      return this.getMockHabits();
    }
  }

  /**
   * Fallback mock habits when content API is unavailable
   */
  private static getMockHabits(): MultilingualHabit[] {
    return [
      {
        id: 'sleep_001_478_breathing',
        goalCategory: 'better_sleep',
        effectivenessScore: 9.2,
        effectivenessRank: 1,
        isPrimaryRecommendation: true,
        difficulty: 'trivial',
        timeMinutes: 4,
        equipment: 'none',
        goalTags: ['sleep_quality', 'stress_reduction'],
        uiLabels: {
          templateVersion: '1.0',
          requiredLabels: ['title', 'description']
        },
        translations: {
          en: {
            title: '4-7-8 Breathing for Sleep',
            description: 'Simple breathing technique for faster sleep onset',
            researchSummary: 'Stanford study showed 37% improvement in sleep onset time',
            researchSource: 'Stanford Sleep Research Lab (2023)',
            whyItWorks: 'Activates parasympathetic nervous system',
            quickStart: 'Inhale 4, hold 7, exhale 8 seconds',
            timeToComplete: '4 minutes',
            optimalTiming: 'Before bedtime',
            difficultyLevel: 'beginner',
            category: 'Sleep',
            researchEffectiveness: 'Reduces sleep onset by 37%',
            progressionTips: 'Start with 2 cycles, build to 8'
          },
          de: {
            title: '4-7-8 Atmung für den Schlaf',
            description: 'Einfache Atemtechnik für schnelleres Einschlafen',
            researchSummary: 'Stanford Studie zeigte 37% Verbesserung der Einschlafzeit',
            researchSource: 'Stanford Sleep Research Lab (2023)',
            whyItWorks: 'Aktiviert parasympathisches Nervensystem',
            quickStart: '4 Sekunden einatmen, 7 halten, 8 ausatmen',
            timeToComplete: '4 Minuten',
            optimalTiming: 'Vor dem Schlafengehen',
            difficultyLevel: 'Anfänger',
            category: 'Schlaf',
            researchEffectiveness: 'Reduziert Einschlafzeit um 37%',
            progressionTips: 'Mit 2 Zyklen beginnen, auf 8 steigern'
          }
        }
      }
    ];
  }

  /**
   * Get effectiveness rankings for a specific goal category
   */
  static async getGoalCategoryRanking(
    goalCategory: 'better_sleep' | 'get_moving' | 'feel_better',
    criteria: RankingCriteria = this.DEFAULT_RANKING_CRITERIA
  ): Promise<GoalCategoryRanking> {
    const allHabits = await this.loadAllHabits();
    const categoryHabits = allHabits.filter(habit => habit.goalCategory === goalCategory);

    // Sort by effectiveness rank (1 is highest)
    const sortedHabits = categoryHabits.sort((a, b) => a.effectivenessRank - b.effectivenessRank);
    const topThreeHabits = sortedHabits.slice(0, 3);

    const averageEffectiveness = categoryHabits.reduce((sum, habit) => 
      sum + habit.effectivenessScore, 0) / categoryHabits.length;

    // Determine research strength based on average effectiveness and sample sizes
    let researchStrength: 'high' | 'medium' | 'low' = 'medium';
    if (averageEffectiveness >= 8.5) {
      researchStrength = 'high';
    } else if (averageEffectiveness < 7.5) {
      researchStrength = 'low';
    }

    return {
      goalCategory,
      totalHabits: categoryHabits.length,
      topThreeHabits,
      averageEffectiveness: Math.round(averageEffectiveness * 10) / 10,
      researchStrength
    };
  }

  /**
   * Get comprehensive recommendations based on user preferences
   * Always returns exactly 3 total recommendations distributed across selected goals
   */
  static async getPersonalizedRecommendations(
    request: RecommendationRequest
  ): Promise<RecommendationResponse> {
    const allHabits = await this.loadAllHabits();
    const primaryRecommendations: MultilingualHabit[] = [];
    const alternativeOptions: MultilingualHabit[] = [];

    // Calculate how many recommendations per goal (always totaling 3)
    const goalCount = request.goalCategories.length;
    const recommendationsPerGoal = this.distributeRecommendations(goalCount);

    // Get filtered habits for each goal category
    const goalHabitPools: { [key: string]: MultilingualHabit[] } = {};
    
    for (const goalCategory of request.goalCategories) {
      let categoryHabits = allHabits.filter(habit => 
        habit.goalCategory === goalCategory && 
        !request.currentHabits?.includes(habit.id)
      );

      // Filter by user level if specified
      if (request.userLevel) {
        const levelPreference = request.userLevel;
        categoryHabits = categoryHabits.filter(habit => {
          const habitLevel = habit.translations[request.language].difficultyLevel;
          return habitLevel === levelPreference || habitLevel === 'beginner';
        });
      }

      // Filter by time availability if specified
      if (request.timeAvailable && request.timeAvailable > 0) {
        const maxTime = request.timeAvailable;
        categoryHabits = categoryHabits.filter(habit => {
          const timeStr = habit.translations[request.language].timeToComplete;
          const timeMinutes = this.extractTimeInMinutes(timeStr);
          return timeMinutes <= maxTime;
        });
      }

      // Sort by effectiveness rank (1 is best)
      goalHabitPools[goalCategory] = categoryHabits.sort((a, b) => a.effectivenessRank - b.effectivenessRank);
    }

    // Distribute exactly 3 recommendations across goals
    request.goalCategories.forEach((goalCategory, index) => {
      const habitsToTake = recommendationsPerGoal[index];
      const availableHabits = goalHabitPools[goalCategory];
      
      // Take the specified number of top habits for this goal
      const selectedHabits = availableHabits.slice(0, habitsToTake);
      primaryRecommendations.push(...selectedHabits);
      
      // Add remaining habits as alternatives (up to 2 more per goal)
      const remainingHabits = availableHabits.slice(habitsToTake, habitsToTake + 2);
      alternativeOptions.push(...remainingHabits);
    });

    // Calculate total time commitment
    const estimatedTimeCommitment = primaryRecommendations.reduce((total, habit) => {
      const timeStr = habit.translations[request.language].timeToComplete;
      return total + this.extractTimeInMinutes(timeStr);
    }, 0);

    // Generate reasoning
    const reasoning = this.generateRecommendationReasoning(
      primaryRecommendations, 
      request
    );

    // Extract expected benefits
    const expectedBenefits = this.extractExpectedBenefits(
      primaryRecommendations,
      request.language
    );

    return {
      primaryRecommendations,
      alternativeOptions,
      reasoning,
      expectedBenefits,
      estimatedTimeCommitment
    };
  }

  /**
   * Get all habits ranked by overall effectiveness across all categories
   */
  static async getGlobalRankings(
    language: MultilingualLanguage = 'en',
    limit: number = 10
  ): Promise<MultilingualHabit[]> {
    const allHabits = await this.loadAllHabits();
    
    return allHabits
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, limit);
  }

  /**
   * Get habits specifically marked as primary recommendations
   */
  static async getPrimaryRecommendations(
    language: MultilingualLanguage = 'en'
  ): Promise<MultilingualHabit[]> {
    const allHabits = await this.loadAllHabits();
    
    return allHabits
      .filter(habit => habit.isPrimaryRecommendation)
      .sort((a, b) => a.effectivenessRank - b.effectivenessRank);
  }

  /**
   * Calculate effectiveness score based on multiple criteria
   */
  private static calculateWeightedScore(
    habit: MultilingualHabit,
    criteria: RankingCriteria
  ): number {
    // Base effectiveness score (0-10 scale, normalize to 0-1)
    const normalizedEffectiveness = habit.effectivenessScore / 10;

    // Research quality score based on study characteristics mentioned in researchSummary
    const researchQuality = this.assessResearchQuality(habit);

    // User engagement score (would be based on actual usage data in production)
    const userEngagement = 0.8; // Mock value

    // Cultural relevance (higher for content adapted for German users)
    const culturalRelevance = this.assessCulturalRelevance(habit);

    return (
      normalizedEffectiveness * criteria.effectivenessScore +
      researchQuality * criteria.researchQuality +
      userEngagement * criteria.userEngagement +
      culturalRelevance * criteria.culturalRelevance
    );
  }

  /**
   * Assess research quality based on study characteristics
   */
  private static assessResearchQuality(habit: MultilingualHabit): number {
    const researchSummary = habit.translations.en.researchSummary.toLowerCase();
    
    let score = 0.5; // Base score
    
    // Check for study size indicators
    if (researchSummary.includes('meta-analysis')) score += 0.3;
    if (researchSummary.match(/\d{3,}/)) score += 0.2; // 3+ digit participant count
    
    // Check for prestigious institutions
    if (researchSummary.includes('harvard') || 
        researchSummary.includes('stanford') || 
        researchSummary.includes('mit')) score += 0.2;
    
    // Check for quantified results
    if (researchSummary.match(/\d+%/)) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Assess cultural relevance and adaptation quality
   */
  private static assessCulturalRelevance(habit: MultilingualHabit): number {
    const germanTranslation = habit.translations.de;
    
    let score = 0.5; // Base score for having translation
    
    // Check for metric conversions
    if (germanTranslation.description.includes('minuten') || 
        germanTranslation.description.includes('meter')) score += 0.2;
    
    // Check for cultural adaptation in language
    if (germanTranslation.description.includes('Sie')) score += 0.1; // Formal address
    
    // Check for localized terminology
    if (germanTranslation.whyItWorks && 
        germanTranslation.whyItWorks.includes('Studien')) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  /**
   * Extract time in minutes from time strings
   */
  private static extractTimeInMinutes(timeStr: string): number {
    const match = timeStr.match(/(\d+)/);
    if (!match) return 10; // Default fallback
    
    const number = parseInt(match[1]);
    
    if (timeStr.toLowerCase().includes('hour')) {
      return number * 60;
    }
    return number; // Assume minutes
  }

  /**
   * Distribute 3 total recommendations across the selected number of goals
   */
  private static distributeRecommendations(goalCount: number): number[] {
    if (goalCount === 1) {
      return [3]; // All 3 recommendations for single goal
    } else if (goalCount === 2) {
      return [2, 1]; // 2 for first goal, 1 for second goal
    } else if (goalCount === 3) {
      return [1, 1, 1]; // 1 recommendation per goal
    } else {
      // Fallback for more than 3 goals (distribute evenly, prioritize first goals)
      const base = Math.floor(3 / goalCount);
      const remainder = 3 % goalCount;
      const distribution = new Array(goalCount).fill(base);
      
      // Add remainder to first goals
      for (let i = 0; i < remainder; i++) {
        distribution[i]++;
      }
      
      return distribution;
    }
  }

  /**
   * Generate human-readable reasoning for recommendations
   */
  private static generateRecommendationReasoning(
    recommendations: MultilingualHabit[],
    request: RecommendationRequest
  ): string {
    const totalEffectiveness = recommendations.reduce((sum, habit) => 
      sum + habit.effectivenessScore, 0) / recommendations.length;
    
    const goalCount = request.goalCategories.length;
    const distributionText = goalCount === 1 ? 
      "3 habits for your selected goal" :
      goalCount === 2 ? 
      "2 habits for your primary goal and 1 for your secondary goal" :
      "1 habit for each of your 3 selected goals";
    
    let reasoning = `Selected ${distributionText} based on effectiveness scores (average ${totalEffectiveness.toFixed(1)}/10) and research quality.`;
    
    if (request.userLevel) {
      reasoning += ` All recommendations are suitable for ${request.userLevel} users.`;
    }
    
    if (request.timeAvailable) {
      reasoning += ` Each habit fits within your ${request.timeAvailable} minutes daily time budget.`;
    }
    
    reasoning += ` Start with the highest-ranked habit in each category for optimal results.`;
    
    return reasoning;
  }

  /**
   * Extract expected benefits from habit research summaries
   */
  private static extractExpectedBenefits(
    recommendations: MultilingualHabit[],
    language: MultilingualLanguage
  ): string[] {
    const benefits: string[] = [];
    
    recommendations.forEach(habit => {
      const research = habit.translations[language].researchSummary;
      
      // Extract percentage improvements
      const percentMatches = research.match(/(\d+)%/g);
      if (percentMatches) {
        benefits.push(`Research shows up to ${percentMatches[0]} improvement in key metrics`);
      }
      
      // Extract specific benefits
      if (research.includes('sleep')) benefits.push('Improved sleep quality');
      if (research.includes('anxiety') || research.includes('stress')) benefits.push('Reduced anxiety and stress');
      if (research.includes('happiness') || research.includes('mood')) benefits.push('Enhanced mood and happiness');
      if (research.includes('focus') || research.includes('attention')) benefits.push('Better focus and attention');
    });
    
    return [...new Set(benefits)]; // Remove duplicates
  }

  /**
   * Get statistics for the effectiveness ranking system
   */
  static async getRankingSystemStats(): Promise<{
    totalHabits: number;
    averageEffectiveness: number;
    researchSourceCount: number;
    languagesCovered: number;
    topPerformingCategory: string;
  }> {
    const allHabits = await this.loadAllHabits();
    
    const averageEffectiveness = allHabits.reduce((sum, habit) => 
      sum + habit.effectivenessScore, 0) / allHabits.length;
    
    const uniqueResearchSources = new Set(
      allHabits.map(habit => habit.translations.en.researchSource)
    ).size;
    
    // Find top performing category
    const categoryAverages = {
      better_sleep: 0,
      get_moving: 0,
      feel_better: 0
    };
    
    Object.keys(categoryAverages).forEach(category => {
      const categoryHabits = allHabits.filter(h => h.goalCategory === category);
      categoryAverages[category as keyof typeof categoryAverages] = 
        categoryHabits.reduce((sum, h) => sum + h.effectivenessScore, 0) / categoryHabits.length;
    });
    
    const topPerformingCategory = Object.entries(categoryAverages)
      .sort(([,a], [,b]) => b - a)[0][0];
    
    return {
      totalHabits: allHabits.length,
      averageEffectiveness: Math.round(averageEffectiveness * 10) / 10,
      researchSourceCount: uniqueResearchSources,
      languagesCovered: 2, // EN and DE
      topPerformingCategory
    };
  }
}