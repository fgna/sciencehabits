import { create } from 'zustand';
import { Habit } from '../types';
import { dbHelpers } from '../services/storage/database';
import { createDefaultFrequency, createDefaultReminders } from '../utils/frequencyHelpers';

interface HabitFormData {
  title: string;
  description: string;
  timeMinutes: number;
  category: string; // Flexible to support new tiers and old categories
  difficulty: string; // Support both old and new difficulty levels
  equipment: string;
  instructions: string;
  goalTags: string[];
  lifestyleTags: string[];
  timeTags: string[];
}

interface HabitState {
  // Form state
  isCreating: boolean;
  editingHabit: Habit | null;
  formData: HabitFormData;
  formErrors: Record<string, string>;
  
  // Data state
  customHabits: Habit[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setFormData: (data: Partial<HabitFormData>) => void;
  setFormError: (field: string, error: string) => void;
  clearFormErrors: () => void;
  resetForm: () => void;
  
  createHabit: (userId: string) => Promise<Habit | null>;
  updateHabit: (habitId: string, updates: Partial<Habit>) => Promise<boolean>;
  deleteHabit: (habitId: string, userId: string) => Promise<boolean>;
  loadCustomHabits: (userId: string) => Promise<void>;
  
  startCreating: () => void;
  startEditing: (habit: Habit) => void;
  cancelEditing: () => void;
  
  setError: (error: string | null) => void;
}

const defaultFormData: HabitFormData = {
  title: '',
  description: '',
  timeMinutes: 5,
  category: 'productivity',
  difficulty: 'beginner',
  equipment: 'none',
  instructions: '',
  goalTags: [],
  lifestyleTags: ['professional', 'parent', 'student'],
  timeTags: ['flexible']
};

export const useHabitStore = create<HabitState>((set, get) => ({
  // Initial state
  isCreating: false,
  editingHabit: null,
  formData: defaultFormData,
  formErrors: {},
  customHabits: [],
  isLoading: false,
  error: null,

  // Form actions
  setFormData: (data) => set((state) => ({
    formData: { ...state.formData, ...data }
  })),

  setFormError: (field, error) => set((state) => ({
    formErrors: { ...state.formErrors, [field]: error }
  })),

  clearFormErrors: () => set({ formErrors: {} }),

  resetForm: () => set({
    formData: defaultFormData,
    formErrors: {},
    isCreating: false,
    editingHabit: null
  }),

  // CRUD operations
  createHabit: async (userId) => {
    const { formData } = get();
    
    try {
      set({ isLoading: true, error: null });
      
      // Validate form
      const errors = validateHabitForm(formData);
      if (Object.keys(errors).length > 0) {
        set({ formErrors: errors, isLoading: false });
        return null;
      }

      // Create habit with proper type conversion
      const habitData: Omit<Habit, 'id' | 'isCustom'> = {
        title: formData.title,
        description: formData.description,
        timeMinutes: formData.timeMinutes,
        category: formData.category,
        difficulty: formData.difficulty as any, // Allow flexible difficulty values
        equipment: formData.equipment,
        instructions: formData.instructions,
        goalTags: formData.goalTags,
        lifestyleTags: formData.lifestyleTags,
        timeTags: formData.timeTags,
        researchIds: [], // Custom habits don't have research backing initially
        frequency: createDefaultFrequency(),
        reminders: createDefaultReminders()
      };
      const habit = await dbHelpers.createCustomHabit(habitData);

      // Create initial progress entry for the user
      await dbHelpers.createProgress(userId, habit.id);

      // Add to local state 
      set((state) => ({
        customHabits: [...state.customHabits, habit],
        isLoading: false,
        isCreating: false,
        formData: defaultFormData,
        formErrors: {}
      }));

      return habit;
      
    } catch (error) {
      console.error('Failed to create habit:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to create habit',
        isLoading: false
      });
      return null;
    }
  },

  updateHabit: async (habitId, updates) => {
    try {
      set({ isLoading: true, error: null });
      
      // Update in database
      await dbHelpers.updateHabit(habitId, updates);
      
      // Update in local state
      set((state) => ({
        customHabits: state.customHabits.map(h =>
          h.id === habitId ? { ...h, ...updates } : h
        ),
        isLoading: false,
        editingHabit: null,
        formData: defaultFormData,
        formErrors: {}
      }));

      return true;
      
    } catch (error) {
      console.error('Failed to update habit:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to update habit',
        isLoading: false
      });
      return false;
    }
  },

  deleteHabit: async (habitId, userId) => {
    try {
      set({ isLoading: true, error: null });
      
      // Optimistically remove from local state first
      set((state) => ({
        customHabits: state.customHabits.filter(h => h.id !== habitId),
        isLoading: false
      }));
      
      // Delete habit and associated progress from database
      await dbHelpers.deleteHabit(habitId);
      await dbHelpers.deleteProgress(userId, habitId);

      return true;
      
    } catch (error) {
      console.error('Failed to delete habit:', error);
      
      // Reload custom habits to restore state on error
      await get().loadCustomHabits(userId);
      
      set({
        error: error instanceof Error ? error.message : 'Failed to delete habit',
        isLoading: false
      });
      return false;
    }
  },

  loadCustomHabits: async (userId) => {
    try {
      set({ isLoading: true, error: null });
      
      const habits = await dbHelpers.getCustomHabits(userId);
      
      set({
        customHabits: habits,
        isLoading: false
      });
      
    } catch (error) {
      console.error('Failed to load custom habits:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load custom habits',
        isLoading: false
      });
    }
  },

  // UI actions
  startCreating: () => set({
    isCreating: true,
    editingHabit: null,
    formData: defaultFormData,
    formErrors: {}
  }),

  startEditing: (habit) => set({
    isCreating: true,
    editingHabit: habit,
    formData: {
      title: habit.title,
      description: habit.description,
      timeMinutes: habit.timeMinutes,
      category: habit.category,
      difficulty: habit.difficulty,
      equipment: habit.equipment,
      instructions: Array.isArray(habit.instructions) ? habit.instructions.join('\n') : habit.instructions,
      goalTags: habit.goalTags,
      lifestyleTags: habit.lifestyleTags,
      timeTags: habit.timeTags
    },
    formErrors: {}
  }),

  cancelEditing: () => set({
    isCreating: false,
    editingHabit: null,
    formData: defaultFormData,
    formErrors: {}
  }),

  setError: (error) => set({ error })
}));

// Form validation
function validateHabitForm(data: HabitFormData): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.title.trim()) {
    errors.title = 'Title is required';
  } else if (data.title.length > 60) {
    errors.title = 'Title must be 60 characters or less';
  }

  if (!data.description.trim()) {
    errors.description = 'Description is required';
  } else if (data.description.length > 150) {
    errors.description = 'Description must be 150 characters or less';
  }

  if (data.timeMinutes < 1) {
    errors.timeMinutes = 'Duration must be at least 1 minute';
  } else if (data.timeMinutes > 120) {
    errors.timeMinutes = 'Duration must be 120 minutes or less';
  }

  if (!data.instructions.trim()) {
    errors.instructions = 'Instructions are required';
  } else if (data.instructions.length > 500) {
    errors.instructions = 'Instructions must be 500 characters or less';
  }

  if (data.goalTags.length === 0) {
    errors.goalTags = 'Select at least one goal';
  }

  if (data.lifestyleTags.length === 0) {
    errors.lifestyleTags = 'Select at least one lifestyle';
  }

  if (data.timeTags.length === 0) {
    errors.timeTags = 'Select at least one time preference';
  }

  return errors;
}

// Habit templates for inspiration
export const habitTemplates = [
  {
    title: '10 Push-ups',
    description: 'Quick strength training to energize your body',
    category: 'health' as const,
    timeMinutes: 2,
    difficulty: 'beginner' as const,
    instructions: '1. Get into push-up position\n2. Keep your body straight\n3. Do 10 controlled push-ups\n4. Rest and repeat if desired'
  },
  {
    title: 'Read 5 Pages',
    description: 'Daily reading habit to expand knowledge',
    category: 'productivity' as const,
    timeMinutes: 10,
    difficulty: 'beginner' as const,
    instructions: '1. Choose a book you want to read\n2. Find a quiet spot\n3. Read 5 pages without distractions\n4. Note one interesting thing you learned'
  },
  {
    title: 'Evening Reflection',
    description: 'End your day with thoughtful self-reflection',
    category: 'stress' as const,
    timeMinutes: 5,
    difficulty: 'beginner' as const,
    instructions: '1. Sit quietly before bed\n2. Think about 3 good things from today\n3. Consider what you learned\n4. Set intention for tomorrow'
  },
  {
    title: 'Cold Shower Finish',
    description: 'End shower with cold water for energy boost',
    category: 'energy' as const,
    timeMinutes: 1,
    difficulty: 'intermediate' as const,
    instructions: '1. Take normal shower\n2. Turn to cold for last 30-60 seconds\n3. Breathe deeply and stay calm\n4. End on cold temperature'
  }
];