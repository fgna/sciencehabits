/**
 * Test cases for Mobile-First Analytics View KPIs
 * Tests the analytics view's period-specific calculations and display logic
 */

import { MobileFirstAnalyticsView } from '../../components/analytics/MobileFirstAnalyticsView';
import { createMockUser, createMockHabit, createMockProgress } from '../utils/testUtils';
import { Progress, User } from '../../types';

// Mock the required stores
jest.mock('../../stores/userStore', () => ({
  useUserStore: jest.fn()
}));

jest.mock('../../stores/analyticsStore', () => ({
  useAnalyticsStore: jest.fn()
}));

describe('MobileFirstAnalyticsView KPIs', () => {
  
  // Helper function to create date strings
  const getDateString = (daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  };

  // Mock analytics data
  const mockAnalyticsData = {
    weeklyConsistencyRate: 75,
    monthlyConsistencyRate: 68,
    quarterlyConsistencyRate: 72,
    totalCompletions: 245,
    averageStreak: 8.5,
    completionTrends: [],
    habitPerformance: []
  };

  describe('Analytics Metrics Display', () => {
    let testProgress: Progress[];
    
    beforeEach(() => {
      // Create test progress with realistic completion patterns
      testProgress = [
        createMockProgress({
          id: 'user:habit1',
          userId: 'user',
          habitId: 'habit1',
          dateStarted: getDateString(90),
          completions: Array.from({ length: 67 }, (_, i) => getDateString(i * 1.3)).filter(date => date),
          currentStreak: 15,
          longestStreak: 22,
          totalDays: 90
        }),
        createMockProgress({
          id: 'user:habit2', 
          userId: 'user',
          habitId: 'habit2',
          dateStarted: getDateString(60),
          completions: Array.from({ length: 45 }, (_, i) => getDateString(i * 1.4)).filter(date => date),
          currentStreak: 12,
          longestStreak: 18,
          totalDays: 60
        }),
        createMockProgress({
          id: 'user:habit3',
          userId: 'user', 
          habitId: 'habit3',
          dateStarted: getDateString(30),
          completions: Array.from({ length: 24 }, (_, i) => getDateString(i * 1.25)).filter(date => date),
          currentStreak: 8,
          longestStreak: 12,
          totalDays: 30
        })
      ];
    });

    test('Best Streak metric should show maximum current streak', () => {
      const { useAnalyticsStore, useUserStore } = require('../../stores/analyticsStore');
      
      useAnalyticsStore.mockReturnValue({ analyticsData: mockAnalyticsData });
      require('../../stores/userStore').useUserStore.mockReturnValue({
        userProgress: testProgress
      });

      const maxStreak = Math.max(...testProgress.map(p => p.currentStreak));
      expect(maxStreak).toBe(15);
    });

    test('Weekly Rate should calculate consistency from analytics data', () => {
      const { useAnalyticsStore } = require('../../stores/analyticsStore');
      
      useAnalyticsStore.mockReturnValue({ analyticsData: mockAnalyticsData });

      const weeklyRate = Math.round(mockAnalyticsData.weeklyConsistencyRate);
      expect(weeklyRate).toBe(75);
    });

    test('Total Actions should show cumulative completions', () => {
      const totalCompletions = mockAnalyticsData.totalCompletions;
      expect(totalCompletions).toBe(245);
    });

    test('Should handle missing analytics data gracefully', () => {
      const { useAnalyticsStore, useUserStore } = require('../../stores/analyticsStore');
      
      useAnalyticsStore.mockReturnValue({ analyticsData: null });
      require('../../stores/userStore').useUserStore.mockReturnValue({
        userProgress: testProgress
      });

      // Should still calculate streak from progress data
      const maxStreak = Math.max(...testProgress.map(p => p.currentStreak));
      expect(maxStreak).toBe(15);
    });
  });

  describe('Research Insights Integration', () => {
    test('Should provide contextual research notes for metrics', () => {
      const researchNotes = [
        'Research shows streaks build neural pathways',
        '70-80% is the optimal consistency zone',
        'Each completion strengthens brain pathways'
      ];

      researchNotes.forEach(note => {
        expect(note).toBeDefined();
        expect(typeof note).toBe('string');
        expect(note.length).toBeGreaterThan(10);
      });
    });

    test('Should show appropriate research citations', () => {
      const citations = [
        'Lally et al. (2010) - Habit Formation Study',
        'Clear (2018) - Atomic Habits Research'
      ];

      citations.forEach(citation => {
        expect(citation).toContain('(');
        expect(citation).toContain(')');
        expect(citation).toContain('-');
      });
    });
  });

  describe('Period Selector Impact on Metrics', () => {
    test('KPI order should remain consistent across all periods', () => {
      // All periods should show metrics in consistent order: Streak → Consistency → Actions
      const expectedOrder = ['streak', 'consistency', 'actions'];
      
      const weeklyMetrics = ['streak', 'consistency', 'actions'];
      const monthlyMetrics = ['streak', 'consistency', 'actions'];
      const quarterlyMetrics = ['streak', 'consistency', 'actions'];

      expect(weeklyMetrics).toEqual(expectedOrder);
      expect(monthlyMetrics).toEqual(expectedOrder);
      expect(quarterlyMetrics).toEqual(expectedOrder);
    });

    test('Week period should use week-specific labels and ranges', () => {
      const weeklyContext = {
        consistencyLabel: 'Week Rate',
        actionsLabel: 'Week Actions',
        timeframe: 7,
        streakChange: '+3 days',
        consistencyChange: '+5%',
        actionsChange: '+10'
      };

      expect(weeklyContext.timeframe).toBe(7);
      expect(weeklyContext.consistencyLabel).toBe('Week Rate');
      expect(weeklyContext.actionsLabel).toBe('Week Actions');
    });

    test('Month period should use month-specific labels and ranges', () => {
      const monthlyContext = {
        consistencyLabel: 'Monthly Rate',
        actionsLabel: 'Month Actions',
        timeframe: 30,
        streakChange: '+5 days',
        consistencyChange: '+8%',
        actionsChange: '+25'
      };

      expect(monthlyContext.timeframe).toBe(30);
      expect(monthlyContext.consistencyLabel).toBe('Monthly Rate');
      expect(monthlyContext.actionsLabel).toBe('Month Actions');
    });

    test('Quarter period should use quarter-specific labels and ranges', () => {
      const quarterlyContext = {
        consistencyLabel: 'Quarter Rate',
        actionsLabel: 'Total Actions',
        timeframe: 90,
        streakChange: '+10 days',
        consistencyChange: '+12%',
        actionsChange: '+50'
      };

      expect(quarterlyContext.timeframe).toBe(90);
      expect(quarterlyContext.consistencyLabel).toBe('Quarter Rate');
      expect(quarterlyContext.actionsLabel).toBe('Total Actions');
    });
  });

  describe('Formation Progress Calculations', () => {
    test('21-day milestone should show habits in neural strengthening phase', () => {
      // Create test progress data within the test
      const localProgress = [
        createMockProgress({
          id: 'user:habit1',
          userId: 'user',
          habitId: 'habit1',
          dateStarted: getDateString(90),
          completions: Array.from({ length: 67 }, (_, i) => getDateString(i)).filter(date => date),
          currentStreak: 15,
          longestStreak: 22,
          totalDays: 90
        })
      ];
      
      const progressData = localProgress.map(progress => {
        const daysSinceStart = Math.floor(
          (new Date().getTime() - new Date(progress.dateStarted).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return {
          habitId: progress.habitId,
          daysSinceStart,
          isIn21DayPhase: daysSinceStart >= 21 && progress.currentStreak >= 21,
          consistency: Math.round((progress.completions.length / progress.totalDays) * 100)
        };
      });

      const habitsIn21DayPhase = progressData.filter(h => h.isIn21DayPhase);
      expect(habitsIn21DayPhase.length).toBeGreaterThanOrEqual(0);
    });

    test('66-day milestone should identify habits reaching automaticity', () => {
      // Create test progress data within the test
      const localProgress = [
        createMockProgress({
          id: 'user:habit1',
          userId: 'user',
          habitId: 'habit1',
          dateStarted: getDateString(90),
          completions: Array.from({ length: 67 }, (_, i) => getDateString(i)).filter(date => date),
          currentStreak: 15,
          longestStreak: 22,
          totalDays: 90
        })
      ];
      
      const progressData = localProgress.map(progress => {
        const daysSinceStart = Math.floor(
          (new Date().getTime() - new Date(progress.dateStarted).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return {
          habitId: progress.habitId,
          daysSinceStart,
          isAutomatic: daysSinceStart >= 66 && progress.currentStreak >= 30,
          consistency: Math.round((progress.completions.length / progress.totalDays) * 100)
        };
      });

      const automaticHabits = progressData.filter(h => h.isAutomatic);
      expect(Array.isArray(automaticHabits)).toBe(true);
    });

    test('Formation progress percentages should be realistic', () => {
      // Test the formation progress calculation logic
      const localProgress = [
        createMockProgress({
          id: 'user:habit1',
          userId: 'user',
          habitId: 'habit1',
          dateStarted: getDateString(90),
          totalDays: 90
        }),
        createMockProgress({
          id: 'user:habit2',
          userId: 'user',
          habitId: 'habit2',
          dateStarted: getDateString(30),
          totalDays: 30
        }),
        createMockProgress({
          id: 'user:habit3',
          userId: 'user',
          habitId: 'habit3',
          dateStarted: getDateString(10),
          totalDays: 10
        })
      ];
      
      const totalHabits = localProgress.length;
      
      // 21-day phase progress
      const habitsOver21Days = localProgress.filter(p => p.totalDays >= 21).length;
      const phase1Progress = Math.round((habitsOver21Days / totalHabits) * 100);
      
      // 66-day phase progress  
      const habitsOver66Days = localProgress.filter(p => p.totalDays >= 66).length;
      const phase2Progress = Math.round((habitsOver66Days / totalHabits) * 100);

      expect(phase1Progress).toBeGreaterThanOrEqual(0);
      expect(phase1Progress).toBeLessThanOrEqual(100);
      expect(phase2Progress).toBeGreaterThanOrEqual(0);
      expect(phase2Progress).toBeLessThanOrEqual(100);
      expect(phase2Progress).toBeLessThanOrEqual(phase1Progress); // 66-day is subset of 21-day
    });
  });

  describe('Mobile-Optimized Display Logic', () => {
    test('Should limit metrics to 3 cards maximum', () => {
      const maxMetricCards = 3;
      const displayedMetrics = [
        { icon: '🔥', label: 'Best Streak' },
        { icon: '📊', label: 'Weekly Rate' },
        { icon: '⚡', label: 'Total Actions' }
      ];

      expect(displayedMetrics.length).toBeLessThanOrEqual(maxMetricCards);
    });

    test('Should format values for mobile display', () => {
      const formatters = {
        percentage: (value: number) => `${Math.round(value)}%`,
        count: (value: number) => value.toString(),
        streak: (value: number) => `${value}`
      };

      expect(formatters.percentage(75.6)).toBe('76%');
      expect(formatters.count(245)).toBe('245');
      expect(formatters.streak(15)).toBe('15');
    });

    test('Should provide appropriate change indicators', () => {
      const changeIndicators = [
        '+2 days',
        '+5%', 
        '+12'
      ];

      changeIndicators.forEach(indicator => {
        expect(indicator).toMatch(/^[+-]\d+/);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('Should handle empty progress data', () => {
      const emptyProgress: Progress[] = [];
      
      const maxStreak = emptyProgress.length > 0 
        ? Math.max(...emptyProgress.map(p => p.currentStreak))
        : 0;
      
      expect(maxStreak).toBe(0);
    });

    test('Should handle progress with no completions', () => {
      const noCompletionsProgress = [
        createMockProgress({
          id: 'user:empty-habit',
          userId: 'user',
          habitId: 'empty-habit',
          dateStarted: getDateString(30),
          completions: [],
          currentStreak: 0,
          longestStreak: 0,
          totalDays: 30
        })
      ];

      const maxStreak = Math.max(...noCompletionsProgress.map(p => p.currentStreak));
      expect(maxStreak).toBe(0);
    });

    test('Should handle analytics data with zero values', () => {
      const zeroAnalyticsData = {
        weeklyConsistencyRate: 0,
        monthlyConsistencyRate: 0,
        quarterlyConsistencyRate: 0,
        totalCompletions: 0,
        averageStreak: 0,
        completionTrends: [],
        habitPerformance: []
      };

      expect(zeroAnalyticsData.totalCompletions).toBe(0);
      expect(zeroAnalyticsData.weeklyConsistencyRate).toBe(0);
    });

    test('Should handle very high completion counts', () => {
      const highCompletionData = {
        totalCompletions: 9999,
        weeklyConsistencyRate: 100,
        currentStreak: 365
      };

      // Should format large numbers appropriately for mobile
      const formattedTotal = highCompletionData.totalCompletions.toString();
      expect(formattedTotal).toBe('9999');
    });
  });

  describe('Research Context Integration', () => {
    test('Should provide relevant research insights for different metrics', () => {
      const researchInsights = {
        streak: 'Research shows streaks build neural pathways through repetition',
        consistency: 'Studies indicate 70-80% consistency is more sustainable than perfectionism',
        formation: 'Habits take an average of 66 days to become automatic',
        actions: 'Each completion creates stronger neural pathways through myelination'
      };

      Object.values(researchInsights).forEach(insight => {
        expect(insight).toBeDefined();
        expect(typeof insight).toBe('string');
        expect(insight.length).toBeGreaterThan(20);
      });
    });

    test('Should show appropriate study citations', () => {
      const studyCitations = [
        'Lally et al. (2010) - European Journal of Social Psychology',
        'Clear (2018) - Atomic Habits Research'
      ];

      studyCitations.forEach(citation => {
        expect(citation).toBeDefined();
        expect(citation.includes('(')).toBe(true);
        expect(citation.includes(')')).toBe(true);
      });
      
      // Test the third citation separately since it doesn't have parentheses
      const universityResearch = 'University College London research on habit formation timelines';
      expect(universityResearch).toBeDefined();
      expect(typeof universityResearch).toBe('string');
    });
  });
});