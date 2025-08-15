import { SupportedLanguage } from '../../types/i18n';

export interface RegionalPreferences {
  language: SupportedLanguage;
  region: string;
  culturalContext: string;
}

export class LanguageDetectionService {
  private supportedLanguages: SupportedLanguage[] = ['en', 'de', 'fr', 'es'];
  
  // Language code mappings for browser languages
  private languageCodeMap: Record<string, SupportedLanguage> = {
    'en': 'en',
    'en-US': 'en',
    'en-GB': 'en',
    'en-CA': 'en',
    'en-AU': 'en',
    'de': 'de',
    'de-DE': 'de',
    'de-AT': 'de',
    'de-CH': 'de',
    'fr': 'fr',
    'fr-FR': 'fr',
    'fr-CA': 'fr',
    'fr-CH': 'fr',
    'fr-BE': 'fr',
    'es': 'es',
    'es-ES': 'es',
    'es-MX': 'es',
    'es-AR': 'es',
    'es-CL': 'es',
    'es-CO': 'es',
    'es-PE': 'es'
  };

  /**
   * Detect user's system language from browser
   */
  detectSystemLanguage(): SupportedLanguage {
    try {
      // Get browser language
      const browserLanguage = navigator.language || 
                             (navigator.languages && navigator.languages[0]) || 
                             'en';
      
      console.log('Detected browser language:', browserLanguage);
      
      // Map to supported language
      const mappedLanguage = this.mapLanguageCode(browserLanguage);
      
      console.log('Mapped to supported language:', mappedLanguage);
      
      return mappedLanguage;
    } catch (error) {
      console.warn('Failed to detect system language, defaulting to English:', error);
      return 'en';
    }
  }

  /**
   * Get browser language preferences in order
   */
  getBrowserLanguages(): SupportedLanguage[] {
    try {
      const languages = navigator.languages || [navigator.language || 'en'];
      
      return languages
        .map(lang => this.mapLanguageCode(lang))
        .filter((lang, index, array) => array.indexOf(lang) === index) // Remove duplicates
        .slice(0, 3); // Limit to top 3 preferences
    } catch (error) {
      console.warn('Failed to get browser languages, defaulting to English:', error);
      return ['en'];
    }
  }

  /**
   * Map browser language codes to supported languages
   */
  mapLanguageCode(browserLang: string): SupportedLanguage {
    // Normalize the language code
    const normalizedLang = browserLang.toLowerCase().trim();
    
    // Check exact match first
    if (this.languageCodeMap[normalizedLang]) {
      return this.languageCodeMap[normalizedLang];
    }
    
    // Try base language (e.g., 'de' from 'de-AT')
    const baseLang = normalizedLang.split('-')[0];
    if (this.languageCodeMap[baseLang]) {
      return this.languageCodeMap[baseLang];
    }
    
    // Check if it's similar to any supported language
    for (const supportedLang of this.supportedLanguages) {
      if (normalizedLang.startsWith(supportedLang)) {
        return supportedLang;
      }
    }
    
    // Default to English
    console.log(`Language ${browserLang} not supported, defaulting to English`);
    return 'en';
  }

  /**
   * Get regional preferences for cultural context
   */
  getRegionalPreferences(): RegionalPreferences {
    try {
      const fullLanguage = navigator.language || 'en-US';
      const [language, region] = fullLanguage.toLowerCase().split('-');
      const mappedLanguage = this.mapLanguageCode(language);
      
      return {
        language: mappedLanguage,
        region: region || 'us',
        culturalContext: this.getCulturalContext(mappedLanguage, region)
      };
    } catch (error) {
      console.warn('Failed to get regional preferences:', error);
      return {
        language: 'en',
        region: 'us',
        culturalContext: 'american'
      };
    }
  }

  /**
   * Get cultural context based on language and region
   */
  private getCulturalContext(language: SupportedLanguage, region?: string): string {
    switch (language) {
      case 'de':
        if (region === 'at') return 'austrian';
        if (region === 'ch') return 'swiss';
        return 'german';
      
      case 'fr':
        if (region === 'ca') return 'canadian';
        if (region === 'ch') return 'swiss';
        if (region === 'be') return 'belgian';
        return 'french';
      
      case 'es':
        if (region === 'mx') return 'mexican';
        if (region === 'ar') return 'argentinian';
        if (region === 'cl') return 'chilean';
        if (region === 'co') return 'colombian';
        return 'spanish';
      
      case 'en':
      default:
        if (region === 'gb') return 'british';
        if (region === 'ca') return 'canadian';
        if (region === 'au') return 'australian';
        return 'american';
    }
  }

  /**
   * Determine initial app language based on user preference and system detection
   */
  getInitialLanguage(userPreference?: SupportedLanguage | 'auto'): SupportedLanguage {
    // If user has explicitly set a language, use it
    if (userPreference && userPreference !== 'auto') {
      if (this.isLanguageSupported(userPreference)) {
        console.log('Using user preference:', userPreference);
        return userPreference;
      }
    }
    
    // If user prefers auto or no preference, detect system language
    const systemLanguage = this.detectSystemLanguage();
    console.log('Using system language:', systemLanguage);
    return systemLanguage;
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): language is SupportedLanguage {
    return this.supportedLanguages.includes(language as SupportedLanguage);
  }

  /**
   * Get supported languages with display names
   */
  getSupportedLanguagesWithNames(): Array<{
    code: SupportedLanguage;
    name: string;
    nativeName: string;
    region: string;
  }> {
    return [
      {
        code: 'en',
        name: 'English',
        nativeName: 'English',
        region: 'Global'
      },
      {
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        region: 'Germany, Austria, Switzerland'
      },
      {
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        region: 'France, Canada, Switzerland'
      },
      {
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        region: 'Spain, Latin America'
      }
    ];
  }

  /**
   * Get time format preference based on region
   */
  getTimeFormatPreference(language: SupportedLanguage, region?: string): '12h' | '24h' {
    // Most European countries use 24h format
    if (language === 'de' || language === 'fr') {
      return '24h';
    }
    
    // Spanish-speaking countries vary, but many use 24h
    if (language === 'es') {
      return '24h';
    }
    
    // English-speaking countries vary
    if (language === 'en') {
      if (region === 'gb' || region === 'au' || region === 'ca') {
        return '24h';
      }
      return '12h'; // US default
    }
    
    return '24h'; // Default to 24h format
  }

  /**
   * Get week start preference based on culture
   */
  getWeekStartPreference(language: SupportedLanguage): 'monday' | 'sunday' {
    // Most countries start week on Monday
    if (language === 'de' || language === 'fr' || language === 'es') {
      return 'monday';
    }
    
    // US typically starts on Sunday
    if (language === 'en') {
      return 'sunday';
    }
    
    return 'monday'; // Default to Monday
  }

  /**
   * Get number format preferences
   */
  getNumberFormatPreferences(language: SupportedLanguage): {
    decimalSeparator: string;
    thousandsSeparator: string;
    currencySymbol: string;
  } {
    switch (language) {
      case 'de':
        return {
          decimalSeparator: ',',
          thousandsSeparator: '.',
          currencySymbol: '€'
        };
      
      case 'fr':
        return {
          decimalSeparator: ',',
          thousandsSeparator: ' ',
          currencySymbol: '€'
        };
      
      case 'es':
        return {
          decimalSeparator: ',',
          thousandsSeparator: '.',
          currencySymbol: '€'
        };
      
      case 'en':
      default:
        return {
          decimalSeparator: '.',
          thousandsSeparator: ',',
          currencySymbol: '$'
        };
    }
  }

  /**
   * Check if user's system supports the target language for notifications, etc.
   */
  checkSystemLanguageSupport(language: SupportedLanguage): {
    dateFormatting: boolean;
    numberFormatting: boolean;
    textToSpeech: boolean;
    spellCheck: boolean;
  } {
    try {
      const hasIntlSupport = typeof Intl !== 'undefined';
      const hasDateTimeFormat = hasIntlSupport && 
        'DateTimeFormat' in Intl &&
        Intl.DateTimeFormat.supportedLocalesOf([language]).length > 0;
      
      const hasNumberFormat = hasIntlSupport && 
        'NumberFormat' in Intl &&
        Intl.NumberFormat.supportedLocalesOf([language]).length > 0;
      
      // Basic TTS support check
      const hasTTSSupport = 'speechSynthesis' in window;
      
      return {
        dateFormatting: hasDateTimeFormat,
        numberFormatting: hasNumberFormat,
        textToSpeech: hasTTSSupport,
        spellCheck: true // Most browsers support multi-language spell check
      };
    } catch (error) {
      console.warn('Error checking system language support:', error);
      return {
        dateFormatting: false,
        numberFormatting: false,
        textToSpeech: false,
        spellCheck: false
      };
    }
  }
}