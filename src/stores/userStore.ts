// IMPROVEMENT: Fixed new user habit tracking - 2025-08-15
// DO NOT REVERT: Critical for new user onboarding experience
import { create } from 'zustand';
import { User, Habit, Progress } from '../types';
import { dbHelpers } from '../services/storage/database';

interface UserState {
  currentUser: User | null;
  userHabits: Habit[];
  userProgress: Progress[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: User) => void;
  loadUserData: (userId: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateUserProgress: (habitId: string, date?: string) => Promise<void>;
  toggleHabitCompletion: (habitId: string, date?: string) => Promise<void>;
  refreshProgress: () => Promise<void>;
  saveCloudConfig: (cloudConfig: User['cloudConfig']) => Promise<void>;
  setError: (error: string | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  currentUser: null,
  userHabits: [],
  userProgress: [],
  isLoading: false,
  error: null,

  setUser: (user) => set({ currentUser: user }),

  updateUser: async (updates) => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      set({ isLoading: true, error: null });
      
      // Update user in database
      await dbHelpers.updateUser(currentUser.id, updates);
      
      // Update local state
      const updatedUser = { ...currentUser, ...updates };
      set({ currentUser: updatedUser });
      
      // If goals or preferences changed, reload user data to get new recommendations
      const preferencesChanged = updates.goals || updates.preferredTime || updates.lifestyle || updates.dailyMinutes;
      if (preferencesChanged) {
        await get().loadUserData(currentUser.id);
      }
      
      set({ isLoading: false });
      
    } catch (error) {
      console.error('Failed to update user:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update user',
        isLoading: false 
      });
    }
  },

  loadUserData: async (userId) => {
    try {
      set({ isLoading: true, error: null });
      
      // Get user data
      const user = await dbHelpers.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user's progress first to determine which habits they're actually tracking
      const progress = await dbHelpers.getUserProgress(userId);
      
      // If no progress, user has no selected habits yet
      if (progress.length === 0) {
        set({ 
          currentUser: user,
          userHabits: [],
          userProgress: progress,
          isLoading: false 
        });
        return;
      }
      
      // For users with progress, only load the specific habits they're tracking
      const trackedHabitIds = progress.map(p => p.habitId);
      
      // Get science-backed habits that match progress entries
      const allScienceHabits = await dbHelpers.getAllHabits();
      const trackedScienceHabits = allScienceHabits.filter(habit => 
        trackedHabitIds.includes(habit.id)
      );
      
      // Get custom habits that match progress entries
      const allCustomHabits = await dbHelpers.getCustomHabits(userId);
      const trackedCustomHabits = allCustomHabits.filter(habit => 
        trackedHabitIds.includes(habit.id)
      );
      
      // Combine only the habits user is actually tracking
      const activeHabits = [...trackedScienceHabits, ...trackedCustomHabits];

      // If no active habits but user has progress, there might be orphaned progress entries
      if (activeHabits.length === 0 && progress.length > 0) {
        console.warn('Found orphaned progress entries that should be cleaned up:', progress.map(p => p.habitId));
      }
      
      // Clean up orphaned progress entries (progress for habits that no longer exist)
      const orphanedProgressIds = progress
        .filter(p => {
          const scienceMatch = trackedScienceHabits.find(h => h.id === p.habitId);
          const customMatch = trackedCustomHabits.find(h => h.id === p.habitId);
          return !(scienceMatch || customMatch);
        })
        .map(p => p.habitId);
        
      if (orphanedProgressIds.length > 0) {
        console.log('🧹 Cleaning up orphaned progress entries:', orphanedProgressIds);
        // Delete orphaned progress entries
        for (const habitId of orphanedProgressIds) {
          await dbHelpers.deleteProgress(userId, habitId);
        }
        // Remove from current progress array
        const cleanedProgress = progress.filter(p => !orphanedProgressIds.includes(p.habitId));
        
        // Update the final result
        set({ 
          currentUser: user,
          userHabits: activeHabits,
          userProgress: cleanedProgress,
          isLoading: false 
        });
        return;
      }

      set({ 
        currentUser: user,
        userHabits: activeHabits,
        userProgress: progress,
        isLoading: false 
      });
      
    } catch (error) {
      console.error('Failed to load user data:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load user data',
        isLoading: false 
      });
    }
  },

  updateUserProgress: async (habitId, date) => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      set({ error: null });
      
      console.log('Marking habit complete:', habitId, 'for user:', currentUser.id, 'date:', date);
      await dbHelpers.markHabitComplete(currentUser.id, habitId, date);
      console.log('Habit marked complete, refreshing progress...');
      
      // Refresh progress data
      await get().refreshProgress();
      
      const { userProgress } = get();
      console.log('Progress after refresh:', userProgress);
      
      // Dispatch event for reminder system
      window.dispatchEvent(new CustomEvent('habit-completed', { 
        detail: { habitId, userId: currentUser.id, date } 
      }));
      
      // Check for new badges after progress update
      const { useBadgeStore } = await import('./badgeStore');
      useBadgeStore.getState().checkForNewBadges(currentUser.id, habitId);
      
    } catch (error) {
      console.error('Failed to update progress:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update progress'
      });
    }
  },

  refreshProgress: async () => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      const progress = await dbHelpers.getUserProgress(currentUser.id);
      set({ userProgress: progress });
    } catch (error) {
      console.error('Failed to refresh progress:', error);
    }
  },

  saveCloudConfig: async (cloudConfig) => {
    const { currentUser } = get();
    if (!currentUser) return;

    try {
      set({ isLoading: true, error: null });
      
      // Update user with cloud configuration
      await get().updateUser({ cloudConfig });
      
      console.log('Cloud configuration saved successfully:', cloudConfig);
      
    } catch (error) {
      console.error('Failed to save cloud config:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save cloud configuration',
        isLoading: false 
      });
    }
  },

  setError: (error) => set({ error }),

  toggleHabitCompletion: async (habitId, date) => {
    // Alias for updateUserProgress for backward compatibility
    await get().updateUserProgress(habitId, date);
  },

  clearUser: () => set({
    currentUser: null,
    userHabits: [],
    userProgress: [],
    isLoading: false,
    error: null
  })
}));

// Utility functions for dashboard
export const getDashboardStats = (progress: Progress[]) => {
  const totalHabits = progress.length;
  const totalCompletions = progress.reduce((sum, p) => sum + p.totalDays, 0);
  const currentStreaks = progress.map(p => p.currentStreak);
  const longestStreak = Math.max(...progress.map(p => p.longestStreak), 0);
  const avgStreak = currentStreaks.length > 0 
    ? Math.round(currentStreaks.reduce((sum, s) => sum + s, 0) / currentStreaks.length)
    : 0;

  return {
    totalHabits,
    totalCompletions,
    longestStreak,
    avgStreak,
    activeStreaks: currentStreaks.filter(s => s > 0).length
  };
};

export const getTodayCompletions = (progress: Progress[]) => {
  const today = new Date().toISOString().split('T')[0];
  return progress.filter(p => p.completions.includes(today));
};

export const getHabitProgress = (habitId: string, progress: Progress[]) => {
  return progress.find(p => p.habitId === habitId);
};