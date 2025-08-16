/**
 * Testing Types
 * 
 * TypeScript interfaces for the User Data Mock Dataset Testing Environment
 */

export interface MockUserProfile {
  id: string;
  name: string;
  scenario: 'new_user' | 'consistent_user' | 'struggling_user' | 'power_user' | 'returning_user' | 'custom';
  description: string;
  createdAt: string;
  lastActiveAt: string;
  
  // User Preferences & Goals
  onboarding: {
    selectedGoals: string[];
    completedOnboarding: boolean;
    onboardingStep: number;
    skippedSteps: string[];
  };
  
  preferences: {
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    categories: string[];
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'flexible';
    reminderFrequency: 'high' | 'medium' | 'low' | 'none';
    privacyLevel: 'open' | 'private';
  };
  
  // Habit Selection & Progress
  habits: {
    active: UserHabit[];
    completed: UserHabit[];
    paused: UserHabit[];
    abandoned: UserHabit[];
  };
  
  // Progress & Analytics Data
  analytics: {
    totalDaysActive: number;
    longestStreak: number;
    currentStreak: number;
    completionRate: number;
    averageSessionDuration: number;
    lastSevenDays: DailyProgress[];
    monthlyProgress: MonthlyProgress[];
    milestones: Milestone[];
  };
  
  // Behavioral Patterns
  behavior: {
    loginFrequency: 'daily' | 'weekly' | 'sporadic' | 'irregular';
    engagementLevel: 'high' | 'medium' | 'low';
    motivationTriggers: string[];
    strugglingAreas: string[];
    successPatterns: string[];
  };
}

export interface UserHabit {
  habitId: string;
  habitTitle: string;
  startedAt: string;
  currentStreak: number;
  longestStreak: number;
  completionRate: number;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  completions: HabitCompletion[];
  reminders: ReminderSettings;
  notes: string[];
  difficulty: 'easy' | 'challenging' | 'perfect';
}

export interface HabitCompletion {
  date: string;
  completed: boolean;
  completedAt?: string;
  duration?: number;
  quality?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  mood?: 'great' | 'good' | 'okay' | 'difficult' | 'struggled';
  context?: {
    location: string;
    timeOfDay: string;
    energy: 'high' | 'medium' | 'low';
  };
}

export interface ReminderSettings {
  enabled: boolean;
  time: string;
  frequency: 'daily' | 'weekly' | 'custom';
  days?: string[];
}

export interface DailyProgress {
  date: string;
  habitsCompleted: number;
  habitsTotal: number;
  completionRate: number;
  streaksActive: number;
  timeSpentInApp: number;
  mood: string;
  notes?: string;
}

export interface MonthlyProgress {
  month: string;
  habitsCompleted: number;
  completionRate: number;
}

export interface Milestone {
  id: string;
  title: string;
  achievedAt: string;
  type: 'completion' | 'streak' | 'habit_mastery' | 'consistency';
}

export interface BehaviorEvent {
  userId: string;
  action: string;
  data: any;
  timestamp: string;
}

export interface UserTestingContext {
  currentUser: MockUserProfile | null;
  isTestingMode: boolean;
  behaviorEvents: BehaviorEvent[];
  insights: TestingInsight[];
}

export interface TestingInsight {
  type: 'positive' | 'warning' | 'neutral';
  message: string;
  timestamp: string;
  category: 'engagement' | 'completion' | 'behavioral' | 'technical';
}

export interface UserScenarioComparison {
  users: MockUserProfile[];
  metric: 'completion_rate' | 'streaks' | 'engagement' | 'behavior';
  insights: string[];
}