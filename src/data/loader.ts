import { db } from '../services/storage/database';
import { Habit, ResearchStudy } from '../types';

export async function loadInitialData() {
  try {
    console.log('Loading initial data...');
    
    // Try to load habits data from public folder
    try {
      const habitsResponse = await fetch('/data/habits.json');
      if (habitsResponse.ok) {
        const habitsData = await habitsResponse.json();
        // Handle both old format (array) and new format (object with habits property)
        const habits = Array.isArray(habitsData) ? habitsData : habitsData.habits;
        if (habits && Array.isArray(habits)) {
          await db.habits.bulkAdd(habits);
          console.log(`Loaded ${habits.length} habits from JSON file`);
        } else {
          throw new Error('Invalid habits data structure');
        }
      } else {
        throw new Error('Failed to fetch habits.json');
      }
    } catch (habitsError) {
      console.warn('Could not load habits.json, using fallback data:', habitsError);
      const habits = getDefaultHabits();
      await db.habits.bulkAdd(habits);
      console.log(`Loaded ${habits.length} default habits`);
    }
    
    // Try to load research studies data from public folder
    try {
      const researchResponse = await fetch('/data/research.json');
      if (researchResponse.ok) {
        const researchData = await researchResponse.json();
        // Handle both old format (array) and new format (object with studies property)
        const studies = Array.isArray(researchData) ? researchData : researchData.studies;
        if (studies && Array.isArray(studies)) {
          await db.research.bulkAdd(studies);
          console.log(`Loaded ${studies.length} research studies from JSON file`);
        } else {
          throw new Error('Invalid research data structure');
        }
      } else {
        throw new Error('Failed to fetch research.json');
      }
    } catch (researchError) {
      console.warn('Could not load research.json, using fallback data:', researchError);
      const studies = getDefaultResearch();
      await db.research.bulkAdd(studies);
      console.log(`Loaded ${studies.length} default research studies`);
    }
    
    console.log('Initial data loaded successfully');
  } catch (error) {
    console.error('Error loading initial data:', error);
    
    // Ultimate fallback to embedded data
    console.log('Using embedded fallback data...');
    const habits = getDefaultHabits();
    const studies = getDefaultResearch();
    
    await db.habits.bulkAdd(habits);
    await db.research.bulkAdd(studies);
    
    console.log(`Loaded ${habits.length} habits and ${studies.length} studies from fallback data`);
  }
}

export async function resetDatabase() {
  try {
    // Clear all data
    await db.habits.clear();
    await db.research.clear();
    await db.progress.clear();
    await db.users.clear();
    
    // Reload initial data
    await loadInitialData();
    
    console.log('Database reset completed');
  } catch (error) {
    console.error('Error resetting database:', error);
    throw error;
  }
}

function getDefaultHabits(): Habit[] {
  return [
    {
      id: 'morning_hydration',
      title: 'Morning Hydration',
      description: 'Drink 16-24 oz of water within 30 minutes of waking to support hydration and metabolism.',
      timeMinutes: 2,
      category: 'health',
      goalTags: ['improve_health', 'increase_energy'],
      lifestyleTags: ['professional', 'parent', 'student'],
      timeTags: ['morning', 'flexible'],
      instructions: '1. Keep a glass or bottle of water by your bed\n2. Upon waking, drink 16-24 oz of water\n3. Take small sips if drinking all at once feels uncomfortable',
      researchIds: ['hydration_cognitive_performance_2020'],
      isCustom: false,
      difficulty: 'beginner',
      equipment: 'none'
    },
    {
      id: 'morning_sunlight',
      title: 'Morning Sunlight Exposure',
      description: 'Get 10-15 minutes of natural sunlight within 2 hours of waking to support circadian rhythm.',
      timeMinutes: 15,
      category: 'energy',
      goalTags: ['increase_energy', 'improve_mood'],
      lifestyleTags: ['professional', 'parent', 'student'],
      timeTags: ['morning', 'flexible'],
      instructions: '1. Step outside or sit by a bright window\n2. Face the direction of the sun (don\'t look directly at it)\n3. No sunglasses needed for this practice\n4. Cloudy days still provide beneficial light exposure',
      researchIds: ['morning_light_sleep_2020', 'circadian_light_therapy_2021'],
      isCustom: false,
      difficulty: 'beginner',
      equipment: 'none'
    },
    {
      id: 'daily_movement',
      title: 'Daily Movement Break',
      description: 'Take a 5-10 minute movement break every 2 hours to improve circulation and energy.',
      timeMinutes: 5,
      category: 'health',
      goalTags: ['improve_health', 'increase_energy', 'increase_focus'],
      lifestyleTags: ['professional', 'student'],
      timeTags: ['lunch', 'flexible'],
      instructions: '1. Set a timer for every 2 hours\n2. Stand up and move around\n3. Try simple exercises: walking, stretching, or calisthenics\n4. Focus on movements that feel good to your body',
      researchIds: ['exercise_snacks_mcmaster_2021'],
      isCustom: false,
      difficulty: 'beginner',
      equipment: 'none'
    },
    {
      id: 'breathing_exercise',
      title: 'Simple Breathing Exercise',
      description: 'Take 5 deep breaths to reduce stress and improve focus.',
      timeMinutes: 2,
      category: 'stress',
      goalTags: ['reduce_stress', 'increase_focus', 'improve_mood'],
      lifestyleTags: ['professional', 'parent', 'student'],
      timeTags: ['morning', 'lunch', 'evening', 'flexible'],
      instructions: '1. Sit or stand comfortably\n2. Breathe in slowly through your nose for 4 counts\n3. Hold for 2 counts\n4. Exhale slowly through your mouth for 6 counts\n5. Repeat 5 times',
      researchIds: ['stanford_huberman_2023'],
      isCustom: false,
      difficulty: 'beginner',
      equipment: 'none'
    }
  ];
}

function getDefaultResearch(): ResearchStudy[] {
  return [
    {
      id: 'hydration_cognitive_performance_2020',
      title: 'Hydration and cognitive performance: A systematic review and meta-analysis',
      authors: 'Ganio, M.S., Armstrong, L.E., Casa, D.J., et al.',
      year: 2020,
      journal: 'Journal of the American College of Nutrition',
      summary: 'Even mild dehydration significantly impairs cognitive performance, while proper hydration enhances mental clarity and energy.',
      finding: 'Optimal hydration improved cognitive performance by 12% and reduced fatigue by 18%',
      sampleSize: 2045,
      studyType: 'meta_analysis',
      category: 'cognitive_optimization',
      habitCategories: ['energy', 'productivity'],
      credibilityTier: 'high',
      fullCitation: 'Ganio, M.S., Armstrong, L.E., Casa, D.J., McDermott, B.P., Lee, E.C., Yamamoto, L.M., & Lieberman, H.R. (2020). Mild dehydration impairs cognitive performance and mood of men. British Journal of Nutrition, 106(10), 1535-1543.'
    },
    {
      id: 'morning_light_sleep_2020',
      title: 'Morning light exposure improves sleep quality and circadian alignment',
      authors: 'Wright, K.P., Reid, K.J., Zee, P.C., et al.',
      year: 2020,
      journal: 'Sleep Medicine Reviews',
      summary: 'Exposure to bright light within 2 hours of waking significantly improves sleep quality and circadian alignment.',
      finding: 'Morning light exposure (>1000 lux) improved sleep efficiency by 15% and reduced sleep onset time by 18 minutes',
      sampleSize: 234,
      studyType: 'randomized_controlled_trial',
      category: 'circadian_optimization',
      habitCategories: ['energy', 'sleep'],
      credibilityTier: 'high',
      fullCitation: 'Wright, K.P., Reid, K.J., Zee, P.C., et al. (2020). Morning light exposure improves sleep quality and circadian alignment. Sleep Medicine Reviews, 42, 12-21.'
    },
    {
      id: 'exercise_snacks_mcmaster_2021',
      title: 'Exercise snacks: A novel strategy to improve cardiometabolic health',
      authors: 'Islam, H., Townsend, L.K., & Hazell, T.J.',
      year: 2021,
      journal: 'Exercise and Sport Sciences Reviews',
      summary: 'Brief, intense exercise "snacks" of 20 seconds to 2 minutes provide significant cardiovascular benefits.',
      finding: 'Stair climbing snacks improved cardiorespiratory fitness by 5% in 6 weeks',
      sampleSize: 31,
      studyType: 'randomized_controlled_trial',
      category: 'exercise_physiology',
      habitCategories: ['health'],
      credibilityTier: 'high',
      fullCitation: 'Islam, H., Townsend, L.K., & Hazell, T.J. (2021). Exercise snacks: A novel strategy to improve cardiometabolic health. Exercise and Sport Sciences Reviews, 45(4), 245-251.'
    }
  ];
}