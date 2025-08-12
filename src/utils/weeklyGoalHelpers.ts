import { WeeklyProgress, HabitFrequency } from '../types';

/**
 * Utility functions for weekly goal tracking and management
 */

/**
 * Get the start of week date (Monday) for a given date
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

/**
 * Get the end of week date (Sunday) for a given date
 */
export function getWeekEnd(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? 0 : 7); // Adjust when day is Sunday
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

/**
 * Get all dates in a week range
 */
export function getWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const startDate = new Date(weekStart);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

/**
 * Get the current week's progress for a habit
 */
export function getCurrentWeekProgress(
  weeklyProgress: WeeklyProgress[] = [],
  date: Date = new Date()
): WeeklyProgress | null {
  const weekStart = getWeekStart(date);
  return weeklyProgress.find(w => w.weekStart === weekStart) || null;
}

/**
 * Check if a habit's weekly goal is met for current week
 */
export function isWeeklyGoalMet(
  weeklyProgress: WeeklyProgress[] = [],
  targetSessions: number,
  date: Date = new Date()
): boolean {
  const currentWeek = getCurrentWeekProgress(weeklyProgress, date);
  if (!currentWeek) return false;
  
  return currentWeek.completedSessions >= targetSessions;
}

/**
 * Get remaining sessions needed for weekly goal
 */
export function getRemainingSessionsForWeek(
  weeklyProgress: WeeklyProgress[] = [],
  targetSessions: number,
  date: Date = new Date()
): number {
  const currentWeek = getCurrentWeekProgress(weeklyProgress, date);
  const completedSessions = currentWeek?.completedSessions || 0;
  
  return Math.max(0, targetSessions - completedSessions);
}

/**
 * Get days remaining in current week
 */
export function getDaysRemainingInWeek(date: Date = new Date()): number {
  const today = new Date(date);
  const endOfWeek = new Date(getWeekEnd(date));
  const diffTime = endOfWeek.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Check if weekly goal is still achievable
 */
export function isWeeklyGoalAchievable(
  weeklyProgress: WeeklyProgress[] = [],
  targetSessions: number,
  date: Date = new Date()
): boolean {
  const remainingSessions = getRemainingSessionsForWeek(weeklyProgress, targetSessions, date);
  const daysRemaining = getDaysRemainingInWeek(date);
  
  // Can still achieve if remaining sessions <= days remaining
  return remainingSessions <= daysRemaining;
}

/**
 * Get weekly goal progress percentage
 */
export function getWeeklyGoalProgress(
  weeklyProgress: WeeklyProgress[] = [],
  targetSessions: number,
  date: Date = new Date()
): number {
  const currentWeek = getCurrentWeekProgress(weeklyProgress, date);
  const completedSessions = currentWeek?.completedSessions || 0;
  
  return Math.min(100, Math.round((completedSessions / targetSessions) * 100));
}

/**
 * Get weekly streak count (consecutive weeks where goal was met)
 */
export function getWeeklyStreak(weeklyProgress: WeeklyProgress[] = []): number {
  if (weeklyProgress.length === 0) return 0;
  
  // Sort by week start date (most recent first)
  const sortedProgress = [...weeklyProgress].sort((a, b) => 
    b.weekStart.localeCompare(a.weekStart)
  );
  
  let streak = 0;
  for (const week of sortedProgress) {
    if (week.weeklyGoalMet) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Check if today is a preferred day for the habit
 */
export function isPreferredDay(
  frequency: HabitFrequency,
  date: Date = new Date()
): boolean {
  if (frequency.type !== 'weekly' || !frequency.weeklyTarget?.preferredDays) {
    return true; // If no preferred days specified, any day is fine
  }
  
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = dayNames[date.getDay()];
  
  return frequency.weeklyTarget.preferredDays.includes(today);
}

/**
 * Get preferred days as formatted string
 */
export function getPreferredDaysString(frequency: HabitFrequency): string {
  if (frequency.type !== 'weekly' || !frequency.weeklyTarget?.preferredDays) {
    return 'Any day';
  }
  
  const days = frequency.weeklyTarget.preferredDays;
  if (days.length === 0) return 'Any day';
  
  // Capitalize first letter of each day
  const formattedDays = days.map(day => 
    day.charAt(0).toUpperCase() + day.slice(1)
  );
  
  if (formattedDays.length === 1) return formattedDays[0];
  if (formattedDays.length === 2) return formattedDays.join(' and ');
  
  return formattedDays.slice(0, -1).join(', ') + ', and ' + formattedDays.slice(-1);
}

/**
 * Calculate weekly goal urgency level
 */
export function getWeeklyGoalUrgency(
  weeklyProgress: WeeklyProgress[] = [],
  targetSessions: number,
  date: Date = new Date()
): 'low' | 'medium' | 'high' {
  const remainingSessions = getRemainingSessionsForWeek(weeklyProgress, targetSessions, date);
  const daysRemaining = getDaysRemainingInWeek(date);
  
  if (remainingSessions === 0) return 'low'; // Goal already met
  if (remainingSessions > daysRemaining) return 'high'; // Impossible to achieve
  if (remainingSessions === daysRemaining) return 'high'; // Need to do it every day
  if (daysRemaining <= 2) return 'medium'; // Weekend approaching
  
  return 'low';
}

/**
 * Generate weekly goal reminder message
 */
export function getWeeklyGoalReminderMessage(
  weeklyProgress: WeeklyProgress[] = [],
  targetSessions: number,
  habitTitle: string,
  date: Date = new Date()
): string {
  const remainingSessions = getRemainingSessionsForWeek(weeklyProgress, targetSessions, date);
  const daysRemaining = getDaysRemainingInWeek(date);
  const urgency = getWeeklyGoalUrgency(weeklyProgress, targetSessions, date);
  
  if (remainingSessions === 0) {
    return `🎉 Weekly goal achieved for ${habitTitle}! You've completed ${targetSessions} sessions this week.`;
  }
  
  if (remainingSessions > daysRemaining) {
    return `⚠️ Weekly goal for ${habitTitle} may not be achievable. You need ${remainingSessions} more sessions with only ${daysRemaining} days left.`;
  }
  
  switch (urgency) {
    case 'high':
      return `🔥 ${habitTitle}: ${remainingSessions} sessions needed in ${daysRemaining} days to meet weekly goal!`;
    case 'medium':
      return `⏰ ${habitTitle}: ${remainingSessions} more sessions needed this week (${daysRemaining} days left)`;
    case 'low':
    default:
      return `📅 ${habitTitle}: ${remainingSessions} sessions remaining for weekly goal (${daysRemaining} days left)`;
  }
}