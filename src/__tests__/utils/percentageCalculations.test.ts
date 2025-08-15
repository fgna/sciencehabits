/**
 * Comprehensive test cases for percentage calculations
 * Tests ensure that values never exceed 100% through proper logic, not artificial caps
 */

import { calculateAnalytics } from '../../utils/analyticsHelpers';
import { Progress, Habit } from '../../types';

describe('Percentage Calculation Logic', () => {
  
  // Test data setup
  const mockHabits: Habit[] = [
    {
      id: 'habit1',
      title: 'Morning Exercise',
      description: 'Daily workout',
      category: 'fitness',
      frequency: 'daily',
      timeOfDay: 'morning',
      isActive: true,
      createdAt: '2024-01-01',
      isCustom: false
    },
    {
      id: 'habit2', 
      title: 'Reading',
      description: 'Read for 30 minutes',
      category: 'learning',
      frequency: 'daily',
      timeOfDay: 'evening',
      isActive: true,
      createdAt: '2024-01-01',
      isCustom: false
    }
  ];

  describe('Completion Rate Calculations', () => {
    test('should never exceed 100% for perfect daily completion', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-08'); // 8 days
      
      // Perfect completion: 1 completion per day for 7 days (habit started on day 1)
      const perfectProgress: Progress[] = [
        {
          habitId: 'habit1',
          dateStarted: '2024-01-01',
          completions: [
            '2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04',
            '2024-01-05', '2024-01-06', '2024-01-07'
          ],
          currentStreak: 7,
          longestStreak: 7,
          totalDays: 7
        }
      ];

      const analytics = calculateAnalytics(perfectProgress, mockHabits, startDate, endDate);
      
      // Should be exactly 100%, not more
      expect(analytics.overallCompletionRate).toBeLessThanOrEqual(100);
      expect(analytics.overallCompletionRate).toBeGreaterThan(85); // Should be high for perfect completion
      
      // Weekly consistency should also be reasonable
      expect(analytics.weeklyConsistencyRate).toBeLessThanOrEqual(100);
    });

    test('should handle habits started mid-period correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-15'); // 15 days total
      
      // Habit started on day 8, perfect completion from then
      const midPeriodProgress: Progress[] = [
        {
          habitId: 'habit1',
          dateStarted: '2024-01-08', // Started mid-period
          completions: [
            '2024-01-08', '2024-01-09', '2024-01-10', '2024-01-11',
            '2024-01-12', '2024-01-13', '2024-01-14'
          ],
          currentStreak: 7,
          longestStreak: 7,
          totalDays: 7
        }
      ];

      const analytics = calculateAnalytics(midPeriodProgress, mockHabits, startDate, endDate);
      
      // Should be 100% for the days it was active (7 days), not based on full 15-day period
      expect(analytics.overallCompletionRate).toBeLessThanOrEqual(100);
      expect(analytics.overallCompletionRate).toBeGreaterThan(90); // Should be very high
    });

    test('should handle multiple habits with different start dates', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10');
      
      const multiHabitProgress: Progress[] = [
        {
          habitId: 'habit1',
          dateStarted: '2024-01-01',
          completions: ['2024-01-01', '2024-01-02', '2024-01-03'], // 3/9 days
          currentStreak: 0,
          longestStreak: 3,
          totalDays: 9
        },
        {
          habitId: 'habit2',
          dateStarted: '2024-01-05', // Started later  
          completions: ['2024-01-05', '2024-01-06', '2024-01-07', '2024-01-08', '2024-01-09'], // 5/5 days
          currentStreak: 5,
          longestStreak: 5,
          totalDays: 5
        }
      ];

      const analytics = calculateAnalytics(multiHabitProgress, mockHabits, startDate, endDate);
      
      // Overall rate should be reasonable average
      expect(analytics.overallCompletionRate).toBeLessThanOrEqual(100);
      expect(analytics.overallCompletionRate).toBeGreaterThan(0);
      
      // Individual habit performance should be calculated correctly
      analytics.habitPerformance.forEach(habit => {
        expect(habit.completionRate).toBeLessThanOrEqual(100);
        expect(habit.completionRate).toBeGreaterThanOrEqual(0);
      });
    });

    test('should handle edge case: more completions than days (impossible scenario)', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-03'); // Only 3 days
      
      // Artificially create impossible scenario with too many completions
      const impossibleProgress: Progress[] = [
        {
          habitId: 'habit1',
          dateStarted: '2024-01-01',
          completions: [
            '2024-01-01', '2024-01-02', '2024-01-03',
            '2024-01-01', '2024-01-02' // Duplicates (shouldn't happen in real app)
          ],
          currentStreak: 3,
          longestStreak: 3,
          totalDays: 2 // This totalDays is incorrect
        }
      ];

      const analytics = calculateAnalytics(impossibleProgress, mockHabits, startDate, endDate);
      
      // Even with bad data, should never exceed 100%
      expect(analytics.overallCompletionRate).toBeLessThanOrEqual(100);
      analytics.habitPerformance.forEach(habit => {
        expect(habit.completionRate).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Weekly Consistency Calculations', () => {
    test('should handle partial weeks correctly', () => {
      const startDate = new Date('2024-01-03'); // Wednesday
      const endDate = new Date('2024-01-07'); // Sunday (5 days)
      
      const partialWeekProgress: Progress[] = [
        {
          habitId: 'habit1',
          dateStarted: '2024-01-03',
          completions: ['2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06', '2024-01-07'], // 5/5 days
          currentStreak: 5,
          longestStreak: 5,
          totalDays: 5
        }
      ];

      const analytics = calculateAnalytics(partialWeekProgress, mockHabits, startDate, endDate);
      
      // Should be 100% for the active days, not based on full week
      expect(analytics.weeklyConsistencyRate).toBeLessThanOrEqual(100);
      expect(analytics.weeklyConsistencyRate).toBeGreaterThan(90);
    });

    test('should handle habits with different weekly targets', () => {
      const startDate = new Date('2024-01-01'); // Monday
      const endDate = new Date('2024-01-07'); // Sunday (full week)
      
      const weeklyProgress: Progress[] = [
        {
          habitId: 'habit1',
          dateStarted: '2024-01-01',
          completions: ['2024-01-01', '2024-01-03', '2024-01-05'], // 3 times in week
          currentStreak: 0,
          longestStreak: 1,
          totalDays: 7
        }
      ];

      const analytics = calculateAnalytics(weeklyProgress, mockHabits, startDate, endDate);
      
      // 3/7 days = ~43%, should be reasonable
      expect(analytics.weeklyConsistencyRate).toBeLessThanOrEqual(100);
      expect(analytics.weeklyConsistencyRate).toBeGreaterThan(0);
      expect(analytics.weeklyConsistencyRate).toBeLessThanOrEqual(50);
    });
  });

  describe('Streak and Consistency Calculations', () => {
    test('should calculate consistency score correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10');
      
      const consistentProgress: Progress[] = [
        {
          habitId: 'habit1',
          dateStarted: '2024-01-01',
          completions: ['2024-01-01', '2024-01-03', '2024-01-05', '2024-01-07', '2024-01-09'], // Every other day
          currentStreak: 0,
          longestStreak: 1,
          totalDays: 9
        }
      ];

      const analytics = calculateAnalytics(consistentProgress, mockHabits, startDate, endDate);
      
      // Consistency score should be reasonable (0-100)
      expect(analytics.consistencyScore).toBeLessThanOrEqual(100);
      expect(analytics.consistencyScore).toBeGreaterThanOrEqual(0);
    });

    test('should handle zero completions gracefully', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10');
      
      const zeroProgress: Progress[] = [
        {
          habitId: 'habit1',
          dateStarted: '2024-01-01',
          completions: [],
          currentStreak: 0,
          longestStreak: 0,
          totalDays: 0
        }
      ];

      const analytics = calculateAnalytics(zeroProgress, mockHabits, startDate, endDate);
      
      // Should handle zero completions without errors
      expect(analytics.overallCompletionRate).toBe(0);
      expect(analytics.weeklyConsistencyRate).toBe(0);
      expect(analytics.consistencyScore).toBe(0);
      
      // Should not have NaN values
      expect(analytics.overallCompletionRate).not.toBeNaN();
      expect(analytics.weeklyConsistencyRate).not.toBeNaN();
      expect(analytics.consistencyScore).not.toBeNaN();
    });
  });

  describe('Formation Milestone Calculations', () => {
    test('should calculate milestone percentages correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-03-10'); // ~70 days later
      
      const milestoneProgress: Progress[] = [
        {
          habitId: 'habit1',
          dateStarted: '2024-01-01', // 70+ days active
          completions: Array.from({length: 50}, (_, i) => 
            new Date(2024, 0, i + 1).toISOString().split('T')[0]
          ),
          currentStreak: 10,
          longestStreak: 20,
          totalDays: 70
        },
        {
          habitId: 'habit2',
          dateStarted: '2024-02-15', // ~25 days active
          completions: Array.from({length: 15}, (_, i) => 
            new Date(2024, 1, i + 15).toISOString().split('T')[0]
          ),
          currentStreak: 5,
          longestStreak: 8,
          totalDays: 25
        }
      ];

      const analytics = calculateAnalytics(milestoneProgress, mockHabits, startDate, endDate);
      
      // Formation milestone percentages should be valid
      expect(analytics.formationMilestones.day21Milestone.percentage).toBeLessThanOrEqual(100);
      expect(analytics.formationMilestones.day21Milestone.percentage).toBeGreaterThanOrEqual(0);
      
      expect(analytics.formationMilestones.day66Milestone.percentage).toBeLessThanOrEqual(100);
      expect(analytics.formationMilestones.day66Milestone.percentage).toBeGreaterThanOrEqual(0);
      
      // Should have 1 habit at 21+ days and 1 habit at 66+ days
      expect(analytics.formationMilestones.day21Milestone.habitsReached).toBeGreaterThan(0);
      expect(analytics.formationMilestones.day66Milestone.habitsReached).toBeGreaterThan(0);
    });
  });

  describe('Category Performance Calculations', () => {
    test('should calculate category averages correctly', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10');
      
      const categoryProgress: Progress[] = [
        {
          habitId: 'habit1', // fitness category
          dateStarted: '2024-01-01',
          completions: ['2024-01-01', '2024-01-02', '2024-01-03'], // 3/9 days = ~33%
          currentStreak: 0,
          longestStreak: 3,
          totalDays: 9
        },
        {
          habitId: 'habit2', // learning category
          dateStarted: '2024-01-01',
          completions: ['2024-01-01', '2024-01-02', '2024-01-03', '2024-01-04', '2024-01-05', '2024-01-06'], // 6/9 days = ~67%
          currentStreak: 0,
          longestStreak: 6,
          totalDays: 9
        }
      ];

      const analytics = calculateAnalytics(categoryProgress, mockHabits, startDate, endDate);
      
      // Category performance should be reasonable averages
      analytics.categoryPerformance.forEach(category => {
        expect(category.averageCompletionRate).toBeLessThanOrEqual(100);
        expect(category.averageCompletionRate).toBeGreaterThanOrEqual(0);
        expect(category.averageCompletionRate).not.toBeNaN();
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty progress array', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10');
      
      const analytics = calculateAnalytics([], mockHabits, startDate, endDate);
      
      expect(analytics.overallCompletionRate).toBe(0);
      expect(analytics.weeklyConsistencyRate).toBe(0);
      expect(analytics.totalCompletions).toBe(0);
      expect(analytics.activeHabitsCount).toBe(0);
    });

    test('should handle invalid date ranges', () => {
      const startDate = new Date('2024-01-10'); // After end date
      const endDate = new Date('2024-01-01');
      
      const progress: Progress[] = [
        {
          habitId: 'habit1',
          dateStarted: '2024-01-05',
          completions: ['2024-01-05'],
          currentStreak: 1,
          longestStreak: 1,
          totalDays: 1
        }
      ];

      // Should handle gracefully without throwing errors
      expect(() => {
        const analytics = calculateAnalytics(progress, mockHabits, startDate, endDate);
        expect(analytics.overallCompletionRate).toBeGreaterThanOrEqual(0);
      }).not.toThrow();
    });

    test('should handle missing dateStarted field', () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-10');
      
      const progressWithoutStartDate: Progress[] = [
        {
          habitId: 'habit1',
          dateStarted: null as any, // Missing start date
          completions: ['2024-01-05', '2024-01-06'],
          currentStreak: 2,
          longestStreak: 2,
          totalDays: 2
        }
      ];

      const analytics = calculateAnalytics(progressWithoutStartDate, mockHabits, startDate, endDate);
      
      // Should use first completion date as fallback
      expect(analytics.overallCompletionRate).toBeLessThanOrEqual(100);
      expect(analytics.overallCompletionRate).toBeGreaterThanOrEqual(0);
    });
  });
});