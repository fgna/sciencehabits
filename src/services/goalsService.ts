export interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string;
  tier: 'free' | 'premium';
  category: string;
  priority: number;
  
  // Enhanced UX fields
  researchLevel?: 'high' | 'medium' | 'low';
  researchSummary?: string;
  benefits?: string[];
  commonConcerns?: Array<{
    concern: string;
    response: string;
  }>;
  timeToResults?: {
    initial: string; // e.g., "1-2 weeks"
    significant: string; // e.g., "4-8 weeks"
  };
  averageTimeCommitment?: {
    min: number; // minutes per day
    max: number;
  };
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
    // Fallback goals with enhanced UX data
    goalsCache = [
      {
        id: 'better_sleep',
        title: 'Better Sleep',
        description: 'The keystone habit that affects everything else',
        icon: '🛏️',
        tier: 'free',
        category: 'sleep',
        priority: 1,
        researchLevel: 'high',
        researchSummary: 'Quality sleep is foundational for cognitive function, emotional regulation, immune health, and overall well-being. Poor sleep affects every aspect of life.',
        benefits: ['Improved cognitive function', 'Better emotional regulation', 'Stronger immune system', 'Enhanced physical recovery'],
        commonConcerns: [
          {
            concern: 'I have trouble falling asleep',
            response: 'Start with a simple wind-down routine 30 minutes before bed. Even basic changes can significantly improve sleep quality.'
          }
        ],
        timeToResults: { initial: '3-7 days', significant: '2-4 weeks' },
        averageTimeCommitment: { min: 5, max: 20 }
      },
      {
        id: 'get_moving',
        title: 'Get Moving',
        description: 'Physical health with broad accessibility',
        icon: '🚶‍♀️',
        tier: 'free',
        category: 'movement',
        priority: 2,
        researchLevel: 'high',
        researchSummary: 'Regular movement and exercise improve cardiovascular health, mental well-being, cognitive function, and longevity. Even light activity provides significant benefits.',
        benefits: ['Improved cardiovascular health', 'Enhanced mood', 'Better energy levels', 'Stronger bones and muscles'],
        commonConcerns: [
          {
            concern: 'I don\'t have time for long workouts',
            response: 'Start with just 5-10 minutes of walking or stretching. Small amounts of movement still provide meaningful health benefits.'
          }
        ],
        timeToResults: { initial: '1-2 weeks', significant: '4-8 weeks' },
        averageTimeCommitment: { min: 5, max: 30 }
      },
      {
        id: 'feel_better',
        title: 'Feel Better',
        description: 'Mood and mental wellness for immediate wins',
        icon: '😊',
        tier: 'free',
        category: 'wellbeing',
        priority: 3,
        researchLevel: 'high',
        researchSummary: 'Simple practices like gratitude, breathing exercises, and positive social connections provide immediate mood benefits and build long-term emotional resilience.',
        benefits: ['Improved mood', 'Reduced stress', 'Better relationships', 'Increased life satisfaction'],
        commonConcerns: [
          {
            concern: 'I feel overwhelmed and don\'t know where to start',
            response: 'Start with one small practice like writing down 3 things you\'re grateful for. Small wins build momentum.'
          }
        ],
        timeToResults: { initial: '1-3 days', significant: '2-4 weeks' },
        averageTimeCommitment: { min: 3, max: 15 }
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