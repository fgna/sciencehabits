import { 
  SupportedLanguage, 
  LocalizedContent, 
  TranslationMetadata, 
  QualityWarning 
} from '../../types/i18n';

export class MultiLanguageContentManager {
  private supportedLanguages: SupportedLanguage[] = ['en', 'de', 'fr', 'es'];
  private contentCache: Map<string, LocalizedContent> = new Map();
  private metadataCache: Map<string, TranslationMetadata> = new Map();

  /**
   * Load content with immediate publishing (no blocking for quality)
   * Content is available immediately, even if unreviewed
   */
  async loadContent(language: SupportedLanguage): Promise<LocalizedContent> {
    const cacheKey = `content_${language}`;
    
    // Check cache first
    if (this.contentCache.has(cacheKey)) {
      return this.contentCache.get(cacheKey)!;
    }

    try {
      // Load content from appropriate language directory
      const content = await this.loadLanguageContent(language);
      
      // Cache the content
      this.contentCache.set(cacheKey, content);
      
      return content;
    } catch (error) {
      console.warn(`Failed to load ${language} content, falling back to English:`, error);
      
      // Fallback to English if target language fails
      if (language !== 'en') {
        return this.loadContent('en');
      }
      
      throw new Error(`Failed to load content for language: ${language}`);
    }
  }

  /**
   * Load language-specific content files
   */
  private async loadLanguageContent(language: SupportedLanguage): Promise<LocalizedContent> {
    const basePath = `/src/data/${language}`;
    
    try {
      // Dynamic imports for each content type
      const [habits, enhancedHabits, research, goals] = await Promise.allSettled([
        this.loadJsonFile(`${basePath}/habits.json`),
        this.loadJsonFile(`${basePath}/enhanced_habits.json`),
        this.loadJsonFile(`${basePath}/research_articles.json`),
        this.loadJsonFile(`${basePath}/goals.json`)
      ]);

      return {
        habits: this.getSettledValue(habits, []),
        enhancedHabits: this.getSettledValue(enhancedHabits, []),
        research: this.getSettledValue(research, []),
        goals: this.getSettledValue(goals, []),
        language,
        loadedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error loading content for ${language}:`, error);
      throw error;
    }
  }

  /**
   * Load JSON file with error handling
   */
  private async loadJsonFile(path: string): Promise<any> {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.warn(`Failed to load ${path}:`, error);
      return null;
    }
  }

  /**
   * Extract value from Promise.allSettled result
   */
  private getSettledValue<T>(result: PromiseSettledResult<T>, defaultValue: T): T {
    return result.status === 'fulfilled' && result.value !== null 
      ? result.value 
      : defaultValue;
  }

  /**
   * Get translation status for all languages
   */
  async getMultiLanguageStatus(): Promise<Record<SupportedLanguage, TranslationMetadata[]>> {
    const status: Record<SupportedLanguage, TranslationMetadata[]> = {
      en: [],
      de: [],
      fr: [],
      es: []
    };

    for (const language of this.supportedLanguages) {
      try {
        const metadata = await this.getLanguageMetadata(language);
        status[language] = metadata;
      } catch (error) {
        console.warn(`Failed to get metadata for ${language}:`, error);
        status[language] = [];
      }
    }

    return status;
  }

  /**
   * Get metadata for a specific language
   */
  private async getLanguageMetadata(language: SupportedLanguage): Promise<TranslationMetadata[]> {
    try {
      const response = await fetch('/src/data/translation-metadata.json');
      const metadata = await response.json();
      
      return metadata.translations.filter(
        (t: TranslationMetadata) => t.targetFile.includes(`/${language}.json`)
      );
    } catch (error) {
      console.warn(`Failed to load translation metadata:`, error);
      return [];
    }
  }

  /**
   * Validate content and generate quality warnings (non-blocking)
   * This runs asynchronously and doesn't block content availability
   */
  async validateAndWarn(language: SupportedLanguage): Promise<QualityWarning[]> {
    const warnings: QualityWarning[] = [];
    
    try {
      const content = await this.loadContent(language);
      const englishContent = language !== 'en' ? await this.loadContent('en') : null;
      
      // Validate content structure
      warnings.push(...this.validateContentStructure(content, language));
      
      // Compare with English if translating
      if (englishContent) {
        warnings.push(...this.validateTranslationCompleteness(
          englishContent, 
          content, 
          language
        ));
      }
      
      // Check for unreviewed content
      warnings.push(...await this.checkUnreviewedContent(language));
      
    } catch (error) {
      warnings.push({
        type: 'validation_error',
        severity: 'high',
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Check content loading and validation logic'
      });
    }
    
    return warnings;
  }

  /**
   * Validate content structure
   */
  private validateContentStructure(content: LocalizedContent, language: SupportedLanguage): QualityWarning[] {
    const warnings: QualityWarning[] = [];
    
    // Check required content types exist
    const requiredTypes = ['habits', 'research', 'goals'];
    for (const type of requiredTypes) {
      if (!content[type] || !Array.isArray(content[type])) {
        warnings.push({
          type: 'missing_content',
          severity: 'high',
          message: `Missing or invalid ${type} content`,
          suggestion: `Ensure ${type} content is properly loaded`
        });
      }
    }
    
    return warnings;
  }

  /**
   * Validate translation completeness vs English
   */
  private validateTranslationCompleteness(
    englishContent: LocalizedContent,
    translatedContent: LocalizedContent,
    language: SupportedLanguage
  ): QualityWarning[] {
    const warnings: QualityWarning[] = [];
    
    // Check habits count
    const englishHabits = englishContent.habits?.length || 0;
    const translatedHabits = translatedContent.habits?.length || 0;
    
    if (translatedHabits < englishHabits) {
      warnings.push({
        type: 'incomplete_translation',
        severity: 'medium',
        message: `Missing ${englishHabits - translatedHabits} habit translations`,
        suggestion: 'Translate remaining habits'
      });
    }
    
    // Check research articles count
    const englishResearch = englishContent.research?.length || 0;
    const translatedResearch = translatedContent.research?.length || 0;
    
    if (translatedResearch < englishResearch) {
      warnings.push({
        type: 'incomplete_translation',
        severity: 'medium',
        message: `Missing ${englishResearch - translatedResearch} research article translations`,
        suggestion: 'Translate remaining research articles'
      });
    }
    
    return warnings;
  }

  /**
   * Check for unreviewed content
   */
  private async checkUnreviewedContent(language: SupportedLanguage): Promise<QualityWarning[]> {
    const warnings: QualityWarning[] = [];
    
    try {
      const metadata = await this.getLanguageMetadata(language);
      
      for (const meta of metadata) {
        if (meta.reviewStatus === 'unreviewed') {
          warnings.push({
            type: 'unreviewed',
            severity: 'low',
            message: `${meta.targetFile} has not been reviewed by humans`,
            suggestion: 'Schedule human review'
          });
        }
      }
    } catch (error) {
      console.warn(`Failed to check unreviewed content for ${language}:`, error);
    }
    
    return warnings;
  }

  /**
   * Determine content type from file name
   */
  private getContentTypeFromFile(fileName: string): 'habit' | 'research' | 'ui_text' | 'goal' {
    if (fileName.includes('habit')) return 'habit';
    if (fileName.includes('research')) return 'research';
    if (fileName.includes('goal')) return 'goal';
    return 'ui_text';
  }

  /**
   * Merge content with English fallback for missing items only
   * Only fallback if content is completely missing, not for quality issues
   */
  async mergeWithFallback(
    primary: LocalizedContent, 
    fallback: LocalizedContent
  ): Promise<LocalizedContent> {
    const merged = { ...primary };
    
    // Only merge if primary content is missing or empty
    Object.keys(fallback).forEach(key => {
      if (!merged[key] || (Array.isArray(merged[key]) && merged[key].length === 0)) {
        merged[key] = fallback[key];
        console.info(`Using fallback content for: ${key}`);
      }
    });
    
    return merged;
  }

  /**
   * Publish content immediately (even unreviewed)
   * All content goes live as soon as it's translated
   */
  async publishContent(language: SupportedLanguage, content: LocalizedContent): Promise<void> {
    try {
      // In a real implementation, this would write to the language-specific directory
      // For now, we update the cache to simulate immediate publishing
      const cacheKey = `content_${language}`;
      this.contentCache.set(cacheKey, {
        ...content,
        publishedAt: new Date().toISOString(),
        status: 'live'
      });
      
      console.log(`✅ Content published immediately for ${language}`);
      
      // Update metadata to reflect published status
      await this.updatePublishingStatus(language, 'live');
      
    } catch (error) {
      console.error(`Failed to publish content for ${language}:`, error);
      await this.updatePublishingStatus(language, 'error');
      throw error;
    }
  }

  /**
   * Update publishing status in metadata
   */
  private async updatePublishingStatus(
    language: SupportedLanguage, 
    status: 'live' | 'error'
  ): Promise<void> {
    try {
      // In a real implementation, this would update the metadata file
      const metadata = await this.getLanguageMetadata(language);
      
      metadata.forEach(meta => {
        meta.publishingStatus = status;
        meta.translatedAt = new Date().toISOString();
      });
      
      console.log(`Updated publishing status for ${language}: ${status}`);
    } catch (error) {
      console.warn(`Failed to update publishing status for ${language}:`, error);
    }
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return [...this.supportedLanguages];
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language: string): language is SupportedLanguage {
    return this.supportedLanguages.includes(language as SupportedLanguage);
  }

  /**
   * Clear content cache
   */
  clearCache(): void {
    this.contentCache.clear();
    this.metadataCache.clear();
  }
}