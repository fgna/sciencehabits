/**
 * Milestone Badge Definitions
 * 
 * Research-backed achievement badges that celebrate meaningful progress
 * without creating harmful gamification patterns. Each badge represents
 * a scientifically significant milestone in habit formation.
 */

import { Badge } from '../types';

export const MILESTONE_BADGES: Badge[] = [
  // Habit Formation Science Badges
  {
    id: 'first_week_warrior',
    name: 'First Week Warrior',
    description: 'Complete a habit for 7 days - the crucial foundation period',
    icon: '🌱',
    category: 'milestone',
    requirement: {
      type: 'streak',
      threshold: 7,
      habitSpecific: true
    },
    researchExplanation: 'The first week is critical for habit formation. Research shows that early consistency predicts long-term success.',
    researchCitation: {
      authors: 'Lally, P., et al.',
      title: 'How are habits formed: Modelling habit formation in the real world',
      journal: 'European Journal of Social Psychology',
      year: 2010,
      url: 'https://doi.org/10.1002/ejsp.674'
    },
    rarity: 'common'
  },
  {
    id: 'neural_pathway_builder',
    name: 'Neural Pathway Builder',
    description: 'Complete a habit for 21 days - building automatic responses',
    icon: '🧠',
    category: 'milestone',
    requirement: {
      type: 'streak',
      threshold: 21,
      habitSpecific: true
    },
    researchExplanation: 'After 21 days, neural pathways begin strengthening. While full automaticity takes longer, this is when habits start feeling easier.',
    researchCitation: {
      authors: 'Maltz, M.',
      title: 'Psycho-Cybernetics',
      journal: 'Book',
      year: 1960,
      url: ''
    },
    rarity: 'uncommon'
  },
  {
    id: 'habit_scientist',
    name: 'Habit Scientist',
    description: 'Reach the 66-day average - scientifically proven habit formation',
    icon: '🔬',
    category: 'milestone',
    requirement: {
      type: 'streak',
      threshold: 66,
      habitSpecific: true
    },
    researchExplanation: 'Research shows habits take an average of 66 days to become automatic. You\'ve reached the scientifically proven milestone!',
    researchCitation: {
      authors: 'Lally, P., et al.',
      title: 'How are habits formed: Modelling habit formation in the real world',
      journal: 'European Journal of Social Psychology',
      year: 2010,
      url: 'https://doi.org/10.1002/ejsp.674'
    },
    rarity: 'rare'
  },
  {
    id: 'habit_master',
    name: 'Habit Master',
    description: 'Complete a habit for 254 days - the upper range of habit formation',
    icon: '👑',
    category: 'milestone',
    requirement: {
      type: 'streak',
      threshold: 254,
      habitSpecific: true
    },
    researchExplanation: 'Research found habit formation can take up to 254 days for complex behaviors. You\'ve mastered even the most challenging timeline!',
    researchCitation: {
      authors: 'Lally, P., et al.',
      title: 'How are habits formed: Modelling habit formation in the real world',
      journal: 'European Journal of Social Psychology',
      year: 2010,
      url: 'https://doi.org/10.1002/ejsp.674'
    },
    rarity: 'legendary'
  },

  // Consistency & Recovery Badges
  {
    id: 'consistency_champion',
    name: 'Consistency Champion',
    description: 'Maintain 80% weekly consistency for a month',
    icon: '⭐',
    category: 'consistency',
    requirement: {
      type: 'consistency_rate',
      threshold: 80,
      timeframe: 'month',
      habitSpecific: true
    },
    researchExplanation: 'Consistency matters more than perfection. 80% consistency builds stronger habits than 100% followed by burnout.',
    researchCitation: {
      authors: 'Clear, J.',
      title: 'Atomic Habits',
      journal: 'Book',
      year: 2018,
      url: ''
    },
    rarity: 'uncommon'
  },
  {
    id: 'steady_progress',
    name: 'Steady Progress',
    description: 'Maintain 60% consistency for 3 months',
    icon: '📈',
    category: 'consistency',
    requirement: {
      type: 'consistency_rate',
      threshold: 60,
      timeframe: 'all_time',
      habitSpecific: true
    },
    researchExplanation: 'Even 60% consistency leads to significant behavior change over time. Progress beats perfection.',
    rarity: 'common'
  },
  {
    id: 'recovery_master',
    name: 'Recovery Master',
    description: 'Successfully restart a habit after missing days',
    icon: '🔄',
    category: 'recovery',
    requirement: {
      type: 'recovery_success',
      threshold: 1,
      habitSpecific: true
    },
    researchExplanation: 'Recovery resilience is crucial for long-term success. Restarting after setbacks shows true habit mastery.',
    researchCitation: {
      authors: 'Duckworth, A.',
      title: 'Grit: The Power of Passion and Perseverance',
      journal: 'Book',
      year: 2016,
      url: ''
    },
    rarity: 'common'
  },
  {
    id: 'comeback_hero',
    name: 'Comeback Hero',
    description: 'Successfully recover from 5 different habit lapses',
    icon: '🦸',
    category: 'recovery',
    requirement: {
      type: 'recovery_success',
      threshold: 5,
      globalAchievement: true
    },
    researchExplanation: 'Multiple successful recoveries demonstrate exceptional resilience and self-compassion - key factors in long-term habit success.',
    rarity: 'rare'
  },

  // Learning & Research Badges
  {
    id: 'research_explorer',
    name: 'Research Explorer',
    description: 'Read research explanations for 5 different habits',
    icon: '📚',
    category: 'learning',
    requirement: {
      type: 'research_engagement',
      threshold: 5,
      globalAchievement: true
    },
    researchExplanation: 'Understanding the science behind habits increases success rates by building informed motivation.',
    researchCitation: {
      authors: 'Michie, S., et al.',
      title: 'The Behavior Change Technique Taxonomy',
      journal: 'Annals of Behavioral Medicine',
      year: 2013,
      url: ''
    },
    rarity: 'common'
  },
  {
    id: 'science_enthusiast',
    name: 'Science Enthusiast',
    description: 'Read research for 15 different habits',
    icon: '🔬',
    category: 'learning',
    requirement: {
      type: 'research_engagement',
      threshold: 15,
      globalAchievement: true
    },
    researchExplanation: 'Deep engagement with habit science correlates with higher success rates and better self-regulation.',
    rarity: 'uncommon'
  },

  // Multi-Habit Achievements
  {
    id: 'habit_architect',
    name: 'Habit Architect',
    description: 'Maintain 3 different habits simultaneously for 2 weeks',
    icon: '🏗️',
    category: 'milestone',
    requirement: {
      type: 'total_completions',
      threshold: 42, // 3 habits × 14 days
      timeframe: 'all_time',
      globalAchievement: true
    },
    researchExplanation: 'Managing multiple habits simultaneously demonstrates advanced self-regulation and habit stacking skills.',
    researchCitation: {
      authors: 'Fogg, B.J.',
      title: 'Tiny Habits',
      journal: 'Book',
      year: 2019,
      url: ''
    },
    rarity: 'rare'
  },
  {
    id: 'routine_builder',
    name: 'Routine Builder',
    description: 'Complete 100 total habit sessions',
    icon: '🏆',
    category: 'milestone',
    requirement: {
      type: 'total_completions',
      threshold: 100,
      globalAchievement: true
    },
    researchExplanation: '100 repetitions represents significant neural rewiring and behavioral pattern establishment.',
    rarity: 'uncommon'
  },
  {
    id: 'lifestyle_transformer',
    name: 'Lifestyle Transformer',
    description: 'Complete 500 total habit sessions',
    icon: '✨',
    category: 'milestone',
    requirement: {
      type: 'total_completions',
      threshold: 500,
      globalAchievement: true
    },
    researchExplanation: '500 repetitions indicates deep behavioral transformation and identity-level change.',
    researchCitation: {
      authors: 'Clear, J.',
      title: 'Atomic Habits',
      journal: 'Book',
      year: 2018,
      url: ''
    },
    rarity: 'legendary'
  },

  // Streak Milestones
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Complete any habit for a full week',
    icon: '🗓️',
    category: 'streak',
    requirement: {
      type: 'streak',
      threshold: 7,
      habitSpecific: true
    },
    researchExplanation: 'One week of consistency establishes the foundation for long-term habit formation.',
    rarity: 'common'
  },
  {
    id: 'month_master',
    name: 'Month Master',
    description: 'Complete any habit for 30 consecutive days',
    icon: '📅',
    category: 'streak',
    requirement: {
      type: 'streak',
      threshold: 30,
      habitSpecific: true
    },
    researchExplanation: '30 days of practice creates measurable neural changes and behavioral automaticity.',
    rarity: 'uncommon'
  },
  {
    id: 'quarter_champion',
    name: 'Quarter Champion',
    description: 'Complete any habit for 90 consecutive days',
    icon: '🏅',
    category: 'streak',
    requirement: {
      type: 'streak',
      threshold: 90,
      habitSpecific: true
    },
    researchExplanation: '90 days represents a full quarter of consistent practice, indicating true lifestyle integration.',
    rarity: 'rare'
  },
  {
    id: 'year_legend',
    name: 'Year Legend',
    description: 'Complete any habit for 365 consecutive days',
    icon: '🌟',
    category: 'streak',
    requirement: {
      type: 'streak',
      threshold: 365,
      habitSpecific: true
    },
    researchExplanation: 'A full year of daily practice represents complete habit mastery and identity transformation.',
    rarity: 'legendary'
  }
];

// Helper function to get badge by ID
export const getBadgeById = (badgeId: string): Badge | undefined => {
  return MILESTONE_BADGES.find(badge => badge.id === badgeId);
};

// Helper function to get badges by category
export const getBadgesByCategory = (category: Badge['category']): Badge[] => {
  return MILESTONE_BADGES.filter(badge => badge.category === category);
};

// Helper function to get badges by rarity
export const getBadgesByRarity = (rarity: Badge['rarity']): Badge[] => {
  return MILESTONE_BADGES.filter(badge => badge.rarity === rarity);
};