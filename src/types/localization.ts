/**
 * TypeScript types for multilingual content management system
 */

export type SupportedLanguage = 'en' | 'de';

export interface LocalizationLabels {
  [key: string]: any;
}

export interface MultilingualHabit {
  id: string;
  goalCategory: 'better_sleep' | 'get_moving' | 'feel_better';
  effectivenessScore: number;
  effectivenessRank: number;
  isPrimaryRecommendation: boolean;
  difficulty: 'trivial' | 'easy' | 'moderate' | 'challenging' | 'advanced';
  timeMinutes: number;
  equipment: 'none' | 'minimal' | 'household' | 'specific' | 'gym';
  goalTags: string[];
  translations: {
    [K in SupportedLanguage]: HabitTranslation;
  };
  uiLabels: {
    templateVersion: string;
    requiredLabels: string[];
  };
}

export interface HabitTranslation {
  title: string;
  description: string;
  researchSummary: string;
  researchSource: string;
  whyItWorks: string;
  quickStart: string;
  timeToComplete: string;
  optimalTiming: string;
  difficultyLevel: string;
  category: string;
  researchEffectiveness: string;
  progressionTips: string;
  // Legacy fields for backward compatibility
  instructions?: string[];
  whyEffective?: string;
  timeToResults?: {
    initial: string;
    significant: string;
  };
  location?: string;
  commonMistakes?: string[];
  variations?: string[];
}

export interface LocalizedContent {
  language: SupportedLanguage;
  habits: MultilingualHabit[];
  research: LocalizedResearch[];
  lastUpdated: string;
}

export interface LocalizedResearch {
  id: string;
  translations: {
    [K in SupportedLanguage]: ResearchTranslation;
  };
}

export interface ResearchTranslation {
  title: string;
  summary: string;
  methodology: string;
  findings: string;
  implications: string;
  limitations?: string;
  citation: string;
}

export interface HabitContentTemplate {
  sections: {
    [key: string]: string;
  };
  content: {
    [key: string]: string;
  };
  difficulty: {
    [key: string]: string;
  };
  timeCommitment: {
    [key: string]: string;
  };
  equipment: {
    [key: string]: string;
  };
  location: {
    [key: string]: string;
  };
}

export interface UILabels {
  navigation: {
    [key: string]: string;
  };
  actions: {
    [key: string]: string;
  };
  onboarding: {
    [key: string]: string;
  };
  goals: {
    [key: string]: string;
  };
  habits: {
    [key: string]: string;
  };
  analytics: {
    [key: string]: string;
  };
  research: {
    [key: string]: string;
  };
  common: {
    [key: string]: string;
  };
  units: {
    [key: string]: string;
  };
  time: {
    [key: string]: string;
  };
}

export interface LanguagePreferences {
  primary: SupportedLanguage;
  fallback: SupportedLanguage;
  autoDetect: boolean;
  units: 'metric' | 'imperial';
}

export interface TranslationQuality {
  language: SupportedLanguage;
  completeness: number; // 0-100%
  accuracy: number; // 0-100%
  lastReviewed?: string;
  reviewedBy?: string;
  warnings: string[];
}

export interface ContentMetadata {
  id: string;
  type: 'habit' | 'research' | 'ui';
  languages: SupportedLanguage[];
  created: string;
  lastModified: string;
  translationQuality: {
    [K in SupportedLanguage]?: TranslationQuality;
  };
}

export interface MultilingualContentConfig {
  supportedLanguages: SupportedLanguage[];
  defaultLanguage: SupportedLanguage;
  fallbackLanguage: SupportedLanguage;
  autoDetectLanguage: boolean;
  enableMetricConversion: boolean;
  cacheTranslations: boolean;
  validateContent: boolean;
}

export interface LocalizationError {
  type: 'missing_translation' | 'invalid_key' | 'format_error' | 'conversion_error';
  language: SupportedLanguage;
  key: string;
  message: string;
  fallbackUsed?: boolean;
}

export interface LocalizationStats {
  totalKeys: number;
  translatedKeys: {
    [K in SupportedLanguage]: number;
  };
  completeness: {
    [K in SupportedLanguage]: number;
  };
  lastUpdated: string;
  errors: LocalizationError[];
}

// Goal-specific types
export interface GoalHabitRecommendation {
  goalId: 'better_sleep' | 'get_moving' | 'feel_better';
  topHabit: MultilingualHabit;
  alternativeHabits: MultilingualHabit[];
  confidence: number;
}

export interface UserRecommendations {
  primary: GoalHabitRecommendation[];
  language: SupportedLanguage;
  generatedAt: string;
  userPreferences?: {
    timeAvailable: number;
    difficultyPreference: string;
    equipmentAvailable: string[];
  };
}

// Template system types
export interface TemplateVariable {
  key: string;
  type: 'text' | 'number' | 'duration' | 'list';
  required: boolean;
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface ContentTemplate {
  id: string;
  name: string;
  description: string;
  sections: string[];
  variables: TemplateVariable[];
  supportedLanguages: SupportedLanguage[];
}

// Export utility types
export type TranslationKey = string;
export type TranslationValue = string | number | boolean;
export type TranslationVariables = Record<string, TranslationValue>;

export type LanguageChangeEvent = CustomEvent<{
  language: SupportedLanguage;
  previousLanguage: SupportedLanguage;
}>;

// Helper types for habit effectiveness ranking
export interface HabitEffectivenessRanking {
  goalCategory: 'better_sleep' | 'get_moving' | 'feel_better';
  habits: Array<{
    id: string;
    rank: number; // 1-10 within category
    effectivenessScore: number; // 0-100
    isPrimaryRecommendation: boolean; // Top 3 per category
  }>;
}

export interface GoalCategoryStats {
  category: 'better_sleep' | 'get_moving' | 'feel_better';
  totalHabits: number;
  primaryRecommendations: number;
  averageEffectiveness: number;
  languages: SupportedLanguage[];
  lastUpdated: string;
}