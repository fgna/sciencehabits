export interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: 'free' | 'premium';
  category: string;
  priority: number;
}

interface GoalsData {
  version: string;
  lastUpdated: string;
  goals: Goal[];
}

let goalsCache: Goal[] | null = null;

export async function loadGoals(): Promise<Goal[]> {
  if (goalsCache) {
    return goalsCache;
  }

  try {
    const response = await fetch('/data/goals.json');
    if (!response.ok) {
      throw new Error('Failed to fetch goals');
    }
    
    const data: GoalsData = await response.json();
    goalsCache = data.goals.sort((a, b) => a.priority - b.priority);
    return goalsCache;
  } catch (error) {
    console.warn('Failed to load goals from JSON, using fallback:', error);
    // Fallback goals
    goalsCache = [
      {
        id: 'reduce_stress',
        title: 'Reduce Stress',
        description: 'Feel calmer and more relaxed throughout the day',
        icon: '🧘‍♀️',
        tier: 'free',
        category: 'mental_health',
        priority: 1
      },
      {
        id: 'increase_focus',
        title: 'Increase Focus',
        description: 'Improve concentration and mental clarity',
        icon: '🎯',
        tier: 'free',
        category: 'cognitive',
        priority: 2
      },
      {
        id: 'improve_mood',
        title: 'Improve Mood',
        description: 'Boost happiness and emotional well-being',
        icon: '😊',
        tier: 'free',
        category: 'mental_health',
        priority: 3
      },
      {
        id: 'increase_energy',
        title: 'Increase Energy',
        description: 'Feel more energized and motivated',
        icon: '⚡',
        tier: 'free',
        category: 'physical_health',
        priority: 4
      },
      {
        id: 'improve_health',
        title: 'Improve Health',
        description: 'Build healthier daily habits',
        icon: '💪',
        tier: 'free',
        category: 'physical_health',
        priority: 5
      }
    ];
    return goalsCache;
  }
}

export function getAvailableGoals(isPremium: boolean = false): Goal[] {
  if (!goalsCache) {
    throw new Error('Goals not loaded. Call loadGoals() first.');
  }
  
  if (isPremium) {
    return goalsCache; // All goals for premium users
  }
  
  return goalsCache.filter(goal => goal.tier === 'free');
}

export function getGoalById(id: string): Goal | undefined {
  if (!goalsCache) {
    throw new Error('Goals not loaded. Call loadGoals() first.');
  }
  
  return goalsCache.find(goal => goal.id === id);
}

export function clearGoalsCache(): void {
  goalsCache = null;
}

// For backward compatibility with existing code
export async function getAvailableGoalsForOnboarding(): Promise<Goal[]> {
  await loadGoals();
  return getAvailableGoals(false); // Free goals only during onboarding
}

export async function getAvailableGoalsForProfile(isPremium: boolean): Promise<Goal[]> {
  await loadGoals();
  return getAvailableGoals(isPremium);
}