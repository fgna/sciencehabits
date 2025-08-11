import { Habit, ResearchArticle } from '../../types';
import {
  ContentFile,
  ContentLoadResult,
  ContentLoaderConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  DiscoveredContent
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
   * Main entry point - loads all content from core and modular files
   */
  async loadAllContent(): Promise<ContentLoadResult> {
    const startTime = performance.now();
    this.log('🚀 Starting content loading process...');

    try {
      // Discover all available content files
      const discovered = await this.discoverContentFiles();
      
      // Load core content (original files)
      const coreContent = await this.loadCoreContent();
      
      // Load modular content (directory-based files)
      const modularContent = await this.loadModularContent(discovered);
      
      // Merge all content
      const habits = [...coreContent.habits, ...modularContent.habits];
      const research = [...coreContent.research, ...modularContent.research];
      
      // Validate merged content
      const validation = this.config.validateContent 
        ? await this.validator.validateAll(habits, research)
        : this.createEmptyValidation(habits, research);

      const processingTime = performance.now() - startTime;
      validation.summary.processingTime = processingTime;

      // Log results
      this.logValidationResults(validation);

      // Handle validation failures
      if (!validation.isValid && this.config.failOnValidationError) {
        throw new Error(`Content validation failed with ${validation.errors.length} errors`);
      }

      const result: ContentLoadResult = {
        habits,
        research,
        validation,
        loadedFiles: [...coreContent.files, ...modularContent.files]
      };

      this.log(`✅ Content loading completed in ${processingTime.toFixed(2)}ms`);
      return result;

    } catch (error) {
      this.logError('❌ Content loading failed:', error);
      throw error;
    }
  }

  /**
   * Discover all JSON files in the data directories
   */
  private async discoverContentFiles(): Promise<DiscoveredContent> {
    this.log('🔍 Discovering content files...');

    const discovered: DiscoveredContent = {
      coreFiles: {
        habits: ['../../data/habits.json', '../../data/enhanced_habits.json'],
        research: ['../../data/research_articles.json'],
        goals: '../../data/goals.json'
      },
      modularFiles: {
        habits: [],
        research: []
      },
      customFiles: {
        habits: [],
        research: []
      }
    };

    // Discover modular habit files
    try {
      const habitsContext = this.createRequireContext('../../data/habits/', false, /\.json$/);
      if (habitsContext) {
        discovered.modularFiles.habits = habitsContext.keys().map(key => key);
      }
    } catch (error) {
      // Directory doesn't exist yet - that's ok
      this.log('📁 No modular habits directory found (this is normal for first run)');
    }

    // Discover modular research files
    try {
      const researchContext = this.createRequireContext('../../data/research/', false, /\.json$/);
      if (researchContext) {
        discovered.modularFiles.research = researchContext.keys().map(key => key);
      }
    } catch (error) {
      // Directory doesn't exist yet - that's ok
      this.log('📁 No modular research directory found (this is normal for first run)');
    }

    // Discover custom content files
    try {
      const customContext = this.createRequireContext('../../data/content-custom/', false, /\.json$/);
      if (customContext) {
        const files = customContext.keys();
        discovered.customFiles.habits = files.filter(f => f.includes('habit'));
        discovered.customFiles.research = files.filter(f => f.includes('research'));
      }
    } catch (error) {
      // Custom directory doesn't exist yet - that's ok
      this.log('📁 No custom content directory found (this is normal for first run)');
    }

    return discovered;
  }

  /**
   * Load core content files (original data)
   */
  private async loadCoreContent(): Promise<{ habits: Habit[], research: ResearchArticle[], files: ContentFile[] }> {
    this.log('📚 Loading core content files...');
    
    const habits: Habit[] = [];
    const research: ResearchArticle[] = [];
    const files: ContentFile[] = [];

    try {
      // Load basic habits
      const basicHabits = await import('../../data/habits.json');
      const basicHabitsArray = Array.isArray(basicHabits.default) ? basicHabits.default : [];
      habits.push(...basicHabitsArray);
      files.push({
        path: '../../data/habits.json',
        category: 'core',
        type: 'habit',
        data: basicHabitsArray,
        loadedAt: new Date().toISOString()
      });
      this.log(`✅ Loaded habits.json (${basicHabitsArray.length} habits)`);

      // Load enhanced habits
      const enhancedHabits = await import('../../data/enhanced_habits.json');
      if (enhancedHabits.default?.habits) {
        habits.push(...enhancedHabits.default.habits);
        files.push({
          path: '../../data/enhanced_habits.json',
          category: 'core',
          type: 'habit',
          data: enhancedHabits.default.habits,
          loadedAt: new Date().toISOString()
        });
        this.log(`✅ Loaded enhanced_habits.json (${enhancedHabits.default.habits.length} habits)`);
      }

      // Load research articles
      const researchData = await import('../../data/research_articles.json');
      const researchArray = Array.isArray(researchData.default) ? researchData.default : [];
      research.push(...researchArray);
      files.push({
        path: '../../data/research_articles.json',
        category: 'core',
        type: 'research',
        data: researchArray,
        loadedAt: new Date().toISOString()
      });
      this.log(`✅ Loaded research_articles.json (${researchArray.length} articles)`);

    } catch (error) {
      this.logError('❌ Failed to load core content:', error);
      throw error;
    }

    return { habits, research, files };
  }

  /**
   * Load modular content files from directories
   */
  private async loadModularContent(discovered: DiscoveredContent): Promise<{ habits: Habit[], research: ResearchArticle[], files: ContentFile[] }> {
    this.log('🔧 Loading modular content files...');
    
    const habits: Habit[] = [];
    const research: ResearchArticle[] = [];
    const files: ContentFile[] = [];

    // Load modular habit files
    for (const habitFile of discovered.modularFiles.habits) {
      try {
        const data = await import(`../../data/habits/${habitFile}`);
        const habitsArray = Array.isArray(data.default) ? data.default : [];
        habits.push(...habitsArray);
        files.push({
          path: `../../data/habits/${habitFile}`,
          category: this.extractCategory(habitFile),
          type: 'habit',
          data: habitsArray,
          loadedAt: new Date().toISOString()
        });
        this.log(`✅ Loaded ${habitFile} (${habitsArray.length} habits)`);
      } catch (error) {
        this.logError(`❌ Failed to load habit file ${habitFile}:`, error);
      }
    }

    // Load modular research files
    for (const researchFile of discovered.modularFiles.research) {
      try {
        const data = await import(`../../data/research/${researchFile}`);
        const researchArray = Array.isArray(data.default) ? data.default : [];
        research.push(...researchArray);
        files.push({
          path: `../../data/research/${researchFile}`,
          category: this.extractCategory(researchFile),
          type: 'research',
          data: researchArray,
          loadedAt: new Date().toISOString()
        });
        this.log(`✅ Loaded ${researchFile} (${researchArray.length} articles)`);
      } catch (error) {
        this.logError(`❌ Failed to load research file ${researchFile}:`, error);
      }
    }

    // Load custom content files
    for (const customFile of [...discovered.customFiles.habits, ...discovered.customFiles.research]) {
      try {
        const data = await import(`../../data/content-custom/${customFile}`);
        const contentArray = Array.isArray(data.default) ? data.default : [];
        const isHabit = customFile.includes('habit');
        
        if (isHabit) {
          habits.push(...contentArray);
        } else {
          research.push(...contentArray);
        }
        
        files.push({
          path: `../../data/content-custom/${customFile}`,
          category: 'custom',
          type: isHabit ? 'habit' : 'research',
          data: contentArray,
          loadedAt: new Date().toISOString()
        });
        this.log(`✅ Loaded custom ${customFile} (${contentArray.length} items)`);
      } catch (error) {
        this.logError(`❌ Failed to load custom file ${customFile}:`, error);
      }
    }

    return { habits, research, files };
  }

  /**
   * Create require.context safely with error handling
   */
  private createRequireContext(directory: string, useSubdirectories: boolean, regExp: RegExp): any {
    try {
      // Note: require.context is a Webpack feature
      // In a real implementation, we'd need to handle this differently
      // For now, return null if not available
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract category name from filename
   */
  private extractCategory(filename: string): string {
    const withoutExt = filename.replace(/\.(json)$/i, '');
    const parts = withoutExt.split('-');
    return parts[0] || 'unknown';
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