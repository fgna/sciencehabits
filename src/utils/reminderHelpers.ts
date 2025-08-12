/**
 * Intelligent Reminder Calculation System
 * 
 * Calculates smart reminders based on:
 * - Habit frequency patterns
 * - User completion history
 * - Time preferences
 * - Current progress status
 */

import { Habit, HabitFrequency, HabitReminders, Progress } from '../types';
import { getWeekStart, getCurrentWeekProgress, isWeeklyGoalMet } from './weeklyGoalHelpers';

export interface ReminderRecommendation {
  type: 'daily' | 'weekly' | 'periodic' | 'urgent' | 'gentle';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timing: Date;
  message: string;
  reason: string;
  habitId: string;
}

export interface ReminderCalculationContext {
  habit: Habit;
  userProgress: Progress[];
  currentTime: Date;
  userTimezone?: string;
}

/**
 * Main entry point for calculating intelligent reminders
 */
export function calculateSmartReminders(
  context: ReminderCalculationContext
): ReminderRecommendation[] {
  const { habit, userProgress, currentTime } = context;
  
  switch (habit.frequency.type) {
    case 'daily':
      return calculateDailyReminders(context);
    case 'weekly':
      return calculateWeeklyReminders(context);
    case 'periodic':
      return calculatePeriodicReminders(context);
    default:
      return [];
  }
}

/**
 * Calculate reminders for daily habits
 */
function calculateDailyReminders(context: ReminderCalculationContext): ReminderRecommendation[] {
  const { habit, userProgress, currentTime } = context;
  const reminders: ReminderRecommendation[] = [];
  
  // Check if already completed today
  const today = currentTime.toDateString();
  const completedToday = userProgress.some(p => 
    p.habitId === habit.id && 
    p.completions.includes(today.split(' ')[0]) // Check if today's date is in completions array
  );
  
  if (completedToday) {
    return []; // No reminders needed if already completed
  }
  
  // Calculate reminder based on user's preferred time and completion history
  const preferredTimes = getPreferredTimesFromHabit(habit);
  const completionPattern = analyzeCompletionPattern(userProgress, habit.id);
  
  for (const timeSlot of preferredTimes) {
    const reminderTime = calculateOptimalReminderTime(timeSlot, completionPattern, currentTime);
    
    if (reminderTime > currentTime) {
      reminders.push({
        type: 'daily',
        priority: getDailyReminderPriority(currentTime, completionPattern),
        timing: reminderTime,
        message: generateDailyReminderMessage(habit, timeSlot),
        reason: `Daily habit reminder for ${timeSlot} time slot`,
        habitId: habit.id
      });
    }
  }
  
  // Add urgent reminder if it's getting late in the day
  const urgentReminder = calculateUrgentDailyReminder(habit, currentTime, completionPattern);
  if (urgentReminder) {
    reminders.push(urgentReminder);
  }
  
  return reminders;
}

/**
 * Calculate reminders for weekly goal habits
 */
function calculateWeeklyReminders(context: ReminderCalculationContext): ReminderRecommendation[] {
  const { habit, userProgress, currentTime } = context;
  const reminders: ReminderRecommendation[] = [];
  
  if (!habit.frequency.weeklyTarget) return [];
  
  const weekStart = getWeekStart(currentTime);
  // Get habit's progress and extract weekly progress data
  const habitProgress = userProgress.find(p => p.habitId === habit.id);
  const weeklyProgress = habitProgress?.weeklyProgress || [];
  const currentWeekProgress = getCurrentWeekProgress(weeklyProgress, currentTime);
  const isGoalMet = isWeeklyGoalMet(weeklyProgress, habit.frequency.weeklyTarget.sessionsPerWeek, currentTime);
  
  if (isGoalMet) {
    return []; // Goal already met this week
  }
  
  const remainingSessions = habit.frequency.weeklyTarget.sessionsPerWeek - (currentWeekProgress?.completedSessions || 0);
  const daysRemaining = 7 - Math.floor((currentTime.getTime() - new Date(weekStart).getTime()) / (1000 * 60 * 60 * 24));
  
  // Calculate urgency based on sessions needed vs days remaining
  const urgency = calculateWeeklyUrgency(remainingSessions, daysRemaining);
  
  // Generate reminders based on preferred days or smart distribution
  const preferredDays = habit.frequency.weeklyTarget.preferredDays || [];
  const recommendedTimes = calculateWeeklyReminderTimes(
    preferredDays,
    remainingSessions,
    daysRemaining,
    currentTime
  );
  
  for (const reminderTime of recommendedTimes) {
    reminders.push({
      type: 'weekly',
      priority: urgency,
      timing: reminderTime,
      message: generateWeeklyReminderMessage(habit, remainingSessions, daysRemaining),
      reason: `Weekly goal progress: ${currentWeekProgress?.completedSessions || 0}/${habit.frequency.weeklyTarget.sessionsPerWeek}`,
      habitId: habit.id
    });
  }
  
  return reminders;
}

/**
 * Calculate reminders for periodic habits
 */
function calculatePeriodicReminders(context: ReminderCalculationContext): ReminderRecommendation[] {
  const { habit, userProgress, currentTime } = context;
  const reminders: ReminderRecommendation[] = [];
  
  if (!habit.frequency.periodicTarget) return [];
  
  const lastCompletion = getLastCompletion(userProgress, habit.id);
  const nextDueDate = calculateNextDueDate(lastCompletion, habit.frequency.periodicTarget);
  
  if (!nextDueDate || nextDueDate <= currentTime) {
    // Overdue or due now
    reminders.push({
      type: 'periodic',
      priority: (nextDueDate && nextDueDate < currentTime) ? 'critical' : 'high',
      timing: currentTime,
      message: generatePeriodicReminderMessage(habit, nextDueDate, true),
      reason: (nextDueDate && nextDueDate < currentTime) ? 'Overdue periodic habit' : 'Periodic habit is due',
      habitId: habit.id
    });
  } else {
    // Calculate advance reminder
    const advanceReminderTime = calculateAdvanceReminderTime(nextDueDate, habit.frequency.periodicTarget.interval);
    
    if (advanceReminderTime > currentTime && advanceReminderTime <= new Date(currentTime.getTime() + 24 * 60 * 60 * 1000)) {
      reminders.push({
        type: 'periodic',
        priority: 'medium',
        timing: advanceReminderTime,
        message: generatePeriodicReminderMessage(habit, nextDueDate, false),
        reason: `Upcoming ${habit.frequency.periodicTarget.interval} habit`,
        habitId: habit.id
      });
    }
  }
  
  return reminders;
}

/**
 * Extract preferred times from habit tags
 */
function getPreferredTimesFromHabit(habit: Habit): string[] {
  const timeSlots = ['morning', 'lunch', 'evening', 'flexible'];
  return habit.timeTags?.filter(tag => timeSlots.includes(tag)) || ['flexible'];
}

/**
 * Analyze user's completion pattern for a habit
 */
function analyzeCompletionPattern(userProgress: Progress[], habitId: string): {
  averageCompletionTime: number; // Hour of day (0-23)
  consistencyScore: number; // 0-1
  recentStreak: number;
  preferredTimeSlots: string[];
} {
  const habitProgress = userProgress.filter(p => p.habitId === habitId);
  
  if (habitProgress.length === 0) {
    return {
      averageCompletionTime: 9, // Default to 9 AM
      consistencyScore: 0,
      recentStreak: 0,
      preferredTimeSlots: ['morning']
    };
  }
  
  // Calculate average completion time - use most recent completions
  const completionHours = habitProgress.flatMap(p => 
    p.completions.slice(-7).map(date => {
      // Extract hour from stored completion data or use default
      const hour = new Date(`${date}T09:00:00`).getHours(); 
      return hour;
    })
  );
  const averageCompletionTime = completionHours.reduce((sum, hour) => sum + hour, 0) / completionHours.length;
  
  // Calculate consistency score (how often they complete at similar times)
  const hourVariance = completionHours.reduce((sum, hour) => 
    sum + Math.pow(hour - averageCompletionTime, 2), 0
  ) / completionHours.length;
  const consistencyScore = Math.max(0, 1 - (hourVariance / 144)); // 144 = 12^2 (max variance)
  
  // Calculate recent streak
  const recentStreak = calculateRecentStreak(habitProgress);
  
  // Determine preferred time slots
  const preferredTimeSlots = determinePreferredTimeSlots(completionHours);
  
  return {
    averageCompletionTime,
    consistencyScore,
    recentStreak,
    preferredTimeSlots
  };
}

/**
 * Calculate optimal reminder time based on completion pattern
 */
function calculateOptimalReminderTime(
  timeSlot: string, 
  pattern: ReturnType<typeof analyzeCompletionPattern>,
  currentTime: Date
): Date {
  const reminderTime = new Date(currentTime);
  
  // Set date to next day if current time has passed the slot
  const targetHour = getTimeSlotHour(timeSlot, pattern.averageCompletionTime);
  reminderTime.setHours(targetHour, 0, 0, 0);
  
  if (reminderTime <= currentTime) {
    reminderTime.setDate(reminderTime.getDate() + 1);
  }
  
  // Adjust based on consistency - remind earlier if user is inconsistent
  if (pattern.consistencyScore < 0.5) {
    reminderTime.setMinutes(reminderTime.getMinutes() - 30);
  }
  
  return reminderTime;
}

/**
 * Convert time slot to hour
 */
function getTimeSlotHour(timeSlot: string, averageHour: number): number {
  switch (timeSlot) {
    case 'morning':
      return 8;
    case 'lunch':
      return 12;
    case 'evening':
      return 18;
    case 'flexible':
    default:
      return Math.round(averageHour) || 9;
  }
}

/**
 * Calculate priority for daily reminders
 */
function getDailyReminderPriority(
  currentTime: Date, 
  pattern: ReturnType<typeof analyzeCompletionPattern>
): 'low' | 'medium' | 'high' | 'critical' {
  const hour = currentTime.getHours();
  
  // Higher priority later in the day
  if (hour >= 20) return 'critical';
  if (hour >= 15) return 'high';
  if (hour >= 10) return 'medium';
  return 'low';
}

/**
 * Calculate urgent reminder for daily habits
 */
function calculateUrgentDailyReminder(
  habit: Habit,
  currentTime: Date,
  pattern: ReturnType<typeof analyzeCompletionPattern>
): ReminderRecommendation | null {
  const hour = currentTime.getHours();
  
  // Only send urgent reminders in the evening
  if (hour < 18) return null;
  
  return {
    type: 'urgent',
    priority: 'high',
    timing: currentTime,
    message: `Don't forget your daily ${habit.title}! The day is almost over.`,
    reason: 'Urgent end-of-day reminder',
    habitId: habit.id
  };
}

/**
 * Calculate urgency for weekly reminders
 */
function calculateWeeklyUrgency(
  remainingSessions: number, 
  daysRemaining: number
): 'low' | 'medium' | 'high' | 'critical' {
  const ratio = remainingSessions / Math.max(daysRemaining, 1);
  
  if (ratio >= 2) return 'critical';
  if (ratio >= 1.5) return 'high';
  if (ratio >= 1) return 'medium';
  return 'low';
}

/**
 * Calculate reminder times for weekly goals
 */
function calculateWeeklyReminderTimes(
  preferredDays: string[],
  remainingSessions: number,
  daysRemaining: number,
  currentTime: Date
): Date[] {
  const reminderTimes: Date[] = [];
  
  // If no preferred days, distribute evenly across remaining days
  if (preferredDays.length === 0) {
    const interval = Math.max(1, Math.floor(daysRemaining / remainingSessions));
    for (let i = 0; i < remainingSessions; i++) {
      const reminderTime = new Date(currentTime);
      reminderTime.setDate(reminderTime.getDate() + (i * interval));
      reminderTime.setHours(10, 0, 0, 0); // Default to 10 AM
      reminderTimes.push(reminderTime);
    }
  } else {
    // Use preferred days
    const dayMap: { [key: string]: number } = {
      'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 0
    };
    
    for (const day of preferredDays) {
      const dayNum = dayMap[day];
      const reminderTime = getNextDayOfWeek(currentTime, dayNum);
      reminderTime.setHours(10, 0, 0, 0);
      reminderTimes.push(reminderTime);
      
      if (reminderTimes.length >= remainingSessions) break;
    }
  }
  
  return reminderTimes.filter(time => time > currentTime);
}

/**
 * Get next occurrence of a specific day of week
 */
function getNextDayOfWeek(currentTime: Date, targetDay: number): Date {
  const result = new Date(currentTime);
  const currentDay = currentTime.getDay();
  const daysUntilTarget = (targetDay + 7 - currentDay) % 7;
  result.setDate(result.getDate() + (daysUntilTarget || 7));
  return result;
}

/**
 * Generate reminder messages for different types
 */
function generateDailyReminderMessage(habit: Habit, timeSlot: string): string {
  const timeSlotNames = {
    morning: 'morning',
    lunch: 'midday',
    evening: 'evening',
    flexible: 'today'
  };
  
  const timeStr = timeSlotNames[timeSlot as keyof typeof timeSlotNames] || 'today';
  return `Time for your ${timeStr} ${habit.title}! (${habit.timeMinutes} min)`;
}

function generateWeeklyReminderMessage(
  habit: Habit, 
  remainingSessions: number, 
  daysRemaining: number
): string {
  if (remainingSessions === 1) {
    return `One more ${habit.title} session to complete your weekly goal!`;
  }
  
  return `${remainingSessions} ${habit.title} sessions remaining this week (${daysRemaining} days left)`;
}

function generatePeriodicReminderMessage(
  habit: Habit, 
  dueDate: Date | null, 
  isOverdue: boolean
): string {
  if (isOverdue) {
    return `Your ${habit.title} is overdue! Time to get back on track.`;
  }
  
  if (dueDate) {
    const days = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return `${habit.title} is due in ${days} day${days !== 1 ? 's' : ''}`;
  }
  
  return `Time for your periodic ${habit.title}!`;
}

/**
 * Helper functions
 */
function getLastCompletion(userProgress: Progress[], habitId: string): Date | null {
  const habitProgress = userProgress.filter(p => p.habitId === habitId);
  if (habitProgress.length === 0) return null;
  
  // Get the most recent completion date from all completions
  const allCompletions = habitProgress.flatMap(p => p.completions.map(date => new Date(date)));
  if (allCompletions.length === 0) return null;
  
  return new Date(Math.max(...allCompletions.map(d => d.getTime())));
}

function calculateNextDueDate(
  lastCompletion: Date | null,
  periodicTarget: NonNullable<HabitFrequency['periodicTarget']>
): Date | null {
  if (!lastCompletion) return new Date(); // Due now if never completed
  
  const dueDate = new Date(lastCompletion);
  const { interval, intervalCount } = periodicTarget;
  
  switch (interval) {
    case 'weekly':
      dueDate.setDate(dueDate.getDate() + (7 * intervalCount));
      break;
    case 'monthly':
      dueDate.setMonth(dueDate.getMonth() + intervalCount);
      break;
    case 'quarterly':
      dueDate.setMonth(dueDate.getMonth() + (3 * intervalCount));
      break;
    case 'yearly':
      dueDate.setFullYear(dueDate.getFullYear() + intervalCount);
      break;
  }
  
  return dueDate;
}

function calculateAdvanceReminderTime(
  dueDate: Date,
  interval: 'weekly' | 'monthly' | 'quarterly' | 'yearly'
): Date {
  const reminderTime = new Date(dueDate);
  
  switch (interval) {
    case 'weekly':
      reminderTime.setDate(reminderTime.getDate() - 1); // 1 day before
      break;
    case 'monthly':
      reminderTime.setDate(reminderTime.getDate() - 3); // 3 days before
      break;
    case 'quarterly':
      reminderTime.setDate(reminderTime.getDate() - 7); // 1 week before
      break;
    case 'yearly':
      reminderTime.setDate(reminderTime.getDate() - 14); // 2 weeks before
      break;
  }
  
  return reminderTime;
}

function calculateRecentStreak(habitProgress: Progress[]): number {
  if (habitProgress.length === 0) return 0;
  
  // Use the current streak from the progress record
  const mostRecentProgress = habitProgress[habitProgress.length - 1];
  return mostRecentProgress?.currentStreak || 0;
}

function determinePreferredTimeSlots(completionHours: number[]): string[] {
  const timeSlotCounts = {
    morning: 0,   // 5-11 AM
    lunch: 0,     // 11-14 PM
    evening: 0,   // 17-23 PM
    flexible: 0   // Other times
  };
  
  for (const hour of completionHours) {
    if (hour >= 5 && hour < 11) {
      timeSlotCounts.morning++;
    } else if (hour >= 11 && hour < 14) {
      timeSlotCounts.lunch++;
    } else if (hour >= 17 && hour < 23) {
      timeSlotCounts.evening++;
    } else {
      timeSlotCounts.flexible++;
    }
  }
  
  // Return slots sorted by frequency
  return Object.entries(timeSlotCounts)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);
}

/**
 * Get all pending reminders for a user's habits
 */
export function getAllPendingReminders(
  userHabits: Habit[],
  userProgress: Progress[],
  currentTime: Date = new Date()
): ReminderRecommendation[] {
  const allReminders: ReminderRecommendation[] = [];
  
  for (const habit of userHabits) {
    const context: ReminderCalculationContext = {
      habit,
      userProgress: userProgress.filter(p => p.habitId === habit.id),
      currentTime
    };
    
    const habitReminders = calculateSmartReminders(context);
    allReminders.push(...habitReminders);
  }
  
  // Sort by priority and timing
  return allReminders.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    
    if (priorityDiff !== 0) return priorityDiff;
    
    return a.timing.getTime() - b.timing.getTime();
  });
}