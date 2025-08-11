// E2E Tests: Premium Feature Journey
// Free user → Trial activation → Premium features → Upgrade

describe('Premium Features Journey', () => {
  beforeEach(() => {
    cy.resetDatabase();
    cy.visit('/');
  });

  describe('Free User Experience', () => {
    beforeEach(() => {
      // Set up free user
      cy.completeOnboarding();
      cy.addHabit('5-Minute Breathing Exercise');
      cy.addHabit('Morning Stretches');
    });

    it('should show free tier limitations', () => {
      // Navigate to habits
      cy.navigateToTab('habits');
      
      // Should show habit limit indicator
      cy.getByTestId('habit-limit-indicator').should('contain', '2 of 3 habits');
      
      // Try to add more than 3 habits
      cy.getByTestId('add-habit-button').click();
      cy.addHabit('Evening Walk');
      
      // Should show upgrade prompt when trying to add 4th habit
      cy.addHabit('Reading Time');
      cy.getByTestId('upgrade-prompt').should('be.visible');
      cy.getByTestId('upgrade-prompt').should('contain', 'Upgrade to add unlimited habits');
    });

    it('should show premium features as locked', () => {
      // Navigate to progress
      cy.navigateToTab('progress');
      
      // Advanced analytics should be locked
      cy.getByTestId('advanced-analytics').should('have.class', 'locked');
      cy.getByTestId('premium-badge').should('be.visible');
      
      // Try to access locked feature
      cy.getByTestId('advanced-analytics').click();
      cy.getByTestId('premium-upsell-modal').should('be.visible');
    });

    it('should display premium content teasers in research', () => {
      cy.navigateToTab('research');
      
      // Should show some free articles
      cy.get('[data-testid^="article-free-"]').should('have.length.greaterThan', 0);
      
      // Should show premium article teasers
      cy.get('[data-testid^="article-premium-"]').should('have.length.greaterThan', 0);
      cy.getByTestId('premium-content-overlay').should('be.visible');
      
      // Click on premium article
      cy.get('[data-testid^="article-premium-"]').first().click();
      cy.getByTestId('premium-article-modal').should('be.visible');
      cy.contains('Unlock premium content').should('be.visible');
    });
  });

  describe('Trial Activation', () => {
    beforeEach(() => {
      cy.completeOnboarding();
    });

    it('should allow users to start premium trial', () => {
      // Navigate to progress to see premium features
      cy.navigateToTab('progress');
      
      // Click on locked premium feature
      cy.getByTestId('advanced-analytics').click();
      cy.getByTestId('premium-upsell-modal').should('be.visible');
      
      // Start trial
      cy.getByTestId('start-trial-button').click();
      
      // Should show trial confirmation
      cy.getByTestId('trial-confirmation-modal').should('be.visible');
      cy.contains('7-day free trial activated').should('be.visible');
      
      // Close modal
      cy.getByTestId('close-modal-button').click();
      
      // Should now show trial indicator in header
      cy.getByTestId('trial-indicator').should('be.visible');
      cy.getByTestId('trial-indicator').should('contain', 'Trial: 6 days left');
    });

    it('should unlock premium features during trial', () => {
      // Activate trial
      cy.window().then((win) => {
        win.localStorage.setItem('premium_trial', JSON.stringify({
          active: true,
          startDate: new Date().toISOString(),
          daysLeft: 7
        }));
      });
      
      cy.reload();
      cy.navigateToTab('progress');
      
      // Advanced analytics should now be unlocked
      cy.getByTestId('advanced-analytics').should('not.have.class', 'locked');
      cy.getByTestId('advanced-analytics').click();
      
      // Should show advanced analytics content
      cy.getByTestId('habit-trends-chart').should('be.visible');
      cy.getByTestId('weekly-insights').should('be.visible');
      cy.getByTestId('performance-metrics').should('be.visible');
    });

    it('should show trial expiration warnings', () => {
      // Set trial to expire in 1 day
      cy.window().then((win) => {
        win.localStorage.setItem('premium_trial', JSON.stringify({
          active: true,
          startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          daysLeft: 1
        }));
      });
      
      cy.reload();
      
      // Should show expiration warning
      cy.getByTestId('trial-expiration-banner').should('be.visible');
      cy.contains('Trial expires in 1 day').should('be.visible');
      cy.getByTestId('upgrade-now-button').should('be.visible');
    });
  });

  describe('Premium Features Access', () => {
    beforeEach(() => {
      // Set up premium user
      cy.completeOnboarding();
      cy.window().then((win) => {
        win.localStorage.setItem('premium_status', JSON.stringify({
          active: true,
          plan: 'premium',
          subscriptionId: 'test-sub-123'
        }));
      });
      cy.reload();
    });

    it('should provide unlimited habit creation', () => {
      cy.navigateToTab('habits');
      
      // Should not show habit limits
      cy.getByTestId('habit-limit-indicator').should('not.exist');
      
      // Should be able to add many habits
      for (let i = 0; i < 10; i++) {
        cy.addHabit(`Test Habit ${i + 1}`);
      }
      
      // Should show all habits without restrictions
      cy.get('[data-testid^="habit-card-"]').should('have.length', 10);
    });

    it('should show advanced analytics', () => {
      // Add some habits and progress
      cy.addHabit('5-Minute Breathing Exercise');
      cy.completeHabit('habit-1');
      
      cy.navigateToTab('progress');
      
      // Should show premium analytics features
      cy.getByTestId('habit-trends-chart').should('be.visible');
      cy.getByTestId('weekly-insights').should('be.visible');
      cy.getByTestId('performance-metrics').should('be.visible');
      cy.getByTestId('streak-calendar').should('be.visible');
      
      // Should show detailed statistics
      cy.contains('Weekly completion rate').should('be.visible');
      cy.contains('Best performing habits').should('be.visible');
      cy.contains('Suggested improvements').should('be.visible');
    });

    it('should unlock premium research content', () => {
      cy.navigateToTab('research');
      
      // Should show all premium articles
      cy.get('[data-testid^="article-premium-"]').should('have.length.greaterThan', 0);
      cy.getByTestId('premium-content-overlay').should('not.exist');
      
      // Should be able to access premium articles
      cy.get('[data-testid^="article-premium-"]').first().click();
      cy.getByTestId('article-content').should('be.visible');
      cy.contains('Premium insight').should('be.visible');
    });

    it('should show premium customization options', () => {
      cy.navigateToTab('habits');
      
      // Should show premium customization features
      cy.getByTestId('habit-card-habit-1').within(() => {
        cy.getByTestId('customize-button').should('be.visible');
      });
      
      cy.getByTestId('customize-button').click();
      
      // Should show premium customization modal
      cy.getByTestId('habit-customization-modal').should('be.visible');
      cy.getByTestId('custom-reminder-time').should('be.visible');
      cy.getByTestId('custom-difficulty-adjustment').should('be.visible');
      cy.getByTestId('personal-notes-section').should('be.visible');
    });

    it('should provide data export functionality', () => {
      cy.navigateToTab('progress');
      
      // Should show export options
      cy.getByTestId('export-data-button').should('be.visible');
      cy.getByTestId('export-data-button').click();
      
      // Should show export modal
      cy.getByTestId('export-options-modal').should('be.visible');
      cy.getByTestId('export-csv').should('be.visible');
      cy.getByTestId('export-pdf-report').should('be.visible');
      
      // Test CSV export
      cy.getByTestId('export-csv').click();
      cy.getByTestId('export-success-message').should('contain', 'Data exported successfully');
    });
  });

  describe('Upgrade Flow', () => {
    beforeEach(() => {
      cy.completeOnboarding();
    });

    it('should handle upgrade from free to premium', () => {
      // Try to access premium feature
      cy.navigateToTab('progress');
      cy.getByTestId('advanced-analytics').click();
      
      // Click upgrade button
      cy.getByTestId('upgrade-to-premium-button').click();
      
      // Should show pricing modal
      cy.getByTestId('pricing-modal').should('be.visible');
      cy.contains('Choose your plan').should('be.visible');
      
      // Should show plan options
      cy.getByTestId('monthly-plan').should('be.visible');
      cy.getByTestId('yearly-plan').should('be.visible');
      
      // Select monthly plan
      cy.getByTestId('select-monthly-plan').click();
      
      // Should show payment form (mocked)
      cy.getByTestId('payment-form').should('be.visible');
      cy.getByTestId('card-number-input').type('4242424242424242');
      cy.getByTestId('expiry-input').type('12/25');
      cy.getByTestId('cvc-input').type('123');
      
      // Submit payment
      cy.getByTestId('submit-payment-button').click();
      
      // Should show success message
      cy.getByTestId('upgrade-success-modal').should('be.visible');
      cy.contains('Welcome to Premium!').should('be.visible');
      
      // Should now have premium features
      cy.getByTestId('premium-badge').should('be.visible');
    });

    it('should handle trial-to-premium conversion', () => {
      // Set up expiring trial
      cy.window().then((win) => {
        win.localStorage.setItem('premium_trial', JSON.stringify({
          active: true,
          startDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          daysLeft: 1
        }));
      });
      
      cy.reload();
      
      // Should show trial expiration banner
      cy.getByTestId('trial-expiration-banner').should('be.visible');
      cy.getByTestId('upgrade-now-button').click();
      
      // Should show special trial conversion pricing
      cy.getByTestId('trial-conversion-modal').should('be.visible');
      cy.contains('Continue your premium experience').should('be.visible');
      cy.getByTestId('trial-discount-badge').should('contain', '20% off');
      
      // Complete upgrade
      cy.getByTestId('convert-trial-button').click();
      cy.getByTestId('payment-form').should('be.visible');
      
      // Mock successful payment
      cy.getByTestId('card-number-input').type('4242424242424242');
      cy.getByTestId('submit-payment-button').click();
      
      // Should maintain premium features seamlessly
      cy.getByTestId('conversion-success-message').should('be.visible');
      cy.navigateToTab('progress');
      cy.getByTestId('advanced-analytics').should('be.visible');
    });

    it('should handle payment failures gracefully', () => {
      cy.navigateToTab('progress');
      cy.getByTestId('advanced-analytics').click();
      cy.getByTestId('upgrade-to-premium-button').click();
      
      // Select plan
      cy.getByTestId('select-monthly-plan').click();
      
      // Enter invalid card details
      cy.getByTestId('card-number-input').type('4000000000000002'); // Declined card
      cy.getByTestId('expiry-input').type('12/25');
      cy.getByTestId('cvc-input').type('123');
      
      // Submit payment
      cy.getByTestId('submit-payment-button').click();
      
      // Should show error message
      cy.getByTestId('payment-error-message').should('contain', 'Payment failed');
      cy.getByTestId('try-again-button').should('be.visible');
      
      // Should remain on payment form
      cy.getByTestId('payment-form').should('be.visible');
    });
  });

  describe('Subscription Management', () => {
    beforeEach(() => {
      // Set up premium user
      cy.completeOnboarding();
      cy.window().then((win) => {
        win.localStorage.setItem('premium_status', JSON.stringify({
          active: true,
          plan: 'premium',
          subscriptionId: 'test-sub-123',
          nextBillingDate: '2023-02-15'
        }));
      });
      cy.reload();
    });

    it('should show subscription details in settings', () => {
      // Navigate to user menu/settings
      cy.getByTestId('user-menu-button').click();
      cy.getByTestId('settings-link').click();
      
      // Should show subscription section
      cy.getByTestId('subscription-section').should('be.visible');
      cy.contains('Premium Plan').should('be.visible');
      cy.contains('Next billing: February 15, 2023').should('be.visible');
      
      // Should show manage subscription button
      cy.getByTestId('manage-subscription-button').should('be.visible');
    });

    it('should allow subscription cancellation', () => {
      cy.getByTestId('user-menu-button').click();
      cy.getByTestId('settings-link').click();
      
      // Click manage subscription
      cy.getByTestId('manage-subscription-button').click();
      cy.getByTestId('subscription-management-modal').should('be.visible');
      
      // Click cancel subscription
      cy.getByTestId('cancel-subscription-button').click();
      
      // Should show cancellation confirmation
      cy.getByTestId('cancellation-confirmation-modal').should('be.visible');
      cy.contains('Are you sure you want to cancel?').should('be.visible');
      
      // Confirm cancellation
      cy.getByTestId('confirm-cancellation-button').click();
      
      // Should show cancellation success
      cy.getByTestId('cancellation-success-message').should('be.visible');
      cy.contains('Subscription cancelled').should('be.visible');
      
      // Should still have access until billing period ends
      cy.getByTestId('access-until-message').should('contain', 'February 15, 2023');
    });

    it('should handle billing issues', () => {
      // Simulate failed payment
      cy.window().then((win) => {
        win.localStorage.setItem('premium_status', JSON.stringify({
          active: true,
          plan: 'premium',
          subscriptionId: 'test-sub-123',
          status: 'past_due'
        }));
      });
      
      cy.reload();
      
      // Should show billing alert
      cy.getByTestId('billing-alert-banner').should('be.visible');
      cy.contains('Payment method needs updating').should('be.visible');
      
      // Click update payment method
      cy.getByTestId('update-payment-button').click();
      
      // Should show payment update form
      cy.getByTestId('payment-update-modal').should('be.visible');
      cy.getByTestId('new-card-form').should('be.visible');
      
      // Update payment method
      cy.getByTestId('new-card-number').type('4242424242424242');
      cy.getByTestId('new-expiry').type('12/26');
      cy.getByTestId('new-cvc').type('123');
      cy.getByTestId('update-payment-submit').click();
      
      // Should show success and remove banner
      cy.getByTestId('payment-updated-message').should('be.visible');
      cy.getByTestId('billing-alert-banner').should('not.exist');
    });
  });
});