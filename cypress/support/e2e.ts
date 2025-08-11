// Import Cypress commands
import './commands';

// Import accessibility testing
import 'cypress-axe';

// Import code coverage
import '@cypress/code-coverage/support';

// Global configuration
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on React hydration warnings
  if (err.message.includes('Hydration failed')) {
    return false;
  }
  if (err.message.includes('There was an error while hydrating')) {
    return false;
  }
  return true;
});

// Add custom assertions
declare global {
  namespace Cypress {
    interface Chainable {
      // Custom commands will be declared here
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>;
      completeOnboarding(options?: { goals?: string[], time?: string, lifestyle?: string }): Chainable<void>;
      addHabit(habitTitle: string): Chainable<void>;
      completeHabit(habitId: string): Chainable<void>;
      checkHabitProgress(habitId: string, expectedStreak: number): Chainable<void>;
      resetDatabase(): Chainable<void>;
      seedDatabase(data: any): Chainable<void>;
    }
  }
}

// Accessibility testing setup
beforeEach(() => {
  // Inject axe-core for accessibility testing
  cy.injectAxe();
});

// Global test data setup
beforeEach(() => {
  // Clear IndexedDB before each test
  indexedDB.deleteDatabase('ScienceHabitsDB');
  
  // Clear localStorage
  cy.clearLocalStorage();
  
  // Set consistent viewport
  cy.viewport(1280, 720);
});