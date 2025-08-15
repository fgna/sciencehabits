import { 
  SupportedLanguage, 
  TranslationMetadata, 
  QualityWarning 
} from '../../types/i18n';

interface TranslationStats {
  totalTranslations: number;
  reviewedTranslations: number;
  pendingReviews: number;
  flaggedTranslations: number;
  averageConfidence: number;
  translationsByLanguage: Record<SupportedLanguage, number>;
  qualityWarningsByType: Record<string, number>;
}

interface TranslationFilter {
  language?: SupportedLanguage;
  reviewStatus?: 'unreviewed' | 'reviewed' | 'flagged';
  publishingStatus?: 'live' | 'error';
  translatedBy?: 'claude' | 'human';
  contentType?: 'habit' | 'research' | 'ui';
  dateRange?: {
    start: Date;
    end: Date;
  };
  confidenceThreshold?: number;
}

/**
 * TranslationMetadataService manages translation quality tracking and metadata
 */
export class TranslationMetadataService {
  private metadata: Map<string, TranslationMetadata> = new Map();
  private readonly storageKey = 'sciencehabits_translation_metadata';

  constructor() {
    this.loadMetadataFromStorage();
    this.discoverExistingTranslations();
  }

  /**
   * Add or update translation metadata
   */
  async addMetadata(metadata: TranslationMetadata): Promise<void> {
    console.log(`📝 Adding metadata for ${metadata.fileId}`);
    
    this.metadata.set(metadata.fileId, metadata);
    await this.saveMetadataToStorage();
    
    // Log quality warnings if any
    if (metadata.qualityWarnings.length > 0) {
      console.warn(`⚠️ Quality warnings for ${metadata.fileId}:`, metadata.qualityWarnings);
    }
  }

  /**
   * Get metadata by file ID
   */
  getMetadata(fileId: string): TranslationMetadata | null {
    return this.metadata.get(fileId) || null;
  }

  /**
   * Get all metadata with optional filtering
   */
  getAllMetadata(filter?: TranslationFilter): TranslationMetadata[] {
    let results = Array.from(this.metadata.values());
    
    if (!filter) {
      return results;
    }

    // Apply filters
    if (filter.language) {
      const targetLang = this.extractLanguageFromFileId(filter.language);
      results = results.filter(m => this.extractLanguageFromFileId(m.fileId) === targetLang);
    }

    if (filter.reviewStatus) {
      results = results.filter(m => m.reviewStatus === filter.reviewStatus);
    }

    if (filter.publishingStatus) {
      results = results.filter(m => m.publishingStatus === filter.publishingStatus);
    }

    if (filter.translatedBy) {
      results = results.filter(m => m.translatedBy === filter.translatedBy);
    }

    if (filter.contentType) {
      results = results.filter(m => this.getContentTypeFromFileId(m.fileId) === filter.contentType);
    }

    if (filter.dateRange) {
      results = results.filter(m => {
        const translatedDate = new Date(m.translatedAt);
        return translatedDate >= filter.dateRange!.start && translatedDate <= filter.dateRange!.end;
      });
    }

    if (filter.confidenceThreshold !== undefined) {
      results = results.filter(m => (m.confidence || 0) >= filter.confidenceThreshold!);
    }

    return results;
  }

  /**
   * Get translations requiring review
   */
  getUnreviewedTranslations(): TranslationMetadata[] {
    return this.getAllMetadata({ reviewStatus: 'unreviewed' });
  }

  /**
   * Get flagged translations
   */
  getFlaggedTranslations(): TranslationMetadata[] {
    return this.getAllMetadata({ reviewStatus: 'flagged' });
  }

  /**
   * Get translations with quality warnings
   */
  getTranslationsWithWarnings(): TranslationMetadata[] {
    return Array.from(this.metadata.values()).filter(m => 
      m.qualityWarnings && m.qualityWarnings.length > 0
    );
  }

  /**
   * Get low confidence translations
   */
  getLowConfidenceTranslations(threshold: number = 70): TranslationMetadata[] {
    return Array.from(this.metadata.values()).filter(m => 
      m.confidence !== undefined && m.confidence < threshold
    );
  }

  /**
   * Mark translation as reviewed
   */
  async markAsReviewed(
    fileId: string, 
    reviewedBy: string, 
    reviewNotes?: string
  ): Promise<void> {
    const metadata = this.metadata.get(fileId);
    if (!metadata) {
      throw new Error(`Metadata not found for ${fileId}`);
    }

    const updatedMetadata: TranslationMetadata = {
      ...metadata,
      reviewStatus: 'reviewed',
      reviewedBy,
      reviewedAt: new Date().toISOString(),
      reviewNotes
    };

    this.metadata.set(fileId, updatedMetadata);
    await this.saveMetadataToStorage();
    
    console.log(`✅ Marked ${fileId} as reviewed by ${reviewedBy}`);
  }

  /**
   * Flag translation for issues
   */
  async flagTranslation(
    fileId: string, 
    flaggedBy: string, 
    reason: string
  ): Promise<void> {
    const metadata = this.metadata.get(fileId);
    if (!metadata) {
      throw new Error(`Metadata not found for ${fileId}`);
    }

    const updatedMetadata: TranslationMetadata = {
      ...metadata,
      reviewStatus: 'flagged',
      flaggedBy,
      flaggedAt: new Date().toISOString(),
      flagReason: reason
    };

    this.metadata.set(fileId, updatedMetadata);
    await this.saveMetadataToStorage();
    
    console.log(`🚩 Flagged ${fileId} by ${flaggedBy}: ${reason}`);
  }

  /**
   * Add quality warning to existing metadata
   */
  async addQualityWarning(fileId: string, warning: QualityWarning): Promise<void> {
    const metadata = this.metadata.get(fileId);
    if (!metadata) {
      throw new Error(`Metadata not found for ${fileId}`);
    }

    const updatedMetadata: TranslationMetadata = {
      ...metadata,
      qualityWarnings: [...(metadata.qualityWarnings || []), warning]
    };

    this.metadata.set(fileId, updatedMetadata);
    await this.saveMetadataToStorage();
    
    console.log(`⚠️ Added quality warning to ${fileId}:`, warning);
  }

  /**
   * Get translation statistics
   */
  getTranslationStats(): TranslationStats {
    const allMetadata = Array.from(this.metadata.values());
    
    // Debug logging
    console.log(`📊 Getting translation stats for ${allMetadata.length} items:`);
    allMetadata.forEach(metadata => {
      const language = this.extractLanguageFromFileId(metadata.fileId);
      console.log(`  - ${metadata.fileId} (${language || 'unknown'}) - ${metadata.reviewStatus}`);
    });
    
    const stats: TranslationStats = {
      totalTranslations: allMetadata.length,
      reviewedTranslations: allMetadata.filter(m => m.reviewStatus === 'reviewed').length,
      pendingReviews: allMetadata.filter(m => m.reviewStatus === 'unreviewed').length,
      flaggedTranslations: allMetadata.filter(m => m.reviewStatus === 'flagged').length,
      averageConfidence: this.calculateAverageConfidence(allMetadata),
      translationsByLanguage: this.getTranslationsByLanguage(allMetadata),
      qualityWarningsByType: this.getQualityWarningsByType(allMetadata)
    };

    return stats;
  }

  /**
   * Get translations by priority (high priority = low confidence or has warnings)
   */
  getTranslationsByPriority(): TranslationMetadata[] {
    const allMetadata = Array.from(this.metadata.values());
    
    return allMetadata.sort((a, b) => {
      // Calculate priority score (higher = more urgent)
      const scoreA = this.calculatePriorityScore(a);
      const scoreB = this.calculatePriorityScore(b);
      
      return scoreB - scoreA; // Descending order
    });
  }

  /**
   * Get admin to-do items based on translation metadata
   */
  getAdminTodoItems(): Array<{
    id: string;
    type: 'review' | 'warning' | 'error';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    metadata: TranslationMetadata;
  }> {
    const todos: any[] = [];
    
    // Low confidence translations
    this.getLowConfidenceTranslations(70).forEach(metadata => {
      todos.push({
        id: `review_${metadata.fileId}`,
        type: 'review',
        priority: metadata.confidence! < 50 ? 'high' : 'medium',
        title: `Review low confidence translation`,
        description: `${metadata.fileId} has ${metadata.confidence}% confidence`,
        metadata
      });
    });

    // Translations with quality warnings
    this.getTranslationsWithWarnings().forEach(metadata => {
      const highSeverityWarnings = metadata.qualityWarnings.filter(w => w.severity === 'high');
      
      todos.push({
        id: `warning_${metadata.fileId}`,
        type: 'warning',
        priority: highSeverityWarnings.length > 0 ? 'high' : 'medium',
        title: `Review quality warnings`,
        description: `${metadata.fileId} has ${metadata.qualityWarnings.length} quality warnings`,
        metadata
      });
    });

    // Translation errors
    this.getAllMetadata({ publishingStatus: 'error' }).forEach(metadata => {
      todos.push({
        id: `error_${metadata.fileId}`,
        type: 'error',
        priority: 'high',
        title: `Fix translation error`,
        description: `${metadata.fileId} failed to translate`,
        metadata
      });
    });

    return todos.sort((a, b) => {
      const priorityOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
    });
  }

  /**
   * Export metadata for backup/analysis
   */
  exportMetadata(): string {
    const data = {
      exportedAt: new Date().toISOString(),
      metadata: Array.from(this.metadata.entries()),
      stats: this.getTranslationStats()
    };
    
    return JSON.stringify(data, null, 2);
  }

  /**
   * Import metadata from backup
   */
  async importMetadata(exportedData: string): Promise<void> {
    try {
      const data = JSON.parse(exportedData);
      
      if (data.metadata && Array.isArray(data.metadata)) {
        this.metadata.clear();
        
        data.metadata.forEach(([fileId, metadata]: [string, TranslationMetadata]) => {
          this.metadata.set(fileId, metadata);
        });
        
        await this.saveMetadataToStorage();
        console.log(`✅ Imported ${data.metadata.length} metadata entries`);
      }
    } catch (error) {
      console.error('Failed to import metadata:', error);
      throw new Error('Invalid metadata format');
    }
  }

  /**
   * Manually trigger discovery of existing translations
   */
  async refreshTranslationRegistry(): Promise<void> {
    console.log('🔍 Refreshing translation registry...');
    console.log(`📦 Current metadata count: ${this.metadata.size}`);
    await this.discoverExistingTranslations();
  }

  /**
   * Debug method to show current localStorage state
   */
  debugMetadataState(): void {
    console.log('🔍 Current Translation Metadata State:');
    console.log(`Total items in memory: ${this.metadata.size}`);
    
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        console.log(`Items in localStorage: ${data.length}`);
        data.forEach(([fileId, metadata]: [string, any]) => {
          console.log(`  - ${fileId} (status: ${metadata.reviewStatus})`);
        });
      } catch (error) {
        console.error('Failed to parse stored metadata:', error);
      }
    } else {
      console.log('No data in localStorage');
    }
  }

  /**
   * Clear all metadata (use with caution)
   */
  async clearAllMetadata(): Promise<void> {
    this.metadata.clear();
    await this.saveMetadataToStorage();
    console.log('🗑️ Cleared all translation metadata');
  }

  // Private helper methods

  /**
   * Scan for existing translation files and register them if not already tracked
   */
  private async discoverExistingTranslations(): Promise<void> {
    try {
      console.log('🔍 Starting translation discovery scan...');
      
      // Try to discover translation files by attempting to fetch them
      // We'll scan for common translation patterns
      const possibleTranslations = [
        'bedroom_environment_2023_article_de.json',
        'bedroom_environment_2023_article_fr.json',
        'bedroom_environment_2023_article_es.json',
        // Add more known translation files as they're created
      ];

      for (const filename of possibleTranslations) {
        const fileId = filename.replace('.json', '');
        
        // Skip if already tracked
        if (this.metadata.has(fileId)) {
          continue;
        }

        try {
          // Try to fetch the translation file
          console.log(`🔍 Checking for translation file: /data/research-articles/${filename}`);
          const response = await fetch(`/data/research-articles/${filename}`);
          if (response.ok) {
            await response.json();
            
            // Create metadata for discovered translation
            const metadata: TranslationMetadata = {
              fileId,
              sourceFile: `${this.extractOriginalFileId(fileId)}.json`,
              targetFile: filename,
              translatedBy: 'claude',
              translatedAt: new Date().toISOString(),
              reviewStatus: 'unreviewed',
              publishingStatus: 'live',
              confidence: 85, // Default confidence for discovered files
              qualityWarnings: []
            };

            console.log(`🔍 Discovered existing translation: ${fileId}`);
            this.metadata.set(fileId, metadata);
          }
        } catch (error) {
          // File doesn't exist or can't be loaded, skip
          console.log(`❌ Failed to load ${filename}: ${error}`);
          continue;
        }
      }

      // Save discovered translations
      const discoveredCount = this.metadata.size;
      if (discoveredCount > 0) {
        await this.saveMetadataToStorage();
        console.log(`✅ Registered ${discoveredCount} translation files`);
        
        // Log all discovered translations
        this.metadata.forEach((metadata, fileId) => {
          console.log(`📝 Registered translation: ${fileId} (${metadata.sourceFile} → ${metadata.targetFile})`);
        });
      } else {
        console.log('🔍 No new translations discovered');
      }
    } catch (error) {
      console.warn('Failed to discover existing translations:', error);
    }
  }

  /**
   * Extract original file ID from translated file ID
   */
  private extractOriginalFileId(translatedFileId: string): string {
    // Remove language suffix (e.g., "_de", "_fr")
    return translatedFileId.replace(/_[a-z]{2}$/, '');
  }

  /**
   * Estimate word count from content
   */
  private estimateWordCount(content: string): number {
    if (!content) return 0;
    
    // Remove markdown syntax and count words
    const cleanText = content
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`([^`]+)`/g, '$1'); // Remove inline code
    
    return cleanText.split(/\s+/).filter(word => word.length > 0).length;
  }

  private calculatePriorityScore(metadata: TranslationMetadata): number {
    let score = 0;
    
    // Lower confidence = higher priority
    if (metadata.confidence !== undefined) {
      score += (100 - metadata.confidence);
    }
    
    // Quality warnings increase priority
    if (metadata.qualityWarnings) {
      score += metadata.qualityWarnings.length * 10;
      
      // High severity warnings are more urgent
      const highSeverityCount = metadata.qualityWarnings.filter(w => w.severity === 'high').length;
      score += highSeverityCount * 20;
    }
    
    // Unreviewed status increases priority
    if (metadata.reviewStatus === 'unreviewed') {
      score += 20;
    }
    
    // Flagged status is highest priority
    if (metadata.reviewStatus === 'flagged') {
      score += 50;
    }
    
    // Publishing errors are urgent
    if (metadata.publishingStatus === 'error') {
      score += 100;
    }
    
    return score;
  }

  private calculateAverageConfidence(metadata: TranslationMetadata[]): number {
    const withConfidence = metadata.filter(m => m.confidence !== undefined);
    if (withConfidence.length === 0) return 0;
    
    const total = withConfidence.reduce((sum, m) => sum + m.confidence!, 0);
    return Math.round(total / withConfidence.length);
  }

  private getTranslationsByLanguage(metadata: TranslationMetadata[]): Record<SupportedLanguage, number> {
    const counts: Record<SupportedLanguage, number> = {
      en: 0,
      de: 0,
      fr: 0,
      es: 0
    };
    
    metadata.forEach(m => {
      const language = this.extractLanguageFromFileId(m.fileId);
      if (language && language in counts) {
        counts[language as SupportedLanguage]++;
      }
    });
    
    return counts;
  }

  private getQualityWarningsByType(metadata: TranslationMetadata[]): Record<string, number> {
    const counts: Record<string, number> = {};
    
    metadata.forEach(m => {
      if (m.qualityWarnings) {
        m.qualityWarnings.forEach(warning => {
          counts[warning.type] = (counts[warning.type] || 0) + 1;
        });
      }
    });
    
    return counts;
  }

  private extractLanguageFromFileId(fileId: string): string | null {
    const match = fileId.match(/_([a-z]{2})$/);
    return match ? match[1] : null;
  }

  private getContentTypeFromFileId(fileId: string): 'habit' | 'research' | 'ui' | null {
    if (fileId.startsWith('habit_')) return 'habit';
    if (fileId.startsWith('research_')) return 'research';
    if (fileId.startsWith('ui_')) return 'ui';
    return null;
  }

  private async loadMetadataFromStorage(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        if (Array.isArray(data)) {
          this.metadata.clear();
          data.forEach(([fileId, metadata]: [string, TranslationMetadata]) => {
            this.metadata.set(fileId, metadata);
          });
          console.log(`📚 Loaded ${this.metadata.size} translation metadata entries`);
        }
      }
    } catch (error) {
      console.warn('Failed to load translation metadata from storage:', error);
    }
  }

  private async saveMetadataToStorage(): Promise<void> {
    try {
      const data = Array.from(this.metadata.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save translation metadata to storage:', error);
    }
  }
}

// Create singleton instance
export const translationMetadataService = new TranslationMetadataService();