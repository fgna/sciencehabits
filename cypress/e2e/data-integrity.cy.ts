// E2E Tests: Data Integrity Journey
// Habit creation → Progress tracking → Long-term persistence

describe('Data Integrity Journey', () => {
  beforeEach(() => {
    cy.resetDatabase();
    cy.visit('/');
  });

  describe('Habit Creation and Persistence', () => {
    it('should maintain habit data consistency across sessions', () => {
      // Complete initial setup
      cy.completeOnboarding({
        goals: ['reduce_stress', 'improve_sleep'],
        time: '10-15 minutes',
        lifestyle: 'professional'
      });
      
      // Add multiple habits
      cy.addHabit('5-Minute Breathing Exercise');
      cy.addHabit('Progressive Muscle Relaxation');
      cy.addHabit('Evening Wind-down Routine');
      
      // Verify habits are saved
      cy.navigateToTab('habits');
      cy.contains('5-Minute Breathing Exercise').should('be.visible');
      cy.contains('Progressive Muscle Relaxation').should('be.visible');
      cy.contains('Evening Wind-down Routine').should('be.visible');
      
      // Reload page to test persistence
      cy.reload();
      cy.waitForLoadingToFinish();
      
      // Verify habits persist after reload
      cy.navigateToTab('habits');
      cy.contains('5-Minute Breathing Exercise').should('be.visible');
      cy.contains('Progressive Muscle Relaxation').should('be.visible');
      cy.contains('Evening Wind-down Routine').should('be.visible');
      
      // Close and reopen browser (simulate new session)
      cy.clearAllSessionStorage(); // Clear session but keep localStorage
      cy.reload();
      cy.waitForLoadingToFinish();
      
      // Verify habits still exist
      cy.navigateToTab('habits');
      cy.get('[data-testid^="habit-card-"]').should('have.length', 3);
    });

    it('should handle concurrent habit modifications correctly', () => {
      cy.completeOnboarding();
      
      // Open multiple tabs (simulate by rapid actions)
      cy.addHabit('Morning Meditation');
      cy.addHabit('Evening Journal');
      
      // Rapidly modify habits to test race conditions
      cy.navigateToTab('habits');
      cy.getByTestId('edit-habit-habit-1').click();
      cy.getByTestId('habit-title-input').clear().type('Updated Morning Meditation');
      cy.getByTestId('save-habit-button').click();
      
      // Immediately try to delete another habit
      cy.getByTestId('delete-habit-habit-2').click();
      cy.getByTestId('confirm-delete-button').click();
      
      // Verify final state is consistent
      cy.waitForLoadingToFinish();
      cy.contains('Updated Morning Meditation').should('be.visible');
      cy.contains('Evening Journal').should('not.exist');
      cy.get('[data-testid^="habit-card-"]').should('have.length', 1);
    });

    it('should validate habit data integrity on creation', () => {
      cy.completeOnboarding();
      
      // Try to create habit with invalid data
      cy.getByTestId('add-custom-habit-button').click();
      cy.getByTestId('custom-habit-modal').should('be.visible');
      
      // Submit empty form
      cy.getByTestId('create-habit-button').click();
      cy.getByTestId('validation-error').should('contain', 'Title is required');
      
      // Try invalid time duration
      cy.getByTestId('habit-title-input').type('Test Habit');
      cy.getByTestId('habit-duration-input').type('-5');
      cy.getByTestId('create-habit-button').click();
      cy.getByTestId('validation-error').should('contain', 'Duration must be positive');
      
      // Create with valid data
      cy.getByTestId('habit-duration-input').clear().type('10');
      cy.getByTestId('habit-category-select').select('mindfulness');
      cy.getByTestId('create-habit-button').click();
      
      // Verify habit was created with correct data
      cy.getByTestId('custom-habit-modal').should('not.exist');
      cy.contains('Test Habit').should('be.visible');
    });
  });

  describe('Progress Tracking Accuracy', () => {
    beforeEach(() => {
      cy.completeOnboarding();
      cy.addHabit('Daily Meditation');
      cy.navigateToTab('today');
    });

    it('should accurately track daily completions and streaks', () => {
      // Complete habit today
      cy.completeHabit('habit-1');
      
      // Verify completion is recorded
      cy.getByTestId('habit-completed-habit-1').should('be.visible');
      cy.checkHabitProgress('habit-1', 1);
      
      // Simulate next day
      cy.window().then((win) => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        win.localStorage.setItem('mock_current_date', tomorrow.toISOString());
      });
      
      cy.reload();
      cy.waitForLoadingToFinish();
      
      // Complete habit on day 2
      cy.completeHabit('habit-1');
      cy.checkHabitProgress('habit-1', 2);
      
      // Simulate day 3 - skip completion
      cy.window().then((win) => {
        const dayAfterTomorrow = new Date();
        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
        win.localStorage.setItem('mock_current_date', dayAfterTomorrow.toISOString());
      });
      
      cy.reload();
      cy.waitForLoadingToFinish();
      
      // Verify streak was reset due to missed day
      cy.checkHabitProgress('habit-1', 0);
      
      // Complete on day 4
      cy.completeHabit('habit-1');
      cy.checkHabitProgress('habit-1', 1); // New streak starts
    });

    it('should prevent duplicate completions for the same day', () => {
      // Complete habit
      cy.completeHabit('habit-1');
      cy.getByTestId('habit-completed-habit-1').should('be.visible');
      
      // Try to complete again (button should be disabled/hidden)
      cy.getByTestId('habit-complete-habit-1').should('not.exist');
      
      // Verify progress hasn't changed
      cy.navigateToTab('progress');
      cy.getByTestId('today-completions').should('contain', '1');
      
      // Reload and verify consistency
      cy.reload();
      cy.waitForLoadingToFinish();
      cy.getByTestId('today-completions').should('contain', '1');
    });

    it('should maintain progress accuracy during rapid interactions', () => {
      // Add multiple habits for testing
      cy.addHabit('Morning Exercise');
      cy.addHabit('Evening Reading');
      
      cy.navigateToTab('today');
      
      // Rapidly complete multiple habits
      cy.completeHabit('habit-1');
      cy.completeHabit('habit-2');
      cy.completeHabit('habit-3');
      
      // Verify all completions registered correctly
      cy.getByTestId('completion-percentage').should('contain', '100%');
      cy.getByTestId('completion-summary').should('contain', '3 of 3 completed');
      
      // Navigate to progress and verify detailed stats
      cy.navigateToTab('progress');
      cy.getByTestId('today-completions').should('contain', '3');
      cy.getByTestId('completion-rate').should('contain', '100%');
    });

    it('should handle timezone changes correctly', () => {
      // Complete habit in current timezone
      cy.completeHabit('habit-1');
      cy.checkHabitProgress('habit-1', 1);
      
      // Simulate timezone change (e.g., traveling)
      cy.window().then((win) => {
        // Mock timezone offset change
        const originalOffset = new Date().getTimezoneOffset();
        const newOffset = originalOffset + 360; // 6 hours difference
        
        // Override Date methods to simulate timezone change
        const OriginalDate = Date;
        win.Date = function(...args) {
          const date = new OriginalDate(...args);
          if (args.length === 0) {
            // Adjust current time for new timezone
            date.setTime(date.getTime() + (newOffset - originalOffset) * 60000);
          }
          return date;
        };
      });
      
      cy.reload();
      cy.waitForLoadingToFinish();
      
      // Verify completion is still recorded for the correct day
      cy.getByTestId('habit-completed-habit-1').should('be.visible');
      cy.checkHabitProgress('habit-1', 1);
    });
  });

  describe('Long-term Data Persistence', () => {
    it('should maintain data integrity over extended periods', () => {
      cy.completeOnboarding();
      cy.addHabit('Long-term Tracking Test');
      
      // Simulate 30 days of varied completion patterns
      const completionPattern = [
        true, true, false, true, true, true, false, // Week 1: 5/7
        true, false, true, true, true, false, true, // Week 2: 5/7
        true, true, true, false, true, true, true,  // Week 3: 6/7
        false, true, true, true, false, true, true, // Week 4: 5/7
        true, true // Days 29-30
      ];
      
      completionPattern.forEach((shouldComplete, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index - 29); // Start 29 days ago
        
        cy.window().then((win) => {
          win.localStorage.setItem('mock_current_date', date.toISOString());
        });
        
        cy.reload();
        cy.waitForLoadingToFinish();
        
        if (shouldComplete) {
          cy.completeHabit('habit-1');
        }
      });
      
      // Reset to current date
      cy.window().then((win) => {
        win.localStorage.removeItem('mock_current_date');
      });
      
      cy.reload();
      cy.waitForLoadingToFinish();
      
      // Verify long-term statistics
      cy.navigateToTab('progress');
      
      const expectedCompletions = completionPattern.filter(Boolean).length;
      cy.getByTestId('total-completions').should('contain', expectedCompletions.toString());
      
      // Check that streak calculations are accurate
      const lastFiveDays = completionPattern.slice(-5);
      const currentStreak = lastFiveDays.reverse().findIndex(completed => !completed);
      const expectedStreak = currentStreak === -1 ? 5 : currentStreak;
      
      cy.checkHabitProgress('habit-1', expectedStreak);
    });

    it('should handle large datasets efficiently', () => {
      cy.completeOnboarding();
      
      // Create many habits to test performance with large datasets
      const habitCount = 20;
      for (let i = 1; i <= habitCount; i++) {
        cy.addHabit(`Performance Test Habit ${i}`);
      }
      
      // Generate extensive progress data
      cy.window().then((win) => {
        const progressData = [];
        for (let habitId = 1; habitId <= habitCount; habitId++) {
          const completions = [];
          for (let day = 0; day < 100; day++) {
            if (Math.random() > 0.3) { // 70% completion rate
              const date = new Date();
              date.setDate(date.getDate() - day);
              completions.push(date.toISOString().split('T')[0]);
            }
          }
          progressData.push({
            habitId: `habit-${habitId}`,
            completions,
            currentStreak: Math.floor(Math.random() * 10),
            longestStreak: Math.floor(Math.random() * 30),
            totalDays: completions.length
          });
        }
        
        win.localStorage.setItem('mock_progress_data', JSON.stringify(progressData));
      });
      
      cy.reload();
      
      // Measure load time
      const startTime = Date.now();
      cy.waitForLoadingToFinish().then(() => {
        const loadTime = Date.now() - startTime;
        expect(loadTime).to.be.lessThan(3000); // Should load within 3 seconds
      });
      
      // Verify data loads correctly
      cy.navigateToTab('habits');
      cy.get('[data-testid^="habit-card-"]').should('have.length', habitCount);
      
      // Test navigation performance
      cy.navigateToTab('progress');
      cy.getByTestId('progress-dashboard').should('be.visible');
      
      // Verify statistics are calculated correctly
      cy.getByTestId('active-habits-count').should('contain', habitCount.toString());
    });

    it('should recover from data corruption gracefully', () => {
      cy.completeOnboarding();
      cy.addHabit('Corruption Test Habit');
      cy.completeHabit('habit-1');
      
      // Simulate data corruption
      cy.window().then((win) => {
        // Corrupt localStorage data
        win.localStorage.setItem('sciencehabits_progress', 'corrupted-data-{invalid-json}');
      });
      
      cy.reload();
      
      // Should show error recovery UI
      cy.getByTestId('data-recovery-banner').should('be.visible');
      cy.contains('Data corruption detected').should('be.visible');
      
      // Click recover data
      cy.getByTestId('recover-data-button').click();
      
      // Should attempt to restore from backup or reset gracefully
      cy.getByTestId('recovery-success-message').should('be.visible');
      
      // Should still be functional
      cy.getByTestId('get-started-button').should('be.visible');
    });

    it('should maintain referential integrity between related data', () => {
      cy.completeOnboarding();
      cy.addHabit('Referential Test Habit');
      cy.completeHabit('habit-1');
      
      // Navigate to progress to establish relationships
      cy.navigateToTab('progress');
      cy.getByTestId('habit-progress-habit-1').should('be.visible');
      
      // Delete the habit
      cy.navigateToTab('habits');
      cy.getByTestId('delete-habit-habit-1').click();
      cy.getByTestId('confirm-delete-button').click();
      
      // Verify related progress data is cleaned up
      cy.navigateToTab('progress');
      cy.getByTestId('no-progress-message').should('be.visible');
      
      // Verify no orphaned data remains
      cy.window().then((win) => {
        const progressData = JSON.parse(win.localStorage.getItem('sciencehabits_progress') || '[]');
        const orphanedProgress = progressData.find(p => p.habitId === 'habit-1');
        expect(orphanedProgress).to.be.undefined;
      });
    });
  });

  describe('Backup and Export Functionality', () => {
    beforeEach(() => {
      cy.completeOnboarding();
      // Set up premium user for export features
      cy.window().then((win) => {
        win.localStorage.setItem('premium_status', JSON.stringify({
          active: true,
          plan: 'premium'
        }));
      });
    });

    it('should create accurate data backups', () => {
      // Create test data
      cy.addHabit('Backup Test Habit 1');
      cy.addHabit('Backup Test Habit 2');
      cy.completeHabit('habit-1');
      
      // Navigate to export
      cy.navigateToTab('progress');
      cy.getByTestId('export-data-button').click();
      cy.getByTestId('create-backup-button').click();
      
      // Verify backup was created
      cy.getByTestId('backup-success-message').should('be.visible');
      cy.getByTestId('backup-download-link').should('be.visible');
      
      // Simulate data loss
      cy.resetDatabase();
      cy.visit('/');
      
      // Should be back to onboarding
      cy.getByTestId('get-started-button').should('be.visible');
      
      // Restore from backup
      cy.getByTestId('restore-data-link').click();
      cy.getByTestId('backup-file-input').selectFile('cypress/fixtures/test-backup.json');
      cy.getByTestId('restore-backup-button').click();
      
      // Verify data was restored
      cy.getByTestId('restore-success-message').should('be.visible');
      cy.waitForLoadingToFinish();
      
      // Check restored data
      cy.navigateToTab('habits');
      cy.contains('Backup Test Habit 1').should('be.visible');
      cy.contains('Backup Test Habit 2').should('be.visible');
      
      cy.navigateToTab('today');
      cy.getByTestId('habit-completed-habit-1').should('be.visible');
    });

    it('should export data in multiple formats accurately', () => {
      // Create diverse test data
      cy.addHabit('Export Test Habit');
      cy.completeHabit('habit-1');
      
      // Add some progress history
      cy.window().then((win) => {
        const progressData = [{
          habitId: 'habit-1',
          completions: ['2023-01-10', '2023-01-11', '2023-01-13'],
          currentStreak: 1,
          longestStreak: 2,
          totalDays: 3
        }];
        win.localStorage.setItem('mock_export_data', JSON.stringify(progressData));
      });
      
      cy.navigateToTab('progress');
      cy.getByTestId('export-data-button').click();
      
      // Test CSV export
      cy.getByTestId('export-csv').click();
      cy.getByTestId('export-success-message').should('be.visible');
      
      // Verify CSV download
      cy.readFile('cypress/downloads/sciencehabits-export.csv').should('contain', 'Export Test Habit');
      
      // Test PDF export
      cy.getByTestId('export-pdf-report').click();
      cy.getByTestId('pdf-generation-progress').should('be.visible');
      cy.getByTestId('pdf-export-success').should('be.visible');
      
      // Verify PDF was generated
      cy.task('fileExists', 'cypress/downloads/sciencehabits-report.pdf').should('be.true');
    });
  });

  describe('Cross-Device Synchronization', () => {
    it('should maintain data consistency across different devices', () => {
      // Simulate Device 1
      cy.completeOnboarding();
      cy.addHabit('Sync Test Habit');
      cy.completeHabit('habit-1');
      
      // Simulate sync to cloud (mock)
      cy.getByTestId('sync-button').click();
      cy.getByTestId('sync-success-message').should('contain', 'Data synced');
      
      // Simulate Device 2 - clear local data
      cy.resetDatabase();
      cy.visit('/');
      
      // Sign in to same account
      cy.loginAsTestUser();
      
      // Should sync data from cloud
      cy.getByTestId('sync-in-progress').should('be.visible');
      cy.waitForLoadingToFinish();
      
      // Verify data was synced
      cy.navigateToTab('habits');
      cy.contains('Sync Test Habit').should('be.visible');
      
      cy.navigateToTab('today');
      cy.getByTestId('habit-completed-habit-1').should('be.visible');
    });

    it('should handle sync conflicts intelligently', () => {
      // Setup initial data
      cy.completeOnboarding();
      cy.addHabit('Conflict Test Habit');
      
      // Simulate Device 1 changes
      cy.completeHabit('habit-1');
      cy.getByTestId('edit-habit-habit-1').click();
      cy.getByTestId('habit-title-input').clear().type('Modified on Device 1');
      cy.getByTestId('save-habit-button').click();
      
      // Simulate Device 2 changes (mock conflicting data)
      cy.window().then((win) => {
        const conflictData = {
          habits: [{
            id: 'habit-1',
            title: 'Modified on Device 2',
            lastModified: new Date().toISOString()
          }],
          progress: [{
            habitId: 'habit-1',
            completions: ['2023-01-15'],
            lastModified: new Date(Date.now() - 60000).toISOString() // 1 minute ago
          }]
        };
        win.localStorage.setItem('sync_conflict_data', JSON.stringify(conflictData));
      });
      
      // Trigger sync
      cy.getByTestId('sync-button').click();
      
      // Should show conflict resolution UI
      cy.getByTestId('sync-conflict-modal').should('be.visible');
      cy.contains('Sync conflicts detected').should('be.visible');
      
      // Should show both versions
      cy.getByTestId('local-version').should('contain', 'Modified on Device 1');
      cy.getByTestId('remote-version').should('contain', 'Modified on Device 2');
      
      // Choose local version
      cy.getByTestId('keep-local-button').click();
      cy.getByTestId('resolve-conflicts-button').click();
      
      // Verify resolution
      cy.getByTestId('sync-success-message').should('be.visible');
      cy.contains('Modified on Device 1').should('be.visible');
    });
  });
});