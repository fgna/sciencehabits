// Basic smoke test to verify Cypress is working
describe('Smoke Tests', () => {
  it('should load the application', () => {
    // Visit the app
    cy.visit('http://localhost:3000');
    
    // Check that the page loads
    cy.get('body').should('be.visible');
    
    // Check for React app root
    cy.get('#root').should('exist');
  });

  it('should have a working title', () => {
    cy.visit('http://localhost:3000');
    
    // Check page title
    cy.title().should('not.be.empty');
  });

  it('should handle 404 pages gracefully', () => {
    cy.visit('http://localhost:3000/non-existent-page', { failOnStatusCode: false });
    
    // Should still show some content, not a blank page
    cy.get('body').should('not.be.empty');
  });
});