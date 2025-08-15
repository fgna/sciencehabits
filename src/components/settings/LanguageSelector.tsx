import React, { useState } from 'react';
import { Button } from '../ui';
import { useLanguage } from '../../hooks/useLanguage';
import { useTranslation } from '../../hooks/useTranslation';
import { SupportedLanguage } from '../../types/i18n';
import { LanguageDetectionService } from '../../services/i18n/LanguageDetection';

export function LanguageSelector() {
  const {
    currentLanguage,
    availableLanguages,
    languagePreferences,
    isLoading,
    error,
    switchLanguage,
    setLanguagePreferences
  } = useLanguage();
  
  const { t } = useTranslation('settings');
  const [isExpanded, setIsExpanded] = useState(false);
  const [languageDetection] = useState(() => new LanguageDetectionService());

  const languageNames = languageDetection.getSupportedLanguagesWithNames();

  // Helper function to get language flags/icons
  const getLanguageFlag = (code: SupportedLanguage): string => {
    const flags = {
      en: '🇺🇸',
      de: '🇩🇪', 
      fr: '🇫🇷',
      es: '🇪🇸'
    };
    return flags[code] || '🌐';
  };

  const handleLanguageSelect = async (language: SupportedLanguage | 'auto') => {
    setIsExpanded(false);
    await switchLanguage(language);
  };

  const handleAutoDetectToggle = (useAuto: boolean) => {
    setLanguagePreferences({
      useSystemLanguage: useAuto,
      selectedLanguage: useAuto ? 'auto' : currentLanguage
    });
    
    if (useAuto) {
      switchLanguage('auto');
    }
  };

  const getCurrentLanguageDisplay = () => {
    if (languagePreferences.selectedLanguage === 'auto') {
      const systemLang = languageNames.find(l => l.code === languagePreferences.systemLanguage);
      return `${t('autoDetect')} (${systemLang?.nativeName || systemLang?.name || 'English'})`;
    }
    
    const currentLang = languageNames.find(l => l.code === currentLanguage);
    return currentLang?.nativeName || currentLang?.name || 'English';
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {t('language')}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {t('languageDescription')}
        </p>
      </div>

      {/* Auto-detect toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <label className="text-sm font-medium text-gray-900">
            {t('autoDetectLanguage')}
          </label>
          <p className="text-xs text-gray-600">
            {t('autoDetectDescription')}
          </p>
        </div>
        <button
          onClick={() => handleAutoDetectToggle(!languagePreferences.useSystemLanguage)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
            languagePreferences.useSystemLanguage ? 'bg-primary-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              languagePreferences.useSystemLanguage ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Language selector */}
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('selectLanguage')}
        </label>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={isLoading}
          className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
        >
          <span className="flex items-center space-x-2">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-primary-600 rounded-full animate-spin" />
            ) : (
              <span className="text-xl">🌐</span>
            )}
            <span>{getCurrentLanguageDisplay()}</span>
          </span>
          
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {isExpanded && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-60 overflow-auto">
            <div className="py-1">
              {/* Auto option */}
              <button
                onClick={() => handleLanguageSelect('auto')}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                  languagePreferences.selectedLanguage === 'auto'
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">🔄</span>
                  <div>
                    <div className="font-medium">
                      {t('autoDetect')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t('systemLanguage')} ({languageNames.find(l => l.code === languagePreferences.systemLanguage)?.nativeName})
                    </div>
                  </div>
                </div>
              </button>

              <div className="border-t border-gray-100 my-1" />

              {/* Manual language options */}
              {languageNames.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                    currentLanguage === lang.code && languagePreferences.selectedLanguage !== 'auto'
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{getLanguageFlag(lang.code)}</span>
                    <div>
                      <div className="font-medium">{lang.nativeName}</div>
                      <div className="text-xs text-gray-500">{lang.name} • {lang.region}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Language status */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>
          {t('currentLanguage')}: <span className="font-medium">{getCurrentLanguageDisplay()}</span>
        </div>
        <div>
          {t('systemLanguage')}: <span className="font-medium">
            {languageNames.find(l => l.code === languagePreferences.systemLanguage)?.nativeName || 'English'}
          </span>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Language info */}
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          {t('languageSupport')}
        </h4>
        <div className="text-xs text-blue-800 space-y-1">
          <div>• {t('uiTranslation')}</div>
          <div>• {t('contentTranslation')}</div>
          <div>• {t('dateFormatting')}</div>
          <div>• {t('culturalAdaptation')}</div>
        </div>
      </div>

      {/* Coming soon languages */}
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          {t('comingSoon')}
        </h4>
        <div className="text-xs text-gray-600">
          {t('additionalLanguages')}
        </div>
      </div>
    </div>
  );
}