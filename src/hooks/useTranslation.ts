import { useCallback } from 'react';
import { SupportedLanguage, LocalizedHabit, LocalizedResearchArticle } from '../types/i18n';
import { uiTranslationService } from '../services/i18n/UITranslationService';
import { useLanguage } from './useLanguage';

interface UseTranslationReturn {
  t: (key: string, params?: Record<string, any>) => string;
  tHabit: (habit: any) => LocalizedHabit;
  tResearch: (article: any) => LocalizedResearchArticle;
  formatNumber: (value: number) => string;
  formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => string;
  formatRelativeTime: (date: Date) => string;
  plural: (count: number, key: string) => string;
  currentLanguage: SupportedLanguage;
  isLoading: boolean;
}

export function useTranslation(namespace?: string): UseTranslationReturn {
  const { currentLanguage, isLoading } = useLanguage();

  /**
   * Get translated text with optional namespace
   */
  const t = useCallback((key: string, params?: Record<string, any>) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return uiTranslationService.t(fullKey, params, currentLanguage);
  }, [namespace, currentLanguage]);

  /**
   * Get localized habit with fallback to original
   */
  const tHabit = useCallback((habit: any): LocalizedHabit => {
    // If habit is already localized and matches current language, return as-is
    if (habit.language === currentLanguage) {
      return habit;
    }

    // For now, return the habit as-is since we don't have habit-specific translations yet
    // In a full implementation, this would load from the appropriate language content file
    return {
      ...habit,
      language: currentLanguage
    };
  }, [currentLanguage]);

  /**
   * Get localized research article with fallback to original
   */
  const tResearch = useCallback((article: any): LocalizedResearchArticle => {
    // If article is already localized and matches current language, return as-is
    if (article.language === currentLanguage) {
      return article;
    }

    // For now, return the article as-is since we don't have research-specific translations yet
    // In a full implementation, this would load from the appropriate language content file
    return {
      ...article,
      language: currentLanguage
    };
  }, [currentLanguage]);

  /**
   * Format numbers according to current language
   */
  const formatNumber = useCallback((value: number) => {
    return uiTranslationService.formatNumber(value, currentLanguage);
  }, [currentLanguage]);

  /**
   * Format dates according to current language
   */
  const formatDate = useCallback((date: Date, options?: Intl.DateTimeFormatOptions) => {
    return uiTranslationService.formatDate(date, currentLanguage, options);
  }, [currentLanguage]);

  /**
   * Format relative time according to current language
   */
  const formatRelativeTime = useCallback((date: Date) => {
    return uiTranslationService.formatRelativeTime(date, currentLanguage);
  }, [currentLanguage]);

  /**
   * Handle pluralization according to current language
   */
  const plural = useCallback((count: number, key: string) => {
    const fullKey = namespace ? `${namespace}.${key}` : key;
    return uiTranslationService.plural(count, fullKey, currentLanguage);
  }, [namespace, currentLanguage]);

  return {
    t,
    tHabit,
    tResearch,
    formatNumber,
    formatDate,
    formatRelativeTime,
    plural,
    currentLanguage,
    isLoading
  };
}

// Specialized hooks for different contexts

/**
 * Hook for navigation components
 */
export function useNavigationTranslation() {
  return useTranslation('navigation');
}

/**
 * Hook for form components
 */
export function useFormTranslation() {
  return useTranslation('forms');
}

/**
 * Hook for error messages
 */
export function useErrorTranslation() {
  return useTranslation('errors');
}

/**
 * Hook for analytics components
 */
export function useAnalyticsTranslation() {
  return useTranslation('analytics');
}

/**
 * Hook for habit-related components
 */
export function useHabitTranslation() {
  return useTranslation('habits');
}

/**
 * Hook for settings components
 */
export function useSettingsTranslation() {
  return useTranslation('settings');
}

/**
 * Hook for onboarding components
 */
export function useOnboardingTranslation() {
  return useTranslation('onboarding');
}