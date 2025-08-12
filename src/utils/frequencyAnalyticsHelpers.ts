/**
 * Frequency-Aware Analytics Helpers
 * 
 * Enhanced analytics specifically designed for non-daily habit tracking.
 * Handles daily, weekly goal, and periodic habit frequency patterns.
 */

import { Habit, Progress, HabitFrequency, WeeklyProgress } from '../types';
import { getCurrentWeekProgress, isWeeklyGoalMet, getWeekStart } from './weeklyGoalHelpers';

export interface FrequencyAnalytics {
  // Enhanced metrics for different frequency types
  frequencyBreakdown: FrequencyTypeStats[];
  weeklyGoalPerformance: WeeklyGoalStats[];
  periodicHabitStatus: PeriodicHabitStats[];
  
  // Advanced visualizations
  heatmapData: HeatmapData[];
  progressForecast: ProgressForecast[];
  
  // Frequency-specific insights
  optimalFrequencies: OptimalFrequencyInsight[];
  consistencyPatterns: ConsistencyPattern[];
}

export interface FrequencyTypeStats {
  type: 'daily' | 'weekly' | 'periodic';
  habitCount: number;
  totalPossibleCompletions: number;
  actualCompletions: number;
  successRate: number;
  averageStreak: number;
  mostSuccessful: string; // habit title
}

export interface WeeklyGoalStats {
  habitId: string;
  habitTitle: string;
  targetSessions: number;
  completedSessions: number;
  weekStart: string;
  goalMet: boolean;
  completionRate: number;
  daysAhead: number; // positive if ahead of schedule
  preferredDays: string[];
  actualDays: string[];
}

export interface PeriodicHabitStats {
  habitId: string;
  habitTitle: string;
  interval: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  intervalCount: number;
  lastCompleted: string | null;
  nextDue: string;
  isOverdue: boolean;
  daysSinceLastCompletion: number;
  successRate: number; // historical completion rate
}

export interface HeatmapData {
  date: string;
  value: number; // 0-1 representing completion intensity
  completions: number;
  totalPossible: number;
  habitBreakdown: {
    daily: number;
    weekly: number;
    periodic: number;
  };
}

export interface ProgressForecast {
  date: string;
  projected: number;
  confidence: number; // 0-1
  based_on: 'trend' | 'pattern' | 'frequency';
}

export interface OptimalFrequencyInsight {
  habitId: string;
  currentFrequency: HabitFrequency;
  suggestedFrequency: HabitFrequency;
  confidence: number;
  reasoning: string;
  expectedImprovement: number; // percentage
}

export interface ConsistencyPattern {
  habitId: string;
  patternType: 'strong' | 'moderate' | 'weak' | 'irregular';
  bestDaysOfWeek: string[];
  bestTimesOfDay: number[]; // hours
  consistencyScore: number; // 0-100
  recommendations: string[];
}

/**
 * Calculate comprehensive frequency-aware analytics
 */
export function calculateFrequencyAnalytics(
  habits: Habit[],
  progress: Progress[],
  dateRange: { start: Date; end: Date }
): FrequencyAnalytics {
  const frequencyBreakdown = calculateFrequencyBreakdown(habits, progress, dateRange);
  const weeklyGoalPerformance = calculateWeeklyGoalPerformance(habits, progress, dateRange);
  const periodicHabitStatus = calculatePeriodicHabitStatus(habits, progress, dateRange);
  const heatmapData = calculateHeatmapData(habits, progress, dateRange);
  const progressForecast = calculateProgressForecast(habits, progress, dateRange);
  const optimalFrequencies = analyzeOptimalFrequencies(habits, progress, dateRange);
  const consistencyPatterns = analyzeConsistencyPatterns(habits, progress, dateRange);

  return {
    frequencyBreakdown,
    weeklyGoalPerformance,
    periodicHabitStatus,
    heatmapData,
    progressForecast,
    optimalFrequencies,
    consistencyPatterns
  };
}

/**
 * Calculate performance metrics by frequency type
 */
function calculateFrequencyBreakdown(
  habits: Habit[],
  progress: Progress[],
  dateRange: { start: Date; end: Date }
): FrequencyTypeStats[] {
  const frequencyTypes: ('daily' | 'weekly' | 'periodic')[] = ['daily', 'weekly', 'periodic'];
  
  return frequencyTypes.map(type => {
    const typeHabits = habits.filter(h => h.frequency.type === type);
    const typeProgress = progress.filter(p => 
      typeHabits.some(h => h.id === p.habitId)
    );

    let totalPossible = 0;
    let actualCompletions = 0;
    let totalStreak = 0;
    let mostSuccessfulHabit = '';
    let bestSuccessRate = 0;

    typeHabits.forEach(habit => {
      const habitProgress = typeProgress.filter(p => p.habitId === habit.id)[0];
      if (!habitProgress) return;

      // Calculate possible completions based on frequency
      const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      
      let possibleForHabit = 0;
      if (type === 'daily') {
        possibleForHabit = daysDiff;
      } else if (type === 'weekly' && habit.frequency.weeklyTarget) {
        const weeks = Math.ceil(daysDiff / 7);
        possibleForHabit = weeks * habit.frequency.weeklyTarget.sessionsPerWeek;
      } else if (type === 'periodic' && habit.frequency.periodicTarget) {
        // For periodic habits, calculate how many intervals fit in the date range
        const intervalDays = getIntervalDays(habit.frequency.periodicTarget.interval);
        possibleForHabit = Math.floor(daysDiff / intervalDays);
      }

      const completionsInRange = habitProgress.completions.filter(date => {
        const compDate = new Date(date);
        return compDate >= dateRange.start && compDate <= dateRange.end;
      }).length;

      totalPossible += possibleForHabit;
      actualCompletions += completionsInRange;
      totalStreak += habitProgress.currentStreak || 0;

      // Track most successful habit
      const successRate = possibleForHabit > 0 ? completionsInRange / possibleForHabit : 0;
      if (successRate > bestSuccessRate) {
        bestSuccessRate = successRate;
        mostSuccessfulHabit = habit.title;
      }
    });

    return {
      type,
      habitCount: typeHabits.length,
      totalPossibleCompletions: totalPossible,
      actualCompletions,
      successRate: totalPossible > 0 ? actualCompletions / totalPossible : 0,
      averageStreak: typeHabits.length > 0 ? totalStreak / typeHabits.length : 0,
      mostSuccessful: mostSuccessfulHabit || 'None'
    };
  });
}

/**
 * Calculate weekly goal performance metrics
 */
function calculateWeeklyGoalPerformance(
  habits: Habit[],
  progress: Progress[],
  dateRange: { start: Date; end: Date }
): WeeklyGoalStats[] {
  const weeklyHabits = habits.filter(h => h.frequency.type === 'weekly');
  const stats: WeeklyGoalStats[] = [];

  weeklyHabits.forEach(habit => {
    if (!habit.frequency.weeklyTarget) return;

    const habitProgress = progress.find(p => p.habitId === habit.id);
    if (!habitProgress) return;

    // Get weeks that fall within our date range
    const weeks = getWeeksInRange(dateRange.start, dateRange.end);
    
    weeks.forEach(weekStart => {
      const weekProgress = getCurrentWeekProgress(
        habitProgress.weeklyProgress || [], 
        new Date(weekStart)
      );

      const completedSessions = weekProgress?.completedSessions || 0;
      const targetSessions = habit.frequency.weeklyTarget!.sessionsPerWeek;
      const goalMet = isWeeklyGoalMet(
        habitProgress.weeklyProgress || [], 
        targetSessions, 
        new Date(weekStart)
      );

      // Calculate how many days ahead/behind schedule
      const dayOfWeek = new Date().getDay();
      const expectedByNow = Math.floor((dayOfWeek / 7) * targetSessions);
      const daysAhead = completedSessions - expectedByNow;

      stats.push({
        habitId: habit.id,
        habitTitle: habit.title,
        targetSessions,
        completedSessions,
        weekStart,
        goalMet,
        completionRate: targetSessions > 0 ? completedSessions / targetSessions : 0,
        daysAhead,
        preferredDays: habit.frequency.weeklyTarget?.preferredDays || [],
        actualDays: weekProgress?.completedDates || []
      });
    });
  });

  return stats;
}

/**
 * Calculate periodic habit status and metrics
 */
function calculatePeriodicHabitStatus(
  habits: Habit[],
  progress: Progress[],
  dateRange: { start: Date; end: Date }
): PeriodicHabitStats[] {
  const periodicHabits = habits.filter(h => h.frequency.type === 'periodic');
  
  return periodicHabits.map(habit => {
    if (!habit.frequency.periodicTarget) {
      return {
        habitId: habit.id,
        habitTitle: habit.title,
        interval: 'quarterly',
        intervalCount: 1,
        lastCompleted: null,
        nextDue: new Date().toISOString().split('T')[0],
        isOverdue: false,
        daysSinceLastCompletion: 0,
        successRate: 0
      };
    }

    const habitProgress = progress.find(p => p.habitId === habit.id);
    const completions = habitProgress?.completions || [];
    
    const lastCompleted = completions.length > 0 
      ? completions[completions.length - 1] 
      : null;

    const nextDue = calculateNextDueDate(
      lastCompleted ? new Date(lastCompleted) : null,
      habit.frequency.periodicTarget
    );

    const now = new Date();
    const isOverdue = nextDue < now;
    
    const daysSinceLastCompletion = lastCompleted 
      ? Math.floor((now.getTime() - new Date(lastCompleted).getTime()) / (1000 * 60 * 60 * 24))
      : Infinity;

    // Calculate historical success rate
    const intervalDays = getIntervalDays(habit.frequency.periodicTarget.interval);
    // Use a reasonable fallback since createdAt is not available in the Habit interface
    const fallbackCreationDate = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000)); // 90 days ago
    const daysSinceCreation = Math.floor((now.getTime() - fallbackCreationDate.getTime()) / (1000 * 60 * 60 * 24));
    const expectedCompletions = Math.floor(daysSinceCreation / intervalDays);
    const successRate = expectedCompletions > 0 ? completions.length / expectedCompletions : 0;

    return {
      habitId: habit.id,
      habitTitle: habit.title,
      interval: habit.frequency.periodicTarget.interval,
      intervalCount: habit.frequency.periodicTarget.intervalCount,
      lastCompleted,
      nextDue: nextDue.toISOString().split('T')[0],
      isOverdue,
      daysSinceLastCompletion,
      successRate: Math.min(successRate, 1) // Cap at 100%
    };
  });
}

/**
 * Generate heatmap data for calendar visualization
 */
function calculateHeatmapData(
  habits: Habit[],
  progress: Progress[],
  dateRange: { start: Date; end: Date }
): HeatmapData[] {
  const heatmapData: HeatmapData[] = [];
  const currentDate = new Date(dateRange.start);

  while (currentDate <= dateRange.end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    
    let totalPossible = 0;
    let totalCompletions = 0;
    const habitBreakdown = { daily: 0, weekly: 0, periodic: 0 };

    habits.forEach(habit => {
      const habitProgress = progress.find(p => p.habitId === habit.id);
      if (!habitProgress) return;

      const wasCompletedOnDate = habitProgress.completions.includes(dateStr);
      
      // Count possible completions based on frequency
      let possibleOnDate = 0;
      if (habit.frequency.type === 'daily') {
        possibleOnDate = 1;
        habitBreakdown.daily += wasCompletedOnDate ? 1 : 0;
      } else if (habit.frequency.type === 'weekly') {
        // For weekly habits, distribute target across week
        possibleOnDate = 1; // Simplified: could be completed any day
        habitBreakdown.weekly += wasCompletedOnDate ? 1 : 0;
      } else if (habit.frequency.type === 'periodic') {
        // For periodic habits, only possible on due dates
        const nextDue = calculateNextDueDate(
          habitProgress.completions.length > 0 
            ? new Date(habitProgress.completions[habitProgress.completions.length - 1])
            : null,
          habit.frequency.periodicTarget!
        );
        
        if (nextDue.toISOString().split('T')[0] === dateStr) {
          possibleOnDate = 1;
          habitBreakdown.periodic += wasCompletedOnDate ? 1 : 0;
        }
      }

      totalPossible += possibleOnDate;
      totalCompletions += wasCompletedOnDate ? 1 : 0;
    });

    heatmapData.push({
      date: dateStr,
      value: totalPossible > 0 ? totalCompletions / totalPossible : 0,
      completions: totalCompletions,
      totalPossible,
      habitBreakdown
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return heatmapData;
}

/**
 * Generate progress forecast based on current trends
 */
function calculateProgressForecast(
  habits: Habit[],
  progress: Progress[],
  dateRange: { start: Date; end: Date }
): ProgressForecast[] {
  // Simplified implementation - can be enhanced with ML algorithms
  const forecast: ProgressForecast[] = [];
  const forecastDays = 30; // Forecast next 30 days
  
  // Calculate recent trends
  const recentCompletions = progress.flatMap(p => 
    p.completions.slice(-14) // Last 14 days
  ).length;
  
  const dailyAverage = recentCompletions / 14;
  
  const startForecast = new Date(dateRange.end);
  startForecast.setDate(startForecast.getDate() + 1);
  
  for (let i = 0; i < forecastDays; i++) {
    const forecastDate = new Date(startForecast);
    forecastDate.setDate(forecastDate.getDate() + i);
    
    // Simple trend-based projection
    const projected = Math.min(dailyAverage + (Math.random() - 0.5) * 0.5, habits.length);
    const confidence = Math.max(0.3, 1 - (i / forecastDays) * 0.7); // Decreasing confidence
    
    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      projected: Math.max(0, projected),
      confidence,
      based_on: 'trend'
    });
  }
  
  return forecast;
}

/**
 * Analyze optimal frequencies for habits based on success patterns
 */
function analyzeOptimalFrequencies(
  habits: Habit[],
  progress: Progress[],
  dateRange: { start: Date; end: Date }
): OptimalFrequencyInsight[] {
  // Simplified implementation - analyze current vs optimal frequency
  return habits.map(habit => {
    const habitProgress = progress.find(p => p.habitId === habit.id);
    if (!habitProgress) {
      return {
        habitId: habit.id,
        currentFrequency: habit.frequency,
        suggestedFrequency: habit.frequency,
        confidence: 0,
        reasoning: 'Insufficient data',
        expectedImprovement: 0
      };
    }

    // Analyze completion patterns to suggest optimal frequency
    const completions = habitProgress.completions.length;
    // Use a reasonable fallback since createdAt is not available in the Habit interface
    const fallbackCreationDate = new Date(new Date().getTime() - (90 * 24 * 60 * 60 * 1000)); // 90 days ago
    const daysSinceCreation = Math.floor(
      (new Date().getTime() - fallbackCreationDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const currentRate = daysSinceCreation > 0 ? completions / daysSinceCreation : 0;
    
    // Simple heuristic: if success rate is very low, suggest lower frequency
    let suggestedFrequency = habit.frequency;
    let reasoning = 'Current frequency appears optimal';
    let expectedImprovement = 0;
    
    if (habit.frequency.type === 'daily' && currentRate < 0.5) {
      suggestedFrequency = {
        type: 'weekly',
        weeklyTarget: {
          sessionsPerWeek: Math.max(1, Math.ceil(currentRate * 7)),
          allowFlexibleDays: true
        }
      };
      reasoning = 'Low daily completion rate suggests weekly goals might be more achievable';
      expectedImprovement = 0.3;
    }
    
    return {
      habitId: habit.id,
      currentFrequency: habit.frequency,
      suggestedFrequency,
      confidence: completions > 10 ? 0.7 : 0.3,
      reasoning,
      expectedImprovement
    };
  });
}

/**
 * Analyze consistency patterns for habits
 */
function analyzeConsistencyPatterns(
  habits: Habit[],
  progress: Progress[],
  dateRange: { start: Date; end: Date }
): ConsistencyPattern[] {
  return habits.map(habit => {
    const habitProgress = progress.find(p => p.habitId === habit.id);
    if (!habitProgress || habitProgress.completions.length < 5) {
      return {
        habitId: habit.id,
        patternType: 'irregular',
        bestDaysOfWeek: [],
        bestTimesOfDay: [],
        consistencyScore: 0,
        recommendations: ['Complete more sessions to identify patterns']
      };
    }

    // Analyze day-of-week patterns
    const dayOfWeekCounts = habitProgress.completions.reduce((acc, date) => {
      const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
      acc[dayName] = (acc[dayName] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bestDaysOfWeek = Object.entries(dayOfWeekCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([day]) => day);

    // Calculate consistency score (simplified)
    // Use a reasonable fallback since createdAt is not available in the Habit interface
    const fallbackCreationDate = new Date(new Date().getTime() - (90 * 24 * 60 * 60 * 1000)); // 90 days ago
    const totalDaysPossible = Math.ceil(
      (new Date().getTime() - fallbackCreationDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const consistencyScore = Math.min(100, (habitProgress.completions.length / totalDaysPossible) * 100);

    const patternType = consistencyScore > 80 ? 'strong' :
                       consistencyScore > 60 ? 'moderate' :
                       consistencyScore > 30 ? 'weak' : 'irregular';

    const recommendations = [];
    if (bestDaysOfWeek.length > 0) {
      recommendations.push(`You're most consistent on ${bestDaysOfWeek.join(', ')}`);
    }
    if (consistencyScore < 50) {
      recommendations.push('Try setting up reminders for better consistency');
    }

    return {
      habitId: habit.id,
      patternType,
      bestDaysOfWeek,
      bestTimesOfDay: [9, 18], // Simplified - could analyze actual times
      consistencyScore: Math.round(consistencyScore),
      recommendations
    };
  });
}

/**
 * Helper functions
 */
function getIntervalDays(interval: 'weekly' | 'monthly' | 'quarterly' | 'yearly'): number {
  switch (interval) {
    case 'weekly': return 7;
    case 'monthly': return 30;
    case 'quarterly': return 90;
    case 'yearly': return 365;
    default: return 30;
  }
}

function calculateNextDueDate(
  lastCompletion: Date | null,
  periodicTarget: NonNullable<HabitFrequency['periodicTarget']>
): Date {
  const baseDate = lastCompletion || new Date();
  const nextDue = new Date(baseDate);
  
  const intervalDays = getIntervalDays(periodicTarget.interval);
  nextDue.setDate(nextDue.getDate() + intervalDays * periodicTarget.intervalCount);
  
  return nextDue;
}

function getWeeksInRange(start: Date, end: Date): string[] {
  const weeks: string[] = [];
  const currentDate = new Date(start);
  
  while (currentDate <= end) {
    weeks.push(getWeekStart(currentDate));
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  return weeks;
}