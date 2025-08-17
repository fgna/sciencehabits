/**
 * Goal Tag Helper Utilities
 * 
 * Convert internal goal tag IDs to human-friendly display names
 */

export const goalTagToDisplayName: Record<string, string> = {
  // Sleep & Rest
  'sleep_quality': 'Sleep Quality',
  'sleep_duration': 'Sleep Duration', 
  'stress_reduction': 'Stress Reduction',
  
  // Movement & Fitness
  'cardiovascular_health': 'Cardiovascular Health',
  'metabolic_boost': 'Metabolic Boost',
  'energy_increase': 'Energy Increase',
  'fitness': 'Fitness',
  'energy_boost': 'Energy Boost',
  'strength_building': 'Strength Building',
  'cardiovascular_fitness': 'Cardiovascular Fitness',
  'full_body_strength': 'Full Body Strength',
  'joint_friendly': 'Joint Friendly',
  
  // Mental Wellbeing
  'happiness': 'Happiness',
  'mental_health': 'Mental Health',
  'positive_psychology': 'Positive Psychology',
  'mood': 'Mood',
  'life_satisfaction': 'Life Satisfaction',
  
  // Cognitive Performance
  'cognitive_performance': 'Cognitive Performance',
  'focus': 'Focus',
  'brain_health': 'Brain Health',
  
  // Stress & Anxiety
  'anxiety_management': 'Anxiety Management',
  
  // Energy & Vitality
  'energy': 'Energy',
  
  // Social & Relationships
  'social_connection': 'Social Connection',
  'relationships': 'Relationships',
  
  // Productivity
  'productivity': 'Productivity',
  'time_management': 'Time Management',
  
  // Health & Nutrition
  'nutrition': 'Nutrition',
  'hydration': 'Hydration',
  'immunity': 'Immunity',
  
  // Mindfulness & Spirituality
  'mindfulness': 'Mindfulness',
  'meditation': 'Meditation',
  'gratitude': 'Gratitude',
  'self_reflection': 'Self Reflection',
  
  // Learning & Growth
  'learning': 'Learning',
  'personal_growth': 'Personal Growth',
  'creativity': 'Creativity'
};

/**
 * Convert a goal tag ID to a human-friendly display name
 */
export function formatGoalTag(tagId: string): string {
  return goalTagToDisplayName[tagId] || tagId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Convert an array of goal tag IDs to human-friendly display names
 */
export function formatGoalTags(tagIds: string[]): string[] {
  return tagIds.map(formatGoalTag);
}

/**
 * Join goal tags into a human-readable string
 */
export function joinGoalTags(tagIds: string[], separator: string = ', '): string {
  return formatGoalTags(tagIds).join(separator);
}