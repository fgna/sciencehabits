import { 
  SupportedLanguage, 
  TranslationMetadata, 
  QualityWarning, 
  LocalizedContent,
  LocalizedHabit,
  LocalizedResearchArticle 
} from '../../types/i18n';
import { Habit, ResearchArticle } from '../../types';

interface ClaudeTranslationRequest {
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  content: any;
  contentType: 'habit' | 'research' | 'ui' | 'general';
  culturalContext?: {
    region: string;
    formality: 'formal' | 'informal';
    audience: 'general' | 'medical' | 'academic';
  };
}

interface ClaudeTranslationResponse {
  translatedContent: any;
  confidence: number;
  suggestions: string[];
  culturalNotes: string[];
  qualityWarnings: QualityWarning[];
}

/**
 * TranslationService handles automatic translation using Claude API
 * with immediate publishing and quality tracking
 */
export class TranslationService {
  private readonly apiEndpoint: string;
  private readonly apiKey: string | null;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000;

  constructor() {
    // In a real implementation, these would come from environment variables
    // For this demo, we'll simulate the API
    this.apiEndpoint = process.env.REACT_APP_CLAUDE_API_ENDPOINT || 'https://api.anthropic.com/v1/messages';
    this.apiKey = process.env.REACT_APP_CLAUDE_API_KEY || null;
  }

  /**
   * Translate a habit with immediate publishing
   */
  async translateHabit(
    habit: Habit, 
    targetLanguage: SupportedLanguage,
    sourceLanguage: SupportedLanguage = 'en'
  ): Promise<{ habit: LocalizedHabit; metadata: TranslationMetadata }> {
    console.log(`🔄 Translating habit "${habit.title}" to ${targetLanguage}`);

    try {
      const culturalContext = this.getCulturalContext(targetLanguage);
      
      const request: ClaudeTranslationRequest = {
        sourceLanguage,
        targetLanguage,
        content: habit,
        contentType: 'habit',
        culturalContext
      };

      const response = await this.callClaudeAPI(request);
      
      // Create localized habit with immediate publishing
      const localizedHabit: LocalizedHabit = {
        ...response.translatedContent,
        id: habit.id,
        language: targetLanguage,
        sourceLanguage,
        translatedAt: new Date().toISOString(),
        translatedBy: 'claude'
      };

      // Create metadata with quality tracking
      const metadata: TranslationMetadata = {
        fileId: `habit_${habit.id}_${targetLanguage}`,
        sourceFile: `habits/${sourceLanguage}.json`,
        targetFile: `habits/${targetLanguage}.json`,
        publishingStatus: 'live', // Immediate publishing
        reviewStatus: 'unreviewed',
        translatedBy: 'claude',
        translatedAt: new Date().toISOString(),
        confidence: response.confidence,
        qualityWarnings: response.qualityWarnings,
        culturalNotes: response.culturalNotes,
        suggestedImprovements: response.suggestions
      };

      console.log(`✅ Habit translated and published to ${targetLanguage} (confidence: ${response.confidence}%)`);

      return { habit: localizedHabit, metadata };

    } catch (error) {
      console.error(`❌ Failed to translate habit to ${targetLanguage}:`, error);
      
      // Create error metadata
      const errorMetadata: TranslationMetadata = {
        fileId: `habit_${habit.id}_${targetLanguage}`,
        sourceFile: `habits/${sourceLanguage}.json`,
        targetFile: `habits/${targetLanguage}.json`,
        publishingStatus: 'error',
        reviewStatus: 'unreviewed',
        translatedBy: 'claude',
        translatedAt: new Date().toISOString(),
        confidence: 0,
        qualityWarnings: [{
          type: 'translation_error',
          severity: 'high',
          message: `Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          suggestion: 'Manual review required'
        }],
        culturalNotes: [],
        suggestedImprovements: ['Consider manual translation']
      };

      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Translate a research article with immediate publishing
   */
  async translateResearchArticle(
    article: ResearchArticle,
    targetLanguage: SupportedLanguage,
    sourceLanguage: SupportedLanguage = 'en'
  ): Promise<{ article: LocalizedResearchArticle; metadata: TranslationMetadata }> {
    console.log(`🔄 Translating research article "${article.title}" to ${targetLanguage}`);

    try {
      const culturalContext = this.getCulturalContext(targetLanguage);
      
      const request: ClaudeTranslationRequest = {
        sourceLanguage,
        targetLanguage,
        content: article,
        contentType: 'research',
        culturalContext: {
          ...culturalContext,
          audience: 'academic'
        }
      };

      const response = await this.callClaudeAPI(request);
      
      // Create localized research article with immediate publishing
      const localizedArticle: LocalizedResearchArticle = {
        ...response.translatedContent,
        id: article.id,
        language: targetLanguage,
        sourceLanguage,
        translatedAt: new Date().toISOString(),
        translatedBy: 'claude'
      };

      // Create metadata with quality tracking
      const metadata: TranslationMetadata = {
        fileId: `research_${article.id}_${targetLanguage}`,
        sourceFile: `research/${sourceLanguage}.json`,
        targetFile: `research/${targetLanguage}.json`,
        publishingStatus: 'live', // Immediate publishing
        reviewStatus: 'unreviewed',
        translatedBy: 'claude',
        translatedAt: new Date().toISOString(),
        confidence: response.confidence,
        qualityWarnings: response.qualityWarnings,
        culturalNotes: response.culturalNotes,
        suggestedImprovements: response.suggestions
      };

      console.log(`✅ Research article translated and published to ${targetLanguage} (confidence: ${response.confidence}%)`);

      return { article: localizedArticle, metadata };

    } catch (error) {
      console.error(`❌ Failed to translate research article to ${targetLanguage}:`, error);
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Translate UI content with immediate publishing
   */
  async translateUIContent(
    content: Record<string, any>,
    targetLanguage: SupportedLanguage,
    sourceLanguage: SupportedLanguage = 'en'
  ): Promise<{ content: Record<string, any>; metadata: TranslationMetadata }> {
    console.log(`🔄 Translating UI content to ${targetLanguage}`);

    try {
      const culturalContext = this.getCulturalContext(targetLanguage);
      
      const request: ClaudeTranslationRequest = {
        sourceLanguage,
        targetLanguage,
        content,
        contentType: 'ui',
        culturalContext
      };

      const response = await this.callClaudeAPI(request);
      
      // Create metadata with immediate publishing
      const metadata: TranslationMetadata = {
        fileId: `ui_${targetLanguage}`,
        sourceFile: `locales/${sourceLanguage}.json`,
        targetFile: `locales/${targetLanguage}.json`,
        publishingStatus: 'live', // Immediate publishing
        reviewStatus: 'unreviewed',
        translatedBy: 'claude',
        translatedAt: new Date().toISOString(),
        confidence: response.confidence,
        qualityWarnings: response.qualityWarnings,
        culturalNotes: response.culturalNotes,
        suggestedImprovements: response.suggestions
      };

      console.log(`✅ UI content translated and published to ${targetLanguage} (confidence: ${response.confidence}%)`);

      return { content: response.translatedContent, metadata };

    } catch (error) {
      console.error(`❌ Failed to translate UI content to ${targetLanguage}:`, error);
      throw new Error(`Translation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Batch translate multiple items with progress tracking
   */
  async batchTranslate<T>(
    items: T[],
    translateFunction: (item: T) => Promise<any>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<any[]> {
    const results: any[] = [];
    
    for (let i = 0; i < items.length; i++) {
      try {
        const result = await translateFunction(items[i]);
        results.push(result);
        
        if (onProgress) {
          onProgress(i + 1, items.length);
        }
      } catch (error) {
        console.error(`Batch translation failed for item ${i}:`, error);
        results.push(null); // Keep array alignment
      }
    }
    
    return results;
  }

  /**
   * Get available translation languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return ['en', 'de', 'fr', 'es'];
  }

  /**
   * Check if translation service is available
   */
  isAvailable(): boolean {
    // In a real implementation, this would check API connectivity
    return true; // For demo purposes
  }

  /**
   * Get translation cost estimate
   */
  estimateTranslationCost(contentLength: number, targetLanguages: SupportedLanguage[]): number {
    // Simple cost estimation model
    const baseTokens = Math.ceil(contentLength / 4); // ~4 chars per token
    const costPerToken = 0.001; // Placeholder rate
    return baseTokens * targetLanguages.length * costPerToken;
  }

  /**
   * Private method to call Claude API (simulated for demo)
   */
  private async callClaudeAPI(request: ClaudeTranslationRequest): Promise<ClaudeTranslationResponse> {
    // Simulate API call with retry logic
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await this.makeAPICall(request);
      } catch (error) {
        if (attempt === this.maxRetries) {
          throw error;
        }
        console.warn(`Translation attempt ${attempt} failed, retrying...`);
        await this.delay(this.retryDelay * attempt);
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  /**
   * Simulate actual API call to Claude
   */
  private async makeAPICall(request: ClaudeTranslationRequest): Promise<ClaudeTranslationResponse> {
    // Simulate network delay
    await this.delay(500 + Math.random() * 1000);

    // For demo purposes, we'll simulate translation
    // In a real implementation, this would call the actual Claude API
    if (!this.apiKey) {
      console.warn('⚠️ Claude API key not configured, using simulated translations');
    }

    const translatedContent = this.simulateTranslation(request);
    
    return {
      translatedContent,
      confidence: 85 + Math.random() * 10, // 85-95% confidence
      suggestions: this.generateSuggestions(request),
      culturalNotes: this.generateCulturalNotes(request),
      qualityWarnings: this.generateQualityWarnings(request)
    };
  }

  /**
   * Simulate translation for demo purposes
   */
  private simulateTranslation(request: ClaudeTranslationRequest): any {
    const { content, contentType, targetLanguage } = request;
    
    // Simple simulation - in reality this would be done by Claude
    if (contentType === 'habit') {
      return {
        ...content,
        title: this.getSimulatedTranslation(content.title, targetLanguage),
        description: this.getSimulatedTranslation(content.description, targetLanguage),
        instructions: content.instructions?.map((inst: string) => 
          this.getSimulatedTranslation(inst, targetLanguage)
        )
      };
    }
    
    if (contentType === 'research') {
      return {
        ...content,
        title: this.getSimulatedTranslation(content.title, targetLanguage),
        summary: this.getSimulatedTranslation(content.summary, targetLanguage),
        keyFindings: content.keyFindings?.map((finding: string) => 
          this.getSimulatedTranslation(finding, targetLanguage)
        )
      };
    }
    
    if (contentType === 'ui') {
      return this.translateUIObject(content, targetLanguage);
    }
    
    return content;
  }

  /**
   * Recursively translate UI object
   */
  private translateUIObject(obj: any, targetLanguage: SupportedLanguage): any {
    if (typeof obj === 'string') {
      return this.getSimulatedTranslation(obj, targetLanguage);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.translateUIObject(item, targetLanguage));
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const translated: any = {};
      for (const [key, value] of Object.entries(obj)) {
        translated[key] = this.translateUIObject(value, targetLanguage);
      }
      return translated;
    }
    
    return obj;
  }

  /**
   * Get simulated translation (placeholder)
   */
  private getSimulatedTranslation(text: string, targetLanguage: SupportedLanguage): string {
    // This is just a placeholder - real implementation would use Claude API
    const prefixes = {
      de: '[DE]',
      fr: '[FR]',
      es: '[ES]',
      en: ''
    };
    
    return `${prefixes[targetLanguage]} ${text}`;
  }

  /**
   * Get cultural context for language
   */
  private getCulturalContext(language: SupportedLanguage) {
    const contexts = {
      en: { region: 'us', formality: 'informal' as const, audience: 'general' as const },
      de: { region: 'de', formality: 'formal' as const, audience: 'general' as const },
      fr: { region: 'fr', formality: 'formal' as const, audience: 'general' as const },
      es: { region: 'es', formality: 'informal' as const, audience: 'general' as const }
    };
    
    return contexts[language];
  }

  /**
   * Generate suggestions for improvement
   */
  private generateSuggestions(request: ClaudeTranslationRequest): string[] {
    const suggestions = [];
    
    if (request.targetLanguage === 'de') {
      suggestions.push('Consider verifying formal/informal address usage');
    }
    
    if (request.contentType === 'research') {
      suggestions.push('Review technical terminology for accuracy');
    }
    
    if (request.contentType === 'habit') {
      suggestions.push('Ensure cultural appropriateness of habit recommendations');
    }
    
    return suggestions;
  }

  /**
   * Generate cultural notes
   */
  private generateCulturalNotes(request: ClaudeTranslationRequest): string[] {
    const notes = [];
    
    if (request.targetLanguage === 'de') {
      notes.push('German audience prefers formal language in health contexts');
    }
    
    if (request.targetLanguage === 'fr') {
      notes.push('French health regulations may affect recommendation phrasing');
    }
    
    return notes;
  }

  /**
   * Generate quality warnings
   */
  private generateQualityWarnings(request: ClaudeTranslationRequest): QualityWarning[] {
    const warnings: QualityWarning[] = [];
    
    // Simulate some quality checks
    if (Math.random() < 0.3) { // 30% chance of warning
      warnings.push({
        type: 'cultural_context',
        severity: 'medium',
        message: 'Cultural adaptation may be needed for local context',
        suggestion: 'Review with native speaker familiar with health/wellness context'
      });
    }
    
    if (request.contentType === 'research' && Math.random() < 0.2) {
      warnings.push({
        type: 'technical_terminology',
        severity: 'high',
        message: 'Technical medical terms detected',
        suggestion: 'Verify medical terminology accuracy with subject matter expert'
      });
    }
    
    return warnings;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
export const translationService = new TranslationService();