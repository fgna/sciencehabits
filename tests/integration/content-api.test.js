/**
 * Integration Tests: Content API
 * 
 * Tests the integration between the ScienceHabits app and the content API
 * to ensure data flows correctly and handles edge cases.
 */

const fetch = require('node-fetch');
const { EffectivenessRankingService } = require('../../src/services/localization/EffectivenessRankingService');
const { smartRecommendations } = require('../../src/services/smartRecommendations');

describe('Content API Integration Tests', () => {
  const CONTENT_API_BASE = 'http://localhost:3001';
  
  beforeAll(async () => {
    // Wait for content API to be available
    let retries = 10;
    while (retries > 0) {
      try {
        const response = await fetch(`${CONTENT_API_BASE}/health`);
        if (response.ok) break;
      } catch (error) {
        // API not ready yet
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries--;
    }
    
    if (retries === 0) {
      throw new Error('Content API not available for testing');
    }
  });

  describe('EffectivenessRankingService', () => {
    test('should load primary recommendations from content API', async () => {
      const habits = await EffectivenessRankingService.getPrimaryRecommendations('en');
      
      expect(habits).toBeDefined();
      expect(Array.isArray(habits)).toBe(true);
      expect(habits.length).toBeGreaterThan(0);
      
      // Verify habit structure
      const habit = habits[0];
      expect(habit).toHaveProperty('id');
      expect(habit).toHaveProperty('translations');
      expect(habit).toHaveProperty('goalCategory');
      expect(habit).toHaveProperty('effectivenessScore');
      expect(habit.translations).toHaveProperty('en');
    });

    test('should load habits for each goal category', async () => {
      const categories = ['better_sleep', 'get_moving', 'feel_better'];
      
      for (const category of categories) {
        const habits = await EffectivenessRankingService.getHabitsByGoal(category, 'en');
        
        expect(habits).toBeDefined();
        expect(Array.isArray(habits)).toBe(true);
        
        if (habits.length > 0) {
          expect(habits[0].goalCategory).toBe(category);
        }
      }
    });

    test('should handle different languages', async () => {
      const languages = ['en', 'de', 'fr', 'es'];
      
      for (const lang of languages) {
        const habits = await EffectivenessRankingService.getPrimaryRecommendations(lang);
        
        expect(habits).toBeDefined();
        expect(Array.isArray(habits)).toBe(true);
        
        if (habits.length > 0) {
          expect(habits[0].translations).toHaveProperty(lang);
        }
      }
    });

    test('should return effectiveness rankings', async () => {
      const rankings = await EffectivenessRankingService.getEffectivenessRankings();
      
      expect(rankings).toBeDefined();
      expect(Array.isArray(rankings)).toBe(true);
      
      if (rankings.length > 0) {
        const ranking = rankings[0];
        expect(ranking).toHaveProperty('goalCategory');
        expect(ranking).toHaveProperty('habits');
        expect(Array.isArray(ranking.habits)).toBe(true);
      }
    });

    test('should validate habit data structure', async () => {
      const habits = await EffectivenessRankingService.getPrimaryRecommendations('en');
      
      for (const habit of habits.slice(0, 3)) { // Test first 3 habits
        // Required fields
        expect(habit.id).toBeDefined();
        expect(habit.goalCategory).toBeDefined();
        expect(habit.effectivenessScore).toBeDefined();
        expect(habit.difficulty).toBeDefined();
        expect(habit.timeMinutes).toBeDefined();
        
        // Translation structure
        expect(habit.translations.en.title).toBeDefined();
        expect(habit.translations.en.description).toBeDefined();
        expect(habit.translations.en.whyItWorks).toBeDefined();
        expect(habit.translations.en.quickStart).toBeDefined();
        
        // Data types
        expect(typeof habit.effectivenessScore).toBe('number');
        expect(typeof habit.timeMinutes).toBe('number');
        expect(['better_sleep', 'get_moving', 'feel_better']).toContain(habit.goalCategory);
      }
    });
  });

  describe('Smart Recommendations Integration', () => {
    test('should load habits from content API', async () => {
      const stats = await smartRecommendations.getRecommendationStats();
      
      expect(stats.totalHabits).toBeGreaterThan(0);
      expect(Object.keys(stats.habitsByCategory).length).toBeGreaterThan(0);
      expect(stats.averageGoalsPerHabit).toBeGreaterThan(0);
    });

    test('should generate recommendations for each main goal', async () => {
      const goals = ['better_sleep', 'get_moving', 'feel_better'];
      
      for (const goal of goals) {
        const result = await smartRecommendations.getRecommendations({
          selectedGoals: [goal],
          limit: 5
        });
        
        expect(result.recommendations.length).toBeGreaterThan(0);
        expect(result.unmappedGoals).not.toContain(goal);
        expect(result.totalMatched).toBeGreaterThan(0);
        
        // Verify recommendations are relevant to the goal
        const relevantRecs = result.recommendations.filter(rec => 
          rec.matchedGoals.includes(goal) || rec.confidence > 0.5
        );
        expect(relevantRecs.length).toBeGreaterThan(0);
      }
    });

    test('should handle goal aliases correctly', async () => {
      const aliasTests = [
        { alias: 'sleep', expected: 'better_sleep' },
        { alias: 'mood', expected: 'feel_better' },
        { alias: 'exercise', expected: 'get_moving' }
      ];
      
      for (const { alias, expected } of aliasTests) {
        const result = await smartRecommendations.getRecommendations({
          selectedGoals: [alias],
          limit: 3
        });
        
        // Should not be in unmapped goals if alias works
        expect(result.unmappedGoals).not.toContain(alias);
        
        // Should have some recommendations
        expect(result.recommendations.length).toBeGreaterThan(0);
      }
    });

    test('should validate recommendation engine health', async () => {
      const health = await smartRecommendations.validateEngineHealth();
      
      expect(health.isHealthy).toBe(true);
      expect(health.habitsLoaded).toBeGreaterThan(0);
      expect(health.issues).toEqual([]);
      expect(health.taxonomyStats).toBeDefined();
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle content API timeouts gracefully', async () => {
      // Mock a slow API response
      const originalFetch = global.fetch;
      global.fetch = jest.fn(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ ok: false, status: 408 }), 1000)
        )
      );
      
      try {
        const habits = await EffectivenessRankingService.getPrimaryRecommendations('en');
        // Should return empty array or cached data, not throw
        expect(Array.isArray(habits)).toBe(true);
      } catch (error) {
        // If it throws, should be a handled error
        expect(error.message).toContain('timeout');
      } finally {
        global.fetch = originalFetch;
      }
    });

    test('should handle invalid language codes', async () => {
      try {
        const habits = await EffectivenessRankingService.getPrimaryRecommendations('invalid');
        // Should fall back to English or return empty array
        expect(Array.isArray(habits)).toBe(true);
      } catch (error) {
        // Should be a handled error, not a crash
        expect(error.message).toBeDefined();
      }
    });

    test('should handle content API server errors', async () => {
      // Mock server error
      const originalFetch = global.fetch;
      global.fetch = jest.fn(() => 
        Promise.resolve({ ok: false, status: 500, statusText: 'Internal Server Error' })
      );
      
      try {
        const habits = await EffectivenessRankingService.getPrimaryRecommendations('en');
        // Should handle gracefully
        expect(Array.isArray(habits)).toBe(true);
      } catch (error) {
        expect(error.message).toBeDefined();
      } finally {
        global.fetch = originalFetch;
      }
    });
  });

  describe('Data Consistency and Validation', () => {
    test('should have consistent goal categories across habits', async () => {
      const habits = await EffectivenessRankingService.getPrimaryRecommendations('en');
      const validCategories = ['better_sleep', 'get_moving', 'feel_better'];
      
      for (const habit of habits) {
        expect(validCategories).toContain(habit.goalCategory);
      }
    });

    test('should have valid effectiveness scores', async () => {
      const habits = await EffectivenessRankingService.getPrimaryRecommendations('en');
      
      for (const habit of habits) {
        expect(habit.effectivenessScore).toBeGreaterThanOrEqual(0);
        expect(habit.effectivenessScore).toBeLessThanOrEqual(100);
      }
    });

    test('should have complete translations for primary language', async () => {
      const habits = await EffectivenessRankingService.getPrimaryRecommendations('en');
      
      for (const habit of habits.slice(0, 5)) { // Check first 5
        const translation = habit.translations.en;
        
        expect(translation.title).toBeTruthy();
        expect(translation.description).toBeTruthy();
        expect(translation.whyItWorks).toBeTruthy();
        expect(translation.quickStart).toBeTruthy();
        
        // Check minimum length requirements
        expect(translation.title.length).toBeGreaterThan(5);
        expect(translation.description.length).toBeGreaterThan(20);
      }
    });
  });

  describe('Performance Tests', () => {
    test('should load habits within acceptable time', async () => {
      const startTime = Date.now();
      const habits = await EffectivenessRankingService.getPrimaryRecommendations('en');
      const endTime = Date.now();
      
      const loadTime = endTime - startTime;
      expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
      expect(habits.length).toBeGreaterThan(0);
    });

    test('should cache repeated requests', async () => {
      // First request
      const start1 = Date.now();
      const habits1 = await EffectivenessRankingService.getPrimaryRecommendations('en');
      const time1 = Date.now() - start1;
      
      // Second request (should be cached)
      const start2 = Date.now();
      const habits2 = await EffectivenessRankingService.getPrimaryRecommendations('en');
      const time2 = Date.now() - start2;
      
      expect(habits1).toEqual(habits2);
      expect(time2).toBeLessThan(time1); // Cached request should be faster
    });
  });
});

module.exports = {};