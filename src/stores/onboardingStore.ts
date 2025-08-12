import { create } from 'zustand';
import { User } from '../types';
import { Goal, loadGoals, getAvailableGoals } from '../services/goalsService';

export type OnboardingStep = 'welcome' | 'goals' | 'preferences' | 'recommendations' | 'complete';

interface OnboardingState {
  currentStep: OnboardingStep;
  userData: Partial<User>;
  selectedGoals: string[];
  availableGoals: Goal[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setStep: (step: OnboardingStep) => void;
  setUserData: (data: Partial<User>) => void;
  setGoals: (goals: string[]) => void;
  loadGoalsData: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetOnboarding: () => void;
}

const stepOrder: OnboardingStep[] = ['welcome', 'goals', 'preferences', 'recommendations', 'complete'];

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  currentStep: 'welcome',
  userData: {},
  selectedGoals: [],
  availableGoals: [],
  isLoading: false,
  error: null,

  setStep: (step) => set({ currentStep: step }),
  
  setUserData: (data) => set((state) => ({ 
    userData: { ...state.userData, ...data } 
  })),
  
  setGoals: (goals) => set({ selectedGoals: goals }),
  
  loadGoalsData: async () => {
    try {
      set({ isLoading: true, error: null });
      const allGoals = await loadGoals(); // Wait for goals to load
      const freeGoals = allGoals.filter(goal => goal.tier === 'free'); // Free goals only for onboarding
      set({ availableGoals: freeGoals, isLoading: false });
    } catch (error) {
      console.error('Failed to load goals:', error);
      set({ error: 'Failed to load goals. Please try again.', isLoading: false });
    }
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),

  nextStep: () => {
    const { currentStep } = get();
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      set({ currentStep: stepOrder[currentIndex + 1] });
    }
  },

  previousStep: () => {
    const { currentStep } = get();
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      set({ currentStep: stepOrder[currentIndex - 1] });
    }
  },

  resetOnboarding: () => set({
    currentStep: 'welcome',
    userData: {},
    selectedGoals: [],
    availableGoals: [],
    isLoading: false,
    error: null
  })
}));

export const lifestyleOptions = [
  {
    id: 'professional' as const,
    title: 'Working Professional',
    description: 'Office job, busy schedule, limited time',
    icon: '💼'
  },
  {
    id: 'parent' as const,
    title: 'Parent',
    description: 'Caring for children, irregular schedule',
    icon: '👨‍👩‍👧‍👦'
  },
  {
    id: 'student' as const,
    title: 'Student',
    description: 'Studying, flexible schedule, budget-conscious',
    icon: '📚'
  }
];

export const timePreferenceOptions = [
  {
    id: 'morning' as const,
    title: 'Morning Person',
    description: 'I have the most energy in the morning',
    icon: '🌅',
    time: '6:00 - 10:00 AM'
  },
  {
    id: 'lunch' as const,
    title: 'Midday Breaks',
    description: 'I prefer short breaks during work',
    icon: '☀️',
    time: '11:00 AM - 2:00 PM'
  },
  {
    id: 'evening' as const,
    title: 'Evening Wind-down',
    description: 'I like to relax after work/school',
    icon: '🌆',
    time: '5:00 - 9:00 PM'
  },
  {
    id: 'flexible' as const,
    title: 'Flexible Timing',
    description: 'Whenever I have a few minutes',
    icon: '🔄',
    time: 'Any time'
  }
];

export const dailyTimeOptions = [
  { value: 5, label: '5 minutes', description: 'Quick micro-habits' },
  { value: 10, label: '10 minutes', description: 'Short focused sessions' },
  { value: 15, label: '15 minutes', description: 'Moderate commitment' },
  { value: 20, label: '20+ minutes', description: 'Deeper practices' }
];