// Component testing support file for Cypress
import './commands';

// Import React testing utilities
import { mount } from 'cypress/react18';

// Import accessibility testing
import 'cypress-axe';

// Import code coverage
import '@cypress/code-coverage/support';

// Add custom mount command
Cypress.Commands.add('mount', mount);

// Global configuration for component tests
beforeEach(() => {
  // Inject axe-core for accessibility testing
  cy.injectAxe();
  
  // Set consistent viewport for component tests
  cy.viewport(1280, 720);
  
  // Clear any previous test data
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
});

// Custom component test helpers
Cypress.Commands.add('mountWithProviders', (component: React.ReactElement, options = {}) => {
  const { providers = [], ...mountOptions } = options;
  
  let wrappedComponent = component;
  
  // Wrap component with any provided context providers
  providers.reverse().forEach((Provider: any) => {
    wrappedComponent = <Provider>{wrappedComponent}</Provider>;
  });
  
  return cy.mount(wrappedComponent, mountOptions);
});

// Component-specific test utilities
Cypress.Commands.add('testComponentA11y', (selector?: string) => {
  cy.checkA11y(selector, {
    tags: ['wcag2a', 'wcag2aa'],
    includedImpacts: ['minor', 'moderate', 'serious', 'critical']
  });
});

// Declare component testing types
declare global {
  namespace Cypress {
    interface Chainable {
      mount(component: React.ReactNode, options?: any): Chainable<any>;
      mountWithProviders(component: React.ReactElement, options?: any): Chainable<any>;
      testComponentA11y(selector?: string): Chainable<void>;
    }
  }
}