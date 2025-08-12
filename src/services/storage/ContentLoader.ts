import { Habit, ResearchArticle } from '../../types';
import {
  ContentFile,
  ContentLoadResult,
  ContentLoaderConfig,
  ValidationResult
} from '../../types/content';
import { ContentValidator } from '../../utils/contentValidation';

export class ContentLoader {
  private config: ContentLoaderConfig;
  private validator: ContentValidator;
  private loadedContent: Map<string, any> = new Map();

  constructor(config: Partial<ContentLoaderConfig> = {}) {
    this.config = {
      validateContent: true,
      hotReload: process.env.NODE_ENV === 'development',
      debugLogging: process.env.NODE_ENV === 'development',
      failOnValidationError: false,
      maxFileSize: 1024 * 1024, // 1MB
      ...config
    };
    
    this.validator = new ContentValidator();
    this.setupHotReload();
  }

  /**
   * Main entry point - loads all content using auto-discovery
   */
  async loadAllContent(): Promise<ContentLoadResult> {
    const startTime = performance.now();
    this.log('🚀 Starting content loading process...');

    try {
      // Load all content using BrowserAutoContentLoader
      const contentData = await this.loadCoreContent();
      
      // Validate merged content
      const validation = this.config.validateContent 
        ? await this.validator.validateAll(contentData.habits, contentData.research)
        : this.createEmptyValidation(contentData.habits, contentData.research);

      const processingTime = performance.now() - startTime;
      validation.summary.processingTime = processingTime;

      // Log results
      this.logValidationResults(validation);

      // Handle validation failures
      if (!validation.isValid && this.config.failOnValidationError) {
        throw new Error(`Content validation failed with ${validation.errors.length} errors`);
      }

      const result: ContentLoadResult = {
        habits: contentData.habits,
        research: contentData.research,
        validation,
        loadedFiles: contentData.files
      };

      this.log(`✅ Content loading completed in ${processingTime.toFixed(2)}ms`);
      return result;

    } catch (error) {
      this.logError('❌ Content loading failed:', error);
      throw error;
    }
  }


  /**
   * Load core content files using BrowserAutoContentLoader
   */
  private async loadCoreContent(): Promise<{ habits: Habit[], research: ResearchArticle[], files: ContentFile[] }> {
    this.log('📚 Loading core content files with auto-discovery...');
    
    // Import the browser auto content loader
    const { BrowserAutoContentLoader } = await import('../content/BrowserAutoContentLoader');
    const autoLoader = new BrowserAutoContentLoader();
    
    try {
      const loadedContent = await autoLoader.loadAllContent();
      
      const files: ContentFile[] = loadedContent.sources
        .filter(source => source.type === 'habits' || source.type === 'research')
        .map(source => ({
          path: source.path,
          category: source.category,
          type: source.type === 'habits' ? 'habit' as const : 'research' as const,
          data: [], // Data is already merged in habits/research arrays
          loadedAt: new Date().toISOString()
        }));
      
      return { 
        habits: loadedContent.habits, 
        research: loadedContent.research, 
        files 
      };
      
    } catch (error) {
      this.logError('❌ Failed to load core content:', error);
      throw error;
    }
  }


  /**
   * Setup hot reload for development
   */
  private setupHotReload(): void {
    if (!this.config.hotReload) return;

    // In a real implementation, we'd setup file watchers here
    // For now, just log that hot reload is enabled
    this.log('🔥 Hot reload enabled for development');
  }

  /**
   * Create empty validation result for when validation is disabled
   */
  private createEmptyValidation(habits: Habit[], research: ResearchArticle[]): ValidationResult {
    return {
      isValid: true,
      errors: [],
      warnings: [],
      summary: {
        totalHabits: habits.length,
        totalResearch: research.length,
        filesLoaded: [],
        duplicatesFound: 0,
        processingTime: 0
      }
    };
  }

  /**
   * Log validation results with colors and emojis
   */
  private logValidationResults(validation: ValidationResult): void {
    if (!this.config.debugLogging) return;

    const { summary, errors, warnings } = validation;
    
    console.log('\n📊 Content Validation Summary:');
    console.log(`✅ ${summary.totalHabits} habits loaded`);
    console.log(`✅ ${summary.totalResearch} research articles loaded`);
    console.log(`📁 ${summary.filesLoaded.length} files processed`);
    
    if (summary.duplicatesFound > 0) {
      console.warn(`⚠️  ${summary.duplicatesFound} duplicates found and resolved`);
    }

    if (errors.length > 0) {
      console.log('\n❌ Validation Errors:');
      errors.forEach(error => {
        console.error(`  • ${error.message} (${error.file})`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  Validation Warnings:');
      warnings.forEach(warning => {
        console.warn(`  • ${warning.message} (${warning.file})`);
      });
    }

    console.log(`\n⏱️  Processing completed in ${summary.processingTime.toFixed(2)}ms`);
  }

  /**
   * Utility logging methods
   */
  private log(message: string): void {
    if (this.config.debugLogging) {
      console.log(`[ContentLoader] ${message}`);
    }
  }

  private logError(message: string, error: any): void {
    if (this.config.debugLogging) {
      console.error(`[ContentLoader] ${message}`, error);
    }
  }
}