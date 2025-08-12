/**
 * Content Manager Service
 * 
 * Replaces static JSON imports with dynamic CMS content loading.
 * Handles content caching, validation, and multi-language support.
 */

import { 
  CMSHabit, 
  CMSResearchStudy, 
  LocalizedContent, 
  UntranslatedItem,
  TranslationWarning,
  APIResponse,
  ContentFilter,
  SearchResult
} from '../../types/cms';
import { Habit, ResearchStudy } from '../../types';
import { AdminAuthService } from './AdminAuthService';

// Static imports for fallback/development
import habitsData from '../../data/habits.json';
import researchData from '../../data/research_articles.json';

export class ContentManager {
  private dbName = 'sciencehabits-cms-cache';
  private version = 1;
  private db: IDBDatabase | null = null;
  private adminAuth: AdminAuthService;
  private cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  private currentLanguage = 'en';

  constructor(adminAuth?: AdminAuthService) {
    this.adminAuth = adminAuth || new AdminAuthService();
    this.initializeDB();
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // CMS content cache
        if (!db.objectStoreNames.contains('cms_habits')) {
          const habitsStore = db.createObjectStore('cms_habits', { keyPath: 'id' });
          habitsStore.createIndex('status', 'status', { unique: false });
          habitsStore.createIndex('category', 'category', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('cms_research')) {
          const researchStore = db.createObjectStore('cms_research', { keyPath: 'id' });
          researchStore.createIndex('status', 'status', { unique: false });
          researchStore.createIndex('category', 'category', { unique: false });
        }

        // Content metadata
        if (!db.objectStoreNames.contains('content_metadata')) {
          db.createObjectStore('content_metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Load habits from CMS (replaces static JSON import)
   */
  async loadHabitsFromCMS(): Promise<Habit[]> {
    try {
      // Try to load from CMS first
      const cmsHabits = await this.getCachedContent<CMSHabit>('cms_habits');
      
      if (cmsHabits.length > 0 && !this.isCacheExpired('habits')) {
        console.log(`✅ Loaded ${cmsHabits.length} habits from CMS cache`);
        return this.convertCMSHabitsToLegacyFormat(cmsHabits);
      }

      // Fallback to static JSON for development
      console.log('📁 Falling back to static habits.json');
      await this.cacheStaticContent();
      return habitsData as Habit[];
    } catch (error) {
      console.error('Failed to load habits from CMS:', error);
      // Ultimate fallback to static data
      return habitsData as Habit[];
    }
  }

  /**
   * Load research studies from CMS (replaces static JSON import)
   */
  async loadResearchFromCMS(): Promise<ResearchStudy[]> {
    try {
      // Try to load from CMS first
      const cmsResearch = await this.getCachedContent<CMSResearchStudy>('cms_research');
      
      if (cmsResearch.length > 0 && !this.isCacheExpired('research')) {
        console.log(`✅ Loaded ${cmsResearch.length} research studies from CMS cache`);
        return this.convertCMSResearchToLegacyFormat(cmsResearch);
      }

      // Fallback to static JSON for development
      console.log('📁 Falling back to static research_articles.json');
      await this.cacheStaticContent();
      return researchData as ResearchStudy[];
    } catch (error) {
      console.error('Failed to load research from CMS:', error);
      // Ultimate fallback to static data
      return researchData as ResearchStudy[];
    }
  }

  /**
   * Load localized content with translation warnings
   */
  async loadLocalizedContent(language: 'en' | 'de' = 'en'): Promise<LocalizedContent> {
    this.currentLanguage = language;
    
    try {
      const [habits, research] = await Promise.all([
        this.getCachedContent<CMSHabit>('cms_habits'),
        this.getCachedContent<CMSResearchStudy>('cms_research')
      ]);

      const untranslatedContent = this.findUntranslatedContent([...habits, ...research], language);
      
      return {
        habits,
        research,
        untranslatedContent,
        metadata: {
          language,
          version: '1.0.0',
          lastUpdated: new Date(),
          translationCompleteness: this.calculateTranslationCompleteness([...habits, ...research], language)
        }
      };
    } catch (error) {
      console.error('Failed to load localized content:', error);
      // Fallback to English static content
      return this.createFallbackLocalizedContent();
    }
  }

  /**
   * Get translation warnings for current language
   */
  async getUntranslatedWarnings(locale: string): Promise<TranslationWarning[]> {
    const content = await this.loadLocalizedContent(locale as 'en' | 'de');
    
    return content.untranslatedContent.map(item => ({
      contentType: item.contentType,
      contentId: item.contentId,
      missingFields: item.missingFields,
      fallbackUsed: true,
      originalLanguage: 'en'
    }));
  }

  /**
   * Subscribe to real-time CMS updates
   */
  async subscribeToCMSUpdates(): Promise<void> {
    // In production, this would connect to CMS webhooks
    // For development, we'll simulate periodic checks
    setInterval(async () => {
      try {
        await this.checkForContentUpdates();
      } catch (error) {
        console.warn('Failed to check for content updates:', error);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Force sync content updates from CMS
   */
  async syncContentUpdates(): Promise<void> {
    try {
      console.log('🔄 Syncing content updates from CMS...');
      
      // In production, this would fetch from actual CMS API
      // For development, we'll update cache timestamps
      await this.updateCacheMetadata('habits', new Date());
      await this.updateCacheMetadata('research', new Date());
      
      console.log('✅ Content sync completed');
    } catch (error) {
      console.error('Content sync failed:', error);
      throw error;
    }
  }

  /**
   * Search content with filters
   */
  async searchContent<T extends CMSHabit | CMSResearchStudy>(
    contentType: 'habits' | 'research',
    query: string,
    filters?: ContentFilter
  ): Promise<SearchResult<T>> {
    await this.adminAuth.requirePermission(contentType, 'read');

    const storeName = contentType === 'habits' ? 'cms_habits' : 'cms_research';
    const allContent = await this.getCachedContent<T>(storeName);

    // Apply search query
    let filteredContent = allContent;
    if (query) {
      const searchTerm = query.toLowerCase();
      filteredContent = allContent.filter(item => {
        const searchableText = this.extractSearchableText(item);
        return searchableText.toLowerCase().includes(searchTerm);
      });
    }

    // Apply filters
    if (filters) {
      filteredContent = this.applyContentFilters(filteredContent, filters);
    }

    return {
      items: filteredContent,
      total: filteredContent.length,
      facets: this.generateSearchFacets(allContent)
    };
  }

  /**
   * Get content by ID
   */
  async getContentById<T extends CMSHabit | CMSResearchStudy>(
    contentType: 'habits' | 'research',
    id: string
  ): Promise<T | null> {
    const storeName = contentType === 'habits' ? 'cms_habits' : 'cms_research';
    
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  /**
   * Cache static content for development/fallback
   */
  private async cacheStaticContent(): Promise<void> {
    try {
      // Convert legacy format to CMS format and cache
      const cmsHabits = this.convertLegacyHabitsToCMSFormat(habitsData as Habit[]);
      const cmsResearch = this.convertLegacyResearchToCMSFormat(researchData as ResearchStudy[]);

      await Promise.all([
        this.setCachedContent('cms_habits', cmsHabits),
        this.setCachedContent('cms_research', cmsResearch),
        this.updateCacheMetadata('habits', new Date()),
        this.updateCacheMetadata('research', new Date())
      ]);

      console.log('✅ Static content cached successfully');
    } catch (error) {
      console.error('Failed to cache static content:', error);
    }
  }

  private async getCachedContent<T>(storeName: string): Promise<T[]> {
    if (!this.db) return [];

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  }

  private async setCachedContent<T>(storeName: string, content: T[]): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      // Clear existing content
      store.clear();
      
      // Add new content
      content.forEach(item => store.add(item));
      
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  private async updateCacheMetadata(contentType: string, lastUpdated: Date): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['content_metadata'], 'readwrite');
      const store = transaction.objectStore('content_metadata');
      const metadata = {
        key: `${contentType}_metadata`,
        lastUpdated,
        version: '1.0.0'
      };
      
      const request = store.put(metadata);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private isCacheExpired(contentType: string): boolean {
    // For development, always return false to use cached content
    // In production, this would check actual timestamps
    return false;
  }

  private async checkForContentUpdates(): Promise<void> {
    // In production, this would check CMS for updates
    // For development, this is a no-op
    console.log('🔍 Checking for content updates...');
  }

  private convertCMSHabitsToLegacyFormat(cmsHabits: CMSHabit[]): Habit[] {
    return cmsHabits
      .filter(habit => habit.status === 'published')
      .map(habit => ({
        id: habit.id,
        title: this.getLocalizedText(habit.title),
        description: this.getLocalizedText(habit.description),
        instructions: this.getLocalizedText(habit.instructions),
        timeMinutes: habit.timeMinutes,
        category: habit.category,
        goalTags: habit.goalTags,
        researchBacking: habit.researchStudies
      }));
  }

  private convertCMSResearchToLegacyFormat(cmsResearch: CMSResearchStudy[]): ResearchStudy[] {
    return cmsResearch
      .filter(research => research.status === 'published')
      .map(research => ({
        id: research.id,
        title: research.title,
        authors: research.authors,
        year: research.year,
        journal: research.journal,
        citation: research.citation,
        summary: this.getLocalizedText(research.summary),
        finding: this.getLocalizedText(research.finding),
        category: research.category
      }));
  }

  private convertLegacyHabitsToCMSFormat(habits: Habit[]): CMSHabit[] {
    return habits.map(habit => ({
      id: habit.id,
      title: { en: habit.title },
      description: { en: habit.description },
      instructions: { en: habit.instructions },
      timeMinutes: habit.timeMinutes,
      category: habit.category,
      goalTags: habit.goalTags,
      researchStudies: habit.researchBacking || [],
      status: 'published' as const,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      lastModifiedBy: 'system',
      version: 1
    }));
  }

  private convertLegacyResearchToCMSFormat(research: ResearchStudy[]): CMSResearchStudy[] {
    return research.map(study => ({
      id: study.id,
      title: study.title,
      authors: study.authors,
      year: study.year,
      journal: study.journal,
      citation: study.citation,
      summary: { en: study.summary },
      finding: { en: study.finding },
      category: study.category,
      evidenceLevel: 'observational' as const, // Default assumption
      qualityScore: 75, // Default score
      validatedAt: new Date(),
      citationStatus: 'valid' as const,
      relatedStudies: [],
      status: 'published' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      lastModifiedBy: 'system',
      version: 1
    }));
  }

  private getLocalizedText(localizedField: any): string {
    if (typeof localizedField === 'string') {
      return localizedField;
    }
    
    if (localizedField && typeof localizedField === 'object') {
      return localizedField[this.currentLanguage] || localizedField.en || '';
    }
    
    return '';
  }

  private findUntranslatedContent(content: any[], language: string): UntranslatedItem[] {
    if (language === 'en') return []; // English is the base language
    
    const untranslated: UntranslatedItem[] = [];
    
    content.forEach(item => {
      const missingFields: string[] = [];
      
      // Check each localizable field
      ['title', 'description', 'instructions', 'summary', 'finding'].forEach(field => {
        const fieldValue = item[field];
        if (fieldValue && typeof fieldValue === 'object' && !fieldValue[language]) {
          missingFields.push(field);
        }
      });
      
      if (missingFields.length > 0) {
        untranslated.push({
          contentType: 'title' in item ? 'habit' : 'research',
          contentId: item.id,
          title: this.getLocalizedText(item.title),
          missingFields,
          priority: missingFields.length > 2 ? 'high' : 'medium'
        });
      }
    });
    
    return untranslated;
  }

  private calculateTranslationCompleteness(content: any[], language: string): number {
    if (language === 'en') return 100;
    
    const untranslated = this.findUntranslatedContent(content, language);
    const totalItems = content.length;
    const translatedItems = totalItems - untranslated.length;
    
    return totalItems > 0 ? Math.round((translatedItems / totalItems) * 100) : 100;
  }

  private createFallbackLocalizedContent(): LocalizedContent {
    const cmsHabits = this.convertLegacyHabitsToCMSFormat(habitsData as Habit[]);
    const cmsResearch = this.convertLegacyResearchToCMSFormat(researchData as ResearchStudy[]);
    
    return {
      habits: cmsHabits,
      research: cmsResearch,
      untranslatedContent: [],
      metadata: {
        language: 'en',
        version: '1.0.0',
        lastUpdated: new Date(),
        translationCompleteness: 100
      }
    };
  }

  private extractSearchableText(item: any): string {
    const fields = ['title', 'description', 'instructions', 'summary', 'finding', 'authors'];
    return fields
      .map(field => this.getLocalizedText(item[field]) || item[field] || '')
      .join(' ');
  }

  private applyContentFilters<T>(content: T[], filters: ContentFilter): T[] {
    return content.filter(item => {
      // Status filter
      if (filters.status && !filters.status.includes((item as any).status)) {
        return false;
      }
      
      // Category filter
      if (filters.category && !filters.category.includes((item as any).category)) {
        return false;
      }
      
      // Date range filter
      if (filters.dateRange) {
        const itemDate = new Date((item as any).createdAt);
        if (itemDate < filters.dateRange.start || itemDate > filters.dateRange.end) {
          return false;
        }
      }
      
      return true;
    });
  }

  private generateSearchFacets<T>(content: T[]): any {
    const categories = new Map<string, number>();
    const statuses = new Map<string, number>();
    const authors = new Map<string, number>();
    
    content.forEach(item => {
      // Count categories
      const category = (item as any).category;
      if (category) {
        categories.set(category, (categories.get(category) || 0) + 1);
      }
      
      // Count statuses
      const status = (item as any).status;
      if (status) {
        statuses.set(status, (statuses.get(status) || 0) + 1);
      }
      
      // Count authors (for research)
      const authors_field = (item as any).authors;
      if (authors_field) {
        authors.set(authors_field, (authors.get(authors_field) || 0) + 1);
      }
    });
    
    return {
      categories: Array.from(categories.entries()).map(([name, count]) => ({ name, count })),
      statuses: Array.from(statuses.entries()).map(([name, count]) => ({ name, count })),
      authors: Array.from(authors.entries()).map(([name, count]) => ({ name, count }))
    };
  }
}