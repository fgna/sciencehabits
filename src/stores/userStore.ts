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
  refreshProgress: () => Promise<void>;
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

      console.log('Loading user data for:', userId, user);

      // Get user's recommended habits (from initial onboarding)
      const recommendedHabits = await dbHelpers.getRecommendedHabits(user);
      console.log('Recommended habits found:', recommendedHabits.length, recommendedHabits);
      
      // Get custom habits
      const customHabits = await dbHelpers.getCustomHabits(userId);
      console.log('Custom habits found:', customHabits.length, customHabits);
      
      // Get user's progress
      const progress = await dbHelpers.getUserProgress(userId);
      console.log('Progress entries found:', progress.length, progress);
      
      // Combine all habits and filter to only show those with progress (actively tracking)
      const allHabits = [...recommendedHabits, ...customHabits];
      console.log('All habits before filtering:', allHabits.length, allHabits);
      
      const activeHabits = allHabits.filter(habit => 
        progress.some(p => p.habitId === habit.id)
      );
      console.log('Active habits after filtering:', activeHabits.length, activeHabits);

      // If no active habits but user has progress, there might be orphaned progress entries
      if (activeHabits.length === 0 && progress.length > 0) {
        console.warn('Found progress entries but no matching habits:', progress.map(p => p.habitId));
        
        // Try to get all habits from database to check for mismatches
        const allDbHabits = await dbHelpers.getAllHabits();
        console.log('All habits in database:', allDbHabits.length, allDbHabits.map(h => h.id));
        
        // Find habits that match progress entries
        const progressHabits = allDbHabits.filter(habit =>
          progress.some(p => p.habitId === habit.id)
        );
        console.log('Habits matching progress entries:', progressHabits.length, progressHabits);
        
        if (progressHabits.length > 0) {
          set({ 
            currentUser: user,
            userHabits: progressHabits,
            userProgress: progress,
            isLoading: false 
          });
          return;
        }
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

  setError: (error) => set({ error }),

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