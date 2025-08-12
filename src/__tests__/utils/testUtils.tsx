import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { createDefaultFrequency, createDefaultReminders } from '../../utils/frequencyHelpers';

// Simple test wrapper without complex providers
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div data-testid="test-wrapper">{children}</div>;
};

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestWrapper, ...options });

// Re-export everything from RTL
export * from '@testing-library/react';

// Override render method
export { customRender as render };
export { TestWrapper };

// Test data factories
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-1',
  name: 'Test User',
  createdAt: new Date().toISOString(),
  goals: ['reduce_stress', 'improve_sleep'],
  availableTime: '10-15 minutes',
  preferredTime: 'morning' as const,
  lifestyle: 'professional' as const,
  language: 'en' as const,
  trial: {
    hasUsedTrial: false,
    isActive: false
  },
  isPremium: false,
  ...overrides
});

export const createMockHabit = (overrides = {}) => ({
  id: 'test-habit-1',
  title: 'Test Habit',
  description: 'A test habit for unit testing',
  timeMinutes: 10,
  category: 'mindfulness',
  goalTags: ['reduce_stress'],
  lifestyleTags: ['professional'],
  timeTags: ['morning'],
  instructions: 'Test instructions for this habit',
  researchIds: ['test-research-1'],
  isCustom: false,
  difficulty: 'easy' as const,
  equipment: 'none',
  frequency: createDefaultFrequency(),
  reminders: createDefaultReminders(),
  ...overrides
});

export const createMockProgress = (overrides = {}) => ({
  id: 'test-user-1:test-habit-1',
  userId: 'test-user-1',
  habitId: 'test-habit-1',
  dateStarted: new Date().toISOString().split('T')[0],
  completions: [],
  currentStreak: 0,
  longestStreak: 0,
  totalDays: 0,
  ...overrides
});

export const createMockResearchArticle = (overrides = {}) => ({
  id: 'test-article-1',
  studyId: 'test-study-1',
  title: 'Test Research Article',
  subtitle: 'A test article for unit testing',
  category: 'stress_management',
  tags: ['stress', 'breathing'],
  readingTime: 5,
  difficulty: 'beginner' as const,
  language: 'en',
  publishedDate: '2023-01-01',
  author: 'Test Author',
  relatedHabits: ['test-habit-1'],
  keyTakeaways: [
    'Test takeaway 1',
    'Test takeaway 2'
  ],
  studyDetails: {
    journal: 'Test Journal',
    year: 2023,
    sampleSize: 100,
    studyType: 'randomized_controlled_trial',
    evidenceLevel: 'high',
    statisticalSignificance: 'p < 0.05'
  },
  content: '# Test Article\n\nThis is test content.',
  ...overrides
});

// Utility functions for testing
export const waitForLoadingToFinish = () => {
  return new Promise(resolve => setTimeout(resolve, 0));
};

export const mockLocalStorage = () => {
  const store: { [key: string]: string } = {};
  
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: jest.fn((index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    })
  };
};

// Date utilities for testing
export const mockDate = (dateString: string) => {
  const mockDate = new Date(dateString);
  const originalDate = Date;
  
  global.Date = jest.fn(() => mockDate) as any;
  global.Date.UTC = originalDate.UTC;
  global.Date.parse = originalDate.parse;
  global.Date.now = () => mockDate.getTime();
  
  return () => {
    global.Date = originalDate;
  };
};

// Custom matchers
export const customMatchers = {
  toBeWithinRange: (received: number, floor: number, ceiling: number) => {
    const pass = received >= floor && received <= ceiling;
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be within range ${floor} - ${ceiling}`,
      pass
    };
  },
  
  toHaveValidHabitStructure: (received: any) => {
    const requiredFields = ['id', 'title', 'description', 'timeMinutes', 'category', 'goalTags'];
    const hasRequiredFields = requiredFields.every(field => received.hasOwnProperty(field));
    
    return {
      message: () => `expected habit to have required fields: ${requiredFields.join(', ')}`,
      pass: hasRequiredFields
    };
  },
  
  toBeValidDate: (received: string) => {
    const date = new Date(received);
    const isValid = !isNaN(date.getTime());
    
    return {
      message: () => `expected ${received} ${isValid ? 'not ' : ''}to be a valid date`,
      pass: isValid
    };
  }
};

// Extend Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
      toHaveValidHabitStructure(): R;
      toBeValidDate(): R;
    }
  }
}

// Mock Zustand stores for testing
export const mockUserStore = {
  currentUser: null,
  userHabits: [],
  userProgress: [],
  isLoading: false,
  error: null,
  setCurrentUser: jest.fn(),
  addUserHabit: jest.fn(),
  removeUserHabit: jest.fn(),
  updateUserProgress: jest.fn(),
  refreshProgress: jest.fn(),
  reset: jest.fn()
};

export const mockHabitStore = {
  customHabits: [],
  isLoading: false,
  error: null,
  editingHabit: null,
  loadCustomHabits: jest.fn(),
  createHabit: jest.fn(),
  updateHabit: jest.fn(),
  deleteHabit: jest.fn(),
  startEditing: jest.fn(),
  cancelEditing: jest.fn(),
  setError: jest.fn(),
  reset: jest.fn()
};

// Async testing utilities
export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

export const waitForNextUpdate = async () => {
  await new Promise(resolve => setTimeout(resolve, 0));
};