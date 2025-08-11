// Custom Cypress commands for ScienceHabits app

// Get element by test ID
Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`);
});

// Complete the onboarding flow
Cypress.Commands.add('completeOnboarding', (options = {}) => {
  const {
    goals = ['reduce_stress', 'improve_sleep'],
    time = '5-10 minutes',
    lifestyle = 'professional'
  } = options;

  // Start onboarding
  cy.visit('/');
  cy.getByTestId('get-started-button').should('be.visible').click();

  // Step 1: Goal selection
  goals.forEach(goal => {
    cy.getByTestId(`goal-${goal}`).click();
  });
  cy.getByTestId('continue-button').click();

  // Step 2: Time constraints
  cy.getByTestId(`time-${time.replace(' ', '-')}`).click();
  cy.getByTestId('time-morning').click();
  cy.getByTestId('continue-button').click();

  // Step 3: Lifestyle
  cy.getByTestId(`lifestyle-${lifestyle}`).click();
  cy.getByTestId('continue-button').click();

  // Wait for recommendations to load
  cy.getByTestId('habit-recommendations').should('be.visible');
});

// Add a specific habit
Cypress.Commands.add('addHabit', (habitTitle: string) => {
  cy.contains(habitTitle).should('be.visible');
  cy.contains(habitTitle).parent().find('[data-testid="add-habit-button"]').click();
  
  // Verify habit was added
  cy.getByTestId('success-message').should('contain', 'Habit added successfully');
});

// Complete a habit for today
Cypress.Commands.add('completeHabit', (habitId: string) => {
  cy.getByTestId(`habit-complete-${habitId}`).should('be.visible').click();
  
  // Wait for completion animation
  cy.getByTestId(`habit-completed-${habitId}`).should('be.visible');
  cy.getByTestId(`habit-completed-${habitId}`).should('contain', 'Done!');
});

// Check habit progress (streak)
Cypress.Commands.add('checkHabitProgress', (habitId: string, expectedStreak: number) => {
  cy.getByTestId(`habit-progress-${habitId}`)
    .should('contain', `${expectedStreak} day${expectedStreak !== 1 ? 's' : ''}`);
});

// Reset the database to clean state
Cypress.Commands.add('resetDatabase', () => {
  cy.window().then((win) => {
    // Clear IndexedDB
    const deleteReq = win.indexedDB.deleteDatabase('ScienceHabitsDB');
    deleteReq.onsuccess = () => {
      cy.log('Database cleared');
    };
    deleteReq.onerror = () => {
      cy.log('Failed to clear database');
    };
  });
  
  // Clear localStorage
  cy.clearLocalStorage();
  
  // Clear sessionStorage
  cy.clearAllSessionStorage();
});

// Seed database with test data
Cypress.Commands.add('seedDatabase', (data: any) => {
  cy.window().then((win) => {
    // Access the database through the window object
    // This would need to be implemented based on your actual database structure
    win.localStorage.setItem('test-data', JSON.stringify(data));
  });
});

// Custom command for accessibility testing
Cypress.Commands.add('checkA11y', (context?: string, options = {}) => {
  const defaultOptions = {
    tags: ['wcag2a', 'wcag2aa'],
    includedImpacts: ['minor', 'moderate', 'serious', 'critical'],
    ...options
  };
  
  cy.checkA11y(context, defaultOptions, (violations) => {
    if (violations.length) {
      cy.task('log', `${violations.length} accessibility violation(s) detected`);
      cy.task('table', violations.map(v => ({
        impact: v.impact,
        description: v.description,
        nodes: v.nodes.length,
        helpUrl: v.helpUrl
      })));
    }
  });
});

// Wait for loading to complete
Cypress.Commands.add('waitForLoadingToFinish', () => {
  cy.get('[data-testid="loading-skeleton"]').should('not.exist');
  cy.get('[data-testid="loading-spinner"]').should('not.exist');
});

// Navigate to specific tab in dashboard
Cypress.Commands.add('navigateToTab', (tabName: string) => {
  cy.getByTestId(`nav-tab-${tabName.toLowerCase()}`).click();
  cy.url().should('include', tabName.toLowerCase());
});

// Mock API responses for testing
Cypress.Commands.add('mockApiResponse', (endpoint: string, fixture: string) => {
  cy.intercept('GET', endpoint, { fixture }).as(`mock${endpoint.replace(/\//g, '')}`);
});

// Simulate offline mode
Cypress.Commands.add('goOffline', () => {
  cy.window().then((win) => {
    // Simulate navigator.onLine = false
    Object.defineProperty(win.navigator, 'onLine', {
      writable: true,
      value: false
    });
    
    // Dispatch offline event
    win.dispatchEvent(new Event('offline'));
  });
});

// Simulate online mode
Cypress.Commands.add('goOnline', () => {
  cy.window().then((win) => {
    Object.defineProperty(win.navigator, 'onLine', {
      writable: true,
      value: true
    });
    
    win.dispatchEvent(new Event('online'));
  });
});

// Test responsive design
Cypress.Commands.add('testResponsive', (sizes: string[]) => {
  sizes.forEach(size => {
    if (size === 'mobile') {
      cy.viewport(375, 667);
    } else if (size === 'tablet') {
      cy.viewport(768, 1024);
    } else if (size === 'desktop') {
      cy.viewport(1280, 720);
    }
    
    // Wait a moment for layout to adjust
    cy.wait(500);
    
    // Take screenshot for visual regression
    cy.screenshot(`responsive-${size}`);
  });
});

// Login with test user
Cypress.Commands.add('loginAsTestUser', () => {
  cy.window().then((win) => {
    win.localStorage.setItem('sciencehabits_user_id', 'test-user-123');
  });
  
  cy.reload();
  cy.waitForLoadingToFinish();
});

declare global {
  namespace Cypress {
    interface Chainable {
      checkA11y(context?: string, options?: any): Chainable<void>;
      waitForLoadingToFinish(): Chainable<void>;
      navigateToTab(tabName: string): Chainable<void>;
      mockApiResponse(endpoint: string, fixture: string): Chainable<void>;
      goOffline(): Chainable<void>;
      goOnline(): Chainable<void>;
      testResponsive(sizes: string[]): Chainable<void>;
      loginAsTestUser(): Chainable<void>;
    }
  }
}