// E2E Tests: Complete User Journey
// First-time user → Onboarding → Habit selection → Daily use

describe('Complete User Journey', () => {
  beforeEach(() => {
    // Reset database before each test
    cy.resetDatabase();
    cy.visit('/');
  });

  describe('First-Time User Onboarding', () => {
    it('should complete the full onboarding flow and start using habits', () => {
      // Step 1: Landing page - First-time user sees welcome screen
      cy.get('h1').should('contain', 'ScienceHabits');
      cy.getByTestId('get-started-button').should('be.visible');
      
      // Step 2: Start onboarding
      cy.getByTestId('get-started-button').click();
      cy.url().should('include', '/onboarding');
      
      // Step 3: Goal Selection
      cy.get('h2').should('contain', 'What are your wellness goals?');
      cy.getByTestId('goal-reduce_stress').should('be.visible').click();
      cy.getByTestId('goal-improve_sleep').should('be.visible').click();
      
      // Verify selections are highlighted
      cy.getByTestId('goal-reduce_stress').should('have.class', 'selected');
      cy.getByTestId('goal-improve_sleep').should('have.class', 'selected');
      
      cy.getByTestId('continue-button').should('be.enabled').click();
      
      // Step 4: Time Constraints
      cy.get('h2').should('contain', 'How much time can you commit?');
      cy.getByTestId('time-5-10-minutes').click();
      cy.getByTestId('time-morning').click();
      cy.getByTestId('continue-button').click();
      
      // Step 5: Lifestyle Assessment
      cy.get('h2').should('contain', 'What describes your lifestyle?');
      cy.getByTestId('lifestyle-professional').click();
      cy.getByTestId('continue-button').click();
      
      // Step 6: Habit Recommendations
      cy.waitForLoadingToFinish();
      cy.get('h2').should('contain', 'Recommended habits for you');
      
      // Should show habits matching selected goals and time constraints
      cy.getByTestId('habit-recommendations').should('be.visible');
      cy.get('[data-testid^="habit-card-"]').should('have.length.greaterThan', 0);
      
      // Add a few recommended habits
      cy.addHabit('5-Minute Breathing Exercise');
      cy.addHabit('Progressive Muscle Relaxation');
      
      // Complete onboarding
      cy.getByTestId('finish-onboarding-button').click();
      
      // Step 7: Redirect to Today view with new habits
      cy.url().should('include', '/today');
      cy.waitForLoadingToFinish();
      
      // Verify habits appear in Today view
      cy.get('h1').should('contain', 'Good');
      cy.getByTestId('habit-checklist').should('be.visible');
      cy.contains('5-Minute Breathing Exercise').should('be.visible');
      cy.contains('Progressive Muscle Relaxation').should('be.visible');
    });
    
    it('should handle incomplete onboarding gracefully', () => {
      // Start onboarding but don't complete it
      cy.getByTestId('get-started-button').click();
      
      // Try to skip goal selection without selecting any goals
      cy.getByTestId('continue-button').should('be.disabled');
      
      // Select one goal
      cy.getByTestId('goal-reduce_stress').click();
      cy.getByTestId('continue-button').should('be.enabled');
      
      // Go to next step but navigate away
      cy.getByTestId('continue-button').click();
      cy.visit('/');
      
      // Should be redirected back to onboarding
      cy.url().should('include', '/onboarding');
    });
  });

  describe('Daily Habit Usage', () => {
    beforeEach(() => {
      // Complete onboarding and set up test user with habits
      cy.completeOnboarding({
        goals: ['reduce_stress', 'improve_sleep'],
        time: '5-10 minutes',
        lifestyle: 'professional'
      });
      
      // Add some habits for testing
      cy.addHabit('5-Minute Breathing Exercise');
      cy.addHabit('Evening Wind-down Routine');
      
      // Navigate to today view
      cy.navigateToTab('today');
    });

    it('should allow user to complete habits and track progress', () => {
      // Verify habits are displayed
      cy.contains('5-Minute Breathing Exercise').should('be.visible');
      cy.contains('Evening Wind-down Routine').should('be.visible');
      
      // Check initial completion percentage
      cy.getByTestId('completion-percentage').should('contain', '0%');
      cy.getByTestId('completion-summary').should('contain', '0 of 2 completed');
      
      // Complete first habit
      cy.completeHabit('habit-1');
      
      // Verify progress updated
      cy.getByTestId('completion-percentage').should('contain', '50%');
      cy.getByTestId('completion-summary').should('contain', '1 of 2 completed');
      
      // Check habit shows as completed
      cy.getByTestId('habit-completed-habit-1').should('be.visible');
      cy.getByTestId('habit-completed-habit-1').should('contain', 'Done!');
      
      // Complete second habit
      cy.completeHabit('habit-2');
      
      // Verify all habits completed
      cy.getByTestId('completion-percentage').should('contain', '100%');
      cy.getByTestId('completion-summary').should('contain', '2 of 2 completed');
      
      // Should show celebration message
      cy.contains('All done!').should('be.visible');
      cy.getByTestId('celebration-animation').should('be.visible');
    });

    it('should show habit instructions when requested', () => {
      // Expand instructions for first habit
      cy.getByTestId('instructions-toggle-habit-1').click();
      
      // Verify instructions are shown
      cy.getByTestId('habit-instructions-habit-1').should('be.visible');
      cy.contains('How to do this habit:').should('be.visible');
      
      // Collapse instructions
      cy.getByTestId('instructions-toggle-habit-1').click();
      cy.getByTestId('habit-instructions-habit-1').should('not.be.visible');
    });

    it('should show habit details and research when requested', () => {
      // Expand details for first habit
      cy.getByTestId('details-toggle-habit-1').click();
      
      // Verify details are shown
      cy.getByTestId('habit-details-habit-1').should('be.visible');
      cy.contains('Why this works').should('be.visible');
      
      // Should show research links if available
      cy.get('[data-testid="research-links"] a').should('have.length.greaterThan', 0);
    });
  });

  describe('Multi-Day Progress Tracking', () => {
    beforeEach(() => {
      // Set up user with habits and some historical progress
      cy.completeOnboarding();
      cy.addHabit('5-Minute Breathing Exercise');
      
      // Seed some historical data
      cy.seedDatabase({
        progress: [
          {
            habitId: 'habit-1',
            completions: ['2023-01-13', '2023-01-14'],
            currentStreak: 2,
            longestStreak: 4,
            totalDays: 8
          }
        ]
      });
      
      cy.navigateToTab('today');
    });

    it('should maintain streak when completing habits on consecutive days', () => {
      // Check current streak
      cy.checkHabitProgress('habit-1', 2);
      
      // Complete habit today
      cy.completeHabit('habit-1');
      
      // Verify streak increased
      cy.checkHabitProgress('habit-1', 3);
      
      // Navigate to My Habits to see detailed progress
      cy.navigateToTab('habits');
      
      // Verify progress stats
      cy.getByTestId('habit-stats-habit-1').should('contain', 'Current streak: 3 days');
      cy.getByTestId('habit-stats-habit-1').should('contain', 'Longest streak: 4 days');
      cy.getByTestId('habit-stats-habit-1').should('contain', 'Total completed: 9 days');
    });

    it('should handle habit completion persistence across page reloads', () => {
      // Complete a habit
      cy.completeHabit('habit-1');
      
      // Reload the page
      cy.reload();
      cy.waitForLoadingToFinish();
      
      // Verify completion is still there
      cy.getByTestId('habit-completed-habit-1').should('be.visible');
      cy.getByTestId('completion-percentage').should('contain', '100%');
    });
  });

  describe('Navigation and Tab Switching', () => {
    beforeEach(() => {
      cy.completeOnboarding();
      cy.addHabit('5-Minute Breathing Exercise');
    });

    it('should navigate between all main tabs successfully', () => {
      // Start on Today tab
      cy.url().should('include', '/today');
      cy.get('h1').should('contain', 'Good');
      
      // Navigate to My Habits
      cy.navigateToTab('habits');
      cy.get('h1').should('contain', 'My Habits');
      cy.contains('5-Minute Breathing Exercise').should('be.visible');
      
      // Navigate to Research
      cy.navigateToTab('research');
      cy.get('h1').should('contain', 'Research');
      cy.getByTestId('research-articles').should('be.visible');
      
      // Navigate to Progress
      cy.navigateToTab('progress');
      cy.get('h1').should('contain', 'Progress');
      cy.getByTestId('progress-dashboard').should('be.visible');
      
      // Navigate back to Today
      cy.navigateToTab('today');
      cy.get('h1').should('contain', 'Good');
    });
  });

  describe('Error Handling and Resilience', () => {
    it('should handle network failures gracefully', () => {
      // Complete onboarding
      cy.completeOnboarding();
      
      // Simulate going offline
      cy.goOffline();
      
      // Try to complete a habit while offline
      cy.addHabit('5-Minute Breathing Exercise');
      cy.completeHabit('habit-1');
      
      // Should show offline indicator
      cy.getByTestId('offline-indicator').should('be.visible');
      
      // Go back online
      cy.goOnline();
      
      // Should sync and hide offline indicator
      cy.getByTestId('offline-indicator').should('not.exist');
      
      // Habit completion should be preserved
      cy.getByTestId('habit-completed-habit-1').should('be.visible');
    });

    it('should recover from database errors', () => {
      // Mock a database error scenario
      cy.window().then((win) => {
        // Simulate IndexedDB quota exceeded
        win.localStorage.setItem('simulate_db_error', 'quota_exceeded');
      });
      
      cy.visit('/');
      
      // Should show error message
      cy.getByTestId('error-message').should('contain', 'Storage limit reached');
      
      // Should provide recovery option
      cy.getByTestId('clear-data-button').click();
      
      // Should recover and allow normal usage
      cy.getByTestId('get-started-button').should('be.visible');
    });
  });

  describe('Responsive Design', () => {
    it('should work correctly on mobile devices', () => {
      cy.completeOnboarding();
      cy.addHabit('5-Minute Breathing Exercise');
      
      // Test mobile viewport
      cy.testResponsive(['mobile']);
      
      // Verify mobile-specific UI elements
      cy.getByTestId('mobile-menu-button').should('be.visible');
      cy.get('.desktop-only').should('not.be.visible');
      
      // Test habit completion on mobile
      cy.completeHabit('habit-1');
      cy.getByTestId('habit-completed-habit-1').should('be.visible');
    });

    it('should work correctly on tablet devices', () => {
      cy.completeOnboarding();
      cy.addHabit('5-Minute Breathing Exercise');
      
      // Test tablet viewport
      cy.testResponsive(['tablet']);
      
      // Verify tablet layout
      cy.getByTestId('tablet-layout').should('be.visible');
      cy.completeHabit('habit-1');
      cy.getByTestId('habit-completed-habit-1').should('be.visible');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      cy.completeOnboarding();
      cy.addHabit('5-Minute Breathing Exercise');
    });

    it('should be fully accessible throughout the user journey', () => {
      // Check Today view accessibility
      cy.checkA11y();
      
      // Navigate to other views and check accessibility
      cy.navigateToTab('habits');
      cy.checkA11y();
      
      cy.navigateToTab('research');
      cy.checkA11y();
      
      cy.navigateToTab('progress');
      cy.checkA11y();
    });

    it('should support keyboard navigation', () => {
      // Test tab navigation
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-testid', 'habit-complete-habit-1');
      
      // Test enter key to complete habit
      cy.focused().type('{enter}');
      cy.getByTestId('habit-completed-habit-1').should('be.visible');
    });
  });
});