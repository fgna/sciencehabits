/**
 * UI Configuration Loader
 * 
 * Loads UI configuration from JSON files to eliminate hardcoded content.
 * Used throughout the app for consistent options and choices.
 */

export interface TimeOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

export interface DailyTimeOption {
  value: number;
  label: string;
  description: string;
  icon: string;
}

export interface LifestyleOption {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface HabitCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface HabitDifficulty {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
}

export interface NavigationTab {
  id: string;
  name: string;
  icon: string;
  path: string;
  description: string;
}

export interface TimeRangeOption {
  value: string;
  label: string;
  description: string;
  icon: string;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface UIConfig {
  version: string;
  lastUpdated: string;
  userPreferences: {
    timeOptions: TimeOption[];
    dailyTimeOptions: DailyTimeOption[];
    lifestyleOptions: LifestyleOption[];
  };
  habits: {
    categories: HabitCategory[];
    difficulties: HabitDifficulty[];
  };
  navigation: {
    tabs: NavigationTab[];
  };
  analytics: {
    timeRangeOptions: TimeRangeOption[];
  };
  languages: Language[];
}

let uiConfigCache: UIConfig | null = null;

/**
 * Load UI configuration from JSON
 */
export async function loadUIConfig(): Promise<UIConfig> {
  if (uiConfigCache) {
    return uiConfigCache;
  }

  try {
    const response = await fetch('/data/ui-config.json');
    if (!response.ok) {
      throw new Error('Failed to fetch UI config');
    }
    
    const config: UIConfig = await response.json();
    uiConfigCache = config;
    return uiConfigCache;
  } catch (error) {
    console.warn('Failed to load UI config, using fallback:', error);
    
    // Fallback UI configuration
    uiConfigCache = {
      version: '1.0.0',
      lastUpdated: '2025-08-16',
      userPreferences: {
        timeOptions: [
          { id: 'morning', label: 'Morning Person', description: 'I prefer starting my day with habits', icon: '🌅' },
          { id: 'lunch', label: 'Midday Focus', description: 'I work best during lunch breaks', icon: '☀️' },
          { id: 'evening', label: 'Evening Routine', description: 'I like to wind down with habits', icon: '🌙' },
          { id: 'flexible', label: 'Flexible', description: 'I can adapt to any time', icon: '🔄' }
        ],
        dailyTimeOptions: [
          { value: 5, label: '5 minutes', description: 'Quick micro-habits', icon: '⚡' },
          { value: 10, label: '10 minutes', description: 'Short focused sessions', icon: '🎯' },
          { value: 15, label: '15 minutes', description: 'Moderate commitment', icon: '⏱️' },
          { value: 20, label: '20+ minutes', description: 'Deeper practices', icon: '🧘‍♀️' }
        ],
        lifestyleOptions: [
          { id: 'professional', title: 'Working Professional', description: 'Office job, busy schedule, limited time', icon: '💼' },
          { id: 'parent', title: 'Parent', description: 'Caring for children, irregular schedule', icon: '👨‍👩‍👧‍👦' },
          { id: 'student', title: 'Student', description: 'Studying, flexible schedule, budget-conscious', icon: '📚' }
        ]
      },
      habits: {
        categories: [
          { id: 'stress', name: 'Stress Management', icon: '🧘‍♀️', description: 'Reduce stress and anxiety', color: 'blue' },
          { id: 'health', name: 'Physical Health', icon: '💪', description: 'Build strength and wellness', color: 'green' },
          { id: 'sleep', name: 'Sleep & Recovery', icon: '😴', description: 'Better rest and recovery', color: 'indigo' }
        ],
        difficulties: [
          { id: 'beginner', name: 'Beginner', description: 'Easy to start, low commitment', color: 'green', icon: '🌱' },
          { id: 'intermediate', name: 'Intermediate', description: 'Moderate effort required', color: 'yellow', icon: '🚀' },
          { id: 'advanced', name: 'Advanced', description: 'Challenging, high commitment', color: 'red', icon: '🏆' }
        ]
      },
      navigation: {
        tabs: [
          { id: 'today', name: 'Today', icon: '📅', path: '/today', description: 'View today\'s habits' },
          { id: 'habits', name: 'My Habits', icon: '✅', path: '/habits', description: 'Manage habits' },
          { id: 'analytics', name: 'Analytics', icon: '📊', path: '/analytics', description: 'Track progress' },
          { id: 'settings', name: 'Settings', icon: '⚙️', path: '/settings', description: 'Customize app' }
        ]
      },
      analytics: {
        timeRangeOptions: [
          { value: '7d', label: '7 days', description: 'Past week', icon: '📅' },
          { value: '30d', label: '30 days', description: 'Past month', icon: '📆' },
          { value: '90d', label: '3 months', description: 'Past quarter', icon: '📊' },
          { value: '365d', label: '1 year', description: 'Past year', icon: '📈' }
        ]
      },
      languages: [
        { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
        { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' }
      ]
    };
    return uiConfigCache;
  }
}

/**
 * Get time options for user preferences
 */
export async function getTimeOptions(): Promise<TimeOption[]> {
  const config = await loadUIConfig();
  return config.userPreferences.timeOptions;
}

/**
 * Get daily time options for onboarding
 */
export async function getDailyTimeOptions(): Promise<DailyTimeOption[]> {
  const config = await loadUIConfig();
  return config.userPreferences.dailyTimeOptions;
}

/**
 * Get lifestyle options for user profiling
 */
export async function getLifestyleOptions(): Promise<LifestyleOption[]> {
  const config = await loadUIConfig();
  return config.userPreferences.lifestyleOptions;
}

/**
 * Get habit categories
 */
export async function getHabitCategories(): Promise<HabitCategory[]> {
  const config = await loadUIConfig();
  return config.habits.categories;
}

/**
 * Get habit difficulties
 */
export async function getHabitDifficulties(): Promise<HabitDifficulty[]> {
  const config = await loadUIConfig();
  return config.habits.difficulties;
}

/**
 * Get navigation tabs
 */
export async function getNavigationTabs(): Promise<NavigationTab[]> {
  const config = await loadUIConfig();
  return config.navigation.tabs;
}

/**
 * Get time range options for analytics
 */
export async function getTimeRangeOptions(): Promise<TimeRangeOption[]> {
  const config = await loadUIConfig();
  return config.analytics.timeRangeOptions;
}

/**
 * Get supported languages
 */
export async function getSupportedLanguages(): Promise<Language[]> {
  const config = await loadUIConfig();
  return config.languages;
}

/**
 * Clear UI config cache (useful for development/testing)
 */
export function clearUIConfigCache(): void {
  uiConfigCache = null;
}