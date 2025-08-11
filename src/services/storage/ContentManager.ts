import { ContentLoader } from './ContentLoader';
import { ContentLoadResult } from '../../types/content';
import { Habit, ResearchArticle } from '../../types';

/**
 * ContentManager serves as the integration layer between ContentLoader
 * and the existing app architecture (stores, contexts, etc.)
 */
export class ContentManager {
  private static instance: ContentManager;
  private contentLoader: ContentLoader;
  private lastLoadedContent: ContentLoadResult | null = null;
  private isInitialized = false;

  private constructor() {
    this.contentLoader = new ContentLoader({
      validateContent: true,
      hotReload: process.env.NODE_ENV === 'development',
      debugLogging: true,
      failOnValidationError: false
    });
  }

  /**
   * Singleton instance
   */
  static getInstance(): ContentManager {
    if (!ContentManager.instance) {
      ContentManager.instance = new ContentManager();
    }
    return ContentManager.instance;
  }

  /**
   * Initialize the content loading system
   * This should be called once during app startup
   */
  async initialize(): Promise<ContentLoadResult> {
    if (this.isInitialized && this.lastLoadedContent) {
      return this.lastLoadedContent;
    }

    console.log('🚀 Initializing modular content loading system...');
    
    try {
      const result = await this.contentLoader.loadAllContent();
      this.lastLoadedContent = result;
      this.isInitialized = true;
      
      console.log('✅ Content loading system initialized successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to initialize content loading system:', error);
      
      // Fallback to empty content rather than crashing the app
      const fallbackResult: ContentLoadResult = {
        habits: [],
        research: [],
        validation: {
          isValid: false,
          errors: [{
            type: 'error',
            severity: 'critical',
            message: 'Content loading system failed to initialize',
            file: 'system',
            details: { error: error instanceof Error ? error.message : 'Unknown error' }
          }],
          warnings: [],
          summary: {
            totalHabits: 0,
            totalResearch: 0,
            filesLoaded: [],
            duplicatesFound: 0,
            processingTime: 0
          }
        },
        loadedFiles: []
      };
      
      this.lastLoadedContent = fallbackResult;
      return fallbackResult;
    }
  }

  /**
   * Get all loaded habits
   */
  async getHabits(): Promise<Habit[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.lastLoadedContent?.habits || [];
  }

  /**
   * Get all loaded research articles
   */
  async getResearchArticles(): Promise<ResearchArticle[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.lastLoadedContent?.research || [];
  }

  /**
   * Get habits filtered by goal tags
   */
  async getHabitsForGoals(goalTags: string[]): Promise<Habit[]> {
    const allHabits = await this.getHabits();
    return allHabits.filter(habit => 
      habit.goalTags?.some(tag => goalTags.includes(tag))
    );
  }

  /**
   * Get research articles related to a specific habit
   */
  async getResearchForHabit(habitId: string): Promise<ResearchArticle[]> {
    const allResearch = await this.getResearchArticles();
    return allResearch.filter(article =>
      article.relatedHabits?.includes(habitId)
    );
  }

  /**
   * Get the last validation result
   */
  getLastValidationResult() {
    return this.lastLoadedContent?.validation;
  }

  /**
   * Force reload of all content (useful for development)
   */
  async reload(): Promise<ContentLoadResult> {
    this.isInitialized = false;
    this.lastLoadedContent = null;
    return await this.initialize();
  }

  /**
   * Get content loading statistics
   */
  getStats() {
    if (!this.lastLoadedContent) {
      return null;
    }

    const { validation, loadedFiles } = this.lastLoadedContent;
    
    return {
      habits: validation.summary.totalHabits,
      research: validation.summary.totalResearch,
      filesLoaded: validation.summary.filesLoaded.length,
      errors: validation.errors.length,
      warnings: validation.warnings.length,
      processingTime: validation.summary.processingTime,
      loadedAt: loadedFiles[0]?.loadedAt || new Date().toISOString()
    };
  }
}

// Export a convenient singleton instance
export const contentManager = ContentManager.getInstance();