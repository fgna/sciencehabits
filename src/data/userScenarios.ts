/**
 * User Scenarios Data
 * 
 * Comprehensive mock user profiles for testing different user journeys
 */

import { MockUserProfile, UserHabit, HabitCompletion, DailyProgress } from '../types/testing';

// Helper function to generate realistic completion patterns
export function generateCompletions(
  startDate: string, 
  days: number, 
  completionRate: number, 
  endDate?: string
): HabitCompletion[] {
  const completions: HabitCompletion[] = [];
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const totalDays = Math.min(days, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  
  for (let i = 0; i < totalDays; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const completed = Math.random() < completionRate;
    const completion: HabitCompletion = {
      date: dateStr,
      completed,
    };
    
    if (completed) {
      completion.completedAt = `${dateStr}T${String(Math.floor(Math.random() * 12) + 7).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`;
      completion.duration = Math.floor(Math.random() * 30) + 5; // 5-35 minutes
      completion.quality = (Math.floor(Math.random() * 3) + 3) as 3 | 4 | 5; // 3-5 rating
      completion.mood = ['good', 'great', 'okay'][Math.floor(Math.random() * 3)] as 'good' | 'great' | 'okay';
    } else {
      const missReasons = [
        'Overslept', 'Too busy', 'Forgot', 'Not feeling well', 'Travel day', 'No motivation'
      ];
      completion.notes = missReasons[Math.floor(Math.random() * missReasons.length)];
    }
    
    completions.push(completion);
  }
  
  return completions;
}

// Helper function to generate daily progress data
export function generateDailyProgress(startDate: string, days: number): DailyProgress[] {
  const progress: DailyProgress[] = [];
  const start = new Date(startDate);
  
  for (let i = 0; i < days; i++) {
    const currentDate = new Date(start);
    currentDate.setDate(start.getDate() + i);
    const dateStr = currentDate.toISOString().split('T')[0];
    
    const habitsTotal = Math.floor(Math.random() * 3) + 2; // 2-4 habits
    const habitsCompleted = Math.floor(Math.random() * (habitsTotal + 1));
    const completionRate = habitsTotal > 0 ? Math.round((habitsCompleted / habitsTotal) * 100) : 0;
    
    progress.push({
      date: dateStr,
      habitsCompleted,
      habitsTotal,
      completionRate,
      streaksActive: habitsCompleted,
      timeSpentInApp: Math.floor(Math.random() * 300) + 60, // 1-6 minutes
      mood: ['excited', 'good', 'okay', 'frustrated', 'motivated'][Math.floor(Math.random() * 5)]
    });
  }
  
  return progress;
}

// New User Scenarios
export const NEW_USER_SCENARIOS: MockUserProfile[] = [
  {
    id: 'new_user_excited',
    name: 'Sarah - Excited New User',
    scenario: 'new_user',
    description: 'Just completed onboarding, selected ambitious goals, high motivation',
    createdAt: '2024-08-15T09:00:00Z',
    lastActiveAt: '2024-08-16T07:30:00Z',
    
    onboarding: {
      selectedGoals: ['improve_health', 'increase_energy', 'improve_mood'],
      completedOnboarding: true,
      onboardingStep: 100,
      skippedSteps: []
    },
    
    preferences: {
      difficulty: 'intermediate',
      categories: ['health', 'energy', 'mindfulness'],
      timeOfDay: 'morning',
      reminderFrequency: 'high',
      privacyLevel: 'open'
    },
    
    habits: {
      active: [
        {
          habitId: 'morning-meditation',
          habitTitle: '10-Minute Morning Meditation',
          startedAt: '2024-08-15T09:00:00Z',
          currentStreak: 2,
          longestStreak: 2,
          completionRate: 100,
          status: 'active',
          completions: [
            {
              date: '2024-08-15',
              completed: true,
              completedAt: '2024-08-15T07:15:00Z',
              duration: 12,
              quality: 4,
              mood: 'good',
              notes: 'Felt really centered after this!'
            },
            {
              date: '2024-08-16',
              completed: true,
              completedAt: '2024-08-16T07:10:00Z',
              duration: 10,
              quality: 5,
              mood: 'great',
              notes: 'Getting into the rhythm'
            }
          ],
          reminders: {
            enabled: true,
            time: '07:00',
            frequency: 'daily'
          },
          notes: ['Really enjoying this habit!'],
          difficulty: 'perfect'
        },
        {
          habitId: 'evening-reading',
          habitTitle: 'Read for 20 Minutes Before Bed',
          startedAt: '2024-08-15T09:00:00Z',
          currentStreak: 1,
          longestStreak: 1,
          completionRate: 50,
          status: 'active',
          completions: [
            {
              date: '2024-08-15',
              completed: true,
              completedAt: '2024-08-15T22:30:00Z',
              duration: 25,
              quality: 5,
              mood: 'great'
            },
            {
              date: '2024-08-16',
              completed: false,
              notes: 'Was too tired, fell asleep early'
            }
          ],
          reminders: {
            enabled: true,
            time: '21:30',
            frequency: 'daily'
          },
          notes: [],
          difficulty: 'challenging'
        }
      ],
      completed: [],
      paused: [],
      abandoned: []
    },
    
    analytics: {
      totalDaysActive: 2,
      longestStreak: 2,
      currentStreak: 2,
      completionRate: 75,
      averageSessionDuration: 180,
      lastSevenDays: [
        {
          date: '2024-08-15',
          habitsCompleted: 2,
          habitsTotal: 2,
          completionRate: 100,
          streaksActive: 2,
          timeSpentInApp: 300,
          mood: 'excited'
        },
        {
          date: '2024-08-16',
          habitsCompleted: 1,
          habitsTotal: 2,
          completionRate: 50,
          streaksActive: 1,
          timeSpentInApp: 120,
          mood: 'good'
        }
      ],
      monthlyProgress: [],
      milestones: [
        {
          id: 'first_habit_completed',
          title: 'First Habit Completed',
          achievedAt: '2024-08-15T07:15:00Z',
          type: 'completion'
        }
      ]
    },
    
    behavior: {
      loginFrequency: 'daily',
      engagementLevel: 'high',
      motivationTriggers: ['progress_visibility', 'streak_counting', 'positive_reinforcement'],
      strugglingAreas: [],
      successPatterns: ['morning_habits', 'clear_reminders']
    }
  },

  {
    id: 'new_user_overwhelmed',
    name: 'Mike - Overwhelmed New User',
    scenario: 'new_user',
    description: 'Started with too many habits, struggling with consistency',
    createdAt: '2024-08-10T14:30:00Z',
    lastActiveAt: '2024-08-14T19:45:00Z',
    
    onboarding: {
      selectedGoals: ['improve_health', 'increase_energy', 'reduce_stress', 'improve_mood', 'increase_focus'],
      completedOnboarding: true,
      onboardingStep: 100,
      skippedSteps: ['habit_timing_setup']
    },
    
    preferences: {
      difficulty: 'intermediate',
      categories: ['health', 'productivity', 'mindfulness'],
      timeOfDay: 'flexible',
      reminderFrequency: 'medium',
      privacyLevel: 'private'
    },
    
    habits: {
      active: [
        {
          habitId: 'morning-workout',
          habitTitle: '30-Minute Morning Workout',
          startedAt: '2024-08-10T14:30:00Z',
          currentStreak: 0,
          longestStreak: 2,
          completionRate: 33,
          status: 'active',
          completions: generateCompletions('2024-08-10', 7, 0.33),
          reminders: {
            enabled: true,
            time: '06:30',
            frequency: 'daily'
          },
          notes: ['Too intense for morning'],
          difficulty: 'challenging'
        }
      ],
      paused: [
        {
          habitId: 'daily-journaling',
          habitTitle: 'Daily Journaling',
          startedAt: '2024-08-10T14:30:00Z',
          currentStreak: 0,
          longestStreak: 1,
          completionRate: 20,
          status: 'paused',
          completions: generateCompletions('2024-08-10', 5, 0.20),
          reminders: {
            enabled: false,
            time: '20:00',
            frequency: 'daily'
          },
          notes: ['Too time consuming right now'],
          difficulty: 'challenging'
        }
      ],
      abandoned: [
        {
          habitId: 'cold-shower',
          habitTitle: 'Take Cold Shower',
          startedAt: '2024-08-10T14:30:00Z',
          currentStreak: 0,
          longestStreak: 1,
          completionRate: 10,
          status: 'abandoned',
          completions: generateCompletions('2024-08-10', 3, 0.10),
          reminders: {
            enabled: false,
            time: '07:00',
            frequency: 'daily'
          },
          notes: ['Too intense for me right now'],
          difficulty: 'challenging'
        }
      ],
      completed: []
    },
    
    analytics: {
      totalDaysActive: 6,
      longestStreak: 2,
      currentStreak: 0,
      completionRate: 25,
      averageSessionDuration: 45,
      lastSevenDays: generateDailyProgress('2024-08-10', 7),
      monthlyProgress: [],
      milestones: []
    },
    
    behavior: {
      loginFrequency: 'sporadic',
      engagementLevel: 'low',
      motivationTriggers: ['simplification', 'small_wins', 'encouragement'],
      strugglingAreas: ['too_many_habits', 'difficulty_too_high', 'time_management'],
      successPatterns: []
    }
  }
];

// Power User Scenarios
export const POWER_USER_SCENARIOS: MockUserProfile[] = [
  {
    id: 'power_user_optimizer',
    name: 'Alex - Habit Optimization Expert',
    scenario: 'power_user',
    description: 'Long-term user with multiple completed habits, advanced tracking',
    createdAt: '2024-01-15T10:00:00Z',
    lastActiveAt: '2024-08-16T06:45:00Z',
    
    onboarding: {
      selectedGoals: ['improve_health', 'increase_energy', 'optimize_performance'],
      completedOnboarding: true,
      onboardingStep: 100,
      skippedSteps: []
    },
    
    preferences: {
      difficulty: 'advanced',
      categories: ['health', 'productivity', 'performance'],
      timeOfDay: 'morning',
      reminderFrequency: 'low',
      privacyLevel: 'open'
    },
    
    habits: {
      active: [
        {
          habitId: 'morning-routine-advanced',
          habitTitle: 'Advanced Morning Routine (45 min)',
          startedAt: '2024-06-01T05:30:00Z',
          currentStreak: 76,
          longestStreak: 89,
          completionRate: 95,
          status: 'active',
          completions: generateCompletions('2024-06-01', 76, 0.95),
          reminders: {
            enabled: false,
            time: '05:30',
            frequency: 'daily'
          },
          notes: ['Perfected routine', 'No reminders needed'],
          difficulty: 'perfect'
        },
        {
          habitId: 'deep-work-session',
          habitTitle: '2-Hour Deep Work Session',
          startedAt: '2024-07-01T08:00:00Z',
          currentStreak: 45,
          longestStreak: 45,
          completionRate: 98,
          status: 'active',
          completions: generateCompletions('2024-07-01', 45, 0.98),
          reminders: {
            enabled: false,
            time: '08:00',
            frequency: 'daily'
          },
          notes: ['Highly productive sessions'],
          difficulty: 'perfect'
        }
      ],
      completed: [
        {
          habitId: 'daily-exercise',
          habitTitle: 'Daily Exercise',
          startedAt: '2024-01-15T10:00:00Z',
          currentStreak: 0,
          longestStreak: 127,
          completionRate: 92,
          status: 'completed',
          completions: generateCompletions('2024-01-15', 180, 0.92, '2024-07-15'),
          reminders: {
            enabled: false,
            time: '06:00',
            frequency: 'daily'
          },
          notes: ['Graduated to advanced morning routine'],
          difficulty: 'perfect'
        }
      ],
      paused: [],
      abandoned: []
    },
    
    analytics: {
      totalDaysActive: 214,
      longestStreak: 127,
      currentStreak: 76,
      completionRate: 94,
      averageSessionDuration: 420,
      lastSevenDays: generateDailyProgress('2024-08-10', 7),
      monthlyProgress: [
        { month: '2024-01', habitsCompleted: 58, completionRate: 89 },
        { month: '2024-02', habitsCompleted: 67, completionRate: 91 },
        { month: '2024-03', habitsCompleted: 72, completionRate: 93 },
        { month: '2024-04', habitsCompleted: 75, completionRate: 94 },
        { month: '2024-05', habitsCompleted: 78, completionRate: 95 },
        { month: '2024-06', habitsCompleted: 81, completionRate: 96 },
        { month: '2024-07', habitsCompleted: 83, completionRate: 96 },
        { month: '2024-08', habitsCompleted: 45, completionRate: 97 }
      ],
      milestones: [
        { id: 'first_30_day_streak', title: '30-Day Streak', achievedAt: '2024-02-14T10:00:00Z', type: 'streak' },
        { id: 'first_100_day_streak', title: '100-Day Streak', achievedAt: '2024-04-25T10:00:00Z', type: 'streak' },
        { id: 'completed_first_habit', title: 'First Habit Mastered', achievedAt: '2024-07-15T10:00:00Z', type: 'habit_mastery' },
        { id: 'habit_formation_expert', title: 'Habit Formation Expert', achievedAt: '2024-08-01T10:00:00Z', type: 'consistency' }
      ]
    },
    
    behavior: {
      loginFrequency: 'daily',
      engagementLevel: 'high',
      motivationTriggers: ['advanced_analytics', 'optimization_insights', 'long_term_trends'],
      strugglingAreas: [],
      successPatterns: ['morning_habits', 'consistent_tracking', 'gradual_progression']
    }
  }
];

// Struggling User Scenarios
export const STRUGGLING_USER_SCENARIOS: MockUserProfile[] = [
  {
    id: 'struggling_user_inconsistent',
    name: 'Emma - Inconsistent Patterns',
    scenario: 'struggling_user',
    description: 'User with multiple restart attempts, irregular patterns',
    createdAt: '2024-05-01T16:20:00Z',
    lastActiveAt: '2024-08-14T11:30:00Z',
    
    onboarding: {
      selectedGoals: ['improve_health', 'reduce_stress'],
      completedOnboarding: true,
      onboardingStep: 100,
      skippedSteps: []
    },
    
    preferences: {
      difficulty: 'beginner',
      categories: ['health', 'stress'],
      timeOfDay: 'morning',
      reminderFrequency: 'high',
      privacyLevel: 'private'
    },
    
    habits: {
      active: [
        {
          habitId: 'morning-walk',
          habitTitle: '15-Minute Morning Walk',
          startedAt: '2024-08-01T16:20:00Z',
          currentStreak: 3,
          longestStreak: 7,
          completionRate: 45,
          status: 'active',
          completions: [
            { date: '2024-08-01', completed: true, mood: 'good' },
            { date: '2024-08-02', completed: true, mood: 'okay' },
            { date: '2024-08-03', completed: false, notes: 'Overslept' },
            { date: '2024-08-04', completed: false },
            { date: '2024-08-05', completed: true, mood: 'good' },
            { date: '2024-08-06', completed: false },
            { date: '2024-08-07', completed: false },
            { date: '2024-08-08', completed: true, mood: 'okay' },
            { date: '2024-08-09', completed: true, mood: 'good' },
            { date: '2024-08-10', completed: false },
            { date: '2024-08-11', completed: false },
            { date: '2024-08-12', completed: true, mood: 'good' },
            { date: '2024-08-13', completed: true, mood: 'great' },
            { date: '2024-08-14', completed: true, mood: 'good' },
            { date: '2024-08-15', completed: false },
            { date: '2024-08-16', completed: false }
          ],
          reminders: {
            enabled: true,
            time: '07:30',
            frequency: 'daily'
          },
          notes: [
            'Third time trying this habit',
            'Need to find better reminder system',
            'Works better on weekdays'
          ],
          difficulty: 'challenging'
        }
      ],
      paused: [],
      abandoned: [
        {
          habitId: 'morning-walk-attempt-1',
          habitTitle: '15-Minute Morning Walk',
          startedAt: '2024-05-01T16:20:00Z',
          currentStreak: 0,
          longestStreak: 4,
          completionRate: 25,
          status: 'abandoned',
          completions: generateCompletions('2024-05-01', 20, 0.25, '2024-05-21'),
          reminders: {
            enabled: false,
            time: '07:00',
            frequency: 'daily'
          },
          notes: ['Lost motivation after missing several days'],
          difficulty: 'challenging'
        },
        {
          habitId: 'morning-walk-attempt-2',
          habitTitle: '15-Minute Morning Walk',
          startedAt: '2024-06-15T16:20:00Z',
          currentStreak: 0,
          longestStreak: 7,
          completionRate: 35,
          status: 'abandoned',
          completions: generateCompletions('2024-06-15', 25, 0.35, '2024-07-10'),
          reminders: {
            enabled: false,
            time: '07:00',
            frequency: 'daily'
          },
          notes: ['Travel disrupted routine, never recovered'],
          difficulty: 'challenging'
        }
      ],
      completed: []
    },
    
    analytics: {
      totalDaysActive: 45,
      longestStreak: 7,
      currentStreak: 3,
      completionRate: 35,
      averageSessionDuration: 90,
      lastSevenDays: [
        { date: '2024-08-10', habitsCompleted: 0, habitsTotal: 1, completionRate: 0, streaksActive: 0, timeSpentInApp: 45, mood: 'frustrated' },
        { date: '2024-08-11', habitsCompleted: 0, habitsTotal: 1, completionRate: 0, streaksActive: 0, timeSpentInApp: 0, mood: '' },
        { date: '2024-08-12', habitsCompleted: 1, habitsTotal: 1, completionRate: 100, streaksActive: 1, timeSpentInApp: 120, mood: 'motivated' },
        { date: '2024-08-13', habitsCompleted: 1, habitsTotal: 1, completionRate: 100, streaksActive: 2, timeSpentInApp: 90, mood: 'good' },
        { date: '2024-08-14', habitsCompleted: 1, habitsTotal: 1, completionRate: 100, streaksActive: 3, timeSpentInApp: 105, mood: 'good' },
        { date: '2024-08-15', habitsCompleted: 0, habitsTotal: 1, completionRate: 0, streaksActive: 0, timeSpentInApp: 30, mood: 'disappointed' },
        { date: '2024-08-16', habitsCompleted: 0, habitsTotal: 1, completionRate: 0, streaksActive: 0, timeSpentInApp: 0, mood: '' }
      ],
      monthlyProgress: [
        { month: '2024-05', habitsCompleted: 5, completionRate: 25 },
        { month: '2024-06', habitsCompleted: 0, completionRate: 0 },
        { month: '2024-07', habitsCompleted: 8, completionRate: 35 },
        { month: '2024-08', habitsCompleted: 7, completionRate: 45 }
      ],
      milestones: []
    },
    
    behavior: {
      loginFrequency: 'irregular',
      engagementLevel: 'medium',
      motivationTriggers: ['encouragement', 'small_wins', 'restart_options'],
      strugglingAreas: ['consistency', 'motivation_drops', 'all_or_nothing_thinking'],
      successPatterns: ['shorter_streaks', 'weekday_completion']
    }
  }
];

// Returning User Scenarios
export const RETURNING_USER_SCENARIOS: MockUserProfile[] = [
  {
    id: 'returning_user_hiatus',
    name: 'David - Returning After Break',
    scenario: 'returning_user',
    description: 'Previously active user returning after 3-month hiatus',
    createdAt: '2023-11-20T09:15:00Z',
    lastActiveAt: '2024-08-16T08:00:00Z',
    
    onboarding: {
      selectedGoals: ['improve_health', 'increase_energy', 'improve_mood'],
      completedOnboarding: true,
      onboardingStep: 100,
      skippedSteps: []
    },
    
    preferences: {
      difficulty: 'intermediate',
      categories: ['health', 'energy', 'mindfulness'],
      timeOfDay: 'morning',
      reminderFrequency: 'medium',
      privacyLevel: 'open'
    },
    
    habits: {
      active: [
        {
          habitId: 'morning-meditation-restart',
          habitTitle: '5-Minute Morning Meditation',
          startedAt: '2024-08-14T08:00:00Z',
          currentStreak: 3,
          longestStreak: 3,
          completionRate: 100,
          status: 'active',
          completions: [
            { date: '2024-08-14', completed: true, quality: 3, mood: 'okay', notes: 'Feels good to be back' },
            { date: '2024-08-15', completed: true, quality: 4, mood: 'good', notes: 'Muscle memory returning' },
            { date: '2024-08-16', completed: true, quality: 4, mood: 'good' }
          ],
          reminders: {
            enabled: true,
            time: '07:00',
            frequency: 'daily'
          },
          notes: ['Restarting with lower commitment', 'Building back slowly'],
          difficulty: 'easy'
        }
      ],
      paused: [
        {
          habitId: 'evening-workout',
          habitTitle: '30-Minute Evening Workout',
          startedAt: '2023-11-20T09:15:00Z',
          currentStreak: 0,
          longestStreak: 42,
          completionRate: 78,
          status: 'paused',
          completions: generateCompletions('2023-11-20', 120, 0.78, '2024-05-15'),
          reminders: {
            enabled: false,
            time: '18:00',
            frequency: 'daily'
          },
          notes: ['Was doing great before hiatus', 'Not ready to restart yet'],
          difficulty: 'challenging'
        }
      ],
      completed: [
        {
          habitId: 'daily-reading',
          habitTitle: 'Read 20 Pages Daily',
          startedAt: '2023-11-20T09:15:00Z',
          currentStreak: 0,
          longestStreak: 89,
          completionRate: 85,
          status: 'completed',
          completions: generateCompletions('2023-11-20', 180, 0.85, '2024-05-18'),
          reminders: {
            enabled: false,
            time: '21:00',
            frequency: 'daily'
          },
          notes: ['Completed during first active period'],
          difficulty: 'perfect'
        }
      ],
      abandoned: []
    },
    
    analytics: {
      totalDaysActive: 183,
      longestStreak: 89,
      currentStreak: 3,
      completionRate: 82,
      averageSessionDuration: 240,
      lastSevenDays: generateDailyProgress('2024-08-10', 7),
      monthlyProgress: [
        { month: '2023-11', habitsCompleted: 45, completionRate: 75 },
        { month: '2023-12', habitsCompleted: 58, completionRate: 82 },
        { month: '2024-01', habitsCompleted: 62, completionRate: 85 },
        { month: '2024-02', habitsCompleted: 67, completionRate: 87 },
        { month: '2024-03', habitsCompleted: 71, completionRate: 89 },
        { month: '2024-04', habitsCompleted: 68, completionRate: 86 },
        { month: '2024-05', habitsCompleted: 35, completionRate: 70 },
        { month: '2024-08', habitsCompleted: 3, completionRate: 100 }
      ],
      milestones: [
        { id: 'first_30_day_streak', title: '30-Day Streak', achievedAt: '2023-12-20T10:00:00Z', type: 'streak' },
        { id: 'first_completed_habit', title: 'First Habit Mastered', achievedAt: '2024-05-18T10:00:00Z', type: 'habit_mastery' },
        { id: 'welcome_back', title: 'Welcome Back!', achievedAt: '2024-08-14T08:00:00Z', type: 'completion' }
      ]
    },
    
    behavior: {
      loginFrequency: 'daily',
      engagementLevel: 'medium',
      motivationTriggers: ['past_success_reminder', 'gradual_rebuilding', 'progress_recovery'],
      strugglingAreas: ['maintaining_long_term_motivation', 'life_transitions'],
      successPatterns: ['morning_habits', 'reading_habits', 'gradual_progression']
    }
  }
];

// Consistent User Scenarios
export const CONSISTENT_USER_SCENARIOS: MockUserProfile[] = [
  {
    id: 'consistent_user_steady',
    name: 'Maria - Steady Progress User',
    scenario: 'consistent_user',
    description: 'Reliable user with steady 80% completion rate, good habits',
    createdAt: '2024-03-01T10:00:00Z',
    lastActiveAt: '2024-08-16T07:00:00Z',
    
    onboarding: {
      selectedGoals: ['improve_health', 'increase_energy'],
      completedOnboarding: true,
      onboardingStep: 100,
      skippedSteps: []
    },
    
    preferences: {
      difficulty: 'intermediate',
      categories: ['health', 'energy'],
      timeOfDay: 'morning',
      reminderFrequency: 'medium',
      privacyLevel: 'open'
    },
    
    habits: {
      active: [
        {
          habitId: 'morning-workout-consistent',
          habitTitle: '20-Minute Morning Workout',
          startedAt: '2024-03-01T10:00:00Z',
          currentStreak: 6,
          longestStreak: 23,
          completionRate: 82,
          status: 'active',
          completions: generateCompletions('2024-03-01', 168, 0.82),
          reminders: {
            enabled: true,
            time: '06:30',
            frequency: 'daily'
          },
          notes: ['Very consistent habit', 'Feels natural now'],
          difficulty: 'perfect'
        },
        {
          habitId: 'daily-water-intake',
          habitTitle: 'Drink 8 Glasses of Water',
          startedAt: '2024-04-01T10:00:00Z',
          currentStreak: 12,
          longestStreak: 28,
          completionRate: 85,
          status: 'active',
          completions: generateCompletions('2024-04-01', 137, 0.85),
          reminders: {
            enabled: true,
            time: '09:00',
            frequency: 'daily'
          },
          notes: ['Easy to track', 'Very good for health'],
          difficulty: 'easy'
        }
      ],
      completed: [],
      paused: [],
      abandoned: []
    },
    
    analytics: {
      totalDaysActive: 168,
      longestStreak: 28,
      currentStreak: 12,
      completionRate: 83,
      averageSessionDuration: 120,
      lastSevenDays: generateDailyProgress('2024-08-10', 7),
      monthlyProgress: [
        { month: '2024-03', habitsCompleted: 25, completionRate: 81 },
        { month: '2024-04', habitsCompleted: 48, completionRate: 80 },
        { month: '2024-05', habitsCompleted: 52, completionRate: 84 },
        { month: '2024-06', habitsCompleted: 50, completionRate: 83 },
        { month: '2024-07', habitsCompleted: 51, completionRate: 82 },
        { month: '2024-08', habitsCompleted: 26, completionRate: 84 }
      ],
      milestones: [
        { id: 'first_week_streak', title: 'First Week Complete', achievedAt: '2024-03-08T10:00:00Z', type: 'streak' },
        { id: 'first_month_consistent', title: 'One Month Consistent', achievedAt: '2024-04-01T10:00:00Z', type: 'consistency' }
      ]
    },
    
    behavior: {
      loginFrequency: 'daily',
      engagementLevel: 'medium',
      motivationTriggers: ['consistency_tracking', 'steady_progress', 'routine_maintenance'],
      strugglingAreas: ['occasional_life_disruptions'],
      successPatterns: ['morning_routine', 'simple_habits', 'regular_tracking']
    }
  }
];

// All scenarios combined
export const ALL_USER_SCENARIOS = {
  new_user: NEW_USER_SCENARIOS,
  power_user: POWER_USER_SCENARIOS,
  struggling_user: STRUGGLING_USER_SCENARIOS,
  returning_user: RETURNING_USER_SCENARIOS,
  consistent_user: CONSISTENT_USER_SCENARIOS
};

// Helper to get all users as flat array
export const getAllUserScenarios = (): MockUserProfile[] => {
  return Object.values(ALL_USER_SCENARIOS).flat();
};

// Helper to get user by ID
export const getUserScenarioById = (id: string): MockUserProfile | undefined => {
  return getAllUserScenarios().find(user => user.id === id);
};