/**
 * System Tests: Goal Selection Functionality
 * 
 * Tests the complete goal selection and habit recommendation flow
 * to ensure the content API integration is working correctly.
 */

const { chromium } = require('playwright');
const { expect } = require('@jest/globals');

describe('Goal Selection System Tests', () => {
  let browser;
  let context;
  let page;
  
  beforeAll(async () => {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext();
    page = await context.newPage();
    
    // Navigate to the app
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
  });
  
  afterAll(async () => {
    await browser.close();
  });

  describe('Goal Selection in Onboarding', () => {
    test('should load available goals from centralized config', async () => {
      // Skip to goal selection if needed
      const goalSelectionVisible = await page.isVisible('[data-testid="goal-selection"]');
      
      if (!goalSelectionVisible) {
        // Navigate through onboarding to goal selection
        await page.click('[data-testid="start-onboarding"]');
        await page.waitForSelector('[data-testid="goal-selection"]');
      }
      
      // Verify all three main goals are available
      const goals = await page.$$eval('[data-testid="goal-option"]', elements => 
        elements.map(el => ({
          id: el.dataset.goalId,
          title: el.textContent.trim()
        }))
      );
      
      expect(goals).toHaveLength(3);
      expect(goals.map(g => g.id)).toEqual(
        expect.arrayContaining(['better_sleep', 'get_moving', 'feel_better'])
      );
    });

    test('should provide different habit recommendations for each goal', async () => {
      const goalRecommendations = {};
      
      // Test each goal
      for (const goalId of ['better_sleep', 'get_moving', 'feel_better']) {
        // Select the goal
        await page.click(`[data-goal-id="${goalId}"]`);
        await page.click('[data-testid="continue-button"]');
        
        // Wait for habits to load
        await page.waitForSelector('[data-testid="habit-recommendation"]');
        
        // Get recommended habits
        const habits = await page.$$eval('[data-testid="habit-recommendation"]', elements =>
          elements.map(el => ({
            id: el.dataset.habitId,
            title: el.querySelector('[data-testid="habit-title"]')?.textContent?.trim(),
            category: el.dataset.category
          }))
        );
        
        goalRecommendations[goalId] = habits;
        
        // Go back to goal selection for next iteration
        await page.click('[data-testid="back-button"]');
        await page.waitForSelector('[data-testid="goal-selection"]');
      }
      
      // Verify each goal has different recommendations
      const betterSleepHabits = goalRecommendations.better_sleep.map(h => h.id);
      const getMovingHabits = goalRecommendations.get_moving.map(h => h.id);
      const feelBetterHabits = goalRecommendations.feel_better.map(h => h.id);
      
      // Habits should be different across goals
      const allSame = JSON.stringify(betterSleepHabits) === JSON.stringify(getMovingHabits) &&
                     JSON.stringify(getMovingHabits) === JSON.stringify(feelBetterHabits);
      
      expect(allSame).toBe(false);
      
      // Each goal should have at least one habit
      expect(betterSleepHabits.length).toBeGreaterThan(0);
      expect(getMovingHabits.length).toBeGreaterThan(0);
      expect(feelBetterHabits.length).toBeGreaterThan(0);
    });
  });

  describe('Content API Integration', () => {
    test('should load habits from content API, not legacy files', async () => {
      // Monitor network requests
      const apiRequests = [];
      page.on('request', request => {
        if (request.url().includes('localhost:3001') || request.url().includes('content-api')) {
          apiRequests.push(request.url());
        }
      });
      
      // Navigate to habits page
      await page.goto('http://localhost:3000#habits');
      await page.waitForSelector('[data-testid="habit-list"]');
      
      // Verify content API was called
      expect(apiRequests.length).toBeGreaterThan(0);
      
      // Verify habits are loaded
      const habits = await page.$$('[data-testid="habit-card"]');
      expect(habits.length).toBeGreaterThan(0);
    });

    test('should display habit effectiveness scores from content API', async () => {
      await page.goto('http://localhost:3000#habits');
      await page.waitForSelector('[data-testid="habit-card"]');
      
      // Check if effectiveness scores are displayed
      const firstHabit = await page.$('[data-testid="habit-card"]');
      const effectivenessScore = await firstHabit.$eval(
        '[data-testid="effectiveness-score"]',
        el => el.textContent
      );
      
      expect(effectivenessScore).toMatch(/\d+%/); // Should contain percentage
    });
  });

  describe('Goal Taxonomy Integration', () => {
    test('should correctly map user goals to habit recommendations', async () => {
      // Test the smart recommendations API directly
      const response = await page.evaluate(async () => {
        const { smartRecommendations } = await import('/src/services/smartRecommendations.ts');
        
        const result = await smartRecommendations.getRecommendations({
          selectedGoals: ['better_sleep', 'feel_better'],
          limit: 5
        });
        
        return result;
      });
      
      expect(response.recommendations).toBeDefined();
      expect(response.recommendations.length).toBeGreaterThan(0);
      expect(response.unmappedGoals).toEqual([]); // No unmapped goals
      expect(response.totalMatched).toBeGreaterThan(0);
    });

    test('should handle goal aliases correctly', async () => {
      const response = await page.evaluate(async () => {
        const { smartRecommendations } = await import('/src/services/smartRecommendations.ts');
        
        const result = await smartRecommendations.getRecommendations({
          selectedGoals: ['sleep', 'mood'], // Aliases for better_sleep and feel_better
          limit: 5
        });
        
        return result;
      });
      
      expect(response.recommendations.length).toBeGreaterThan(0);
      // Should successfully map aliases to official goal IDs
      expect(response.unmappedGoals.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Habit Completion Toggle', () => {
    test('should toggle habit completion state', async () => {
      await page.goto('http://localhost:3000#today');
      await page.waitForSelector('[data-testid="habit-checklist"]');
      
      const firstHabitToggle = await page.$('[data-testid="habit-toggle"]');
      if (firstHabitToggle) {
        // Get initial state
        const initialChecked = await firstHabitToggle.isChecked();
        
        // Toggle the habit
        await firstHabitToggle.click();
        
        // Verify state changed
        const newChecked = await firstHabitToggle.isChecked();
        expect(newChecked).toBe(!initialChecked);
        
        // Toggle back
        await firstHabitToggle.click();
        const finalChecked = await firstHabitToggle.isChecked();
        expect(finalChecked).toBe(initialChecked);
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should gracefully handle content API failures', async () => {
      // Block content API requests
      await page.route('**/localhost:3001/**', route => {
        route.abort();
      });
      
      await page.goto('http://localhost:3000#habits');
      
      // Should show fallback message instead of crashing
      const errorMessage = await page.$('[data-testid="content-error"]');
      const fallbackContent = await page.$('[data-testid="fallback-content"]');
      
      expect(errorMessage || fallbackContent).toBeTruthy();
    });
  });
});

module.exports = {};