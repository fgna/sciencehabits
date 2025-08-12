/**
 * Smart Notification Service
 * 
 * Manages browser notifications, permission handling, and reminder scheduling
 * for the intelligent reminder system.
 */

import { 
  ReminderRecommendation, 
  getAllPendingReminders,
  ReminderCalculationContext 
} from '../utils/reminderHelpers';
import { Habit, Progress } from '../types';

export interface NotificationPermissionState {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  supported: boolean;
}

export interface ScheduledReminder {
  id: string;
  recommendation: ReminderRecommendation;
  timeoutId?: NodeJS.Timeout;
  scheduled: boolean;
}

export class ReminderService {
  private scheduledReminders: Map<string, ScheduledReminder> = new Map();
  private notificationQueue: ReminderRecommendation[] = [];
  private isEnabled = false;
  private permission: NotificationPermissionState = {
    granted: false,
    denied: false,
    prompt: false,
    supported: false
  };

  constructor() {
    this.checkNotificationSupport();
    this.updatePermissionState();
  }

  /**
   * Initialize the reminder service
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if notifications are supported
      if (!this.permission.supported) {
        console.warn('Browser notifications not supported');
        return false;
      }

      // Request permission if needed
      const permissionGranted = await this.requestNotificationPermission();
      if (!permissionGranted) {
        console.warn('Notification permission not granted');
        return false;
      }

      this.isEnabled = true;
      console.log('Reminder service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize reminder service:', error);
      return false;
    }
  }

  /**
   * Check if browser supports notifications
   */
  private checkNotificationSupport(): void {
    this.permission.supported = 'Notification' in window && 
      typeof window.Notification !== 'undefined';
  }

  /**
   * Update current permission state
   */
  private updatePermissionState(): void {
    if (!this.permission.supported) return;

    const permission = Notification.permission;
    this.permission = {
      ...this.permission,
      granted: permission === 'granted',
      denied: permission === 'denied',
      prompt: permission === 'default'
    };
  }

  /**
   * Request notification permission from user
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!this.permission.supported) return false;
    if (this.permission.granted) return true;
    if (this.permission.denied) return false;

    try {
      const permission = await Notification.requestPermission();
      this.updatePermissionState();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get current permission state
   */
  getPermissionState(): NotificationPermissionState {
    this.updatePermissionState();
    return { ...this.permission };
  }

  /**
   * Schedule reminders for user habits
   */
  async scheduleReminders(
    userHabits: Habit[],
    userProgress: Progress[],
    currentTime: Date = new Date()
  ): Promise<void> {
    if (!this.isEnabled) {
      console.warn('Reminder service not enabled');
      return;
    }

    // Clear existing reminders
    this.clearAllReminders();

    // Get all pending reminders
    const pendingReminders = getAllPendingReminders(userHabits, userProgress, currentTime);
    
    console.log(`Scheduling ${pendingReminders.length} reminders`);

    // Schedule each reminder
    for (const reminder of pendingReminders) {
      await this.scheduleReminder(reminder);
    }
  }

  /**
   * Schedule a single reminder
   */
  private async scheduleReminder(recommendation: ReminderRecommendation): Promise<void> {
    const reminderId = this.generateReminderId(recommendation);
    const currentTime = Date.now();
    const reminderTime = recommendation.timing.getTime();
    const delay = reminderTime - currentTime;

    // Skip if reminder is in the past
    if (delay <= 0) {
      console.warn(`Skipping past reminder for habit ${recommendation.habitId}`);
      return;
    }

    // Schedule the notification
    const timeoutId = setTimeout(() => {
      this.showNotification(recommendation);
    }, delay);

    const scheduledReminder: ScheduledReminder = {
      id: reminderId,
      recommendation,
      timeoutId,
      scheduled: true
    };

    this.scheduledReminders.set(reminderId, scheduledReminder);
    
    console.log(`Scheduled ${recommendation.type} reminder for habit ${recommendation.habitId} at ${recommendation.timing}`);
  }

  /**
   * Show browser notification
   */
  private showNotification(recommendation: ReminderRecommendation): void {
    if (!this.permission.granted) return;

    try {
      const notification = new Notification(recommendation.message, {
        icon: this.getNotificationIcon(recommendation.type),
        body: recommendation.reason,
        tag: recommendation.habitId, // Replaces existing notifications for same habit
        requireInteraction: recommendation.priority === 'critical',
        silent: recommendation.priority === 'low'
      });

      // Auto-close notification after appropriate time
      const autoCloseDelay = this.getAutoCloseDelay(recommendation.priority);
      if (autoCloseDelay > 0) {
        setTimeout(() => {
          notification.close();
        }, autoCloseDelay);
      }

      // Handle notification click
      notification.onclick = () => {
        // Focus the app window
        window.focus();
        
        // Navigate to habit or dashboard
        this.handleNotificationClick(recommendation);
        
        // Close the notification
        notification.close();
      };

      // Log the notification
      console.log(`Notification shown: ${recommendation.message}`);

    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Get notification icon based on type
   */
  private getNotificationIcon(type: ReminderRecommendation['type']): string {
    const icons = {
      daily: '/icons/daily-reminder.png',
      weekly: '/icons/weekly-reminder.png',
      periodic: '/icons/periodic-reminder.png',
      urgent: '/icons/urgent-reminder.png',
      gentle: '/icons/gentle-reminder.png'
    };
    
    return icons[type] || '/icons/default-reminder.png';
  }

  /**
   * Get auto-close delay based on priority
   */
  private getAutoCloseDelay(priority: ReminderRecommendation['priority']): number {
    const delays = {
      low: 5000,      // 5 seconds
      medium: 8000,   // 8 seconds
      high: 12000,    // 12 seconds
      critical: 0     // No auto-close
    };
    
    return delays[priority] || 8000;
  }

  /**
   * Handle notification click
   */
  private handleNotificationClick(recommendation: ReminderRecommendation): void {
    // Store the clicked reminder info for the app to handle
    const clickData = {
      habitId: recommendation.habitId,
      type: recommendation.type,
      timestamp: Date.now()
    };
    
    // Store in sessionStorage for the app to pick up
    sessionStorage.setItem('reminder_click', JSON.stringify(clickData));
    
    // Dispatch custom event
    window.dispatchEvent(new CustomEvent('reminder-clicked', { 
      detail: clickData 
    }));
  }

  /**
   * Generate unique reminder ID
   */
  private generateReminderId(recommendation: ReminderRecommendation): string {
    return `${recommendation.habitId}-${recommendation.type}-${recommendation.timing.getTime()}`;
  }

  /**
   * Clear all scheduled reminders
   */
  clearAllReminders(): void {
    for (const [id, scheduledReminder] of this.scheduledReminders) {
      if (scheduledReminder.timeoutId) {
        clearTimeout(scheduledReminder.timeoutId);
      }
    }
    
    this.scheduledReminders.clear();
    console.log('All reminders cleared');
  }

  /**
   * Clear specific reminder
   */
  clearReminder(reminderId: string): boolean {
    const scheduledReminder = this.scheduledReminders.get(reminderId);
    if (!scheduledReminder) return false;

    if (scheduledReminder.timeoutId) {
      clearTimeout(scheduledReminder.timeoutId);
    }
    
    this.scheduledReminders.delete(reminderId);
    console.log(`Reminder ${reminderId} cleared`);
    return true;
  }

  /**
   * Get all scheduled reminders
   */
  getScheduledReminders(): ScheduledReminder[] {
    return Array.from(this.scheduledReminders.values());
  }

  /**
   * Enable/disable the reminder service
   */
  setEnabled(enabled: boolean): void {
    if (enabled && !this.permission.granted) {
      console.warn('Cannot enable reminders without notification permission');
      return;
    }
    
    this.isEnabled = enabled;
    
    if (!enabled) {
      this.clearAllReminders();
    }
    
    console.log(`Reminder service ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if service is enabled and ready
   */
  isReady(): boolean {
    return this.isEnabled && this.permission.granted && this.permission.supported;
  }

  /**
   * Show immediate notification (for testing)
   */
  async showTestNotification(): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const testReminder: ReminderRecommendation = {
        type: 'daily',
        priority: 'medium',
        timing: new Date(),
        message: 'Test notification from ScienceHabits',
        reason: 'This is a test notification to verify the system is working',
        habitId: 'test'
      };

      this.showNotification(testReminder);
      return true;
    } catch (error) {
      console.error('Error showing test notification:', error);
      return false;
    }
  }

  /**
   * Get reminder statistics
   */
  getStats(): {
    totalScheduled: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    nextReminder: Date | null;
  } {
    const reminders = Array.from(this.scheduledReminders.values());
    const stats = {
      totalScheduled: reminders.length,
      byType: {} as Record<string, number>,
      byPriority: {} as Record<string, number>,
      nextReminder: null as Date | null
    };

    let earliestTime = Infinity;
    
    for (const reminder of reminders) {
      // Count by type
      stats.byType[reminder.recommendation.type] = 
        (stats.byType[reminder.recommendation.type] || 0) + 1;
      
      // Count by priority
      stats.byPriority[reminder.recommendation.priority] = 
        (stats.byPriority[reminder.recommendation.priority] || 0) + 1;
      
      // Find earliest reminder
      const reminderTime = reminder.recommendation.timing.getTime();
      if (reminderTime < earliestTime) {
        earliestTime = reminderTime;
        stats.nextReminder = reminder.recommendation.timing;
      }
    }

    return stats;
  }

  /**
   * Update reminders based on new progress
   */
  async refreshReminders(
    userHabits: Habit[],
    userProgress: Progress[]
  ): Promise<void> {
    if (!this.isEnabled) return;

    console.log('Refreshing reminders based on updated progress');
    await this.scheduleReminders(userHabits, userProgress);
  }
}

// Export singleton instance
export const reminderService = new ReminderService();

// Export types for other modules
export type { ReminderRecommendation };