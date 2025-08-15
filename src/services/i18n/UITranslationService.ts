import { SupportedLanguage, UITranslations } from '../../types/i18n';

export class UITranslationService {
  private translations: Record<SupportedLanguage, UITranslations> = {
    en: {},
    de: {},
    fr: {},
    es: {}
  };
  
  private currentLanguage: SupportedLanguage = 'en';
  private fallbackLanguage: SupportedLanguage = 'en';
  private loadedLanguages: Set<SupportedLanguage> = new Set();

  /**
   * Load UI translations for all components
   */
  async loadUITranslations(): Promise<void> {
    try {
      const supportedLanguages: SupportedLanguage[] = ['en', 'de', 'fr', 'es'];
      
      const loadPromises = supportedLanguages.map(async (language) => {
        try {
          const translations = await this.loadLanguageTranslations(language);
          this.translations[language] = translations;
          this.loadedLanguages.add(language);
          console.log(`✅ Loaded UI translations for ${language}`);
        } catch (error) {
          console.warn(`Failed to load UI translations for ${language}:`, error);
          // Don't throw - allow other languages to load
        }
      });

      await Promise.allSettled(loadPromises);
      
      console.log(`Loaded UI translations for languages: ${Array.from(this.loadedLanguages).join(', ')}`);
    } catch (error) {
      console.error('Failed to load UI translations:', error);
      throw error;
    }
  }

  /**
   * Load translations for a specific language
   */
  private async loadLanguageTranslations(language: SupportedLanguage): Promise<UITranslations> {
    try {
      const response = await fetch(`/src/data/locales/${language}.json`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const translations = await response.json();
      return translations;
    } catch (error) {
      console.warn(`Failed to load ${language} translations:`, error);
      
      // If it's not English, try to return empty object
      if (language !== 'en') {
        return {};
      }
      
      // If English fails, throw error as it's critical
      throw new Error(`Failed to load critical English translations: ${error}`);
    }
  }

  /**
   * Set current language
   */
  setCurrentLanguage(language: SupportedLanguage): void {
    this.currentLanguage = language;
    
    // Load translations if not already loaded
    if (!this.loadedLanguages.has(language)) {
      this.loadLanguageTranslations(language)
        .then(translations => {
          this.translations[language] = translations;
          this.loadedLanguages.add(language);
        })
        .catch(error => {
          console.warn(`Failed to load translations for ${language}:`, error);
        });
    }
  }

  /**
   * Get current language
   */
  getCurrentLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /**
   * Get translated text with fallback and interpolation
   */
  t(key: string, params?: Record<string, any>, language?: SupportedLanguage): string {
    const targetLanguage = language || this.currentLanguage;
    
    try {
      // Get translation from target language
      let translation = this.getTranslationByKey(key, targetLanguage);
      
      // Fallback to English if not found
      if (!translation && targetLanguage !== this.fallbackLanguage) {
        translation = this.getTranslationByKey(key, this.fallbackLanguage);
        
        if (translation) {
          console.warn(`Using fallback translation for key: ${key} in ${targetLanguage}`);
        }
      }
      
      // Final fallback to key itself
      if (!translation) {
        console.warn(`Translation not found for key: ${key}`);
        return key;
      }
      
      // Handle interpolation
      if (params) {
        return this.interpolateTranslation(translation, params);
      }
      
      return translation;
    } catch (error) {
      console.error(`Error getting translation for key ${key}:`, error);
      return key;
    }
  }

  /**
   * Get translation by key with nested object support
   */
  private getTranslationByKey(key: string, language: SupportedLanguage): string | null {
    const translations = this.translations[language];
    
    if (!translations) {
      return null;
    }
    
    // Support nested keys like "navigation.today"
    const keys = key.split('.');
    let value: any = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }
    
    return typeof value === 'string' ? value : null;
  }

  /**
   * Interpolate parameters in translation strings
   */
  private interpolateTranslation(translation: string, params: Record<string, any>): string {
    return translation.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      if (key in params) {
        return String(params[key]);
      }
      console.warn(`Missing interpolation parameter: ${key}`);
      return match;
    });
  }

  /**
   * Format numbers according to language locale
   */
  formatNumber(value: number, language?: SupportedLanguage): string {
    const targetLanguage = language || this.currentLanguage;
    
    try {
      const formatter = new Intl.NumberFormat(this.getLocaleCode(targetLanguage));
      return formatter.format(value);
    } catch (error) {
      console.warn(`Failed to format number for ${targetLanguage}:`, error);
      return String(value);
    }
  }

  /**
   * Format dates according to language locale
   */
  formatDate(date: Date, language?: SupportedLanguage, options?: Intl.DateTimeFormatOptions): string {
    const targetLanguage = language || this.currentLanguage;
    
    try {
      const defaultOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      
      const formatter = new Intl.DateTimeFormat(
        this.getLocaleCode(targetLanguage),
        options || defaultOptions
      );
      
      return formatter.format(date);
    } catch (error) {
      console.warn(`Failed to format date for ${targetLanguage}:`, error);
      return date.toLocaleDateString();
    }
  }

  /**
   * Format relative time (e.g., "2 days ago", "in 3 hours")
   */
  formatRelativeTime(date: Date, language?: SupportedLanguage): string {
    const targetLanguage = language || this.currentLanguage;
    
    try {
      const now = new Date();
      const diffMs = date.getTime() - now.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      
      // Use Intl.RelativeTimeFormat if available
      if ('RelativeTimeFormat' in Intl) {
        const formatter = new Intl.RelativeTimeFormat(this.getLocaleCode(targetLanguage), {
          numeric: 'auto'
        });
        
        if (Math.abs(diffDays) >= 1) {
          return formatter.format(diffDays, 'day');
        } else if (Math.abs(diffHours) >= 1) {
          return formatter.format(diffHours, 'hour');
        } else {
          return formatter.format(diffMinutes, 'minute');
        }
      }
      
      // Fallback to manual formatting
      return this.manualRelativeTimeFormat(diffDays, diffHours, diffMinutes, targetLanguage);
    } catch (error) {
      console.warn(`Failed to format relative time for ${targetLanguage}:`, error);
      return date.toLocaleDateString();
    }
  }

  /**
   * Manual relative time formatting fallback
   */
  private manualRelativeTimeFormat(
    diffDays: number, 
    diffHours: number, 
    diffMinutes: number, 
    language: SupportedLanguage
  ): string {
    const absMinutes = Math.abs(diffMinutes);
    const absHours = Math.abs(diffHours);
    const absDays = Math.abs(diffDays);
    
    // Get appropriate translation keys based on language
    if (absDays >= 1) {
      const key = diffDays > 0 ? 'time.inDays' : 'time.daysAgo';
      return this.t(key, { count: absDays }, language);
    } else if (absHours >= 1) {
      const key = diffHours > 0 ? 'time.inHours' : 'time.hoursAgo';
      return this.t(key, { count: absHours }, language);
    } else {
      const key = diffMinutes > 0 ? 'time.inMinutes' : 'time.minutesAgo';
      return this.t(key, { count: absMinutes }, language);
    }
  }

  /**
   * Handle pluralization rules for different languages
   */
  plural(count: number, key: string, language?: SupportedLanguage): string {
    const targetLanguage = language || this.currentLanguage;
    
    try {
      // Try plural key first (e.g., "habits.count.plural")
      const pluralKey = `${key}.${this.getPluralForm(count, targetLanguage)}`;
      const pluralTranslation = this.getTranslationByKey(pluralKey, targetLanguage);
      
      if (pluralTranslation) {
        return this.interpolateTranslation(pluralTranslation, { count });
      }
      
      // Fallback to simple key with count interpolation
      const baseTranslation = this.t(key, { count }, targetLanguage);
      return baseTranslation;
    } catch (error) {
      console.warn(`Failed to get plural for ${key}:`, error);
      return this.t(key, { count }, targetLanguage);
    }
  }

  /**
   * Get plural form based on language rules
   */
  private getPluralForm(count: number, language: SupportedLanguage): string {
    switch (language) {
      case 'en':
        return count === 1 ? 'singular' : 'plural';
      
      case 'de':
        return count === 1 ? 'singular' : 'plural';
      
      case 'fr':
        return count <= 1 ? 'singular' : 'plural';
      
      case 'es':
        return count === 1 ? 'singular' : 'plural';
      
      default:
        return count === 1 ? 'singular' : 'plural';
    }
  }

  /**
   * Get locale code for Intl formatting
   */
  private getLocaleCode(language: SupportedLanguage): string {
    const locales = {
      en: 'en-US',
      de: 'de-DE',
      fr: 'fr-FR',
      es: 'es-ES'
    };
    
    return locales[language] || 'en-US';
  }

  /**
   * Get missing translation keys for admin review
   */
  getMissingTranslations(language: SupportedLanguage): string[] {
    const missing: string[] = [];
    const englishTranslations = this.translations.en;
    const targetTranslations = this.translations[language];
    
    if (!targetTranslations || !englishTranslations) {
      return missing;
    }
    
    this.findMissingKeys('', englishTranslations, targetTranslations, missing);
    
    return missing;
  }

  /**
   * Recursively find missing translation keys
   */
  private findMissingKeys(
    prefix: string, 
    source: UITranslations, 
    target: UITranslations, 
    missing: string[]
  ): void {
    Object.keys(source).forEach(key => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const sourceValue = source[key];
      const targetValue = target[key];
      
      if (typeof sourceValue === 'string') {
        if (!targetValue || typeof targetValue !== 'string') {
          missing.push(fullKey);
        }
      } else if (typeof sourceValue === 'object' && sourceValue !== null) {
        if (!targetValue || typeof targetValue !== 'object') {
          missing.push(fullKey);
        } else {
          this.findMissingKeys(fullKey, sourceValue, targetValue, missing);
        }
      }
    });
  }

  /**
   * Get translation completeness percentage
   */
  getCompleteness(language: SupportedLanguage): number {
    if (language === 'en') return 100;
    
    const missing = this.getMissingTranslations(language);
    const total = this.countTranslationKeys(this.translations.en);
    
    if (total === 0) return 0;
    
    return Math.round(((total - missing.length) / total) * 100);
  }

  /**
   * Count total translation keys
   */
  private countTranslationKeys(translations: UITranslations): number {
    let count = 0;
    
    Object.values(translations).forEach(value => {
      if (typeof value === 'string') {
        count++;
      } else if (typeof value === 'object' && value !== null) {
        count += this.countTranslationKeys(value);
      }
    });
    
    return count;
  }

  /**
   * Check if translations are loaded for a language
   */
  isLanguageLoaded(language: SupportedLanguage): boolean {
    return this.loadedLanguages.has(language);
  }

  /**
   * Get all loaded languages
   */
  getLoadedLanguages(): SupportedLanguage[] {
    return Array.from(this.loadedLanguages);
  }

  /**
   * Clear cached translations
   */
  clearCache(): void {
    this.translations = {
      en: {},
      de: {},
      fr: {},
      es: {}
    };
    this.loadedLanguages.clear();
  }
}

// Create singleton instance
export const uiTranslationService = new UITranslationService();