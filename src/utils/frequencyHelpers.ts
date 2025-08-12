import { HabitFrequency, HabitReminders } from '../types';

/**
 * Utility functions for handling habit frequency and reminders
 */

/**
 * Creates a default daily frequency configuration
 */
export function createDefaultFrequency(): HabitFrequency {
  return {
    type: 'daily'
  };
}

/**
 * Creates a weekly frequency configuration
 */
export function createWeeklyFrequency(sessionsPerWeek: number, preferredDays?: string[]): HabitFrequency {
  return {
    type: 'weekly',
    weeklyTarget: {
      sessionsPerWeek,
      preferredDays,
      allowFlexibleDays: true
    }
  };
}

/**
 * Creates a periodic frequency configuration
 */
export function createPeriodicFrequency(
  interval: 'weekly' | 'monthly' | 'quarterly' | 'yearly',
  intervalCount: number = 1
): HabitFrequency {
  return {
    type: 'periodic',
    periodicTarget: {
      interval,
      intervalCount
    }
  };
}

/**
 * Creates a custom frequency configuration
 */
export function createCustomFrequency(description: string, reminderLogic: string): HabitFrequency {
  return {
    type: 'custom',
    customPattern: {
      description,
      reminderLogic
    }
  };
}

/**
 * Creates default reminder configuration
 */
export function createDefaultReminders(): HabitReminders {
  return {
    enabled: true,
    periodicReminderDays: 7 // Default to 7 days for periodic habits
  };
}

/**
 * Creates reminder configuration for weekly habits
 */
export function createWeeklyReminders(preferredDay?: string): HabitReminders {
  return {
    enabled: true,
    periodicReminderDays: 3, // More frequent for weekly habits
    weeklyReminderDay: preferredDay || 'wednesday'
  };
}

/**
 * Creates reminder configuration for periodic habits
 */
export function createPeriodicReminders(
  daysBefore: number = 14,
  customMessage?: string
): HabitReminders {
  return {
    enabled: true,
    periodicReminderDays: daysBefore,
    customMessage
  };
}

/**
 * Migrates legacy frequency string to new frequency object
 * Used for backward compatibility
 */
export function migrateLegacyFrequency(legacyFrequency?: string): HabitFrequency {
  if (!legacyFrequency) {
    return createDefaultFrequency();
  }

  const lower = legacyFrequency.toLowerCase();
  
  // Parse common patterns
  if (lower.includes('daily') || lower.includes('every day')) {
    return createDefaultFrequency();
  }
  
  if (lower.includes('weekly') || lower.includes('week')) {
    // Try to extract number of times per week
    const match = lower.match(/(\d+)\s*times?\s*per\s*week/);
    const sessionsPerWeek = match ? parseInt(match[1]) : 1;
    return createWeeklyFrequency(sessionsPerWeek);
  }
  
  if (lower.includes('monthly') || lower.includes('month')) {
    return createPeriodicFrequency('monthly');
  }
  
  if (lower.includes('quarterly') || lower.includes('quarter')) {
    return createPeriodicFrequency('quarterly');
  }
  
  if (lower.includes('yearly') || lower.includes('year')) {
    return createPeriodicFrequency('yearly');
  }
  
  // Default to custom pattern for unrecognized patterns
  return createCustomFrequency(legacyFrequency, 'legacy');
}

/**
 * Gets a human-readable description of a frequency configuration
 */
export function getFrequencyDescription(frequency: HabitFrequency): string {
  switch (frequency.type) {
    case 'daily':
      return 'Daily';
    
    case 'weekly':
      if (frequency.weeklyTarget) {
        const sessions = frequency.weeklyTarget.sessionsPerWeek;
        const days = frequency.weeklyTarget.preferredDays;
        if (days && days.length > 0) {
          return `${sessions} times per week (${days.join(', ')})`;
        }
        return `${sessions} times per week`;
      }
      return 'Weekly';
    
    case 'periodic':
      if (frequency.periodicTarget) {
        const { interval, intervalCount } = frequency.periodicTarget;
        const intervalText = intervalCount === 1 ? interval : `${intervalCount} ${interval}s`;
        return `Every ${intervalText}`;
      }
      return 'Periodic';
    
    case 'custom':
      return frequency.customPattern?.description || 'Custom';
    
    default:
      return 'Daily';
  }
}

/**
 * Checks if a frequency is considered flexible (allows missed days)
 */
export function isFlexibleFrequency(frequency: HabitFrequency): boolean {
  switch (frequency.type) {
    case 'daily':
      return false; // Daily habits are strict
    
    case 'weekly':
      return frequency.weeklyTarget?.allowFlexibleDays !== false;
    
    case 'periodic':
    case 'custom':
      return true;
    
    default:
      return false;
  }
}