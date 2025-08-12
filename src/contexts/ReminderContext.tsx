/**
 * Reminder Context
 * 
 * Provides global reminder state management and integrates 
 * the reminder service with the React application lifecycle.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { reminderService, ReminderRecommendation, ScheduledReminder } from '../services/reminderService';
import { useUserStore } from '../stores/userStore';

interface ReminderContextValue {
  isInitialized: boolean;
  isEnabled: boolean;
  hasPermission: boolean;
  pendingReminders: ReminderRecommendation[];
  scheduledReminders: ScheduledReminder[];
  nextReminder: Date | null;
  
  // Actions
  initializeReminders: () => Promise<boolean>;
  toggleReminders: (enabled: boolean) => void;
  requestPermission: () => Promise<boolean>;
  refreshReminders: () => Promise<void>;
  showTestNotification: () => Promise<boolean>;
  
  // Statistics
  getStats: () => {
    totalScheduled: number;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    nextReminder: Date | null;
  };
}

const ReminderContext = createContext<ReminderContextValue | null>(null);

interface ReminderProviderProps {
  children: ReactNode;
}

export function ReminderProvider({ children }: ReminderProviderProps) {
  const { currentUser, userHabits, userProgress } = useUserStore();
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [pendingReminders, setPendingReminders] = useState<ReminderRecommendation[]>([]);
  const [scheduledReminders, setScheduledReminders] = useState<ScheduledReminder[]>([]);
  const [nextReminder, setNextReminder] = useState<Date | null>(null);

  // Initialize reminder service on mount
  useEffect(() => {
    const initializeService = async () => {
      try {
        const initialized = await reminderService.initialize();
        setIsInitialized(true);
        
        if (initialized) {
          setIsEnabled(reminderService.isReady());
          setHasPermission(reminderService.getPermissionState().granted);
        }
        
        console.log('Reminder context initialized', { initialized });
      } catch (error) {
        console.error('Failed to initialize reminder context:', error);
        setIsInitialized(true); // Still mark as initialized even if it failed
      }
    };

    initializeService();
  }, []);

  // Schedule reminders when user data changes
  useEffect(() => {
    if (isInitialized && isEnabled && currentUser && userHabits.length > 0) {
      scheduleReminders();
    }
  }, [isInitialized, isEnabled, currentUser, userHabits, userProgress]);

  // Listen for habit completion events to refresh reminders
  useEffect(() => {
    const handleHabitComplete = () => {
      if (isEnabled) {
        // Delay refresh to allow progress to be saved
        setTimeout(() => {
          refreshReminders();
        }, 1000);
      }
    };

    window.addEventListener('habit-completed', handleHabitComplete);
    return () => window.removeEventListener('habit-completed', handleHabitComplete);
  }, [isEnabled]);

  // Listen for reminder click events
  useEffect(() => {
    const handleReminderClick = (event: CustomEvent) => {
      const { habitId, type, timestamp } = event.detail;
      console.log('Reminder clicked:', { habitId, type, timestamp });
      
      // You can add navigation logic here
      // For example, navigate to the specific habit or dashboard
    };

    window.addEventListener('reminder-clicked', handleReminderClick as EventListener);
    return () => window.removeEventListener('reminder-clicked', handleReminderClick as EventListener);
  }, []);

  const scheduleReminders = async () => {
    try {
      await reminderService.scheduleReminders(userHabits, userProgress);
      updateLocalState();
      console.log('Reminders scheduled successfully');
    } catch (error) {
      console.error('Failed to schedule reminders:', error);
    }
  };

  const updateLocalState = () => {
    const stats = reminderService.getStats();
    const reminders = reminderService.getScheduledReminders();
    
    setScheduledReminders(reminders);
    setNextReminder(stats.nextReminder);
  };

  const initializeReminders = async (): Promise<boolean> => {
    try {
      const success = await reminderService.initialize();
      
      if (success) {
        setIsEnabled(true);
        setHasPermission(true);
        await scheduleReminders();
      }
      
      return success;
    } catch (error) {
      console.error('Failed to initialize reminders:', error);
      return false;
    }
  };

  const toggleReminders = (enabled: boolean) => {
    reminderService.setEnabled(enabled);
    setIsEnabled(enabled);
    
    if (enabled && userHabits.length > 0) {
      scheduleReminders();
    } else {
      setScheduledReminders([]);
      setNextReminder(null);
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    try {
      const granted = await reminderService.requestNotificationPermission();
      setHasPermission(granted);
      
      if (granted) {
        setIsEnabled(true);
        await scheduleReminders();
      }
      
      return granted;
    } catch (error) {
      console.error('Failed to request permission:', error);
      return false;
    }
  };

  const refreshReminders = async () => {
    if (!isEnabled) return;
    
    try {
      await reminderService.refreshReminders(userHabits, userProgress);
      updateLocalState();
    } catch (error) {
      console.error('Failed to refresh reminders:', error);
    }
  };

  const showTestNotification = async (): Promise<boolean> => {
    try {
      return await reminderService.showTestNotification();
    } catch (error) {
      console.error('Failed to show test notification:', error);
      return false;
    }
  };

  const getStats = () => {
    return reminderService.getStats();
  };

  const contextValue: ReminderContextValue = {
    isInitialized,
    isEnabled,
    hasPermission,
    pendingReminders,
    scheduledReminders,
    nextReminder,
    
    initializeReminders,
    toggleReminders,
    requestPermission,
    refreshReminders,
    showTestNotification,
    getStats
  };

  return (
    <ReminderContext.Provider value={contextValue}>
      {children}
    </ReminderContext.Provider>
  );
}

export function useReminders(): ReminderContextValue {
  const context = useContext(ReminderContext);
  if (!context) {
    throw new Error('useReminders must be used within a ReminderProvider');
  }
  return context;
}

// Hook for getting reminder status without full context
export function useReminderStatus(): {
  isEnabled: boolean;
  hasPermission: boolean;
  nextReminder: Date | null;
  totalScheduled: number;
} {
  const context = useContext(ReminderContext);
  
  if (!context) {
    return {
      isEnabled: false,
      hasPermission: false,
      nextReminder: null,
      totalScheduled: 0
    };
  }
  
  const stats = context.getStats();
  
  return {
    isEnabled: context.isEnabled,
    hasPermission: context.hasPermission,
    nextReminder: context.nextReminder,
    totalScheduled: stats.totalScheduled
  };
}