import { create } from 'zustand';
import { AnalyticsData, calculateAnalytics, getDateRange } from '../utils/analyticsHelpers';
import { Progress, Habit } from '../types';

type TimeRange = 'week' | 'month' | '3months' | 'year' | 'all';

interface AnalyticsState {
  // Data
  analyticsData: AnalyticsData | null;
  selectedTimeRange: TimeRange;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  
  // UI state
  selectedHabitForDetails: string | null;
  showAchievements: boolean;
  compareHabits: string[];
  
  // Actions
  loadAnalytics: (progress: Progress[], habits: Habit[]) => void;
  setTimeRange: (range: TimeRange) => void;
  setSelectedHabit: (habitId: string | null) => void;
  toggleAchievements: () => void;
  addToComparison: (habitId: string) => void;
  removeFromComparison: (habitId: string) => void;
  clearComparison: () => void;
  refreshAnalytics: (progress: Progress[], habits: Habit[]) => void;
  setError: (error: string | null) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  // Initial state
  analyticsData: null,
  selectedTimeRange: '3months',
  isLoading: false,
  error: null,
  lastUpdated: null,
  selectedHabitForDetails: null,
  showAchievements: false,
  compareHabits: [],

  // Actions
  loadAnalytics: (progress: Progress[], habits: Habit[]) => {
    try {
      set({ isLoading: true, error: null });
      
      const { selectedTimeRange } = get();
      const { start, end } = getDateRange(selectedTimeRange);
      
      const analyticsData = calculateAnalytics(progress, habits, start, end);
      
      set({ 
        analyticsData,
        isLoading: false,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to calculate analytics:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to calculate analytics',
        isLoading: false
      });
    }
  },

  setTimeRange: (range: TimeRange) => {
    set({ selectedTimeRange: range });
    // Trigger analytics recalculation if we have data
    const { analyticsData } = get();
    if (analyticsData) {
      // We'll need to pass progress and habits again - this will be handled by the component
      set({ analyticsData: null }); // Clear to force reload
    }
  },

  setSelectedHabit: (habitId: string | null) => {
    set({ selectedHabitForDetails: habitId });
  },

  toggleAchievements: () => {
    set((state) => ({ showAchievements: !state.showAchievements }));
  },

  addToComparison: (habitId: string) => {
    set((state) => {
      if (state.compareHabits.length >= 4) return state; // Max 4 habits for comparison
      if (state.compareHabits.includes(habitId)) return state;
      return { compareHabits: [...state.compareHabits, habitId] };
    });
  },

  removeFromComparison: (habitId: string) => {
    set((state) => ({
      compareHabits: state.compareHabits.filter(id => id !== habitId)
    }));
  },

  clearComparison: () => {
    set({ compareHabits: [] });
  },

  refreshAnalytics: (progress: Progress[], habits: Habit[]) => {
    const { loadAnalytics } = get();
    loadAnalytics(progress, habits);
  },

  setError: (error: string | null) => {
    set({ error });
  }
}));

// Utility functions for analytics display
export function formatPercentage(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatTrend(value: number): { text: string; color: string; icon: string } {
  if (value > 5) {
    return { text: `+${Math.round(value)}%`, color: 'text-green-600', icon: '📈' };
  } else if (value < -5) {
    return { text: `${Math.round(value)}%`, color: 'text-red-600', icon: '📉' };
  } else {
    return { text: 'Stable', color: 'text-gray-600', icon: '➡️' };
  }
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 bg-green-100';
  if (score >= 60) return 'text-yellow-600 bg-yellow-100';
  if (score >= 40) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Needs Improvement';
}

export function getRarityColor(rarity: string): string {
  switch (rarity) {
    case 'legendary': return 'text-purple-600 bg-purple-100 border-purple-300';
    case 'rare': return 'text-blue-600 bg-blue-100 border-blue-300';
    case 'uncommon': return 'text-green-600 bg-green-100 border-green-300';
    case 'common': 
    default: return 'text-gray-600 bg-gray-100 border-gray-300';
  }
}