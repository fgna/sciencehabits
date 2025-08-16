/**
 * Multilingual Content Service for ScienceHabits
 * Manages UI localization and habit content in English and German
 */

import { MultilingualHabit, LocalizationLabels, SupportedLanguage } from '../../types/localization';

// Import localization files
import enUILabels from '../../data/localization/en/ui-labels.json';
import enHabitTemplates from '../../data/localization/en/habit-templates.json';
import deUILabels from '../../data/localization/de/ui-labels.json';
import deHabitTemplates from '../../data/localization/de/habit-templates.json';

export class MultilingualContentService {
  private static readonly SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'de'];
  private static readonly DEFAULT_LANGUAGE: SupportedLanguage = 'en';
  
  private static localizationData = {
    en: {
      ui: enUILabels,
      templates: enHabitTemplates
    },
    de: {
      ui: deUILabels,
      templates: deHabitTemplates
    }
  };

  /**
   * Get current user language preference
   */
  static getCurrentLanguage(): SupportedLanguage {
    // Check localStorage first
    const stored = localStorage.getItem('sciencehabits-language');
    if (stored && this.SUPPORTED_LANGUAGES.includes(stored as SupportedLanguage)) {
      return stored as SupportedLanguage;
    }

    // Fall back to browser language
    const browserLang = navigator.language.split('-')[0];
    if (this.SUPPORTED_LANGUAGES.includes(browserLang as SupportedLanguage)) {
      return browserLang as SupportedLanguage;
    }

    return this.DEFAULT_LANGUAGE;
  }

  /**
   * Set user language preference
   */
  static setLanguage(language: SupportedLanguage): void {
    if (!this.SUPPORTED_LANGUAGES.includes(language)) {
      console.warn(`Unsupported language: ${language}. Falling back to ${this.DEFAULT_LANGUAGE}`);
      language = this.DEFAULT_LANGUAGE;
    }

    localStorage.setItem('sciencehabits-language', language);
    
    // Trigger language change event
    window.dispatchEvent(new CustomEvent('languageChanged', { 
      detail: { language, previousLanguage: this.getCurrentLanguage() }
    }));
  }

  /**
   * Get UI labels for current language
   */
  static getUILabels(language?: SupportedLanguage): LocalizationLabels {
    const lang = language || this.getCurrentLanguage();
    return this.localizationData[lang]?.ui || this.localizationData[this.DEFAULT_LANGUAGE].ui;
  }

  /**
   * Get habit template labels for current language
   */
  static getHabitTemplateLabels(language?: SupportedLanguage): LocalizationLabels {
    const lang = language || this.getCurrentLanguage();
    return this.localizationData[lang]?.templates || this.localizationData[this.DEFAULT_LANGUAGE].templates;
  }

  /**
   * Get specific UI label with nested key support
   */
  static getLabel(keyPath: string, language?: SupportedLanguage): string {
    const lang = language || this.getCurrentLanguage();
    const labels = this.getUILabels(lang);
    
    return this.getNestedValue(labels, keyPath) || keyPath;
  }

  /**
   * Get habit template label
   */
  static getTemplateLabel(keyPath: string, language?: SupportedLanguage): string {
    const lang = language || this.getCurrentLanguage();
    const labels = this.getHabitTemplateLabels(lang);
    
    return this.getNestedValue(labels, keyPath) || keyPath;
  }

  /**
   * Get habit content in specified language
   */
  static getHabitContent(habit: MultilingualHabit, language?: SupportedLanguage): any {
    const lang = language || this.getCurrentLanguage();
    
    if (habit.translations && habit.translations[lang]) {
      return habit.translations[lang];
    }
    
    // Fallback to default language
    return habit.translations?.[this.DEFAULT_LANGUAGE] || habit;
  }

  /**
   * Convert imperial measurements to metric for German content
   */
  static convertUnitsForGerman(text: string): string {
    const conversions = {
      // Distance
      '1 mile': '1,6 km',
      '2 miles': '3,2 km', 
      '3 miles': '4,8 km',
      '5 miles': '8 km',
      '10 miles': '16 km',
      
      // Weight
      '1 pound': '0,5 kg',
      '2 pounds': '1 kg',
      '5 pounds': '2,3 kg',
      '10 pounds': '4,5 kg',
      '20 pounds': '9 kg',
      
      // Height/Distance
      '1 foot': '30 cm',
      '2 feet': '60 cm',
      '3 feet': '90 cm',
      '6 feet': '1,8 m',
      
      // Temperature
      '68°F': '20°C',
      '70°F': '21°C',
      '72°F': '22°C',
      '75°F': '24°C',
      
      // Volume
      '8 ounces': '240 ml',
      '16 ounces': '480 ml',
      '1 gallon': '3,8 Liter',
    };

    let converted = text;
    Object.entries(conversions).forEach(([imperial, metric]) => {
      const regex = new RegExp(imperial, 'gi');
      converted = converted.replace(regex, metric);
    });

    return converted;
  }

  /**
   * Format research citations based on language
   */
  static formatResearchCitation(citation: string, language?: SupportedLanguage): string {
    const lang = language || this.getCurrentLanguage();
    
    if (lang === 'de') {
      // Add German research formatting if needed
      return citation;
    }
    
    return citation;
  }

  /**
   * Get all supported languages
   */
  static getSupportedLanguages(): SupportedLanguage[] {
    return [...this.SUPPORTED_LANGUAGES];
  }

  /**
   * Check if language is supported
   */
  static isLanguageSupported(language: string): boolean {
    return this.SUPPORTED_LANGUAGES.includes(language as SupportedLanguage);
  }

  /**
   * Get language display name
   */
  static getLanguageDisplayName(language: SupportedLanguage): string {
    const displayNames = {
      en: 'English',
      de: 'Deutsch'
    };
    
    return displayNames[language] || language;
  }

  /**
   * Helper function to get nested object values using dot notation
   */
  private static getNestedValue(obj: any, keyPath: string): string | undefined {
    return keyPath.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  /**
   * Interpolate variables in localized strings
   */
  static interpolate(template: string, variables: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match;
    });
  }

  /**
   * Get pluralized form based on count and language
   */
  static pluralize(count: number, singular: string, plural?: string, language?: SupportedLanguage): string {
    const lang = language || this.getCurrentLanguage();
    
    if (count === 1) {
      return singular;
    }
    
    if (plural) {
      return plural;
    }
    
    // Basic pluralization rules
    if (lang === 'de') {
      // German pluralization (simplified)
      return singular + 'e';
    } else {
      // English pluralization (simplified)
      return singular + 's';
    }
  }
}

export default MultilingualContentService;