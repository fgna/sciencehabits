/**
 * I18n Content Loader
 * 
 * Handles multi-language content loading with translation warnings
 * and fallback mechanisms. Supports manual translation workflow.
 */

import {
  LocalizedContent,
  LocalizedField,
  UntranslatedItem,
  TranslationWarning,
  CMSHabit,
  CMSResearchStudy
} from '../../types/cms';
import { ContentManager } from './ContentManager';

export class I18nContentLoader {
  private contentManager: ContentManager;
  private supportedLanguages = ['en', 'de'];
  private defaultLanguage = 'en';
  
  constructor(contentManager: ContentManager) {
    this.contentManager = contentManager;
  }

  /**
   * Load content for specific locale with fallbacks
   */
  async loadContent(locale: 'en' | 'de' = 'en'): Promise<LocalizedContent> {
    try {
      // Validate locale
      if (!this.supportedLanguages.includes(locale)) {
        console.warn(`Unsupported locale: ${locale}, falling back to ${this.defaultLanguage}`);
        locale = this.defaultLanguage as 'en' | 'de';
      }

      console.log(`🌍 Loading content for locale: ${locale}`);

      // Load raw CMS content
      const [rawHabits, rawResearch] = await Promise.all([
        this.contentManager.getCachedContent<CMSHabit>('cms_habits'),
        this.contentManager.getCachedContent<CMSResearchStudy>('cms_research')
      ]);

      // Process localization for each content type
      const processedHabits = this.processHabitsLocalization(rawHabits, locale);
      const processedResearch = this.processResearchLocalization(rawResearch, locale);

      // Find untranslated content
      const untranslatedContent = this.findUntranslatedContent(
        [...processedHabits, ...processedResearch], 
        locale
      );

      // Calculate translation completeness
      const translationCompleteness = this.calculateTranslationCompleteness(
        [...processedHabits, ...processedResearch], 
        locale
      );

      const result: LocalizedContent = {
        habits: processedHabits,
        research: processedResearch,
        untranslatedContent,
        metadata: {
          language: locale,
          version: '1.0.0',
          lastUpdated: new Date(),
          translationCompleteness
        }
      };

      // Log translation statistics
      this.logTranslationStats(result, locale);

      return result;
    } catch (error) {
      console.error('Failed to load localized content:', error);
      return this.createEmptyLocalizedContent(locale);
    }
  }

  /**
   * Detect user's preferred language
   */
  async detectUserLanguage(): Promise<string> {
    // Check browser language preferences
    const browserLanguages = navigator.languages || [navigator.language];
    
    for (const browserLang of browserLanguages) {
      const normalizedLang = browserLang.substring(0, 2).toLowerCase();
      if (this.supportedLanguages.includes(normalizedLang)) {
        console.log(`🔍 Detected user language: ${normalizedLang} (from browser: ${browserLang})`);
        return normalizedLang;
      }
    }

    // Check saved preference from localStorage
    const savedLang = localStorage.getItem('sciencehabits-language');
    if (savedLang && this.supportedLanguages.includes(savedLang)) {
      console.log(`🔍 Using saved language preference: ${savedLang}`);
      return savedLang;
    }

    console.log(`🔍 No supported language detected, using default: ${this.defaultLanguage}`);
    return this.defaultLanguage;
  }

  /**
   * Get warnings for untranslated content
   */
  async getUntranslatedWarnings(locale: string): Promise<TranslationWarning[]> {
    if (locale === this.defaultLanguage) {
      return []; // No warnings for default language
    }

    const content = await this.loadContent(locale as 'en' | 'de');
    
    return content.untranslatedContent.map(item => ({
      contentType: item.contentType,
      contentId: item.contentId,
      missingFields: item.missingFields,
      fallbackUsed: true,
      originalLanguage: this.defaultLanguage
    }));
  }

  /**
   * Check if field has translation
   */
  hasTranslation(field: LocalizedField<any>, locale: string): boolean {
    if (!field || typeof field !== 'object') return false;
    return field[locale as keyof LocalizedField<any>] !== undefined;
  }

  /**
   * Get localized text with fallback
   */
  getLocalizedText<T>(field: LocalizedField<T>, locale: string, markFallback = false): T & { _fallbackUsed?: boolean } {
    if (!field || typeof field !== 'object') {
      return field as T & { _fallbackUsed?: boolean };
    }

    // Try requested locale
    if (field[locale as keyof LocalizedField<T>] !== undefined) {
      return field[locale as keyof LocalizedField<T>] as T & { _fallbackUsed?: boolean };
    }

    // Fallback to default language
    const fallbackValue = field[this.defaultLanguage as keyof LocalizedField<T>];
    
    if (markFallback && fallbackValue && typeof fallbackValue === 'object' && fallbackValue !== null) {
      return {
        ...(fallbackValue as any),
        _fallbackUsed: true
      } as T & { _fallbackUsed?: boolean };
    }

    return fallbackValue as T & { _fallbackUsed?: boolean };
  }

  /**
   * Save user's language preference
   */
  saveLanguagePreference(locale: string): void {
    if (this.supportedLanguages.includes(locale)) {
      localStorage.setItem('sciencehabits-language', locale);
      console.log(`💾 Saved language preference: ${locale}`);
    }
  }

  /**
   * Get available languages with completion stats
   */
  async getAvailableLanguages(): Promise<Array<{
    code: string;
    name: string;
    nativeName: string;
    completeness: number;
    isDefault: boolean;
  }>> {
    const languages = [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        completeness: 100,
        isDefault: true
      },
      {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        completeness: 0, // Will be calculated
        isDefault: false
      }
    ];

    // Calculate completion for non-default languages
    for (const lang of languages) {
      if (!lang.isDefault) {
        const content = await this.loadContent(lang.code as 'en' | 'de');
        lang.completeness = content.metadata.translationCompleteness;
      }
    }

    return languages;
  }

  /**
   * Get translation statistics for admin dashboard
   */
  async getTranslationStatistics(): Promise<{
    totalContent: number;
    translatedContent: { [locale: string]: number };
    untranslatedByType: { [type: string]: { [locale: string]: number } };
    priorityUntranslated: UntranslatedItem[];
  }> {
    const stats = {
      totalContent: 0,
      translatedContent: {} as { [locale: string]: number },
      untranslatedByType: {} as { [type: string]: { [locale: string]: number } },
      priorityUntranslated: [] as UntranslatedItem[]
    };

    for (const locale of this.supportedLanguages) {
      if (locale === this.defaultLanguage) continue;

      const content = await this.loadContent(locale as 'en' | 'de');
      const totalItems = content.habits.length + content.research.length;
      const untranslatedItems = content.untranslatedContent.length;
      
      stats.totalContent = totalItems;
      stats.translatedContent[locale] = totalItems - untranslatedItems;

      // Group by content type
      const habitsMissing = content.untranslatedContent.filter(item => item.contentType === 'habit').length;
      const researchMissing = content.untranslatedContent.filter(item => item.contentType === 'research').length;

      stats.untranslatedByType['habits'] = stats.untranslatedByType['habits'] || {};
      stats.untranslatedByType['research'] = stats.untranslatedByType['research'] || {};
      
      stats.untranslatedByType['habits'][locale] = habitsMissing;
      stats.untranslatedByType['research'][locale] = researchMissing;

      // Collect high-priority untranslated items
      const priorityItems = content.untranslatedContent.filter(item => item.priority === 'high');
      stats.priorityUntranslated.push(...priorityItems);
    }

    return stats;
  }

  // Private helper methods

  private processHabitsLocalization(habits: CMSHabit[], locale: string): CMSHabit[] {
    return habits.map(habit => ({
      ...habit,
      title: this.processLocalizedField(habit.title, locale),
      description: this.processLocalizedField(habit.description, locale),
      instructions: this.processLocalizedField(habit.instructions, locale)
    }));
  }

  private processResearchLocalization(research: CMSResearchStudy[], locale: string): CMSResearchStudy[] {
    return research.map(study => ({
      ...study,
      summary: this.processLocalizedField(study.summary, locale),
      finding: this.processLocalizedField(study.finding, locale)
    }));
  }

  private processLocalizedField<T>(field: LocalizedField<T>, locale: string): LocalizedField<T> {
    if (!field || typeof field !== 'object') {
      return field;
    }

    // Mark fallback usage if translation is missing
    const result = { ...field };
    if (!field[locale as keyof LocalizedField<T>] && field[this.defaultLanguage as keyof LocalizedField<T>]) {
      result.fallbackUsed = true;
    }

    return result;
  }

  private findUntranslatedContent(content: (CMSHabit | CMSResearchStudy)[], locale: string): UntranslatedItem[] {
    if (locale === this.defaultLanguage) {
      return []; // No untranslated content for default language
    }

    const untranslated: UntranslatedItem[] = [];

    content.forEach(item => {
      const missingFields: string[] = [];
      
      // Check localizable fields
      const localizableFields = this.getLocalizableFields(item);
      
      localizableFields.forEach(fieldName => {
        const field = (item as any)[fieldName];
        if (field && typeof field === 'object' && !field[locale]) {
          missingFields.push(fieldName);
        }
      });

      if (missingFields.length > 0) {
        untranslated.push({
          contentType: 'title' in item ? 'habit' : 'research',
          contentId: item.id,
          title: this.getLocalizedText(
            'title' in item ? item.title : { en: (item as any).title } as LocalizedField<string>, 
            locale
          ),
          missingFields,
          priority: this.calculateTranslationPriority(item, missingFields)
        });
      }
    });

    return untranslated;
  }

  private getLocalizableFields(item: CMSHabit | CMSResearchStudy): string[] {
    if ('title' in item && typeof item.title === 'object') {
      // This is a habit
      return ['title', 'description', 'instructions'];
    } else {
      // This is research
      return ['summary', 'finding'];
    }
  }

  private calculateTranslationPriority(item: CMSHabit | CMSResearchStudy, missingFields: string[]): 'high' | 'medium' | 'low' {
    // High priority: missing title or description
    if (missingFields.includes('title') || missingFields.includes('description')) {
      return 'high';
    }
    
    // Medium priority: missing multiple fields
    if (missingFields.length > 2) {
      return 'medium';
    }
    
    return 'low';
  }

  private calculateTranslationCompleteness(content: (CMSHabit | CMSResearchStudy)[], locale: string): number {
    if (locale === this.defaultLanguage) {
      return 100;
    }

    if (content.length === 0) {
      return 100;
    }

    let totalFields = 0;
    let translatedFields = 0;

    content.forEach(item => {
      const localizableFields = this.getLocalizableFields(item);
      totalFields += localizableFields.length;

      localizableFields.forEach(fieldName => {
        const field = (item as any)[fieldName];
        if (field && typeof field === 'object' && field[locale]) {
          translatedFields++;
        }
      });
    });

    return totalFields > 0 ? Math.round((translatedFields / totalFields) * 100) : 100;
  }

  private logTranslationStats(content: LocalizedContent, locale: string): void {
    const totalItems = content.habits.length + content.research.length;
    const untranslatedItems = content.untranslatedContent.length;
    
    console.log(`🌍 Translation stats for ${locale}:`, {
      totalItems,
      translatedItems: totalItems - untranslatedItems,
      untranslatedItems,
      completeness: `${content.metadata.translationCompleteness}%`
    });

    if (untranslatedItems > 0 && locale !== this.defaultLanguage) {
      console.warn(`⚠️ ${untranslatedItems} items have missing translations in ${locale}`);
    }
  }

  private createEmptyLocalizedContent(locale: string): LocalizedContent {
    return {
      habits: [],
      research: [],
      untranslatedContent: [],
      metadata: {
        language: locale,
        version: '1.0.0',
        lastUpdated: new Date(),
        translationCompleteness: 0
      }
    };
  }
}