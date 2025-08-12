/**
 * Recovery System Store
 * 
 * Zustand store for managing the recovery-first design system,
 * including compassion messaging, micro-habits, recovery sessions,
 * and trend-focused progress tracking.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { 
  RecoverySystemState, 
  RecoverySession, 
  CompassionEvent, 
  TrendData, 
  RecoverySettings,
  CompassionTriggerResult,
  RecoveryRecommendation,
  HabitProgressExtended,
  RecoveryInsight,
  MicroHabit
} from '../types/recovery';
import { 
  researchFacts, 
  compassionMessages, 
  getCompassionMessage,
  getRelevantResearch,
  getMicroHabitTemplate
} from '../data/recoveryResearch';
import { Habit, Progress } from '../types';

interface RecoveryStore extends RecoverySystemState {
  // Core actions
  checkForCompassionTriggers: (habitId: string) => CompassionTriggerResult;
  triggerCompassionMessage: (habitId: string, triggerCondition: string) => void;
  startRecoverySession: (habitId: string, recoveryType: string) => void;
  updateRecoveryProgress: (sessionId: string, progress: Partial<RecoverySession>) => void;
  completeRecoverySession: (sessionId: string, outcome: 'successful' | 'needs_adjustment') => void;
  
  // Micro-habits
  generateMicroHabit: (originalHabit: Habit) => MicroHabit;
  activateMicroHabit: (microHabit: MicroHabit) => void;
  progressMicroHabit: (microHabitId: string) => void;
  
  // Trend analysis
  calculateTrendData: (habitId: string, period: 'week' | 'month' | 'quarter') => TrendData;
  generateRecoveryInsights: (habitId: string) => RecoveryInsight[];
  updateTrendData: (habitId: string, progress: Progress[]) => void;
  
  // Settings and preferences
  updateRecoverySettings: (settings: Partial<RecoverySettings>) => void;
  
  // Analytics and metrics
  getRecoveryMetrics: () => any;
  logCompassionEvent: (event: CompassionEvent) => void;
  
  // Research and explanations
  getRelevantResearchForSituation: (contextTriggers: string[]) => any[];
  
  // Utilities
  getConsecutiveMissCount: (habitId: string, progress: Progress[]) => number;
  getLastCompletionDate: (habitId: string, progress: Progress[]) => string | null;
  isInRecoverySession: (habitId: string) => boolean;
  getActiveRecoverySession: (habitId: string) => RecoverySession | null;
  
  // Initialization
  initializeRecoverySystem: () => void;
}

const defaultRecoverySettings: RecoverySettings = {
  enableCompassionMessages: true,
  preferredRecoveryType: 'micro_habit',
  showResearchExplanations: true,
  messageFrequency: 'immediate',
  autoSuggestMicroHabits: true,
  trendFocusedProgress: true,
  shareProgressWithCommunity: false,
  enableRecoveryCoaching: true
};

export const useRecoveryStore = create<RecoveryStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    activeRecoverySessions: [],
    compassionMessages: compassionMessages,
    recentCompassionEvents: [],
    researchFacts: researchFacts,
    recoverySettings: defaultRecoverySettings,
    recoveryMetrics: {
      totalRecoverySessions: 0,
      successfulRecoveries: 0,
      averageRecoveryTime: 0,
      mostEffectiveRecoveryType: 'micro_habit',
      compassionMessageEngagement: 0,
      userSatisfactionScore: 0,
      retentionImprovementScore: 0
    },
    personalInsights: [],
    trendData: {},
    progressVisualizations: [],

    checkForCompassionTriggers: (habitId: string): CompassionTriggerResult => {
      const state = get();
      const { recoverySettings } = state;
      
      if (!recoverySettings.enableCompassionMessages) {
        return { shouldTrigger: false, severity: 'low', urgency: 'within_week', contextFactors: [] };
      }

      // This would integrate with userStore to get actual progress data
      // For now, we'll return a mock implementation
      const consecutiveMisses = get().getConsecutiveMissCount(habitId, []);
      
      let triggerCondition = '';
      let severity: 'low' | 'medium' | 'high' = 'low';
      let urgency: 'immediate' | 'within_24h' | 'within_week' = 'within_24h';
      
      if (consecutiveMisses === 1) {
        triggerCondition = 'first_miss';
        severity = 'low';
        urgency = 'within_24h';
      } else if (consecutiveMisses === 2) {
        triggerCondition = 'second_consecutive';
        severity = 'medium';
        urgency = 'immediate';
      } else if (consecutiveMisses >= 3) {
        triggerCondition = 'third_consecutive';
        severity = 'high';
        urgency = 'immediate';
      }
      
      return {
        shouldTrigger: consecutiveMisses > 0,
        messageId: triggerCondition,
        severity,
        urgency,
        contextFactors: ['consecutive_misses', 'needs_support']
      };
    },

    triggerCompassionMessage: (habitId: string, triggerCondition: string) => {
      const message = getCompassionMessage(triggerCondition);
      if (!message) return;

      const event: CompassionEvent = {
        id: `compassion_${Date.now()}`,
        habitId,
        userId: 'current_user', // Would get from user store
        triggeredDate: new Date().toISOString(),
        triggerCondition,
        messageShown: message,
        userResponse: 'dismissed',
        timeToResponse: 0,
        followUpNeeded: triggerCondition === 'third_consecutive'
      };

      set(state => ({
        recentCompassionEvents: [event, ...state.recentCompassionEvents.slice(0, 9)]
      }));
    },

    startRecoverySession: (habitId: string, recoveryType: string) => {
      const session: RecoverySession = {
        id: `recovery_${Date.now()}`,
        habitId,
        startDate: new Date().toISOString(),
        recoveryType: recoveryType as any,
        targetReturnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        currentStep: 0,
        totalSteps: 5,
        completed: false,
        successfulDays: 0,
        challengingDays: 0,
        coachingTips: [
          'Start with the smallest possible version',
          'Focus on consistency over intensity',
          'Celebrate every small win',
          'Be patient with the process'
        ],
        nextMilestone: 'Complete 3 consecutive days'
      };

      set(state => ({
        activeRecoverySessions: [...state.activeRecoverySessions, session],
        recoveryMetrics: {
          ...state.recoveryMetrics,
          totalRecoverySessions: state.recoveryMetrics.totalRecoverySessions + 1
        }
      }));
    },

    updateRecoveryProgress: (sessionId: string, progress: Partial<RecoverySession>) => {
      set(state => ({
        activeRecoverySessions: state.activeRecoverySessions.map(session =>
          session.id === sessionId ? { ...session, ...progress } : session
        )
      }));
    },

    completeRecoverySession: (sessionId: string, outcome: 'successful' | 'needs_adjustment') => {
      set(state => {
        const session = state.activeRecoverySessions.find(s => s.id === sessionId);
        if (!session) return state;

        const updatedSessions = state.activeRecoverySessions.map(s =>
          s.id === sessionId ? { ...s, completed: true } : s
        );

        const isSuccessful = outcome === 'successful';
        
        return {
          activeRecoverySessions: updatedSessions,
          recoveryMetrics: {
            ...state.recoveryMetrics,
            successfulRecoveries: isSuccessful 
              ? state.recoveryMetrics.successfulRecoveries + 1 
              : state.recoveryMetrics.successfulRecoveries,
            averageRecoveryTime: isSuccessful 
              ? calculateAverageRecoveryTime(state.recoveryMetrics, session)
              : state.recoveryMetrics.averageRecoveryTime
          }
        };
      });
    },

    generateMicroHabit: (originalHabit: Habit): MicroHabit => {
      const template = getMicroHabitTemplate(originalHabit.category || 'exercise');
      
      return {
        id: `micro_${originalHabit.id}_${Date.now()}`,
        originalHabitId: originalHabit.id,
        name: template.name,
        description: template.description,
        timeRequired: template.timeRequired,
        difficulty: 'minimal',
        scalingSteps: template.scalingSteps,
        maintainsSameContext: true,
        successRate: 0.8 // Default high success rate for micro habits
      };
    },

    activateMicroHabit: (microHabit: MicroHabit) => {
      // This would integrate with the main habit system
      // to temporarily replace or supplement the original habit
      console.log('Activating micro habit:', microHabit);
    },

    progressMicroHabit: (microHabitId: string) => {
      // Track progress on micro habit and determine when to scale up
      console.log('Progressing micro habit:', microHabitId);
    },

    calculateTrendData: (habitId: string, period: 'week' | 'month' | 'quarter'): TrendData => {
      // This would integrate with actual progress data
      const now = new Date();
      const startDate = new Date();
      
      if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (period === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else {
        startDate.setMonth(now.getMonth() - 3);
      }

      // Mock data - would calculate from real progress
      return {
        habitId,
        period,
        startDate: startDate.toISOString().split('T')[0],
        endDate: now.toISOString().split('T')[0],
        completionRate: 75,
        totalDays: period === 'week' ? 7 : period === 'month' ? 30 : 90,
        completedDays: period === 'week' ? 5 : period === 'month' ? 22 : 67,
        missedDays: period === 'week' ? 2 : period === 'month' ? 8 : 23,
        trend: 'improving',
        trendPercentage: 15,
        consistencyScore: 80,
        longestStreak: 5,
        totalStreaks: 3,
        averageGapBetweenMisses: 2.5
      };
    },

    generateRecoveryInsights: (habitId: string): RecoveryInsight[] => {
      // Would analyze actual progress data to generate personalized insights
      return [
        {
          id: `insight_${Date.now()}`,
          habitId,
          type: 'pattern_detected',
          title: 'Monday struggles detected',
          description: 'You tend to miss this habit on Mondays. Consider adjusting your Monday routine or doing a micro-version.',
          actionable: true,
          suggestedActions: [
            'Set up Sunday evening prep',
            'Use micro-habit on Mondays only',
            'Change Monday timing'
          ],
          confidence: 85,
          basedOn: 'user_data'
        }
      ];
    },

    updateTrendData: (habitId: string, progress: Progress[]) => {
      const weeklyTrend = get().calculateTrendData(habitId, 'week');
      const monthlyTrend = get().calculateTrendData(habitId, 'month');
      
      set(state => ({
        trendData: {
          ...state.trendData,
          [habitId]: [weeklyTrend, monthlyTrend]
        }
      }));
    },

    updateRecoverySettings: (settings: Partial<RecoverySettings>) => {
      set(state => ({
        recoverySettings: { ...state.recoverySettings, ...settings }
      }));
    },

    getRecoveryMetrics: () => {
      return get().recoveryMetrics;
    },

    logCompassionEvent: (event: CompassionEvent) => {
      set(state => ({
        recentCompassionEvents: [event, ...state.recentCompassionEvents.slice(0, 9)]
      }));
    },

    getRelevantResearchForSituation: (contextTriggers: string[]) => {
      return getRelevantResearch(contextTriggers);
    },

    getConsecutiveMissCount: (habitId: string, progress: Progress[]): number => {
      // Would calculate actual consecutive misses from progress data
      return 0; // Mock implementation
    },

    getLastCompletionDate: (habitId: string, progress: Progress[]): string | null => {
      // Would find last completion date from progress data
      return null; // Mock implementation
    },

    isInRecoverySession: (habitId: string): boolean => {
      const state = get();
      return state.activeRecoverySessions.some(
        session => session.habitId === habitId && !session.completed
      );
    },

    getActiveRecoverySession: (habitId: string): RecoverySession | null => {
      const state = get();
      return state.activeRecoverySessions.find(
        session => session.habitId === habitId && !session.completed
      ) || null;
    },

    initializeRecoverySystem: () => {
      // Initialize any necessary recovery system components
      console.log('Recovery system initialized');
    }
  }))
);

// Helper functions
function calculateAverageRecoveryTime(metrics: any, completedSession: RecoverySession): number {
  const sessionDuration = Math.ceil(
    (new Date().getTime() - new Date(completedSession.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  const totalSessions = metrics.successfulRecoveries + 1;
  const totalTime = (metrics.averageRecoveryTime * metrics.successfulRecoveries) + sessionDuration;
  
  return totalTime / totalSessions;
}

// Subscribe to changes and trigger actions
useRecoveryStore.subscribe(
  (state) => state.activeRecoverySessions,
  (sessions) => {
    // Could trigger notifications or other side effects
    console.log('Active recovery sessions updated:', sessions.length);
  }
);

export default useRecoveryStore;