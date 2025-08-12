/**
 * Habit Level Definitions
 * 
 * Progressive difficulty levels for different habit categories that guide users
 * from beginner to advanced practice through research-backed advancement criteria.
 */

import { HabitLevel } from '../types';

export const HABIT_LEVELS: HabitLevel[] = [
  // Exercise/Movement Progression
  {
    id: 'exercise_beginner',
    habitCategoryId: 'exercise_consistency',
    level: 1,
    name: 'Movement Foundation',
    description: 'Start with gentle, consistent movement',
    timeRequirement: 5,
    difficultyTags: ['minimal_equipment', 'low_intensity'],
    prerequisites: [],
    researchExplanation: 'Starting small builds neural pathways without overwhelming willpower. Research shows 5-minute habits have 80% higher adherence rates.',
    instructions: 'Take a 5-minute walk or do 5 minutes of gentle stretching. Focus on consistency over intensity.',
    tips: [
      'Same time each day builds stronger cues',
      'Celebrate completion, not performance', 
      'Track days completed, not distance or reps'
    ],
    commonMistakes: [
      'Starting too intensely',
      'Skipping days due to weather',
      'Comparing to others\' fitness levels'
    ],
    advancementCriteria: {
      minimumConsistency: 75,
      minimumDuration: 14
    }
  },
  {
    id: 'exercise_intermediate',
    habitCategoryId: 'exercise_consistency',
    level: 2,
    name: 'Active Lifestyle',
    description: 'Increase duration and add variety',
    timeRequirement: 15,
    difficultyTags: ['moderate_intensity', 'varied_activities'],
    prerequisites: [
      { type: 'previous_level', value: 1 },
      { type: 'consistency_rate', value: 75, timeframe: 'week' }
    ],
    researchExplanation: 'After 2 weeks of consistency, neural pathways strengthen. Increasing duration by 10 minutes shows sustainable progression.',
    instructions: '15 minutes of moderate activity: brisk walking, bodyweight exercises, or cycling. Mix activities to prevent boredom.',
    tips: [
      'Prepare workout clothes the night before',
      'Have 2-3 backup activities for bad weather',
      'Focus on how you feel after, not during'
    ],
    commonMistakes: [
      'Jumping intensity too quickly',
      'Not having indoor alternatives', 
      'Perfectionist all-or-nothing thinking'
    ],
    advancementCriteria: {
      minimumConsistency: 80,
      minimumDuration: 21
    }
  },
  {
    id: 'exercise_advanced',
    habitCategoryId: 'exercise_consistency',
    level: 3,
    name: 'Fitness Enthusiast',
    description: 'Structured workouts with progressive goals',
    timeRequirement: 30,
    difficultyTags: ['structured_workouts', 'goal_oriented'],
    prerequisites: [
      { type: 'previous_level', value: 2 },
      { type: 'consistency_rate', value: 80, timeframe: 'month' }
    ],
    researchExplanation: 'After 5+ weeks, exercise habits become more automatic. 30-minute sessions provide optimal health benefits according to WHO guidelines.',
    instructions: '30 minutes of structured exercise: strength training, cardio sessions, or sport activities. Set specific fitness goals.',
    tips: [
      'Schedule specific workout types for different days',
      'Track performance metrics, not just completion',
      'Plan rest and recovery days'
    ],
    commonMistakes: [
      'Overtraining without recovery',
      'Neglecting nutrition',
      'Comparing progress to others online'
    ],
    advancementCriteria: {
      minimumConsistency: 85,
      minimumDuration: 30
    }
  },

  // Reading Progression
  {
    id: 'reading_beginner',
    habitCategoryId: 'reading_consistency',
    level: 1,
    name: 'Page Turner',
    description: 'Establish daily reading routine',
    timeRequirement: 10,
    difficultyTags: ['light_material', 'flexible_format'],
    prerequisites: [],
    researchExplanation: 'Reading for 10 minutes daily creates cognitive benefits. Starting with enjoyable material increases habit adherence.',
    instructions: 'Read for 10 minutes daily. Choose enjoyable books, articles, or even audiobooks. Priority is consistency over material difficulty.',
    tips: [
      'Keep book visible as environmental cue',
      'Choose engaging over educational initially',
      'Audiobooks count - find what works for you'
    ],
    commonMistakes: [
      'Choosing overly difficult material',
      'Reading only at bedtime when tired',
      'Guilt about "light" reading choices'
    ],
    advancementCriteria: {
      minimumConsistency: 70,
      minimumDuration: 14
    }
  },
  {
    id: 'reading_intermediate',
    habitCategoryId: 'reading_consistency',
    level: 2,
    name: 'Book Explorer',
    description: 'Diversify reading and increase engagement',
    timeRequirement: 20,
    difficultyTags: ['varied_genres', 'note_taking'],
    prerequisites: [
      { type: 'previous_level', value: 1 },
      { type: 'consistency_rate', value: 70, timeframe: 'week' }
    ],
    researchExplanation: 'Increasing reading time and engagement improves comprehension and retention. Diverse genres build broader neural connections.',
    instructions: '20 minutes of reading with brief note-taking or reflection. Explore different genres and formats.',
    tips: [
      'Keep a reading journal or use highlights',
      'Mix fiction and non-fiction for variety',
      'Join online book communities for motivation'
    ],
    commonMistakes: [
      'Feeling pressure to finish every book',
      'Taking too many detailed notes',
      'Avoiding challenging but interesting topics'
    ],
    advancementCriteria: {
      minimumConsistency: 75,
      minimumDuration: 21
    }
  },
  {
    id: 'reading_advanced',
    habitCategoryId: 'reading_consistency',
    level: 3,
    name: 'Literary Scholar',
    description: 'Deep reading with analysis and application',
    timeRequirement: 30,
    difficultyTags: ['analytical_reading', 'knowledge_application'],
    prerequisites: [
      { type: 'previous_level', value: 2 },
      { type: 'consistency_rate', value: 75, timeframe: 'month' }
    ],
    researchExplanation: 'Deep reading practices improve critical thinking and knowledge retention. Active engagement creates lasting behavioral change.',
    instructions: '30+ minutes of focused reading with active note-taking, reflection, or discussion. Apply insights to daily life.',
    tips: [
      'Practice the Feynman Technique - explain concepts simply',
      'Connect ideas across different books and experiences',
      'Share insights with others to deepen understanding'
    ],
    commonMistakes: [
      'Over-analyzing instead of enjoying the process',
      'Hoarding knowledge without application',
      'Comparing reading speed to others'
    ],
    advancementCriteria: {
      minimumConsistency: 80,
      minimumDuration: 30
    }
  },

  // Meditation/Mindfulness Progression
  {
    id: 'meditation_beginner',
    habitCategoryId: 'mindfulness_meditation',
    level: 1,
    name: 'Breath Awareness',
    description: 'Learn basic mindfulness techniques',
    timeRequirement: 3,
    difficultyTags: ['guided_meditation', 'basic_breathing'],
    prerequisites: [],
    researchExplanation: 'Even 3 minutes of daily meditation shows measurable brain changes. Guided sessions reduce barrier to entry.',
    instructions: '3 minutes of guided breathing meditation. Use apps like Headspace or simply focus on breath counting.',
    tips: [
      'Same time and place daily',
      'Use guided meditations initially',
      'Expect mind wandering - it\'s normal'
    ],
    commonMistakes: [
      'Expecting immediate calm',
      'Judging thoughts as "bad"',
      'Sitting in uncomfortable positions'
    ],
    advancementCriteria: {
      minimumConsistency: 75,
      minimumDuration: 10
    }
  },
  {
    id: 'meditation_intermediate',
    habitCategoryId: 'mindfulness_meditation',
    level: 2,
    name: 'Mindful Observer',
    description: 'Develop sustained attention and body awareness',
    timeRequirement: 10,
    difficultyTags: ['body_scan', 'unguided_practice'],
    prerequisites: [
      { type: 'previous_level', value: 1 },
      { type: 'consistency_rate', value: 75, timeframe: 'week' }
    ],
    researchExplanation: 'Extended meditation sessions build sustained attention and interoceptive awareness, key components of emotional regulation.',
    instructions: '10 minutes combining breath awareness with body scan techniques. Reduce guided instruction dependency.',
    tips: [
      'Start with guided, finish with silence',
      'Notice sensations without trying to change them',
      'Use meditation timer with gentle bells'
    ],
    commonMistakes: [
      'Fighting uncomfortable sensations',
      'Abandoning guided support too quickly',
      'Comparing meditation experiences'
    ],
    advancementCriteria: {
      minimumConsistency: 80,
      minimumDuration: 14
    }
  },
  {
    id: 'meditation_advanced',
    habitCategoryId: 'mindfulness_meditation',
    level: 3,
    name: 'Contemplative Practitioner',
    description: 'Deep practice with multiple techniques and life integration',
    timeRequirement: 20,
    difficultyTags: ['multiple_techniques', 'life_integration'],
    prerequisites: [
      { type: 'previous_level', value: 2 },
      { type: 'consistency_rate', value: 80, timeframe: 'month' }
    ],
    researchExplanation: 'Advanced practitioners show increased gray matter density and improved emotional regulation. Integration into daily life amplifies benefits.',
    instructions: '20+ minutes using various techniques: breath, loving-kindness, open awareness. Apply mindfulness throughout the day.',
    tips: [
      'Vary techniques to prevent habituation',
      'Practice informal mindfulness during daily activities',
      'Consider retreat experiences for deeper practice'
    ],
    commonMistakes: [
      'Spiritual materialism - collecting techniques',
      'Meditation as escapism from life challenges',
      'Neglecting informal practice integration'
    ],
    advancementCriteria: {
      minimumConsistency: 85,
      minimumDuration: 30
    }
  },

  // Nutrition/Healthy Eating Progression
  {
    id: 'nutrition_beginner',
    habitCategoryId: 'nutrition_habits',
    level: 1,
    name: 'Mindful Eater',
    description: 'Develop awareness around eating habits',
    timeRequirement: 5,
    difficultyTags: ['awareness_building', 'small_changes'],
    prerequisites: [],
    researchExplanation: 'Mindful eating practices improve satiety recognition and reduce overeating. Small changes create sustainable patterns.',
    instructions: 'Eat one meal per day without distractions (no phone, TV, etc.). Focus on taste, texture, and hunger/fullness cues.',
    tips: [
      'Start with breakfast or lunch when less rushed',
      'Chew slowly and put utensils down between bites',
      'Notice flavors and textures more deliberately'
    ],
    commonMistakes: [
      'Trying to change all meals at once',
      'Being judgmental about food choices',
      'Eating too quickly out of habit'
    ],
    advancementCriteria: {
      minimumConsistency: 70,
      minimumDuration: 14
    }
  },
  {
    id: 'nutrition_intermediate',
    habitCategoryId: 'nutrition_habits',
    level: 2,
    name: 'Conscious Chooser',
    description: 'Make intentional food choices and meal planning',
    timeRequirement: 15,
    difficultyTags: ['meal_planning', 'ingredient_awareness'],
    prerequisites: [
      { type: 'previous_level', value: 1 },
      { type: 'consistency_rate', value: 70, timeframe: 'week' }
    ],
    researchExplanation: 'Meal planning reduces decision fatigue and improves nutritional outcomes. Preparing food at home increases diet quality.',
    instructions: 'Plan and prepare at least one healthy meal daily. Focus on whole foods and balanced nutrition.',
    tips: [
      'Batch prep ingredients on weekends',
      'Keep healthy snacks readily available',
      'Learn one new healthy recipe per week'
    ],
    commonMistakes: [
      'Over-complicating meal preparation',
      'All-or-nothing thinking about "perfect" nutrition',
      'Not accounting for busy days or emergencies'
    ],
    advancementCriteria: {
      minimumConsistency: 75,
      minimumDuration: 21
    }
  },
  {
    id: 'nutrition_advanced',
    habitCategoryId: 'nutrition_habits',
    level: 3,
    name: 'Nutritional Strategist',
    description: 'Optimize nutrition for health and performance goals',
    timeRequirement: 30,
    difficultyTags: ['performance_nutrition', 'macro_awareness'],
    prerequisites: [
      { type: 'previous_level', value: 2 },
      { type: 'consistency_rate', value: 75, timeframe: 'month' }
    ],
    researchExplanation: 'Advanced nutritional strategies can optimize energy, recovery, and long-term health outcomes when consistently applied.',
    instructions: 'Track and optimize nutrition for specific health or performance goals. Consider timing, macronutrients, and meal quality.',
    tips: [
      'Use food tracking apps judiciously, not obsessively',
      'Adjust nutrition based on activity levels and goals',
      'Focus on nutrient density over calorie restriction'
    ],
    commonMistakes: [
      'Becoming overly rigid or orthorexic',
      'Ignoring social and cultural aspects of eating',
      'Micromanaging without considering the big picture'
    ],
    advancementCriteria: {
      minimumConsistency: 80,
      minimumDuration: 30
    }
  }
];

// Helper functions
export const getHabitLevelById = (levelId: string): HabitLevel | undefined => {
  return HABIT_LEVELS.find(level => level.id === levelId);
};

export const getHabitLevelsByCategory = (categoryId: string): HabitLevel[] => {
  return HABIT_LEVELS
    .filter(level => level.habitCategoryId === categoryId)
    .sort((a, b) => a.level - b.level);
};

export const getNextLevel = (categoryId: string, currentLevel: number): HabitLevel | undefined => {
  return HABIT_LEVELS.find(level => 
    level.habitCategoryId === categoryId && level.level === currentLevel + 1
  );
};

export const getAvailableCategories = (): string[] => {
  const categories = new Set(HABIT_LEVELS.map(level => level.habitCategoryId));
  return Array.from(categories);
};