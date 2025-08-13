import { useMemo } from 'react';
import { Habit, Progress } from '../types';

interface TrendData {
  direction: 'up' | 'down' | 'stable';
  percentage: number;
  timeframe: string;
}

interface HabitAnalytics {
  id: string;
  title: string;
  completionRate: number;
  currentStreak: number;
  totalSessions: number;
  category?: string;
}

interface AnalyticsData {
  overallCompletionRate: number;
  longestCurrentStreak: number;
  totalSessions: number;
  totalCompletions: number;
  averageDaily: number;
  bestDay: string;
  consistencyScore: number;
  habitBreakdown: HabitAnalytics[];
  habitsTrend: TrendData;
  completionTrend: TrendData;
  streakTrend: TrendData;
  sessionsTrend: TrendData;
}

const getDaysFromTimeRange = (timeRange: string): number => {
  switch (timeRange) {
    case '7d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    default: return 30;
  }
};

const getDateRange = (days: number): string[] => {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

const calculateCompletionRate = (
  habits: Habit[], 
  progressArray: Progress[], 
  dateRange: string[]
): number => {
  if (habits.length === 0 || dateRange.length === 0) return 0;
  
  let totalPossible = 0;
  let totalCompleted = 0;
  
  habits.forEach(habit => {
    const habitProgress = progressArray.find(p => p.habitId === habit.id);
    if (!habitProgress) return;
    
    dateRange.forEach(date => {
      totalPossible++;
      if (habitProgress.completions.includes(date)) {
        totalCompleted++;
      }
    });
  });
  
  return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
};

const calculateHabitCompletionRate = (
  habitId: string,
  progressArray: Progress[],
  dateRange: string[]
): number => {
  const habitProgress = progressArray.find(p => p.habitId === habitId);
  if (!habitProgress || dateRange.length === 0) return 0;
  
  const completedInRange = habitProgress.completions.filter(date => 
    dateRange.includes(date)
  ).length;
  
  return Math.round((completedInRange / dateRange.length) * 100);
};

const getBestDay = (
  habits: Habit[],
  progressArray: Progress[],
  dateRange: string[]
): string => {
  const dayCompletions: { [date: string]: number } = {};
  
  dateRange.forEach(date => {
    dayCompletions[date] = 0;
  });
  
  habits.forEach(habit => {
    const habitProgress = progressArray.find(p => p.habitId === habit.id);
    if (!habitProgress) return;
    
    habitProgress.completions.forEach(completion => {
      if (dayCompletions[completion] !== undefined) {
        dayCompletions[completion]++;
      }
    });
  });
  
  const bestDateEntry = Object.entries(dayCompletions)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (!bestDateEntry || bestDateEntry[1] === 0) return 'None';
  
  const bestDate = new Date(bestDateEntry[0]);
  return bestDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
};

const calculateConsistencyScore = (
  habits: Habit[],
  progressArray: Progress[],
  dateRange: string[]
): number => {
  if (habits.length === 0 || dateRange.length === 0) return 0;
  
  const dailyCompletionRates: number[] = [];
  
  dateRange.forEach(date => {
    let dayCompleted = 0;
    habits.forEach(habit => {
      const habitProgress = progressArray.find(p => p.habitId === habit.id);
      if (habitProgress && habitProgress.completions.includes(date)) {
        dayCompleted++;
      }
    });
    dailyCompletionRates.push((dayCompleted / habits.length) * 100);
  });
  
  // Calculate standard deviation (lower is more consistent)
  const mean = dailyCompletionRates.reduce((sum, rate) => sum + rate, 0) / dailyCompletionRates.length;
  const variance = dailyCompletionRates.reduce((sum, rate) => sum + Math.pow(rate - mean, 2), 0) / dailyCompletionRates.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Convert to consistency score (0-100, higher is better)
  const maxPossibleStdDev = 50; // Theoretical max
  const consistencyScore = Math.max(0, Math.round((1 - standardDeviation / maxPossibleStdDev) * 100));
  
  return consistencyScore;
};

const calculateTrends = (
  habits: Habit[],
  progressArray: Progress[],
  timeRange: string
): { habits: TrendData; completion: TrendData; streak: TrendData; sessions: TrendData } => {
  // Simplified trend calculation - comparing current period to previous period
  const days = getDaysFromTimeRange(timeRange);
  const currentPeriod = getDateRange(days);
  const previousPeriod = getDateRange(days).map(date => {
    const d = new Date(date);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  });
  
  const currentRate = calculateCompletionRate(habits, progressArray, currentPeriod);
  const previousRate = calculateCompletionRate(habits, progressArray, previousPeriod);
  
  const completionChange = currentRate - previousRate;
  
  return {
    habits: {
      direction: 'stable',
      percentage: 0,
      timeframe: 'vs previous period'
    },
    completion: {
      direction: completionChange > 5 ? 'up' : completionChange < -5 ? 'down' : 'stable',
      percentage: Math.abs(completionChange),
      timeframe: 'vs previous period'
    },
    streak: {
      direction: 'stable',
      percentage: 0,
      timeframe: 'vs previous period'
    },
    sessions: {
      direction: 'stable',
      percentage: 0,
      timeframe: 'vs previous period'
    }
  };
};

export const useAnalytics = (
  habits: Habit[],
  progressArray: Progress[],
  timeRange: '7d' | '30d' | '90d'
): AnalyticsData => {
  return useMemo(() => {
    const days = getDaysFromTimeRange(timeRange);
    const dateRange = getDateRange(days);
    
    // Calculate overall completion rate
    const overallCompletionRate = calculateCompletionRate(habits, progressArray, dateRange);
    
    // Find longest current streak
    const longestCurrentStreak = Math.max(
      ...progressArray.map(progress => progress.currentStreak || 0),
      0
    );
    
    // Calculate total sessions (total completions across all habits)
    const totalSessions = progressArray.reduce((total, progress) => 
      total + (progress.completions?.length || 0), 0
    );
    
    // Calculate total completions in time range
    const totalCompletions = progressArray.reduce((total, progress) => {
      const completionsInRange = progress.completions.filter(date => 
        dateRange.includes(date)
      ).length;
      return total + completionsInRange;
    }, 0);
    
    // Calculate average daily completion rate
    const averageDaily = dateRange.length > 0 ? 
      Math.round((totalCompletions / (habits.length * dateRange.length)) * 100) : 0;
    
    // Get best performing day
    const bestDay = getBestDay(habits, progressArray, dateRange);
    
    // Calculate consistency score
    const consistencyScore = calculateConsistencyScore(habits, progressArray, dateRange);
    
    // Create habit breakdown
    const habitBreakdown: HabitAnalytics[] = habits.map(habit => {
      const habitProgress = progressArray.find(p => p.habitId === habit.id);
      
      return {
        id: habit.id,
        title: habit.title,
        completionRate: calculateHabitCompletionRate(habit.id, progressArray, dateRange),
        currentStreak: habitProgress?.currentStreak || 0,
        totalSessions: habitProgress?.completions?.length || 0,
        category: habit.category || 'General'
      };
    });
    
    // Calculate trends
    const trends = calculateTrends(habits, progressArray, timeRange);
    
    return {
      overallCompletionRate,
      longestCurrentStreak,
      totalSessions,
      totalCompletions,
      averageDaily,
      bestDay,
      consistencyScore,
      habitBreakdown,
      habitsTrend: trends.habits,
      completionTrend: trends.completion,
      streakTrend: trends.streak,
      sessionsTrend: trends.sessions
    };
  }, [habits, progressArray, timeRange]);
};