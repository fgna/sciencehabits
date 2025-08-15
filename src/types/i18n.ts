// Multi-language support types

export type SupportedLanguage = 'en' | 'de' | 'fr' | 'es';

export interface LanguagePreferences {
  selectedLanguage: SupportedLanguage | 'auto';
  systemLanguage: SupportedLanguage;
  fallbackLanguage: SupportedLanguage;
  useSystemLanguage: boolean;
}

export interface TranslationMetadata {
  fileId: string;
  sourceFile: string;
  targetFile: string;
  publishingStatus: 'live' | 'error';
  reviewStatus: 'unreviewed' | 'reviewed' | 'flagged';
  translatedBy: 'claude' | 'human';
  translatedAt: string;
  confidence?: number;
  qualityWarnings: QualityWarning[];
  culturalNotes?: string[];
  suggestedImprovements?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  flaggedBy?: string;
  flaggedAt?: string;
  flagReason?: string;
}

export interface QualityWarning {
  type: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestion?: string;
}

export interface LanguageToDoItem {
  id: string;
  language: SupportedLanguage;
  contentType: 'habit' | 'research' | 'ui_text' | 'goal';
  contentId: string;
  priority: 'high' | 'medium' | 'low';
  issueType: 'unreviewed' | 'quality_concern' | 'cultural_adaptation';
  description: string;
  englishText: string;
  translatedText: string;
  aiQualityScore: number;
  userFacingContent: boolean;
  createdAt: string;
  assignedTo?: string;
}

export interface UITranslations {
  [key: string]: string | UITranslations;
}

export interface CulturalContext {
  language: SupportedLanguage;
  workCulture: 'german' | 'french' | 'spanish' | 'american';
  formalityLevel: 'formal' | 'informal';
  timeFormat: '12h' | '24h';
  weekStart: 'monday' | 'sunday';
  culturalNotes: string[];
}

export interface LocalizedContent {
  [key: string]: any;
}

export interface QualityMetrics {
  accuracyScore: number;
  fluencyScore: number;
  consistencyScore: number;
  culturalScore: number;
  overallScore: number;
  feedback: string[];
}

export interface UITranslationContext {
  componentType: 'button' | 'label' | 'message' | 'navigation' | 'form';
  maxLength?: number;
  formality: 'formal' | 'friendly';
  audience: 'professional' | 'general' | 'technical';
}

export interface TranslationResult {
  success: boolean;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  translatedItems: number;
  errorCount: number;
  warnings: QualityWarning[];
  metadata: TranslationMetadata;
}

// Localized versions of existing types
export interface LocalizedHabit {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  timeMinutes: number;
  goalTags: string[];
  researchIds: string[];
  isCustom: boolean;
  language: SupportedLanguage;
  sourceLanguage?: SupportedLanguage;
  translatedAt?: string;
  translatedBy?: 'claude' | 'human';
}

export interface LocalizedResearchArticle {
  id: string;
  title: string;
  abstract: string;
  summary: string;
  keyFindings: string[];
  practicalTips: string[];
  url: string;
  authors: string[];
  journal: string;
  year: number;
  language: SupportedLanguage;
  sourceLanguage?: SupportedLanguage;
  translatedAt?: string;
  translatedBy?: 'claude' | 'human';
}

export interface LocalizedGoal {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  language: SupportedLanguage;
}