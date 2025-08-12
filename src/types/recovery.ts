/**
 * Recovery System Types
 * 
 * Comprehensive type definitions for the recovery-first design system
 * that prevents habit abandonment through compassion messaging,
 * micro-habit alternatives, and trend-focused progress tracking.
 */

export interface CompassionMessage {
  id: string;
  triggerCondition: 'first_miss' | 'second_consecutive' | 'third_consecutive' | 'weekly_struggle' | 'motivation_low';
  message: string;
  researchExplanation: string;
  researchCitation?: ResearchCitation;
  recoveryOptions: string[];
  emotionalTone: 'supportive' | 'encouraging' | 'understanding' | 'motivational';
  severity: 'gentle' | 'moderate' | 'intensive';
}

export interface ResearchCitation {
  authors: string;
  title: string;
  journal: string;
  year: number;
  url?: string;
  doi?: string;
}

export interface ResearchFact {
  id: string;
  category: 'habit_formation' | 'recovery' | 'motivation' | 'neuroscience' | 'psychology';
  title: string;
  explanation: string;
  statistic?: string;
  citation: ResearchCitation;
  contextTriggers: string[];
  credibilityScore: number; // 1-10 based on research quality
}

export interface MicroHabit {
  id: string;
  originalHabitId: string;
  name: string;
  description: string;
  timeRequired: number; // in minutes (typically 2)
  difficulty: 'minimal' | 'easy' | 'moderate';
  scalingSteps: string[];
  maintainsSameContext: boolean;
  successRate: number; // historical data
}

export interface RecoverySession {
  id: string;
  habitId: string;
  startDate: string;
  recoveryType: 'micro_habit' | 'reduced_frequency' | 'context_change' | 'social_support' | 'timing_adjustment';
  targetReturnDate: string;
  currentStep: number;
  totalSteps: number;
  completed: boolean;
  successfulDays: number;
  challengingDays: number;
  userNotes?: string;
  coachingTips: string[];
  nextMilestone: string;
}

export interface TrendData {
  habitId: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  startDate: string;
  endDate: string;
  completionRate: number; // 0-100
  totalDays: number;
  completedDays: number;
  missedDays: number;
  trend: 'improving' | 'stable' | 'declining';
  trendPercentage: number; // compared to previous period
  consistencyScore: number; // 0-100, factors in pattern regularity
  longestStreak: number;
  totalStreaks: number;
  averageGapBetweenMisses: number;
}

export interface ProgressVisualization {
  type: 'consistency_chart' | 'trend_line' | 'monthly_heatmap' | 'recovery_journey' | 'success_patterns';
  data: any[];
  insights: string[];
  encouragement: string[];
  recommendations: string[];
}

export interface RecoveryInsight {
  id: string;
  habitId: string;
  type: 'pattern_detected' | 'success_factor' | 'risk_factor' | 'opportunity';
  title: string;
  description: string;
  actionable: boolean;
  suggestedActions: string[];
  confidence: number; // 0-100
  basedOn: 'user_data' | 'research' | 'community_data';
}

export interface CompassionEvent {
  id: string;
  habitId: string;
  userId: string;
  triggeredDate: string;
  triggerCondition: string;
  messageShown: CompassionMessage;
  userResponse: 'dismissed' | 'accepted_recovery' | 'requested_help' | 'provided_feedback';
  recoveryOptionSelected?: string;
  timeToResponse: number; // seconds
  followUpNeeded: boolean;
}

export interface HabitProgressExtended {
  habitId: string;
  date: string;
  completed: boolean;
  missedDate?: string;
  compassionMessageShown?: boolean;
  lastCompassionMessageId?: string;
  recoverySessionActive?: boolean;
  microHabitCompleted?: boolean;
  moodBefore?: 'positive' | 'neutral' | 'negative';
  moodAfter?: 'positive' | 'neutral' | 'negative';
  contextNotes?: string;
  difficultyExperienced?: 'easy' | 'moderate' | 'difficult';
}

export interface RecoverySettings {
  enableCompassionMessages: boolean;
  preferredRecoveryType: 'micro_habit' | 'reduced_frequency' | 'context_change';
  showResearchExplanations: boolean;
  messageFrequency: 'immediate' | 'daily' | 'weekly';
  autoSuggestMicroHabits: boolean;
  trendFocusedProgress: boolean;
  shareProgressWithCommunity: boolean;
  enableRecoveryCoaching: boolean;
}

export interface RecoveryMetrics {
  totalRecoverySessions: number;
  successfulRecoveries: number;
  averageRecoveryTime: number; // days
  mostEffectiveRecoveryType: string;
  compassionMessageEngagement: number; // 0-100
  userSatisfactionScore: number; // 0-10
  retentionImprovementScore: number; // compared to baseline
}

// Extended Habit interface to include recovery features
export interface HabitWithRecovery {
  id: string;
  name: string;
  description: string;
  timeRequired: number;
  difficulty: 'easy' | 'moderate' | 'difficult';
  context: {
    location: string;
    timeOfDay: string;
    prerequisites: string[];
  };
  microVersion?: MicroHabit;
  recoveryStrategies: string[];
  researchBacking: ResearchFact[];
  successPatterns: string[];
  commonChallenges: string[];
  communityTips: string[];
}

export interface RecoverySystemState {
  // Active recovery sessions
  activeRecoverySessions: RecoverySession[];
  
  // Compassion messaging
  compassionMessages: CompassionMessage[];
  recentCompassionEvents: CompassionEvent[];
  
  // Research and explanations
  researchFacts: ResearchFact[];
  
  // User settings
  recoverySettings: RecoverySettings;
  
  // Metrics and insights
  recoveryMetrics: RecoveryMetrics;
  personalInsights: RecoveryInsight[];
  
  // Progress visualization
  trendData: Record<string, TrendData[]>; // habitId -> trend data
  progressVisualizations: ProgressVisualization[];
}

// Recovery Action Types for state management
export type RecoveryAction = 
  | { type: 'TRIGGER_COMPASSION_MESSAGE'; payload: { habitId: string; triggerCondition: string } }
  | { type: 'START_RECOVERY_SESSION'; payload: RecoverySession }
  | { type: 'UPDATE_RECOVERY_PROGRESS'; payload: { sessionId: string; progress: Partial<RecoverySession> } }
  | { type: 'COMPLETE_RECOVERY_SESSION'; payload: { sessionId: string; outcome: 'successful' | 'needs_adjustment' } }
  | { type: 'UPDATE_RECOVERY_SETTINGS'; payload: Partial<RecoverySettings> }
  | { type: 'LOG_COMPASSION_EVENT'; payload: CompassionEvent }
  | { type: 'GENERATE_RECOVERY_INSIGHTS'; payload: { habitId: string } }
  | { type: 'UPDATE_TREND_DATA'; payload: { habitId: string; trendData: TrendData } };

// Utility types for API responses
export interface RecoveryRecommendation {
  type: 'micro_habit' | 'frequency_reduction' | 'context_change' | 'social_support';
  title: string;
  description: string;
  estimatedSuccessRate: number;
  timeToImplement: string;
  difficultyReduction: number; // percentage
  researchSupport: string;
}

export interface CompassionTriggerResult {
  shouldTrigger: boolean;
  messageId?: string;
  severity: 'low' | 'medium' | 'high';
  urgency: 'immediate' | 'within_24h' | 'within_week';
  contextFactors: string[];
}

export interface TrendAnalysisResult {
  trendData: TrendData;
  insights: RecoveryInsight[];
  visualizations: ProgressVisualization[];
  recommendations: RecoveryRecommendation[];
  encouragementMessage: string;
}