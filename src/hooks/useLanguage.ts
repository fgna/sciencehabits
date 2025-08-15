import { useState, useEffect, useCallback } from 'react';
import { SupportedLanguage, LanguagePreferences } from '../types/i18n';
import { LanguageDetectionService } from '../services/i18n/LanguageDetection';
import { MultiLanguageContentManager } from '../services/i18n/ContentManager';
import { uiTranslationService } from '../services/i18n/UITranslationService';

const LANGUAGE_STORAGE_KEY = 'sciencehabits_language_preferences';

interface UseLanguageReturn {
  currentLanguage: SupportedLanguage;
  availableLanguages: SupportedLanguage[];
  languagePreferences: LanguagePreferences;
  isLoading: boolean;
  error: string | null;
  switchLanguage: (language: SupportedLanguage | 'auto') => Promise<void>;
  setLanguagePreferences: (preferences: Partial<LanguagePreferences>) => void;
  getSystemLanguage: () => SupportedLanguage;
  isLanguageSupported: (language: string) => boolean;
}

export function useLanguage(): UseLanguageReturn {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize services
  const [languageDetection] = useState(() => new LanguageDetectionService());
  const [contentManager] = useState(() => new MultiLanguageContentManager());
  
  // Language preferences with system detection
  const [languagePreferences, setLanguagePreferencesState] = useState<LanguagePreferences>(() => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    const systemLanguage = languageDetection.detectSystemLanguage();
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          systemLanguage,
          fallbackLanguage: 'en',
          useSystemLanguage: true,
          ...parsed
        };
      } catch (error) {
        console.warn('Failed to parse saved language preferences:', error);
      }
    }
    
    return {
      selectedLanguage: 'auto',
      systemLanguage,
      fallbackLanguage: 'en',
      useSystemLanguage: true
    };
  });

  /**
   * Get available languages from content manager
   */
  const availableLanguages = contentManager.getSupportedLanguages();

  /**
   * Save language preferences to localStorage
   */
  const saveLanguagePreferences = useCallback((preferences: LanguagePreferences) => {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.warn('Failed to save language preferences:', error);
    }
  }, []);

  /**
   * Update language preferences
   */
  const setLanguagePreferences = useCallback((updates: Partial<LanguagePreferences>) => {
    setLanguagePreferencesState(prev => {
      const updated = { ...prev, ...updates };
      saveLanguagePreferences(updated);
      return updated;
    });
  }, [saveLanguagePreferences]);

  /**
   * Get system language
   */
  const getSystemLanguage = useCallback(() => {
    return languageDetection.detectSystemLanguage();
  }, [languageDetection]);

  /**
   * Check if language is supported
   */
  const isLanguageSupported = useCallback((language: string): boolean => {
    return contentManager.isLanguageSupported(language);
  }, [contentManager]);

  /**
   * Switch language with content loading
   */
  const switchLanguage = useCallback(async (targetLanguage: SupportedLanguage | 'auto') => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Determine actual language to use
      let actualLanguage: SupportedLanguage;
      
      if (targetLanguage === 'auto') {
        actualLanguage = getSystemLanguage();
      } else {
        actualLanguage = targetLanguage;
      }
      
      // Validate language is supported
      if (!isLanguageSupported(actualLanguage)) {
        throw new Error(`Language ${actualLanguage} is not supported`);
      }
      
      console.log(`Switching to language: ${actualLanguage}`);
      
      // Load content for the new language
      await contentManager.loadContent(actualLanguage);
      
      // Update UI translation service
      uiTranslationService.setCurrentLanguage(actualLanguage);
      
      // Update current language state
      setCurrentLanguage(actualLanguage);
      
      // Update preferences
      setLanguagePreferences({
        selectedLanguage: targetLanguage,
        useSystemLanguage: targetLanguage === 'auto'
      });
      
      console.log(`✅ Successfully switched to ${actualLanguage}`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to switch language';
      console.error('Language switch failed:', err);
      setError(errorMessage);
      
      // Don't change language on error - stay with current
    } finally {
      setIsLoading(false);
    }
  }, [contentManager, getSystemLanguage, isLanguageSupported, setLanguagePreferences]);

  /**
   * Initialize language on mount
   */
  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        setIsLoading(true);
        
        // Load UI translations first
        await uiTranslationService.loadUITranslations();
        
        // Determine initial language
        const initialLanguage = languageDetection.getInitialLanguage(
          languagePreferences.selectedLanguage
        );
        
        console.log('Initializing with language:', initialLanguage);
        
        // Set language without triggering full switch (to avoid loop)
        await contentManager.loadContent(initialLanguage);
        uiTranslationService.setCurrentLanguage(initialLanguage);
        setCurrentLanguage(initialLanguage);
        
        console.log('✅ Language initialization complete');
        
      } catch (err) {
        console.error('Language initialization failed:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize language');
        
        // Fallback to English
        setCurrentLanguage('en');
        uiTranslationService.setCurrentLanguage('en');
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeLanguage();
  }, [languageDetection, contentManager, languagePreferences.selectedLanguage]);

  /**
   * Update system language when it changes
   */
  useEffect(() => {
    const handleLanguageChange = () => {
      const newSystemLanguage = getSystemLanguage();
      
      if (newSystemLanguage !== languagePreferences.systemLanguage) {
        console.log('System language changed:', newSystemLanguage);
        
        setLanguagePreferences({
          systemLanguage: newSystemLanguage
        });
        
        // If using auto language, switch to new system language
        if (languagePreferences.useSystemLanguage) {
          switchLanguage('auto');
        }
      }
    };
    
    // Listen for language change events
    window.addEventListener('languagechange', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languagechange', handleLanguageChange);
    };
  }, [languagePreferences, getSystemLanguage, setLanguagePreferences, switchLanguage]);

  /**
   * Clear error when language changes
   */
  useEffect(() => {
    if (error && !isLoading) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, isLoading]);

  return {
    currentLanguage,
    availableLanguages,
    languagePreferences,
    isLoading,
    error,
    switchLanguage,
    setLanguagePreferences,
    getSystemLanguage,
    isLanguageSupported
  };
}