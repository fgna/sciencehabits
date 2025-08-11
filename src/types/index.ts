export interface User {
  id: string;
  name?: string;
  createdAt: string;
  goals: string[];
  dailyMinutes: number;
  preferredTime: 'morning' | 'lunch' | 'evening' | 'flexible';
  lifestyle: 'professional' | 'parent' | 'student';
  language: 'en' | 'de';
  trial: {
    hasUsedTrial: boolean;
    isActive: boolean;
    startDate?: string;
    endDate?: string;
  };
  isPremium: boolean;
}

export interface Habit {
  id: string;
  title: string;
  description: string;
  timeMinutes: number;
  category: string; // Now supports tier1_foundation, tier2_optimization, tier3_microhabits, etc.
  goalTags: string[];
  lifestyleTags: string[];
  timeTags: string[];
  instructions: string;
  researchIds: string[];
  isCustom: boolean;
  difficulty: 'trivial' | 'easy' | 'moderate' | 'beginner' | 'intermediate' | 'advanced';
  equipment: string;
  // Enhanced fields
  effectivenessScore?: number;
  evidenceStrength?: 'very_high' | 'high' | 'moderate' | 'low';
  frequency?: string;
  whyEffective?: string;
  contraindications?: string;
  cost?: string;
  germanSuppliers?: string;
}

export interface Progress {
  id: string; // composite key: userId:habitId
  userId: string;
  habitId: string;
  dateStarted: string;
  completions: string[];
  currentStreak: number;
  longestStreak: number;
  totalDays: number;
}

export interface ResearchStudy {
  id: string;
  title: string;
  authors: string;
  year: number;
  journal: string;
  summary: string;
  finding: string;
  sampleSize: number;
  studyType: string;
  category: string;
  habitCategories?: string[]; // For backward compatibility
  credibilityTier?: 'high' | 'medium' | 'low'; // For backward compatibility
  fullCitation: string;
  // Enhanced fields
  duration?: string;
  effectSize?: string;
  pValue?: string;
  confidenceInterval?: string;
  keyFindings?: string[];
  studyQuality?: 'very_high' | 'high' | 'moderate_to_high' | 'moderate' | 'low';
  evidenceLevel?: string;
  limitations?: string;
  practicalApplication?: string;
  habitRelevance?: string[];
  germanRelevance?: string;
}

export interface ResearchArticle {
  id: string;
  studyId: string;
  title: string;
  subtitle: string;
  category: string;
  tags: string[];
  readingTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  publishedDate: string;
  author: string;
  relatedHabits: string[];
  keyTakeaways: string[];
  studyDetails: {
    journal: string;
    year: number;
    sampleSize: number;
    studyType: string;
    evidenceLevel: string;
    statisticalSignificance: string;
  };
  content: string; // Markdown content
  seo?: {
    metaTitle: string;
    metaDescription: string;
    keywords: string[];
    canonicalUrl: string;
  };
  images?: {
    featuredImage: string;
    socialImage: string;
    alt: string;
  };
  citations?: Array<{
    id: string;
    text: string;
    url: string;
    type: string;
  }>;
  translations?: {
    [key: string]: string;
  };
}