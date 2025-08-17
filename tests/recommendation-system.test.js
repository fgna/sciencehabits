/**
 * Recommendation System Regression Tests
 * 
 * These tests ensure that recommendations work correctly and prevent
 * cross-contamination between goal categories.
 */

const fetch = require('node-fetch');

const CONTENT_API_BASE = process.env.REACT_APP_CONTENT_API_URL || 'http://localhost:3002';
const EXPECTED_HABIT_COUNTS = {
  'feel_better': 8,
  'get_moving': 4, 
  'better_sleep': 4
};

describe('Recommendation System Regression Tests', () => {
  let habits = [];

  beforeAll(async () => {
    try {
      const response = await fetch(`${CONTENT_API_BASE}/habits/multilingual-science-habits-en.json`);
      habits = await response.json();
    } catch (error) {
      console.error('Failed to load habits from Content API:', error);
      throw error;
    }
  });

  test('Content API returns expected number of habits', () => {
    expect(habits).toHaveLength(16);
  });

  test('All expected categories are present', () => {
    const categories = [...new Set(habits.map(h => h.category))];
    expect(categories).toContain('feel_better');
    expect(categories).toContain('get_moving');
    expect(categories).toContain('better_sleep');
  });

  test('Each category has correct number of habits', () => {
    Object.entries(EXPECTED_HABIT_COUNTS).forEach(([category, expectedCount]) => {
      const categoryHabits = habits.filter(h => h.category === category);
      expect(categoryHabits).toHaveLength(expectedCount);
    });
  });

  test('Feel better habits should not include sleep-specific habits', () => {
    const feelBetterHabits = habits.filter(h => h.category === 'feel_better');
    const sleepSpecificIds = ['sleep_001_478_breathing', 'sleep_002_room_cooling'];
    
    feelBetterHabits.forEach(habit => {
      expect(sleepSpecificIds).not.toContain(habit.id);
    });
  });

  test('Get moving habits should not include sleep habits', () => {
    const getMoveHabits = habits.filter(h => h.category === 'get_moving');
    const sleepHabitIds = habits.filter(h => h.category === 'better_sleep').map(h => h.id);
    
    getMoveHabits.forEach(habit => {
      expect(sleepHabitIds).not.toContain(habit.id);
    });
  });

  test('Better sleep habits should not include exercise habits', () => {
    const sleepHabits = habits.filter(h => h.category === 'better_sleep');
    const exerciseHabitIds = habits.filter(h => h.category === 'get_moving').map(h => h.id);
    
    sleepHabits.forEach(habit => {
      expect(exerciseHabitIds).not.toContain(habit.id);
    });
  });

  test('All habits have required fields', () => {
    const requiredFields = ['id', 'title', 'description', 'category', 'goalTags'];
    
    habits.forEach(habit => {
      requiredFields.forEach(field => {
        expect(habit).toHaveProperty(field);
        expect(habit[field]).toBeTruthy();
      });
    });
  });

  test('No habit appears in multiple categories', () => {
    const habitIds = habits.map(h => h.id);
    const uniqueIds = [...new Set(habitIds)];
    expect(habitIds).toHaveLength(uniqueIds.length);
  });

  test('Goal tags are appropriate for each category', () => {
    // Define inappropriate cross-category tags
    const inappropriateCombinations = [
      { 
        category: 'get_moving', 
        shouldNotHave: ['sleep_quality', 'sleep_duration', 'sleep_onset', 'temperature_regulation'] 
      },
      { 
        category: 'better_sleep', 
        shouldNotHave: ['cardiovascular_health', 'strength_building', 'high_intensity'] 
      },
      { 
        category: 'feel_better', 
        // Feel better can overlap with other categories as mood affects everything
        shouldNotHave: [] 
      }
    ];

    inappropriateCombinations.forEach(({ category, shouldNotHave }) => {
      const categoryHabits = habits.filter(h => h.category === category);
      
      categoryHabits.forEach(habit => {
        const hasInappropriateTags = habit.goalTags.some(tag => shouldNotHave.includes(tag));
        expect(hasInappropriateTags).toBe(false);
      });
    });
  });

  test('Effectiveness scores are within valid range', () => {
    habits.forEach(habit => {
      if (habit.effectivenessScore) {
        expect(habit.effectivenessScore).toBeGreaterThanOrEqual(0);
        expect(habit.effectivenessScore).toBeLessThanOrEqual(10);
      }
    });
  });

  test('All habits have valid difficulty levels', () => {
    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'easy', 'moderate', 'challenging'];
    
    habits.forEach(habit => {
      expect(validDifficulties).toContain(habit.difficulty);
    });
  });
});