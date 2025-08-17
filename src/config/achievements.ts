/**
 * Achievements Configuration Loader
 * 
 * Loads achievement and milestone configuration from JSON files.
 * Enables easy tuning of gamification mechanics without code changes.
 */

export interface Milestone {
  days?: number;
  count?: number;
  title: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  icon: string;
  description: string;
}

export interface RarityReward {
  points: number;
  experience: number;
}

export interface AchievementsConfig {
  version: string;
  lastUpdated: string;
  milestones: {
    streaks: Milestone[];
    completions: Milestone[];
    perfectWeeks: Milestone[];
  };
  rarityColors: Record<string, string>;
  rewards: Record<string, RarityReward>;
}

let achievementsConfigCache: AchievementsConfig | null = null;

/**
 * Load achievements configuration from JSON
 */
export async function loadAchievementsConfig(): Promise<AchievementsConfig> {
  if (achievementsConfigCache) {
    return achievementsConfigCache;
  }

  try {
    const response = await fetch('/data/achievements-config.json');
    if (!response.ok) {
      throw new Error('Failed to fetch achievements config');
    }
    
    const config: AchievementsConfig = await response.json();
    achievementsConfigCache = config;
    return achievementsConfigCache;
  } catch (error) {
    console.warn('Failed to load achievements config, using fallback:', error);
    
    // Fallback achievements configuration
    achievementsConfigCache = {
      version: '1.0.0',
      lastUpdated: '2025-08-16',
      milestones: {
        streaks: [
          { days: 3, title: 'Starting Strong', rarity: 'common', icon: '🌱', description: 'Completed 3 days in a row' },
          { days: 7, title: 'Week Warrior', rarity: 'common', icon: '🔥', description: 'Maintained habits for a full week' },
          { days: 14, title: 'Fortnight Fighter', rarity: 'uncommon', icon: '💪', description: 'Two weeks of consistency' },
          { days: 30, title: 'Monthly Master', rarity: 'rare', icon: '🏆', description: 'One month of dedication' }
        ],
        completions: [
          { count: 5, title: 'First Steps', rarity: 'common', icon: '👶', description: 'Completed 5 habit sessions' },
          { count: 10, title: 'Getting Started', rarity: 'common', icon: '🌱', description: '10 completions under your belt' },
          { count: 25, title: 'Building Momentum', rarity: 'uncommon', icon: '🚀', description: 'Quarter-century of completions' },
          { count: 50, title: 'Half Century', rarity: 'uncommon', icon: '🎯', description: '50 successful habit sessions' },
          { count: 100, title: 'Century Club', rarity: 'rare', icon: '💎', description: 'Joined the exclusive 100 club' }
        ],
        perfectWeeks: [
          { count: 1, title: 'Perfect Week', rarity: 'uncommon', icon: '✨', description: 'One flawless week' },
          { count: 4, title: 'Monthly Perfectionist', rarity: 'rare', icon: '🎨', description: 'Four perfect weeks' }
        ]
      },
      rarityColors: {
        common: '#10B981',
        uncommon: '#3B82F6',
        rare: '#8B5CF6',
        epic: '#F59E0B',
        legendary: '#EF4444'
      },
      rewards: {
        common: { points: 10, experience: 5 },
        uncommon: { points: 25, experience: 15 },
        rare: { points: 50, experience: 30 },
        epic: { points: 100, experience: 60 },
        legendary: { points: 250, experience: 150 }
      }
    };
    return achievementsConfigCache;
  }
}

/**
 * Get streak milestones
 */
export async function getStreakMilestones(): Promise<Milestone[]> {
  const config = await loadAchievementsConfig();
  return config.milestones.streaks;
}

/**
 * Get completion milestones
 */
export async function getCompletionMilestones(): Promise<Milestone[]> {
  const config = await loadAchievementsConfig();
  return config.milestones.completions;
}

/**
 * Get perfect week milestones
 */
export async function getPerfectWeekMilestones(): Promise<Milestone[]> {
  const config = await loadAchievementsConfig();
  return config.milestones.perfectWeeks;
}

/**
 * Get rarity colors
 */
export async function getRarityColors(): Promise<Record<string, string>> {
  const config = await loadAchievementsConfig();
  return config.rarityColors;
}

/**
 * Get reward configuration
 */
export async function getRewardConfig(): Promise<Record<string, RarityReward>> {
  const config = await loadAchievementsConfig();
  return config.rewards;
}

/**
 * Get color for rarity level
 */
export async function getRarityColor(rarity: string): Promise<string> {
  const colors = await getRarityColors();
  return colors[rarity] || colors.common;
}

/**
 * Get rewards for rarity level
 */
export async function getRewardsForRarity(rarity: string): Promise<RarityReward> {
  const rewards = await getRewardConfig();
  return rewards[rarity] || rewards.common;
}

/**
 * Clear achievements config cache (useful for development/testing)
 */
export function clearAchievementsConfigCache(): void {
  achievementsConfigCache = null;
}

/**
 * Check if a streak qualifies for a milestone
 */
export async function checkStreakMilestone(streakDays: number): Promise<Milestone | null> {
  const milestones = await getStreakMilestones();
  // Find the highest milestone that this streak qualifies for
  const qualifiedMilestones = milestones.filter(m => m.days! <= streakDays);
  return qualifiedMilestones.length > 0 
    ? qualifiedMilestones[qualifiedMilestones.length - 1] 
    : null;
}

/**
 * Check if completion count qualifies for a milestone
 */
export async function checkCompletionMilestone(completionCount: number): Promise<Milestone | null> {
  const milestones = await getCompletionMilestones();
  // Find the highest milestone that this completion count qualifies for
  const qualifiedMilestones = milestones.filter(m => m.count! <= completionCount);
  return qualifiedMilestones.length > 0 
    ? qualifiedMilestones[qualifiedMilestones.length - 1] 
    : null;
}