/**
 * Central Goals Configuration
 * 
 * This file loads the main goals from JSON configuration.
 * Used by both onboarding and settings to ensure consistency.
 */

export interface AppGoal {
  id: 'better_sleep' | 'get_moving' | 'feel_better';
  title: string;
  description: string;
  icon: string;
  category: string;
  priority: number;
  tier: 'free' | 'premium';
  researchLevel: 'high' | 'medium' | 'low';
  researchSummary: string;
  benefits: string[];
  commonConcerns: Array<{
    concern: string;
    response: string;
  }>;
  timeToResults: {
    initial: string;
    significant: string;
  };
  averageTimeCommitment: {
    min: number;
    max: number;
  };
}

interface GoalsConfig {
  version: string;
  lastUpdated: string;
  goals: AppGoal[];
}

let goalsCache: AppGoal[] | null = null;

/**
 * Load goals from JSON configuration
 */
export async function loadMainGoals(): Promise<AppGoal[]> {
  if (goalsCache) {
    return goalsCache;
  }

  try {
    const response = await fetch('/data/goals-config.json');
    if (!response.ok) {
      throw new Error('Failed to fetch goals config');
    }
    
    const config: GoalsConfig = await response.json();
    goalsCache = config.goals.sort((a, b) => a.priority - b.priority);
    return goalsCache;
  } catch (error) {
    console.warn('Failed to load goals config, using fallback:', error);
    
    // Fallback goals
    goalsCache = [
      {
        id: 'better_sleep',
        title: 'Better Sleep',
        description: 'The keystone habit that affects everything else',
        icon: '🛏️',
        category: 'sleep',
        priority: 1,
        tier: 'free',
        researchLevel: 'high',
        researchSummary: 'Quality sleep is foundational for cognitive function, emotional regulation, immune health, and overall well-being.',
        benefits: ['Improved cognitive function', 'Better emotional regulation', 'Stronger immune system', 'Enhanced physical recovery'],
        commonConcerns: [{ concern: 'I have trouble falling asleep', response: 'Start with a simple wind-down routine 30 minutes before bed.' }],
        timeToResults: { initial: '3-7 days', significant: '2-4 weeks' },
        averageTimeCommitment: { min: 5, max: 20 }
      },
      {
        id: 'get_moving',
        title: 'Get Moving',
        description: 'Physical health with broad accessibility',
        icon: '🚶‍♀️',
        category: 'movement',
        priority: 2,
        tier: 'free',
        researchLevel: 'high',
        researchSummary: 'Regular movement and exercise improve cardiovascular health, mental well-being, cognitive function, and longevity.',
        benefits: ['Improved cardiovascular health', 'Enhanced mood', 'Better energy levels', 'Stronger bones and muscles'],
        commonConcerns: [{ concern: 'I don\'t have time for long workouts', response: 'Start with just 5-10 minutes of walking or stretching.' }],
        timeToResults: { initial: '1-2 weeks', significant: '4-8 weeks' },
        averageTimeCommitment: { min: 5, max: 30 }
      },
      {
        id: 'feel_better',
        title: 'Feel Better',
        description: 'Mood and mental wellness for immediate wins',
        icon: '😊',
        category: 'wellbeing',
        priority: 3,
        tier: 'free',
        researchLevel: 'high',
        researchSummary: 'Simple practices like gratitude, breathing exercises, and positive social connections provide immediate mood benefits.',
        benefits: ['Improved mood', 'Reduced stress', 'Better relationships', 'Increased life satisfaction'],
        commonConcerns: [{ concern: 'I feel overwhelmed and don\'t know where to start', response: 'Start with one small practice like writing down 3 things you\'re grateful for.' }],
        timeToResults: { initial: '1-3 days', significant: '2-4 weeks' },
        averageTimeCommitment: { min: 3, max: 15 }
      }
    ];
    return goalsCache;
  }
}

/**
 * Get a goal by ID
 */
export function getGoalById(id: string): AppGoal | undefined {
  if (!goalsCache) {
    throw new Error('Goals not loaded. Call loadMainGoals() first.');
  }
  return goalsCache.find(goal => goal.id === id);
}

/**
 * Get all goal IDs
 */
export function getAllGoalIds(): string[] {
  if (!goalsCache) {
    throw new Error('Goals not loaded. Call loadMainGoals() first.');
  }
  return goalsCache.map(goal => goal.id);
}

/**
 * Check if a goal ID is valid
 */
export function isValidGoalId(id: string): boolean {
  if (!goalsCache) {
    return false;
  }
  return goalsCache.some(goal => goal.id === id);
}

/**
 * Get all main goals
 */
export function getMainGoals(): AppGoal[] {
  if (!goalsCache) {
    throw new Error('Goals not loaded. Call loadMainGoals() first.');
  }
  return goalsCache;
}