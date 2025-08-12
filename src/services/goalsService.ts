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
        id: 'reduce_stress',
        title: 'Reduce Stress',
        description: 'Feel calmer and more relaxed throughout the day',
        icon: '🧘‍♀️',
        tier: 'free',
        category: 'wellbeing',
        priority: 1,
        researchLevel: 'high',
        researchSummary: 'Multiple meta-analyses show that mindfulness and breathing exercises significantly reduce cortisol levels and perceived stress.',
        benefits: ['Lower cortisol levels', 'Improved sleep quality', 'Better emotional regulation', 'Reduced anxiety'],
        commonConcerns: [
          {
            concern: 'I don\'t have time for meditation',
            response: 'Start with just 3 minutes. Even brief breathing exercises show measurable stress reduction.'
          }
        ],
        timeToResults: { initial: '1-2 weeks', significant: '4-6 weeks' },
        averageTimeCommitment: { min: 3, max: 15 }
      },
      {
        id: 'increase_focus',
        title: 'Increase Focus',
        description: 'Improve concentration and mental clarity',
        icon: '🎯',
        tier: 'free',
        category: 'productivity',
        priority: 2,
        researchLevel: 'high',
        researchSummary: 'Cognitive training and attention exercises improve working memory and sustained attention in healthy adults.',
        benefits: ['Better concentration', 'Reduced mental fatigue', 'Improved productivity', 'Enhanced learning ability'],
        timeToResults: { initial: '2-3 weeks', significant: '6-8 weeks' },
        averageTimeCommitment: { min: 5, max: 20 }
      },
      {
        id: 'improve_mood',
        title: 'Improve Mood',
        description: 'Boost happiness and emotional well-being',
        icon: '😊',
        tier: 'free',
        category: 'wellbeing',
        priority: 3,
        researchLevel: 'high',
        researchSummary: 'Gratitude practices, physical activity, and social connection are proven to increase positive emotions and life satisfaction.',
        benefits: ['Increased happiness', 'Better relationships', 'Greater life satisfaction', 'Improved resilience'],
        timeToResults: { initial: '1-2 weeks', significant: '3-4 weeks' },
        averageTimeCommitment: { min: 5, max: 15 }
      },
      {
        id: 'increase_energy',
        title: 'Increase Energy',
        description: 'Feel more energized and motivated',
        icon: '⚡',
        tier: 'free',
        category: 'health',
        priority: 4,
        researchLevel: 'high',
        researchSummary: 'Regular exercise, proper hydration, and sleep hygiene significantly improve energy levels and reduce fatigue.',
        benefits: ['Higher energy levels', 'Better sleep quality', 'Improved motivation', 'Enhanced physical stamina'],
        timeToResults: { initial: '1 week', significant: '2-4 weeks' },
        averageTimeCommitment: { min: 5, max: 30 }
      },
      {
        id: 'improve_health',
        title: 'Improve Health',
        description: 'Build healthier daily habits',
        icon: '💪',
        tier: 'free',
        category: 'health',
        priority: 5,
        researchLevel: 'high',
        researchSummary: 'Small, consistent healthy habits compound over time to create significant improvements in overall health outcomes.',
        benefits: ['Better physical health', 'Increased longevity', 'Improved immune function', 'Enhanced quality of life'],
        timeToResults: { initial: '2-3 weeks', significant: '8-12 weeks' },
        averageTimeCommitment: { min: 10, max: 30 }
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