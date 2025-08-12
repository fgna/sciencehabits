import { ResearchCitation } from './recovery';

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

// Badge System Types
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or icon identifier
  category: 'streak' | 'consistency' | 'recovery' | 'learning' | 'milestone';
  requirement: BadgeRequirement;
  researchExplanation: string;
  researchCitation?: ResearchCitation;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  unlockedAt?: string; // ISO date string when badge was earned
}

export interface BadgeRequirement {
  type: 'streak' | 'total_completions' | 'consistency_rate' | 'recovery_success' | 'research_engagement';
  threshold: number;
  timeframe?: 'week' | 'month' | 'all_time';
  habitSpecific?: boolean; // true if badge applies to individual habits
  globalAchievement?: boolean; // true if badge considers all habits together
}

export interface UserBadge {
  badgeId: string;
  userId: string;
  habitId?: string; // for habit-specific badges
  earnedAt: string; // ISO date string
  isNew: boolean; // for showing "new badge earned" notifications
  progress?: number; // current progress toward badge (0-100)
}

export interface BadgeDisplay {
  badge: Badge;
  userBadge?: UserBadge;
  progress: number;
  isEarned: boolean;
  isNew: boolean;
}

// Habit Level System Types
export interface HabitLevel {
  id: string;
  habitCategoryId: string;
  level: number;
  name: string;
  description: string;
  timeRequirement: number; // minutes
  difficultyTags: string[];
  prerequisites: HabitLevelPrerequisite[];
  researchExplanation: string;
  instructions: string;
  tips: string[];
  commonMistakes: string[];
  advancementCriteria: AdvancementCriteria;
}

export interface HabitLevelPrerequisite {
  type: 'previous_level' | 'consistency_rate' | 'streak_length' | 'time_practiced';
  value: number;
  timeframe?: string;
}

export interface AdvancementCriteria {
  minimumConsistency: number; // percentage
  minimumDuration: number; // days
  optionalChallenges?: string[];
}

export interface UserHabitLevel {
  userId: string;
  habitCategoryId: string;
  currentLevel: number;
  unlockedLevels: number[];
  startedAt: string;
  levelStartDate: string;
  readyForAdvancement: boolean;
  progressToNextLevel: number; // 0-100
}

export interface HabitFrequency {
  type: 'daily' | 'weekly' | 'periodic' | 'custom';
  
  // For weekly habits (e.g., "3 times per week")
  weeklyTarget?: {
    sessionsPerWeek: number;
    preferredDays?: string[]; // ['monday', 'tuesday', 'friday']
    allowFlexibleDays?: boolean;
  };
  
  // For periodic habits (quarterly, yearly, etc.)
  periodicTarget?: {
    interval: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    intervalCount: number; // every N intervals
    nextDueDate?: string; // calculated based on last completion
  };
  
  // For custom patterns
  customPattern?: {
    description: string;
    reminderLogic: string; // Custom reminder calculation
  };
}

export interface HabitReminders {
  enabled: boolean;
  periodicReminderDays: number; // days since last completion to trigger reminder
  weeklyReminderDay?: string; // preferred day for weekly goal reminders
  customMessage?: string;
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
  
  // Enhanced frequency system
  frequency: HabitFrequency;
  reminders: HabitReminders;
  
  // Enhanced fields (keeping existing for backward compatibility)
  effectivenessScore?: number;
  evidenceStrength?: 'very_high' | 'high' | 'moderate' | 'low';
  legacyFrequency?: string; // For backward compatibility with old frequency field
  whyEffective?: string;
  contraindications?: string;
  cost?: string;
  germanSuppliers?: string;
}

export interface WeeklyProgress {
  weekStart: string; // ISO week start date (YYYY-MM-DD)
  completedSessions: number;
  targetSessions: number;
  weeklyGoalMet: boolean;
  completedDates: string[]; // actual completion dates within the week
}

export interface PeriodicProgress {
  intervalStart: string;
  intervalEnd: string;
  completed: boolean;
  completedDate?: string;
  daysSinceCompletion?: number;
  intervalType: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
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
  
  // Enhanced progress tracking for non-daily habits
  weeklyProgress?: WeeklyProgress[];
  periodicProgress?: PeriodicProgress[];
  lastCompletionDate?: string;
  
  // Smart streak calculation for different frequencies
  frequencyAwareStreak?: {
    current: number;
    type: 'daily' | 'weekly' | 'periodic';
    lastCalculated: string;
  };
}

export interface HabitReminder {
  habitId: string;
  habit: Habit;
  reminderType: 'weekly_goal' | 'periodic_due' | 'overdue' | 'custom';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  daysSinceLastCompletion: number;
  nextDueDate?: string;
  weeklyProgress?: {
    completed: number;
    target: number;
    daysLeft: number;
  };
}

export interface FrequencyStats {
  type: 'daily' | 'weekly' | 'periodic' | 'custom';
  completionRate: number;
  averageCompletionsPerWeek?: number;
  periodicCompletionRate?: number;
  streakInfo: {
    current: number;
    longest: number;
    frequencyAdjusted: boolean;
  };
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