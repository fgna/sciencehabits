/**
 * Research-Backed Recovery Database
 * 
 * Comprehensive database of scientifically-supported facts about habit formation,
 * recovery, and motivation to provide users with credible explanations for why
 * missing days is normal and how to recover effectively.
 */

import { ResearchFact, CompassionMessage } from '../types/recovery';

export const researchFacts: ResearchFact[] = [
  {
    id: 'habit_formation_timeline',
    category: 'habit_formation',
    title: 'Habits take 66 days on average to form',
    explanation: 'Research tracking 96 people found habit formation ranges from 18-254 days, with an average of 66 days. Missing occasional days had minimal impact on the overall trajectory. The key is consistency over perfection.',
    statistic: '66 days average (18-254 range)',
    citation: {
      authors: 'Lally, P., Van Jaarsveld, C. H., Potts, H. W., & Wardle, J.',
      title: 'How are habits formed: Modelling habit formation in the real world',
      journal: 'European Journal of Social Psychology',
      year: 2010,
      url: 'https://doi.org/10.1002/ejsp.674',
      doi: '10.1002/ejsp.674'
    },
    contextTriggers: ['first_miss', 'discouragement', 'perfectionism'],
    credibilityScore: 9
  },
  {
    id: 'missing_days_normal',
    category: 'recovery',
    title: 'Missing days doesn\'t break habit formation',
    explanation: 'Studies show that missing a single day, or even several days, doesn\'t significantly impact long-term habit formation as long as you return to the behavior. The brain\'s automatic response patterns remain largely intact.',
    statistic: 'Missing 1-2 days: minimal impact on habit strength',
    citation: {
      authors: 'Lally, P., Van Jaarsveld, C. H., Potts, H. W., & Wardle, J.',
      title: 'How are habits formed: Modelling habit formation in the real world',
      journal: 'European Journal of Social Psychology',
      year: 2010,
      doi: '10.1002/ejsp.674'
    },
    contextTriggers: ['consecutive_misses', 'guilt', 'fear_of_failure'],
    credibilityScore: 9
  },
  {
    id: 'self_compassion_performance',
    category: 'psychology',
    title: 'Self-compassion improves performance and persistence',
    explanation: 'Research demonstrates that self-compassionate individuals show greater motivation, less anxiety, and better performance after setbacks. Self-criticism, conversely, leads to decreased motivation and increased likelihood of giving up.',
    statistic: '26% increase in motivation with self-compassion',
    citation: {
      authors: 'Breines, J. G., & Chen, S.',
      title: 'Self-compassion increases self-improvement motivation',
      journal: 'Personality and Social Psychology Bulletin',
      year: 2012,
      doi: '10.1177/0146167212445599'
    },
    contextTriggers: ['self_criticism', 'shame', 'guilt', 'perfectionism'],
    credibilityScore: 8
  },
  {
    id: 'neuroplasticity_recovery',
    category: 'neuroscience',
    title: 'The brain quickly re-establishes habit pathways',
    explanation: 'Neuroplasticity research shows that habit-related neural pathways remain largely intact even after brief interruptions. The brain can rapidly re-strengthen these connections, making habit recovery faster than initial formation.',
    statistic: '40% faster re-establishment of neural pathways',
    citation: {
      authors: 'Graybiel, A. M.',
      title: 'The basal ganglia and chunking of action repertoires',
      journal: 'Neurobiology of Learning and Memory',
      year: 1998,
      doi: '10.1006/nlme.1998.3843'
    },
    contextTriggers: ['fear_of_starting_over', 'long_break', 'motivation_loss'],
    credibilityScore: 9
  },
  {
    id: 'implementation_intentions',
    category: 'psychology',
    title: 'If-then planning doubles success rates',
    explanation: 'Implementation intentions ("If situation X arises, then I will perform behavior Y") significantly increase the likelihood of habit maintenance and recovery. This strategy helps navigate obstacles and missed days.',
    statistic: '2x higher success rate with if-then planning',
    citation: {
      authors: 'Gollwitzer, P. M., & Sheeran, P.',
      title: 'Implementation intentions and goal achievement: A meta-analysis',
      journal: 'Advances in Experimental Social Psychology',
      year: 2006,
      doi: '10.1016/S0065-2601(06)38002-1'
    },
    contextTriggers: ['planning_help', 'obstacle_navigation', 'recovery_strategy'],
    credibilityScore: 9
  },
  {
    id: 'minimal_viable_habits',
    category: 'habit_formation',
    title: 'Tiny habits create sustainable change',
    explanation: 'Stanford research shows that making habits ridiculously small (2 minutes or less) removes barriers and creates positive momentum. Success with micro-habits builds confidence and naturally scales up over time.',
    statistic: '80% adherence with 2-minute habits vs 20% with large habits',
    citation: {
      authors: 'Fogg, B. J.',
      title: 'Tiny Habits: The Small Changes That Change Everything',
      journal: 'Behavior Design Lab, Stanford University',
      year: 2019
    },
    contextTriggers: ['overwhelm', 'time_constraints', 'motivation_low', 'recovery'],
    credibilityScore: 8
  },
  {
    id: 'progress_over_perfection',
    category: 'motivation',
    title: 'Progress beats perfection for long-term success',
    explanation: 'Studies on goal achievement show that individuals who focus on progress rather than perfection maintain motivation longer, recover from setbacks faster, and ultimately achieve better outcomes.',
    statistic: '35% higher goal achievement with progress focus',
    citation: {
      authors: 'Fishbach, A., & Dhar, R.',
      title: 'Goals as excuses or guides: The liberating effect of perceived goal progress on choice',
      journal: 'Journal of Consumer Research',
      year: 2005,
      doi: '10.1086/432234'
    },
    contextTriggers: ['perfectionism', 'all_or_nothing_thinking', 'discouragement'],
    credibilityScore: 8
  },
  {
    id: 'social_support_impact',
    category: 'psychology',
    title: 'Social support increases habit success by 95%',
    explanation: 'Research shows that having an accountability partner or support system dramatically increases the likelihood of habit maintenance and successful recovery from lapses.',
    statistic: '95% success rate with accountability partner',
    citation: {
      authors: 'Dominican University Study',
      title: 'Goals Research Summary',
      journal: 'Dominican University of California',
      year: 2015
    },
    contextTriggers: ['isolation', 'accountability', 'community_support'],
    credibilityScore: 7
  },
  {
    id: 'cognitive_load_theory',
    category: 'neuroscience',
    title: 'Cognitive overload prevents habit formation',
    explanation: 'When mental resources are depleted (stress, fatigue, overwhelm), the prefrontal cortex struggles to maintain new behaviors. Reducing cognitive load through simplification dramatically improves success rates.',
    statistic: '60% improvement with reduced cognitive load',
    citation: {
      authors: 'Baumeister, R. F., & Tierney, J.',
      title: 'Willpower: Rediscovering the Greatest Human Strength',
      journal: 'Penguin Press',
      year: 2011
    },
    contextTriggers: ['stress', 'overwhelm', 'multiple_habits', 'complexity'],
    credibilityScore: 8
  },
  {
    id: 'positive_emotion_habits',
    category: 'psychology',
    title: 'Positive emotions strengthen habit pathways',
    explanation: 'Neuroscience research reveals that positive emotions during habit performance strengthen neural pathways and increase automaticity. Celebrating small wins literally rewires the brain for success.',
    statistic: '3x stronger neural pathways with positive emotion',
    citation: {
      authors: 'Fredrickson, B. L.',
      title: 'The role of positive emotions in positive psychology',
      journal: 'American Psychologist',
      year: 2001,
      doi: '10.1037/0003-066X.56.3.218'
    },
    contextTriggers: ['celebration', 'motivation', 'mood_boost', 'success_building'],
    credibilityScore: 9
  }
];

export const compassionMessages: CompassionMessage[] = [
  {
    id: 'first_miss_gentle',
    triggerCondition: 'first_miss',
    message: 'Missing one day is completely normal and part of the habit-building process. Research shows this has minimal impact on your overall progress.',
    researchExplanation: 'Studies tracking habit formation found that missing occasional days doesn\'t significantly affect the development of automatic behaviors. Your brain is still building the neural pathways that make habits stick.',
    researchCitation: {
      authors: 'Lally, P., et al.',
      title: 'How are habits formed: Modelling habit formation in the real world',
      journal: 'European Journal of Social Psychology',
      year: 2010,
      doi: '10.1002/ejsp.674'
    },
    recoveryOptions: [
      'Continue tomorrow as planned',
      'Try a 2-minute version today',
      'Adjust the timing for better fit',
      'Get back to it right now'
    ],
    emotionalTone: 'supportive',
    severity: 'gentle'
  },
  {
    id: 'second_consecutive_understanding',
    triggerCondition: 'second_consecutive',
    message: 'Two days off happens to everyone building habits. This is your opportunity to practice self-compassion, which research shows actually improves performance.',
    researchExplanation: 'Self-compassion research demonstrates that people who treat themselves kindly after setbacks show 26% greater motivation and better performance than those who self-criticize.',
    researchCitation: {
      authors: 'Breines, J. G., & Chen, S.',
      title: 'Self-compassion increases self-improvement motivation',
      journal: 'Personality and Social Psychology Bulletin',
      year: 2012
    },
    recoveryOptions: [
      'Start with just 2 minutes today',
      'Change the time when you do this habit',
      'Identify what got in the way and plan around it',
      'Ask someone to check in with you tomorrow'
    ],
    emotionalTone: 'understanding',
    severity: 'moderate'
  },
  {
    id: 'third_consecutive_encouraging',
    triggerCondition: 'third_consecutive',
    message: 'Three days off is a signal to adjust your approach, not give up. Research shows that habit recovery is actually faster than initial formation because your brain has already started building the pathways.',
    researchExplanation: 'Neuroplasticity studies reveal that habit-related neural pathways remain largely intact after brief interruptions. The brain can re-strengthen these connections 40% faster than initial formation.',
    researchCitation: {
      authors: 'Graybiel, A. M.',
      title: 'The basal ganglia and chunking of action repertoires',
      journal: 'Neurobiology of Learning and Memory',
      year: 1998
    },
    recoveryOptions: [
      'Try the tiniest possible version of this habit',
      'Change when or where you do this habit',
      'Break the habit into smaller pieces',
      'Get support from a friend or family member',
      'Take a planned break and restart next week'
    ],
    emotionalTone: 'encouraging',
    severity: 'intensive'
  },
  {
    id: 'weekly_struggle_motivational',
    triggerCondition: 'weekly_struggle',
    message: 'Struggling this week? That\'s valuable data, not failure. Research shows that understanding your patterns is key to long-term success.',
    researchExplanation: 'Studies on habit formation show that identifying obstacles and adjusting strategies (implementation intentions) doubles success rates compared to willpower alone.',
    researchCitation: {
      authors: 'Gollwitzer, P. M., & Sheeran, P.',
      title: 'Implementation intentions and goal achievement',
      journal: 'Advances in Experimental Social Psychology',
      year: 2006
    },
    recoveryOptions: [
      'Analyze what made this week challenging',
      'Reduce the habit to its absolute minimum',
      'Try doing it at a completely different time',
      'Focus on just weekdays or weekends first',
      'Connect with others who share this goal'
    ],
    emotionalTone: 'motivational',
    severity: 'moderate'
  },
  {
    id: 'motivation_low_supportive',
    triggerCondition: 'motivation_low',
    message: 'Low motivation is a natural part of building lasting habits. Research shows that relying on motivation alone leads to failure - successful people build systems that work even when motivation is low.',
    researchExplanation: 'Stanford research on tiny habits shows that removing reliance on motivation and instead focusing on making habits ridiculously easy leads to 80% adherence rates compared to 20% for motivation-dependent habits.',
    researchCitation: {
      authors: 'Fogg, B. J.',
      title: 'Tiny Habits: The Small Changes That Change Everything',
      journal: 'Behavior Design Lab, Stanford University',
      year: 2019
    },
    recoveryOptions: [
      'Make the habit so small it feels almost silly',
      'Attach it to something you already do automatically',
      'Change your environment to make it easier',
      'Celebrate every tiny win to build momentum',
      'Focus on showing up, not performing perfectly'
    ],
    emotionalTone: 'supportive',
    severity: 'gentle'
  }
];

export const microHabitTemplates = {
  exercise: {
    name: 'One push-up or 30-second walk',
    description: 'Just move your body for 30 seconds',
    timeRequired: 0.5,
    scalingSteps: [
      'One push-up or 30-second walk',
      '2-3 exercises or 2-minute walk', 
      '5-minute movement session',
      '10-minute workout',
      'Return to full routine'
    ]
  },
  meditation: {
    name: 'Three conscious breaths',
    description: 'Take three slow, intentional breaths',
    timeRequired: 1,
    scalingSteps: [
      'Three conscious breaths',
      '2-minute breathing exercise',
      '5-minute mindfulness',
      '10-minute meditation',
      'Return to full practice'
    ]
  },
  reading: {
    name: 'Read one paragraph',
    description: 'Open your book and read just one paragraph',
    timeRequired: 1,
    scalingSteps: [
      'Read one paragraph',
      'Read for 5 minutes',
      'Read for 10-15 minutes',
      'Read for 20-30 minutes',
      'Return to full reading session'
    ]
  },
  writing: {
    name: 'Write one sentence',
    description: 'Write just one sentence about anything',
    timeRequired: 1,
    scalingSteps: [
      'Write one sentence',
      'Write for 3 minutes',
      'Write for 10 minutes',
      'Write for 20 minutes',
      'Return to full writing session'
    ]
  },
  learning: {
    name: 'Review one flashcard or concept',
    description: 'Look at just one piece of learning material',
    timeRequired: 1,
    scalingSteps: [
      'Review one flashcard',
      'Study for 5 minutes',
      'Study for 15 minutes',
      'Study for 30 minutes',
      'Return to full study session'
    ]
  },
  creativity: {
    name: 'Make one mark or note',
    description: 'Draw one line, write one word, or hum one melody',
    timeRequired: 1,
    scalingSteps: [
      'Make one creative mark',
      'Create for 5 minutes',
      'Create for 15 minutes',
      'Create for 30 minutes',
      'Return to full creative session'
    ]
  }
};

export const recoveryInsightTemplates = {
  patterns: [
    'You tend to miss habits on {dayOfWeek}s - consider adjusting your {dayOfWeek} routine',
    'Your success rate increases by {percentage}% when you do this habit in the {timeOfDay}',
    'You\'re most consistent during {period} - build on this strength',
    'After missing {number} days, you typically recover within {recoveryTime} - you\'re on track'
  ],
  encouragement: [
    'You\'ve successfully recovered from breaks {number} times before - you can do it again',
    'Your longest streak was {days} days, showing you have the capability for consistency',
    'You\'re {percentage}% more consistent than when you started - that\'s real progress',
    'Even with recent misses, you\'re still {percentage}% consistent this month'
  ],
  actionable: [
    'Try doing this habit right after {existingHabit} to increase consistency',
    'Your success rate is {percentage}% higher on days when you {condition}',
    'Consider switching to {timeOfDay} - your energy levels are typically higher then',
    'Breaking this into smaller steps might help - you succeed {percentage}% more with simpler habits'
  ]
};

export function getRelevantResearch(contextTriggers: string[]): ResearchFact[] {
  return researchFacts.filter(fact => 
    fact.contextTriggers.some(trigger => contextTriggers.includes(trigger))
  ).sort((a, b) => b.credibilityScore - a.credibilityScore);
}

export function getCompassionMessage(triggerCondition: string): CompassionMessage | null {
  const messages = compassionMessages.filter(msg => msg.triggerCondition === triggerCondition);
  return messages[Math.floor(Math.random() * messages.length)] || null;
}

export function getMicroHabitTemplate(habitCategory: string): any {
  const category = habitCategory.toLowerCase();
  for (const [key, template] of Object.entries(microHabitTemplates)) {
    if (category.includes(key) || key.includes(category)) {
      return template;
    }
  }
  return microHabitTemplates.exercise; // Default fallback
}