/**
 * Bundled Content Service
 * 
 * A simplified content service that uses build-time bundled content
 * instead of runtime API calls. This ensures 100% offline capability
 * and eliminates deployment issues with external API dependencies.
 */

// Import bundled content directly
import habitsAll from '../data/bundled/habits/all.json';
import habitsByGoal from '../data/bundled/habits/by-goal.json';
import localesAll from '../data/bundled/locales/all.json';
import localesEn from '../data/bundled/locales/en.json';
import localesDe from '../data/bundled/locales/de.json';
import researchAll from '../data/bundled/research/all.json';
import bundleManifest from '../data/bundled/manifest.json';

export interface BundledHabit {
  id: string;
  title: string;
  description: string;
  category: string;
  goalTags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  timeMinutes: number;
  effectivenessScore: number;
  instructions: string[] | string;
  researchBacked?: boolean;
  language?: string;
  effectivenessRank?: number;
  priority?: number;
  isPrimaryRecommendation?: boolean;
  recommendedForYou?: boolean;
  fallback?: boolean;
}

export interface BundledResearch {
  id: string;
  title: string;
  summary: string;
  authors: string;
  year: number;
  journal: string;
  category: string;
  evidenceLevel: string;
  qualityScore: number;
  language: string;
  fallback?: boolean;
}

export interface BundledLocale {
  [key: string]: string;
}

export interface ContentLoadResult<T> {
  success: boolean;
  data: T;
  source: 'bundled-content';
  timestamp: string;
  error?: string;
}

export class BundledContentService {
  private static instance: BundledContentService;
  
  // Cache for processed content
  private habitCache: Map<string, BundledHabit[]> = new Map();
  private localeCache: Map<string, BundledLocale> = new Map();
  
  constructor() {
    console.log('🎯 BundledContentService initialized');
    console.log(`📦 Bundle version: ${bundleManifest.bundleVersion}`);
    console.log(`🔄 Bundle timestamp: ${bundleManifest.timestamp}`);
    console.log(`📊 Content summary:`, bundleManifest.content);
  }

  static getInstance(): BundledContentService {
    if (!BundledContentService.instance) {
      BundledContentService.instance = new BundledContentService();
    }
    return BundledContentService.instance;
  }

  /**
   * Get all habits bundled in the app
   */
  async getAllHabits(): Promise<ContentLoadResult<BundledHabit[]>> {
    try {
      const habits = habitsAll.data as BundledHabit[];
      
      return {
        success: true,
        data: habits,
        source: 'bundled-content',
        timestamp: habitsAll.timestamp
      };
    } catch (error) {
      console.error('Failed to load bundled habits:', error);
      
      return {
        success: false,
        data: [],
        source: 'bundled-content',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get habits by goal category
   */
  async getHabitsByGoal(goalCategory: string): Promise<ContentLoadResult<BundledHabit[]>> {
    try {
      const cacheKey = `goal-${goalCategory}`;
      
      if (this.habitCache.has(cacheKey)) {
        return {
          success: true,
          data: this.habitCache.get(cacheKey)!,
          source: 'bundled-content',
          timestamp: new Date().toISOString()
        };
      }

      const goalData = (habitsByGoal.data as any)[goalCategory];
      
      if (!goalData) {
        return {
          success: false,
          data: [],
          source: 'bundled-content',
          timestamp: new Date().toISOString(),
          error: `Goal category '${goalCategory}' not found`
        };
      }

      // Get habits from the first available language (usually 'en')
      const availableLanguages = Object.keys(goalData);
      const primaryLanguage = availableLanguages.includes('en') ? 'en' : availableLanguages[0];
      const habits = goalData[primaryLanguage] as BundledHabit[];

      // Cache the result
      this.habitCache.set(cacheKey, habits);

      return {
        success: true,
        data: habits,
        source: 'bundled-content',
        timestamp: habitsByGoal.timestamp
      };
    } catch (error) {
      console.error(`Failed to load habits for goal '${goalCategory}':`, error);
      
      return {
        success: false,
        data: [],
        source: 'bundled-content',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get available goal categories
   */
  async getAvailableGoals(): Promise<ContentLoadResult<string[]>> {
    try {
      const goals = Object.keys(habitsByGoal.data as any);
      
      return {
        success: true,
        data: goals,
        source: 'bundled-content',
        timestamp: habitsByGoal.timestamp
      };
    } catch (error) {
      console.error('Failed to load available goals:', error);
      
      return {
        success: false,
        data: [],
        source: 'bundled-content',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get habits by multiple goal categories
   */
  async getHabitsByGoals(goalCategories: string[]): Promise<ContentLoadResult<BundledHabit[]>> {
    try {
      const allHabits: BundledHabit[] = [];
      
      for (const goal of goalCategories) {
        const result = await this.getHabitsByGoal(goal);
        if (result.success) {
          allHabits.push(...result.data);
        }
      }

      // Remove duplicates by ID
      const uniqueHabits = allHabits.filter((habit, index, array) => 
        array.findIndex(h => h.id === habit.id) === index
      );

      return {
        success: true,
        data: uniqueHabits,
        source: 'bundled-content',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to load habits for multiple goals:', error);
      
      return {
        success: false,
        data: [],
        source: 'bundled-content',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get research articles
   */
  async getResearch(): Promise<ContentLoadResult<BundledResearch[]>> {
    try {
      const research = researchAll.data as BundledResearch[];
      
      return {
        success: true,
        data: research,
        source: 'bundled-content',
        timestamp: researchAll.timestamp
      };
    } catch (error) {
      console.error('Failed to load bundled research:', error);
      
      return {
        success: false,
        data: [],
        source: 'bundled-content',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get locale translations for a specific language
   */
  async getLocales(language: string = 'en'): Promise<ContentLoadResult<BundledLocale>> {
    try {
      const cacheKey = `locale-${language}`;
      
      if (this.localeCache.has(cacheKey)) {
        return {
          success: true,
          data: this.localeCache.get(cacheKey)!,
          source: 'bundled-content',
          timestamp: new Date().toISOString()
        };
      }

      let localeData: BundledLocale;
      let timestamp: string;

      // Load the appropriate locale file
      switch (language) {
        case 'en':
          localeData = localesEn.data as BundledLocale;
          timestamp = localesEn.timestamp;
          break;
        case 'de':
          localeData = localesDe.data as BundledLocale;
          timestamp = localesDe.timestamp;
          break;
        default:
          // Fallback to English for unsupported languages
          localeData = localesEn.data as BundledLocale;
          timestamp = localesEn.timestamp;
          console.warn(`Language '${language}' not supported, falling back to English`);
      }

      // Cache the result
      this.localeCache.set(cacheKey, localeData);

      return {
        success: true,
        data: localeData,
        source: 'bundled-content',
        timestamp
      };
    } catch (error) {
      console.error(`Failed to load locales for language '${language}':`, error);
      
      return {
        success: false,
        data: {},
        source: 'bundled-content',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get available languages
   */
  async getAvailableLanguages(): Promise<ContentLoadResult<string[]>> {
    try {
      const allLocales = localesAll.data as any;
      const languages = Object.keys(allLocales);
      
      return {
        success: true,
        data: languages,
        source: 'bundled-content',
        timestamp: localesAll.timestamp
      };
    } catch (error) {
      console.error('Failed to load available languages:', error);
      
      return {
        success: false,
        data: ['en'],
        source: 'bundled-content',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get bundle information and statistics
   */
  getBundleInfo() {
    return {
      version: bundleManifest.bundleVersion,
      buildType: bundleManifest.buildType,
      timestamp: bundleManifest.timestamp,
      content: bundleManifest.content,
      stats: bundleManifest.stats,
      source: 'build-time-bundled',
      offlineCapable: true,
      apiDependencies: 'none'
    };
  }

  /**
   * Search habits by text query
   */
  async searchHabits(query: string): Promise<ContentLoadResult<BundledHabit[]>> {
    try {
      const allHabitsResult = await this.getAllHabits();
      
      if (!allHabitsResult.success) {
        return allHabitsResult;
      }

      const queryLower = query.toLowerCase();
      const matchingHabits = allHabitsResult.data.filter(habit => 
        habit.title.toLowerCase().includes(queryLower) ||
        habit.description.toLowerCase().includes(queryLower) ||
        habit.goalTags.some(tag => tag.toLowerCase().includes(queryLower)) ||
        habit.category.toLowerCase().includes(queryLower)
      );

      return {
        success: true,
        data: matchingHabits,
        source: 'bundled-content',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to search habits:', error);
      
      return {
        success: false,
        data: [],
        source: 'bundled-content',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get content health status
   */
  getContentHealth() {
    return {
      status: 'healthy',
      source: 'bundled',
      contentAvailable: true,
      bundleInfo: this.getBundleInfo(),
      lastUpdated: bundleManifest.timestamp,
      offlineCapable: true,
      apiRequired: false
    };
  }
}

// Export singleton instance
export const bundledContentService = BundledContentService.getInstance();

// Export for backwards compatibility
export default bundledContentService;