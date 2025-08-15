// IMPROVEMENT: Fixed completion rate calculation - 2025-08-15
// DO NOT REVERT: Critical for accurate user metrics based on actual usage days
import { Progress, Habit } from '../types';

export interface AnalyticsData {
  // Overall metrics
  totalDaysTracked: number;
  totalCompletions: number;
  overallCompletionRate: number;
  activeHabitsCount: number;
  
  // Streak data
  currentStreaks: number[];
  longestOverallStreak: number;
  averageStreak: number;
  streakDistribution: { length: number; count: number }[];
  
  // Time-based analysis
  dailyStats: DailyStats[];
  weeklyStats: WeeklyStats[];
  monthlyStats: MonthlyStats[];
  
  // Habit performance
  habitPerformance: HabitAnalytics[];
  categoryPerformance: CategoryAnalytics[];
  
  // Achievement data
  achievements: Achievement[];
  
  // Trends
  completionTrend: number; // positive/negative percentage
  consistencyScore: number; // 0-100
  momentumScore: number; // 0-100
  
  // Science-based weekly tracking
  weeklyConsistencyRate: number; // 0-100 - average weekly consistency
  weeklyConsistencyTrend: number; // percentage change in weekly consistency
  optimalWeekCount: number; // weeks at 70-80% consistency (sweet spot)
  recentWeeklyPerformance: WeeklyConsistencyData[];
  
  // Formation milestones based on research
  formationMilestones: FormationMilestoneData;
  habitsMilestoneProgress: HabitMilestoneProgress[];
}

export interface DailyStats {
  date: string;
  completions: number;
  totalHabits: number;
  completionRate: number;
  dayOfWeek: string;
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  completions: number;
  totalPossible: number;
  completionRate: number;
  weekNumber: number;
}

export interface WeeklyConsistencyData {
  weekStart: string;
  weekEnd: string;
  consistencyRate: number; // 0-100
  isOptimalZone: boolean; // 70-80% range
  habitBreakdown: Array<{
    habitId: string;
    habitTitle: string;
    weeklyCompletions: number;
    weeklyTarget: number;
    weeklyRate: number;
  }>;
  qualityScore: number; // factors in distribution and timing
}

export interface FormationMilestoneData {
  day21Milestone: {
    habitsReached: number;
    totalHabits: number;
    percentage: number;
    description: string;
  };
  day66Milestone: {
    habitsReached: number;
    totalHabits: number;
    percentage: number;
    description: string;
  };
  averageFormationDays: number;
  expectedCompletionDays: number; // when all current habits expected to reach 66 days
}

export interface HabitMilestoneProgress {
  habitId: string;
  habitTitle: string;
  daysActive: number;
  isAt21Days: boolean;
  isAt66Days: boolean;
  daysTo21: number;
  daysTo66: number;
  formationStage: 'early' | 'building' | 'forming' | 'established';
  milestoneAchievements: string[];
}

export interface MonthlyStats {
  month: string;
  year: number;
  completions: number;
  totalPossible: number;
  completionRate: number;
  daysActive: number;
}

export interface HabitAnalytics {
  habitId: string;
  habitTitle: string;
  habitCategory: string;
  totalCompletions: number;
  completionRate: number;
  currentStreak: number;
  longestStreak: number;
  averageGapBetweenCompletions: number;
  trendDirection: 'up' | 'down' | 'stable';
  consistencyScore: number;
  lastCompleted: string | null;
  daysTracked: number;
  // Formation milestone data
  daysActive: number;
  formationStage: 'early' | 'building' | 'forming' | 'established';
  milestoneProgress: {
    isAt21Days: boolean;
    isAt66Days: boolean;
    daysTo21: number;
    daysTo66: number;
  };
}

export interface CategoryAnalytics {
  category: string;
  totalHabits: number;
  totalCompletions: number;
  averageCompletionRate: number;
  bestPerformingHabit: string;
  mostConsistentHabit: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  category: 'streak' | 'completion' | 'consistency' | 'milestone';
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

// Main analytics calculation function
export function calculateAnalytics(
  progress: Progress[], 
  habits: Habit[], 
  startDate?: Date,
  endDate?: Date
): AnalyticsData {
  const now = new Date();
  const start = startDate || new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
  const end = endDate || now;

  // Filter progress data by date range if provided and deduplicate completions
  const filteredProgress = progress.map(p => ({
    ...p,
    completions: [...new Set(p.completions)].filter(date => {
      const completionDate = new Date(date);
      return completionDate >= start && completionDate <= end;
    })
  }));

  const totalCompletions = filteredProgress.reduce((sum, p) => sum + p.completions.length, 0);
  
  // Find the earliest date when any habit was actively started in the filtered set
  let earliestDate = end; // Initialize to end date so we can find earlier dates
  filteredProgress.forEach(p => {
    // Use dateStarted if available, otherwise use first completion from filtered data
    if (p.dateStarted) {
      const startDate = new Date(p.dateStarted);
      if (startDate >= start && startDate < earliestDate) {
        earliestDate = startDate;
      }
    } else if (p.completions.length > 0) {
      const firstCompletion = new Date(p.completions[0]);
      if (firstCompletion >= start && firstCompletion < earliestDate) {
        earliestDate = firstCompletion;
      }
    }
  });
  
  // Calculate days since actual usage started, not the full period
  const actualStartDate = earliestDate < end ? earliestDate : start;
  const actualDaysSinceStart = Math.max(1, Math.ceil((end.getTime() - actualStartDate.getTime()) / (1000 * 60 * 60 * 24)));
  
  // Use filtered progress length and actual days for realistic calculation
  const totalPossibleCompletions = filteredProgress.length * actualDaysSinceStart;

  // Calculate science-based weekly consistency metrics
  const weeklyConsistencyMetrics = calculateWeeklyConsistencyMetrics(filteredProgress, habits, start, end);

  return {
    totalDaysTracked: actualDaysSinceStart, // Use actual days since starting the app
    totalCompletions,
    overallCompletionRate: totalPossibleCompletions > 0 ? 
      Math.min(100, (totalCompletions / totalPossibleCompletions) * 100) : 0, // Logical cap as final safeguard
    activeHabitsCount: filteredProgress.length, // Use filtered progress count
    
    currentStreaks: progress.map(p => p.currentStreak),
    longestOverallStreak: Math.max(...progress.map(p => p.longestStreak), 0),
    averageStreak: progress.length > 0 
      ? progress.reduce((sum, p) => sum + p.currentStreak, 0) / progress.length 
      : 0,
    streakDistribution: calculateStreakDistribution(progress),
    
    dailyStats: calculateDailyStats(filteredProgress, habits, start, end),
    weeklyStats: calculateWeeklyStats(filteredProgress, habits, start, end),
    monthlyStats: calculateMonthlyStats(filteredProgress, habits, start, end),
    
    habitPerformance: calculateHabitPerformance(filteredProgress, habits, start, end),
    categoryPerformance: calculateCategoryPerformance(filteredProgress, habits),
    
    achievements: calculateAchievements(progress, habits),
    
    completionTrend: calculateCompletionTrend(filteredProgress, start, end),
    consistencyScore: calculateConsistencyScore(filteredProgress, start, end),
    momentumScore: calculateMomentumScore(filteredProgress),
    
    // Science-based weekly tracking
    weeklyConsistencyRate: weeklyConsistencyMetrics.averageWeeklyConsistency,
    weeklyConsistencyTrend: weeklyConsistencyMetrics.consistencyTrend,
    optimalWeekCount: weeklyConsistencyMetrics.optimalWeekCount,
    recentWeeklyPerformance: weeklyConsistencyMetrics.recentWeeks,
    
    // Formation milestones
    formationMilestones: calculateFormationMilestones(progress, habits, actualStartDate),
    habitsMilestoneProgress: calculateHabitMilestoneProgress(progress, habits, actualStartDate)
  };
}

// Helper functions for specific calculations
function calculateStreakDistribution(progress: Progress[]): { length: number; count: number }[] {
  const streakCounts: Record<number, number> = {};
  
  progress.forEach(p => {
    const streak = p.currentStreak;
    streakCounts[streak] = (streakCounts[streak] || 0) + 1;
  });

  return Object.entries(streakCounts)
    .map(([length, count]) => ({ length: parseInt(length), count }))
    .sort((a, b) => a.length - b.length);
}

function calculateDailyStats(
  progress: Progress[], 
  habits: Habit[], 
  start: Date, 
  end: Date
): DailyStats[] {
  const stats: DailyStats[] = [];
  const currentDate = new Date(start);

  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayCompletions = progress.reduce((sum, p) => 
      sum + (p.completions.includes(dateStr) ? 1 : 0), 0
    );

    stats.push({
      date: dateStr,
      completions: dayCompletions,
      totalHabits: progress.length,
      completionRate: progress.length > 0 ? (dayCompletions / progress.length) * 100 : 0,
      dayOfWeek: currentDate.toLocaleDateString('en-US', { weekday: 'long' })
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return stats;
}

function calculateWeeklyStats(
  progress: Progress[], 
  habits: Habit[], 
  start: Date, 
  end: Date
): WeeklyStats[] {
  const stats: WeeklyStats[] = [];
  const currentDate = new Date(start);
  
  // Start from the beginning of the week
  const dayOfWeek = currentDate.getDay();
  currentDate.setDate(currentDate.getDate() - dayOfWeek);

  let weekNumber = 1;
  while (currentDate < end) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    let weekCompletions = 0;
    const weekDays = 7;
    const totalPossible = progress.length * weekDays;

    for (let i = 0; i < 7; i++) {
      const dayStr = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      
      weekCompletions += progress.reduce((sum, p) => 
        sum + (p.completions.includes(dayStr) ? 1 : 0), 0
      );
    }

    stats.push({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      completions: weekCompletions,
      totalPossible,
      completionRate: totalPossible > 0 ? (weekCompletions / totalPossible) * 100 : 0,
      weekNumber: weekNumber++
    });

    currentDate.setDate(currentDate.getDate() + 7);
  }

  return stats;
}

function calculateMonthlyStats(
  progress: Progress[], 
  habits: Habit[], 
  start: Date, 
  end: Date
): MonthlyStats[] {
  const stats: MonthlyStats[] = [];
  const currentDate = new Date(start.getFullYear(), start.getMonth(), 1);

  while (currentDate <= end) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStr = currentDate.toLocaleDateString('en-US', { month: 'long' });
    
    const monthEnd = new Date(year, month + 1, 0);
    const daysInMonth = monthEnd.getDate();

    let monthCompletions = 0;
    let activeDays = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = new Date(year, month, day).toISOString().split('T')[0];
      const dayCompletions = progress.reduce((sum, p) => 
        sum + (p.completions.includes(dayStr) ? 1 : 0), 0
      );
      
      monthCompletions += dayCompletions;
      if (dayCompletions > 0) activeDays++;
    }

    const totalPossible = progress.length * daysInMonth;

    stats.push({
      month: monthStr,
      year,
      completions: monthCompletions,
      totalPossible,
      completionRate: totalPossible > 0 ? (monthCompletions / totalPossible) * 100 : 0,
      daysActive: activeDays
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return stats;
}

function calculateHabitPerformance(
  progress: Progress[], 
  habits: Habit[], 
  start: Date, 
  end: Date
): HabitAnalytics[] {
  const now = new Date();
  
  return progress.map(p => {
    const habit = habits.find(h => h.id === p.habitId);
    
    // Use actual days since habit started, not the full analysis period
    const habitStart = p.dateStarted ? new Date(p.dateStarted) : 
                       p.completions.length > 0 ? new Date(p.completions[0]) : start;
    const habitStartDate = habitStart < start ? start : habitStart;
    const actualDaysSinceStart = Math.max(1, Math.ceil((end.getTime() - habitStartDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate completion rate based on actual days since habit started
    const completionRate = (p.completions.length / actualDaysSinceStart) * 100;
    
    // Calculate days active for formation milestones (reuse habitStart)
    const daysActive = Math.ceil((now.getTime() - habitStart.getTime()) / (1000 * 60 * 60 * 24));
    
    // Formation stage and milestone progress
    const isAt21Days = daysActive >= 21;
    const isAt66Days = daysActive >= 66;
    const daysTo21 = Math.max(0, 21 - daysActive);
    const daysTo66 = Math.max(0, 66 - daysActive);
    
    let formationStage: 'early' | 'building' | 'forming' | 'established';
    if (daysActive < 7) {
      formationStage = 'early';
    } else if (daysActive < 21) {
      formationStage = 'building';
    } else if (daysActive < 66) {
      formationStage = 'forming';
    } else {
      formationStage = 'established';
    }
    
    // Calculate average gap between completions
    const sortedCompletions = [...p.completions].sort();
    let totalGaps = 0;
    for (let i = 1; i < sortedCompletions.length; i++) {
      const gap = Math.abs(
        new Date(sortedCompletions[i]).getTime() - 
        new Date(sortedCompletions[i-1]).getTime()
      ) / (1000 * 60 * 60 * 24);
      totalGaps += gap;
    }
    const averageGap = sortedCompletions.length > 1 ? totalGaps / (sortedCompletions.length - 1) : 0;

    // Calculate trend (comparing first and second half performance)
    const midPoint = Math.floor(p.completions.length / 2);
    const firstHalf = p.completions.slice(0, midPoint).length;
    const secondHalf = p.completions.slice(midPoint).length;
    const trendDirection: 'up' | 'down' | 'stable' = 
      secondHalf > firstHalf ? 'up' : 
      secondHalf < firstHalf ? 'down' : 'stable';

    // Consistency score based on how evenly distributed completions are
    const consistencyScore = calculateHabitConsistency(p.completions, start, end);

    return {
      habitId: p.habitId,
      habitTitle: habit?.title || 'Unknown Habit',
      habitCategory: habit?.category || 'unknown',
      totalCompletions: p.completions.length,
      completionRate: Math.min(100, completionRate), // Logical cap as safeguard
      currentStreak: p.currentStreak,
      longestStreak: p.longestStreak,
      averageGapBetweenCompletions: averageGap,
      trendDirection,
      consistencyScore,
      lastCompleted: p.completions.length > 0 ? p.completions[p.completions.length - 1] : null,
      daysTracked: actualDaysSinceStart,
      daysActive,
      formationStage,
      milestoneProgress: {
        isAt21Days,
        isAt66Days,
        daysTo21,
        daysTo66
      }
    };
  });
}

function calculateCategoryPerformance(
  progress: Progress[], 
  habits: Habit[]
): CategoryAnalytics[] {
  const categoryData: Record<string, {
    habits: HabitAnalytics[];
    totalCompletions: number;
  }> = {};

  // Group habits by category
  progress.forEach(p => {
    const habit = habits.find(h => h.id === p.habitId);
    const category = habit?.category || 'unknown';
    
    if (!categoryData[category]) {
      categoryData[category] = { habits: [], totalCompletions: 0 };
    }
    
    categoryData[category].totalCompletions += p.completions.length;
  });

  return Object.entries(categoryData).map(([category, data]) => {
    const categoryHabits = progress.filter(p => {
      const habit = habits.find(h => h.id === p.habitId);
      return habit?.category === category;
    });

    const completionRates = categoryHabits.map(p => 
      p.totalDays > 0 ? (p.completions.length / p.totalDays) * 100 : 0
    );
    const averageCompletionRate = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length;

    const bestPerforming = categoryHabits.reduce((best, current) => 
      current.completions.length > best.completions.length ? current : best
    );

    const mostConsistent = categoryHabits.reduce((best, current) => 
      current.currentStreak > best.currentStreak ? current : best
    );

    const bestHabit = habits.find(h => h.id === bestPerforming.habitId);
    const consistentHabit = habits.find(h => h.id === mostConsistent.habitId);

    return {
      category,
      totalHabits: categoryHabits.length,
      totalCompletions: data.totalCompletions,
      averageCompletionRate,
      bestPerformingHabit: bestHabit?.title || 'Unknown',
      mostConsistentHabit: consistentHabit?.title || 'Unknown'
    };
  });
}

function calculateAchievements(progress: Progress[], habits: Habit[]): Achievement[] {
  const achievements: Achievement[] = [];
  const now = new Date().toISOString();

  // Streak achievements
  const maxStreak = Math.max(...progress.map(p => p.longestStreak), 0);
  if (maxStreak >= 7) {
    achievements.push({
      id: 'week_warrior',
      title: 'Week Warrior',
      description: 'Maintained a 7-day streak',
      icon: '🔥',
      unlockedAt: now,
      category: 'streak',
      rarity: 'common'
    });
  }
  if (maxStreak >= 30) {
    achievements.push({
      id: 'month_master',
      title: 'Month Master',
      description: 'Maintained a 30-day streak',
      icon: '🏆',
      unlockedAt: now,
      category: 'streak',
      rarity: 'uncommon'
    });
  }
  if (maxStreak >= 100) {
    achievements.push({
      id: 'centurion',
      title: 'Centurion',
      description: 'Maintained a 100-day streak',
      icon: '👑',
      unlockedAt: now,
      category: 'streak',
      rarity: 'legendary'
    });
  }

  // Completion achievements
  const totalCompletions = progress.reduce((sum, p) => sum + p.totalDays, 0);
  if (totalCompletions >= 100) {
    achievements.push({
      id: 'century_club',
      title: 'Century Club',
      description: 'Completed 100 habits',
      icon: '💯',
      unlockedAt: now,
      category: 'completion',
      rarity: 'uncommon'
    });
  }
  if (totalCompletions >= 500) {
    achievements.push({
      id: 'habit_hero',
      title: 'Habit Hero',
      description: 'Completed 500 habits',
      icon: '🦸‍♂️',
      unlockedAt: now,
      category: 'completion',
      rarity: 'rare'
    });
  }

  // Consistency achievements
  const activeStreaks = progress.filter(p => p.currentStreak > 0).length;
  if (activeStreaks >= 3) {
    achievements.push({
      id: 'multitasker',
      title: 'Multitasker',
      description: 'Maintaining 3+ active streaks',
      icon: '⚡',
      unlockedAt: now,
      category: 'consistency',
      rarity: 'common'
    });
  }

  return achievements;
}

function calculateCompletionTrend(progress: Progress[], start: Date, end: Date): number {
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const midPoint = new Date(start.getTime() + (totalDays / 2) * 24 * 60 * 60 * 1000);

  let firstHalfCompletions = 0;
  let secondHalfCompletions = 0;

  progress.forEach(p => {
    p.completions.forEach(completion => {
      const date = new Date(completion);
      if (date < midPoint) {
        firstHalfCompletions++;
      } else {
        secondHalfCompletions++;
      }
    });
  });

  const firstHalfDays = Math.ceil((midPoint.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const secondHalfDays = totalDays - firstHalfDays;

  const firstHalfRate = firstHalfDays > 0 ? firstHalfCompletions / firstHalfDays : 0;
  const secondHalfRate = secondHalfDays > 0 ? secondHalfCompletions / secondHalfDays : 0;

  return firstHalfRate > 0 ? ((secondHalfRate - firstHalfRate) / firstHalfRate) * 100 : 0;
}

function calculateConsistencyScore(progress: Progress[], start: Date, end: Date): number {
  if (progress.length === 0) return 0;

  let totalConsistency = 0;
  progress.forEach(p => {
    totalConsistency += calculateHabitConsistency(p.completions, start, end);
  });

  return totalConsistency / progress.length;
}

function calculateHabitConsistency(completions: string[], start: Date, end: Date): number {
  if (completions.length === 0) return 0;

  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const expectedInterval = totalDays / completions.length;
  
  let consistencyScore = 100;
  const sortedCompletions = [...completions].sort();
  
  for (let i = 1; i < sortedCompletions.length; i++) {
    const actualInterval = Math.abs(
      new Date(sortedCompletions[i]).getTime() - 
      new Date(sortedCompletions[i-1]).getTime()
    ) / (1000 * 60 * 60 * 24);
    
    const deviation = Math.abs(actualInterval - expectedInterval) / expectedInterval;
    consistencyScore -= deviation * 10; // Penalty for deviation
  }

  return Math.max(0, Math.min(100, consistencyScore));
}

function calculateMomentumScore(progress: Progress[]): number {
  if (progress.length === 0) return 0;

  let totalMomentum = 0;
  const now = new Date();

  progress.forEach(p => {
    if (p.completions.length === 0) return;

    const lastCompletion = new Date(p.completions[p.completions.length - 1]);
    const daysSinceLastCompletion = Math.ceil(
      (now.getTime() - lastCompletion.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Higher momentum for recent completions and current streaks
    let habitMomentum = 0;
    if (daysSinceLastCompletion <= 1) habitMomentum = 100;
    else if (daysSinceLastCompletion <= 3) habitMomentum = 75;
    else if (daysSinceLastCompletion <= 7) habitMomentum = 50;
    else habitMomentum = 25;

    // Boost for current streaks
    habitMomentum *= (1 + (p.currentStreak * 0.1));
    
    totalMomentum += habitMomentum;
  });

  return Math.min(100, totalMomentum / progress.length);
}

// Science-based weekly consistency calculation
function calculateWeeklyConsistencyMetrics(
  progress: Progress[], 
  habits: Habit[], 
  start: Date, 
  end: Date
): {
  averageWeeklyConsistency: number;
  consistencyTrend: number;
  optimalWeekCount: number;
  recentWeeks: WeeklyConsistencyData[];
} {
  const weeklyData: WeeklyConsistencyData[] = [];
  const currentDate = new Date(start);
  
  // Start from the beginning of the week
  const dayOfWeek = currentDate.getDay();
  currentDate.setDate(currentDate.getDate() - dayOfWeek);
  
  while (currentDate < end) {
    const weekStart = new Date(currentDate);
    const weekEnd = new Date(currentDate);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    const habitBreakdown = progress.map(p => {
      const habit = habits.find(h => h.id === p.habitId);
      let weeklyCompletions = 0;
      
      // Count completions in this week
      for (let i = 0; i < 7; i++) {
        const dayStr = new Date(weekStart.getTime() + i * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];
        if (p.completions.includes(dayStr)) {
          weeklyCompletions++;
        }
      }
      
      // Calculate how many days this habit was actually active during this week
      const habitStart = p.dateStarted ? new Date(p.dateStarted) : 
                         p.completions.length > 0 ? new Date(p.completions[0]) : weekStart;
      const habitActiveStart = habitStart > weekStart ? habitStart : weekStart;
      const habitActiveDays = Math.min(7, Math.max(0, Math.ceil((weekEnd.getTime() - habitActiveStart.getTime()) / (1000 * 60 * 60 * 24)) + 1));
      
      // Weekly target should be the days this habit was actually trackable in this week
      const weeklyTarget = habitActiveDays;
      const weeklyRate = weeklyTarget > 0 ? (weeklyCompletions / weeklyTarget) * 100 : 0;
      
      return {
        habitId: p.habitId,
        habitTitle: habit?.title || 'Unknown Habit',
        weeklyCompletions,
        weeklyTarget,
        weeklyRate
      };
    });
    
    // Calculate week consistency rate (average across all habits)
    const consistencyRate = habitBreakdown.length > 0 
      ? habitBreakdown.reduce((sum, h) => sum + h.weeklyRate, 0) / habitBreakdown.length
      : 0;
    
    // Check if in optimal zone (70-80% consistency)
    const isOptimalZone = consistencyRate >= 70 && consistencyRate <= 80;
    
    // Quality score considers both rate and distribution
    const qualityScore = calculateWeekQualityScore(habitBreakdown, consistencyRate);
    
    weeklyData.push({
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      consistencyRate: consistencyRate, // Remove artificial cap
      isOptimalZone,
      habitBreakdown,
      qualityScore
    });
    
    currentDate.setDate(currentDate.getDate() + 7);
  }
  
  // Calculate metrics
  const averageWeeklyConsistency = weeklyData.length > 0 
    ? weeklyData.reduce((sum, w) => sum + w.consistencyRate, 0) / weeklyData.length
    : 0;
  
  const optimalWeekCount = weeklyData.filter(w => w.isOptimalZone).length;
  
  // Calculate trend (comparing first and second half)
  let consistencyTrend = 0;
  if (weeklyData.length >= 4) {
    const midPoint = Math.floor(weeklyData.length / 2);
    const firstHalf = weeklyData.slice(0, midPoint);
    const secondHalf = weeklyData.slice(midPoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, w) => sum + w.consistencyRate, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, w) => sum + w.consistencyRate, 0) / secondHalf.length;
    
    consistencyTrend = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
  }
  
  // Return most recent 8 weeks for detailed view
  const recentWeeks = weeklyData.slice(-8);
  
  return {
    averageWeeklyConsistency: Math.min(100, Math.max(0, averageWeeklyConsistency)), // Logical bounds
    consistencyTrend,
    optimalWeekCount,
    recentWeeks
  };
}

function calculateWeekQualityScore(
  habitBreakdown: Array<{
    habitId: string;
    habitTitle: string;
    weeklyCompletions: number;
    weeklyTarget: number;
    weeklyRate: number;
  }>,
  consistencyRate: number
): number {
  if (habitBreakdown.length === 0) return 0;
  
  // Base score from consistency rate
  let qualityScore = consistencyRate;
  
  // Bonus for balanced habit completion (not all-or-nothing)
  const habitRates = habitBreakdown.map(h => h.weeklyRate);
  const variance = calculateVariance(habitRates);
  const balanceBonus = Math.max(0, 10 - (variance / 10)); // Less variance = better balance
  
  // Bonus for hitting the science-backed optimal zone (70-80%)
  const optimalZoneBonus = (consistencyRate >= 70 && consistencyRate <= 80) ? 5 : 0;
  
  return Math.min(100, qualityScore + balanceBonus + optimalZoneBonus);
}

function calculateVariance(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const mean = numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
  return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / numbers.length;
}

// Formation milestone calculations based on scientific research
function calculateFormationMilestones(
  progress: Progress[], 
  habits: Habit[], 
  actualStartDate: Date
): FormationMilestoneData {
  const now = new Date();
  const habitMilestones = progress.map(p => {
    const habit = habits.find(h => h.id === p.habitId);
    
    // Calculate days active for this habit
    const habitStart = p.dateStarted ? new Date(p.dateStarted) : 
                       p.completions.length > 0 ? new Date(p.completions[0]) : actualStartDate;
    const daysActive = Math.ceil((now.getTime() - habitStart.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      habitId: p.habitId,
      habitTitle: habit?.title || 'Unknown Habit',
      daysActive
    };
  });
  
  // Count habits that have reached milestones
  const habitsAt21Days = habitMilestones.filter(h => h.daysActive >= 21).length;
  const habitsAt66Days = habitMilestones.filter(h => h.daysActive >= 66).length;
  
  // Calculate average formation days across all habits
  const averageFormationDays = habitMilestones.length > 0 
    ? habitMilestones.reduce((sum, h) => sum + h.daysActive, 0) / habitMilestones.length
    : 0;
  
  // Estimate when all current habits will reach 66 days
  const maxDaysToReach66 = Math.max(...habitMilestones.map(h => Math.max(0, 66 - h.daysActive)), 0);
  const expectedCompletionDays = maxDaysToReach66;
  
  return {
    day21Milestone: {
      habitsReached: habitsAt21Days,
      totalHabits: progress.length,
      percentage: progress.length > 0 ? (habitsAt21Days / progress.length) * 100 : 0,
      description: 'Initial neural pathway strengthening'
    },
    day66Milestone: {
      habitsReached: habitsAt66Days,
      totalHabits: progress.length,
      percentage: progress.length > 0 ? (habitsAt66Days / progress.length) * 100 : 0,
      description: 'Research-backed average formation time'
    },
    averageFormationDays: Math.round(averageFormationDays),
    expectedCompletionDays
  };
}

function calculateHabitMilestoneProgress(
  progress: Progress[], 
  habits: Habit[], 
  actualStartDate: Date
): HabitMilestoneProgress[] {
  const now = new Date();
  
  return progress.map(p => {
    const habit = habits.find(h => h.id === p.habitId);
    
    // Calculate days active for this habit
    const habitStart = p.dateStarted ? new Date(p.dateStarted) : 
                       p.completions.length > 0 ? new Date(p.completions[0]) : actualStartDate;
    const daysActive = Math.ceil((now.getTime() - habitStart.getTime()) / (1000 * 60 * 60 * 24));
    
    const isAt21Days = daysActive >= 21;
    const isAt66Days = daysActive >= 66;
    const daysTo21 = Math.max(0, 21 - daysActive);
    const daysTo66 = Math.max(0, 66 - daysActive);
    
    // Determine formation stage based on research
    let formationStage: 'early' | 'building' | 'forming' | 'established';
    if (daysActive < 7) {
      formationStage = 'early';
    } else if (daysActive < 21) {
      formationStage = 'building';
    } else if (daysActive < 66) {
      formationStage = 'forming';
    } else {
      formationStage = 'established';
    }
    
    // Generate milestone achievements
    const milestoneAchievements: string[] = [];
    if (isAt21Days) {
      milestoneAchievements.push('🧠 Neural pathway strengthening');
    }
    if (isAt66Days) {
      milestoneAchievements.push('⚡ Automaticity threshold reached');
    }
    if (daysActive >= 100) {
      milestoneAchievements.push('🏆 Long-term mastery');
    }
    
    return {
      habitId: p.habitId,
      habitTitle: habit?.title || 'Unknown Habit',
      daysActive,
      isAt21Days,
      isAt66Days,
      daysTo21,
      daysTo66,
      formationStage,
      milestoneAchievements
    };
  });
}

// Date utility functions
export function getDateRange(period: 'week' | 'month' | '3months' | 'year' | 'all'): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  let start: Date;

  switch (period) {
    case 'week':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '3months':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
    default:
      start = new Date(2020, 0, 1); // Far back enough for most users
      break;
  }

  return { start, end };
}